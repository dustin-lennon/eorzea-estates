"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

interface Props {
  initialValue: boolean
}

export function LodestoneMaintenanceToggle({ initialValue }: Props) {
  const router = useRouter()
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
        body: JSON.stringify({ lodestoneMaintenanceMode: value }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(value ? "Lodestone maintenance mode enabled" : "Lodestone maintenance mode disabled")
      window.dispatchEvent(new CustomEvent("lodestone-maintenance-change", { detail: { active: value } }))
      router.refresh()
    } catch {
      setEnabled(prev) // revert
      toast.error("Failed to update Lodestone maintenance mode")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border p-5">
      <div className="space-y-0.5">
        <Label htmlFor="lodestone-maintenance-toggle" className="text-base font-medium">
          Lodestone Maintenance Mode
        </Label>
        <p className="text-sm text-muted-foreground">
          Disables character verification while Lodestone is unavailable. Also use this to simulate maintenance in development.
        </p>
      </div>
      <button
        id="lodestone-maintenance-toggle"
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
