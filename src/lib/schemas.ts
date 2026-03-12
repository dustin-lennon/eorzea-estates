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
  room: z.number().int().min(1).max(2048).optional(),
  tags: z.array(z.string()).max(10).default([]),
  images: z.array(
    z.object({ url: z.string().url(), storageKey: z.string() })
  ).min(1, "At least one screenshot is required").max(10),
  // Venue-specific
  venueType: z.enum(["BAR", "NIGHTCLUB", "CAFE", "RESTAURANT", "GALLERY", "LIBRARY", "SHOP", "BATHHOUSE", "INN", "OTHER"]).optional(),
  venueTimezone: z.string().default("UTC"),
  venueHours: hoursSchema.optional(),
  venueStaff: z.array(staffMemberSchema).default([]),
})

export type EstateFormValues = z.infer<typeof estateFormSchema>
