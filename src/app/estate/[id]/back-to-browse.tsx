"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

export function BackToBrowse() {
  const router = useRouter()

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/directory")
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
    >
      <ChevronLeft className="h-4 w-4" />
      Browse Estates
    </button>
  )
}
