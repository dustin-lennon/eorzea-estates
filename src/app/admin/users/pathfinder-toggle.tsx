"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Compass } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface Props {
  userId: string
  isPathfinder: boolean
  atLimit: boolean
}

export function PathfinderToggle({ userId, isPathfinder, atLimit }: Props) {
  const [enabled, setEnabled] = useState(isPathfinder)
  const [saving, setSaving] = useState(false)

  async function handleToggle(next: boolean) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/pathfinder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathfinder: next }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to update")
      }
      setEnabled(next)
      toast.success(next ? "Pathfinder badge granted" : "Pathfinder badge removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        disabled={saving || (atLimit && !enabled)}
        onCheckedChange={handleToggle}
        aria-label="Pathfinder badge"
      />
      {enabled && (
        <Compass
          className="h-4 w-4"
          style={{ stroke: "url(#pf-admin-gradient)" }}
        />
      )}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="pf-admin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
