import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getCharacterFCId } from "@/lib/lodestone"
import { sendFcOverrideApprovedEmail, sendFcOverrideDeniedEmail } from "@/lib/email"
import { logModerationAction } from "@/lib/moderation-log"
import { ModerationAction } from "@/generated/prisma/client"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id || !["ADMIN", "MODERATOR"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json() as { action: "approve" | "deny"; adminNote?: string }

  const overrideRequest = await prisma.fcOverrideRequest.findUnique({
    where: { id },
    include: {
      character: true,
      user: { select: { email: true, name: true } },
    },
  })

  if (!overrideRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (overrideRequest.status !== "PENDING") {
    return NextResponse.json({ error: "Request is no longer pending." }, { status: 409 })
  }

  if (body.action === "approve") {
    const fcId = await getCharacterFCId(parseInt(overrideRequest.character.lodestoneId)).catch(() => null)
    if (!fcId) {
      return NextResponse.json(
        { error: "Character is not currently in a Free Company. Cannot grant override." },
        { status: 422 }
      )
    }

    await prisma.$transaction([
      prisma.fcOverrideRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: session.user.id,
          adminNote: body.adminNote ?? null,
        },
      }),
      prisma.fcOverride.create({
        data: {
          requestId: id,
          characterId: overrideRequest.characterId,
          fcId,
          grantedById: session.user.id,
        },
      }),
    ])

    await logModerationAction(prisma, {
      action: ModerationAction.FC_OVERRIDE_APPROVED,
      entityType: "fcOverrideRequest",
      entityId: id,
      entityName: overrideRequest.character.characterName,
      actorId: session.user.id,
      note: body.adminNote,
    })

    if (overrideRequest.user.email) {
      sendFcOverrideApprovedEmail({
        to: overrideRequest.user.email,
        userName: overrideRequest.user.name ?? "there",
        characterName: overrideRequest.character.characterName,
      }).catch(() => undefined)
    }

    return NextResponse.json({ status: "approved" })
  } else if (body.action === "deny") {
    await prisma.fcOverrideRequest.update({
      where: { id },
      data: {
        status: "DENIED",
        reviewedAt: new Date(),
        reviewedById: session.user.id,
        adminNote: body.adminNote ?? null,
      },
    })

    await logModerationAction(prisma, {
      action: ModerationAction.FC_OVERRIDE_DENIED,
      entityType: "fcOverrideRequest",
      entityId: id,
      entityName: overrideRequest.character.characterName,
      actorId: session.user.id,
      note: body.adminNote,
    })

    if (overrideRequest.user.email) {
      sendFcOverrideDeniedEmail({
        to: overrideRequest.user.email,
        userName: overrideRequest.user.name ?? "there",
        characterName: overrideRequest.character.characterName,
        adminNote: body.adminNote ?? undefined,
      }).catch(() => undefined)
    }

    return NextResponse.json({ status: "denied" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
