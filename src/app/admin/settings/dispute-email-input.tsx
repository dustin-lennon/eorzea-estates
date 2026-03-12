"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Props {
  initialValue: string
}

export function DisputeEmailInput({ initialValue }: Props) {
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeEmail: value }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Dispute email updated")
    } catch {
      toast.error("Failed to update dispute email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border p-5 space-y-3">
      <div className="space-y-0.5">
        <Label htmlFor="dispute-email" className="text-base font-medium">
          Dispute Email Address
        </Label>
        <p className="text-sm text-muted-foreground">
          This address is included in moderation emails so owners can appeal decisions.
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          id="dispute-email"
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="dispute@eorzeaestates.com"
          className="max-w-sm"
        />
        <Button onClick={handleSave} disabled={loading || !value.trim()}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
