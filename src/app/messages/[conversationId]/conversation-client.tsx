"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Send } from "lucide-react"
import { PresenceIndicator } from "@/components/presence-indicator"

interface Sender {
  name: string | null
  image: string | null
}

interface Message {
  id: string
  senderId: string
  body: string
  createdAt: string
  sender: Sender
}

interface Props {
  conversationId: string
  currentUserId: string
  initialMessages: Message[]
  initialOtherPartyLastSeenAt: string | null
}

export function ConversationClient({ conversationId, currentUserId, initialMessages, initialOtherPartyLastSeenAt }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [otherPartyLastSeenAt, setOtherPartyLastSeenAt] = useState(initialOtherPartyLastSeenAt)
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)
  const justSentRef = useRef(false)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`)
      if (res.ok) {
        const data = await res.json() as { messages: Message[]; otherPartyLastSeenAt: string | null }
        setMessages(data.messages)
        setOtherPartyLastSeenAt(data.otherPartyLastSeenAt)
      }
    } catch {
      // silently ignore
    }
  }, [conversationId])

  useEffect(() => {
    const interval = setInterval(fetchMessages, 15_000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // Scroll to bottom: always on initial load, on send, or when already near the bottom
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    if (isInitialMount.current) {
      bottomRef.current?.scrollIntoView()
      isInitialMount.current = false
      return
    }

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
    if (justSentRef.current || isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    justSentRef.current = false
  }, [messages])

  async function handleSend() {
    const trimmed = body.trim()
    if (!trimmed) return
    setSending(true)
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: unknown }
        throw new Error(typeof data.error === "string" ? data.error : "Failed to send")
      }
      const msg = await res.json() as Message
      justSentRef.current = true
      setMessages((prev) => [...prev, msg])
      setBody("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Presence indicator */}
      <div className="px-4 pt-3 pb-1 border-b border-border">
        <PresenceIndicator lastSeenAt={otherPartyLastSeenAt} />
      </div>

      {/* Message list */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId
          const initials = msg.sender.name?.slice(0, 2).toUpperCase() ?? "??"
          return (
            <div key={msg.id} className={`flex gap-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={msg.sender.image ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.body}
                </div>
                <span className="text-xs text-muted-foreground px-1">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border p-4">
        <div className="flex gap-3 items-end">
          <textarea
            className="flex-1 min-h-[72px] max-h-[180px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Type a message… (Enter to send, Ctrl+Enter for new line)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={2000}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            size="icon"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-right">{body.length}/2000</p>
      </div>
    </div>
  )
}
