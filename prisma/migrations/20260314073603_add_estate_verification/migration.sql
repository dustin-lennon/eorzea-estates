-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'AI_APPROVED', 'QUEUED', 'MOD_APPROVED', 'MOD_REJECTED');

-- AlterTable
ALTER TABLE "Estate" ADD COLUMN     "verificationStatus" "VerificationStatus",
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EstateVerification" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "screenshotUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "aiConfidence" TEXT,
    "aiReason" TEXT,
    "modReason" TEXT,
    "reviewedById" TEXT,

    CONSTRAINT "EstateVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EstateVerification_estateId_key" ON "EstateVerification"("estateId");

-- AddForeignKey
ALTER TABLE "EstateVerification" ADD CONSTRAINT "EstateVerification_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateVerification" ADD CONSTRAINT "EstateVerification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
