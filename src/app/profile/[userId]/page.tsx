import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { EstateCard } from "@/components/estate-card"
import { PathfinderBadge } from "@/components/pathfinder-badge"
import { DesignerBadge } from "@/components/designer-badge"
import { InquiryDialog } from "@/components/inquiry-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheck, Crown, Shield, ExternalLink, Palette, Pin, BookOpen } from "lucide-react"

interface PageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      characters: { where: { verified: true }, select: { characterName: true, avatarUrl: true }, take: 1 },
    },
  })
  if (!user) return {}
  const displayName = user.characters[0]?.characterName ?? user.name
  const title = `${displayName}'s Profile`
  const description = `Browse ${displayName}'s FFXIV estates and collections on Eorzea Estates.`
  return {
    title,
    description,
    alternates: { canonical: `/profile/${userId}` },
    openGraph: { title, description, url: `/profile/${userId}` },
    twitter: { card: "summary", title, description },
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params
  const session = await auth()

  // Check if viewer can send inquiries (authenticated + verified character + not viewing own profile)
  let viewerCanInquire = false
  if (session?.user?.id && session.user.id !== userId) {
    const verifiedChar = await prisma.ffxivCharacter.findFirst({
      where: { userId: session.user.id, verified: true },
      select: { id: true },
    })
    viewerCanInquire = !!verifiedChar
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      customAvatarUrl: true,
      role: true,
      pathfinder: true,
      designer: true,
      bio: true,
      commissionOpen: true,
      portfolioUrl: true,
      pinnedEstateId: true,
      createdAt: true,
      characters: { where: { verified: true }, select: { characterName: true, avatarUrl: true }, take: 1 },
      collections: {
        select: {
          id: true,
          name: true,
          description: true,
          _count: { select: { estates: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!user) notFound()

  const estates = await prisma.estate.findMany({
    where: { ownerId: userId, published: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      venueDetails: { select: { venueType: true } },
    },
  })

  const verifiedChar = user.characters[0]
  const isVerified = !!verifiedChar
  const displayName = verifiedChar?.characterName ?? user.name
  const avatarSrc = user.customAvatarUrl || verifiedChar?.avatarUrl || user.image || undefined

  const pinnedEstate = user.pinnedEstateId
    ? estates.find((e) => e.id === user.pinnedEstateId) ?? null
    : null
  const gridEstates = pinnedEstate
    ? estates.filter((e) => e.id !== user.pinnedEstateId)
    : estates

  // Gate: profile is only visible once the user has a verified FFXIV character
  if (!isVerified) {
    const isOwner = session?.user?.id === userId
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10 text-center">
        <p className="text-2xl font-bold mb-3">
          {isOwner ? "Your profile isn't set up yet" : "Profile not available"}
        </p>
        <p className="text-muted-foreground mb-6">
          {isOwner
            ? "Verify an FFXIV character to unlock your public profile, set your display name, and show your Lodestone avatar."
            : "This user hasn't linked an FFXIV character yet."}
        </p>
        {isOwner && (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition"
          >
            Go to Dashboard to verify your character
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-start gap-4 mb-6">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={avatarSrc} alt={displayName ?? ""} />
          <AvatarFallback className="text-2xl">
            {displayName?.charAt(0).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {user.pathfinder && <PathfinderBadge size="md" />}
            {user.designer && <DesignerBadge size="md" />}
            {user.role === "ADMIN" && (
              <Crown className="h-5 w-5 text-yellow-500" aria-label="Admin" />
            )}
            {user.role === "MODERATOR" && (
              <Shield className="h-5 w-5 text-blue-500" aria-label="Moderator" />
            )}
            {isVerified && (
              <BadgeCheck className="h-5 w-5 text-blue-500" aria-label="Verified FFXIV Character" />
            )}
            <h1 className="text-2xl font-bold">{displayName}</h1>
          </div>

          {user.bio && (
            <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <p className="text-sm text-muted-foreground">{estates.length} estate{estates.length !== 1 ? "s" : ""}</p>
            {user.commissionOpen && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 rounded-full px-2.5 py-0.5">
                <Palette className="h-3 w-3" />
                Open for Commissions
              </span>
            )}
            {user.designer && user.commissionOpen && viewerCanInquire && (
              <InquiryDialog
                designerId={user.id}
                designerName={displayName ?? user.name ?? "Designer"}
              />
            )}
            {user.portfolioUrl && (
              <a
                href={user.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
              >
                <ExternalLink className="h-3 w-3" />
                Portfolio
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Estate */}
      {pinnedEstate && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Pin className="h-3.5 w-3.5" />
            Pinned
          </p>
          <div className="max-w-xs">
            <EstateCard
              id={pinnedEstate.id}
              name={pinnedEstate.name}
              type={pinnedEstate.type}
              district={pinnedEstate.district}
              server={pinnedEstate.server}
              dataCenter={pinnedEstate.dataCenter}
              tags={pinnedEstate.tags}
              likeCount={pinnedEstate.likeCount}
              coverImage={pinnedEstate.images[0]?.imageUrl}
              ownerName={displayName}
              lodestoneVerified={isVerified}
              venueType={pinnedEstate.venueDetails?.venueType ?? null}
              updatedAt={pinnedEstate.updatedAt}
              confirmedActiveAt={pinnedEstate.confirmedActiveAt}
            />
          </div>
        </div>
      )}

      {gridEstates.length === 0 && !pinnedEstate ? (
        <p className="text-muted-foreground text-center py-12">No published estates yet.</p>
      ) : gridEstates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridEstates.map((estate) => (
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
              ownerName={displayName}
              lodestoneVerified={isVerified}
              venueType={estate.venueDetails?.venueType ?? null}
              updatedAt={estate.updatedAt}
              confirmedActiveAt={estate.confirmedActiveAt}
            />
          ))}
        </div>
      ) : null}

      {/* Collections */}
      {user.collections.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Collections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user.collections.map((col) => (
              <Link
                key={col.id}
                href={`/profile/${userId}/collections/${col.id}`}
                className="rounded-xl border p-4 hover:bg-accent transition block"
              >
                <p className="font-medium">{col.name}</p>
                {col.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{col.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {col._count.estates} estate{col._count.estates !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
