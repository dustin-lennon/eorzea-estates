import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getCharacterBio } from "@/lib/lodestone"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  characterId: z.string().min(1),
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

  const { characterId } = parsed.data

  // Ensure the character belongs to this user
  const character = await prisma.ffxivCharacter.findFirst({
    where: { id: characterId, userId: session.user.id },
    include: { lodestoneVerification: true },
  })

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 })
  }

  const verification = character.lodestoneVerification
  if (!verification) {
    return NextResponse.json({ error: "No verification in progress" }, { status: 400 })
  }

  if (verification.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Verification code expired. Please start again." },
      { status: 400 }
    )
  }

  const bio = await getCharacterBio(parseInt(character.lodestoneId))

  if (!bio.includes(verification.code)) {
    return NextResponse.json(
      {
        error: `Code "${verification.code}" not found in your Lodestone bio. Please add it and try again.`,
      },
      { status: 400 }
    )
  }

  // Verification success
  await prisma.$transaction([
    prisma.ffxivCharacter.update({
      where: { id: characterId },
      data: { verified: true },
    }),
    prisma.lodestoneVerification.update({
      where: { characterId },
      data: { verified: true },
    }),
  ])

  return NextResponse.json({ success: true, characterName: character.characterName })
}
