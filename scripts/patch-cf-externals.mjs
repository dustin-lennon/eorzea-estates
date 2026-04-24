/**
 * Post-build patch for Cloudflare Workers + OpenNext + Turbopack.
 *
 * Patch 1 — Turbopack externalImport hash IDs:
 *   Turbopack externalizes some packages (e.g. `pg`) via an `externalImport(id)`
 *   function inside handler.mjs. The `id` is a Turbopack hash like "pg-63e85fc611dc39f8"
 *   that is NOT a real module path. At runtime in Cloudflare Workers, `await import(id)`
 *   fails with "No such module".
 *
 *   Fix: scan the Turbopack chunks to find all hashed externalImport IDs, extract the
 *   real package name from the hash prefix, then patch handler.mjs to add explicit import
 *   cases. Wrangler's esbuild then bundles those packages from node_modules.
 *
 *   Hash format: "{package-name}-{16-hex}" or "{@scope/name}-{16-hex}" or
 *                "{package-name}-{16-hex}/{path/to/file.mjs}"
 *
 * Patch 2 — @protobufjs/inquire eval:
 *   @protobufjs/inquire uses eval("quire".replace(/^/,"re")) to call require() in a way
 *   that bypasses static analysis. Cloudflare Workers disallow eval entirely, causing
 *   wrangler to refuse to bundle/start the worker. Since inquire() is only used for
 *   optional module detection (returns null on failure), replacing it with a stub that
 *   always returns null is safe and equivalent behavior in the CF Workers environment.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")

// ── 1. Scan Turbopack chunk files for externalImport hash IDs ───────────────

const chunksDir = path.join(projectRoot, ".next", "server", "chunks")
const hashSet = new Set()

function scanDir(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      scanDir(full)
    } else if (entry.name.endsWith(".js")) {
      const content = fs.readFileSync(full, "utf-8")
      // a.y("hash") is the Turbopack externalImport call pattern
      for (const m of content.matchAll(/a\.y\(["']([^"']+)["']\)/g)) {
        hashSet.add(m[1])
      }
    }
  }
}

scanDir(chunksDir)

if (hashSet.size === 0) {
  console.log("[patch-cf-externals] No externalImport hashes found — skipping hash patches.")
}

// ── 2. Map each hash to a real import specifier ──────────────────────────────

// Regex: optional @scope/, package name (no /), then -<16 hex>, then optional /path
const HASH_RE = /^(@[^/]+\/[^/]+|[^@/][^/]*)-([0-9a-f]{16})(\/.*)?$/

function hashToSpecifier(hashId) {
  const m = hashId.match(HASH_RE)
  if (!m) return null
  const pkg = m[1]   // e.g. "pg" or "@prisma/client"
  const rest = m[3] ?? ""  // e.g. "/runtime/foo.mjs" or ""
  return pkg + rest  // real npm specifier
}

const patches = []
for (const hashId of hashSet) {
  const specifier = hashToSpecifier(hashId)
  if (!specifier) {
    console.log(`[patch-cf-externals] Cannot extract package from: ${hashId}`)
    continue
  }

  // Verify the package (or file) exists in node_modules before patching
  const pkgName = specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0]
  const pkgDir = path.join(projectRoot, "node_modules", pkgName)
  if (!fs.existsSync(pkgDir)) {
    console.log(`[patch-cf-externals] Package not found, skipping: ${pkgName}`)
    continue
  }

  patches.push({ hashId, specifier })
}

if (patches.length === 0) {
  console.log("[patch-cf-externals] No patchable hashes found — skipping hash patches.")
}

console.log("[patch-cf-externals] Patches to apply:")
for (const { hashId, specifier } of patches) {
  console.log(`  ${hashId}  →  import("${specifier}")`)
}

// ── 3. Patch handler.mjs ─────────────────────────────────────────────────────

const handlerPath = path.join(
  projectRoot,
  ".open-next",
  "server-functions",
  "default",
  "handler.mjs"
)

if (!fs.existsSync(handlerPath)) {
  console.error("[patch-cf-externals] handler.mjs not found:", handlerPath)
  process.exit(1)
}

let handler = fs.readFileSync(handlerPath, "utf-8")
let patched = false

// ── 3a. Hash → specifier patches ────────────────────────────────────────────

if (patches.length > 0) {
  // handler.mjs has TWO separate externalImport() functions (two Turbopack chunk
  // contexts). Both have the OG case. We must patch ALL occurrences.
  // The patch is idempotent: skip any hashId already present before the og anchor.
  //
  // OpenNext now emits switch/case format:
  //   switch(id){case"next/dist/compiled/@vercel/og/index.node.js":raw2=...;break;...}
  // We insert new case statements immediately before the OG case anchor.

  const OG_ANCHOR = 'case"next/dist/compiled/@vercel/og/index.node.js"'

  if (!handler.includes(OG_ANCHOR)) {
    console.error("[patch-cf-externals] Could not find og anchor in handler.mjs")
    process.exit(1)
  }

  let ogCount = 0
  handler = handler.replaceAll(OG_ANCHOR, (match) => {
    ogCount++
    let extraCases = ""
    for (const { hashId, specifier } of patches) {
      // Idempotency: skip if this hash already has a case anywhere in the handler
      // (OpenNext may emit its own cases for pg, @prisma/client, etc.)
      if (handler.includes(`case"${hashId}"`)) continue
      extraCases += `case"${hashId}":raw2=await import("${specifier}");break;`
    }
    return extraCases + match
  })
  console.log(`[patch-cf-externals] Hash patches applied to ${ogCount} externalImport function(s).`)
  patched = true
}

// ── 3b. @protobufjs/inquire eval shim ───────────────────────────────────────
// eval() is disallowed in Cloudflare Workers. @protobufjs/inquire uses
// eval("quire".replace(/^/,"re")) to call require() for optional detection.
// Replacing the function body with `return null` is safe — it's the same
// result as when the eval throws (which is caught and returns null anyway).

const INQUIRE_EVAL =
  `eval("quire".replace(/^/,"re"))(moduleName);if(mod&&(mod.length||Object.keys(mod).length))return mod}catch(e){}return null}`

const INQUIRE_STUB =
  `(()=>{throw new Error("inquire: eval shimmed for CF Workers")})(moduleName)}catch(e){}return null}`

if (handler.includes(INQUIRE_EVAL)) {
  handler = handler.replace(INQUIRE_EVAL, INQUIRE_STUB)
  console.log("[patch-cf-externals] @protobufjs/inquire eval shimmed.")
  patched = true
} else {
  console.log("[patch-cf-externals] @protobufjs/inquire eval pattern not found — already patched or not present.")
}

// ── 3c. clipboardy arch detection execSync shim ──────────────────────────────
// @xivapi/nodestone → regex-translator → clipboardy → arch detection calls
// child_process.execSync("getconf LONG_BIT") on linux (which CF Workers reports
// as its platform). Cloudflare Workers is always x64 linux; return directly.

const ARCH_EXEC_LINUX =
  `if(process.platform==="linux"){var output=cp.execSync("getconf LONG_BIT",{encoding:"utf8"});return output===\`64\n\`?"x64":"x86"}`

const ARCH_EXEC_STUB =
  `if(process.platform==="linux"){return"x64"}`

if (handler.includes(ARCH_EXEC_LINUX)) {
  handler = handler.replace(ARCH_EXEC_LINUX, ARCH_EXEC_STUB)
  console.log("[patch-cf-externals] clipboardy arch execSync shimmed.")
  patched = true
} else {
  console.log("[patch-cf-externals] clipboardy arch execSync pattern not found — already patched or not present.")
}

// ── 3d. Prisma WASM query compiler — static import shim ─────────────────────
// CF Workers blocks new WebAssembly.Module(bytes) (dynamic compilation).
// Prisma 7 generated client calls decodeBase64AsWasm() → new WebAssembly.Module()
// for its WASM query compiler. Fix: extract the WASM bytes from the base64 bundle,
// write a real .wasm file alongside handler.mjs, prepend a static import, and
// replace every decodeBase64AsWasm() return with the statically-imported module.
//
// Pattern to replace (minified, two occurrences — one per Turbopack context):
//   ,XX=Buffer.from(YY,"base64");return new WebAssembly.Module(XX)}
// Replace with:
//   ;return __prismaQueryCompilerWasm}
//
// The static import is prepended to the top of handler.mjs so wrangler's esbuild
// resolves it using the [[rules]] CompiledWasm type in wrangler.toml.

const WASM_STATIC_IMPORT = `import __prismaQueryCompilerWasm from "./prisma-query-compiler.wasm";\n`
const WASM_DECODE_RE = /,\w+=\w+\.from\(\w+,"base64"\);return new WebAssembly\.Module\(\w+\)\}/g

const wasmDecodeMatches = handler.match(WASM_DECODE_RE)
if (wasmDecodeMatches && wasmDecodeMatches.length > 0) {
  // Extract WASM bytes from the base64 source in node_modules
  const wasmBase64ModulePath = path.join(
    projectRoot,
    "node_modules",
    "@prisma",
    "client",
    "runtime",
    "query_compiler_fast_bg.postgresql.wasm-base64.mjs"
  )
  if (!fs.existsSync(wasmBase64ModulePath)) {
    console.error("[patch-cf-externals] Prisma WASM base64 source not found:", wasmBase64ModulePath)
    process.exit(1)
  }

  // Read the base64 string — file starts with: const wasm = "AGFz..."
  const wasmBase64Src = fs.readFileSync(wasmBase64ModulePath, "utf-8")
  const wasmBase64Match = wasmBase64Src.match(/^(?:export\s+)?const\s+wasm\s*=\s*["']([A-Za-z0-9+/=]+)["']/)
  if (!wasmBase64Match) {
    console.error("[patch-cf-externals] Could not extract base64 wasm string from:", wasmBase64ModulePath)
    process.exit(1)
  }
  const wasmBytes = Buffer.from(wasmBase64Match[1], "base64")
  const wasmOutPath = path.join(
    projectRoot,
    ".open-next",
    "server-functions",
    "default",
    "prisma-query-compiler.wasm"
  )
  fs.writeFileSync(wasmOutPath, wasmBytes)
  console.log(`[patch-cf-externals] Prisma WASM written (${wasmBytes.length} bytes): ${wasmOutPath}`)

  // Prepend static import (idempotent)
  if (!handler.startsWith(WASM_STATIC_IMPORT)) {
    handler = WASM_STATIC_IMPORT + handler
  }

  // Replace all occurrences of the base64-decode+WebAssembly.Module pattern
  handler = handler.replace(WASM_DECODE_RE, ";return __prismaQueryCompilerWasm}")
  console.log(`[patch-cf-externals] Prisma WASM decodeBase64AsWasm shimmed (${wasmDecodeMatches.length} occurrence(s)).`)
  patched = true
} else {
  console.log("[patch-cf-externals] Prisma WASM decode pattern not found — already patched or not present.")
}

// ── 3e. @cf-wasm/photon WASM static import shim ─────────────────────────────
// Turbopack bundles @cf-wasm/photon using the Node.js export condition, which
// inlines the WASM bytes as base64 and compiles them with new WebAssembly.Module()
// at startup. CF Workers block dynamic WebAssembly compilation.
//
// Fix: copy the photon .wasm file alongside handler.mjs, prepend a static import,
// and replace the var q=Uint8Array.from(atob(...)).buffer,d=new WebAssembly.Module(q);r.sync({module:d})
// pattern with a direct r.sync({module: __photonWasm}) call.

const PHOTON_WASM_IMPORT = `import __photonWasm from "./photon.wasm";\n`
const PHOTON_WASM_RE = /var q=Uint8Array\.from\(atob\("[A-Za-z0-9+/=]+"\),\w+=>\w+\.charCodeAt\(0\)\)\.buffer,\w+=new WebAssembly\.Module\(q\);(\w+)\.sync\(\{module:\w+\}\)/

const photonWasmMatch = handler.match(PHOTON_WASM_RE)
if (photonWasmMatch) {
  const syncVar = photonWasmMatch[1]
  const photonWasmSrc = path.join(
    projectRoot,
    "node_modules",
    "@cf-wasm",
    "photon",
    "dist",
    "lib",
    "photon_rs_bg.wasm"
  )
  if (!fs.existsSync(photonWasmSrc)) {
    console.error("[patch-cf-externals] photon WASM not found:", photonWasmSrc)
    process.exit(1)
  }
  const photonWasmDest = path.join(
    projectRoot,
    ".open-next",
    "server-functions",
    "default",
    "photon.wasm"
  )
  fs.copyFileSync(photonWasmSrc, photonWasmDest)
  console.log(`[patch-cf-externals] photon WASM written (${fs.statSync(photonWasmDest).size} bytes): ${photonWasmDest}`)

  if (!handler.includes(PHOTON_WASM_IMPORT)) {
    handler = PHOTON_WASM_IMPORT + handler
  }
  handler = handler.replace(PHOTON_WASM_RE, `${syncVar}.sync({module:__photonWasm})`)
  console.log("[patch-cf-externals] photon WASM static import shimmed.")
  patched = true
} else {
  console.log("[patch-cf-externals] photon WASM pattern not found — already patched or not present.")
}

// ── 3g. pg-cloudflare fixed shim ─────────────────────────────────────────────
// OpenNext only copies dist/empty.js from pg-cloudflare into .open-next.
// The "workerd" export condition maps require('pg-cloudflare') → dist/index.js,
// but that file is absent in the output, so pg falls back to the empty stub.
//
// wrangler [alias] cannot fix this: pg is externalized via dynamic import()
// by Turbopack, so esbuild alias only applies to statically bundled code.
//
// Fix: copy our fixed shim (src/shims/pg-cloudflare-fixed.js) as dist/index.js
// into every pg-cloudflare location inside .open-next. The shim is identical to
// the upstream CloudflareSocket except _listen() emits 'end' when done=true,
// preventing zombie connections when Supabase closes an idle TLS session.

const openNextNodeModules = path.join(
  projectRoot,
  ".open-next",
  "server-functions",
  "default",
  "node_modules"
)

// Source: fixed pg-cloudflare shim (emits 'end' on stream close to prevent zombies)
// The real upstream pg-cloudflare's _listen() silently breaks when done=true,
// leaving pg Pool holding zombie connections that hang on next use.
const pgCfFixedShim = path.join(projectRoot, "src", "shims", "pg-cloudflare-fixed.js")

if (!fs.existsSync(pgCfFixedShim)) {
  console.error("[patch-cf-externals] pg-cloudflare fixed shim not found:", pgCfFixedShim)
  process.exit(1)
}

// Find all pg-cloudflare directories in the output node_modules (may appear at
// top-level and inside .pnpm/ hoisted paths)
function findPgCloudflareDirs(baseDir) {
  const results = []
  if (!fs.existsSync(baseDir)) return results

  function walk(dir, depth) {
    if (depth > 6) return
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const full = path.join(dir, entry.name)
      if (entry.name === "pg-cloudflare") {
        results.push(full)
      } else {
        walk(full, depth + 1)
      }
    }
  }
  walk(baseDir, 0)
  return results
}

const pgCfDirs = findPgCloudflareDirs(openNextNodeModules)
if (pgCfDirs.length === 0) {
  console.log("[patch-cf-externals] No pg-cloudflare directories found in .open-next — skipping.")
} else {
  for (const dir of pgCfDirs) {
    const destDist = path.join(dir, "dist")
    fs.mkdirSync(destDist, { recursive: true })
    fs.copyFileSync(pgCfFixedShim, path.join(destDist, "index.js"))
    console.log(`[patch-cf-externals] pg-cloudflare fixed shim copied → ${path.relative(projectRoot, dir)}`)
  }
}

// ── 3h. axios fetch shim ──────────────────────────────────────────────────────
// @xivapi/nodestone uses axios.get() to fetch Lodestone HTML pages.
// axios uses Node.js http/https modules which don't work in CF Workers.
// wrangler [alias] cannot fix this because @xivapi/nodestone is externalized.
//
// Turbopack's nft.json traces nodestone's dependencies from the PROJECT ROOT
// node_modules (not .open-next), so the worker loads the real axios from
// node_modules/.pnpm/axios@0.21.4/... at runtime. We must patch both:
//   1. The project root copy (used at wrangler dev runtime via nft.json tracing)
//   2. The .open-next copy (belt-and-suspenders for any other resolution path)

const axiosShim = path.join(projectRoot, "src", "shims", "axios.js")

if (!fs.existsSync(axiosShim)) {
  console.error("[patch-cf-externals] axios shim not found:", axiosShim)
  process.exit(1)
}

function findAxisDirs(baseDir) {
  const results = []
  if (!fs.existsSync(baseDir)) return results
  function walk(dir, depth) {
    if (depth > 6) return
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const full = path.join(dir, entry.name)
      if (entry.name === "axios") {
        results.push(full)
      } else {
        walk(full, depth + 1)
      }
    }
  }
  walk(baseDir, 0)
  return results
}

// Patch project root node_modules (runtime path via nft.json tracing)
const projectNodeModules = path.join(projectRoot, "node_modules")
const rootAxisDirs = findAxisDirs(projectNodeModules)
if (rootAxisDirs.length === 0) {
  console.log("[patch-cf-externals] No axios directories found in project node_modules — skipping.")
} else {
  for (const dir of rootAxisDirs) {
    const destIndex = path.join(dir, "index.js")
    fs.copyFileSync(axiosShim, destIndex)
    console.log(`[patch-cf-externals] axios fetch shim copied → ${path.relative(projectRoot, dir)}`)
  }
}

// Patch .open-next node_modules (belt-and-suspenders)
const axisDirs = findAxisDirs(openNextNodeModules)
if (axisDirs.length === 0) {
  console.log("[patch-cf-externals] No axios directories found in .open-next — skipping.")
} else {
  for (const dir of axisDirs) {
    const destIndex = path.join(dir, "index.js")
    fs.copyFileSync(axiosShim, destIndex)
    console.log(`[patch-cf-externals] axios fetch shim copied → ${path.relative(projectRoot, dir)}`)
  }
}

// ── 4. Write patched handler ─────────────────────────────────────────────────

if (patched) {
  fs.writeFileSync(handlerPath, handler)
  console.log("[patch-cf-externals] handler.mjs written.")
} else {
  console.log("[patch-cf-externals] No patches applied.")
}

// ── 5. Add scheduled handler to worker.js ────────────────────────────────────
//
// CF Workers cron triggers fire a `scheduled` event, not an HTTP request.
// OpenNext only exports a `fetch` handler. We patch worker.js to inject a
// `scheduled` export that calls the cron API route via self-fetch with the
// CRON_SECRET auth header.

const workerPath = path.join(projectRoot, ".open-next", "worker.js")
const workerSrc = fs.readFileSync(workerPath, "utf8")

if (workerSrc.includes("export const scheduled")) {
  console.log("[patch-cf-externals] scheduled handler already present — skipping.")
} else {
  // Find the closing `};` of `export default { ... };` and insert scheduled after it
  const lastBrace = workerSrc.lastIndexOf("};")
  if (lastBrace === -1) {
    console.error("[patch-cf-externals] Could not find end of worker.js default export — scheduled handler NOT added.")
  } else {
    // Instead of patching worker.js (which is re-exported), append a separate scheduled export
    // by writing a wrapper worker entry that re-exports default + adds scheduled.
    const scheduledShim = `
// Generated by patch-cf-externals: re-export worker.js default + add scheduled handler.
export * from "./worker-original.js"
export { default } from "./worker-original.js"

export const scheduled = async (event, env, ctx) => {
  const secret = env.CRON_SECRET ?? ""
  const baseUrl = env.BETTER_AUTH_URL ?? "http://localhost:8787"
  try {
    const res = await fetch(\`\${baseUrl}/api/cron/verify-fc-estates\`, {
      headers: { Authorization: \`Bearer \${secret}\` },
    })
    if (!res.ok) {
      console.error("[cron] verify-fc-estates failed:", res.status)
    } else {
      const result = await res.json()
      console.log("[cron] verify-fc-estates result:", JSON.stringify(result))
    }
  } catch (err) {
    console.error("[cron] verify-fc-estates error:", err)
  }
}
`.trimStart()

    // Rename original worker.js → worker-original.js, write wrapper as worker.js
    const workerOriginalPath = path.join(projectRoot, ".open-next", "worker-original.js")
    fs.renameSync(workerPath, workerOriginalPath)
    fs.writeFileSync(workerPath, scheduledShim)
    console.log("[patch-cf-externals] scheduled handler injected into worker.js")
  }
}
