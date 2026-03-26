"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

interface Props {
  initialAvatarUrl: string | null
  fallbackAvatarUrl: string | null
}

export function AvatarSettings({ initialAvatarUrl, fallbackAvatarUrl }: Props) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const displayName = session?.user?.name ?? ""
  const avatarSrc = previewUrl ?? fallbackAvatarUrl ?? undefined

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 5 MB")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/avatar", { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Upload failed")
      }
      const { url } = await res.json()
      setPreviewUrl(url)
      await update()
      router.refresh()
      toast.success("Profile picture updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      const res = await fetch("/api/upload/avatar", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to remove avatar")
      setPreviewUrl(null)
      await update()
      router.refresh()
      toast.success("Profile picture removed")
    } catch {
      toast.error("Failed to remove profile picture")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-16 w-16 shrink-0">
        <AvatarImage src={avatarSrc} alt={displayName} />
        <AvatarFallback className="text-xl">
          {displayName.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading || removing}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading ? "Uploading…" : "Upload Photo"}
          </Button>

          {previewUrl && (
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading || removing}
              onClick={handleRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              {removing ? "Removing…" : "Remove"}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Max 5 MB. JPG, PNG, or WebP. Replaces your Lodestone or Discord avatar.
        </p>
      </div>
    </div>
  )
}
