import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getCharacterFCId, getFCMasterLodestoneId } from "@/lib/lodestone"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const character = await prisma.ffxivCharacter.findFirst({
    where: { id, userId: session.user.id, verified: true },
    select: { lodestoneId: true },
  })

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 })
  }

  const fcId = await getCharacterFCId(parseInt(character.lodestoneId))
  if (!fcId) {
    return NextResponse.json({ isFcMaster: false })
  }

  const masterLodestoneId = await getFCMasterLodestoneId(fcId)
  const isFcMaster = masterLodestoneId === character.lodestoneId

  if (isFcMaster) {
    // Republish any unpublished FC_ESTATE listings for this character
    const { count } = await prisma.estate.updateMany({
      where: { characterId: id, type: "FC_ESTATE", published: false },
      data: { published: true },
    })
    return NextResponse.json({ isFcMaster: true, republished: count })
  }

  return NextResponse.json({ isFcMaster: false })
}
