import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Suspense } from "react"
import { DesignerCard } from "./designer-card"
import { DesignerFilters } from "./designer-filters"

export const metadata = { title: "Designers — Eorzea Estates" }

interface SearchParams {
  openOnly?: string
  specialty?: string
  styleTag?: string
  sort?: string
  page?: string
}

const PAGE_SIZE = 24

export default async function DesignersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth()
  const params = await searchParams

  const openOnly = params.openOnly === "1"
  const specialty = params.specialty ?? ""
  const styleTag = params.styleTag ?? ""
  const sort = params.sort ?? "likes"
  const page = Math.max(1, parseInt(params.page ?? "1", 10))

  // Check if viewer has a verified character (to enable inquiry button)
  let canInquire = false
  if (session?.user?.id) {
    const char = await prisma.ffxivCharacter.findFirst({
      where: { userId: session.user.id, verified: true },
      select: { id: true },
    })
    canInquire = !!char
  }

  const where = {
    designer: true,
    ...(openOnly ? { commissionOpen: true } : {}),
    ...(specialty ? { designerSpecialties: { has: specialty } } : {}),
    ...(styleTag ? { designerStyleTags: { has: styleTag } } : {}),
  }

  const orderBy =
    sort === "newest"
      ? [{ createdAt: "desc" as const }]
      : sort === "estates"
      ? [{ designedEstates: { _count: "desc" as const } }]
      : [{ designedEstates: { _count: "desc" as const } }] // default: most estates (proxy for likes)

  const [designers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        commissionOpen: true,
        portfolioUrl: true,
        designerSpecialties: true,
        designerStyleTags: true,
        designerPricingText: true,
        designerTurnaround: true,
        _count: { select: { designedEstates: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Designers</h1>
        <p className="text-muted-foreground">
          Find talented FFXIV interior designers available for commissions.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-card rounded-xl border border-border p-5 sticky top-24">
            <h2 className="text-sm font-semibold mb-4">Filters</h2>
            <Suspense>
              <DesignerFilters />
            </Suspense>
          </div>
        </aside>

        {/* Grid */}
        <main className="flex-1">
          <p className="text-sm text-muted-foreground mb-4">
            {total} designer{total !== 1 ? "s" : ""} found
          </p>

          {designers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium mb-2">No designers found</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {designers.map((designer) => (
                <DesignerCard
                  key={designer.id}
                  designer={designer}
                  canInquire={canInquire}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              {page > 1 && (
                <a
                  href={`/designers?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                  className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
                >
                  Previous
                </a>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <a
                  href={`/designers?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                  className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
