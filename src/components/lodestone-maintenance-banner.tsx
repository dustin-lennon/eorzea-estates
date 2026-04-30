import prisma from "@/lib/prisma"
import { format } from "date-fns"

function formatUtc(date: Date): string {
  return format(date, "MMM d 'at' h:mm a") + " UTC"
}

export async function LodestoneMaintenanceBanner() {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  let window: { title: string; startsAt: Date; endsAt: Date } | null = null
  let manualOverride = false
  try {
    const [win, settings] = await Promise.all([
      prisma.lodestoneMaintenanceWindow.findFirst({
        where: { startsAt: { lte: in24h }, endsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        select: { title: true, startsAt: true, endsAt: true },
      }),
      prisma.siteSettings.findUnique({ where: { id: "singleton" }, select: { lodestoneMaintenanceMode: true } }),
    ])
    window = win
    manualOverride = settings?.lodestoneMaintenanceMode ?? false
  } catch {
    return null
  }

  if (!window && !manualOverride) return null

  const isActive = manualOverride || (window !== null && window.startsAt <= now)

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2.5 text-sm text-yellow-700 dark:text-yellow-400">
      <div className="container mx-auto max-w-7xl flex items-center justify-center gap-2">
        <span className="shrink-0">⚠</span>
        <span>
          {isActive ? (
            <>
              <strong>Lodestone maintenance in progress</strong> — character verification is temporarily unavailable.
              {window && <> Expected to end {formatUtc(window.endsAt)}.</>}
            </>
          ) : (
            window && (
              <>
                <strong>Scheduled Lodestone maintenance</strong> — character verification will be unavailable
                from {formatUtc(window.startsAt)} to {formatUtc(window.endsAt)}.
              </>
            )
          )}
        </span>
      </div>
    </div>
  )
}
