-- Backfill: mark currently published estates as verified (grandfathering)
UPDATE "Estate" SET verified = true WHERE published = true AND "deletedAt" IS NULL;