import { Metadata } from "next"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { EstateCard } from "@/components/estate-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheck } from "lucide-react"

interface PageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      characters: { where: { verified: true }, select: { characterName: true }, take: 1 },
    },
  })
  if (!user) return {}
  const displayName = user.characters[0]?.characterName ?? user.name
  return { title: `${displayName}'s Profile` }
}

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      characters: { where: { verified: true }, select: { characterName: true }, take: 1 },
    },
  })

  if (!user) notFound()

  const estates = await prisma.estate.findMany({
    where: { ownerId: userId, published: true },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      venueDetails: { select: { venueType: true } },
    },
  })

  const verifiedChar = user.characters[0]
  const isVerified = !!verifiedChar
  const displayName = verifiedChar?.characterName ?? user.name

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.image ?? undefined} alt={displayName ?? ""} />
          <AvatarFallback className="text-2xl">
            {displayName?.charAt(0).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {isVerified && (
              <BadgeCheck className="h-5 w-5 text-blue-500" aria-label="Verified FFXIV Character" />
            )}
          </div>
          {isVerified && user.name && (
            <p className="text-sm text-muted-foreground">Discord: {user.name}</p>
          )}
          <p className="text-sm text-muted-foreground">{estates.length} estate{estates.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {estates.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No published estates yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {estates.map((estate) => (
            <EstateCard
              key={estate.id}
              id={estate.id}
              name={estate.name}
              type={estate.type}
              district={estate.district}
              server={estate.server}
              dataCenter={estate.dataCenter}
              tags={estate.tags}
              likeCount={estate.likeCount}
              coverImage={estate.images[0]?.cloudinaryUrl}
              ownerName={displayName}
              lodestoneVerified={isVerified}
              venueType={estate.venueDetails?.venueType ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
