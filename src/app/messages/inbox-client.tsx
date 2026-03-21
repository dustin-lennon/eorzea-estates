"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { HOUSING_DISTRICTS, ESTATE_TYPES } from "@/lib/ffxiv-data"
import { PresenceIndicator } from "@/components/presence-indicator"

const ONLINE_THRESHOLD_MS = 3 * 60 * 1000

interface OtherParty {
  id: string
  name: string | null
  image: string | null
  lastSeenAt?: string | null
}

interface LastMessage {
  body: string
  senderId: string
  createdAt: string
}

interface Conversation {
  id: string
  otherParty: OtherParty
  estateType: string | null
  district: string | null
  budgetRange: string | null
  timeframe: string | null
  lastMessage: LastMessage | null
  unread: boolean
  updatedAt: string
  isDesigner: boolean
}

function getLabel<T extends { value: string; label: string }>(list: readonly T[], value: string | null) {
  if (!value) return null
  return list.find((item) => item.value === value)?.label ?? value
}

export function InboxClient({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations")
      if (res.ok) {
        const data = await res.json() as Conversation[]
        setConversations(data)
      }
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchConversations, 30_000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  if (conversations.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No conversations yet</p>
        <p className="text-sm">Commission inquiries you send or receive will appear here.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
      {conversations.map((conv) => {
        const initials = conv.otherParty.name?.slice(0, 2).toUpperCase() ?? "??"
        const isOnline = conv.otherParty.lastSeenAt
          ? Date.now() - new Date(conv.otherParty.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS
          : false
        const typeLabel = getLabel(ESTATE_TYPES, conv.estateType)
        const districtLabel = getLabel(HOUSING_DISTRICTS, conv.district)
        const preview = conv.lastMessage?.body.slice(0, 100) ?? ""

        return (
          <Link
            key={conv.id}
            href={`/messages/${conv.id}`}
            className="flex items-start gap-4 px-5 py-4 hover:bg-accent transition-colors"
          >
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={conv.otherParty.image ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-sm truncate ${conv.unread ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                  {conv.otherParty.name ?? "Unknown User"}
                </span>
                {conv.unread && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                {conv.isDesigner && (
                  <Badge variant="outline" className="text-xs py-0">Incoming</Badge>
                )}
                {typeLabel && <Badge variant="outline" className="text-xs py-0">{typeLabel}</Badge>}
                {districtLabel && <Badge variant="outline" className="text-xs py-0">{districtLabel}</Badge>}
              </div>

              {preview && (
                <p className="text-xs text-muted-foreground truncate">{preview}</p>
              )}
              <PresenceIndicator lastSeenAt={conv.otherParty.lastSeenAt ?? null} className="mt-1" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
