"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DesignerBadge } from "@/components/designer-badge"
import { InquiryDialog } from "@/components/inquiry-dialog"
import { ExternalLink, Palette } from "lucide-react"
import { HOUSING_DISTRICTS } from "@/lib/ffxiv-data"

interface Designer {
  id: string
  name: string | null
  image: string | null
  bio: string | null
  commissionOpen: boolean
  portfolioUrl: string | null
  designerSpecialties: string[]
  designerStyleTags: string[]
  designerPricingText: string | null
  designerTurnaround: string | null
  _count: { designedEstates: number }
}

interface Props {
  designer: Designer
  canInquire: boolean
}

function getDistrictLabel(value: string) {
  return HOUSING_DISTRICTS.find((d) => d.value === value)?.label ?? value
}

export function DesignerCard({ designer, canInquire }: Props) {
  const initials = designer.name?.slice(0, 2).toUpperCase() ?? "??"

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/profile/${designer.id}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={designer.image ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={`/profile/${designer.id}`} className="font-semibold text-sm hover:underline truncate">
              {designer.name ?? "Unknown Designer"}
            </Link>
            <DesignerBadge />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={designer.commissionOpen ? "default" : "outline"} className="text-xs py-0">
              {designer.commissionOpen ? "Open for Commissions" : "Closed"}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Palette className="h-3 w-3" />
              {designer._count.designedEstates} estate{designer._count.designedEstates !== 1 ? "s" : ""} designed
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {designer.bio && (
        <p className="text-sm text-muted-foreground line-clamp-3">{designer.bio}</p>
      )}

      {/* Specialties */}
      {designer.designerSpecialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {designer.designerSpecialties.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              {getDistrictLabel(s)}
            </Badge>
          ))}
        </div>
      )}

      {/* Style tags */}
      {designer.designerStyleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {designer.designerStyleTags.slice(0, 6).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs py-0">
              {tag}
            </Badge>
          ))}
          {designer.designerStyleTags.length > 6 && (
            <Badge variant="outline" className="text-xs py-0">+{designer.designerStyleTags.length - 6}</Badge>
          )}
        </div>
      )}

      {/* Pricing / Turnaround */}
      {(designer.designerPricingText || designer.designerTurnaround) && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          {designer.designerPricingText && <p>💰 {designer.designerPricingText}</p>}
          {designer.designerTurnaround && <p>⏱ {designer.designerTurnaround}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/profile/${designer.id}`}>View Profile</Link>
        </Button>

        {designer.portfolioUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={designer.portfolioUrl} target="_blank" rel="noopener noreferrer" aria-label="Portfolio">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}

        {canInquire && designer.commissionOpen && (
          <InquiryDialog
            designerId={designer.id}
            designerName={designer.name ?? "Designer"}
            trigger={
              <Button size="sm" className="flex-1">
                Inquire
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}
