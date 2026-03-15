"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload, type UploadedImage } from "@/components/image-upload"
import { Pin } from "lucide-react"

interface Character {
  id: string
  characterName: string
  server: string
}

interface Props {
  estateId: string
  characters: Character[]
}

export function ClaimButton({ estateId, characters }: Props) {
  const [open, setOpen] = useState(false)
  const [characterId, setCharacterId] = useState(characters[0]?.id ?? "")
  const [images, setImages] = useState<UploadedImage[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function handleClaim() {
    if (!characterId || images.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/estates/${estateId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          screenshotUrl: images[0].url,
          storageKey: images[0].storageKey,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to submit claim")
      }
      toast.success("Claim submitted! A moderator will review your screenshot.")
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit claim")
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pin className="h-4 w-4 mr-1.5" />
        Claim this estate
      </Button>
    )
  }

  return (
    <div className="rounded-xl border p-4 space-y-4 bg-card">
      <div>
        <h3 className="font-semibold text-sm mb-1">Claim this estate</h3>
        <p className="text-xs text-muted-foreground">
          Upload a screenshot showing your character standing inside the estate. A moderator will review it and transfer ownership to you.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Your character</Label>
        <Select value={characterId} onValueChange={setCharacterId}>
          <SelectTrigger><SelectValue placeholder="Select character" /></SelectTrigger>
          <SelectContent>
            {characters.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.characterName} <span className="text-muted-foreground">({c.server})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Ownership screenshot</Label>
        <ImageUpload
          value={images}
          onChange={setImages}
          maxImages={1}
          pathContext={{ characterId }}
        />
        <p className="text-xs text-muted-foreground">One screenshot showing you are the owner (e.g. estate placard, interior with your character).</p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" disabled={submitting || !characterId || images.length === 0} onClick={handleClaim}>
          {submitting ? "Submitting…" : "Submit Claim"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}
