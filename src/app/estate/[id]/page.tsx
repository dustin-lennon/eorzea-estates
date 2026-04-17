import { notFound } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, MapPin, Clock, Users, ExternalLink, ShieldCheck, Palette } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LikeButton } from "@/components/like-button"
import { CommentsSection } from "@/components/comments-section"
import { ESTATE_TYPES, ESTATE_SIZES, HOUSING_DISTRICTS, VENUE_TYPES, DAYS_OF_WEEK } from "@/lib/ffxiv-data"
import type { HoursSchedule } from "@/lib/ffxiv-data"
import { EstateImageGallery } from "./estate-image-gallery"
import { FlagButton } from "@/components/flag-button"
import { ClaimButton } from "./claim-button"
import { ConfirmActiveButton } from "@/components/confirm-active-button"
import { isStale, STALE_DAYS } from "@/lib/constants"
import { AlertTriangle } from "lucide-react"

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
  const description = estate.description.slice(0, 160)
  const ogImage = estate.images[0]?.imageUrl
  return {
    title: estate.name,
    description,
    alternates: { canonical: `/estate/${id}` },
    openGraph: {
      title: estate.name,
      description,
      url: `/estate/${id}`,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: estate.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: estate.name,
      description,
      images: ogImage ? [ogImage] : [],
    },
  }
}

export default async function EstateDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  const [estate, comments] = await prisma.$transaction([
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
        designer: {
          select: {
            id: true,
            name: true,
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
            pathfinder: true,
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
  const isDesigner = isLoggedIn && session?.user?.id === estate.designer?.id
  const isUnclaimed = !!estate.designer && !estate.claimedAt

  // Fetch verified characters for claim eligibility
  let claimCharacters: { id: string; characterName: string; server: string }[] = []
  if (isLoggedIn && isUnclaimed && !isOwner && !isDesigner) {
    claimCharacters = await prisma.ffxivCharacter.findMany({
      where: { userId: session!.user!.id!, verified: true },
      select: { id: true, characterName: true, server: true },
      orderBy: { createdAt: "asc" },
    })
  }

  const canClaim = claimCharacters.length > 0
  const lastActivity = estate.confirmedActiveAt ?? estate.updatedAt
  const showStaleBanner = estate.published && isStale(lastActivity)

  const userLiked = isLoggedIn
    ? !!(await prisma.like.findUnique({
        where: { userId_estateId: { userId: session!.user!.id!, estateId: id } },
      }))
    : false

  const typeLabel = ESTATE_TYPES.find((t) => t.value === estate.type)?.label ?? estate.type
  const districtLabel = HOUSING_DISTRICTS.find((d) => d.value === estate.district)?.label
  const sizeLabel = estate.size ? ESTATE_SIZES.find((s) => s.value === estate.size)?.label : null
  const venueTypeLabel = estate.venueDetails
    ? VENUE_TYPES.find((v) => v.value === estate.venueDetails!.venueType)?.label
    : null

  const ownerVerifiedChar = estate.owner.characters[0]
  const ownerIsVerified = !!ownerVerifiedChar
  const ownerDisplayName = ownerVerifiedChar?.characterName ?? estate.owner.name

  const hours = estate.venueDetails?.hours as HoursSchedule | null | undefined

  const siteUrl = process.env.NEXTAUTH_URL ?? "https://eorzeaestates.com"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: estate.name,
    description: estate.description,
    url: `${siteUrl}/estate/${id}`,
    ...(estate.images[0]?.imageUrl ? { image: estate.images[0].imageUrl } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: `${estate.server} (${estate.dataCenter})`,
    },
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            {estate.ward && estate.room && (
              <span> · Ward {estate.ward}, Room {estate.room}</span>
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

      {/* Owner + Designer attribution */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{isUnclaimed ? "Submitted by" : "Listed by"}</span>
          <Link href={`/profile/${estate.owner.id}`} className="brand-link flex items-center gap-1 font-medium no-underline">
            {ownerIsVerified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
            {ownerDisplayName}
          </Link>
        </div>
        {estate.designer && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Designed by</span>
            <Link href={`/profile/${estate.designer.id}`} className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400 hover:underline">
              <Palette className="h-3.5 w-3.5" />
              {estate.designer.characters[0]?.characterName ?? estate.designer.name}
            </Link>
          </div>
        )}
      </div>

      {/* Unclaimed notice */}
      {isUnclaimed && (
        <div className="mt-3 flex flex-wrap items-center gap-3 p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 text-sm">
          <Palette className="h-4 w-4 text-purple-500 shrink-0" />
          <p className="text-muted-foreground flex-1">
            This estate was submitted by its designer. Is this your property?
          </p>
          {canClaim && <ClaimButton estateId={id} characters={claimCharacters} />}
          {isLoggedIn && !canClaim && !isOwner && !isDesigner && (
            <span className="text-xs text-muted-foreground">Verify a character to claim.</span>
          )}
        </div>
      )}

      {/* Stale listing notice */}
      {showStaleBanner && (
        <div className="mt-3 flex flex-wrap items-center gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
          <p className="text-muted-foreground flex-1">
            This listing hasn&apos;t been confirmed active in over {STALE_DAYS} days and may be outdated.
          </p>
          {isOwner && <ConfirmActiveButton estateId={id} />}
        </div>
      )}

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
              {estate.type !== "APARTMENT" && estate.type !== "FC_ROOM" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estate Size</span>
                  <span>{sizeLabel ?? "Unknown"}</span>
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
              {estate.room && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room</span>
                  <span>{estate.room}</span>
                </div>
              )}
              {estate.subdivision && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subdivision</span>
                  <span>{estate.subdivision}</span>
                </div>
              )}
              {!estate.subdivision && estate.plot && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subdivision</span>
                  <span>{estate.plot <= 30 ? "Main" : "Subdivision"}</span>
                </div>
              )}
              {estate.verified && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ownership</span>
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    Verified
                  </span>
                </div>
              )}
              {estate.designer && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Designer</span>
                  <Link href={`/profile/${estate.designer.id}`} className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline text-xs font-medium">
                    <Palette className="h-3.5 w-3.5" />
                    {estate.designer.characters[0]?.characterName ?? estate.designer.name}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
