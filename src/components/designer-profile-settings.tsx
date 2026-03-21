"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { HOUSING_DISTRICTS, PREDEFINED_TAGS } from "@/lib/ffxiv-data"

interface Estate {
  id: string
  name: string
}

interface Props {
  initialBio: string | null
  initialCommissionOpen: boolean
  initialPortfolioUrl: string | null
  initialPinnedEstateId: string | null
  initialDesigner: boolean
  initialDesignerSpecialties: string[]
  initialDesignerStyleTags: string[]
  initialDesignerPricingText: string | null
  initialDesignerTurnaround: string | null
  initialEmailOnInquiry: boolean
  initialEmailOnMessage: boolean
  publishedEstates: Estate[]
}

const BIO_MAX = 160
const PRICING_MAX = 300
const TURNAROUND_MAX = 100

export function DesignerProfileSettings({
  initialBio,
  initialCommissionOpen,
  initialPortfolioUrl,
  initialPinnedEstateId,
  initialDesigner,
  initialDesignerSpecialties,
  initialDesignerStyleTags,
  initialDesignerPricingText,
  initialDesignerTurnaround,
  initialEmailOnInquiry,
  initialEmailOnMessage,
  publishedEstates,
}: Props) {
  const [bio, setBio] = useState(initialBio ?? "")
  const [commissionOpen, setCommissionOpen] = useState(initialCommissionOpen)
  const [portfolioUrl, setPortfolioUrl] = useState(initialPortfolioUrl ?? "")
  const [pinnedEstateId, setPinnedEstateId] = useState(initialPinnedEstateId ?? "")
  const [designer, setDesigner] = useState(initialDesigner)
  const [specialties, setSpecialties] = useState<string[]>(initialDesignerSpecialties)
  const [styleTags, setStyleTags] = useState<string[]>(initialDesignerStyleTags)
  const [pricingText, setPricingText] = useState(initialDesignerPricingText ?? "")
  const [turnaround, setTurnaround] = useState(initialDesignerTurnaround ?? "")
  const [emailOnInquiry, setEmailOnInquiry] = useState(initialEmailOnInquiry)
  const [emailOnMessage, setEmailOnMessage] = useState(initialEmailOnMessage)
  const [saving, setSaving] = useState(false)

  function toggleSpecialty(district: string) {
    setSpecialties((prev) =>
      prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]
    )
  }

  function toggleStyleTag(tag: string) {
    setStyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio.trim() || null,
          commissionOpen,
          portfolioUrl: portfolioUrl.trim() || null,
          pinnedEstateId: pinnedEstateId || null,
          designer,
          designerSpecialties: specialties,
          designerStyleTags: styleTags,
          designerPricingText: pricingText.trim() || null,
          designerTurnaround: turnaround.trim() || null,
          emailOnInquiry,
          emailOnMessage,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: unknown }
        throw new Error(typeof data.error === "string" ? data.error : "Failed to save")
      }
      toast.success("Designer profile saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Designer toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">I&apos;m a Designer</p>
          <p className="text-xs text-muted-foreground">Show a Designer badge on your profile and unlock designer submission</p>
        </div>
        <Switch
          checked={designer}
          onCheckedChange={setDesigner}
          aria-label="I'm a designer"
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="designer-bio">Bio</Label>
        <div className="relative">
          <textarea
            id="designer-bio"
            className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Tell the community about your design style…"
            maxLength={BIO_MAX}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {bio.length}/{BIO_MAX}
          </span>
        </div>
      </div>

      {/* Portfolio URL */}
      <div className="space-y-2">
        <Label htmlFor="portfolio-url">Portfolio URL</Label>
        <input
          id="portfolio-url"
          type="url"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="https://your-portfolio.com"
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
        />
      </div>

      {/* Open for Commissions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Open for Commissions</p>
          <p className="text-xs text-muted-foreground">Show a commission badge on your profile</p>
        </div>
        <Switch
          checked={commissionOpen}
          onCheckedChange={setCommissionOpen}
          aria-label="Open for commissions"
        />
      </div>

      {/* District specialties */}
      <div className="space-y-2">
        <Label>District Specialties</Label>
        <p className="text-xs text-muted-foreground">Select the housing districts you specialize in</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {HOUSING_DISTRICTS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleSpecialty(d.value)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <Badge
                variant={specialties.includes(d.value) ? "default" : "outline"}
                className="cursor-pointer"
              >
                {d.label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Style tags */}
      <div className="space-y-2">
        <Label>Style Tags</Label>
        <p className="text-xs text-muted-foreground">Tags that describe your design aesthetic</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {PREDEFINED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleStyleTag(tag)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <Badge
                variant={styleTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
              >
                {tag}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-2">
        <Label htmlFor="pricing-text">Pricing / Rate Info</Label>
        <div className="relative">
          <textarea
            id="pricing-text"
            className="w-full min-h-[60px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="e.g. 50k–200k gil depending on scope"
            maxLength={PRICING_MAX}
            value={pricingText}
            onChange={(e) => setPricingText(e.target.value)}
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {pricingText.length}/{PRICING_MAX}
          </span>
        </div>
      </div>

      {/* Turnaround */}
      <div className="space-y-2">
        <Label htmlFor="turnaround">Estimated Turnaround</Label>
        <input
          id="turnaround"
          type="text"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="e.g. 1–2 weeks"
          maxLength={TURNAROUND_MAX}
          value={turnaround}
          onChange={(e) => setTurnaround(e.target.value)}
        />
      </div>

      {/* Pinned Estate */}
      <div className="space-y-2">
        <Label htmlFor="pinned-estate">Pinned Estate</Label>
        <Select
          value={pinnedEstateId || "none"}
          onValueChange={(v) => setPinnedEstateId(v === "none" ? "" : v)}
        >
          <SelectTrigger id="pinned-estate">
            <SelectValue placeholder="Choose an estate to pin…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {publishedEstates.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Pinned estate appears above your estate grid on your profile.</p>
      </div>

      {/* Notification preferences */}
      <div className="space-y-4 pt-2 border-t border-border">
        <p className="text-sm font-medium pt-2">Email Notifications</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">New commission inquiry</p>
            <p className="text-xs text-muted-foreground">Email me when someone sends a new inquiry</p>
          </div>
          <Switch
            checked={emailOnInquiry}
            onCheckedChange={setEmailOnInquiry}
            aria-label="Email on new inquiry"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">New message in conversation</p>
            <p className="text-xs text-muted-foreground">Email me when a conversation has a new message</p>
          </div>
          <Switch
            checked={emailOnMessage}
            onCheckedChange={setEmailOnMessage}
            aria-label="Email on new message"
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Designer Profile"}
      </Button>
    </div>
  )
}
