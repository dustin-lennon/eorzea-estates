# Architecture

FFXIV Estate Directory: Platform for FFXIV players to list, browse, and share in-game housing estates.

## Data Flow

```
User (Browser)
  ↓
Next.js 16 App Router (localhost:3000 dev, Vercel prod)
  ├→ Auth: Better Auth (Discord/Google OAuth) → Prisma session adapter
  ├→ Protected routes: `/submit`, `/dashboard`, `/estate/*` enforced in proxy.ts
  ├→ API Routes: Better Auth handler, CRUD endpoints, Lodestone verification
  ├→ Client forms: react-hook-form + Zod validation
  └→ Images: Supabase Storage (S3-compatible CDN)
    ↓
Database (PostgreSQL via Supabase)
  ├→ Prisma ORM with generated types
  ├→ Migration-based schema (pnpm prisma migrate dev)
  └→ Tables: users, estates, comments, likes, characters, FC verification
    ↓
External APIs:
  ├→ xivapi.com (character/FC lookup, verification)
  ├→ Supabase Storage (image hosting + CDN)
  └→ Discord/Google OAuth (social login)
```

## Database Schema (Simplified)

```
Core:
  User                         — Discord/Google OAuth identity
  Session                      — Better Auth session (via Prisma adapter)

Estates:
  Estate                       — User-submitted estate listings
  FfxivCharacter              — Verified FFXIV characters
  EstateLike                  — Like tracking
  Comment                     — Comments on estates

FFXIV Verification:
  EstateTransfer              — Pending ownership transfers
  FcEstate                    — FC-owned estates (nightly re-verify)
```

## Key Architecture Decisions

### Better Auth with Prisma Adapter
**Why**: OAuth + database sessions in one package.
**Implementation**: 
- `src/lib/auth.ts` — singleton Better Auth instance
- `src/lib/auth-client.ts` — client-side session helpers
- `auth.api.getSession()` — server-side session check
- `authClient.useSession()` — client-side session hook

### Protected Routes via proxy.ts
**Why**: Centralized auth check for `/submit`, `/dashboard`, `/estate` routes.
**Implementation**:
```typescript
// src/proxy.ts
if (requestPath.startsWith('/submit')) {
  const session = await auth.api.getSession({ headers });
  if (!session) return redirect('/login');
}
```

### Zod Schemas as Single Source of Truth
**Why**: Validates both client forms and API routes consistently.
**Implementation**: `src/lib/schemas.ts` — shared validation, used by:
- react-hook-form (client)
- API route handlers (server)
- Zod `.parse()` / `.safeParse()`

### Lodestone Verification Flow
**Why**: Prove FFXIV character ownership without passwords.
**Flow**:
1. User initiates: `POST /api/lodestone/start` → generates code
2. User pastes code into Lodestone bio
3. Confirm: `POST /api/lodestone/confirm` → polls xivapi.com → verifies character

### FC Estate Nightly Verification
**Why**: Ensure FC still owns listed estates (FCs disband, move houses, etc.).
**Implementation**: Cron job `GET /api/cron/verify-fc-estates` — calls xivapi, marks unverified if no longer owned.

## File Structure

```
src/
  lib/
    auth.ts / auth-client.ts       — Better Auth config
    prisma.ts                      — Prisma singleton
    schemas.ts                     — Zod validation schemas
    ffxiv-data.ts                  — Static FFXIV regions/servers/districts
  app/
    (auth)/login                   — login page (public)
    (protected)/
      dashboard                    — user's estates (auth required)
      submit                       — create estate (auth required)
      /estate/[id]                 — estate detail (public reads, auth for edit)
    api/
      auth/[...all]               — Better Auth handler
      estates/[id]                — CRUD estates
      comments/[estateId]         — list/post comments
      likes/[estateId]            — toggle like
      lodestone/start + confirm   — character verification
      characters/[id]             — character management
      characters/[id]/reverify-fc — FC re-verification
      cron/verify-fc-estates      — nightly FC verification
      estate-transfer/confirm     — ownership transfer
  components/
    ui/                            — shadcn/ui components
    EstateForm.tsx                 — submit/edit form
    EstateCard.tsx                 — listing card
  test/
    unit/                          — Vitest unit tests
    e2e/                           — Playwright E2E tests
```

## Deployment Target

**Vercel** with semantic-release:

1. Push feature to `develop` → Vercel preview deploy
2. Merge `develop` → `main` → triggers semantic-release
3. Semantic-release analyzes Conventional Commits → determines version
4. Creates CHANGELOG, GitHub release, tag
5. Vercel auto-deploys `main` to production
6. After release, `main` → `develop` auto-sync

**No manual deploy steps.** Merging to `main` is the release.

## Testing Layers

- **Unit**: Zod schemas, form logic, utility functions (Vitest)
- **Integration**: Route handlers with DB mocking (Vitest)
- **E2E**: Full user flows (Playwright) — auth, create estate, comment, etc.

## FFXIV Data (Static)

`src/lib/ffxiv-data.ts` contains:
- Regions (Amaldjaa, Goblet, Lavender Beds, etc.)
- Data Centers (Primal, Aether, Crystal, etc.)
- Servers (Excalibur, Leviathan, etc.)
- Housing Districts
- Estate Types (PRIVATE, FC_ESTATE, APARTMENT, etc.)
- Venue Types (Bar, Restaurant, etc.)

All static — no database queries needed for FFXIV reference data.

## UI Stack

- **Next.js 16** (App Router, React 19)
- **Tailwind CSS v4** + shadcn/ui + Radix UI
- **Forms**: react-hook-form + Zod
- **Testing**: Vitest (unit), Playwright (E2E)

## Continuous Integration

GitHub Actions on every push:

1. **Lint**: ESLint
2. **Type check**: `pnpm tsc --noEmit`
3. **Unit tests**: Vitest
4. **E2E tests**: Playwright
5. **Build**: `pnpm build`

All must pass before merge to `develop`. Merge to `main` only via semantic-release.

## Performance Considerations

- **Images**: Supabase CDN (geolocated, optimized delivery)
- **Database**: Supabase PostgreSQL with connection pooling
- **Bundle**: Next.js code splitting, tree-shaking
- **Cache**: ISR (Incremental Static Revalidation) on estate listings
