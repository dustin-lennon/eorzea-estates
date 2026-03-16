import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import prisma from "@/lib/prisma"
import { EstateCard } from "@/components/estate-card"
import { BadgeCheck, ShieldCheck, Shield } from "lucide-react"

interface PageProps {
  params: Promise<{ characterId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { characterId } = await params
  const character = await prisma.ffxivCharacter.findUnique({
    where: { id: characterId },
    select: { characterName: true, server: true },
  })
  if (!character) return {}
  return { title: `${character.characterName} (${character.server})` }
}

export default async function CharacterProfilePage({ params }: PageProps) {
  const { characterId } = await params

  const character = await prisma.ffxivCharacter.findUnique({
    where: { id: characterId },
    select: {
      id: true,
      characterName: true,
      server: true,
      dataCenter: true,
      avatarUrl: true,
      verified: true,
      user: { select: { role: true } },
    },
  })

  if (!character) notFound()

  const estates = await prisma.estate.findMany({
    where: { characterId, published: true },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      venueDetails: { select: { venueType: true } },
    },
  })

  const userRole = character.user?.role

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        {character.avatarUrl ? (
          <Image
            src={character.avatarUrl}
            alt={character.characterName}
            width={64}
            height={64}
            className="rounded-full"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
            {character.characterName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{character.characterName}</h1>
            {character.verified && (
              <BadgeCheck className="h-5 w-5 text-blue-500" aria-label="Verified character" />
            )}
            {userRole === "ADMIN" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </span>
            )}
            {userRole === "MODERATOR" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                <Shield className="h-3 w-3" />
                Moderator
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {character.server} &middot; {character.dataCenter}
          </p>
          <p className="text-sm text-muted-foreground">
            {estates.length} estate{estates.length !== 1 ? "s" : ""}
          </p>
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
              coverImage={estate.images[0]?.imageUrl}
              ownerName={character.characterName}
              lodestoneVerified={character.verified}
              venueType={estate.venueDetails?.venueType ?? null}
              updatedAt={estate.updatedAt}
              confirmedActiveAt={estate.confirmedActiveAt}
            />
          ))}
        </div>
      )}
    </div>
  )
}
