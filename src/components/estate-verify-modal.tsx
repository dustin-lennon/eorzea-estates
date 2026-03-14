"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { ShieldCheck, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EstateVerifyHowTo } from "@/components/estate-verify-how-to"
import type { VerificationStatus } from "@/generated/prisma/client"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  estateId: string
  estateName: string
  estateType: string
  characterName: string
  verificationStatus: VerificationStatus | null
  modReason?: string | null
}

const INSTRUCTIONS: Record<string, string> = {
  PRIVATE:
    "Take a screenshot showing the Estate Profile panel (Owner = your character name, Address = your plot) with your character nameplate visible in the scene.",
  FC_ESTATE:
    "Take a screenshot showing the Estate Profile panel (Owner = your FC name) and the Company Profile panel (Master = your character name) simultaneously, with your character nameplate visible.",
  APARTMENT:
    "Take a screenshot of the apartment room list with your row highlighted (Occupant = your character name) and your character nameplate visible.",
  FC_ROOM:
    "Take a screenshot of the Additional Chambers list with your row highlighted (Occupant = your character name) and your character nameplate visible.",
  VENUE:
    "Take a screenshot showing the Estate Profile panel (Owner = your character name, Address = your plot) with your character nameplate visible in the scene.",
}

export function EstateVerifyModal({
  open,
  onOpenChange,
  estateId,
  estateName,
  estateType,
  verificationStatus,
  modReason,
}: Props) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  function handleClose(o: boolean) {
    if (!o) {
      setFile(null)
      setPreview(null)
    }
    onOpenChange(o)
  }

  async function handleSubmit() {
    if (!file) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("screenshot", file)
      const res = await fetch(`/api/estates/${estateId}/verify`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json() as { status?: string; error?: string; reason?: string }
      if (!res.ok) {
        toast.error(data.error ?? "Failed to submit screenshot")
        return
      }
      if (data.status === "approved") {
        toast.success("Ownership verified! You can now publish your estate.")
        handleClose(false)
      } else if (data.status === "rejected") {
        toast.error("Screenshot could not verify ownership. Check the rejection email for details.")
        handleClose(false)
      } else {
        toast.info("Screenshot submitted for review. You will be notified when reviewed.")
        handleClose(false)
      }
      router.refresh()
    } catch {
      toast.error("Failed to submit screenshot")
    } finally {
      setSubmitting(false)
    }
  }

  const instruction = INSTRUCTIONS[estateType] ?? INSTRUCTIONS.PRIVATE

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Verify Ownership — {estateName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <p className="text-sm text-muted-foreground leading-relaxed">{instruction}</p>

          <EstateVerifyHowTo estateType={estateType} />

          {/* Previous rejection reason */}
          {verificationStatus === "MOD_REJECTED" && modReason && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
              <p className="font-medium text-destructive mb-1">Previous submission rejected</p>
              <p className="text-muted-foreground">{modReason}</p>
            </div>
          )}

          {/* File drop zone */}
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {preview ? (
              <div className="relative aspect-video rounded overflow-hidden">
                <Image src={preview} alt="Screenshot preview" fill className="object-contain" />
              </div>
            ) : (
              <div className="py-6 space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop screenshot here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">Max 10 MB</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!file || submitting}>
              {submitting ? "Submitting…" : "Submit Screenshot"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
