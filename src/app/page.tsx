import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import prisma from "@/lib/prisma"
import { EstateCard } from "@/components/estate-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DesignerBadge } from "@/components/designer-badge"
import { Search, Star, Heart, Palette } from "lucide-react"

async function FeaturedEstates() {
  let estates
  try {
    estates = await prisma.estate.findMany({
      where: { published: true, deletedAt: null },
      orderBy: { likeCount: "desc" },
      take: 6,
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
    })
  } catch {
    return null
  }

  if (estates.length === 0) return null

  return (
    <section className="container mx-auto px-4 pb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Featured Estates
        </h2>
        <Button variant="ghost" asChild>
          <Link href="/directory">View all →</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {estates.map((estate) => {
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
              coverImage={estate.images[0]?.imageUrl}
              ownerName={ownerName ?? null}
              lodestoneVerified={!!verifiedChar}
              venueType={estate.venueDetails?.venueType ?? null}
            />
          )
        })}
      </div>
    </section>
  )
}

async function FeaturedDesigners() {
  let designers
  try {
    const users = await prisma.user.findMany({
      where: { designer: true },
      select: {
        id: true,
        name: true,
        image: true,
        characters: {
          where: { verified: true },
          select: { characterName: true },
          take: 1,
        },
        estates: {
          where: { published: true, deletedAt: null },
          select: { likeCount: true },
        },
        _count: { select: { estates: { where: { published: true, deletedAt: null } } } },
      },
    })
    designers = users
      .map((u) => ({
        ...u,
        totalLikes: u.estates.reduce((sum, e) => sum + e.likeCount, 0),
      }))
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 6)
  } catch {
    return null
  }

  if (!designers || designers.length === 0) return null

  return (
    <section className="container mx-auto px-4 pb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-500" />
          Featured Designers
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {designers.map((designer) => {
          const displayName = designer.characters[0]?.characterName ?? designer.name
          return (
            <Link
              key={designer.id}
              href={`/profile/${designer.id}`}
              className="rounded-xl border p-4 flex items-center gap-4 hover:bg-accent transition"
            >
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={designer.image ?? undefined} alt={displayName ?? ""} />
                <AvatarFallback>{displayName?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <DesignerBadge size="sm" />
                  <span className="font-medium truncate">{displayName}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{designer._count.estates} estate{designer._count.estates !== 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-0.5">
                    <Heart className="h-3 w-3" />
                    {designer.totalLikes}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

async function StatsRow() {
  let total = 0, venues = 0, byType: unknown[] = []
  try {
    ;[total, venues, byType] = await Promise.all([
      prisma.estate.count({ where: { published: true, deletedAt: null } }),
      prisma.estate.count({ where: { published: true, type: "VENUE", deletedAt: null } }),
      prisma.estate.groupBy({
        by: ["type"],
        where: { published: true, deletedAt: null },
        _count: true,
      }),
    ])
  } catch {
    return null
  }

  return (
    <div className="flex flex-wrap justify-center gap-8 text-center">
      <div>
        <p className="text-2xl font-bold">{total}</p>
        <p className="text-sm text-muted-foreground">Total Estates</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{venues}</p>
        <p className="text-sm text-muted-foreground">Venues</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{byType.length}</p>
        <p className="text-sm text-muted-foreground">Estate Types</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-muted/50 to-background py-20 text-center">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-4">
            <Image src="/images/logo/eorzea-estates-icon.svg" alt="Eorzea Estates icon" width={240} height={240} />
          </div>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            A community directory of Final Fantasy XIV player-owned estates. Venues, private homes,
            free company halls, apartments — shared by the players who built them.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/directory">
                <Search className="h-5 w-5 mr-2" />
                Browse Estates
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/submit">Submit Your Estate</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <Suspense fallback={null}>
            <StatsRow />
          </Suspense>
        </div>
      </section>

      {/* Featured */}
      <div className="py-12">
        <Suspense
          fallback={
            <div className="container mx-auto px-4 pb-16">
              <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-video bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          }
        >
          <FeaturedEstates />
        </Suspense>

        <Suspense
          fallback={
            <div className="container mx-auto px-4 pb-16">
              <div className="h-8 w-56 bg-muted rounded animate-pulse mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          }
        >
          <FeaturedDesigners />
        </Suspense>
      </div>
    </div>
  )
}
