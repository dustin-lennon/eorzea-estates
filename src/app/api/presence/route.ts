import { getSessionFromRequest } from "@/lib/session"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { lastSeenAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
