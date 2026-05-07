import prisma from "@/lib/prisma"
import { format } from "date-fns"

function formatUtc(date: Date): string {
  return format(date, "MMM d, yyyy h:mm a") + " UTC"
}

function formatEt(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function formatWindow(date: Date): string {
  return `${formatUtc(date)} / ${formatEt(date)}`
}

function WindowRow({
  window,
  now,
}: {
  window: { id: string; title: string; startsAt: Date; endsAt: Date; announcementId: string }
  now: Date
}) {
  const isActive = window.startsAt <= now && window.endsAt >= now
  const isUpcoming = window.startsAt > now

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4 text-sm">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isActive && (
            <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
              Active
            </span>
          )}
          {isUpcoming && (
            <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Upcoming
            </span>
          )}
          <a
            href={window.announcementId}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline truncate"
          >
            {window.title}
          </a>
        </div>
        <p className="text-muted-foreground">
          {formatWindow(window.startsAt)} &rarr; {formatWindow(window.endsAt)}
        </p>
      </div>
    </div>
  )
}

export async function MaintenanceWindows() {
  const windows = await prisma.lodestoneMaintenanceWindow.findMany({
    orderBy: { startsAt: "desc" },
    take: 30,
  })

  const now = new Date()
  const upcoming = windows.filter((w) => w.endsAt >= now).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
  const past = windows.filter((w) => w.endsAt < now)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Lodestone Maintenance Windows</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sourced from Lodestone RSS. Auto-refreshed hourly. Only windows affecting character lookup are shown.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Upcoming / Active</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border p-4">No upcoming maintenance detected.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((w) => (
              <WindowRow key={w.id} window={w} now={now} />
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Past</h3>
          <div className="space-y-2">
            {past.slice(0, 10).map((w) => (
              <WindowRow key={w.id} window={w} now={now} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
