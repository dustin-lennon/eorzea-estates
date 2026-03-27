import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from "@/lib/email"
import { logModerationAction } from "@/lib/moderation-log"
import { ModerationAction } from "@/generated/prisma/client"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || !["ADMIN", "MODERATOR"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { verificationId } = await params
  const body = await req.json() as { action: "approve" | "reject"; reason?: string }

  const verification = await prisma.estateVerification.findUnique({
    where: { id: verificationId },
    include: {
      estate: {
        select: {
          id: true,
          name: true,
          owner: { select: { email: true, name: true } },
        },
      },
    },
  })

  if (!verification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (body.action === "approve") {
    await prisma.$transaction([
      prisma.estate.update({
        where: { id: verification.estateId },
        data: { verified: true, verificationStatus: "MOD_APPROVED" },
      }),
      prisma.estateVerification.update({
        where: { id: verificationId },
        data: {
          status: "MOD_APPROVED",
          reviewedAt: new Date(),
          reviewedById: session.user.id,
        },
      }),
    ])

    await logModerationAction(prisma, {
      action: ModerationAction.VERIFICATION_APPROVED,
      entityType: "estate",
      entityId: verification.estateId,
      entityName: verification.estate.name,
      actorId: session.user.id,
    })

    if (verification.estate.owner.email) {
      sendVerificationApprovedEmail({
        to: verification.estate.owner.email,
        ownerName: verification.estate.owner.name ?? "there",
        estateName: verification.estate.name,
      }).catch(() => undefined)
    }

    return NextResponse.json({ status: "approved" })
  } else if (body.action === "reject") {
    const reason = body.reason ?? "Your screenshot did not meet the verification requirements."

    await prisma.$transaction([
      prisma.estate.update({
        where: { id: verification.estateId },
        data: { verificationStatus: "MOD_REJECTED" },
      }),
      prisma.estateVerification.update({
        where: { id: verificationId },
        data: {
          status: "MOD_REJECTED",
          reviewedAt: new Date(),
          reviewedById: session.user.id,
          modReason: reason,
        },
      }),
    ])

    await logModerationAction(prisma, {
      action: ModerationAction.VERIFICATION_REJECTED,
      entityType: "estate",
      entityId: verification.estateId,
      entityName: verification.estate.name,
      actorId: session.user.id,
      note: reason,
    })

    if (verification.estate.owner.email) {
      sendVerificationRejectedEmail({
        to: verification.estate.owner.email,
        ownerName: verification.estate.owner.name ?? "there",
        estateName: verification.estate.name,
        reason,
        screenshotUrl: verification.screenshotUrl,
      }).catch(() => undefined)
    }

    return NextResponse.json({ status: "rejected" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
