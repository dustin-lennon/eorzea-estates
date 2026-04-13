import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  // Count conversations where the current user's readAt is null
  // and the last message was sent by the other party
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { designerId: userId, designerReadAt: null },
        { requestorId: userId, requestorReadAt: null },
      ],
    },
    select: {
      designerId: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { senderId: true },
      },
    },
  })

  // Only count if the last message was not sent by the current user
  const count = conversations.filter((conv) => {
    const lastMsg = conv.messages[0]
    return lastMsg && lastMsg.senderId !== userId
  }).length

  return NextResponse.json({ count })
}
