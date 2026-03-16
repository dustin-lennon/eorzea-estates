"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { X, GripVertical, ImagePlus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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

export interface UploadedImage {
  url: string
  storageKey: string
}

export interface ImagePathContext {
  characterId?: string
  district?: string
  ward?: number
  plot?: number
}

interface ImageUploadProps {
  value: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
  pathContext?: ImagePathContext
}

export function ImageUpload({ value, onChange, maxImages = 50, pathContext }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const remaining = maxImages - value.length
      const toUpload = files.slice(0, remaining)

      if (toUpload.length === 0) {
        toast.error(`Maximum ${maxImages} images allowed`)
        return
      }

      setUploading(true)
      try {
        const results = await Promise.all(
          toUpload.map(async (file) => {
            const compressed = await compressImage(file)

            const signRes = await fetch("/api/upload/sign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                characterId: pathContext?.characterId,
                district: pathContext?.district,
                ward: pathContext?.ward,
                plot: pathContext?.plot,
              }),
            })
            if (!signRes.ok) {
              const err = await signRes.json()
              throw new Error(err.error ?? "Upload failed")
            }
            const { signedUrl, storageKey, publicUrl } = await signRes.json()

            const uploadRes = await fetch(signedUrl, {
              method: "PUT",
              body: compressed,
              headers: { "Content-Type": "image/webp" },
            })
            if (!uploadRes.ok) throw new Error("Upload failed")

            return { url: publicUrl, storageKey } as UploadedImage
          })
        )
        onChange([...value, ...results])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [value, onChange, maxImages, pathContext]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) uploadFiles(files)
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
    if (files.length) uploadFiles(files)
  }

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleDragStart = (index: number) => setDraggingIndex(index)

  const handleDragEnter = (index: number) => {
    if (draggingIndex === null || draggingIndex === index) return
    const updated = [...value]
    const [moved] = updated.splice(draggingIndex, 1)
    updated.splice(index, 0, moved)
    setDraggingIndex(index)
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((img, index) => (
            <div
              key={img.storageKey}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={() => setDraggingIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "relative group aspect-video rounded-lg overflow-hidden border bg-muted cursor-grab active:cursor-grabbing",
                draggingIndex === index && "opacity-50"
              )}
            >
              <Image src={img.url} alt={`Screenshot ${index + 1}`} fill className="object-cover" />
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-1 right-1 bg-black/50 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleInputChange}
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Uploading...</p>
              </>
            ) : (
              <>
                <ImagePlus className="h-8 w-8" />
                <p className="text-sm font-medium">Click or drag to upload screenshots</p>
                <p className="text-xs">PNG, JPG, WebP up to 10 MB · {value.length}/{maxImages} uploaded</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
