"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  characterId: string
  verified: boolean
  estateCount: number
}

export function CharacterActions({ characterId, verified, estateCount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    const warning =
      estateCount > 0
        ? `This character has ${estateCount} estate listing${estateCount !== 1 ? "s" : ""}. Removing the character will unlink them from those estates. Continue?`
        : "Remove this character from your account?"
    if (!confirm(warning)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/characters/${characterId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Character removed")
      router.refresh()
    } catch {
      toast.error("Failed to remove character")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!verified && (
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/verify">Verify</Link>
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={handleRemove}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
