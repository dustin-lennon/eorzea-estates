import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { PATHFINDER_LIMIT } from "@/lib/pathfinder"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { pathfinder } = await req.json() as { pathfinder: boolean }

  if (pathfinder) {
    const count = await prisma.user.count({ where: { pathfinder: true } })
    if (count >= PATHFINDER_LIMIT) {
      return NextResponse.json(
        { error: `Pathfinder limit of ${PATHFINDER_LIMIT} reached` },
        { status: 409 }
      )
    }
  }

  await prisma.user.update({ where: { id }, data: { pathfinder } })
  return NextResponse.json({ success: true })
}
