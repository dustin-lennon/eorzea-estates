import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { searchCharacter, generateVerificationCode } from "@/lib/lodestone"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  characterName: z.string().min(1),
  server: z.string().min(1),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { characterName, server } = parsed.data

  const character = await searchCharacter(characterName, server)
  if (!character) {
    return NextResponse.json(
      { error: `Character "${characterName}" not found on ${server}` },
      { status: 404 }
    )
  }

  const code = generateVerificationCode()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

  await prisma.lodestoneVerification.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
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

  // Store the character ID and name temporarily on the user
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      lodestoneCharacterId: String(character.ID),
      lodestoneCharacterName: character.Name,
      lodestoneServer: character.Server,
      lodestoneVerified: false,
    },
  })

  return NextResponse.json({ code, characterId: character.ID })
}
