import Link from "next/link"
import Image from "next/image"
import { Heart, MapPin, BadgeCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ESTATE_TYPES, HOUSING_DISTRICTS } from "@/lib/ffxiv-data"

interface EstateCardProps {
  id: string
  name: string
  type: string
  district?: string | null
  server: string
  dataCenter: string
  tags: string[]
  likeCount: number
  coverImage?: string | null
  ownerName?: string | null
  ownerImage?: string | null
  lodestoneVerified?: boolean
  venueType?: string | null
  published?: boolean
}

export function EstateCard({
  id,
  name,
  type,
  district,
  server,
  dataCenter,
  tags,
  likeCount,
  coverImage,
  ownerName,
  lodestoneVerified,
  venueType,
  published = true,
}: EstateCardProps) {
  const typeLabel = ESTATE_TYPES.find((t) => t.value === type)?.label ?? type
  const districtLabel = HOUSING_DISTRICTS.find((d) => d.value === district)?.label

  const inner = (
    <>
      <div className="relative aspect-video bg-muted overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={name}
            fill
            className={`object-cover${published ? " group-hover:scale-105 transition-transform duration-300" : ""}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No screenshots yet
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="secondary" className="text-xs">
            {typeLabel}
          </Badge>
          {venueType && (
            <Badge variant="outline" className="text-xs bg-background/80">
              {venueType.charAt(0) + venueType.slice(1).toLowerCase()}
            </Badge>
          )}
          {!published && (
            <Badge variant="outline" className="text-xs bg-background/80">
              Unavailable
            </Badge>
          )}
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold leading-tight line-clamp-1">{name}</h3>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {districtLabel ? `${districtLabel}, ` : ""}{server} ({dataCenter})
          </span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          {ownerName && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              {lodestoneVerified && <BadgeCheck className="h-3 w-3 text-blue-500 shrink-0" />}
              {ownerName}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Heart className="h-3 w-3" />
            {likeCount}
          </span>
        </div>
      </div>
    </>
  )

  if (!published) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden flex flex-col opacity-60 cursor-default">
        {inner}
      </div>
    )
  }

  return (
    <Link
      href={`/estate/${id}`}
      className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      {inner}
    </Link>
  )
}
