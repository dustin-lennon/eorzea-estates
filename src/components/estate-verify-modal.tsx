"use client"

import { useState, useRef } from "react"

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const MAX_W = 1920
  const MAX_H = 1080
  let w = bitmap.width
  let h = bitmap.height
  if (w > MAX_W || h > MAX_H) {
    const scale = Math.min(MAX_W / w, MAX_H / h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
      "image/webp",
      0.85
    )
  })
}
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
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append("screenshot", new File([compressed], "screenshot.webp", { type: "image/webp" }))
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

          {/* Officer override hint for FC estates */}
          {estateType === "FC_ESTATE" && verificationStatus === "MOD_REJECTED" && (
            <p className="text-xs text-muted-foreground">
              If you are an FC officer and the leader is unavailable, you can request an admin
              override from your dashboard.
            </p>
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
                <p className="text-xs text-muted-foreground">PNG, JPG, WebP — compressed automatically</p>
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
