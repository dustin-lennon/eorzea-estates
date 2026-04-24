import { createClient } from "@supabase/supabase-js"
import sharpLib from "sharp"
import * as photon from "@cf-wasm/photon"
import { randomUUID } from "crypto"
import { REGIONS } from "./ffxiv-data"

// sharp is null in CF Workers (native binary; shimmed to null via Turbopack alias).
// Fallback: use @cf-wasm/photon (WASM, CF Workers compatible) for resize + WebP output.
const sharp = sharpLib as typeof sharpLib | null

async function resizeInside(buffer: Buffer, maxWidth: number, maxHeight: number): Promise<{ data: Buffer; contentType: string; ext: string }> {
  if (sharp) {
    const data = await sharp(buffer).resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
    return { data, contentType: "image/webp", ext: "webp" }
  }
  const img = photon.PhotonImage.new_from_byteslice(new Uint8Array(buffer))
  const origW = img.get_width()
  const origH = img.get_height()
  const scale = Math.min(maxWidth / origW, maxHeight / origH, 1)
  const newW = Math.max(1, Math.round(origW * scale))
  const newH = Math.max(1, Math.round(origH * scale))
  const resized = photon.resize(img, newW, newH, photon.SamplingFilter.Lanczos3)
  img.free()
  const data = Buffer.from(resized.get_bytes_webp())
  resized.free()
  return { data, contentType: "image/webp", ext: "webp" }
}

async function resizeCover(buffer: Buffer, size: number): Promise<{ data: Buffer; contentType: string; ext: string }> {
  if (sharp) {
    const data = await sharp(buffer).resize(size, size, { fit: "cover", position: "center" }).webp({ quality: 85 }).toBuffer()
    return { data, contentType: "image/webp", ext: "webp" }
  }
  const img = photon.PhotonImage.new_from_byteslice(new Uint8Array(buffer))
  const origW = img.get_width()
  const origH = img.get_height()
  const scale = Math.max(size / origW, size / origH)
  const newW = Math.max(size, Math.round(origW * scale))
  const newH = Math.max(size, Math.round(origH * scale))
  const resized = photon.resize(img, newW, newH, photon.SamplingFilter.Lanczos3)
  img.free()
  const x1 = Math.floor((newW - size) / 2)
  const y1 = Math.floor((newH - size) / 2)
  const cropped = photon.crop(resized, x1, y1, x1 + size, y1 + size)
  resized.free()
  const data = Buffer.from(cropped.get_bytes_webp())
  cropped.free()
  return { data, contentType: "image/webp", ext: "webp" }
}

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
  const { data: processed, contentType, ext } = await resizeInside(buffer, 1920, 1080)
  const storageKey = buildStoragePath(ctx, ext)
  const supabase = getSupabase()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, processed, { contentType, upsert: false })

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
  const { data: processed, contentType, ext } = await resizeCover(buffer, 256)
  const storageKey = `user-avatars/${userId}.${ext}`
  const supabase = getSupabase()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, processed, { contentType, upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey)
  // Append version timestamp so browsers don't serve stale cached image after replacement.
  const url = `${data.publicUrl}?v=${Date.now()}`
  return { url, storageKey }
}

export async function uploadVerificationScreenshot(
  buffer: Buffer,
  userId: string,
  estateId: string
): Promise<{ url: string; storageKey: string }> {
  const { data: processed, contentType, ext } = await resizeInside(buffer, 1920, 1080)
  const storageKey = `verification/${userId}/${estateId}/${randomUUID()}.${ext}`
  const supabase = getSupabase()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, processed, { contentType, upsert: false })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey)
  return { url: data.publicUrl, storageKey }
}
