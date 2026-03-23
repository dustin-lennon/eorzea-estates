import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
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
    return NextResponse.json({ error: "Invalid email or code" }, { status: 400 })
  }

  const { email, code } = parsed.data

  const token = await prisma.verificationToken.findFirst({
    where: { identifier: email, token: code },
  })

  if (!token || token.expires < new Date()) {
    return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
