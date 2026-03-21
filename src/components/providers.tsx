"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { PushNotificationManager } from "@/components/push-notification-manager"
import { PresenceManager } from "@/components/presence-manager"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <PushNotificationManager />
        <PresenceManager />
      </ThemeProvider>
    </SessionProvider>
  )
}
