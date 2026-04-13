import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const collections = await prisma.collection.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      _count: { select: { estates: true } },
    },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(collections)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  const { userId } = await params

  if (!session?.user?.id || session.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const collection = await prisma.collection.create({
    data: {
      userId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
    select: { id: true, name: true, description: true, createdAt: true },
  })

  return NextResponse.json(collection, { status: 201 })
}
