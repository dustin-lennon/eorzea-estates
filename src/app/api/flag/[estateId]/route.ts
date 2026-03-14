import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const flagSchema = z.object({
  reason: z.string().min(1).max(500),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ estateId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { estateId } = await params
  const body = await req.json()
  const parsed = flagSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const estate = await prisma.estate.findFirst({
    where: { id: estateId, deletedAt: null },
    select: { id: true, ownerId: true, flagged: true },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (estate.ownerId === session.user.id) {
    return NextResponse.json({ error: "Cannot flag your own estate" }, { status: 400 })
  }
  if (estate.flagged) {
    return NextResponse.json({ error: "Already flagged" }, { status: 409 })
  }

  await prisma.estate.update({
    where: { id: estateId },
    data: {
      flagged: true,
      flagReason: parsed.data.reason,
      flaggedById: session.user.id,
      flaggedAt: new Date(),
      moderationStatus: "PENDING",
    },
  })

  return NextResponse.json({ success: true })
}
