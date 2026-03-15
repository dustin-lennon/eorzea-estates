import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const claimSchema = z.object({
  characterId: z.string().min(1),
  screenshotUrl: z.string().url(),
  storageKey: z.string().min(1),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: estateId } = await params

  const estate = await prisma.estate.findUnique({
    where: { id: estateId, published: true, deletedAt: null },
    select: { id: true, designerId: true, ownerId: true, claimedAt: true, claimRequest: { select: { id: true } } },
  })

  if (!estate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!estate.designerId) {
    return NextResponse.json({ error: "This estate is not eligible for claim" }, { status: 400 })
  }
  if (estate.claimedAt) {
    return NextResponse.json({ error: "This estate has already been claimed" }, { status: 409 })
  }
  if (estate.claimRequest) {
    return NextResponse.json({ error: "A claim is already pending for this estate" }, { status: 409 })
  }
  if (estate.ownerId === session.user.id || estate.designerId === session.user.id) {
    return NextResponse.json({ error: "You cannot claim your own submission" }, { status: 400 })
  }

  const body = await req.json()
  const parsed = claimSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verify character belongs to claimant and is verified
  const character = await prisma.ffxivCharacter.findFirst({
    where: { id: parsed.data.characterId, userId: session.user.id, verified: true },
    select: { id: true },
  })
  if (!character) {
    return NextResponse.json({ error: "Verified character not found" }, { status: 400 })
  }

  await prisma.estateClaimRequest.create({
    data: {
      estateId,
      claimantId: session.user.id,
      characterId: parsed.data.characterId,
      screenshotUrl: parsed.data.screenshotUrl,
      storageKey: parsed.data.storageKey,
      status: "PENDING",
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
