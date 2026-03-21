"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationManager() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    if (!VAPID_PUBLIC_KEY) return

    async function subscribe() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        await navigator.serviceWorker.ready

        const existing = await registration.pushManager.getSubscription()
        if (existing) return // already subscribed

        const permission = await Notification.requestPermission()
        if (permission !== "granted") return

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
        })

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
            },
          }),
        })
      } catch {
        // Silently ignore — push is best-effort
      }
    }

    void subscribe()
  }, [session])

  return null
}
