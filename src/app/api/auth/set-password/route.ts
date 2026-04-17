import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"

const schema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export async function POST(request: Request) {
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

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json({ error: first?.message ?? "Invalid input" }, { status: 400 })
  }

  const { currentPassword, newPassword } = parsed.data

  const [user, linkedAccounts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, email: true, emailVerified: true, emailVerifiedAt: true },
    }),
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true, providerId: true },
    }),
  ])

  if (!user?.email) {
    return NextResponse.json(
      { error: "No email address on this account. Sign in with Discord or Google to associate one." },
      { status: 400 },
    )
  }

  // Treat linked OAuth providers as email-verified (Google/Discord both verify identity)
  const hasOAuthAccount = linkedAccounts.some(
    (a) => (a.providerId ?? a.provider) !== "credential" && (a.providerId ?? a.provider) !== "credentials"
  )
  const effectivelyVerified = user.emailVerified || !!user.emailVerifiedAt || hasOAuthAccount
  if (!effectivelyVerified) {
    return NextResponse.json(
      { error: "Your email address must be verified before setting a password." },
      { status: 400 },
    )
  }

  if (user.password) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 })
    }
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  const userId = session.user.id
  // Update password on both User (legacy) and the credential Account (BA)
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { password: hashed } }),
    prisma.account.upsert({
      where: { providerId_accountId: { providerId: "credential", accountId: userId } },
      update: { password: hashed },
      create: {
        userId,
        accountId: userId,
        providerId: "credential",
        password: hashed,
        // Legacy NextAuth fields (required NOT NULL during transition)
        type: "credentials",
        provider: "credentials",
        providerAccountId: userId,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
