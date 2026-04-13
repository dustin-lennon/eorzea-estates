-- Rename emailVerified columns to match Better Auth's expected schema.
-- BA's Prisma adapter requires emailVerified to be a Boolean field.
-- The legacy NextAuth DateTime field is preserved as emailVerifiedAt for Phase 5 cleanup.

ALTER TABLE "User" RENAME COLUMN "emailVerified" TO "emailVerifiedAt";
ALTER TABLE "User" RENAME COLUMN "emailVerifiedBool" TO "emailVerified";
