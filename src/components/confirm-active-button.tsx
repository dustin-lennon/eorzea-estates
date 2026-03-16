"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ConfirmActiveButton({ estateId }: { estateId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      const res = await fetch(`/api/estates/${estateId}/confirm-active`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast.success("Listing confirmed active")
      router.refresh()
    } catch {
      toast.error("Failed to confirm listing")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleConfirm} disabled={loading}>
      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
      Confirm Still Active
    </Button>
  )
}
