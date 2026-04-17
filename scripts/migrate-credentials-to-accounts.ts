/**
 * Phase 2 of NextAuth → Better Auth migration.
 *
 * Better Auth requires passwords to live in the Account table with
 * providerId="credential" rather than on User.password.  This script
 * copies existing bcrypt hashes from User.password into a credential
 * Account row for every user that has a password set.
 *
 * Prerequisites:
 *   - Phase 1 migration must already be deployed (adds accountId, providerId,
 *     password columns to Account).
 *
 * Safety:
 *   - Idempotent: skips users that already have a credential Account row.
 *   - Does NOT clear User.password — NextAuth still reads it during the
 *     dual-run period. User.password is dropped in Phase 5 cleanup.
 *   - Run against a DB snapshot before running against production.
 *
 * Usage:
 *   pnpm exec tsx scripts/migrate-credentials-to-accounts.ts
 */

import { config } from "dotenv"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// dotenv must be called before constructing Pool/PrismaClient.
// We cannot import src/lib/prisma because that singleton runs new Pool()
// at module evaluation time (before config() has a chance to run).
config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 1 })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function run() {
  // Find all users that have a password (credentials-based accounts)
  const users = await prisma.$queryRaw<Array<{ id: string; password: string }>>`
    SELECT id, password FROM "User" WHERE password IS NOT NULL
  `

  console.log(`Found ${users.length} user(s) with passwords`)

  let created = 0
  let skipped = 0

  for (const user of users) {
    // Check if a credential Account already exists for this user (idempotent)
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Account"
      WHERE "userId" = ${user.id}
        AND "providerId" = 'credential'
      LIMIT 1
    `

    if (existing.length > 0) {
      console.log(`  [skip] User ${user.id} — credential Account already exists`)
      skipped++
      continue
    }

    // Better Auth uses userId as the accountId for credential accounts.
    // The legacy NextAuth fields (provider, providerAccountId, type) are
    // populated so the NOT NULL constraints on those columns are satisfied
    // during the dual-run period.
    await prisma.$executeRaw`
      INSERT INTO "Account" (
        id,
        "userId",
        "accountId",
        "providerId",
        password,
        -- Legacy NextAuth fields (NOT NULL during dual-run period)
        type,
        provider,
        "providerAccountId",
        -- Timestamps
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${user.id},
        ${user.id},
        'credential',
        ${user.password},
        'credentials',
        'credentials',
        ${user.id},
        now(),
        now()
      )
    `

    console.log(`  [ok]   Created credential Account for user ${user.id}`)
    created++
  }

  console.log(`\nDone. Created: ${created}, Skipped (already existed): ${skipped}`)
}

run()
  .catch((err) => {
    console.error("Migration failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect().finally(() => pool.end()))
