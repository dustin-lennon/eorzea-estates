-- Rename cloudinaryUrl to imageUrl and cloudinaryPublicId to storageKey
-- Preserves all existing rows
ALTER TABLE "Image" RENAME COLUMN "cloudinaryUrl" TO "imageUrl";
ALTER TABLE "Image" RENAME COLUMN "cloudinaryPublicId" TO "storageKey";
