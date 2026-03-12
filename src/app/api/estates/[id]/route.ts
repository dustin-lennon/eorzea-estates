import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { deleteEstateImage } from "@/lib/storage"
import { estateFormSchema } from "@/lib/schemas"
import { NextResponse } from "next/server"

const editEstateSchema = estateFormSchema.omit({ characterId: true })

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const estate = await prisma.estate.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      inspiration: true,
      type: true,
      district: true,
      ward: true,
      plot: true,
      room: true,
      tags: true,
      published: true,
      characterId: true,
      ownerId: true,
      images: { orderBy: { order: "asc" }, select: { imageUrl: true, storageKey: true } },
      venueDetails: {
        select: {
          venueType: true,
          timezone: true,
          hours: true,
          staff: { select: { characterName: true, role: true, linkedCharacterId: true } },
        },
      },
    },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (estate.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(estate)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const estate = await prisma.estate.findUnique({
    where: { id, deletedAt: null },
    select: { ownerId: true, images: { select: { storageKey: true } } },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (estate.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Delete images from storage
  await Promise.allSettled(estate.images.map((img: { storageKey: string }) => deleteEstateImage(img.storageKey)))

  await prisma.estate.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const estate = await prisma.estate.findUnique({
    where: { id, deletedAt: null },
    select: { ownerId: true },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (estate.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  // Toggle published (used by dashboard)
  if (typeof body.published === "boolean") {
    const updated = await prisma.estate.update({
      where: { id },
      data: { published: body.published },
      select: { id: true, published: true },
    })
    return NextResponse.json(updated)
  }

  // Full edit
  const parsed = editEstateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const isVenue = data.type === "VENUE"

  // Sync images: delete removed ones from storage, then replace all DB records
  const existing = await prisma.estate.findUnique({
    where: { id },
    select: { images: { select: { storageKey: true } } },
  })
  const newStorageKeys = new Set(data.images.map((img) => img.storageKey))
  const toDelete = (existing?.images ?? []).filter((img) => !newStorageKeys.has(img.storageKey))
  await Promise.allSettled(toDelete.map((img) => deleteEstateImage(img.storageKey)))

  const updated = await prisma.estate.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      inspiration: data.inspiration ?? "",
      type: data.type,
      district: data.district ?? null,
      ward: data.ward ?? null,
      plot: data.plot ?? null,
      room: data.room ?? null,
      tags: data.tags,
      images: {
        deleteMany: {},
        create: data.images.map((img, i) => ({
          imageUrl: img.url,
          storageKey: img.storageKey,
          order: i,
        })),
      },
      venueDetails: isVenue && data.venueType
        ? {
            upsert: {
              create: {
                venueType: data.venueType,
                timezone: data.venueTimezone ?? "UTC",
                hours: data.venueHours ?? {},
                staff: {
                  create: (data.venueStaff ?? []).map((s) => ({
                    characterName: s.characterName,
                    role: s.role,
                    linkedCharacterId: s.linkedCharacterId ?? null,
                  })),
                },
              },
              update: {
                venueType: data.venueType,
                timezone: data.venueTimezone ?? "UTC",
                hours: data.venueHours ?? {},
                staff: {
                  deleteMany: {},
                  create: (data.venueStaff ?? []).map((s) => ({
                    characterName: s.characterName,
                    role: s.role,
                    linkedCharacterId: s.linkedCharacterId ?? null,
                  })),
                },
              },
            },
          }
        : { delete: true },
    },
    select: { id: true },
  })

  return NextResponse.json(updated)
}
