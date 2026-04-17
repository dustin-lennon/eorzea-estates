"use client"

import { PushNotificationManager } from "@/components/push-notification-manager"
import { PresenceManager } from "@/components/presence-manager"

// ThemeProvider is intentionally NOT here — it renders an inline <script> tag for
// anti-flash and must live in a server component (layout.tsx) so React 19 doesn't
// warn about scripts inside client components.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PushNotificationManager />
      <PresenceManager />
    </>
  )
}
