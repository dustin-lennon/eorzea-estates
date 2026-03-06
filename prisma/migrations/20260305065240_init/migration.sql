-- CreateEnum
CREATE TYPE "EstateType" AS ENUM ('PRIVATE', 'FC_ESTATE', 'VENUE', 'APARTMENT', 'FC_ROOM');

-- CreateEnum
CREATE TYPE "HousingDistrict" AS ENUM ('MIST', 'LAVENDER_BEDS', 'GOBLET', 'SHIROGANE', 'EMPYREUM');

-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('BAR', 'NIGHTCLUB', 'CAFE', 'RESTAURANT', 'GALLERY', 'LIBRARY', 'SHOP', 'BATHHOUSE', 'INN', 'OTHER');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discordUsername" TEXT,
    "discordId" TEXT,
    "lodestoneCharacterId" TEXT,
    "lodestoneCharacterName" TEXT,
    "lodestoneServer" TEXT,
    "lodestoneVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "inspiration" TEXT NOT NULL,
    "type" "EstateType" NOT NULL,
    "district" "HousingDistrict",
    "region" TEXT NOT NULL,
    "dataCenter" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "ward" INTEGER,
    "plot" INTEGER,
    "tags" TEXT[],
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Estate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueDetails" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "venueType" "VenueType" NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "hours" JSONB,

    CONSTRAINT "VenueDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueStaff" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "linkedUserId" TEXT,
    "linkedEstateId" TEXT,

    CONSTRAINT "VenueStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "userId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("userId","estateId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LodestoneVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LodestoneVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueDetails_estateId_key" ON "VenueDetails"("estateId");

-- CreateIndex
CREATE UNIQUE INDEX "LodestoneVerification_userId_key" ON "LodestoneVerification"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estate" ADD CONSTRAINT "Estate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueDetails" ADD CONSTRAINT "VenueDetails_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueStaff" ADD CONSTRAINT "VenueStaff_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueStaff" ADD CONSTRAINT "VenueStaff_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueStaff" ADD CONSTRAINT "VenueStaff_linkedEstateId_fkey" FOREIGN KEY ("linkedEstateId") REFERENCES "Estate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LodestoneVerification" ADD CONSTRAINT "LodestoneVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
