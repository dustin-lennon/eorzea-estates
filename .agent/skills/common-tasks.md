# Common Tasks Playbook

Recipes for frequent development tasks in FFXIV Estate Directory.

## Adding a New API Route

1. Create file: `src/app/api/<feature>/route.ts`
2. Check auth first (if protected):
   ```typescript
   const session = await auth.api.getSession({ headers: await headers() });
   if (!session) return new Response('Unauthorized', { status: 401 });
   ```
3. Use Prisma client:
   ```typescript
   import { prisma } from '@/lib/prisma';
   const data = await prisma.table.findFirst({ where: { ... } });
   ```
4. Validate input with Zod:
   ```typescript
   import { createEstateSchema } from '@/lib/schemas';
   const parsed = createEstateSchema.parse(JSON.parse(body));
   ```
5. Return JSON response:
   ```typescript
   return new Response(JSON.stringify(data), {
     status: 201,
     headers: { 'Content-Type': 'application/json' },
   });
   ```
6. Type-check: `pnpm tsc --noEmit`
7. Test: `pnpm test` and manual browser test

## Adding a Database Table

1. Add table to `prisma/schema.prisma`:
   ```prisma
   model MyTable {
     id        Int     @id @default(autoincrement())
     userId    String
     createdAt DateTime @default(now())
     // ... fields
   }
   ```
2. Create migration:
   ```bash
   pnpm prisma migrate dev --name add_my_table
   ```
3. Verify in Prisma Studio:
   ```bash
   npx prisma studio
   ```
4. Create API routes to CRUD the table
5. Update TypeScript types if needed

## Deploying to Production

**Automatic**: Merge to `main` → semantic-release → CI/CD deploy to Vercel.

**Manual** (if CI/CD fails):
```bash
# Ensure tests pass
pnpm test
pnpm tsc --noEmit

# Deploy to Vercel
pnpm vercel deploy --prod

# Apply migrations to production database
DIRECT_URL=<prod-database> pnpm prisma migrate deploy
```

## Creating a Migration

After schema change:

```bash
pnpm prisma migrate dev --name <descriptive_name>
```

This:
1. Creates migration file in `prisma/migrations/`
2. Applies to local database
3. Generates new Prisma client types

Examples:
```bash
pnpm prisma migrate dev --name add_fc_verification
pnpm prisma migrate dev --name add_comments_table
pnpm prisma migrate dev --name add_estate_transfer
```

## Rolling Back a Migration

If migration fails or needs revert:

```bash
# Locally, revert last migration
pnpm prisma migrate resolve --rolled-back <migration_name>

# Then create new migration to fix the issue
pnpm prisma migrate dev --name fix_schema
```

Production: Always create new forward migration, never rollback.

## Adding FFXIV Data

FFXIV-specific data (regions, data centers, servers, districts) is static in `src/lib/ffxiv-data.ts`.

To update:
1. Edit `ffxiv-data.ts` (no database change needed)
2. Rebuild types: `pnpm tsc --noEmit`
3. Test: Verify dropdown/filter lists show new data

Data structure:
```typescript
export const regions = [
  { id: 'amaldjaa', name: 'Amaldjaa' },
  { id: 'goblet', name: 'Goblet' },
  // ...
];

export const dataCenters = [
  { id: 'primal', name: 'Primal', regions: ['amaldjaa', ...] },
  // ...
];
```

## Adding OAuth Provider

To add a new social login (e.g., Twitch):

1. Register app on provider (Twitch OAuth)
2. Get Client ID + Secret
3. Add to `.env`:
   ```
   AUTH_TWITCH_ID="xxx"
   AUTH_TWITCH_SECRET="xxx"
   ```
4. Update `src/lib/auth.ts`:
   ```typescript
   providers: [
     discordProvider({ clientId: ..., clientSecret: ... }),
     googleProvider({ clientId: ..., clientSecret: ... }),
     twitchProvider({ clientId: ..., clientSecret: ... }), // Add this
   ],
   ```
5. Add redirect URL to Twitch: `http://localhost:3000/api/auth/callback/twitch`
6. Test: `pnpm dev` → button should appear on login page

## Implementing Lodestone Verification

Character verification flow (already implemented):

1. **Start verification**: `POST /api/lodestone/start`
   - Generates random code
   - User pastes into Lodestone bio
   
2. **Confirm verification**: `POST /api/lodestone/confirm`
   - Polls xivapi.com: `/character/<lodestoneId>`
   - Checks if bio contains code
   - Updates character as verified

To test:
```bash
# 1. Start
curl -X POST http://localhost:3000/api/lodestone/start \
  -H "Authorization: Bearer <token>"
# Returns: { code: "abc123", expiresAt: "2026-01-01T..." }

# 2. User pastes "abc123" into Lodestone bio

# 3. Confirm
curl -X POST http://localhost:3000/api/lodestone/confirm \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"code":"abc123","lodestoneId":"12345678"}'
```

## Image Uploads to Supabase Storage

Estate images stored in Supabase Storage (public CDN).

In form:
```typescript
import { uploadToStorage } from '@/lib/supabase';

const url = await uploadToStorage(file, `estates/${estateId}/${file.name}`);
```

Endpoint returns Supabase CDN URL:
```
https://xxx.supabase.co/storage/v1/object/public/estate-images/estates/123/photo.jpg
```

## Running Cron Jobs

Nightly FC estate verification: `GET /api/cron/verify-fc-estates`

Runs via external cron service (e.g., EasyCron, AWS EventBridge).

To trigger manually:
```bash
curl http://localhost:3000/api/cron/verify-fc-estates
```

Verifies:
1. Free company still owns the estate
2. Estate still exists in FFXIV
3. Marks as unverified if no longer owned

## Testing Estate Transfers

Estate ownership transfer flow:

1. Current owner initiates: `/api/estates/[id]/transfer?newOwnerId=xxx`
2. Sends confirmation email to new owner
3. New owner confirms: `/api/estate-transfer/confirm?token=xxx`
4. Ownership transferred in DB

## Reverifying FC Estates

After FC changes (disbanded, moved, etc.):

```bash
curl -X POST http://localhost:3000/api/characters/[id]/reverify-fc \
  -H "Authorization: Bearer <token>"
```

Re-fetches from xivapi, updates estate verification status.

## Branching & Release

1. Feature: `feature/<desc>` → PR to `develop`
2. Bug fix: `fix/<issue>-<desc>` → PR to `develop`
3. Release: Merge `develop` → `main` (semantic-release auto-creates release)

Never push directly to `main`. Always go through `develop` (staging).

Link PRs to issues: Use `Closes #<issue-number>` in PR description.

## Semantic Release Workflow

Merge to `main` triggers:
1. Conventional Commits analysis (feat, fix, breaking)
2. Version bump (major/minor/patch)
3. CHANGELOG update
4. GitHub release creation
5. Vercel deployment
6. Auto-sync `main` → `develop`

After merge, version is live. No manual step needed.
