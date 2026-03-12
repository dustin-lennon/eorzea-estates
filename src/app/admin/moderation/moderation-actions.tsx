"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface Props {
  estateId: string
  showRestore?: boolean
}

export function ModerationActions({ estateId, showRestore }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(action: "approve" | "reject" | "remove" | "restore") {
    setLoading(action)
    try {
      const res = await fetch(`/api/moderation/${estateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error("Failed")
      const labels: Record<string, string> = {
        approve: "Report dismissed",
        reject: "Estate unpublished",
        remove: "Estate removed",
        restore: "Estate restored",
      }
      toast.success(labels[action])
      router.refresh()
    } catch {
      toast.error("Action failed")
    } finally {
      setLoading(null)
    }
  }

  if (showRestore) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
        disabled={!!loading}
        onClick={() => handleAction("restore")}
      >
        {loading === "restore" ? "..." : "Restore"}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
        disabled={!!loading}
        onClick={() => handleAction("approve")}
      >
        {loading === "approve" ? "..." : "Dismiss"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
        disabled={!!loading}
        onClick={() => handleAction("reject")}
      >
        {loading === "reject" ? "..." : "Unpublish"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={!!loading}
        onClick={() => handleAction("remove")}
      >
        {loading === "remove" ? "..." : "Remove"}
      </Button>
    </div>
  )
}
