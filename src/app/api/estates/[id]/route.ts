import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { deleteEstateImage } from "@/lib/cloudinary"
import { NextResponse } from "next/server"

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
    where: { id },
    select: { ownerId: true, images: { select: { cloudinaryPublicId: true } } },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (estate.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Delete images from Cloudinary
  await Promise.allSettled(estate.images.map((img: { cloudinaryPublicId: string }) => deleteEstateImage(img.cloudinaryPublicId)))

  await prisma.estate.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const estate = await prisma.estate.findUnique({
    where: { id },
    select: { ownerId: true },
  })

  if (!estate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (estate.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  // Only allow toggling published for now (full edit handled separately)
  if (typeof body.published === "boolean") {
    const updated = await prisma.estate.update({
      where: { id },
      data: { published: body.published },
      select: { id: true, published: true },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
}
