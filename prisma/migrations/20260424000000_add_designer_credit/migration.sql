-- Add designer credit fields to Estate
-- Allows estate owners to credit the FFXIV character who designed their estate
-- with optional link to a verified FfxivCharacter on the platform
-- Uses IF NOT EXISTS because db push applied these columns before this migration was tracked.

ALTER TABLE "Estate" ADD COLUMN IF NOT EXISTS "designerCreditName" TEXT;
ALTER TABLE "Estate" ADD COLUMN IF NOT EXISTS "designerCreditServer" TEXT;
ALTER TABLE "Estate" ADD COLUMN IF NOT EXISTS "designerCreditLodestoneId" TEXT;
ALTER TABLE "Estate" ADD COLUMN IF NOT EXISTS "designerCreditAvatarUrl" TEXT;
ALTER TABLE "Estate" ADD COLUMN IF NOT EXISTS "designerCreditCharacterId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Estate_designerCreditCharacterId_fkey'
      AND conrelid = 'public."Estate"'::regclass
  ) THEN
    ALTER TABLE "Estate" ADD CONSTRAINT "Estate_designerCreditCharacterId_fkey"
      FOREIGN KEY ("designerCreditCharacterId") REFERENCES "FfxivCharacter"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
