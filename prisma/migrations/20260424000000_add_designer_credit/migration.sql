-- Add designer credit fields to Estate
-- Allows estate owners to credit the FFXIV character who designed their estate
-- with optional link to a verified FfxivCharacter on the platform

ALTER TABLE "Estate" ADD COLUMN "designerCreditName" TEXT;
ALTER TABLE "Estate" ADD COLUMN "designerCreditServer" TEXT;
ALTER TABLE "Estate" ADD COLUMN "designerCreditLodestoneId" TEXT;
ALTER TABLE "Estate" ADD COLUMN "designerCreditAvatarUrl" TEXT;
ALTER TABLE "Estate" ADD COLUMN "designerCreditCharacterId" TEXT;

ALTER TABLE "Estate" ADD CONSTRAINT "Estate_designerCreditCharacterId_fkey"
  FOREIGN KEY ("designerCreditCharacterId") REFERENCES "FfxivCharacter"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
