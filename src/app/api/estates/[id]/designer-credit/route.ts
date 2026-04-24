import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { searchCharacter, getCharacterById } from "@/lib/lodestone"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.union([
  z.object({ characterName: z.string().min(1), server: z.string().min(1) }),
  z.object({ lodestoneId: z.string().regex(/^\d+$/, "Lodestone ID must be a number") }),
])

async function getAuthorizedEstate(estateId: string, userId: string) {
  return prisma.estate.findUnique({
    where: { id: estateId, ownerId: userId, deletedAt: null },
    select: { id: true },
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const estate = await getAuthorizedEstate(id, session.user.id)
  if (!estate) {
    return NextResponse.json({ error: "Estate not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  let character: Awaited<ReturnType<typeof getCharacterById>>
  if ("lodestoneId" in parsed.data) {
    character = await getCharacterById(parseInt(parsed.data.lodestoneId))
    if (!character) {
      return NextResponse.json(
        { error: `Character with Lodestone ID ${parsed.data.lodestoneId} not found` },
        { status: 404 }
      )
    }
  } else {
    const { characterName, server } = parsed.data
    character = await searchCharacter(characterName, server)
    if (!character) {
      return NextResponse.json(
        { error: `Character "${parsed.data.characterName}" not found on ${parsed.data.server}` },
        { status: 404 }
      )
    }
  }

  // Check if this Lodestone character is a verified FfxivCharacter on the platform
  const verifiedCharacter = await prisma.ffxivCharacter.findFirst({
    where: { lodestoneId: String(character.ID), verified: true },
    select: { id: true, userId: true },
  })

  await prisma.estate.update({
    where: { id },
    data: {
      designerCreditName: character.Name,
      designerCreditServer: character.Server,
      designerCreditLodestoneId: String(character.ID),
      designerCreditAvatarUrl: character.Avatar,
      designerCreditCharacterId: verifiedCharacter?.id ?? null,
    },
  })

  return NextResponse.json({
    name: character.Name,
    server: character.Server,
    dataCenter: character.DC,
    lodestoneId: String(character.ID),
    avatarUrl: character.Avatar,
    profileCharacterId: verifiedCharacter?.id ?? null,
    profileUserId: verifiedCharacter?.userId ?? null,
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const estate = await getAuthorizedEstate(id, session.user.id)
  if (!estate) {
    return NextResponse.json({ error: "Estate not found" }, { status: 404 })
  }

  await prisma.estate.update({
    where: { id },
    data: {
      designerCreditName: null,
      designerCreditServer: null,
      designerCreditLodestoneId: null,
      designerCreditAvatarUrl: null,
      designerCreditCharacterId: null,
    },
  })

  return NextResponse.json({ success: true })
}
