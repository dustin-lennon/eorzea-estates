import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(300).nullable().optional(),
})

async function getOwnedCollection(userId: string, collectionId: string) {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string; collectionId: string }> }
) {
  const session = await auth()
  const { userId, collectionId } = await params

  if (!session?.user?.id || session.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const collection = await getOwnedCollection(userId, collectionId)
  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.collection.update({
    where: { id: collectionId },
    data: parsed.data,
    select: { id: true, name: true, description: true, updatedAt: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string; collectionId: string }> }
) {
  const session = await auth()
  const { userId, collectionId } = await params

  if (!session?.user?.id || session.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const collection = await getOwnedCollection(userId, collectionId)
  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.collection.delete({ where: { id: collectionId } })
  return NextResponse.json({ success: true })
}
