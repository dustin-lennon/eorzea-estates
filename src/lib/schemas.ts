import { z } from "zod"

export const hoursSchema = z.object({
  mon: z.string().nullable().optional(),
  tue: z.string().nullable().optional(),
  wed: z.string().nullable().optional(),
  thu: z.string().nullable().optional(),
  fri: z.string().nullable().optional(),
  sat: z.string().nullable().optional(),
  sun: z.string().nullable().optional(),
})

export const staffMemberSchema = z.object({
  characterName: z.string().min(1, "Character name is required"),
  role: z.string().min(1, "Role is required"),
  linkedCharacterId: z.string().optional(),
})

export const estateFormSchema = z.object({
  characterId: z.string().min(1, "A linked character is required"),
  name: z.string().min(1, "Estate name is required").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  inspiration: z.string().max(5000).default(""),
  type: z.enum(["PRIVATE", "FC_ESTATE", "VENUE", "APARTMENT", "FC_ROOM"]),
  district: z.enum(["MIST", "LAVENDER_BEDS", "GOBLET", "SHIROGANE", "EMPYREUM"]).optional(),
  ward: z.number().int().min(1).max(30).optional(),
  plot: z.number().int().min(1).max(60).optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
  room: z.number().int().min(1).max(2048).optional(),
  subdivision: z.enum(["Main", "Subdivision"]).optional(),
  tags: z.array(z.string()).max(10).default([]),
  images: z.array(
    z.object({ url: z.string().url(), storageKey: z.string() })
  ).min(1, "At least one screenshot is required").max(50),
  // Venue-specific
  venueType: z.enum(["BAR", "NIGHTCLUB", "CAFE", "RESTAURANT", "GALLERY", "LIBRARY", "SHOP", "BATHHOUSE", "INN", "OTHER"]).optional(),
  venueTimezone: z.string().default("UTC"),
  venueHours: hoursSchema.optional(),
  venueStaff: z.array(staffMemberSchema).default([]),
})

export type EstateFormValues = z.infer<typeof estateFormSchema>

// Designer submission — no character required; server/DC provided directly
export const designerEstateFormSchema = estateFormSchema
  .omit({ characterId: true })
  .extend({
    dataCenter: z.string().min(1, "Data center is required"),
    server: z.string().min(1, "Server is required"),
  })

export type DesignerEstateFormValues = z.infer<typeof designerEstateFormSchema>

// Designers can only work on private estates, venues, or FC estates (FC estate
// requires the designer to be a member of the same Free Company).
// Apartments and FC rooms are not eligible for designer commissions.
export const COMMISSIONABLE_ESTATE_TYPES = ["PRIVATE", "VENUE", "FC_ESTATE"] as const
export type CommissionableEstateType = (typeof COMMISSIONABLE_ESTATE_TYPES)[number]

export const inquirySchema = z.object({
  designerId: z.string().min(1),
  estateType: z.enum(["PRIVATE", "VENUE", "FC_ESTATE"]).optional(),
  district: z.enum(["MIST", "LAVENDER_BEDS", "GOBLET", "SHIROGANE", "EMPYREUM"]).optional(),
  budgetRange: z.string().max(100).optional(),
  timeframe: z.string().max(100).optional(),
  body: z.string().min(20, "Message must be at least 20 characters").max(2000),
})

export type InquiryValues = z.infer<typeof inquirySchema>

export const messageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty").max(2000),
})

export type MessageValues = z.infer<typeof messageSchema>
