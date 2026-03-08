"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface Props {
  token: string
  estateId: string
}

export function AcceptTransferButton({ token, estateId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAccept() {
    setLoading(true)
    try {
      const res = await fetch(`/api/estate-transfer/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Transfer failed")
      }

      toast.success("Transfer accepted! Your estate is now published.")
      router.push(`/estate/${estateId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleAccept} disabled={loading} className="w-full">
      {loading ? "Processing..." : "Accept Transfer & Republish Estate"}
    </Button>
  )
}
