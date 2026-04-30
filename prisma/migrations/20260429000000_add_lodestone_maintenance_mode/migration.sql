ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "lodestoneMaintenanceMode" BOOLEAN NOT NULL DEFAULT false;
