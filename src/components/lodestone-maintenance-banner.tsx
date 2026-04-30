import prisma from "@/lib/prisma"
import { LodestoneMaintenanceBannerClient } from "./lodestone-maintenance-banner-client"

export async function LodestoneMaintenanceBanner() {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  let win: { title: string; startsAt: Date; endsAt: Date } | null = null
  let manualOverride = false
  try {
    const [window, settings] = await Promise.all([
      prisma.lodestoneMaintenanceWindow.findFirst({
        where: { startsAt: { lte: in24h }, endsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        select: { title: true, startsAt: true, endsAt: true },
      }),
      prisma.siteSettings.findUnique({ where: { id: "singleton" }, select: { lodestoneMaintenanceMode: true } }),
    ])
    win = window
    manualOverride = settings?.lodestoneMaintenanceMode ?? false
  } catch {
    return null
  }

  const visible = !!win || manualOverride
  const isActive = manualOverride || (win !== null && win.startsAt <= now)

  return (
    <LodestoneMaintenanceBannerClient
      initialVisible={visible}
      initialIsActive={isActive}
      endsAt={win?.endsAt?.toISOString() ?? null}
      startsAt={win?.startsAt?.toISOString() ?? null}
    />
  )
}
