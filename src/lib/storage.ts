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

function buildStorageDir(ctx: StoragePathContext): string {
  if (!ctx.characterName && !ctx.district) {
    return `${ctx.userId}/uploads`
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

  return parts.join("/")
}

export function buildStoragePath(ctx: StoragePathContext, ext: string): string {
  return `${buildStorageDir(ctx)}/${randomUUID()}.${ext}`
}

export function getEstateImagePublicUrl(storageKey: string): string {
  const supabase = getSupabase()
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey)
  return data.publicUrl
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

export async function moveEstateImage(
  oldKey: string,
  ctx: StoragePathContext
): Promise<{ url: string; storageKey: string }> {
  const filename = oldKey.split("/").pop()!
  const newKey = `${buildStorageDir(ctx)}/${filename}`

  if (newKey === oldKey) {
    const supabase = getSupabase()
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(oldKey)
    return { url: data.publicUrl, storageKey: oldKey }
  }

  const supabase = getSupabase()
  const { error } = await supabase.storage.from(BUCKET).move(oldKey, newKey)
  if (error) throw new Error(`Storage move failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(newKey)
  return { url: data.publicUrl, storageKey: newKey }
}

export async function deleteEstateImage(storageKey: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.storage.from(BUCKET).remove([storageKey])
  if (error) throw new Error(`Storage delete failed: ${error.message}`)
}

export async function uploadUserAvatar(
  buffer: Buffer,
  userId: string
): Promise<{ url: string; storageKey: string }> {
  const processed = await sharp(buffer)
    .resize(256, 256, { fit: "cover", position: "center" })
    .webp({ quality: 85 })
    .toBuffer()

  const storageKey = `user-avatars/${userId}.webp`
  const supabase = getSupabase()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, processed, {
      contentType: "image/webp",
      upsert: true,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey)

  // Append a version timestamp so browsers don't serve the stale cached image
  // when the user uploads a replacement (same path, new file content).
  const url = `${data.publicUrl}?v=${Date.now()}`
  return { url, storageKey }
}

export async function uploadVerificationScreenshot(
  buffer: Buffer,
  userId: string,
  estateId: string
): Promise<{ url: string; storageKey: string }> {
  const processed = await sharp(buffer)
    .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  const storageKey = `verification/${userId}/${estateId}/${randomUUID()}.webp`
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
