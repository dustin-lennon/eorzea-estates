import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { EstateCard } from "@/components/estate-card"
import { DashboardEstateActions } from "./dashboard-estate-actions"
import { CharacterActions } from "./character-actions"
import { ESTATE_TYPES } from "@/lib/ffxiv-data"
import { Plus, BadgeCheck, UserCircle2 } from "lucide-react"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [characters, estates, likedEstates] = await Promise.all([
    prisma.ffxivCharacter.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { estates: true } } },
    }),
    prisma.estate.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        venueDetails: { select: { venueType: true } },
        character: { select: { characterName: true, verified: true } },
      },
    }),
    prisma.like.findMany({
      where: { userId: session.user.id },
      include: {
        estate: {
          include: {
            images: { orderBy: { order: "asc" }, take: 1 },
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
            venueDetails: { select: { venueType: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const hasVerifiedCharacter = characters.some((c) => c.verified)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your estate listings and account settings.
          </p>
        </div>
        <Button asChild disabled={!hasVerifiedCharacter}>
          <Link href="/submit">
            <Plus className="h-4 w-4 mr-1" />
            Submit Estate
          </Link>
        </Button>
      </div>

      {/* Characters */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Characters ({characters.length})</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/verify">
              <Plus className="h-4 w-4 mr-1" />
              Add Character
            </Link>
          </Button>
        </div>

        {characters.length === 0 ? (
          <div className="text-center py-10 border rounded-xl text-muted-foreground">
            <UserCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No characters linked yet.</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/dashboard/verify">Add your first character</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {characters.map((character) => (
              <div
                key={character.id}
                className="rounded-xl border p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{character.characterName}</span>
                    {character.verified ? (
                      <Badge variant="default" className="gap-1">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Unverified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {character.server} · {character._count.estates} estate{character._count.estates !== 1 ? "s" : ""}
                  </p>
                </div>
                <CharacterActions
                  characterId={character.id}
                  verified={character.verified}
                  estateCount={character._count.estates}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* My Estates */}
      <section className="my-10">
        <h2 className="text-xl font-semibold mb-4">My Estates ({estates.length})</h2>
        {estates.length === 0 ? (
          <div className="text-center py-12 border rounded-xl text-muted-foreground">
            <p>You haven&apos;t submitted any estates yet.</p>
            {hasVerifiedCharacter && (
              <Button asChild className="mt-4" variant="outline">
                <Link href="/submit">Submit your first estate</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {estates.map((estate) => (
              <div key={estate.id} className="rounded-xl border p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{estate.name}</span>
                    <Badge variant={estate.published ? "default" : "secondary"}>
                      {estate.published ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="outline">
                      {ESTATE_TYPES.find((t) => t.value === estate.type)?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {estate.server} · {estate.likeCount} likes
                    {estate.character && (
                      <span className="ml-2 text-muted-foreground/70">
                        · {estate.character.characterName}
                      </span>
                    )}
                  </p>
                </div>
                <DashboardEstateActions
                  estateId={estate.id}
                  published={estate.published}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Liked Estates */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Liked Estates ({likedEstates.length})</h2>
        {likedEstates.length === 0 ? (
          <p className="text-muted-foreground text-sm">You haven&apos;t liked any estates yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {likedEstates.map(({ estate }) => {
              const verifiedChar = estate.owner.characters[0]
              const ownerName = verifiedChar?.characterName ?? estate.owner.name
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
                  coverImage={estate.images[0]?.cloudinaryUrl}
                  ownerName={ownerName ?? null}
                  lodestoneVerified={!!verifiedChar}
                  venueType={estate.venueDetails?.venueType ?? null}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
