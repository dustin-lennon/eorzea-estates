"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface Props {
  claimId: string
}

export function ClaimActions({ claimId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)

  async function handle(action: "approve" | "reject") {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/claim-requests/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(action === "approve" ? "Claim approved — ownership transferred" : "Claim rejected")
      router.refresh()
    } catch {
      toast.error("Action failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={!!loading} onClick={() => handle("approve")}>
        {loading === "approve" ? "…" : "Approve"}
      </Button>
      <Button size="sm" variant="destructive" disabled={!!loading} onClick={() => handle("reject")}>
        {loading === "reject" ? "…" : "Reject"}
      </Button>
    </div>
  )
}
