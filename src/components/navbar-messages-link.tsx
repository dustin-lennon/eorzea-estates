"use client"

import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { UnreadBadge } from "@/components/unread-badge"

export function NavbarMessagesLink() {
  return (
    <Link
      href="/messages"
      className="relative inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Messages"
    >
      <MessageSquare className="h-5 w-5" />
      <span className="hidden sm:inline">Messages</span>
      <UnreadBadge />
    </Link>
  )
}
