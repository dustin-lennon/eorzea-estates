import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { estateFormSchema } from "@/lib/schemas"
import { NextResponse } from "next/server"

// Per-character housing limits (only one of each type allowed)
const SINGLE_LIMIT_TYPES = ["PRIVATE", "APARTMENT", "FC_ROOM", "FC_ESTATE"] as const

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = estateFormSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Verify the character belongs to this user and is verified
  const character = await prisma.ffxivCharacter.findFirst({
    where: { id: data.characterId, userId: session.user.id, verified: true },
  })
  if (!character) {
    return NextResponse.json(
      { error: "Character not found or not verified." },
      { status: 400 }
    )
  }

  // Enforce per-character housing limits
  if ((SINGLE_LIMIT_TYPES as readonly string[]).includes(data.type)) {
    const existing = await prisma.estate.findFirst({
      where: { characterId: data.characterId, type: data.type },
      select: { id: true },
    })
    if (existing) {
      const label = data.type.replace("_", " ").toLowerCase()
      return NextResponse.json(
        { error: `${character.characterName} already has a listing for a ${label}.` },
        { status: 409 }
      )
    }
  }

  const isVenue = data.type === "VENUE"

  const estate = await prisma.estate.create({
    data: {
      name: data.name,
      description: data.description,
      inspiration: data.inspiration ?? "",
      type: data.type,
      district: data.district ?? null,
      region: data.region,
      dataCenter: data.dataCenter,
      server: data.server,
      ward: data.ward ?? null,
      plot: data.plot ?? null,
      tags: data.tags,
      published: true,
      ownerId: session.user.id,
      characterId: data.characterId,
      images: {
        create: data.images.map((img, i) => ({
          cloudinaryUrl: img.url,
          cloudinaryPublicId: img.publicId,
          order: i,
        })),
      },
      ...(isVenue && data.venueType
        ? {
            venueDetails: {
              create: {
                venueType: data.venueType,
                timezone: data.venueTimezone ?? "UTC",
                hours: data.venueHours ?? {},
                staff: {
                  create: (data.venueStaff ?? []).map((s) => ({
                    characterName: s.characterName,
                    role: s.role,
                    linkedEstateId: s.linkedEstateId ?? null,
                  })),
                },
              },
            },
          }
        : {}),
    },
    select: { id: true },
  })

  return NextResponse.json({ id: estate.id }, { status: 201 })
}
