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

interface Estate {
  id: string
  name: string
}

interface Props {
  initialBio: string | null
  initialCommissionOpen: boolean
  initialPortfolioUrl: string | null
  initialPinnedEstateId: string | null
  publishedEstates: Estate[]
}

const BIO_MAX = 160

export function DesignerProfileSettings({
  initialBio,
  initialCommissionOpen,
  initialPortfolioUrl,
  initialPinnedEstateId,
  publishedEstates,
}: Props) {
  const [bio, setBio] = useState(initialBio ?? "")
  const [commissionOpen, setCommissionOpen] = useState(initialCommissionOpen)
  const [portfolioUrl, setPortfolioUrl] = useState(initialPortfolioUrl ?? "")
  const [pinnedEstateId, setPinnedEstateId] = useState(initialPinnedEstateId ?? "")
  const [saving, setSaving] = useState(false)

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

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Designer Profile"}
      </Button>
    </div>
  )
}
