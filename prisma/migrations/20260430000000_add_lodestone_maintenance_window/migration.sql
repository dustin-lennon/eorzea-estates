CREATE TABLE IF NOT EXISTS "LodestoneMaintenanceWindow" (
  "id"             TEXT NOT NULL,
  "announcementId" TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "rawText"        TEXT NOT NULL,
  "startsAt"       TIMESTAMP(3) NOT NULL,
  "endsAt"         TIMESTAMP(3) NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LodestoneMaintenanceWindow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LodestoneMaintenanceWindow_announcementId_key"
  ON "LodestoneMaintenanceWindow"("announcementId");
