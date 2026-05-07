import { getSessionFromRequest } from "@/lib/session"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.userId

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

  const count = conversations.filter((conv) => {
    const lastMsg = conv.messages[0]
    return lastMsg && lastMsg.senderId !== userId
  }).length

  return NextResponse.json({ count })
}
