import prisma from "@/lib/prisma"

export const PATHFINDER_LIMIT = 150

/**
 * Grants the Pathfinder badge to a user if they meet all criteria and a slot is available.
 * Conditions: verified FFXIV character + at least one published estate + limit not reached.
 * Safe to call multiple times — no-ops if the user already has the badge or doesn't qualify.
 */
export async function maybeGrantPathfinder(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      pathfinder: true,
      characters: { where: { verified: true }, select: { id: true }, take: 1 },
      estates: { where: { published: true, deletedAt: null }, select: { id: true }, take: 1 },
    },
  })

  if (!user || user.pathfinder) return
  if (user.characters.length === 0 || user.estates.length === 0) return

  const count = await prisma.user.count({ where: { pathfinder: true } })
  if (count >= PATHFINDER_LIMIT) return

  await prisma.user.update({ where: { id: userId }, data: { pathfinder: true } })
}
