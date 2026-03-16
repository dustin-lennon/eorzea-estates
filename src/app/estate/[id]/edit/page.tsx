import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getCharacterFCId, getFCMasterLodestoneId } from "@/lib/lodestone"
import { EstateSubmitForm } from "@/app/submit/estate-submit-form"
import type { EstateFormValues } from "@/lib/schemas"
import type { z } from "zod"
import { estateFormSchema } from "@/lib/schemas"

export const metadata: Metadata = { title: "Edit Estate" }

type EstateFormInput = z.input<typeof estateFormSchema>

export default async function EditEstatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [estate, rawCharacters] = await prisma.$transaction([
    prisma.estate.findUnique({
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
        subdivision: true,
        tags: true,
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
    }),
    prisma.ffxivCharacter.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, characterName: true, server: true, lodestoneId: true },
    }),
  ])

  if (!estate) notFound()
  if (estate.ownerId !== session.user.id) redirect("/")

  const characters = await Promise.all(
    rawCharacters.map(async (char) => {
      const fcId = await getCharacterFCId(parseInt(char.lodestoneId)).catch(() => null)
      let isFcOwner = false
      if (fcId) {
        const masterId = await getFCMasterLodestoneId(fcId).catch(() => null)
        isFcOwner = masterId === char.lodestoneId
      }
      return {
        id: char.id,
        characterName: char.characterName,
        server: char.server,
        isFcMember: fcId !== null,
        isFcOwner,
      }
    })
  )

  const defaultValues: Partial<EstateFormInput> = {
    characterId: estate.characterId ?? "",
    name: estate.name,
    description: estate.description,
    inspiration: estate.inspiration ?? "",
    type: estate.type as EstateFormValues["type"],
    district: (estate.district ?? undefined) as EstateFormValues["district"],
    ward: estate.ward ?? undefined,
    plot: estate.plot ?? undefined,
    room: estate.room ?? undefined,
    subdivision: (estate.subdivision as EstateFormValues["subdivision"]) ?? undefined,
    tags: estate.tags,
    images: estate.images.map((img) => ({
      url: img.imageUrl,
      storageKey: img.storageKey,
    })),
    ...(estate.venueDetails
      ? {
          venueType: estate.venueDetails.venueType as EstateFormValues["venueType"],
          venueTimezone: estate.venueDetails.timezone,
          venueHours: estate.venueDetails.hours as EstateFormValues["venueHours"],
          venueStaff: estate.venueDetails.staff.map((s) => ({
            characterName: s.characterName,
            role: s.role,
            linkedCharacterId: s.linkedCharacterId ?? "",
          })),
        }
      : {
          venueStaff: [],
          venueTimezone: "UTC",
        }),
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Estate</h1>
        <p className="text-muted-foreground mt-1">
          Update your estate listing. All fields marked with * are required.
        </p>
      </div>
      <EstateSubmitForm
        characters={characters}
        estateId={id}
        defaultValues={defaultValues}
      />
    </div>
  )
}
