import { ModerationAction } from "@/generated/prisma/client"
import prismaClient from "@/lib/prisma"

interface LogModerationActionArgs {
  action: ModerationAction
  entityType: string
  entityId: string
  entityName: string
  actorId: string
  note?: string | null
}

export async function logModerationAction(
  prisma: typeof prismaClient,
  args: LogModerationActionArgs
): Promise<void> {
  try {
    await prisma.moderationLog.create({
      data: {
        action: args.action,
        entityType: args.entityType,
        entityId: args.entityId,
        entityName: args.entityName,
        actorId: args.actorId,
        note: args.note ?? null,
      },
    })
  } catch {
    // Non-fatal: logging failures must not break the moderation action itself
  }
}
