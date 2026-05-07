-- Make legacy NextAuth Account fields nullable so Better Auth can create
-- credential accounts without setting them (BA does not know about these fields).
ALTER TABLE "Account" ALTER COLUMN "type" DROP NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "provider" DROP NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "providerAccountId" DROP NOT NULL;
