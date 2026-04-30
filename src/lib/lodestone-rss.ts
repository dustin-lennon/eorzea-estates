import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"

const FEED_URL = "https://na.finalfantasyxiv.com/lodestone/news/news.xml"
const HAIKU = "claude-haiku-4-5-20251001"

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface MaintenanceEntry {
  announcementId: string
  title: string
  text: string
}

function unescapeAndStripHtml(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function fetchMaintenanceEntries(): Promise<MaintenanceEntry[]> {
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": "EorzeaEstates/1.0 (maintenance monitor)" },
  })
  if (!res.ok) throw new Error(`Lodestone feed fetch failed: ${res.status}`)
  const xml = await res.text()

  const entries: MaintenanceEntry[] = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match: RegExpExecArray | null

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1]
    const category = block.match(/<category term="([^"]*)"/)?.[1]
    if (category !== "Maintenance") continue

    const title = unescapeAndStripHtml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "")
    const link = block.match(/<link rel="alternate"[^>]*href="([^"]*)"[^>]*\/?>/)?.[1] ?? ""
    const content = unescapeAndStripHtml(block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "")

    if (!link || !title) continue
    entries.push({ announcementId: link, title, text: content })
  }

  return entries
}

const windowSchema = z.object({
  affectsLodestone: z.boolean(),
  found: z.boolean(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
})

const SYSTEM_PROMPT = `You extract maintenance time windows from FFXIV Lodestone maintenance announcements.

Determine:
1. affectsLodestone: true if this maintenance takes down Lodestone character lookup (character profiles, bios, search).
   - TRUE for: "All Worlds Maintenance", "The Lodestone Maintenance", game server maintenance, emergency world maintenance, full game patch maintenance.
   - FALSE for: Mog Station, Online Store, COMPANION App, payment systems, single-service maintenance that doesn't affect in-game or Lodestone character data.
2. found: true if a clear maintenance time window is present.
3. startsAt: ISO 8601 UTC string of maintenance start, or null.
4. endsAt: ISO 8601 UTC string of scheduled end (or actual end for follow-ups), or null.

Time zones in announcements are typically PDT (UTC-7) or PST (UTC-8). Convert to UTC.
If found is false or affectsLodestone is false, return null for startsAt and endsAt.`

export async function parseMaintenanceWindow(
  title: string,
  text: string
): Promise<{ startsAt: Date; endsAt: Date } | null> {
  const { object } = await generateObject({
    model: anthropic(HAIKU),
    schema: windowSchema,
    system: SYSTEM_PROMPT,
    prompt: `Title: ${title}\n\n${text}`,
  })

  if (!object.affectsLodestone || !object.found || !object.startsAt || !object.endsAt) return null

  const startsAt = new Date(object.startsAt)
  const endsAt = new Date(object.endsAt)
  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) return null

  return { startsAt, endsAt }
}
