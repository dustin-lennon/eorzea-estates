import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { EstateCard } from "@/components/estate-card"
import { ChevronLeft, BookOpen } from "lucide-react"

interface PageProps {
  params: Promise<{ userId: string; collectionId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { collectionId } = await params
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { name: true },
  })
  if (!collection) return {}
  return { title: collection.name }
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { userId, collectionId } = await params

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      user: {
        select: {
          id: true,
          name: true,
          characters: { where: { verified: true }, select: { characterName: true }, take: 1 },
        },
      },
      estates: {
        orderBy: { order: "asc" },
        select: {
          estate: {
            include: {
              images: { orderBy: { order: "asc" }, take: 1 },
              venueDetails: { select: { venueType: true } },
              owner: {
                select: {
                  name: true,
                  characters: {
                    where: { verified: true },
                    select: { characterName: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!collection) notFound()

  const ownerName =
    collection.user.characters[0]?.characterName ?? collection.user.name

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link
        href={`/profile/${userId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {ownerName ?? "profile"}
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{collection.name}</h1>
      </div>

      {collection.description && (
        <p className="text-muted-foreground mb-6">{collection.description}</p>
      )}

      <p className="text-sm text-muted-foreground mb-6">
        {collection.estates.length} estate{collection.estates.length !== 1 ? "s" : ""}
      </p>

      {collection.estates.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No estates in this collection yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collection.estates.map(({ estate }) => {
            const verifiedChar = estate.owner.characters[0]
            const estateOwnerName = verifiedChar?.characterName ?? estate.owner.name
            return (
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
                ownerName={estateOwnerName ?? null}
                lodestoneVerified={!!verifiedChar}
                venueType={estate.venueDetails?.venueType ?? null}
                updatedAt={estate.updatedAt}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
