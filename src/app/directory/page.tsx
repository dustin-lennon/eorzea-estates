import { Metadata } from "next"
import { Suspense } from "react"
import prisma from "@/lib/prisma"
import { EstateCard } from "@/components/estate-card"
import { DirectoryFilters } from "./directory-filters"
import { REGIONS, ESTATE_TYPES, HOUSING_DISTRICTS, PREDEFINED_TAGS } from "@/lib/ffxiv-data"

export const metadata: Metadata = {
  title: "Browse Estates",
  description: "Search and filter Final Fantasy XIV player estates, venues, apartments, and free company houses across all servers.",
  alternates: { canonical: "/directory" },
  openGraph: {
    title: "Browse Estates | Eorzea Estates",
    description: "Search and filter Final Fantasy XIV player estates, venues, apartments, and free company houses across all servers.",
    url: "/directory",
  },
  twitter: {
    card: "summary",
    title: "Browse Estates | Eorzea Estates",
    description: "Search and filter Final Fantasy XIV player estates, venues, apartments, and free company houses across all servers.",
  },
}

const UPDATED_SINCE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
}

interface DirectoryPageProps {
  searchParams: Promise<{
    region?: string
    dataCenter?: string
    server?: string
    type?: string
    district?: string
    tags?: string
    q?: string
    sort?: string
    page?: string
    updatedSince?: string
  }>
}

const PAGE_SIZE = 24

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const sort = params.sort ?? "newest"
  const selectedTags = params.tags ? params.tags.split(",").filter(Boolean) : []

  const updatedSinceDays = params.updatedSince ? UPDATED_SINCE_DAYS[params.updatedSince] : undefined
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now()
  const updatedSinceDate = updatedSinceDays
    ? new Date(nowMs - updatedSinceDays * 24 * 60 * 60 * 1000)
    : undefined

  const where = {
    published: true,
    deletedAt: null,
    ...(params.region ? { region: params.region } : {}),
    ...(params.dataCenter ? { dataCenter: params.dataCenter } : {}),
    ...(params.server ? { server: params.server } : {}),
    ...(params.type ? { type: params.type as never } : {}),
    ...(params.district ? { district: params.district as never } : {}),
    ...(selectedTags.length > 0 ? { tags: { hasSome: selectedTags } } : {}),
    ...(updatedSinceDate ? { updatedAt: { gte: updatedSinceDate } } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" as const } },
            { description: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const orderBy =
    sort === "likes"
      ? { likeCount: "desc" as const }
      : sort === "updated"
      ? { updatedAt: "desc" as const }
      : { createdAt: "desc" as const }

  const dbResult = await prisma.$transaction([
    prisma.estate.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        type: true,
        district: true,
        server: true,
        dataCenter: true,
        tags: true,
        likeCount: true,
        updatedAt: true,
        confirmedActiveAt: true,
        images: { orderBy: { order: "asc" }, take: 1, select: { imageUrl: true } },
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
    }),
    prisma.estate.count({ where }),
  ]).catch(() => null)

  const estates = dbResult?.[0] ?? []
  const total = dbResult?.[1] ?? 0

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Browse Estates</h1>
        <p className="text-muted-foreground mt-1">{total} estate{total !== 1 ? "s" : ""} in the directory</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 shrink-0">
          <Suspense>
            <DirectoryFilters
              regions={REGIONS.map((r) => ({ name: r.name, dataCenters: r.dataCenters }))}
              estateTypes={ESTATE_TYPES}
              districts={HOUSING_DISTRICTS}
              tags={PREDEFINED_TAGS}
              updatedSince={params.updatedSince}
            />
          </Suspense>
        </aside>

        <div className="flex-1">
          {estates.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-medium">No estates found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                      updatedAt={estate.updatedAt}
                      confirmedActiveAt={estate.confirmedActiveAt}
                    />
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <a
                      key={p}
                      href={`?${new URLSearchParams({ ...params, page: String(p) })}`}
                      className={`px-3 py-1 rounded border text-sm ${
                        p === page
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:border-primary/50"
                      }`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
