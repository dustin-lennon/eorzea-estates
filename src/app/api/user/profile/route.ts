import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const profileSchema = z.object({
  bio: z.string().max(160).nullable().optional(),
  commissionOpen: z.boolean().optional(),
  portfolioUrl: z.string().url().nullable().optional(),
  pinnedEstateId: z.string().nullable().optional(),
  designer: z.boolean().optional(),
  designerSpecialties: z.array(z.string()).optional(),
  designerStyleTags: z.array(z.string()).optional(),
  designerPricingText: z.string().max(300).nullable().optional(),
  designerTurnaround: z.string().max(100).nullable().optional(),
  emailOnInquiry: z.boolean().optional(),
  emailOnMessage: z.boolean().optional(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { bio, commissionOpen, portfolioUrl, pinnedEstateId, designer,
    designerSpecialties, designerStyleTags, designerPricingText, designerTurnaround,
    emailOnInquiry, emailOnMessage } = parsed.data

  // Verify pinnedEstateId belongs to this user if provided
  if (pinnedEstateId) {
    const estate = await prisma.estate.findFirst({
      where: { id: pinnedEstateId, ownerId: session.user.id, published: true, deletedAt: null },
      select: { id: true },
    })
    if (!estate) {
      return NextResponse.json({ error: "Estate not found or not published" }, { status: 400 })
    }
  }

  const updateData: Record<string, unknown> = {}
  if (bio !== undefined) updateData.bio = bio
  if (commissionOpen !== undefined) updateData.commissionOpen = commissionOpen
  if (portfolioUrl !== undefined) updateData.portfolioUrl = portfolioUrl
  if (pinnedEstateId !== undefined) updateData.pinnedEstateId = pinnedEstateId
  if (designer !== undefined) updateData.designer = designer
  if (designerSpecialties !== undefined) updateData.designerSpecialties = designerSpecialties
  if (designerStyleTags !== undefined) updateData.designerStyleTags = designerStyleTags
  if (designerPricingText !== undefined) updateData.designerPricingText = designerPricingText
  if (designerTurnaround !== undefined) updateData.designerTurnaround = designerTurnaround
  if (emailOnInquiry !== undefined) updateData.emailOnInquiry = emailOnInquiry
  if (emailOnMessage !== undefined) updateData.emailOnMessage = emailOnMessage

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      bio: true, commissionOpen: true, portfolioUrl: true, pinnedEstateId: true, designer: true,
      designerSpecialties: true, designerStyleTags: true, designerPricingText: true,
      designerTurnaround: true, emailOnInquiry: true, emailOnMessage: true,
    },
  })

  return NextResponse.json(user)
}
