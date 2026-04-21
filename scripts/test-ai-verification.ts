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
 *
 * Example:
 *   pnpm test:verify --type PRIVATE --character "Ada Lovelace" --image "https://example.com/screenshot.png"
 */

const args = process.argv.slice(2)

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 ? args[idx + 1] : undefined
}

import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(process.cwd(), ".env") })

console.log(`\nOPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? "set ✓" : "NOT SET ✗"}`)

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
