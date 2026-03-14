-- AlterTable
ALTER TABLE "Estate" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "disputeEmail" TEXT NOT NULL DEFAULT 'dispute@eorzeaestates.com';
