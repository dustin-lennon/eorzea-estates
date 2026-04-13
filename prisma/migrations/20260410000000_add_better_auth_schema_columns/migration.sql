-- Phase 1: Add Better Auth schema columns (additive — applied directly to DB before code cutover)
-- This migration was applied manually; this file records it for Prisma migration history.

-- User: BA fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedBool" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "emailVerifiedBool" = true WHERE "emailVerified" IS NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Session: BA fields
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "token" TEXT;
UPDATE "Session" SET "token" = "sessionToken" WHERE "token" IS NULL;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");

-- Account: BA fields
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "providerId" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "accessToken" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "refreshToken" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "idToken" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now();
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();
UPDATE "Account" SET
  "accountId" = "providerAccountId",
  "providerId" = "provider",
  "accessToken" = "access_token",
  "refreshToken" = "refresh_token",
  "idToken" = "id_token"
WHERE "accountId" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");
