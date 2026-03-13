import { notFound } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, MapPin, Clock, Users, ExternalLink } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LikeButton } from "@/components/like-button"
import { CommentsSection } from "@/components/comments-section"
import { ESTATE_TYPES, HOUSING_DISTRICTS, VENUE_TYPES, DAYS_OF_WEEK } from "@/lib/ffxiv-data"
import type { HoursSchedule } from "@/lib/ffxiv-data"
import { EstateImageGallery } from "./estate-image-gallery"
import { FlagButton } from "@/components/flag-button"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const estate = await prisma.estate.findUnique({
    where: { id, published: true, deletedAt: null },
    select: { name: true, description: true, images: { take: 1, select: { imageUrl: true } } },
  })
  if (!estate) return {}
  return {
    title: estate.name,
    description: estate.description.slice(0, 160),
    openGraph: {
      title: estate.name,
      description: estate.description.slice(0, 160),
      images: estate.images[0]?.imageUrl ? [estate.images[0].imageUrl] : [],
    },
  }
}

export default async function EstateDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  const [estate, comments] = await Promise.all([
    prisma.estate.findUnique({
      where: { id, published: true, deletedAt: null },
      include: {
        images: { orderBy: { order: "asc" } },
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            characters: {
              where: { verified: true },
              select: { characterName: true },
              take: 1,
            },
          },
        },
        venueDetails: {
          include: {
            staff: {
              include: {
                linkedCharacter: {
                  select: { id: true, characterName: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.comment.findMany({
      where: { estateId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            characters: {
              where: { verified: true },
              select: { characterName: true },
              take: 1,
            },
          },
        },
      },
    }),
  ])

  if (!estate) notFound()

  const isLoggedIn = !!session?.user?.id
  const isOwner = isLoggedIn && session?.user?.id === estate.owner.id
  const userLiked = isLoggedIn
    ? !!(await prisma.like.findUnique({
        where: { userId_estateId: { userId: session!.user!.id!, estateId: id } },
      }))
    : false

  const typeLabel = ESTATE_TYPES.find((t) => t.value === estate.type)?.label ?? estate.type
  const districtLabel = HOUSING_DISTRICTS.find((d) => d.value === estate.district)?.label
  const venueTypeLabel = estate.venueDetails
    ? VENUE_TYPES.find((v) => v.value === estate.venueDetails!.venueType)?.label
    : null

  const ownerVerifiedChar = estate.owner.characters[0]
  const ownerIsVerified = !!ownerVerifiedChar
  const ownerDisplayName = ownerVerifiedChar?.characterName ?? estate.owner.name

  const hours = estate.venueDetails?.hours as HoursSchedule | null | undefined

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Gallery */}
      <EstateImageGallery images={estate.images.map((i) => i.imageUrl)} name={estate.name} />

      {/* Header */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge>{typeLabel}</Badge>
            {venueTypeLabel && <Badge variant="outline">{venueTypeLabel}</Badge>}
            {estate.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold">{estate.name}</h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />
            {districtLabel ? `${districtLabel}, ` : ""}
            {estate.server} ({estate.dataCenter})
            {estate.ward && estate.plot && (
              <span> · Ward {estate.ward}, Plot {estate.plot}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn && !isOwner && (
            <FlagButton estateId={id} initialFlagged={estate.flagged} />
          )}
          <LikeButton
            estateId={id}
            initialLiked={userLiked}
            initialCount={estate.likeCount}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      {/* Owner */}
      <div className="flex items-center gap-2 mt-4 text-sm">
        <span className="text-muted-foreground">Listed by</span>
        <Link href={`/profile/${estate.owner.id}`} className="brand-link flex items-center gap-1 font-medium no-underline">
          {ownerIsVerified && (
            <BadgeCheck className="h-4 w-4 text-blue-500" />
          )}
          {ownerDisplayName}
        </Link>
        {ownerIsVerified && (
          <span className="text-xs text-muted-foreground">(verified character)</span>
        )}
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <section>
            <h2 className="text-xl font-semibold mb-2">About this Estate</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{estate.description}</p>
          </section>

          {estate.inspiration && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Design Inspiration</h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{estate.inspiration}</p>
            </section>
          )}

          <Separator />

          {/* Venue Details */}
          {estate.venueDetails && (
            <>
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Hours of Operation
                </h2>
                {hours && Object.keys(hours).length > 0 ? (
                  <div className="space-y-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const h = hours?.[day.key]
                      return (
                        <div key={day.key} className="flex items-center gap-4 text-sm">
                          <span className="w-24 font-medium">{day.label}</span>
                          <span className={h ? "" : "text-muted-foreground"}>{h ?? "Closed"}</span>
                        </div>
                      )
                    })}
                    {estate.venueDetails.timezone !== "UTC" && (
                      <p className="text-xs text-muted-foreground mt-2">
                        All times in {estate.venueDetails.timezone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No hours listed.</p>
                )}
              </section>

              {estate.venueDetails.staff.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Staff
                  </h2>
                  <div className="space-y-2">
                    {estate.venueDetails.staff.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {s.linkedCharacter ? (
                            <Link href={`/character/${s.linkedCharacter.id}`} className="brand-link flex items-center gap-1 no-underline">
                              {s.characterName}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            s.characterName
                          )}
                        </span>
                        <span className="text-muted-foreground">{s.role}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <Separator />
            </>
          )}

          {/* Comments */}
          <CommentsSection
            estateId={id}
            initialComments={comments.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
            }))}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border p-4 space-y-3 text-sm">
            <h3 className="font-semibold">Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{typeLabel}</span>
              </div>
              {districtLabel && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">District</span>
                  <span>{districtLabel}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Server</span>
                <span>{estate.server}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data Center</span>
                <span>{estate.dataCenter}</span>
              </div>
              {estate.ward && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ward</span>
                  <span>{estate.ward}</span>
                </div>
              )}
              {estate.plot && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plot</span>
                  <span>{estate.plot}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
