"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

const HEARTBEAT_INTERVAL = 60_000 // 1 minute

export function PresenceManager() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    async function ping() {
      await fetch("/api/presence", { method: "POST" }).catch(() => null)
    }

    void ping()
    const interval = setInterval(ping, HEARTBEAT_INTERVAL)

    function onFocus() { void ping() }
    window.addEventListener("focus", onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
    }
  }, [session])

  return null
}
