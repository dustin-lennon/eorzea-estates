import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id

  const conv = await prisma.conversation.findUnique({
    where: { id },
    select: { designerId: true, requestorId: true },
  })

  if (!conv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (conv.designerId !== userId && conv.requestorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updateField = conv.designerId === userId ? { designerReadAt: new Date() } : { requestorReadAt: new Date() }

  await prisma.conversation.update({
    where: { id },
    data: updateField,
  })

  return NextResponse.json({ ok: true })
}
