"use client"

import { formatDistanceToNow } from "date-fns"

const ONLINE_THRESHOLD_MS = 3 * 60 * 1000 // 3 minutes

interface Props {
  lastSeenAt: string | null
  className?: string
}

export function PresenceIndicator({ lastSeenAt, className = "" }: Props) {
  if (!lastSeenAt) {
    return (
      <span className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
        Offline
      </span>
    )
  }

  const isOnline = Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS

  if (isOnline) {
    return (
      <span className={`flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
        Online
      </span>
    )
  }

  return (
    <span className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
      Last seen {formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}
    </span>
  )
}
