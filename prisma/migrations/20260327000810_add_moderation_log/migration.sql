-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('ESTATE_APPROVED', 'ESTATE_REJECTED', 'ESTATE_REMOVED', 'ESTATE_RESTORED', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'FC_OVERRIDE_APPROVED', 'FC_OVERRIDE_DENIED');

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModerationLog_createdAt_idx" ON "ModerationLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ModerationLog_actorId_idx" ON "ModerationLog"("actorId");

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
