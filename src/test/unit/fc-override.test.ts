import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    fcOverride: {
      findFirst: vi.fn(),
    },
  },
}))

// Mock lodestone
vi.mock("@/lib/lodestone", () => ({
  getCharacterFCId: vi.fn(),
  getFCMasterLodestoneId: vi.fn(),
}))

import prisma from "@/lib/prisma"
import { getCharacterFCId, getFCMasterLodestoneId } from "@/lib/lodestone"

// Helper that replicates the override check logic from POST /api/estates
async function checkFcEstateAccess(
  characterLodestoneId: string,
  characterId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const fcId = await (getCharacterFCId as ReturnType<typeof vi.fn>)(parseInt(characterLodestoneId)).catch(() => null)
  if (!fcId) {
    return { allowed: false, reason: "Character is not a member of a Free Company." }
  }

  const masterId = await (getFCMasterLodestoneId as ReturnType<typeof vi.fn>)(fcId).catch(() => null)
  if (masterId === characterLodestoneId) {
    return { allowed: true }
  }

  // Not the master — check for active override
  const activeOverride = await (prisma.fcOverride.findFirst as ReturnType<typeof vi.fn>)({
    where: { characterId, revokedAt: null },
  })
  if (!activeOverride || activeOverride.fcId !== fcId) {
    return { allowed: false, reason: "Character is not the owner of a Free Company." }
  }

  return { allowed: true }
}

describe("FC estate access check", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("allows access when character is the FC master", async () => {
    ;(getCharacterFCId as ReturnType<typeof vi.fn>).mockResolvedValue("fc-123")
    ;(getFCMasterLodestoneId as ReturnType<typeof vi.fn>).mockResolvedValue("char-lodestone-1")

    const result = await checkFcEstateAccess("char-lodestone-1", "char-db-id")
    expect(result.allowed).toBe(true)
  })

  it("denies access when character has no FC", async () => {
    ;(getCharacterFCId as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const result = await checkFcEstateAccess("char-lodestone-1", "char-db-id")
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe("Character is not a member of a Free Company.")
  })

  it("denies access when character is not master and has no override", async () => {
    ;(getCharacterFCId as ReturnType<typeof vi.fn>).mockResolvedValue("fc-123")
    ;(getFCMasterLodestoneId as ReturnType<typeof vi.fn>).mockResolvedValue("different-lodestone-id")
    ;(prisma.fcOverride.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const result = await checkFcEstateAccess("char-lodestone-1", "char-db-id")
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe("Character is not the owner of a Free Company.")
  })

  it("allows access when character has an active override for the same FC", async () => {
    ;(getCharacterFCId as ReturnType<typeof vi.fn>).mockResolvedValue("fc-123")
    ;(getFCMasterLodestoneId as ReturnType<typeof vi.fn>).mockResolvedValue("different-lodestone-id")
    ;(prisma.fcOverride.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "override-1",
      characterId: "char-db-id",
      fcId: "fc-123",
      revokedAt: null,
    })

    const result = await checkFcEstateAccess("char-lodestone-1", "char-db-id")
    expect(result.allowed).toBe(true)
  })

  it("denies access when override exists but is for a different FC", async () => {
    ;(getCharacterFCId as ReturnType<typeof vi.fn>).mockResolvedValue("fc-123")
    ;(getFCMasterLodestoneId as ReturnType<typeof vi.fn>).mockResolvedValue("different-lodestone-id")
    ;(prisma.fcOverride.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "override-1",
      characterId: "char-db-id",
      fcId: "fc-999",
      revokedAt: null,
    })

    const result = await checkFcEstateAccess("char-lodestone-1", "char-db-id")
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe("Character is not the owner of a Free Company.")
  })

  it("denies access when Lodestone lookup fails", async () => {
    ;(getCharacterFCId as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Lodestone unavailable"))

    const result = await checkFcEstateAccess("char-lodestone-1", "char-db-id")
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe("Character is not a member of a Free Company.")
  })
})
