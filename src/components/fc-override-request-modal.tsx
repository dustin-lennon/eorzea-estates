"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ImageUpload, type UploadedImage } from "@/components/image-upload"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  characterId: string
  characterName: string
  estateId?: string
}

export function FcOverrideRequestModal({
  open,
  onOpenChange,
  characterId,
  characterName,
  estateId,
}: Props) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [screenshots, setScreenshots] = useState<UploadedImage[]>([])
  const [submitting, setSubmitting] = useState(false)

  function handleClose(o: boolean) {
    if (!o) {
      setMessage("")
      setScreenshots([])
    }
    onOpenChange(o)
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch("/api/fc-override-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          estateId,
          message: message.trim() || undefined,
          screenshotUrl: screenshots[0]?.url,
          storageKey: screenshots[0]?.storageKey,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to submit request")
      }
      toast.success("Override request submitted. You will be notified once reviewed.")
      handleClose(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Request Officer Override
          </DialogTitle>
          <DialogDescription>
            Request admin approval for <strong>{characterName}</strong> to submit an FC estate
            listing on behalf of your Free Company. This is for situations where the FC leader is
            unavailable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Supporting screenshot{" "}
              <span className="text-muted-foreground font-normal">(recommended)</span>
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Take a screenshot showing your character nameplate visible in the scene alongside the
              FC member roster, so an admin can confirm your membership and rank.
            </p>
            <ImageUpload
              value={screenshots}
              onChange={setScreenshots}
              maxImages={1}
              pathContext={{ characterId }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="message"
              placeholder="e.g. FC leader has been inactive for several months and is unreachable."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
