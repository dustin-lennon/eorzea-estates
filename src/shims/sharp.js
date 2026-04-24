// Cloudflare Workers cannot run sharp (native binary).
// Next.js skips image optimization when sharp is unavailable.
module.exports = null
