import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const characters = await prisma.ffxivCharacter.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      lodestoneId: true,
      characterName: true,
      server: true,
      verified: true,
      createdAt: true,
      _count: { select: { estates: true } },
    },
  })

  return NextResponse.json(characters)
}
