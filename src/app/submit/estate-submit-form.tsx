"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

import { estateFormSchema, type EstateFormValues } from "@/lib/schemas"
import { z } from "zod"

type EstateFormInput = z.input<typeof estateFormSchema>
import {
  ESTATE_TYPES,
  HOUSING_DISTRICTS,
  VENUE_TYPES,
  PREDEFINED_TAGS,
  DAYS_OF_WEEK,
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
}

interface Props {
  characters: Character[]
  estateId?: string
  defaultValues?: Partial<EstateFormInput>
}

export function EstateSubmitForm({ characters, estateId, defaultValues }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!estateId

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

  const { fields: staffFields, append: appendStaff, remove: removeStaff } = useFieldArray({
    control: form.control,
    name: "venueStaff",
  })

  const watchedType = form.watch("type")
  const isVenue = watchedType === "VENUE"
  const isRoomType = watchedType === "APARTMENT" || watchedType === "FC_ROOM"

  const watchedTags = form.watch("tags") ?? []

  function toggleTag(tag: string) {
    const current = form.getValues("tags") ?? []
    if (current.includes(tag)) {
      form.setValue("tags", current.filter((t: string) => t !== tag))
    } else if (current.length < 10) {
      form.setValue("tags", [...current, tag])
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

      const { id } = await res.json()
      toast.success(isEditing ? "Estate updated!" : "Estate submitted successfully!")
      router.push(`/estate/${isEditing ? estateId : id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isEditing ? "Update failed" : "Submission failed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
                {ESTATE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
  )
}
