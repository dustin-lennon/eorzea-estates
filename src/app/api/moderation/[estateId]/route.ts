import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendModerationUnpublishedEmail, sendModerationRemovedEmail } from "@/lib/email"
import { NextResponse } from "next/server"
import { z } from "zod"

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "remove", "restore"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ estateId: string }> }
) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { estateId } = await params
  const body = await req.json()
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const estate = await prisma.estate.findUnique({
    where: { id: estateId },
    select: {
      id: true,
      name: true,
      flagReason: true,
      owner: { select: { email: true, name: true, discordUsername: true } },
    },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { action } = parsed.data

  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } })
  const disputeEmail = settings?.disputeEmail ?? "dispute@eorzeaestates.com"

  const ownerEmail = estate.owner.email
  const ownerName = estate.owner.discordUsername ?? estate.owner.name ?? "there"

  if (action === "approve") {
    await prisma.estate.update({
      where: { id: estateId },
      data: {
        flagged: false,
        flagReason: null,
        flaggedById: null,
        flaggedAt: null,
        moderationStatus: "APPROVED",
      },
    })
  } else if (action === "reject") {
    await prisma.estate.update({
      where: { id: estateId },
      data: {
        flagged: false,
        published: false,
        moderationStatus: "REJECTED",
      },
    })
    if (ownerEmail) {
      await sendModerationUnpublishedEmail({
        to: ownerEmail,
        ownerName,
        estateName: estate.name,
        flagReason: estate.flagReason,
        disputeEmail,
      }).catch(() => {/* non-fatal */})
    }
  } else if (action === "remove") {
    await prisma.estate.update({
      where: { id: estateId },
      data: {
        deletedAt: new Date(),
        published: false,
        flagged: false,
        moderationStatus: "REMOVED",
      },
    })
    if (ownerEmail) {
      await sendModerationRemovedEmail({
        to: ownerEmail,
        ownerName,
        estateName: estate.name,
        flagReason: estate.flagReason,
        disputeEmail,
      }).catch(() => {/* non-fatal */})
    }
  } else if (action === "restore") {
    await prisma.estate.update({
      where: { id: estateId },
      data: {
        deletedAt: null,
        moderationStatus: "APPROVED",
        flagged: false,
        flagReason: null,
        flaggedById: null,
        flaggedAt: null,
      },
    })
  }

  return NextResponse.json({ success: true })
}
