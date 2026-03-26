-- CreateEnum
CREATE TYPE "FcOverrideRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "FcOverrideRequest" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "estateId" TEXT,
    "message" TEXT,
    "status" "FcOverrideRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FcOverrideRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FcOverride" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "fcId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "FcOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FcOverride_requestId_key" ON "FcOverride"("requestId");

-- AddForeignKey
ALTER TABLE "FcOverrideRequest" ADD CONSTRAINT "FcOverrideRequest_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "FfxivCharacter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcOverrideRequest" ADD CONSTRAINT "FcOverrideRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcOverrideRequest" ADD CONSTRAINT "FcOverrideRequest_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcOverrideRequest" ADD CONSTRAINT "FcOverrideRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcOverride" ADD CONSTRAINT "FcOverride_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "FcOverrideRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcOverride" ADD CONSTRAINT "FcOverride_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "FfxivCharacter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcOverride" ADD CONSTRAINT "FcOverride_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
