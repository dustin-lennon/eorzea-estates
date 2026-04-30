import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const designers = await prisma.user.findMany({
    where: { designer: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      characters: {
        where: { verified: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          id: true,
          characterName: true,
          server: true,
          dataCenter: true,
          lodestoneId: true,
          avatarUrl: true,
        },
      },
    },
  })

  // Only return designers who have at least one verified character
  const result = designers
    .filter((d) => d.characters.length > 0)
    .map((d) => ({
      userId: d.id,
      name: d.name,
      characterId: d.characters[0].id,
      characterName: d.characters[0].characterName,
      server: d.characters[0].server,
      dataCenter: d.characters[0].dataCenter,
      lodestoneId: d.characters[0].lodestoneId,
      avatarUrl: d.characters[0].avatarUrl,
    }))

  return NextResponse.json(result)
}
