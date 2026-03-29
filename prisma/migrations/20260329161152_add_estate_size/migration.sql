-- CreateEnum
CREATE TYPE "EstateSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "Estate" ADD COLUMN     "size" "EstateSize";
