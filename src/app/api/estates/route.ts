import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { estateFormSchema, designerEstateFormSchema } from "@/lib/schemas"
import { getRegionByDataCenter } from "@/lib/ffxiv-data"
import { getCharacterFCId, getFCMasterLodestoneId } from "@/lib/lodestone"
import { NextResponse } from "next/server"

// Per-character housing limits (only one of each type allowed)
const SINGLE_LIMIT_TYPES = ["PRIVATE", "APARTMENT", "FC_ROOM", "FC_ESTATE"] as const

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  // Designer submission path — only if explicitly flagged AND no characterId (standard form always includes characterId)
  if (body.designerSubmission === true && !body.characterId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { designer: true },
    })
    if (!dbUser?.designer) {
      return NextResponse.json({ error: "Designer status required" }, { status: 403 })
    }

    const parsed = designerEstateFormSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const region = getRegionByDataCenter(data.dataCenter)
    const isVenue = data.type === "VENUE"

    // Direct attribution by ID (designer selected from conflict picker)
    if (body.targetEstateId) {
      const target = await prisma.estate.findFirst({
        where: { id: body.targetEstateId, published: true, deletedAt: null },
        select: { id: true, designerId: true },
      })
      if (!target) {
        return NextResponse.json({ error: "Estate not found." }, { status: 404 })
      }
      if (target.designerId) {
        return NextResponse.json(
          { error: "A designer has already been attributed to this listing." },
          { status: 409 }
        )
      }
      await prisma.estate.update({
        where: { id: target.id },
        data: { designerId: session.user.id },
      })
      return NextResponse.json({ id: target.id, attributed: true }, { status: 200 })
    }

    // Location conflict check (skip if designer chose to create new anyway)
    if (!body.forceCreate && data.ward && data.plot && data.district) {
      const unattributed = await prisma.estate.findMany({
        where: {
          server: data.server,
          district: data.district,
          ward: data.ward,
          plot: data.plot,
          published: true,
          deletedAt: null,
          designerId: null,
        },
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              name: true,
              characters: {
                where: { verified: true },
                select: { characterName: true },
                take: 1,
              },
            },
          },
        },
      })

      if (unattributed.length > 1) {
        return NextResponse.json({
          conflicts: unattributed.map((e) => ({
            id: e.id,
            name: e.name,
            ownerName: e.owner.characters[0]?.characterName ?? e.owner.name,
          })),
        }, { status: 200 })
      }

      if (unattributed.length === 1) {
        await prisma.estate.update({
          where: { id: unattributed[0].id },
          data: { designerId: session.user.id },
        })
        return NextResponse.json({ id: unattributed[0].id, attributed: true }, { status: 200 })
      }

      // All existing listings at this location already have a designer
      const anyAttributed = await prisma.estate.findFirst({
        where: {
          server: data.server,
          district: data.district,
          ward: data.ward,
          plot: data.plot,
          published: true,
          deletedAt: null,
          designerId: { not: null },
        },
        select: { id: true },
      })
      if (anyAttributed) {
        return NextResponse.json(
          { error: "A designer has already been attributed to all listings at this location." },
          { status: 409 }
        )
      }
    }

    const estate = await prisma.estate.create({
      data: {
        name: data.name,
        description: data.description,
        inspiration: data.inspiration ?? "",
        type: data.type,
        district: data.district ?? null,
        region,
        dataCenter: data.dataCenter,
        server: data.server,
        ward: data.ward ?? null,
        plot: data.plot ?? null,
        room: data.room ?? null,
        size: data.size ?? null,
        tags: data.tags,
        published: true,
        ownerId: session.user.id,
        designerId: session.user.id,
        images: {
          create: data.images.map((img, i) => ({
            imageUrl: img.url,
            storageKey: img.storageKey,
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
                      linkedCharacterId: s.linkedCharacterId ?? null,
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

  const parsed = estateFormSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Verify the character belongs to this user
  const character = await prisma.ffxivCharacter.findFirst({
    where: { id: data.characterId, userId: session.user.id },
  })
  if (!character) {
    return NextResponse.json(
      { error: { message: "Character not found." } },
      { status: 400 }
    )
  }

  // Enforce FC estate type restrictions via Lodestone
  if (data.type === "FC_ESTATE" || data.type === "FC_ROOM") {
    const fcId = await getCharacterFCId(parseInt(character.lodestoneId)).catch(() => null)
    if (!fcId) {
      return NextResponse.json(
        { error: { message: "Character is not a member of a Free Company." } },
        { status: 403 }
      )
    }
    if (data.type === "FC_ESTATE") {
      const masterId = await getFCMasterLodestoneId(fcId).catch(() => null)
      if (masterId !== character.lodestoneId) {
        const activeOverride = await prisma.fcOverride.findFirst({
          where: { characterId: character.id, revokedAt: null },
        })
        if (!activeOverride || activeOverride.fcId !== fcId) {
          return NextResponse.json(
            { error: { message: "Character is not the owner of a Free Company." } },
            { status: 403 }
          )
        }
      }
    }
  }

  // Enforce per-character housing limits
  if ((SINGLE_LIMIT_TYPES as readonly string[]).includes(data.type)) {
    const existing = await prisma.estate.findFirst({
      where: { characterId: data.characterId, type: data.type, deletedAt: null },
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
      region: getRegionByDataCenter(character.dataCenter),
      dataCenter: character.dataCenter,
      server: character.server,
      ward: data.ward ?? null,
      plot: data.plot ?? null,
      room: data.room ?? null,
      size: data.size ?? null,
      tags: data.tags,
      published: false,
      ownerId: session.user.id,
      characterId: data.characterId,
      images: {
        create: data.images.map((img, i) => ({
          imageUrl: img.url,
          storageKey: img.storageKey,
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
                    linkedCharacterId: s.linkedCharacterId ?? null,
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
