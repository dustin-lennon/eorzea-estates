import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { token } = await req.json()
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  const transfer = await prisma.estatePendingTransfer.findUnique({
    where: { token },
  })

  if (!transfer) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
  }

  if (transfer.newOwnerId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (transfer.expiresAt < new Date()) {
    return NextResponse.json({ error: "Transfer link has expired" }, { status: 410 })
  }

  await prisma.$transaction([
    prisma.estate.update({
      where: { id: transfer.estateId },
      data: {
        ownerId: transfer.newOwnerId,
        characterId: transfer.newCharacterId,
        published: true,
      },
    }),
    prisma.estatePendingTransfer.delete({
      where: { id: transfer.id },
    }),
  ])

  return NextResponse.json({ ok: true })
}
