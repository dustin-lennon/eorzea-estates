"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Props {
  estateId: string
  initialFlagged: boolean
}

export function FlagButton({ estateId, initialFlagged }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [flagged, setFlagged] = useState(initialFlagged)

  async function handleSubmit() {
    if (!reason.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/flag/${estateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to flag")
      }
      setFlagged(true)
      setOpen(false)
      setReason("")
      toast.success("Estate reported. Our moderators will review it.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to report")
    } finally {
      setLoading(false)
    }
  }

  if (flagged) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Flag className="h-3.5 w-3.5" />
        Reported
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        <Flag className="h-3.5 w-3.5" />
        Report
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this estate</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="flag-reason">Reason</Label>
            <Textarea
              id="flag-reason"
              placeholder="Describe why this listing is inappropriate or violates the rules..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={loading || !reason.trim()}
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
