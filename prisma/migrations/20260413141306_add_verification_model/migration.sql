-- Add Verification table required by Better Auth for OAuth state and internal verification flows.
-- Our custom email-verify routes continue to use the existing VerificationToken table.

CREATE TABLE "Verification" (
  "id"         TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value"      TEXT NOT NULL,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "createdAt"  TIMESTAMP(3) DEFAULT now(),
  "updatedAt"  TIMESTAMP(3),
  CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);
