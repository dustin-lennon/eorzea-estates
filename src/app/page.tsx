import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import prisma from "@/lib/prisma"
import { EstateCard } from "@/components/estate-card"
import { Button } from "@/components/ui/button"
import { Search, Star } from "lucide-react"

async function FeaturedEstates() {
  let estates
  try {
    estates = await prisma.estate.findMany({
      where: { published: true },
      orderBy: { likeCount: "desc" },
      take: 6,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        owner: {
          select: {
            name: true,
            lodestoneCharacterName: true,
            lodestoneVerified: true,
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
          const ownerName = estate.owner.lodestoneVerified
            ? estate.owner.lodestoneCharacterName
            : estate.owner.name
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
              lodestoneVerified={estate.owner.lodestoneVerified}
              venueType={estate.venueDetails?.venueType ?? null}
            />
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
      prisma.estate.count({ where: { published: true } }),
      prisma.estate.count({ where: { published: true, type: "VENUE" } }),
      prisma.estate.groupBy({
        by: ["type"],
        where: { published: true },
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
            <Image src="/eorzea-estates-icon.svg" alt="Eorzea Estates icon" width={48} height={48} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Eorzea Estates
          </h1>
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
      </div>
    </div>
  )
}
