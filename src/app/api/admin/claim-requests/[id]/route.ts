import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { logModerationAction } from "@/lib/moderation-log"
import { ModerationAction } from "@/generated/prisma/client"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || !["ADMIN", "MODERATOR"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json() as { action: "approve" | "reject"; reason?: string }

  const claim = await prisma.estateClaimRequest.findUnique({
    where: { id },
    include: {
      estate: { select: { id: true, name: true, designerId: true, claimedAt: true } },
    },
  })

  if (!claim) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (body.action === "approve") {
    await prisma.$transaction([
      prisma.estate.update({
        where: { id: claim.estateId },
        data: {
          ownerId: claim.claimantId,
          characterId: claim.characterId,
          claimedAt: new Date(),
        },
      }),
      prisma.estateClaimRequest.update({
        where: { id },
        data: {
          status: "MOD_APPROVED",
          reviewedAt: new Date(),
          reviewedById: session.user.id,
        },
      }),
    ])
    await logModerationAction(prisma, {
      action: ModerationAction.CLAIM_APPROVED,
      entityType: "estate",
      entityId: claim.estateId,
      entityName: claim.estate.name,
      actorId: session.user.id,
    })
    return NextResponse.json({ status: "approved" })
  }

  if (body.action === "reject") {
    const reason = body.reason ?? "Your claim did not meet the requirements."
    await prisma.estateClaimRequest.update({
      where: { id },
      data: {
        status: "MOD_REJECTED",
        reviewedAt: new Date(),
        reviewedById: session.user.id,
        modReason: reason,
      },
    })
    await logModerationAction(prisma, {
      action: ModerationAction.CLAIM_REJECTED,
      entityType: "estate",
      entityId: claim.estateId,
      entityName: claim.estate.name,
      actorId: session.user.id,
      note: reason,
    })
    return NextResponse.json({ status: "rejected" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
