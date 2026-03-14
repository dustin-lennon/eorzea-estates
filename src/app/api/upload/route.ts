import { auth } from "@/auth"
import { uploadEstateImage } from "@/lib/storage"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 })
  }

  const maxSize = 10 * 1024 * 1024 // 10 MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 })
  }

  const characterId = formData.get("characterId") as string | null
  const district = formData.get("district") as string | null
  const ward = formData.get("ward") ? parseInt(formData.get("ward") as string) : undefined
  const plot = formData.get("plot") ? parseInt(formData.get("plot") as string) : undefined

  let characterName: string | undefined
  let server: string | undefined

  if (characterId) {
    const character = await prisma.ffxivCharacter.findFirst({
      where: { id: characterId, userId: session.user.id },
      select: { characterName: true, server: true },
    })
    characterName = character?.characterName
    server = character?.server
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await uploadEstateImage(buffer, {
    userId: session.user.id,
    characterName,
    server,
    district: district ?? undefined,
    ward,
    plot,
  })

  return NextResponse.json(result)
}
