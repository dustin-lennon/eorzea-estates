import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { searchCharacter, getCharacterById, generateVerificationCode, LodestoneMaintenanceError } from "@/lib/lodestone"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.union([
  z.object({ characterName: z.string().min(1), server: z.string().min(1) }),
  z.object({ lodestoneId: z.string().regex(/^\d+$/, "Lodestone ID must be a number") }),
])

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } })
  if (settings?.lodestoneMaintenanceMode) {
    return NextResponse.json({ error: "lodestone_maintenance" }, { status: 503 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  let character: Awaited<ReturnType<typeof getCharacterById>>
  if ("lodestoneId" in parsed.data) {
    try {
      character = await getCharacterById(parseInt(parsed.data.lodestoneId))
    } catch (e) {
      if (e instanceof LodestoneMaintenanceError) {
        return NextResponse.json({ error: "lodestone_maintenance" }, { status: 503 })
      }
      return NextResponse.json({ error: `Character with Lodestone ID ${parsed.data.lodestoneId} not found` }, { status: 404 })
    }
    if (!character) {
      return NextResponse.json(
        { error: `Character with Lodestone ID ${parsed.data.lodestoneId} not found` },
        { status: 404 }
      )
    }
  } else {
    const { characterName, server } = parsed.data
    try {
      character = await searchCharacter(characterName, server)
    } catch (e) {
      if (e instanceof LodestoneMaintenanceError) {
        return NextResponse.json({ error: "lodestone_maintenance" }, { status: 503 })
      }
      return NextResponse.json({ error: `Character "${characterName}" not found on ${server}` }, { status: 404 })
    }
    if (!character) {
      return NextResponse.json(
        { error: `Character "${characterName}" not found on ${server}` },
        { status: 404 }
      )
    }
  }

  // Check if this Lodestone character is already claimed by another user
  const existing = await prisma.ffxivCharacter.findFirst({
    where: {
      lodestoneId: String(character.ID),
      verified: true,
      NOT: { userId: session.user.id },
    },
  })
  if (existing) {
    return NextResponse.json(
      { error: "This character is already claimed by another account." },
      { status: 409 }
    )
  }

  // Create or retrieve the (possibly unverified) character record for this user
  const ffxivCharacter = await prisma.ffxivCharacter.upsert({
    where: {
      userId_lodestoneId: {
        userId: session.user.id,
        lodestoneId: String(character.ID),
      },
    },
    create: {
      userId: session.user.id,
      lodestoneId: String(character.ID),
      characterName: character.Name,
      server: character.Server,
      dataCenter: character.DC,
      avatarUrl: character.Avatar,
      verified: false,
    },
    update: {
      characterName: character.Name,
      server: character.Server,
      dataCenter: character.DC,
      avatarUrl: character.Avatar,
      verified: false,
    },
  })

  const code = generateVerificationCode()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

  await prisma.lodestoneVerification.upsert({
    where: { characterId: ffxivCharacter.id },
    create: {
      characterId: ffxivCharacter.id,
      code,
      expiresAt,
      verified: false,
    },
    update: {
      code,
      expiresAt,
      verified: false,
    },
  })

  return NextResponse.json({
    code,
    characterId: ffxivCharacter.id,
    lodestoneId: character.ID,
    characterName: character.Name,
    server: character.Server,
    dataCenter: character.DC,
    avatarUrl: character.Avatar,
  })
}
