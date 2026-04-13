import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { buildStoragePath, getEstateImagePublicUrl } from "@/lib/storage"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const BUCKET = "estate-images"

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { characterId, district, ward, plot } = body

  let characterName: string | undefined
  let server: string | undefined

  if (characterId) {
    const character = await prisma.ffxivCharacter.findFirst({
      where: { id: characterId, userId: session.user.id },
      select: { characterName: true, server: true },
    })
    characterName = character?.characterName ?? undefined
    server = character?.server ?? undefined
  }

  const storageKey = buildStoragePath(
    {
      userId: session.user.id,
      characterName,
      server,
      district: district ?? undefined,
      ward: ward ?? undefined,
      plot: plot ?? undefined,
    },
    "webp"
  )

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storageKey)

  if (error || !data) {
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 })
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    storageKey,
    publicUrl: getEstateImagePublicUrl(storageKey),
  })
}
