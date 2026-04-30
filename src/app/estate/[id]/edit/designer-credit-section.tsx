"use client"

import { useState, useEffect } from "react"
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

interface PlatformDesigner {
  userId: string
  name: string | null
  characterId: string
  characterName: string
  server: string
  dataCenter: string
  avatarUrl: string
}

interface Props {
  estateId: string
  initialCredit: DesignerCredit | null
}

type LookupMode = "search" | "id" | "platform"

export function DesignerCreditSection({ estateId, initialCredit }: Props) {
  const [credit, setCredit] = useState<DesignerCredit | null>(initialCredit)
  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState<LookupMode>("platform")

  // Search by name+server state
  const [characterName, setCharacterName] = useState("")
  const [server, setServer] = useState("")

  // Lodestone ID state
  const [lodestoneId, setLodestoneId] = useState("")

  // Platform designer state
  const [designers, setDesigners] = useState<PlatformDesigner[]>([])
  const [designersLoading, setDesignersLoading] = useState(false)
  const [selectedDesignerId, setSelectedDesignerId] = useState("")
  const [designerFilter, setDesignerFilter] = useState("")

  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    if ((mode === "platform" && editing) || (mode === "platform" && !credit)) {
      loadDesigners()
    }
  }, [mode, editing]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDesigners() {
    if (designers.length > 0) return
    setDesignersLoading(true)
    try {
      const res = await fetch("/api/designers")
      const data = await res.json() as PlatformDesigner[]
      setDesigners(data)
    } catch {
      toast.error("Failed to load designers")
    } finally {
      setDesignersLoading(false)
    }
  }

  function resetForm() {
    setCharacterName("")
    setServer("")
    setLodestoneId("")
    setSelectedDesignerId("")
    setDesignerFilter("")
    setEditing(false)
  }

  async function handleSave() {
    setLoading(true)
    try {
      let body: Record<string, string>
      if (mode === "platform") {
        if (!selectedDesignerId) return
        body = { platformCharacterId: selectedDesignerId }
      } else if (mode === "id") {
        body = { lodestoneId }
      } else {
        body = { characterName, server }
      }

      const res = await fetch(`/api/estates/${estateId}/designer-credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json() as DesignerCredit & { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Save failed")

      setCredit(data)
      toast.success("Designer credit saved.")
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      const res = await fetch(`/api/estates/${estateId}/designer-credit`, { method: "DELETE" })
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

  const filteredDesigners = designers.filter((d) => {
    if (!designerFilter) return true
    const q = designerFilter.toLowerCase()
    return (
      d.characterName.toLowerCase().includes(q) ||
      d.server.toLowerCase().includes(q) ||
      (d.name ?? "").toLowerCase().includes(q)
    )
  })

  const selectedDesigner = designers.find((d) => d.characterId === selectedDesignerId)

  const canSave =
    mode === "platform"
      ? selectedDesignerId !== ""
      : mode === "id"
      ? lodestoneId.trim() !== ""
      : characterName.trim() !== "" && server !== ""

  const buttonLabel = mode === "platform" ? "Save" : "Look up & Save"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-purple-500" />
        <h2 className="text-lg font-semibold">Designer Credit</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Credit the character who designed this estate&apos;s interior. If they have a verified account on Eorzea Estates, their profile will be linked.
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
            <Button size="sm" variant="outline" onClick={() => { setEditing(true); loadDesigners() }}>
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
          <div className="flex gap-1 text-sm flex-wrap">
            {(["platform", "search", "id"] as LookupMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "platform" ? "Eorzea Estates" : m === "search" ? "Name & Server" : "Lodestone ID"}
              </button>
            ))}
          </div>

          <Separator />

          {/* Platform designers */}
          {mode === "platform" && (
            <div className="space-y-3">
              {designersLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading designers…
                </div>
              ) : designers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No registered designers found.</p>
              ) : (
                <>
                  <Input
                    placeholder="Filter by name or server…"
                    value={designerFilter}
                    onChange={(e) => setDesignerFilter(e.target.value)}
                  />
                  <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                    {filteredDesigners.map((d) => (
                      <button
                        key={d.characterId}
                        type="button"
                        onClick={() => setSelectedDesignerId(d.characterId)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors ${
                          selectedDesignerId === d.characterId ? "bg-muted" : ""
                        }`}
                      >
                        {d.avatarUrl && (
                          <Image
                            src={d.avatarUrl}
                            alt={d.characterName}
                            width={32}
                            height={32}
                            className="rounded-full shrink-0 object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{d.characterName}</div>
                          <div className="text-xs text-muted-foreground">{d.server} ({d.dataCenter})</div>
                        </div>
                      </button>
                    ))}
                    {filteredDesigners.length === 0 && (
                      <p className="text-sm text-muted-foreground px-3 py-4 text-center">No results.</p>
                    )}
                  </div>
                  {selectedDesigner && (
                    <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                      <Palette className="h-3.5 w-3.5" />
                      Selected: {selectedDesigner.characterName} — profile will be linked
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Search by name + server */}
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

          {/* Lodestone ID */}
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

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={loading || !canSave}
              onClick={handleSave}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  {mode === "platform" ? "Saving…" : "Looking up…"}
                </>
              ) : (
                <>
                  {mode !== "platform" && <Search className="h-4 w-4 mr-1.5" />}
                  {buttonLabel}
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
