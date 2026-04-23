import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import Langfuse from "langfuse"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function getLangfuse(): Langfuse | null {
  if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) return null
  return new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
  })
}

const MODEL = "claude-opus-4-5"

interface VerificationContext {
  estateType: string
  characterName: string
  fcName?: string | null
  district?: string | null
  ward?: number | null
  plot?: number | null
  room?: number | null
}

export interface VerificationResult {
  verified: boolean
  confidence: "high" | "medium" | "low"
  reason: string
}

function buildUserPrompt(ctx: VerificationContext): string {
  const { estateType, characterName, fcName, district, ward, plot, room } = ctx

  switch (estateType) {
    case "PRIVATE":
    case "VENUE": {
      const address = [
        district ? district.replace("_", " ") : null,
        ward ? `Ward ${ward}` : null,
        plot ? `Plot ${plot}` : null,
      ]
        .filter(Boolean)
        .join(", ")
      return `Verify that this screenshot proves PRIVATE estate ownership.

Required evidence:
1. An Estate Profile panel must be visible showing Owner = "${characterName}"
   ${address ? `and Address containing "${address}"` : ""}
2. The character "${characterName}" must have a visible in-game nameplate in the scene.

Does this screenshot contain both pieces of evidence? Check exact name matches (case-insensitive).

Return ONLY valid JSON: { "verified": boolean, "confidence": "high"|"medium"|"low", "reason": string }`
    }

    case "FC_ESTATE": {
      return `Verify that this screenshot proves FC estate ownership.

Required evidence:
1. An Estate Profile panel showing Owner = "${fcName ?? "a Free Company name"}"
2. A Company Profile panel visible simultaneously showing Master = "${characterName}"
3. The character "${characterName}" must have a visible in-game nameplate in the scene.

Does this screenshot contain all three pieces of evidence? Both panels must be on-screen at the same time.${fcName ? ` The Estate Profile Owner must match the FC name "${fcName}" specifically — a different FC name is not acceptable.` : ""} Check exact name matches (case-insensitive).

Return ONLY valid JSON: { "verified": boolean, "confidence": "high"|"medium"|"low", "reason": string }`
    }

    case "APARTMENT": {
      return `Verify that this screenshot proves apartment ownership.

Required evidence:
1. An apartment room list panel showing an entry with Occupant = "${characterName}"${room ? ` at room number ${room}` : ""}.
2. The character "${characterName}" must have a visible in-game nameplate in the scene.

Important: When hovering over a room in the FFXIV apartment list, the game UI highlights both the hovered row and an adjacent row, causing the character name to appear twice. This is normal game behavior — do not treat two rows with the same name as evidence against ownership. Focus on whether the name "${characterName}" appears as an occupant${room ? ` and whether room number ${room} is associated with that name` : ""}.

Check exact name matches (case-insensitive).

Return ONLY valid JSON: { "verified": boolean, "confidence": "high"|"medium"|"low", "reason": string }`
    }

    case "FC_ROOM": {
      return `Verify that this screenshot proves FC private chamber ownership.

Required evidence:
1. A Private Chambers list (Additional Chambers) panel showing an entry with Occupant = "${characterName}"${room ? ` at room number ${room}` : ""}.
2. The character "${characterName}" must have a visible in-game nameplate in the scene.

Important: When hovering over a room in the FFXIV chamber list, the game UI highlights both the hovered row and an adjacent row, causing the character name to appear twice. This is normal game behavior — do not treat two rows with the same name as evidence against ownership. Focus on whether the name "${characterName}" appears as an occupant${room ? ` and whether room number ${room} is associated with that name` : ""}.

Check exact name matches (case-insensitive).

Return ONLY valid JSON: { "verified": boolean, "confidence": "high"|"medium"|"low", "reason": string }`
    }

    default:
      return `Verify that this screenshot proves estate ownership for character "${characterName}". Look for in-game UI panels showing the character's name as an owner or occupant, and a visible nameplate. Return ONLY valid JSON: { "verified": boolean, "confidence": "high"|"medium"|"low", "reason": string }`
  }
}

export async function analyzeVerificationScreenshot(
  imageUrl: string,
  ctx: VerificationContext
): Promise<VerificationResult> {
  const systemPrompt = `You are verifying FFXIV in-game estate ownership for the Eorzea Estates directory.
Analyze the screenshot and determine whether it proves ownership based on the criteria given.
Return ONLY a JSON object with no markdown, no explanation, no code blocks: { "verified": boolean, "confidence": "high"|"medium"|"low", "reason": string }
- "high": clear, unambiguous proof visible
- "medium": probable match but something is unclear or partially obscured
- "low": evidence is weak, unreadable, or contradictory`

  const userPrompt = buildUserPrompt(ctx)

  const messages = [
    {
      role: "user" as const,
      content: [
        { type: "image" as const, image: new URL(imageUrl) },
        { type: "text" as const, text: userPrompt },
      ],
    },
  ]

  const langfuse = getLangfuse()
  const trace = langfuse?.trace({ name: "verify-estate-screenshot", metadata: { estateType: ctx.estateType, characterName: ctx.characterName } })
  const generation = trace?.generation({
    name: "analyze-screenshot",
    model: MODEL,
    input: [{ role: "system", content: systemPrompt }, ...messages],
  })

  let text: string
  let usage: { promptTokens: number; completionTokens: number } | undefined

  try {
    const result = await generateText({
      model: anthropic(MODEL),
      system: systemPrompt,
      messages,
    })
    text = result.text
    usage = { promptTokens: result.usage.inputTokens ?? 0, completionTokens: result.usage.outputTokens ?? 0 }
  } catch (err) {
    generation?.end({ level: "ERROR", statusMessage: String(err) })
    await langfuse?.flushAsync()
    throw err
  }

  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "")
  const parsed = JSON.parse(cleaned) as {
    verified: boolean
    confidence: "high" | "medium" | "low"
    reason: string
  }

  const result: VerificationResult = {
    verified: Boolean(parsed.verified),
    confidence: parsed.confidence ?? "low",
    reason: String(parsed.reason ?? ""),
  }

  generation?.end({
    output: text,
    usage: usage ? { input: usage.promptTokens, output: usage.completionTokens } : undefined,
  })
  await langfuse?.flushAsync()

  return result
}
