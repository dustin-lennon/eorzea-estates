import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const patchSchema = z.object({
  role: z.enum(["USER", "MODERATOR", "ADMIN"]),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  // Prevent admin from demoting themselves
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid role" }, { status: 400 })

  const user = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, name: true, role: true },
  })

  return NextResponse.json(user)
}
