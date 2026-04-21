/**
 * Local preview wrapper that sets up Hyperdrive simulation for the full
 * build → patch → preview pipeline.
 *
 * Reads DATABASE_URL from .dev.vars and sets
 * CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE so that:
 *   - `next build` (via initOpenNextCloudflareForDev) finds the Hyperdrive URL
 *   - `wrangler dev` creates the local Hyperdrive TCP proxy
 *
 * Usage: replace `opennextjs-cloudflare preview` with this script.
 */

import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
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

const vars = readDevVars()
const databaseUrl = vars.DATABASE_URL
if (!databaseUrl) {
  console.error("[preview-local] DATABASE_URL not found in .dev.vars")
  process.exit(1)
}

console.log("[preview-local] Setting up Hyperdrive local connection string")

const env = {
  ...process.env,
  // Wrangler 4.x / miniflare: set local Hyperdrive connection string by env var.
  // Pattern: CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_{BINDING_NAME}
  CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: databaseUrl,
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
run("pnpm", ["exec", "opennextjs-cloudflare", "preview"])
