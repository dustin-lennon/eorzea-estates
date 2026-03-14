import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      discordUsername: true,
      role: true,
      characters: {
        select: {
          id: true,
          lodestoneId: true,
          characterName: true,
          server: true,
          dataCenter: true,
          verified: true,
          createdAt: true,
          avatarUrl: true,
        },
      },
      estates: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          description: true,
          inspiration: true,
          type: true,
          district: true,
          ward: true,
          plot: true,
          room: true,
          tags: true,
          published: true,
          moderationStatus: true,
          createdAt: true,
          updatedAt: true,
          images: {
            orderBy: { order: "asc" },
            select: { imageUrl: true, order: true },
          },
          venueDetails: {
            select: {
              venueType: true,
              timezone: true,
              hours: true,
              staff: {
                select: { characterName: true, role: true },
              },
            },
          },
        },
      },
      comments: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          estateId: true,
        },
      },
      likes: {
        select: {
          estateId: true,
          createdAt: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      discordUsername: user.discordUsername,
      role: user.role,
    },
    characters: user.characters,
    estates: user.estates,
    comments: user.comments,
    likes: user.likes,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="eorzea-estates-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
