"use client"

import { useEffect, useState } from "react"

export function UnreadBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications/unread")
        if (res.ok) {
          const data = await res.json() as { count: number }
          setCount(data.count)
        }
      } catch {
        // silently ignore
      }
    }

    void fetchCount()
    const interval = setInterval(fetchCount, 30_000)
    return () => clearInterval(interval)
  }, [])

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
      {count > 9 ? "9+" : count}
    </span>
  )
}
