/**
 * Pre-build script for Cloudflare Workers + OpenNext.
 *
 * Problem: pg@8.22.0 may appear as a ghost package in node_modules/.pnpm/
 * (from a prior lockfile state). When opennextjs-cloudflare traces and copies
 * packages into .open-next, it picks up pg@8.22.0 and its pg-cloudflare peer.
 * opennext copies only the "node" condition export (dist/empty.js) from
 * pg-cloudflare, but esbuild resolves with the "workerd" condition (dist/index.js),
 * which is absent → "Could not resolve pg-cloudflare".
 *
 * Fix: before opennext runs, copy the fixed pg-cloudflare shim as dist/index.js
 * into every pg-cloudflare directory in project node_modules. nft then traces and
 * copies the complete package into .open-next, so esbuild can resolve it.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")

const shim = path.join(projectRoot, "src", "shims", "pg-cloudflare-fixed.js")
if (!fs.existsSync(shim)) {
  console.error("[pre-build-cf] pg-cloudflare fixed shim not found:", shim)
  process.exit(1)
}

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

const dirs = findPgCloudflareDirs(path.join(projectRoot, "node_modules"))
if (dirs.length === 0) {
  console.log("[pre-build-cf] No pg-cloudflare directories found — skipping.")
} else {
  for (const dir of dirs) {
    const dist = path.join(dir, "dist")
    fs.mkdirSync(dist, { recursive: true })
    fs.copyFileSync(shim, path.join(dist, "index.js"))
    console.log(`[pre-build-cf] shim copied → ${path.relative(projectRoot, dir)}`)
  }
}
