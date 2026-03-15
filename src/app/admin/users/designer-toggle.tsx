"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Palette } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface Props {
  userId: string
  isDesigner: boolean
}

export function DesignerToggle({ userId, isDesigner }: Props) {
  const [enabled, setEnabled] = useState(isDesigner)
  const [saving, setSaving] = useState(false)

  async function handleToggle(next: boolean) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/designer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designer: next }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to update")
      }
      setEnabled(next)
      toast.success(next ? "Designer badge granted" : "Designer badge removed")
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
        disabled={saving}
        onCheckedChange={handleToggle}
        aria-label="Designer badge"
      />
      {enabled && (
        <Palette
          className="h-4 w-4"
          style={{ stroke: "url(#designer-admin-gradient)" }}
        />
      )}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="designer-admin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
