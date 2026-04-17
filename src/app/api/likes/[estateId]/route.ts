import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ estateId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { estateId } = await params

  const existing = await prisma.like.findUnique({
    where: { userId_estateId: { userId: session.user.id, estateId } },
  })

  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({
        where: { userId_estateId: { userId: session.user.id, estateId } },
      }),
      prisma.estate.update({
        where: { id: estateId },
        data: { likeCount: { decrement: 1 } },
      }),
    ])
    return NextResponse.json({ liked: false })
  }

  await prisma.$transaction([
    prisma.like.create({
      data: { userId: session.user.id, estateId },
    }),
    prisma.estate.update({
      where: { id: estateId },
      data: { likeCount: { increment: 1 } },
    }),
  ])

  return NextResponse.json({ liked: true })
}
