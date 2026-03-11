"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center text-muted-foreground hover:text-primary transition mb-6 w-fit"
    >
      <ArrowLeft className="h-5 w-5 mr-1" />
      <span className="text-base">Back</span>
    </button>
  )
}
