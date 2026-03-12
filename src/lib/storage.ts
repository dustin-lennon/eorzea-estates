import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import { randomUUID } from "crypto"
import { REGIONS } from "./ffxiv-data"

const BUCKET = "estate-images"

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

function getDCForServer(server: string): string {
  for (const region of REGIONS) {
    for (const dc of region.dataCenters) {
      if (dc.servers.includes(server)) return dc.name
    }
  }
  return "unknown"
}

export interface StoragePathContext {
  userId: string
  characterName?: string
  server?: string
  district?: string
  ward?: number
  plot?: number
}

function buildStoragePath(ctx: StoragePathContext, ext: string): string {
  const uuid = randomUUID()

  if (!ctx.characterName && !ctx.district) {
    return `${ctx.userId}/uploads/${uuid}.${ext}`
  }

  const parts: string[] = [ctx.userId]

  if (ctx.characterName) parts.push(slugify(ctx.characterName))
  if (ctx.server) {
    const dc = getDCForServer(ctx.server)
    parts.push(slugify(dc))
    parts.push(slugify(ctx.server))
  }
  if (ctx.district) parts.push(slugify(ctx.district))

  const location =
    ctx.ward && ctx.plot
      ? `w${ctx.ward}-p${ctx.plot}`
      : ctx.ward
        ? `w${ctx.ward}`
        : null
  if (location) parts.push(location)

  return `${parts.join("/")}/${uuid}.${ext}`
}

export async function uploadEstateImage(
  buffer: Buffer,
  ctx: StoragePathContext
): Promise<{ url: string; storageKey: string }> {
  const processed = await sharp(buffer)
    .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  const storageKey = buildStoragePath(ctx, "webp")
  const supabase = getSupabase()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, processed, {
      contentType: "image/webp",
      upsert: false,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey)

  return { url: data.publicUrl, storageKey }
}

export async function deleteEstateImage(storageKey: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.storage.from(BUCKET).remove([storageKey])
  if (error) throw new Error(`Storage delete failed: ${error.message}`)
}
