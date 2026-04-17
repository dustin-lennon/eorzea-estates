import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { deleteEstateImage, moveEstateImage } from "@/lib/storage"
import { estateFormSchema } from "@/lib/schemas"
import { maybeGrantPathfinder } from "@/lib/pathfinder"
import { NextResponse } from "next/server"

const editEstateSchema = estateFormSchema.omit({ characterId: true })

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
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
      size: true,
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
  const session = await auth.api.getSession({ headers: await headers() })
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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const estate = await prisma.estate.findUnique({
    where: { id, deletedAt: null },
    select: {
      ownerId: true,
      district: true,
      ward: true,
      plot: true,
      verified: true,
      character: { select: { characterName: true, server: true } },
      images: { select: { storageKey: true } },
      verification: { select: { storageKey: true } },
    },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (estate.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  // Toggle published (used by dashboard)
  if (typeof body.published === "boolean") {
    if (body.published && !estate.verified) {
      return NextResponse.json(
        { error: "Estate must be verified before publishing" },
        { status: 403 }
      )
    }
    const updated = await prisma.estate.update({
      where: { id },
      data: { published: body.published },
      select: { id: true, published: true },
    })
    if (body.published) {
      await maybeGrantPathfinder(session.user.id)
    }
    return NextResponse.json(updated)
  }

  // Full edit
  const parsed = editEstateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const isVenue = data.type === "VENUE"

  // Sync images: delete removed ones, move kept ones if location changed
  const newStorageKeys = new Set(data.images.map((img) => img.storageKey))
  const toDelete = estate.images.filter((img) => !newStorageKeys.has(img.storageKey))
  await Promise.allSettled(toDelete.map((img) => deleteEstateImage(img.storageKey)))

  const locationChanged =
    data.district !== estate.district ||
    (data.ward ?? null) !== estate.ward ||
    (data.plot ?? null) !== estate.plot

  // Reset verification if location changed
  if (locationChanged) {
    if (estate.verification?.storageKey) {
      await deleteEstateImage(estate.verification.storageKey).catch(() => undefined)
    }
    await prisma.estateVerification.deleteMany({ where: { estateId: id } })
    await prisma.estate.update({
      where: { id },
      data: { verified: false, verificationStatus: null, published: false },
    })
  }

  let finalImages = data.images
  if (locationChanged) {
    const ctx = {
      userId: session.user.id,
      characterName: estate.character?.characterName,
      server: estate.character?.server,
      district: data.district,
      ward: data.ward,
      plot: data.plot,
    }
    finalImages = await Promise.all(
      data.images.map(async (img) => {
        try {
          const moved = await moveEstateImage(img.storageKey, ctx)
          return { ...img, url: moved.url, storageKey: moved.storageKey }
        } catch {
          return img
        }
      })
    )
  }

  if (!isVenue || !data.venueType) {
    await prisma.venueDetails.deleteMany({ where: { estateId: id } })
  }

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
      size: data.size ?? null,
      subdivision: data.subdivision ?? null,
      tags: data.tags,
      images: {
        deleteMany: {},
        create: finalImages.map((img, i) => ({
          imageUrl: img.url,
          storageKey: img.storageKey,
          order: i,
        })),
      },
      ...(isVenue && data.venueType
        ? {
            venueDetails: {
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
            },
          }
        : {}),
    },
    select: { id: true },
  })

  return NextResponse.json(updated)
}
