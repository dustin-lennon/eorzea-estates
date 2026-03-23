import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
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

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json({ error: first?.message ?? "Invalid input" }, { status: 400 })
  }

  const { currentPassword, newPassword } = parsed.data

  const [user, linkedAccounts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, email: true, emailVerified: true },
    }),
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    }),
  ])

  if (!user?.email) {
    return NextResponse.json(
      { error: "No email address on this account. Sign in with Discord or Google to associate one." },
      { status: 400 },
    )
  }

  // Treat linked OAuth providers as email-verified (Google/Discord both verify identity)
  const effectivelyVerified = !!user.emailVerified || linkedAccounts.length > 0
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
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  })

  return NextResponse.json({ ok: true })
}
