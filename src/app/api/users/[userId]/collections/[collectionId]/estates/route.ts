import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const addSchema = z.object({
  estateId: z.string(),
  order: z.number().int().default(0),
})

async function getOwnedCollection(userId: string, collectionId: string) {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  })
}

export async function POST(
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
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const estate = await prisma.estate.findFirst({
    where: { id: parsed.data.estateId, published: true, deletedAt: null },
    select: { id: true },
  })
  if (!estate) {
    return NextResponse.json({ error: "Estate not found or not published" }, { status: 400 })
  }

  const entry = await prisma.collectionEstate.upsert({
    where: { collectionId_estateId: { collectionId, estateId: parsed.data.estateId } },
    create: { collectionId, estateId: parsed.data.estateId, order: parsed.data.order },
    update: { order: parsed.data.order },
  })

  return NextResponse.json(entry, { status: 201 })
}

export async function DELETE(
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

  const { searchParams } = new URL(req.url)
  const estateId = searchParams.get("estateId")
  if (!estateId) {
    return NextResponse.json({ error: "estateId required" }, { status: 400 })
  }

  await prisma.collectionEstate.delete({
    where: { collectionId_estateId: { collectionId, estateId } },
  })

  return NextResponse.json({ success: true })
}
