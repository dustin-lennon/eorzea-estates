"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
