"use client"

import { useState } from "react"
import Image from "next/image"

interface Props {
  src: string | null | undefined
  name: string | null | undefined
  size?: number
  className?: string
}

export function UserAvatar({ src, name, size = 32, className = "" }: Props) {
  const [error, setError] = useState(false)

  if (src && !error) {
    return (
      <Image
        src={src}
        alt={name ?? "User"}
        width={size}
        height={size}
        className={`rounded-full shrink-0 ${className}`}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold ${className}`}
      style={{ width: size, height: size }}
    >
      {name?.charAt(0).toUpperCase() ?? "?"}
    </div>
  )
}
