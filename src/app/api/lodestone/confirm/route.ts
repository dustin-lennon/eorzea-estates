import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getCharacterBio } from "@/lib/lodestone"
import { NextResponse } from "next/server"

export async function POST(_req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const verification = await prisma.lodestoneVerification.findUnique({
    where: { userId: session.user.id },
  })

  if (!verification) {
    return NextResponse.json({ error: "No verification in progress" }, { status: 400 })
  }

  if (verification.expiresAt < new Date()) {
    return NextResponse.json({ error: "Verification code expired. Please start again." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lodestoneCharacterId: true },
  })

  if (!user?.lodestoneCharacterId) {
    return NextResponse.json({ error: "No character linked. Please start again." }, { status: 400 })
  }

  const bio = await getCharacterBio(parseInt(user.lodestoneCharacterId))

  if (!bio.includes(verification.code)) {
    return NextResponse.json(
      { error: `Code "${verification.code}" not found in your Lodestone bio. Please add it and try again.` },
      { status: 400 }
    )
  }

  // Verification success
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { lodestoneVerified: true },
    }),
    prisma.lodestoneVerification.update({
      where: { userId: session.user.id },
      data: { verified: true },
    }),
  ])

  return NextResponse.json({ success: true })
}
