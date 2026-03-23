import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { sendVerificationCodeEmail } from "@/lib/email"

const schema = z.object({
  email: z.string().email(),
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
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  const { email } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { password: true },
  })
  if (existing?.password) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
  }

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)

  await prisma.verificationToken.deleteMany({ where: { identifier: email } })
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: code,
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  try {
    await sendVerificationCodeEmail(email, code)
  } catch {
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
