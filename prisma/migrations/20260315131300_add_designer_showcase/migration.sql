-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "commissionOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "designer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinnedEstateId" TEXT,
ADD COLUMN     "portfolioUrl" TEXT;

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionEstate" (
    "collectionId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CollectionEstate_pkey" PRIMARY KEY ("collectionId","estateId")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pinnedEstateId_fkey" FOREIGN KEY ("pinnedEstateId") REFERENCES "Estate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionEstate" ADD CONSTRAINT "CollectionEstate_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionEstate" ADD CONSTRAINT "CollectionEstate_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
