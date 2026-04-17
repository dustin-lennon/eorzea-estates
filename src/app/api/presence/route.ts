import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeenAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
