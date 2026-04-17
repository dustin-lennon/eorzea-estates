import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const commentSchema = z.object({
  body: z.string().min(1).max(1000),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ estateId: string }> }
) {
  const { estateId } = await params
  const comments = await prisma.comment.findMany({
    where: { estateId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          pathfinder: true,
          characters: {
            where: { verified: true },
            select: { characterName: true },
            take: 1,
          },
        },
      },
    },
  })
  return NextResponse.json(comments)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ estateId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { estateId } = await params
  const body = await req.json()
  const parsed = commentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comment = await prisma.$transaction(async (tx: any) => {
    const c = await tx.comment.create({
      data: { body: parsed.data.body, estateId, userId: session!.user!.id! },
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            pathfinder: true,
            characters: {
              where: { verified: true },
              select: { characterName: true },
              take: 1,
            },
          },
        },
      },
    })
    await tx.estate.update({
      where: { id: estateId },
      data: { commentCount: { increment: 1 } },
    })
    return c
  })

  return NextResponse.json(comment, { status: 201 })
}
