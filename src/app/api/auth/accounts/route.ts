import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [accounts, user] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true, providerId: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, email: true, emailVerified: true, emailVerifiedAt: true },
    }),
  ])

  // OAuth accounts use provider names ("discord", "google"); credential accounts use "credential"/"credentials"
  const oauthAccounts = accounts.filter(
    (a) => (a.providerId ?? a.provider) !== "credential" && (a.providerId ?? a.provider) !== "credentials"
  )
  const hasCredentialAccount = accounts.some(
    (a) => a.providerId === "credential" || a.provider === "credentials"
  )

  return NextResponse.json({
    providers: oauthAccounts.map((a) => a.providerId ?? a.provider),
    hasPassword: hasCredentialAccount || !!user?.password,
    email: user?.email ?? null,
    emailVerified: user?.emailVerified || !!user?.emailVerifiedAt,
  })
}

const deleteSchema = z.object({ provider: z.string().min(1) })

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
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
    prisma.account.findMany({ where: { userId }, select: { provider: true, providerId: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { password: true } }),
  ])

  const oauthCount = accounts.filter(
    (a) => (a.providerId ?? a.provider) !== "credential" && (a.providerId ?? a.provider) !== "credentials"
  ).length
  const hasCredentials = accounts.some(
    (a) => a.providerId === "credential" || a.provider === "credentials"
  ) || !!user?.password
  const methodCount = oauthCount + (hasCredentials ? 1 : 0)

  if (methodCount <= 1) {
    return NextResponse.json(
      { error: "Cannot remove your only login method" },
      { status: 400 },
    )
  }

  // Delete by both legacy provider and BA providerId to handle all account rows
  await prisma.account.deleteMany({
    where: { userId, OR: [{ providerId: provider }, { provider }] },
  })

  return NextResponse.json({ ok: true })
}
