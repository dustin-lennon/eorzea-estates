/**
 * Test the AI verification screenshot analysis.
 *
 * Usage:
 *   pnpm test:verify --type PRIVATE --character "Firstname Lastname" --image "https://..."
 *
 * Options:
 *   --type       Estate type: PRIVATE | FC_ESTATE | APARTMENT | FC_ROOM | VENUE (default: PRIVATE)
 *   --character  Character name that should appear as owner/occupant
 *   --image      Public URL of the screenshot to analyse
 *   --district   Housing district (optional, e.g. MIST)
 *   --ward       Ward number (optional)
 *   --plot       Plot number (optional)
 *   --room       Room number (optional, for APARTMENT/FC_ROOM)
 *   --fc-name    Free Company name (optional, for FC_ESTATE — verifies the Estate Profile Owner matches)
 *   --gateway    Test via Vercel AI Gateway (requires VERCEL_OIDC_TOKEN — run `vercel env pull` first)
 *
 * Examples:
 *   # Test with direct Anthropic API (.env)
 *   pnpm test:verify --type PRIVATE --character "Ada Lovelace" --image "https://example.com/screenshot.png"
 *
 *   # Test via Vercel AI Gateway (run `vercel env pull` first to get VERCEL_OIDC_TOKEN)
 *   pnpm test:verify --gateway --type PRIVATE --character "Ada Lovelace" --image "https://example.com/screenshot.png"
 */

const args = process.argv.slice(2)

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 ? args[idx + 1] : undefined
}

const useGateway = args.includes("--gateway")

import { config } from "dotenv"
import { resolve } from "path"

const envFile = useGateway ? ".env.gateway" : ".env"
// Load .env.local first so VERCEL_OIDC_TOKEN (from `vercel env pull`) is available,
// then override with the chosen env file.
config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), envFile) })

console.log(`\nLoading env from: ${envFile}`)
if (process.env.VERCEL_AI_GATEWAY_URL) {
  console.log(`VERCEL_AI_GATEWAY_URL: ${process.env.VERCEL_AI_GATEWAY_URL}`)
  console.log(`VERCEL_OIDC_TOKEN: ${process.env.VERCEL_OIDC_TOKEN ? "set ✓" : "NOT SET ✗ — run: vercel env pull"}`)
} else {
  console.log(`VERCEL_AI_GATEWAY_URL: (not set — using direct Anthropic API)`)
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "set ✓" : "NOT SET ✗"}`)
}

import { analyzeVerificationScreenshot } from "../src/lib/ai-verification"

const imageUrl = getArg("image")
if (!imageUrl) {
  console.error("\nError: --image is required\n")
  process.exit(1)
}

const estateType = getArg("type") ?? "PRIVATE"
const characterName = getArg("character") ?? ""
const district = getArg("district") ?? null
const ward = getArg("ward") ? parseInt(getArg("ward")!) : null
const plot = getArg("plot") ? parseInt(getArg("plot")!) : null
const room = getArg("room") ? parseInt(getArg("room")!) : null
const fcName = getArg("fc-name") ?? null

console.log("\n--- Input ---")
console.log(`Type:      ${estateType}`)
console.log(`Character: ${characterName || "(not provided)"}`)
console.log(`FC Name:   ${fcName ?? "—"}`)
console.log(`Image:     ${imageUrl}`)
console.log(`District:  ${district ?? "—"}`)
console.log(`Ward:      ${ward ?? "—"}`)
console.log(`Plot:      ${plot ?? "—"}`)
console.log(`Room:      ${room ?? "—"}`)
console.log("\nRunning AI analysis…\n")

const start = Date.now()

analyzeVerificationScreenshot(imageUrl, {
  estateType,
  characterName,
  fcName,
  district,
  ward,
  plot,
  room,
})
  .then((result) => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(2)
    console.log("--- Result ---")
    console.log(`Verified:   ${result.verified ? "✅ yes" : "❌ no"}`)
    console.log(`Confidence: ${result.confidence}`)
    console.log(`Reason:     ${result.reason}`)
    console.log(`\nElapsed: ${elapsed}s`)

    if (result.verified && result.confidence === "high") {
      console.log("\n→ Would AUTO-APPROVE (AI_APPROVED)")
    } else if (!result.verified) {
      console.log("\n→ Would AUTO-REJECT (MOD_REJECTED) — rejection email sent to owner")
    } else {
      console.log("\n→ Would QUEUE for manual review (QUEUED) — AI approved but confidence is not high")
    }
  })
  .catch((err: unknown) => {
    console.error("Analysis failed:", err)
    process.exit(1)
  })
