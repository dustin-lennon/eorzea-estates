"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { inquirySchema, COMMISSIONABLE_ESTATE_TYPES, type InquiryValues } from "@/lib/schemas"
import { HOUSING_DISTRICTS, ESTATE_TYPES } from "@/lib/ffxiv-data"

const COMMISSIONABLE_ESTATE_TYPE_OPTIONS = ESTATE_TYPES.filter((t) =>
  (COMMISSIONABLE_ESTATE_TYPES as readonly string[]).includes(t.value)
)

interface Props {
  designerId: string
  designerName: string
  trigger?: React.ReactNode
}

export function InquiryDialog({ designerId, designerName, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InquiryValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { designerId },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const estateType = watch("estateType")
  const district = watch("district")
  const body = watch("body") ?? ""

  async function onSubmit(values: InquiryValues) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const data = await res.json() as { error?: unknown }
      const msg = typeof data.error === "string" ? data.error : "Failed to send inquiry"
      toast.error(msg)
      return
    }

    const { conversationId } = await res.json() as { conversationId: string }
    setOpen(false)
    toast.success("Inquiry sent!")
    router.push(`/messages/${conversationId}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Send Commission Inquiry</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Commission Inquiry — {designerName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Hidden designerId */}
          <input type="hidden" {...register("designerId")} />

          {/* Estate type */}
          <div className="space-y-1.5">
            <Label htmlFor="inquiry-estate-type">Estate Type</Label>
            <Select
              value={estateType ?? ""}
              onValueChange={(v) => setValue("estateType", v as InquiryValues["estateType"])}
            >
              <SelectTrigger id="inquiry-estate-type">
                <SelectValue placeholder="Select estate type (optional)" />
              </SelectTrigger>
              <SelectContent>
                {COMMISSIONABLE_ESTATE_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {estateType === "FC_ESTATE" && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Note: The designer must be a member of your Free Company to work on an FC estate.
              </p>
            )}
            {estateType === "VENUE" && (
              <p className="text-xs text-muted-foreground">
                If this venue is owned by a Free Company, the designer must be a member of that FC.
              </p>
            )}
          </div>

          {/* District */}
          <div className="space-y-1.5">
            <Label htmlFor="inquiry-district">Housing District</Label>
            <Select
              value={district ?? ""}
              onValueChange={(v) => setValue("district", v as InquiryValues["district"])}
            >
              <SelectTrigger id="inquiry-district">
                <SelectValue placeholder="Select district (optional)" />
              </SelectTrigger>
              <SelectContent>
                {HOUSING_DISTRICTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <Label htmlFor="inquiry-budget">Budget Range</Label>
            <input
              id="inquiry-budget"
              type="text"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. 50k–200k gil"
              maxLength={100}
              {...register("budgetRange")}
            />
          </div>

          {/* Timeframe */}
          <div className="space-y-1.5">
            <Label htmlFor="inquiry-timeframe">Timeframe</Label>
            <input
              id="inquiry-timeframe"
              type="text"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. within 1 month"
              maxLength={100}
              {...register("timeframe")}
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="inquiry-body">
              Message <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <textarea
                id="inquiry-body"
                className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe your vision, references, and anything else the designer should know…"
                maxLength={2000}
                {...register("body")}
              />
              <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                {body.length}/2000
              </span>
            </div>
            {errors.body && (
              <p className="text-xs text-destructive">{errors.body.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send Inquiry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
