import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { estateFormSchema } from "@/lib/schemas"
import { NextResponse } from "next/server"

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
