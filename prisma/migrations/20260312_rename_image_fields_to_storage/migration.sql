-- AlterTable
ALTER TABLE "Image" RENAME COLUMN "cloudinaryUrl" TO "imageUrl";
ALTER TABLE "Image" RENAME COLUMN "cloudinaryPublicId" TO "storageKey";
