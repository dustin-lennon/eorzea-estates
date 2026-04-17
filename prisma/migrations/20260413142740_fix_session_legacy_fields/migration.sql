-- Make legacy NextAuth Session fields nullable and add BA-required fields.
-- BA writes expiresAt/createdAt and does not know about sessionToken/expires.

-- Add BA fields
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Backfill expiresAt from the legacy expires column for any existing rows
UPDATE "Session" SET "expiresAt" = "expires" WHERE "expiresAt" IS NULL;

-- Make legacy fields nullable so BA can create sessions without them
ALTER TABLE "Session" ALTER COLUMN "sessionToken" DROP NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "expires" DROP NOT NULL;
