// Lodestone character lookup via @xivapi/nodestone (direct Lodestone HTML parser)
import { CharacterSearch, Character, FCMembers } from "@xivapi/nodestone"

const characterSearchParser = new CharacterSearch()
const characterParser = new Character()
const fcMembersParser = new FCMembers()

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export async function getCharacterById(lodestoneId: number): Promise<LodestoneCharacter | null> {
  const result = await characterParser
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .parse({ params: { characterId: String(lodestoneId) }, query: {} } as any)
    .catch(() => null) as { Name?: string; World?: string; DC?: string; Avatar?: string } | null
  if (!result?.Name) return null
  return {
    ID: lodestoneId,
    Name: result.Name,
    Server: result.World ?? "",
    DC: result.DC ?? "",
    Avatar: result.Avatar ?? "",
  }
}

export async function getCharacterBio(lodestoneId: number): Promise<string> {
  const result = await characterParser
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .parse({ params: { characterId: String(lodestoneId) }, query: {} } as any)
    .catch(() => null) as { Bio?: string } | null
  if (!result) return ""
  return result.Bio ?? ""
}

export async function getCharacterFCId(lodestoneId: number): Promise<string | null> {
  const result = await characterParser
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .parse({ params: { characterId: String(lodestoneId) }, query: {} } as any)
    .catch(() => null) as { FreeCompany?: { ID?: string } } | null
  return result?.FreeCompany?.ID ?? null
}

export async function getFCMasterLodestoneId(fcId: string): Promise<string | null> {
  const result = await fcMembersParser
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .parse({ params: { fcId }, query: {} } as any)
    .catch(() => null) as { List?: Array<{ ID?: number }> } | null
  const masterId = result?.List?.[0]?.ID
  return masterId != null ? String(masterId) : null
}

export function generateVerificationCode(): string {
  return `eorzea-${crypto.randomUUID()}`
}
