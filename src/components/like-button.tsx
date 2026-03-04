"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  estateId: string
  initialLiked: boolean
  initialCount: number
  isLoggedIn: boolean
}

export function LikeButton({ estateId, initialLiked, initialCount, isLoggedIn }: LikeButtonProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/likes/${estateId}`, { method: "POST" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLiked(data.liked)
      setCount((c) => c + (data.liked ? 1 : -1))
    } catch {
      toast.error("Failed to update like")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={cn("gap-1.5", liked && "border-red-400 text-red-500 hover:text-red-600")}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      {count}
    </Button>
  )
}
