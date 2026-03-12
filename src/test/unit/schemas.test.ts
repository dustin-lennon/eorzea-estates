import { describe, it, expect } from "vitest"
import { estateFormSchema } from "@/lib/schemas"

const validBase = {
  characterId: "test-character-id",
  name: "The Wandering Hearth",
  description: "A cozy private estate tucked away in the Lavender Beds.",
  type: "PRIVATE" as const,
  region: "North America",
  dataCenter: "Crystal",
  server: "Balmung",
  tags: ["Cozy"],
  images: [{ url: "https://test.supabase.co/storage/v1/object/public/estate-images/test/img1.webp", storageKey: "test/img1.webp" }],
}

describe("estateFormSchema", () => {
  it("accepts a valid private estate", () => {
    const result = estateFormSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it("requires name", () => {
    const result = estateFormSchema.safeParse({ ...validBase, name: "" })
    expect(result.success).toBe(false)
  })

  it("requires description of at least 10 characters", () => {
    const result = estateFormSchema.safeParse({ ...validBase, description: "Too short" })
    expect(result.success).toBe(false)
  })

  it("requires at least one image", () => {
    const result = estateFormSchema.safeParse({ ...validBase, images: [] })
    expect(result.success).toBe(false)
  })

  it("rejects more than 10 images", () => {
    const images = Array.from({ length: 11 }, (_, i) => ({
      url: `https://test.supabase.co/storage/v1/object/public/estate-images/test/img${i}.webp`,
      storageKey: `test/img${i}.webp`,
    }))
    const result = estateFormSchema.safeParse({ ...validBase, images })
    expect(result.success).toBe(false)
  })

  it("rejects more than 10 tags", () => {
    const tags = Array.from({ length: 11 }, (_, i) => `Tag${i}`)
    const result = estateFormSchema.safeParse({ ...validBase, tags })
    expect(result.success).toBe(false)
  })

  it("defaults inspiration to empty string when omitted", () => {
    const result = estateFormSchema.safeParse(validBase)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.inspiration).toBe("")
    }
  })

  it("accepts a venue with all venue fields", () => {
    const result = estateFormSchema.safeParse({
      ...validBase,
      type: "VENUE",
      venueType: "BAR",
      venueTimezone: "America/New_York",
      venueHours: { fri: "8pm-11pm", sat: "8pm-midnight" },
      venueStaff: [{ characterName: "Firstname Lastname", role: "Bartender" }],
    })
    expect(result.success).toBe(true)
  })

  it("accepts APARTMENT without a district", () => {
    const result = estateFormSchema.safeParse({
      ...validBase,
      type: "APARTMENT",
      district: undefined,
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid estate type", () => {
    const result = estateFormSchema.safeParse({ ...validBase, type: "MANSION" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid district value", () => {
    const result = estateFormSchema.safeParse({ ...validBase, district: "GRIDANIA" })
    expect(result.success).toBe(false)
  })

  it("rejects ward outside 1-30 range", () => {
    const result = estateFormSchema.safeParse({ ...validBase, ward: 31 })
    expect(result.success).toBe(false)
  })

  it("rejects plot outside 1-60 range", () => {
    const result = estateFormSchema.safeParse({ ...validBase, plot: 0 })
    expect(result.success).toBe(false)
  })
})
