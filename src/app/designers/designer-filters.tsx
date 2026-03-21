"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HOUSING_DISTRICTS, PREDEFINED_TAGS } from "@/lib/ffxiv-data"

export function DesignerFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const openOnly = searchParams.get("openOnly") === "1"
  const specialty = searchParams.get("specialty") ?? ""
  const styleTag = searchParams.get("styleTag") ?? ""
  const sort = searchParams.get("sort") ?? "likes"

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      params.delete("page")
      router.push(`/designers?${params.toString()}`)
    },
    [router, searchParams]
  )

  function toggleStyleTag(tag: string) {
    update("styleTag", styleTag === tag ? "" : tag)
  }

  return (
    <div className="space-y-6">
      {/* Open for commissions */}
      <div className="flex items-center gap-3">
        <Switch
          id="open-only"
          checked={openOnly}
          onCheckedChange={(v) => update("openOnly", v ? "1" : null)}
        />
        <Label htmlFor="open-only" className="cursor-pointer">Open for commissions only</Label>
      </div>

      {/* District specialty */}
      <div className="space-y-2">
        <p className="text-sm font-medium">District Specialty</p>
        <Select value={specialty || "any"} onValueChange={(v) => update("specialty", v === "any" ? null : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any district" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any district</SelectItem>
            {HOUSING_DISTRICTS.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Style tags */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Style</p>
        <div className="flex flex-wrap gap-1.5">
          {PREDEFINED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleStyleTag(tag)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <Badge
                variant={styleTag === tag ? "default" : "outline"}
                className="cursor-pointer text-xs"
              >
                {tag}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Sort by</p>
        <Select value={sort} onValueChange={(v) => update("sort", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="likes">Most liked estates</SelectItem>
            <SelectItem value="newest">Newest designers</SelectItem>
            <SelectItem value="estates">Most estates designed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear */}
      {(openOnly || specialty || styleTag) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/designers")}
          className="w-full"
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
