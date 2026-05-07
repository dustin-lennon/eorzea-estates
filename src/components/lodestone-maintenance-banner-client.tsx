"use client"

import { useEffect, useState } from "react"

function formatUtc(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }) + " UTC"
}

interface Props {
  initialVisible: boolean
  initialIsActive: boolean
  endsAt: string | null
  startsAt: string | null
}

export function LodestoneMaintenanceBannerClient({ initialVisible, initialIsActive, endsAt, startsAt }: Props) {
  const [visible, setVisible] = useState(initialVisible)
  const [isActive, setIsActive] = useState(initialIsActive)

  useEffect(() => {
    function handler(e: Event) {
      const { active } = (e as CustomEvent<{ active: boolean }>).detail
      // keep visible if there's a scheduled window regardless of manual override
      setVisible(active || !!startsAt)
      setIsActive(active || (!!startsAt && new Date(startsAt) <= new Date()))
    }
    window.addEventListener("lodestone-maintenance-change", handler)
    return () => window.removeEventListener("lodestone-maintenance-change", handler)
  }, [startsAt])

  if (!visible) return null

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2.5 text-sm text-yellow-700 dark:text-yellow-400">
      <div className="container mx-auto max-w-7xl flex items-center justify-center gap-2">
        <span className="shrink-0">⚠</span>
        <span>
          {isActive ? (
            <>
              <strong>Lodestone maintenance in progress</strong> — character verification is temporarily unavailable.
              {endsAt && <> Expected to end {formatUtc(new Date(endsAt))}.</>}
            </>
          ) : (
            startsAt && endsAt && (
              <>
                <strong>Scheduled Lodestone maintenance</strong> — character verification will be unavailable
                from {formatUtc(new Date(startsAt))} to {formatUtc(new Date(endsAt))}.
              </>
            )
          )}
        </span>
      </div>
    </div>
  )
}
