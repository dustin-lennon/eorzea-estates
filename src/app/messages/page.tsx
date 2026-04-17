import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { InboxClient } from "./inbox-client"

export const metadata = { title: "Messages — Eorzea Estates" }

export default async function MessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ designerId: userId }, { requestorId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      designer: { select: { id: true, name: true, image: true, lastSeenAt: true } },
      requestor: { select: { id: true, name: true, image: true, lastSeenAt: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, senderId: true, createdAt: true },
      },
    },
  })

  const initialConversations = conversations.map((conv) => {
    const isDesigner = conv.designerId === userId
    const otherParty = isDesigner ? conv.requestor : conv.designer
    const myReadAt = isDesigner ? conv.designerReadAt : conv.requestorReadAt
    const lastMessage = conv.messages[0] ?? null
    const unread = myReadAt === null && lastMessage !== null && lastMessage.senderId !== userId

    return {
      id: conv.id,
      otherParty: { ...otherParty, lastSeenAt: otherParty.lastSeenAt?.toISOString() ?? null },
      estateType: conv.estateType as string | null,
      district: conv.district as string | null,
      budgetRange: conv.budgetRange,
      timeframe: conv.timeframe,
      lastMessage: lastMessage
        ? { body: lastMessage.body, senderId: lastMessage.senderId, createdAt: lastMessage.createdAt.toISOString() }
        : null,
      unread,
      updatedAt: conv.updatedAt.toISOString(),
      isDesigner,
    }
  })

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-primary">Messages</h1>
      <InboxClient initialConversations={initialConversations} />
    </div>
  )
}
