"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  characterId: string
  verified: boolean
  estateCount: number
  hasFcEstate: boolean
}

export function CharacterActions({ characterId, verified, estateCount, hasFcEstate }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [reverifying, setReverifying] = useState(false)

  async function handleReverifyFc() {
    setReverifying(true)
    try {
      const res = await fetch(`/api/characters/${characterId}/reverify-fc`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Verification failed")
      if (data.isFcMaster) {
        toast.success(
          data.republished > 0
            ? `FC master confirmed — ${data.republished} estate${data.republished !== 1 ? "s" : ""} republished`
            : "FC master confirmed — no unpublished FC estates to restore"
        )
        router.refresh()
      } else {
        toast.error("You are no longer the FC master for this character's Free Company.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setReverifying(false)
    }
  }

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
      {verified && hasFcEstate && (
        <Button
          variant="outline"
          size="sm"
          disabled={reverifying}
          onClick={handleReverifyFc}
          title="Re-verify FC ownership"
        >
          <RefreshCw className={`h-4 w-4 ${reverifying ? "animate-spin" : ""}`} />
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
