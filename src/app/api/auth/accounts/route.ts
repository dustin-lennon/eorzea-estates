import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [accounts, user] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, email: true },
    }),
  ])

  return NextResponse.json({
    providers: accounts.map((a) => a.provider),
    hasPassword: !!user?.password,
    email: user?.email ?? null,
  })
}

const deleteSchema = z.object({ provider: z.string().min(1) })

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
  }

  const { provider } = parsed.data
  const userId = session.user.id

  const [accounts, user] = await Promise.all([
    prisma.account.findMany({ where: { userId }, select: { provider: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { password: true } }),
  ])

  const methodCount = accounts.length + (user?.password ? 1 : 0)
  if (methodCount <= 1) {
    return NextResponse.json(
      { error: "Cannot remove your only login method" },
      { status: 400 },
    )
  }

  await prisma.account.deleteMany({ where: { userId, provider } })

  return NextResponse.json({ ok: true })
}
