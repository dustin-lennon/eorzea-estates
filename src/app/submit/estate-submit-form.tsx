"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, Trash2, Palette } from "lucide-react"

import { estateFormSchema, designerEstateFormSchema, type EstateFormValues, type DesignerEstateFormValues } from "@/lib/schemas"
import { FcOverrideRequestModal } from "@/components/fc-override-request-modal"
import { z } from "zod"

type EstateFormInput = z.input<typeof estateFormSchema>
type DesignerEstateFormInput = z.input<typeof designerEstateFormSchema>
import {
  ESTATE_TYPES,
  HOUSING_DISTRICTS,
  VENUE_TYPES,
  PREDEFINED_TAGS,
  DAYS_OF_WEEK,
  REGIONS,
} from "@/lib/ffxiv-data"
import { ImageUpload, type UploadedImage } from "@/components/image-upload"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Character {
  id: string
  characterName: string
  server: string
  isFcMember: boolean
  isFcOwner: boolean
  overrideActive?: boolean
  overrideRequestStatus?: string | null
}

interface Props {
  characters: Character[]
  estateId?: string
  defaultValues?: Partial<EstateFormInput>
  isDesigner?: boolean
}

export function EstateSubmitForm({ characters, estateId, defaultValues, isDesigner = false }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [designerMode, setDesignerMode] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [conflicts, setConflicts] = useState<{ id: string; name: string; ownerName: string }[] | null>(null)
  const [pendingDesignerValues, setPendingDesignerValues] = useState<DesignerEstateFormValues | null>(null)
  const isEditing = !!estateId
  const useDesignerFlow = isDesigner && designerMode && !isEditing

  // Reset designer mode on mount to prevent stale state from soft navigation
  useEffect(() => {
    setDesignerMode(false)
  }, [])

  const form = useForm<EstateFormInput, unknown, EstateFormValues>({
    resolver: zodResolver(estateFormSchema),
    defaultValues: {
      characterId: characters[0]?.id ?? "",
      name: "",
      description: "",
      inspiration: "",
      type: "PRIVATE",
      tags: [],
      images: [],
      venueStaff: [],
      venueTimezone: "UTC",
      ...defaultValues,
    },
  })

  const designerForm = useForm<DesignerEstateFormInput, unknown, DesignerEstateFormValues>({
    resolver: zodResolver(designerEstateFormSchema),
    defaultValues: {
      dataCenter: "",
      server: "",
      name: "",
      description: "",
      inspiration: "",
      type: "PRIVATE",
      tags: [],
      images: [],
      venueStaff: [],
      venueTimezone: "UTC",
    },
  })

  // Standard form helpers
  const { fields: staffFields, append: appendStaff, remove: removeStaff } = useFieldArray({
    control: form.control,
    name: "venueStaff",
  })
  const { fields: _dStaffFields, append: _dAppendStaff, remove: _dRemoveStaff } = useFieldArray({
    control: designerForm.control,
    name: "venueStaff",
  })

  const watchedCharacterId = form.watch("characterId")
  const selectedCharacter = characters.find((c) => c.id === watchedCharacterId)

  const stdAvailableTypes = ESTATE_TYPES.filter((t) => {
    if (t.value === "FC_ESTATE") return selectedCharacter?.isFcOwner ?? false
    if (t.value === "FC_ROOM") return selectedCharacter?.isFcMember ?? false
    return true
  })
  const designerAvailableTypes = ESTATE_TYPES.filter(
    (t) => t.value !== "FC_ESTATE" && t.value !== "FC_ROOM"
  )
  const availableTypes = useDesignerFlow ? designerAvailableTypes : stdAvailableTypes

  const stdWatchedType = form.watch("type")
  const dWatchedType = designerForm.watch("type")
  const watchedType = useDesignerFlow ? dWatchedType : stdWatchedType
  const isVenue = watchedType === "VENUE"
  const isRoomType = watchedType === "APARTMENT" || watchedType === "FC_ROOM"

  const stdWatchedTags = form.watch("tags") ?? []
  const dWatchedTags = designerForm.watch("tags") ?? []
  const watchedTags = useDesignerFlow ? dWatchedTags : stdWatchedTags

  const watchedDC = designerForm.watch("dataCenter")
  const dcServers = REGIONS.flatMap((r) => r.dataCenters).find((dc) => dc.name === watchedDC)?.servers ?? []

  function toggleTag(tag: string) {
    const current = form.getValues("tags") ?? []
    if (current.includes(tag)) {
      form.setValue("tags", current.filter((t: string) => t !== tag))
    } else if (current.length < 10) {
      form.setValue("tags", [...current, tag])
    }
  }

  function dToggleTag(tag: string) {
    const current = designerForm.getValues("tags") ?? []
    if (current.includes(tag)) {
      designerForm.setValue("tags", current.filter((t: string) => t !== tag))
    } else if (current.length < 10) {
      designerForm.setValue("tags", [...current, tag])
    }
  }

  async function onSubmit(values: EstateFormValues) {
    setIsSubmitting(true)
    try {
      const res = await fetch(isEditing ? `/api/estates/${estateId}` : "/api/estates", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message ?? (isEditing ? "Update failed" : "Submission failed"))
      }

      toast.success(isEditing ? "Estate updated!" : "Estate submitted! Verify ownership from your dashboard to publish.")
      router.push("/dashboard")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isEditing ? "Update failed" : "Submission failed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onDesignerSubmit(values: DesignerEstateFormValues) {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/estates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, designerSubmission: true }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(typeof err.error === "string" ? err.error : (err.error?.message ?? "Submission failed"))
      }

      const result = await res.json() as { id?: string; attributed?: boolean; conflicts?: { id: string; name: string; ownerName: string }[] }

      if (result.conflicts) {
        setConflicts(result.conflicts)
        setPendingDesignerValues(values)
        return
      }

      toast.success(result.attributed ? "Designer attribution added to existing listing!" : "Designer estate submitted and published!")
      router.push(`/estate/${result.id!}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAttributeTo(targetEstateId: string) {
    if (!pendingDesignerValues) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/estates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingDesignerValues, designerSubmission: true, targetEstateId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(typeof err.error === "string" ? err.error : "Attribution failed")
      }
      const result = await res.json() as { id: string }
      toast.success("Designer attribution added to existing listing!")
      router.push(`/estate/${result.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Attribution failed")
    } finally {
      setIsSubmitting(false)
      setConflicts(null)
      setPendingDesignerValues(null)
    }
  }

  async function handleCreateNew() {
    if (!pendingDesignerValues) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/estates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingDesignerValues, designerSubmission: true, forceCreate: true }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(typeof err.error === "string" ? err.error : "Submission failed")
      }
      const result = await res.json() as { id: string }
      toast.success("Designer estate submitted and published!")
      router.push(`/estate/${result.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setIsSubmitting(false)
      setConflicts(null)
      setPendingDesignerValues(null)
    }
  }

  if (conflicts) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-purple-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">Existing listings found at this location</p>
              <p className="text-xs text-muted-foreground">Select the listing you designed, or create a new one.</p>
            </div>
          </div>
          <ul className="space-y-2 mb-4">
            {conflicts.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">Listed by {c.ownerName}</p>
                </div>
                <Button size="sm" onClick={() => handleAttributeTo(c.id)} disabled={isSubmitting}>
                  This is mine
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => { setConflicts(null); setPendingDesignerValues(null) }} className="text-xs text-muted-foreground hover:text-foreground transition">
              ← Back to form
            </button>
            <Button variant="outline" size="sm" onClick={handleCreateNew} disabled={isSubmitting}>
              None of these — create new listing
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (useDesignerFlow) {
    return (
      <div className="space-y-4">
        {isDesigner && !isEditing && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
            <Palette className="h-5 w-5 text-purple-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Submitting as Designer</p>
              <p className="text-xs text-muted-foreground">No character required. This estate will publish immediately and can be claimed by the owner.</p>
            </div>
            <button type="button" onClick={() => setDesignerMode(false)} className="text-xs text-muted-foreground hover:text-foreground transition">Switch to standard</button>
          </div>
        )}
        <form onSubmit={designerForm.handleSubmit(onDesignerSubmit)} className="space-y-8">
          {/* Server */}
          <Card>
            <CardHeader><CardTitle>Server *</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Select the data center and server this estate is on.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Center</Label>
                  <Select
                    value={designerForm.watch("dataCenter")}
                    onValueChange={(v) => { designerForm.setValue("dataCenter", v, { shouldValidate: true }); designerForm.setValue("server", "") }}
                  >
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select data center" /></SelectTrigger>
                    <SelectContent>
                      {REGIONS.flatMap((r) => r.dataCenters).map((dc) => (
                        <SelectItem key={dc.name} value={dc.name}>{dc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {designerForm.formState.errors.dataCenter && (
                    <p className="text-destructive text-sm mt-1">{designerForm.formState.errors.dataCenter.message}</p>
                  )}
                </div>
                <div>
                  <Label>Server</Label>
                  <Select
                    value={designerForm.watch("server")}
                    onValueChange={(v) => designerForm.setValue("server", v, { shouldValidate: true })}
                    disabled={!watchedDC}
                  >
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select server" /></SelectTrigger>
                    <SelectContent>
                      {dcServers.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {designerForm.formState.errors.server && (
                    <p className="text-destructive text-sm mt-1">{designerForm.formState.errors.server.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Screenshots */}
          <Card>
            <CardHeader><CardTitle>Screenshots *</CardTitle></CardHeader>
            <CardContent>
              <ImageUpload
                value={designerForm.watch("images") as UploadedImage[]}
                onChange={(imgs) => designerForm.setValue("images", imgs, { shouldValidate: true })}
                pathContext={{ characterId: "designer", district: designerForm.watch("district"), ward: designerForm.watch("ward"), plot: designerForm.watch("plot") }}
              />
              {designerForm.formState.errors.images && (
                <p className="text-destructive text-sm mt-1">{designerForm.formState.errors.images.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">The first image will be used as the cover photo.</p>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="d-name">Estate Name *</Label>
                <Input id="d-name" {...designerForm.register("name")} placeholder="e.g. The Wandering Hearth" className="mt-1" />
                {designerForm.formState.errors.name && (
                  <p className="text-destructive text-sm mt-1">{designerForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="d-type">Estate Type *</Label>
                <Select
                  value={designerForm.watch("type")}
                  onValueChange={(v) => {
                    designerForm.setValue("type", v as DesignerEstateFormValues["type"])
                    if (v !== "APARTMENT" && v !== "FC_ROOM") designerForm.setValue("room", undefined)
                    if (v === "APARTMENT") designerForm.setValue("plot", undefined)
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="d-description">Description *</Label>
                <Textarea id="d-description" {...designerForm.register("description")} placeholder="Describe your estate…" rows={5} className="mt-1" />
                {designerForm.formState.errors.description && (
                  <p className="text-destructive text-sm mt-1">{designerForm.formState.errors.description.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="d-inspiration">Design Inspiration</Label>
                <Textarea id="d-inspiration" {...designerForm.register("inspiration")} placeholder="What inspired your design?" rows={3} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Housing District</Label>
                <Select
                  value={designerForm.watch("district") ?? ""}
                  onValueChange={(v) => designerForm.setValue("district", v as DesignerEstateFormValues["district"])}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select district (optional)" /></SelectTrigger>
                  <SelectContent>
                    {HOUSING_DISTRICTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="d-ward">Ward (optional)</Label>
                  <Input id="d-ward" type="number" min={1} max={30} placeholder="1–30" className="mt-1"
                    value={designerForm.watch("ward") ?? ""}
                    onChange={(e) => designerForm.setValue("ward", e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                {watchedType !== "APARTMENT" && (
                  <div>
                    <Label htmlFor="d-plot">Plot (optional)</Label>
                    <Input id="d-plot" type="number" min={1} max={60} placeholder="1–60" className="mt-1"
                      value={designerForm.watch("plot") ?? ""}
                      onChange={(e) => designerForm.setValue("plot", e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                )}
                {isRoomType && (
                  <div>
                    <Label htmlFor="d-room">Room Number (optional)</Label>
                    <Input id="d-room" type="number" min={1} placeholder="Room #" className="mt-1"
                      value={designerForm.watch("room") ?? ""}
                      onChange={(e) => designerForm.setValue("room", e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                )}
                {isRoomType && (
                  <div>
                    <Label htmlFor="d-subdivision">Subdivision (optional)</Label>
                    <Select
                      value={designerForm.watch("subdivision") ?? "__none__"}
                      onValueChange={(v) =>
                        designerForm.setValue("subdivision", v === "__none__" ? undefined : (v as "Main" | "Subdivision"))
                      }
                    >
                      <SelectTrigger id="d-subdivision" className="mt-1">
                        <SelectValue placeholder="Select subdivision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unknown</SelectItem>
                        <SelectItem value="Main">Main</SelectItem>
                        <SelectItem value="Subdivision">Subdivision</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Select up to 10 tags that describe your estate.</p>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.map((tag) => {
                  const selected = dWatchedTags.includes(tag)
                  return (
                    <button key={tag} type="button" onClick={() => dToggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"}`}
                    >{tag}</button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{dWatchedTags.length}/10 selected</p>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Publish Designer Estate"}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isDesigner && !isEditing && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
          <Palette className="h-5 w-5 text-purple-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Designer? Submit without a character</p>
            <p className="text-xs text-muted-foreground">Publish your portfolio work directly. The estate owner can claim it later.</p>
          </div>
          <button type="button" onClick={() => setDesignerMode(true)} className="text-xs text-primary hover:underline transition">Use designer mode →</button>
        </div>
      )}
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Character */}
      <Card>
        <CardHeader>
          <CardTitle>Character *</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <p className="text-sm text-muted-foreground">
              {characters.find((c) => c.id === form.watch("characterId"))?.characterName ?? "Unknown"}{" "}
              <span className="opacity-60">
                ({characters.find((c) => c.id === form.watch("characterId"))?.server ?? ""})
              </span>
              <span className="block mt-1 text-xs">Character cannot be changed after submission.</span>
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Select the FFXIV character this estate belongs to. Housing limits are enforced per character.
              </p>
              <Select
                value={form.watch("characterId")}
                onValueChange={(v) => form.setValue("characterId", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select character" />
                </SelectTrigger>
                <SelectContent>
                  {characters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.characterName} <span className="text-muted-foreground">({c.server})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.characterId && (
                <p className="text-destructive text-sm mt-1">{form.formState.errors.characterId.message}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Screenshots */}
      <Card>
        <CardHeader>
          <CardTitle>Screenshots *</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={form.watch("images") as UploadedImage[]}
            onChange={(imgs) => form.setValue("images", imgs, { shouldValidate: true })}
            pathContext={{
              characterId: form.watch("characterId"),
              district: form.watch("district"),
              ward: form.watch("ward"),
              plot: form.watch("plot"),
            }}
          />
          {form.formState.errors.images && (
            <p className="text-destructive text-sm mt-1">{form.formState.errors.images.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            The first image will be used as the cover photo. Drag to reorder.
          </p>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Estate Name *</Label>
            <Input id="name" {...form.register("name")} placeholder="e.g. The Wandering Hearth" className="mt-1" />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Estate Type *</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(v) => {
                form.setValue("type", v as EstateFormValues["type"])
                if (v !== "APARTMENT" && v !== "FC_ROOM") {
                  form.setValue("room", undefined)
                }
                if (v === "APARTMENT") {
                  form.setValue("plot", undefined)
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FC officer override callout */}
          {selectedCharacter?.isFcMember && (!selectedCharacter?.isFcOwner || selectedCharacter?.overrideActive) && !useDesignerFlow && (
            <>
              <FcOverrideRequestModal
                open={overrideOpen}
                onOpenChange={setOverrideOpen}
                characterId={selectedCharacter.id}
                characterName={selectedCharacter.characterName}
              />
              <div className="rounded-lg border border-muted bg-muted/30 p-3 text-sm space-y-1">
                <p className="font-medium">Want to list your FC&apos;s estate?</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Submitting an FC estate requires being the FC master. If the leader is unavailable,
                  you can request an officer override — attach a screenshot of your nameplate and the
                  FC roster as evidence.
                </p>
                {selectedCharacter.overrideActive ? (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Your override has been approved — FC Estate is available above.
                  </p>
                ) : selectedCharacter.overrideRequestStatus === "PENDING" ? (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    Your override request is pending review.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOverrideOpen(true)}
                    className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                  >
                    Request an officer override
                  </button>
                )}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Describe your estate — the atmosphere, what it contains, what visitors can expect..."
              rows={5}
              className="mt-1"
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="inspiration">Design Inspiration</Label>
            <Textarea
              id="inspiration"
              {...form.register("inspiration")}
              placeholder="What inspired your design? A game, a movie, a real-world location, a feeling?"
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Housing District</Label>
            <Select
              value={form.watch("district") ?? ""}
              onValueChange={(v) => form.setValue("district", v as EstateFormValues["district"])}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select district (optional)" />
              </SelectTrigger>
              <SelectContent>
                {HOUSING_DISTRICTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ward">Ward (optional)</Label>
              <Input
                id="ward"
                type="number"
                min={1}
                max={30}
                placeholder="1–30"
                className="mt-1"
                value={form.watch("ward") ?? ""}
                onChange={(e) =>
                  form.setValue("ward", e.target.value ? parseInt(e.target.value) : undefined)
                }
              />
            </div>
            {watchedType !== "APARTMENT" && (
              <div>
                <Label htmlFor="plot">Plot (optional)</Label>
                <Input
                  id="plot"
                  type="number"
                  min={1}
                  max={60}
                  placeholder="1–60"
                  className="mt-1"
                  value={form.watch("plot") ?? ""}
                  onChange={(e) =>
                    form.setValue("plot", e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
              </div>
            )}
            {isRoomType && (
              <div>
                <Label htmlFor="room">Room Number (optional)</Label>
                <Input
                  id="room"
                  type="number"
                  min={1}
                  placeholder="Room #"
                  className="mt-1"
                  value={form.watch("room") ?? ""}
                  onChange={(e) =>
                    form.setValue("room", e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
              </div>
            )}
            {isRoomType && (
              <div>
                <Label htmlFor="subdivision">Subdivision (optional)</Label>
                <Select
                  value={form.watch("subdivision") ?? "__none__"}
                  onValueChange={(v) =>
                    form.setValue("subdivision", v === "__none__" ? undefined : (v as "Main" | "Subdivision"))
                  }
                >
                  <SelectTrigger id="subdivision" className="mt-1">
                    <SelectValue placeholder="Select subdivision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unknown</SelectItem>
                    <SelectItem value="Main">Main</SelectItem>
                    <SelectItem value="Subdivision">Subdivision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Select up to 10 tags that describe your estate.</p>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map((tag) => {
              const selected = watchedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{watchedTags.length}/10 selected</p>
        </CardContent>
      </Card>

      {/* Venue Details */}
      {isVenue && (
        <Card>
          <CardHeader>
            <CardTitle>Venue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Venue Type *</Label>
              <Select
                value={form.watch("venueType") ?? ""}
                onValueChange={(v) => form.setValue("venueType", v as EstateFormValues["venueType"])}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent>
                  {VENUE_TYPES.map((vt) => (
                    <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Timezone</Label>
              <Input
                {...form.register("venueTimezone")}
                placeholder="e.g. America/New_York, Europe/London, UTC"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="mb-2 block">Hours of Operation</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Leave blank for days you&apos;re closed. Use a format like &quot;8pm–11pm&quot; or &quot;By appointment&quot;.
              </p>
              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.key} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium">{day.label}</span>
                    <Input
                      placeholder="e.g. 8pm–11pm or Closed"
                      className="max-w-xs"
                      value={form.watch(`venueHours.${day.key}`) ?? ""}
                      onChange={(e) =>
                        form.setValue(`venueHours.${day.key}`, e.target.value || null)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Staff</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendStaff({ characterName: "", role: "", linkedCharacterId: "" })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Staff Member
                </Button>
              </div>

              {staffFields.length === 0 && (
                <p className="text-sm text-muted-foreground">No staff members added yet.</p>
              )}

              <div className="space-y-3">
                {staffFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Character Name *</Label>
                        <Input
                          {...form.register(`venueStaff.${index}.characterName`)}
                          placeholder="Firstname Lastname"
                          className="mt-1"
                        />
                        {form.formState.errors.venueStaff?.[index]?.characterName && (
                          <p className="text-destructive text-xs mt-1">
                            {form.formState.errors.venueStaff[index].characterName?.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Role *</Label>
                        <Input
                          {...form.register(`venueStaff.${index}.role`)}
                          placeholder="e.g. Bartender, Host, DJ"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Character Profile ID (optional)</Label>
                        <Input
                          {...form.register(`venueStaff.${index}.linkedCharacterId`)}
                          placeholder="Character ID from their profile URL (e.g. /character/abc123)"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStaff(index)}
                      className="text-destructive hover:text-destructive mt-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? isEditing ? "Saving..." : "Submitting..."
          : isEditing ? "Save Changes" : "Submit Estate"}
      </Button>
    </form>
    </div>
  )
}
