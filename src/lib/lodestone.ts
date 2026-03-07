// Lodestone character lookup via @xivapi/nodestone (direct Lodestone HTML parser)
import { CharacterSearch, Character } from "@xivapi/nodestone"

const characterSearchParser = new CharacterSearch()
const characterParser = new Character()

export interface LodestoneCharacter {
  ID: number
  Name: string
  Server: string
  DC: string
  Avatar: string
}

export async function searchCharacter(
  name: string,
  server: string
): Promise<LodestoneCharacter | null> {
  const result = await characterSearchParser
    .parse({ query: { name, server } } as any)
    .catch(() => null) as { List?: { ID: number; Name: string; World: string; DC: string; Avatar: string }[] } | null
  if (!result) return null

  const entries = result.List ?? []

  // Find exact match (case-insensitive)
  const match = entries.find(
    (r) =>
      r.Name.toLowerCase() === name.toLowerCase() &&
      r.World.toLowerCase() === server.toLowerCase()
  )

  return match ? { ID: match.ID, Name: match.Name, Server: match.World, DC: match.DC, Avatar: match.Avatar } : null
}

export async function getCharacterBio(lodestoneId: number): Promise<string> {
  const result = await characterParser
    .parse({ params: { characterId: String(lodestoneId) }, query: {} } as any)
    .catch(() => null) as { Bio?: string } | null
  if (!result) return ""
  return result.Bio ?? ""
}

export function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}
