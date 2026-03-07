-- CreateTable
CREATE TABLE "FfxivCharacter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lodestoneId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FfxivCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FfxivCharacter_userId_lodestoneId_key" ON "FfxivCharacter"("userId", "lodestoneId");

-- AddForeignKey
ALTER TABLE "FfxivCharacter" ADD CONSTRAINT "FfxivCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add characterId to Estate
ALTER TABLE "Estate" ADD COLUMN "characterId" TEXT;

-- AddForeignKey
ALTER TABLE "Estate" ADD CONSTRAINT "Estate_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "FfxivCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: replace userId with characterId on LodestoneVerification
ALTER TABLE "LodestoneVerification" ADD COLUMN "characterId" TEXT;

-- Migrate existing verification rows: drop the old fk and column
ALTER TABLE "LodestoneVerification" DROP CONSTRAINT IF EXISTS "LodestoneVerification_userId_fkey";
DROP INDEX IF EXISTS "LodestoneVerification_userId_key";
ALTER TABLE "LodestoneVerification" DROP COLUMN IF EXISTS "userId";

-- CreateIndex
CREATE UNIQUE INDEX "LodestoneVerification_characterId_key" ON "LodestoneVerification"("characterId");

-- AddForeignKey (nullable during data migration; non-null enforced by application)
ALTER TABLE "LodestoneVerification" ADD CONSTRAINT "LodestoneVerification_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "FfxivCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: drop lodestone fields from User
ALTER TABLE "User"
    DROP COLUMN IF EXISTS "lodestoneCharacterId",
    DROP COLUMN IF EXISTS "lodestoneCharacterName",
    DROP COLUMN IF EXISTS "lodestoneServer",
    DROP COLUMN IF EXISTS "lodestoneVerified";
