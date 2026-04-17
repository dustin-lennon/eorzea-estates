import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const estate = await prisma.estate.findUnique({
    where: { id, deletedAt: null },
    select: { ownerId: true },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (estate.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.estate.update({
    where: { id },
    data: { confirmedActiveAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
