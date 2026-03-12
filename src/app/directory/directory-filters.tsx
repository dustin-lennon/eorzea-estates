"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DC {
  name: string
  servers: string[]
}

interface Props {
  regions: { name: string; dataCenters: DC[] }[]
  estateTypes: readonly { value: string; label: string }[]
  districts: readonly { value: string; label: string }[]
  tags: readonly string[]
}

const EMPTY = "__all__"

export function DirectoryFilters({ regions, estateTypes, districts, tags }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("page")
      if (value === null || value === EMPTY) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`/directory?${params.toString()}`)
    },
    [router, searchParams]
  )

  const toggleTag = (tag: string) => {
    const current = (searchParams.get("tags") ?? "").split(",").filter(Boolean)
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    update("tags", next.length > 0 ? next.join(",") : null)
  }

  const selectedTags = (searchParams.get("tags") ?? "").split(",").filter(Boolean)
  const selectedRegion = searchParams.get("region") ?? ""
  const selectedDC = searchParams.get("dataCenter") ?? ""

  const dataCenters = regions.find((r) => r.name === selectedRegion)?.dataCenters ?? []
  const servers = dataCenters.find((dc) => dc.name === selectedDC)?.servers ?? []

  const hasFilters =
    searchParams.get("region") ||
    searchParams.get("type") ||
    searchParams.get("district") ||
    searchParams.get("tags") ||
    searchParams.get("q")

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search</Label>
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Search estates..."
            className="pl-8"
            onChange={(e) => {
              const val = e.target.value
              const params = new URLSearchParams(searchParams.toString())
              params.delete("page")
              if (val) params.set("q", val)
              else params.delete("q")
              // Debounce via form submission
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                update("q", (e.target as HTMLInputElement).value || null)
              }
            }}
          />
        </div>
      </div>

      <Separator />

      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort</Label>
        <Select
          value={searchParams.get("sort") ?? "newest"}
          onValueChange={(v) => update("sort", v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="likes">Most Liked</SelectItem>
            <SelectItem value="updated">Recently Updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estate Type</Label>
        <Select
          value={searchParams.get("type") ?? EMPTY}
          onValueChange={(v) => update("type", v === EMPTY ? null : v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>All types</SelectItem>
            {estateTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">District</Label>
        <Select
          value={searchParams.get("district") ?? EMPTY}
          onValueChange={(v) => update("district", v === EMPTY ? null : v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="All districts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>All districts</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Region</Label>
        <Select
          value={selectedRegion || EMPTY}
          onValueChange={(v) => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete("page")
            if (v === EMPTY) params.delete("region")
            else params.set("region", v)
            params.delete("dataCenter")
            params.delete("server")
            router.push(`/directory?${params.toString()}`)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>All regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedRegion && (
          <Select
            value={selectedDC || EMPTY}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams.toString())
              params.delete("page")
              if (v === EMPTY) params.delete("dataCenter")
              else params.set("dataCenter", v)
              params.delete("server")
              router.push(`/directory?${params.toString()}`)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All data centers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY}>All data centers</SelectItem>
              {dataCenters.map((dc) => (
                <SelectItem key={dc.name} value={dc.name}>{dc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedDC && servers.length > 0 && (
          <Select
            value={searchParams.get("server") ?? EMPTY}
            onValueChange={(v) => update("server", v === EMPTY ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All servers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY}>All servers</SelectItem>
              {servers.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator />

      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const active = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {hasFilters && (
        <>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => router.push("/directory")}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear all filters
          </Button>
        </>
      )}
    </div>
  )
}
