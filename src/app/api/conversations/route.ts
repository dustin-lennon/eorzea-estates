import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { inquirySchema, COMMISSIONABLE_ESTATE_TYPES } from "@/lib/schemas"
import { sendNewInquiryEmail } from "@/lib/email"
import { sendPushToUser } from "@/lib/push"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Require at least one verified character
  const verifiedChar = await prisma.ffxivCharacter.findFirst({
    where: { userId: session.user.id, verified: true },
    select: { id: true },
  })
  if (!verifiedChar) {
    return NextResponse.json({ error: "A verified FFXIV character is required to send an inquiry" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = inquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { designerId, estateType, district, budgetRange, timeframe, body: messageBody } = parsed.data

  if (estateType && !(COMMISSIONABLE_ESTATE_TYPES as readonly string[]).includes(estateType)) {
    return NextResponse.json(
      { error: "Designers can only be commissioned for private estates, venues, or FC estates" },
      { status: 400 }
    )
  }

  if (designerId === session.user.id) {
    return NextResponse.json({ error: "Cannot send an inquiry to yourself" }, { status: 400 })
  }

  // Verify designer exists and has designer flag
  const designer = await prisma.user.findUnique({
    where: { id: designerId },
    select: { id: true, designer: true, name: true, email: true, emailOnInquiry: true },
  })
  if (!designer || !designer.designer) {
    return NextResponse.json({ error: "Designer not found" }, { status: 404 })
  }

  // Check if conversation already exists — redirect to existing thread
  const existing = await prisma.conversation.findUnique({
    where: { designerId_requestorId: { designerId, requestorId: session.user.id } },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ conversationId: existing.id, existing: true })
  }

  const requestor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  })

  // Create conversation + first message in a transaction
  const conversation = await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.create({
      data: {
        designerId,
        requestorId: session.user.id,
        estateType: estateType ?? null,
        district: district ?? null,
        budgetRange: budgetRange ?? null,
        timeframe: timeframe ?? null,
        designerReadAt: null, // unread for designer
        requestorReadAt: new Date(), // requestor just sent it
      },
    })
    await tx.message.create({
      data: {
        conversationId: conv.id,
        senderId: session.user.id,
        body: messageBody,
      },
    })
    return conv
  })

  // Send email + push notifications (fire and forget)
  if (designer.emailOnInquiry && designer.email) {
    void sendNewInquiryEmail({
      to: designer.email,
      designerName: designer.name ?? "Designer",
      requestorName: requestor?.name ?? "Someone",
      conversationId: conversation.id,
    })
  }
  void sendPushToUser(designerId, {
    title: "New commission inquiry",
    body: `${requestor?.name ?? "Someone"} sent you a commission inquiry`,
    url: `/messages/${conversation.id}`,
  })

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  const result = conversations.map((conv) => {
    const isDesigner = conv.designerId === userId
    const otherParty = isDesigner ? conv.requestor : conv.designer
    const myReadAt = isDesigner ? conv.designerReadAt : conv.requestorReadAt
    const lastMessage = conv.messages[0] ?? null
    const unread = myReadAt === null && lastMessage !== null && lastMessage.senderId !== userId

    return {
      id: conv.id,
      otherParty: { ...otherParty, lastSeenAt: otherParty.lastSeenAt?.toISOString() ?? null },
      estateType: conv.estateType,
      district: conv.district,
      budgetRange: conv.budgetRange,
      timeframe: conv.timeframe,
      lastMessage,
      unread,
      updatedAt: conv.updatedAt,
      isDesigner,
    }
  })

  return NextResponse.json(result)
}
