/**
 * One-time migration: Cloudinary → Supabase Storage
 *
 * Fetches all Image rows whose imageUrl starts with res.cloudinary.com,
 * downloads + re-processes each through Sharp, uploads to Supabase Storage,
 * then updates the DB row with the new imageUrl and storageKey.
 *
 * Run with:
 *   node --experimental-strip-types scripts/migrate-images-to-supabase.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env
 */

import { config } from "dotenv"
config()

import { PrismaClient } from "../src/generated/prisma/index.js"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import { randomUUID } from "crypto"

const prisma = new PrismaClient()
const BUCKET = "estate-images"

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
  }
  return createClient(url, key)
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const supabase = getSupabase()

  // Fetch all images with Cloudinary URLs, joined with estate context
  const images = await prisma.image.findMany({
    where: { imageUrl: { startsWith: "https://res.cloudinary.com" } },
    include: {
      estate: {
        select: {
          ownerId: true,
          district: true,
          ward: true,
          plot: true,
          character: {
            select: { characterName: true, server: true },
          },
        },
      },
    },
  })

  if (images.length === 0) {
    console.log("No Cloudinary images found — nothing to migrate.")
    return
  }

  console.log(`Found ${images.length} image(s) to migrate.\n`)

  let succeeded = 0
  let failed = 0

  for (const image of images) {
    const estate = image.estate
    const parts: string[] = [estate.ownerId]

    if (estate.character?.characterName) parts.push(slugify(estate.character.characterName))
    if (estate.character?.server) parts.push(slugify(estate.character.server))
    if (estate.district) parts.push(slugify(estate.district))
    if (estate.ward && estate.plot) parts.push(`w${estate.ward}-p${estate.plot}`)
    else if (estate.ward) parts.push(`w${estate.ward}`)

    const storageKey = `${parts.join("/")}/${randomUUID()}.webp`

    process.stdout.write(`  [${succeeded + failed + 1}/${images.length}] ${image.imageUrl.slice(0, 60)}... `)

    try {
      const rawBuffer = await downloadImage(image.imageUrl)

      const processed = await sharp(rawBuffer)
        .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer()

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storageKey, processed, { contentType: "image/webp", upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey)

      await prisma.image.update({
        where: { id: image.id },
        data: { imageUrl: data.publicUrl, storageKey },
      })

      console.log(`✓`)
      succeeded++
    } catch (err) {
      console.log(`✗ ${err instanceof Error ? err.message : err}`)
      failed++
    }
  }

  console.log(`\nDone. ${succeeded} migrated, ${failed} failed.`)

  if (failed > 0) {
    console.log("Re-run the script to retry failed images (it skips already-migrated ones).")
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
