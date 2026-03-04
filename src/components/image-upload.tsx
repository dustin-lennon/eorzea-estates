"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { X, GripVertical, ImagePlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface UploadedImage {
  url: string
  publicId: string
}

interface ImageUploadProps {
  value: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
}

export function ImageUpload({ value, onChange, maxImages = 10 }: ImageUploadProps) {
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
            const formData = new FormData()
            formData.append("file", file)
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.error ?? "Upload failed")
            }
            return res.json() as Promise<UploadedImage>
          })
        )
        onChange([...value, ...results])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [value, onChange, maxImages]
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
              key={img.publicId}
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
