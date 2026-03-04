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
import { ESTATE_TYPES } from "@/lib/ffxiv-data"
import { Plus, BadgeCheck } from "lucide-react"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [user, estates, likedEstates] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        image: true,
        lodestoneCharacterName: true,
        lodestoneVerified: true,
        discordUsername: true,
      },
    }),
    prisma.estate.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        venueDetails: { select: { venueType: true } },
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
                lodestoneCharacterName: true,
                lodestoneVerified: true,
              },
            },
            venueDetails: { select: { venueType: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your estate listings and account settings.
          </p>
        </div>
        <Button asChild>
          <Link href="/submit">
            <Plus className="h-4 w-4 mr-1" />
            Submit Estate
          </Link>
        </Button>
      </div>

      {/* Lodestone Verification CTA */}
      {!user?.lodestoneVerified && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Verify your FFXIV character</p>
            <p className="text-sm text-muted-foreground">
              Link your Lodestone character to get a verified badge on your listings.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/verify">
              <BadgeCheck className="h-4 w-4 mr-1" />
              Verify
            </Link>
          </Button>
        </div>
      )}

      {user?.lodestoneVerified && (
        <div className="rounded-xl border p-4 mb-6 flex items-center gap-2 text-sm">
          <BadgeCheck className="h-4 w-4 text-blue-500" />
          <span>
            Verified as <strong>{user.lodestoneCharacterName}</strong>
          </span>
        </div>
      )}

      {/* My Estates */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">My Estates ({estates.length})</h2>
        {estates.length === 0 ? (
          <div className="text-center py-12 border rounded-xl text-muted-foreground">
            <p>You haven&apos;t submitted any estates yet.</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/submit">Submit your first estate</Link>
            </Button>
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
        )}
      </section>
    </div>
  )
}
