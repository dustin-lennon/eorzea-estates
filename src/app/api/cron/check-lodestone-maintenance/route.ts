import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { fetchMaintenanceEntries, parseMaintenanceWindow } from "@/lib/lodestone-rss"

export const maxDuration = 120

export async function GET(req: Request) {
  const secret = req.headers.get("authorization")
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const entries = await fetchMaintenanceEntries()
  const results = { processed: 0, skipped: 0, windowsUpdated: 0, active: false }

  for (const entry of entries) {
    const window = await parseMaintenanceWindow(entry.title, entry.text).catch(() => null)
    if (!window) {
      results.skipped++
      continue
    }

    await prisma.lodestoneMaintenanceWindow.upsert({
      where: { announcementId: entry.announcementId },
      create: {
        announcementId: entry.announcementId,
        title: entry.title,
        rawText: entry.text,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
      },
      update: {
        title: entry.title,
        rawText: entry.text,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
      },
    })

    results.processed++
    results.windowsUpdated++
  }

  const now = new Date()
  const activeWindow = await prisma.lodestoneMaintenanceWindow.findFirst({
    where: { startsAt: { lte: now }, endsAt: { gte: now } },
  })
  results.active = activeWindow !== null

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", lodestoneMaintenanceMode: results.active },
    update: { lodestoneMaintenanceMode: results.active },
  })

  return NextResponse.json(results)
}
