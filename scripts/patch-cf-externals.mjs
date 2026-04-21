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
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")
const require = createRequire(import.meta.url)

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
  // contexts). Both have the OG ternary case. We must patch ALL occurrences.
  // The patch is idempotent: skip any hashId already present before the og anchor.

  const OG_ANCHOR = 'id==="next/dist/compiled/@vercel/og/index.node.js"'

  if (!handler.includes(OG_ANCHOR)) {
    console.error("[patch-cf-externals] Could not find og anchor in handler.mjs")
    process.exit(1)
  }

  let ogCount = 0
  // replaceAll with a function so we can handle each occurrence independently
  handler = handler.replaceAll(OG_ANCHOR, (match, offset) => {
    ogCount++
    // Extract the raw variable name from context just before this occurrence
    const before = handler.slice(Math.max(0, offset - 50), offset)
    const rawVarMatch = before.match(/([a-z]\w*)\s*=\s*$/) ||
                        handler.slice(offset).match(/\?(raw2|[a-z]\w*)=await/)
    const rawVar = rawVarMatch ? rawVarMatch[1] : "raw2"

    let extraCases = ""
    for (const { hashId, specifier } of patches) {
      // Skip if already patched in this function (idempotency)
      // Look back up to 500 chars for an existing case for this hash
      const lookback = handler.slice(Math.max(0, offset - 500), offset)
      if (lookback.includes(`id==="${hashId}"`)) continue
      extraCases += `id==="${hashId}"?${rawVar}=await import("${specifier}"):`
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

// ── 4. Write patched handler ─────────────────────────────────────────────────

if (patched) {
  fs.writeFileSync(handlerPath, handler)
  console.log("[patch-cf-externals] handler.mjs written.")
} else {
  console.log("[patch-cf-externals] No patches applied.")
}
