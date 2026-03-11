"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

interface Props {
  initialValue: boolean
}

export function MaintenanceToggle({ initialValue }: Props) {
  const [enabled, setEnabled] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  async function handleToggle(value: boolean) {
    setLoading(true)
    const prev = enabled
    setEnabled(value) // optimistic
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: value }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(value ? "Maintenance mode enabled" : "Maintenance mode disabled")
    } catch {
      setEnabled(prev) // revert
      toast.error("Failed to update maintenance mode")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border p-5">
      <div className="space-y-0.5">
        <Label htmlFor="maintenance-toggle" className="text-base font-medium">
          Maintenance Mode
        </Label>
        <p className="text-sm text-muted-foreground">
          When enabled, all non-admin users see the maintenance page.
        </p>
      </div>
      <button
        id="maintenance-toggle"
        role="switch"
        aria-checked={enabled}
        disabled={loading}
        onClick={() => handleToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
          enabled ? "bg-destructive" : "bg-input"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
