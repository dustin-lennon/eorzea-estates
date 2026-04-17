import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { deleteEstateImage } from "@/lib/storage"
import { NextResponse } from "next/server"

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  // Gather all storage keys before deletion
  const estates = await prisma.estate.findMany({
    where: { ownerId: userId },
    select: {
      images: { select: { storageKey: true } },
      verification: { select: { storageKey: true } },
    },
  })

  const storageKeys: string[] = []
  for (const estate of estates) {
    for (const img of estate.images) storageKeys.push(img.storageKey)
    if (estate.verification?.storageKey) storageKeys.push(estate.verification.storageKey)
  }

  // Delete images from storage (best-effort)
  await Promise.allSettled(storageKeys.map((key) => deleteEstateImage(key)))

  // Delete the user — cascades handle all DB rows (including sessions)
  await prisma.user.delete({ where: { id: userId } })

  return NextResponse.json({ success: true })
}
