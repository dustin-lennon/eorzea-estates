import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { deleteEstateImage } from "@/lib/cloudinary"
import { NextResponse } from "next/server"
import { z } from "zod"

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "remove"]),
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
    select: { id: true, images: { select: { storageKey: true } } },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { action } = parsed.data

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
  } else if (action === "remove") {
    await Promise.allSettled(
      estate.images.map((img) => deleteEstateImage(img.storageKey))
    )
    await prisma.estate.delete({ where: { id: estateId } })
  }

  return NextResponse.json({ success: true })
}
