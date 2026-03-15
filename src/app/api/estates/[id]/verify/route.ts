import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse, after } from "next/server"
import { uploadVerificationScreenshot } from "@/lib/storage"
import { analyzeVerificationScreenshot } from "@/lib/ai-verification"
import { sendVerificationApprovedEmail, sendVerificationQueuedEmail, sendVerificationRejectedEmail } from "@/lib/email"
import { getCharacterFCId, getFCName } from "@/lib/lodestone"
import { langfuseSpanProcessor } from "@/instrumentation"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const estate = await prisma.estate.findUnique({
    where: { id, deletedAt: null },
    select: {
      ownerId: true,
      verified: true,
      verificationStatus: true,
      type: true,
      district: true,
      ward: true,
      plot: true,
      room: true,
      name: true,
      character: { select: { characterName: true, lodestoneId: true } },
      owner: { select: { email: true, name: true } },
    },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (estate.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (estate.verified) {
    return NextResponse.json({ error: "Already verified" }, { status: 409 })
  }
  if (estate.verificationStatus === "QUEUED") {
    return NextResponse.json(
      { error: "A verification is already pending review. Please wait for it to be reviewed." },
      { status: 429 }
    )
  }

  // Parse multipart form
  let imageBuffer: Buffer
  try {
    const formData = await req.formData()
    const file = formData.get("screenshot") as File | null
    if (!file) {
      return NextResponse.json({ error: "No screenshot provided" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Screenshot must be under 10 MB" }, { status: 400 })
    }
    const arrayBuffer = await file.arrayBuffer()
    imageBuffer = Buffer.from(arrayBuffer)
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  // Upload screenshot
  let screenshotUrl: string
  let storageKey: string
  try {
    const result = await uploadVerificationScreenshot(imageBuffer, session.user.id, id)
    screenshotUrl = result.url
    storageKey = result.storageKey
  } catch {
    return NextResponse.json({ error: "Failed to upload screenshot" }, { status: 500 })
  }

  // Upsert verification record as PENDING
  await prisma.estateVerification.upsert({
    where: { estateId: id },
    create: {
      estateId: id,
      screenshotUrl,
      storageKey,
      status: "PENDING",
    },
    update: {
      screenshotUrl,
      storageKey,
      status: "PENDING",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedById: null,
      modReason: null,
      aiConfidence: null,
      aiReason: null,
    },
  })

  // Update estate status to PENDING
  await prisma.estate.update({
    where: { id },
    data: { verificationStatus: "PENDING" },
  })

  // For FC estates, look up the FC name from Lodestone to pass to the AI
  let fcName: string | null = null
  if (estate.type === "FC_ESTATE" && estate.character?.lodestoneId) {
    const fcId = await getCharacterFCId(parseInt(estate.character.lodestoneId)).catch(() => null)
    if (fcId) {
      fcName = await getFCName(fcId).catch(() => null)
    }
  }

  // Run AI verification
  let aiResult: Awaited<ReturnType<typeof analyzeVerificationScreenshot>> | null = null
  try {
    aiResult = await analyzeVerificationScreenshot(screenshotUrl, {
      estateType: estate.type,
      characterName: estate.character?.characterName ?? "",
      fcName,
      district: estate.district,
      ward: estate.ward,
      plot: estate.plot,
      room: estate.room,
    })
  } catch (err) {
    // AI unavailable — queue for manual review
    console.error("[verify] AI analysis failed:", err)
    console.error("[verify] Gateway URL:", process.env.VERCEL_AI_GATEWAY_URL ?? "(not set — using direct API)")
    console.error("[verify] OIDC token present:", !!process.env.VERCEL_OIDC_TOKEN)
    console.error("[verify] Anthropic key present:", !!process.env.ANTHROPIC_API_KEY)
  }

  // Flush Langfuse traces after the response is sent
  after(() => langfuseSpanProcessor.forceFlush())

  if (aiResult && aiResult.verified && aiResult.confidence === "high") {
    // Auto-approve
    await prisma.$transaction([
      prisma.estate.update({
        where: { id },
        data: { verified: true, verificationStatus: "AI_APPROVED" },
      }),
      prisma.estateVerification.update({
        where: { estateId: id },
        data: {
          status: "AI_APPROVED",
          aiConfidence: aiResult.confidence,
          aiReason: aiResult.reason,
        },
      }),
    ])

    if (estate.owner.email) {
      sendVerificationApprovedEmail({
        to: estate.owner.email,
        ownerName: estate.owner.name ?? "there",
        estateName: estate.name,
      }).catch(() => undefined)
    }

    return NextResponse.json({ status: "approved" })
  } else if (aiResult && !aiResult.verified) {
    // AI determined ownership cannot be confirmed — auto-reject, no appeal
    await prisma.$transaction([
      prisma.estate.update({
        where: { id },
        data: { verificationStatus: "MOD_REJECTED" },
      }),
      prisma.estateVerification.update({
        where: { estateId: id },
        data: {
          status: "MOD_REJECTED",
          aiConfidence: aiResult.confidence,
          aiReason: aiResult.reason,
          reviewedAt: new Date(),
        },
      }),
    ])

    if (estate.owner.email) {
      sendVerificationRejectedEmail({
        to: estate.owner.email,
        ownerName: estate.owner.name ?? "there",
        estateName: estate.name,
        reason: aiResult.reason,
        screenshotUrl,
      }).catch(() => undefined)
    }

    return NextResponse.json({ status: "rejected", reason: aiResult.reason })
  } else {
    // AI approved but with low/medium confidence, or AI was unavailable — queue for manual review
    const reason = aiResult ? aiResult.reason : "AI analysis unavailable"

    await prisma.$transaction([
      prisma.estate.update({
        where: { id },
        data: { verificationStatus: "QUEUED" },
      }),
      prisma.estateVerification.update({
        where: { estateId: id },
        data: {
          status: "QUEUED",
          aiConfidence: aiResult?.confidence ?? null,
          aiReason: reason,
        },
      }),
    ])

    if (estate.owner.email) {
      sendVerificationQueuedEmail({
        to: estate.owner.email,
        ownerName: estate.owner.name ?? "there",
        estateName: estate.name,
      }).catch(() => undefined)
    }

    return NextResponse.json({ status: "queued" })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const estate = await prisma.estate.findUnique({
    where: { id, deletedAt: null },
    select: {
      ownerId: true,
      verificationStatus: true,
      verification: { select: { status: true } },
    },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (estate.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const status = estate.verification?.status
  if (!status || !["PENDING", "QUEUED", "MOD_REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Cannot withdraw this verification" }, { status: 409 })
  }

  await prisma.$transaction([
    prisma.estateVerification.delete({ where: { estateId: id } }),
    prisma.estate.update({
      where: { id },
      data: { verificationStatus: null },
    }),
  ])

  return NextResponse.json({ success: true })
}
