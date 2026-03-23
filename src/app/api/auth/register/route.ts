import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export async function POST(request: Request) {
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

  const { email, password } = parsed.data

  // Re-validate the verification token is still valid
  const token = await prisma.verificationToken.findFirst({
    where: { identifier: email },
  })
  if (!token || token.expires < new Date()) {
    return NextResponse.json({ error: "Verification code expired. Please start over." }, { status: 400 })
  }

  // Check email not already taken
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.user.create({
      data: {
        email,
        emailVerified: new Date(),
        password: hashed,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
