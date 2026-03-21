import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { messageSchema } from "@/lib/schemas"
import { sendNewMessageEmail } from "@/lib/email"
import { sendPushToUser } from "@/lib/push"

async function getConversationForUser(id: string, userId: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      designerId: true,
      requestorId: true,
      designer: { select: { id: true, name: true, email: true, emailOnMessage: true } },
      requestor: { select: { id: true, name: true, email: true, emailOnMessage: true } },
    },
  })
  if (!conv) return null
  if (conv.designerId !== userId && conv.requestorId !== userId) return null
  return conv
}

export async function GET(_req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { conversationId } = await params
  const conv = await getConversationForUser(conversationId, session.user.id)
  if (!conv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      senderId: true,
      body: true,
      createdAt: true,
      sender: { select: { name: true, image: true } },
    },
  })

  // Mark as read for the caller
  const updateField =
    conv.designerId === session.user.id ? { designerReadAt: new Date() } : { requestorReadAt: new Date() }
  await prisma.conversation.update({ where: { id: conversationId }, data: updateField })

  return NextResponse.json({ conversation: conv, messages })
}

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { conversationId } = await params
  const conv = await getConversationForUser(conversationId, session.user.id)
  if (!conv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const userId = session.user.id
  const isDesigner = conv.designerId === userId
  const otherParty = isDesigner ? conv.requestor : conv.designer

  // Create message + update conversation in a transaction
  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: { conversationId, senderId: userId, body: parsed.data.body },
      select: { id: true, senderId: true, body: true, createdAt: true, sender: { select: { name: true, image: true } } },
    })
    // Update conversation updatedAt and clear other party's readAt
    const clearField = isDesigner ? { requestorReadAt: null } : { designerReadAt: null }
    await tx.conversation.update({
      where: { id: conversationId },
      data: { ...clearField, updatedAt: new Date() },
    })
    return msg
  })

  // Send email + push (fire and forget)
  const sender = isDesigner ? conv.designer : conv.requestor
  if (otherParty.emailOnMessage && otherParty.email) {
    void sendNewMessageEmail({
      to: otherParty.email,
      recipientName: otherParty.name ?? "User",
      senderName: sender.name ?? "User",
      conversationId,
    })
  }
  void sendPushToUser(otherParty.id, {
    title: "New message",
    body: `${sender.name ?? "User"}: ${parsed.data.body.slice(0, 100)}`,
    url: `/messages/${conversationId}`,
  })

  return NextResponse.json(message, { status: 201 })
}
