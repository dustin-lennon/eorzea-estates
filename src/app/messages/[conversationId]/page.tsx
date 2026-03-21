import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { ConversationClient } from "./conversation-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { HOUSING_DISTRICTS, ESTATE_TYPES } from "@/lib/ffxiv-data"

export const metadata = { title: "Conversation — Eorzea Estates" }

function getLabel<T extends { value: string; label: string }>(list: readonly T[], value: string | null | undefined) {
  if (!value) return null
  return list.find((item) => item.value === value)?.label ?? value
}

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { conversationId } = await params
  const userId = session.user.id

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      designer: { select: { id: true, name: true, image: true } },
      requestor: { select: { id: true, name: true, image: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          senderId: true,
          body: true,
          createdAt: true,
          sender: { select: { name: true, image: true } },
        },
      },
    },
  })

  if (!conv || (conv.designerId !== userId && conv.requestorId !== userId)) {
    notFound()
  }

  // Mark as read
  const updateField = conv.designerId === userId ? { designerReadAt: new Date() } : { requestorReadAt: new Date() }
  await prisma.conversation.update({ where: { id: conversationId }, data: updateField })

  const isDesigner = conv.designerId === userId
  const otherParty = isDesigner ? conv.requestor : conv.designer
  const typeLabel = getLabel(ESTATE_TYPES, conv.estateType)
  const districtLabel = getLabel(HOUSING_DISTRICTS, conv.district)

  const initialMessages = conv.messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    sender: m.sender,
  }))

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Link href="/messages" className="mt-1 text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherParty.image ?? undefined} />
            <AvatarFallback>{otherParty.name?.slice(0, 2).toUpperCase() ?? "??"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{otherParty.name ?? "Unknown User"}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {typeLabel && <Badge variant="outline" className="text-xs py-0">{typeLabel}</Badge>}
              {districtLabel && <Badge variant="outline" className="text-xs py-0">{districtLabel}</Badge>}
              {conv.budgetRange && <Badge variant="outline" className="text-xs py-0">{conv.budgetRange}</Badge>}
              {conv.timeframe && <Badge variant="outline" className="text-xs py-0">{conv.timeframe}</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
        <ConversationClient
          conversationId={conversationId}
          currentUserId={userId}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  )
}
