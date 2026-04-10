-- Better Auth schema columns (additive — NextAuth columns are preserved)
-- Phase 1 of NextAuth → Better Auth migration.
-- No existing columns are dropped or renamed; NextAuth continues to function unchanged.

-- ============================================================
-- Account: add Better Auth camelCase fields
-- ============================================================
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "providerId" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "accessToken" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "refreshToken" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "idToken" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill Better Auth fields from existing NextAuth snake_case values
UPDATE "Account" SET
  "accountId" = "providerAccountId",
  "providerId" = "provider",
  "accessToken" = "access_token",
  "refreshToken" = "refresh_token",
  "idToken" = "id_token",
  "accessTokenExpiresAt" = CASE
    WHEN "expires_at" IS NOT NULL THEN to_timestamp("expires_at")
    ELSE NULL
  END
WHERE "accountId" IS NULL;

-- Add Better Auth unique constraint (allows NULLs for rows not yet populated by BA)
CREATE UNIQUE INDEX IF NOT EXISTS "Account_providerId_accountId_key"
  ON "Account"("providerId", "accountId");

-- ============================================================
-- Session: add Better Auth fields
-- ============================================================
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "token" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- Backfill token from sessionToken so existing sessions have a BA-compatible token
UPDATE "Session" SET "token" = "sessionToken" WHERE "token" IS NULL;

-- Unique index on token (NULL values are excluded from uniqueness in Postgres)
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");

-- ============================================================
-- User: add Better Auth fields
-- ============================================================
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedBool" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill emailVerifiedBool from existing DateTime emailVerified
UPDATE "User" SET "emailVerifiedBool" = true WHERE "emailVerified" IS NOT NULL;
