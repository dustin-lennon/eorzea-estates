"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  requestId: string
}

export function FcOverrideRequestActions({ requestId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [denyMode, setDenyMode] = useState(false)
  const [adminNote, setAdminNote] = useState("")

  async function approve() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/fc-override-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to approve")
      }
      toast.success("Override approved")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve")
    } finally {
      setLoading(false)
    }
  }

  async function deny() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/fc-override-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deny", adminNote: adminNote.trim() || undefined }),
      })
      if (!res.ok) throw new Error()
      toast.success("Override denied")
      setDenyMode(false)
      setAdminNote("")
      router.refresh()
    } catch {
      toast.error("Failed to deny")
    } finally {
      setLoading(false)
    }
  }

  if (denyMode) {
    return (
      <div className="space-y-2 min-w-48">
        <Textarea
          placeholder="Note for user (optional)…"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          rows={3}
          className="text-sm"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={deny} disabled={loading}>
            Confirm Deny
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDenyMode(false)
              setAdminNote("")
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={approve} disabled={loading}>
        <Check className="h-4 w-4 mr-1" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => setDenyMode(true)}
        disabled={loading}
      >
        <X className="h-4 w-4 mr-1" />
        Deny
      </Button>
    </div>
  )
}
