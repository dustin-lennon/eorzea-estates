'use strict'

// CF Workers shim for @xivapi/nodestone.
// The original package scrapes Lodestone HTML using Node.js (express, cheerio).
// This shim uses the xivapi.com REST API instead, which works via fetch() in CF Workers.

const XIVAPI = 'https://xivapi.com'

class CharacterSearch {
  async parse(req) {
    const { name, server, dc } = req.query ?? {}
    let url = `${XIVAPI}/character/search?name=${encodeURIComponent(name ?? '')}`
    if (server) url += `&server=${encodeURIComponent(server)}`
    else if (dc) url += `&server=_dc_${encodeURIComponent(dc)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`xivapi search failed: ${res.status}`)
    const data = await res.json()
    return {
      List: (data.Results ?? []).map((r) => ({
        ID: r.ID,
        Name: r.Name,
        World: r.Server,
        DC: r.DC ?? '',
        Avatar: r.Avatar ?? '',
      })),
    }
  }
}

class Character {
  async parse(req) {
    const id = req.params?.characterId
    if (!id) throw new Error('characterId required')
    const res = await fetch(`${XIVAPI}/character/${id}?extended=1`)
    if (!res.ok) throw new Error(`xivapi character failed: ${res.status}`)
    const data = await res.json()
    const c = data.Character ?? {}
    return {
      Name: c.Name,
      World: c.World,
      DC: c.DC,
      Avatar: c.Avatar,
      Bio: c.Bio,
      FreeCompany: c.FreeCompanyId ? { ID: c.FreeCompanyId } : undefined,
    }
  }
}

class FCMembers {
  async parse(req) {
    const id = req.params?.fcId
    if (!id) throw new Error('fcId required')
    const res = await fetch(`${XIVAPI}/freecompany/${id}/members`)
    if (!res.ok) throw new Error(`xivapi fc members failed: ${res.status}`)
    const data = await res.json()
    return { List: (data.FreeCompanyMembers ?? []).map((m) => ({ ID: m.ID })) }
  }
}

class FreeCompany {
  async parse(req) {
    const id = req.params?.fcId
    if (!id) throw new Error('fcId required')
    const res = await fetch(`${XIVAPI}/freecompany/${id}`)
    if (!res.ok) throw new Error(`xivapi fc failed: ${res.status}`)
    const data = await res.json()
    return { Name: data.FreeCompany?.Name }
  }
}

exports.CharacterSearch = CharacterSearch
exports.Character = Character
exports.FCMembers = FCMembers
exports.FreeCompany = FreeCompany
