import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const character = await prisma.ffxivCharacter.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 })
  }

  await prisma.ffxivCharacter.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
