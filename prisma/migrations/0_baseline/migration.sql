-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."EstateType" AS ENUM ('PRIVATE', 'FC_ESTATE', 'VENUE', 'APARTMENT', 'FC_ROOM');

-- CreateEnum
CREATE TYPE "public"."HousingDistrict" AS ENUM ('MIST', 'LAVENDER_BEDS', 'GOBLET', 'SHIROGANE', 'EMPYREUM');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."VenueType" AS ENUM ('BAR', 'NIGHTCLUB', 'CAFE', 'RESTAURANT', 'GALLERY', 'LIBRARY', 'SHOP', 'BATHHOUSE', 'INN', 'OTHER');

-- CreateTable
CREATE TABLE "public"."Account" (
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
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Estate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "inspiration" TEXT NOT NULL,
    "type" "public"."EstateType" NOT NULL,
    "district" "public"."HousingDistrict",
    "region" TEXT NOT NULL,
    "dataCenter" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "ward" INTEGER,
    "plot" INTEGER,
    "tags" TEXT[],
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "characterId" TEXT,
    "room" INTEGER,

    CONSTRAINT "Estate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EstatePendingTransfer" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "newOwnerId" TEXT NOT NULL,
    "newCharacterId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstatePendingTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FfxivCharacter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lodestoneId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarUrl" TEXT NOT NULL DEFAULT '',
    "dataCenter" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "FfxivCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LegalPage" (
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "LegalPage_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "public"."Like" (
    "userId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("userId","estateId")
);

-- CreateTable
CREATE TABLE "public"."LodestoneVerification" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "LodestoneVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discordUsername" TEXT,
    "discordId" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VenueDetails" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "venueType" "public"."VenueType" NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "hours" JSONB,

    CONSTRAINT "VenueDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VenueStaff" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "linkedUserId" TEXT,
    "linkedCharacterId" TEXT,

    CONSTRAINT "VenueStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider" ASC, "providerAccountId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EstatePendingTransfer_estateId_key" ON "public"."EstatePendingTransfer"("estateId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EstatePendingTransfer_token_key" ON "public"."EstatePendingTransfer"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FfxivCharacter_userId_lodestoneId_key" ON "public"."FfxivCharacter"("userId" ASC, "lodestoneId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LodestoneVerification_characterId_key" ON "public"."LodestoneVerification"("characterId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "public"."User"("discordId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VenueDetails_estateId_key" ON "public"."VenueDetails"("estateId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier" ASC, "token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token" ASC);

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Estate" ADD CONSTRAINT "Estate_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."FfxivCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Estate" ADD CONSTRAINT "Estate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstatePendingTransfer" ADD CONSTRAINT "EstatePendingTransfer_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FfxivCharacter" ADD CONSTRAINT "FfxivCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalPage" ADD CONSTRAINT "LegalPage_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LodestoneVerification" ADD CONSTRAINT "LodestoneVerification_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."FfxivCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VenueDetails" ADD CONSTRAINT "VenueDetails_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VenueStaff" ADD CONSTRAINT "VenueStaff_linkedCharacterId_fkey" FOREIGN KEY ("linkedCharacterId") REFERENCES "public"."FfxivCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VenueStaff" ADD CONSTRAINT "VenueStaff_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VenueStaff" ADD CONSTRAINT "VenueStaff_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."VenueDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

