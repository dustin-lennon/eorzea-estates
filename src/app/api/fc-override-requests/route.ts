import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  characterId: z.string(),
  estateId: z.string().optional(),
  message: z.string().max(500).optional(),
  screenshotUrl: z.string().url().optional(),
  storageKey: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { characterId, estateId, message, screenshotUrl, storageKey } = parsed.data

  const character = await prisma.ffxivCharacter.findFirst({
    where: { id: characterId, userId: session.user.id, verified: true },
  })
  if (!character) {
    return NextResponse.json(
      { error: "Character not found or not verified." },
      { status: 400 }
    )
  }

  if (estateId) {
    const estate = await prisma.estate.findFirst({
      where: { id: estateId, ownerId: session.user.id, type: "FC_ESTATE", deletedAt: null },
    })
    if (!estate) {
      return NextResponse.json({ error: "Estate not found." }, { status: 400 })
    }
  }

  const existing = await prisma.fcOverrideRequest.findFirst({
    where: {
      characterId,
      status: { in: ["PENDING", "APPROVED"] },
    },
  })
  if (existing) {
    return NextResponse.json(
      { error: "An override request for this character is already pending or approved." },
      { status: 409 }
    )
  }

  const request = await prisma.fcOverrideRequest.create({
    data: {
      characterId,
      userId: session.user.id,
      estateId: estateId ?? null,
      message: message ?? null,
      screenshotUrl: screenshotUrl ?? null,
      storageKey: storageKey ?? null,
    },
  })

  return NextResponse.json(request, { status: 201 })
}
