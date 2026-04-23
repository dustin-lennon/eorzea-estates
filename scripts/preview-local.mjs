/**
 * Local preview wrapper that sets up Hyperdrive simulation for the full
 * build → patch → preview pipeline.
 *
 * Starts a Node.js TLS proxy that does STARTTLS to Supabase using real node:tls
 * (not cloudflare:sockets, which can't verify Let's Encrypt in miniflare).
 * Hyperdrive is pointed at the proxy (plain TCP, no SSL from the worker side),
 * so prisma.ts can use ssl:false on the Hyperdrive path in both local and production.
 *
 * Usage: replace `opennextjs-cloudflare preview` with this script.
 */

import fs from "node:fs"
import net from "node:net"
import tls from "node:tls"
import path from "node:path"
import { spawnSync, spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")

function readDevVars() {
  const devVarsPath = path.join(projectRoot, ".dev.vars")
  if (!fs.existsSync(devVarsPath)) {
    throw new Error(".dev.vars not found — copy .dev.vars.example and fill in values")
  }
  const content = fs.readFileSync(devVarsPath, "utf-8")
  const vars = {}
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    // Strip surrounding single or double quotes (shell-style .env values)
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

/**
 * Starts a plain-TCP → TLS proxy for Postgres.
 *
 * For each incoming connection the proxy:
 *   1. Responds 'N' if the pg client sends an SSLRequest (no SSL on local side).
 *   2. Opens a plain TCP socket to the remote host:port.
 *   3. Sends SSLRequest to the remote server and upgrades to TLS using node:tls.
 *   4. Pipes all subsequent pg protocol traffic through the TLS connection.
 *
 * This lets pg inside miniflare connect without SSL while the proxy handles the
 * TLS session to Supabase using real Node.js TLS (no cloudflare:sockets quirks).
 */
function startPostgresTlsProxy(remoteHost, remotePort) {
  const SSL_REQUEST = Buffer.from([0, 0, 0, 8, 4, 210, 22, 47])

  return new Promise((resolve, reject) => {
    const server = net.createServer((client) => {
      let targetTls = null
      const pendingClientData = []
      let tlsReady = false

      client.on("data", (data) => {
        // If pg sends SSLRequest (8 bytes, magic = 0x04D2162F), respond 'N' —
        // no SSL between pg and the proxy; proxy handles TLS to Supabase.
        if (
          !tlsReady &&
          data.length === 8 &&
          data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 8 &&
          data[4] === 4 && data[5] === 210 && data[6] === 22 && data[7] === 47
        ) {
          client.write("N")
          return
        }
        if (tlsReady) {
          targetTls.write(data)
        } else {
          pendingClientData.push(data)
        }
      })
      client.on("error", () => targetTls?.destroy())
      client.on("close", () => targetTls?.destroy())

      // Open raw TCP to remote, do STARTTLS, then become a transparent pipe.
      const rawSocket = net.createConnection({ host: remoteHost, port: remotePort })
      rawSocket.once("connect", () => {
        // Initiate SSL negotiation with the remote Postgres / pgbouncer.
        rawSocket.write(SSL_REQUEST)
        rawSocket.once("data", (resp) => {
          if (resp[0] !== 0x53) { // 'S' = SSL supported
            console.error("[tls-proxy] Remote server rejected SSL request")
            client.destroy()
            rawSocket.destroy()
            return
          }
          // Upgrade the raw socket to TLS (real node:tls — no miniflare restrictions).
          const tlsSock = tls.connect({ socket: rawSocket, rejectUnauthorized: false })
          tlsSock.once("secureConnect", () => {
            targetTls = tlsSock
            tlsReady = true
            // Flush any startup data the pg client already sent.
            for (const chunk of pendingClientData) tlsSock.write(chunk)
            pendingClientData.length = 0
            tlsSock.on("data", (d) => client.write(d))
            tlsSock.on("error", () => client.destroy())
            tlsSock.on("close", () => client.destroy())
          })
          tlsSock.on("error", (e) => {
            console.error("[tls-proxy] TLS error:", e.message)
            client.destroy()
          })
        })
      })
      rawSocket.on("error", (e) => {
        console.error("[tls-proxy] Remote connection error:", e.message)
        client.destroy()
      })
    })

    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address()
      console.log(
        `[preview-local] TLS proxy 127.0.0.1:${port} → ${remoteHost}:${remotePort}`
      )
      resolve({ server, port })
    })
    server.on("error", reject)
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

const vars = readDevVars()

// Use DIRECT_URL (port 5432, direct Postgres) as the proxy backend to avoid
// pgbouncer quirks in local dev. Fall back to DATABASE_URL if not set.
const backendBase = vars.DIRECT_URL ?? vars.DATABASE_URL
if (!backendBase) {
  console.error("[preview-local] Neither DIRECT_URL nor DATABASE_URL found in .dev.vars")
  process.exit(1)
}
const backendUrl = new URL(backendBase)
const remoteHost = backendUrl.hostname
const remotePort = parseInt(backendUrl.port || "5432", 10)

const { port: proxyPort } = await startPostgresTlsProxy(remoteHost, remotePort)

// Build a plain (no-SSL) connection string pointing at the local proxy.
// This is what miniflare's Hyperdrive will proxy to; credentials are preserved
// so pg startup messages reach Supabase transparently through the TLS proxy.
const proxyUrl = new URL(backendBase)
proxyUrl.hostname = "127.0.0.1"
proxyUrl.port = String(proxyPort)
proxyUrl.searchParams.delete("sslmode")
proxyUrl.searchParams.delete("pgbouncer")

const env = {
  ...process.env,
  // Wrangler 4.x / miniflare: set local Hyperdrive connection string by env var.
  // Pattern: CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_{BINDING_NAME}
  CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: proxyUrl.toString(),
}

function run(cmd, args) {
  console.log(`[preview-local] $ ${cmd} ${args.join(" ")}`)
  const result = spawnSync(cmd, args, { stdio: "inherit", cwd: projectRoot, env })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

// 1. Build
run("pnpm", ["exec", "opennextjs-cloudflare", "build"])

// 2. Apply CF-specific patches to the built worker
run("node", ["scripts/patch-cf-externals.mjs"])

// 3. Start wrangler dev preview
// Use spawn() (async), NOT spawnSync(), so the Node.js event loop stays alive
// and the TLS proxy server above can continue accepting connections from miniflare.
// spawnSync would block the event loop and starve the proxy.
//
// Run wrangler dev directly (bypassing opennextjs-cloudflare preview) to avoid
// the populateCache step which writes files after wrangler's file-watcher is set
// up, triggering a hot-reload that fails because .build/durable-objects/ isn't
// on esbuild's module search path during the reload rebuild.
console.log("[preview-local] $ pnpm exec wrangler dev --config wrangler.toml")
const wranglerProc = spawn(
  "pnpm",
  ["exec", "wrangler", "dev", "--config", "wrangler.toml"],
  { stdio: "inherit", cwd: projectRoot, env }
)
wranglerProc.on("exit", (code) => process.exit(code ?? 1))
