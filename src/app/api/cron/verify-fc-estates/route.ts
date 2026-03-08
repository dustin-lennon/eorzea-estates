import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCharacterFCId, getFCMasterLodestoneId } from "@/lib/lodestone"
import {
  sendFCEstateUnpublishedEmail,
  sendFCEstateTransferInviteEmail,
} from "@/lib/email"

export const maxDuration = 300

export async function GET(req: Request) {
  const secret = req.headers.get("authorization")
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const estates = await prisma.estate.findMany({
    where: { type: "FC_ESTATE", published: true },
    select: {
      id: true,
      name: true,
      ownerId: true,
      owner: { select: { email: true, name: true } },
      character: { select: { id: true, lodestoneId: true, characterName: true } },
    },
  })

  const results = { checked: 0, transferred: 0, unpublished: 0, skipped: 0 }

  for (const estate of estates) {
    results.checked++

    if (!estate.character) {
      results.skipped++
      continue
    }

    const fcId = await getCharacterFCId(parseInt(estate.character.lodestoneId))
    if (!fcId) {
      results.skipped++
      continue
    }

    const masterLodestoneId = await getFCMasterLodestoneId(fcId)
    if (!masterLodestoneId) {
      results.skipped++
      continue
    }

    // Still the master — no action needed
    if (masterLodestoneId === estate.character.lodestoneId) continue

    // Ownership changed — unpublish the estate
    await prisma.estate.update({
      where: { id: estate.id },
      data: { published: false },
    })

    // Check if the new master is a verified user on this site
    const newMasterCharacter = await prisma.ffxivCharacter.findFirst({
      where: { lodestoneId: masterLodestoneId, verified: true },
      select: { id: true, userId: true, characterName: true, user: { select: { email: true, name: true } } },
    })

    if (newMasterCharacter) {
      // Create a pending transfer (upsert in case one already exists)
      await prisma.estatePendingTransfer.upsert({
        where: { estateId: estate.id },
        create: {
          estateId: estate.id,
          newOwnerId: newMasterCharacter.userId,
          newCharacterId: newMasterCharacter.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        update: {
          newOwnerId: newMasterCharacter.userId,
          newCharacterId: newMasterCharacter.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      const transfer = await prisma.estatePendingTransfer.findUnique({
        where: { estateId: estate.id },
        select: { token: true },
      })

      const baseUrl =
        process.env.NEXTAUTH_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
      const confirmUrl = `${baseUrl}/estate-transfer/confirm/${transfer!.token}`

      // Email new owner
      if (newMasterCharacter.user.email) {
        await sendFCEstateTransferInviteEmail({
          to: newMasterCharacter.user.email,
          newOwnerName: newMasterCharacter.user.name ?? newMasterCharacter.characterName,
          estateName: estate.name,
          previousOwnerName: estate.owner.name ?? "the previous owner",
          confirmUrl,
        })
      }

      // Email original owner
      if (estate.owner.email) {
        await sendFCEstateUnpublishedEmail({
          to: estate.owner.email,
          ownerName: estate.owner.name ?? "there",
          estateName: estate.name,
          reason: "ownership_transferred",
        })
      }

      results.transferred++
    } else {
      // New master isn't a user here — just unpublish
      if (estate.owner.email) {
        await sendFCEstateUnpublishedEmail({
          to: estate.owner.email,
          ownerName: estate.owner.name ?? "there",
          estateName: estate.name,
          reason: "no_new_owner",
        })
      }

      results.unpublished++
    }
  }

  return NextResponse.json(results)
}
