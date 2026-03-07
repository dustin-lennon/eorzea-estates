import { describe, it, expect } from "vitest"
import {
  REGIONS,
  HOUSING_DISTRICTS,
  ESTATE_TYPES,
  VENUE_TYPES,
  PREDEFINED_TAGS,
  getAllServers,
  getDataCenters,
  getServers,
  PLOT_BASED_TYPES,
} from "@/lib/ffxiv-data"

describe("FFXIV static data", () => {
  describe("REGIONS", () => {
    it("has 4 regions", () => {
      expect(REGIONS).toHaveLength(4)
    })

    it("includes expected region names", () => {
      const names = REGIONS.map((r) => r.name)
      expect(names).toContain("North America")
      expect(names).toContain("Europe")
      expect(names).toContain("Japan")
      expect(names).toContain("Oceania")
    })

    it("each region has at least one data center", () => {
      REGIONS.forEach((region) => {
        expect(region.dataCenters.length).toBeGreaterThan(0)
      })
    })

    it("each data center has at least one server", () => {
      REGIONS.forEach((region) => {
        region.dataCenters.forEach((dc) => {
          expect(dc.servers.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe("HOUSING_DISTRICTS", () => {
    it("has 5 districts", () => {
      expect(HOUSING_DISTRICTS).toHaveLength(5)
    })

    it("includes all expected districts", () => {
      const values = HOUSING_DISTRICTS.map((d) => d.value)
      expect(values).toContain("MIST")
      expect(values).toContain("LAVENDER_BEDS")
      expect(values).toContain("GOBLET")
      expect(values).toContain("SHIROGANE")
      expect(values).toContain("EMPYREUM")
    })
  })

  describe("ESTATE_TYPES", () => {
    it("has 5 estate types", () => {
      expect(ESTATE_TYPES).toHaveLength(5)
    })

    it("includes VENUE type", () => {
      expect(ESTATE_TYPES.map((t) => t.value)).toContain("VENUE")
    })

    it("includes APARTMENT and FC_ROOM", () => {
      const values = ESTATE_TYPES.map((t) => t.value)
      expect(values).toContain("APARTMENT")
      expect(values).toContain("FC_ROOM")
    })
  })

  describe("VENUE_TYPES", () => {
    it("has at least 8 venue types", () => {
      expect(VENUE_TYPES.length).toBeGreaterThanOrEqual(8)
    })

    it("includes BAR and NIGHTCLUB", () => {
      const values = VENUE_TYPES.map((v) => v.value)
      expect(values).toContain("BAR")
      expect(values).toContain("NIGHTCLUB")
    })
  })

  describe("PREDEFINED_TAGS", () => {
    it("has at least 10 tags", () => {
      expect(PREDEFINED_TAGS.length).toBeGreaterThanOrEqual(10)
    })

    it("all tags are non-empty strings", () => {
      PREDEFINED_TAGS.forEach((tag) => {
        expect(typeof tag).toBe("string")
        expect(tag.length).toBeGreaterThan(0)
      })
    })
  })

  describe("PLOT_BASED_TYPES", () => {
    it("includes PRIVATE, FC_ESTATE, VENUE", () => {
      expect(PLOT_BASED_TYPES).toContain("PRIVATE")
      expect(PLOT_BASED_TYPES).toContain("FC_ESTATE")
      expect(PLOT_BASED_TYPES).toContain("VENUE")
    })

    it("includes FC_ROOM but not APARTMENT", () => {
      expect(PLOT_BASED_TYPES).toContain("FC_ROOM")
      expect(PLOT_BASED_TYPES).not.toContain("APARTMENT")
    })
  })

  describe("getAllServers()", () => {
    it("returns a flat list of server strings", () => {
      const servers = getAllServers()
      expect(Array.isArray(servers)).toBe(true)
      expect(servers.length).toBeGreaterThan(0)
      servers.forEach((s) => expect(typeof s).toBe("string"))
    })

    it("includes well-known servers", () => {
      const servers = getAllServers()
      expect(servers).toContain("Balmung")
      expect(servers).toContain("Gilgamesh")
      expect(servers).toContain("Moogle")
    })
  })

  describe("getDataCenters()", () => {
    it("returns data centers for a valid region", () => {
      const dcs = getDataCenters("North America")
      expect(dcs.length).toBeGreaterThan(0)
      expect(dcs[0]).toHaveProperty("name")
      expect(dcs[0]).toHaveProperty("servers")
    })

    it("returns empty array for unknown region", () => {
      expect(getDataCenters("Atlantis")).toEqual([])
    })
  })

  describe("getServers()", () => {
    it("returns servers for a valid region + DC", () => {
      const servers = getServers("North America", "Crystal")
      expect(servers.length).toBeGreaterThan(0)
      expect(servers).toContain("Balmung")
    })

    it("returns empty array for unknown DC", () => {
      expect(getServers("North America", "Unknown DC")).toEqual([])
    })

    it("returns empty array for unknown region", () => {
      expect(getServers("Neverland", "Crystal")).toEqual([])
    })
  })
})
