// Lodestone character verification via xivapi.com
// xivapi provides a public API to look up FFXIV characters

const XIVAPI_BASE = "https://xivapi.com"

export interface LodestoneCharacter {
  ID: number
  Name: string
  Server: string
  DC: string
  Avatar: string
  Bio: string
}

export async function searchCharacter(
  name: string,
  server: string
): Promise<LodestoneCharacter | null> {
  const url = `${XIVAPI_BASE}/character/search?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server)}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) return null

  const data = await res.json()
  const results: { ID: number; Name: string; Server: string; DC: string; Avatar: string }[] =
    data.Results ?? []

  // Find exact match (case-insensitive)
  const match = results.find(
    (r) =>
      r.Name.toLowerCase() === name.toLowerCase() &&
      r.Server.toLowerCase() === server.toLowerCase()
  )

  return match ? { ...match, Bio: "" } : null
}

export async function getCharacterBio(lodestoneId: number): Promise<string> {
  const url = `${XIVAPI_BASE}/character/${lodestoneId}?data=`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) return ""

  const data = await res.json()
  return data.Character?.Bio ?? ""
}

export function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}
