"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function SentryTestPage() {
  const [serverStatus, setServerStatus] = useState<string | null>(null)

  function triggerClientError() {
    throw new Error("Sentry client-side test error — this is intentional")
  }

  async function triggerServerError() {
    setServerStatus("Sending...")
    try {
      const res = await fetch("/api/admin/sentry-test")
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        toast.error(data.error ?? "Request failed")
      } else {
        toast.success("No error thrown — check Sentry config")
      }
    } catch {
      setServerStatus("Error thrown — check Sentry dashboard")
      toast.info("Server error triggered")
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Sentry Test</h1>
      <p className="text-sm text-muted-foreground">
        Use these buttons to trigger intentional errors and verify they appear in the Sentry dashboard.
        Errors are only captured in production builds.
      </p>

      <div className="space-y-4">
        <div className="rounded-xl border p-4 space-y-2">
          <p className="text-sm font-medium">Client-side error</p>
          <p className="text-xs text-muted-foreground">Throws an unhandled error in the browser — captured by Sentry&apos;s client SDK.</p>
          <Button variant="destructive" onClick={triggerClientError}>Trigger Client Error</Button>
        </div>

        <div className="rounded-xl border p-4 space-y-2">
          <p className="text-sm font-medium">Server-side error</p>
          <p className="text-xs text-muted-foreground">Throws an unhandled error in an API route — captured by Sentry&apos;s server SDK.</p>
          <Button variant="destructive" onClick={triggerServerError}>Trigger Server Error</Button>
          {serverStatus && <p className="text-xs text-muted-foreground">{serverStatus}</p>}
        </div>
      </div>
    </div>
  )
}
