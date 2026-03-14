"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  verificationId: string
}

export function VerificationActions({ verificationId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [reason, setReason] = useState("")

  async function approve() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/verification/${verificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      if (!res.ok) throw new Error()
      toast.success("Verification approved")
      router.refresh()
    } catch {
      toast.error("Failed to approve")
    } finally {
      setLoading(false)
    }
  }

  async function reject() {
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/verification/${verificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: reason.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success("Verification rejected")
      setRejectMode(false)
      setReason("")
      router.refresh()
    } catch {
      toast.error("Failed to reject")
    } finally {
      setLoading(false)
    }
  }

  if (rejectMode) {
    return (
      <div className="space-y-2 min-w-48">
        <Textarea
          placeholder="Rejection reason…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="text-sm"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={reject} disabled={loading}>
            Confirm Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setRejectMode(false)
              setReason("")
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
        onClick={() => setRejectMode(true)}
        disabled={loading}
      >
        <X className="h-4 w-4 mr-1" />
        Reject
      </Button>
    </div>
  )
}
