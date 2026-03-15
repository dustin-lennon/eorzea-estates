-- AlterTable
ALTER TABLE "Estate" ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "designerId" TEXT;

-- CreateTable
CREATE TABLE "EstateClaimRequest" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "screenshotUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "modReason" TEXT,

    CONSTRAINT "EstateClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EstateClaimRequest_estateId_key" ON "EstateClaimRequest"("estateId");

-- AddForeignKey
ALTER TABLE "Estate" ADD CONSTRAINT "Estate_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateClaimRequest" ADD CONSTRAINT "EstateClaimRequest_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateClaimRequest" ADD CONSTRAINT "EstateClaimRequest_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateClaimRequest" ADD CONSTRAINT "EstateClaimRequest_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "FfxivCharacter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateClaimRequest" ADD CONSTRAINT "EstateClaimRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
