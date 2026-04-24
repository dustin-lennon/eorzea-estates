"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { Palette, X, Search, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { REGIONS } from "@/lib/ffxiv-data"

interface DesignerCredit {
  name: string
  server: string
  lodestoneId: string
  avatarUrl: string
  profileCharacterId: string | null
  profileUserId: string | null
}

interface Props {
  estateId: string
  initialCredit: DesignerCredit | null
}

type LookupMode = "search" | "id"

export function DesignerCreditSection({ estateId, initialCredit }: Props) {
  const [credit, setCredit] = useState<DesignerCredit | null>(initialCredit)
  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState<LookupMode>("search")
  const [characterName, setCharacterName] = useState("")
  const [server, setServer] = useState("")
  const [lodestoneId, setLodestoneId] = useState("")
  const [preview, setPreview] = useState<DesignerCredit | null>(null)
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(false)

  function resetForm() {
    setCharacterName("")
    setServer("")
    setLodestoneId("")
    setPreview(null)
    setEditing(false)
  }

  async function handleLookup() {
    setLoading(true)
    setPreview(null)
    try {
      const body =
        mode === "id"
          ? { lodestoneId }
          : { characterName, server }

      const res = await fetch(`/api/estates/${estateId}/designer-credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json() as DesignerCredit & { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Lookup failed")

      setPreview(data)
      setCredit(data)
      toast.success("Designer credit saved.")
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lookup failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      const res = await fetch(`/api/estates/${estateId}/designer-credit`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to remove credit")
      }
      setCredit(null)
      toast.success("Designer credit removed.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove credit")
    } finally {
      setRemoving(false)
    }
  }

  const canLookup =
    mode === "id" ? lodestoneId.trim() !== "" : characterName.trim() !== "" && server !== ""

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-purple-500" />
        <h2 className="text-lg font-semibold">Designer Credit</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Credit the character who designed this estate&apos;s interior. A Lodestone lookup fetches their profile image.
        If they have a verified character on Eorzea Estates, their profile will be linked.
      </p>

      {credit && !editing && (
        <div className="flex items-center justify-between rounded-lg border p-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {credit.avatarUrl && (
              <Image
                src={credit.avatarUrl}
                alt={credit.name}
                width={40}
                height={40}
                className="rounded-full shrink-0 object-cover"
              />
            )}
            <div className="min-w-0">
              <div className="font-medium text-sm flex items-center gap-1.5">
                {credit.profileUserId ? (
                  <Link
                    href={`/profile/${credit.profileUserId}`}
                    className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {credit.name}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  credit.name
                )}
              </div>
              <div className="text-xs text-muted-foreground">{credit.server}</div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Change
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={removing}
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {(!credit || editing) && (
        <div className="rounded-lg border p-4 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-1 text-sm">
            <button
              type="button"
              onClick={() => { setMode("search"); setPreview(null) }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                mode === "search"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Name &amp; Server
            </button>
            <button
              type="button"
              onClick={() => { setMode("id"); setPreview(null) }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                mode === "id"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lodestone ID
            </button>
          </div>

          <Separator />

          {mode === "search" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dc-name">Character Name</Label>
                <Input
                  id="dc-name"
                  placeholder="Firstname Lastname"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-server">Server</Label>
                <Select value={server} onValueChange={setServer}>
                  <SelectTrigger id="dc-server">
                    <SelectValue placeholder="Select server" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) =>
                      region.dataCenters.map((dc) => (
                        <SelectGroup key={dc.name}>
                          <SelectLabel>{region.name} — {dc.name}</SelectLabel>
                          {dc.servers.map((s) => (
                            <SelectItem key={`${dc.name}-${s}`} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {mode === "id" && (
            <div className="space-y-1.5">
              <Label htmlFor="dc-lodestone-id">Lodestone Profile ID</Label>
              <Input
                id="dc-lodestone-id"
                placeholder="e.g. 12345678"
                value={lodestoneId}
                onChange={(e) => setLodestoneId(e.target.value.replace(/\D/g, ""))}
              />
              <p className="text-xs text-muted-foreground">
                Found in the Lodestone URL: na.finalfantasyxiv.com/lodestone/character/<strong>12345678</strong>/
              </p>
            </div>
          )}

          {preview && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              {preview.avatarUrl && (
                <Image
                  src={preview.avatarUrl}
                  alt={preview.name}
                  width={40}
                  height={40}
                  className="rounded-full shrink-0 object-cover"
                />
              )}
              <div className="min-w-0">
                <div className="font-medium text-sm">{preview.name}</div>
                <div className="text-xs text-muted-foreground">{preview.server}</div>
                {preview.profileUserId && (
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                    Verified on Eorzea Estates — profile will be linked
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={loading || !canLookup}
              onClick={handleLookup}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Looking up…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1.5" />
                  {preview ? "Re-search" : "Look up & Save"}
                </>
              )}
            </Button>
            {editing && (
              <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
