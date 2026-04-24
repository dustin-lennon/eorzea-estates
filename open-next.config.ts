import { defineCloudflareConfig } from "@opennextjs/cloudflare"

const config = defineCloudflareConfig()

// esbuild resolves pg-cloudflare with the "default" condition → dist/empty.js (stub).
// The patch script (patch-cf-externals.mjs step 3g) then copies our fixed
// CloudflareSocket shim as dist/index.js before wrangler deploys, so wrangler
// picks up the real socket implementation when it bundles pg at deploy time.
config.cloudflare = { useWorkerdCondition: false }

export default config
