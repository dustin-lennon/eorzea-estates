import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { LEGAL_DEFAULTS, type LegalSlug } from "@/lib/legal-defaults"
import { z } from "zod"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null
  }
  return session
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { slug } = await params

  const page = await prisma.legalPage.findUnique({ where: { slug } })

  if (page) return NextResponse.json(page)

  // Return default content if not yet saved to DB
  const defaults = LEGAL_DEFAULTS[slug as LegalSlug]
  if (!defaults) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ slug, title: defaults.title, content: defaults.content, updatedAt: null })
}

const patchSchema = z.object({
  content: z.string().min(1),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { slug } = await params

  const defaults = LEGAL_DEFAULTS[slug as LegalSlug]
  if (!defaults) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const page = await prisma.legalPage.upsert({
    where: { slug },
    update: { content: parsed.data.content, updatedById: session.user.id },
    create: {
      slug,
      title: defaults.title,
      content: parsed.data.content,
      updatedById: session.user.id,
    },
  })

  return NextResponse.json(page)
}
