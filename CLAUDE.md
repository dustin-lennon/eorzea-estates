# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm tsc --noEmit     # Type check

pnpm test             # Run unit tests (Vitest, single pass)
pnpm test:watch       # Run unit tests in watch mode
pnpm test:coverage    # Run unit tests with coverage report
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:e2e:ui      # Run Playwright E2E tests with UI

pnpm prisma generate  # Regenerate Prisma client (run after schema changes)
pnpm prisma migrate dev --name <name>  # Create and apply a migration
pnpm prisma migrate deploy             # Apply migrations (production)
```

To run a single Vitest test file:
```bash
pnpm exec vitest run src/test/unit/schemas.test.ts
```

## Environment Variables

Required in `.env` (see `SETUP.md` for full setup instructions):

```
DATABASE_URL              # Supabase pooled connection (with ?pgbouncer=true)
DIRECT_URL                # Supabase direct connection (required for migrations)
SUPABASE_URL              # Supabase project URL (for Storage)
SUPABASE_SERVICE_ROLE_KEY # Supabase service role key (for Storage)
BETTER_AUTH_SECRET        # Better Auth secret (generate with: openssl rand -base64 32)
AUTH_DISCORD_ID           # Discord OAuth client ID
AUTH_DISCORD_SECRET       # Discord OAuth client secret
AUTH_GOOGLE_ID            # Google OAuth client ID
AUTH_GOOGLE_SECRET        # Google OAuth client secret
BETTER_AUTH_URL           # http://localhost:3000 (dev) or production domain
NEXT_PUBLIC_APP_URL       # http://localhost:3000 (dev) or production domain (public)
NEXT_PUBLIC_VAPID_PUBLIC_KEY  # VAPID public key for web push (same value as VAPID_PUBLIC_KEY)
```

## Architecture

**Eorzea Estates** is a Next.js 16 app (App Router) for FFXIV players to list, browse, and share in-game housing estates.

### Tech Stack
- **Next.js 16** with App Router, React 19, TypeScript
- **Auth**: Better Auth with Discord and Google OAuth, database sessions, Prisma adapter
- **Database**: PostgreSQL via Supabase, accessed with Prisma 7 (client generated to `src/generated/prisma/`)
- **Images**: Supabase Storage, served via `*.supabase.co`
- **UI**: Tailwind CSS v4, shadcn/ui components (`src/components/ui/`), Radix UI
- **Forms**: react-hook-form + Zod validation
- **Testing**: Vitest (unit/component), Playwright (E2E)

### Key Patterns

**Auth instance** (`src/lib/auth.ts`): Single Better Auth instance with Prisma adapter, Discord and Google social providers, email+password, and `databaseHooks` for OAuth avatar sync. Client helpers in `src/lib/auth-client.ts`. Server session access: `auth.api.getSession({ headers: await headers() })` from `@/lib/auth`. Client session: `authClient.useSession()` from `@/lib/auth-client`.

**Protected routes**: `src/proxy.ts` protects `/submit`, `/dashboard`, `/estate` (except GET `/estate/[id]` which is public).

**Prisma client**: Singleton in `src/lib/prisma.ts`, types from `src/generated/prisma/`. Run `pnpm prisma generate` after any schema change — the generated output is committed to the repo.

**Lodestone verification**: Users can optionally verify their FFXIV character by placing a generated code in their Lodestone bio. Flow: `/api/lodestone/start` issues a code → user pastes it into Lodestone → `/api/lodestone/confirm` polls xivapi.com to verify.

**FFXIV characters and estates**: Estates are tied to verified `FfxivCharacter` records. The current schema supports estate types `PRIVATE`, `FC_ESTATE`, `VENUE`, `APARTMENT`, and `FC_ROOM`, plus venue staff/details and estate transfer flows.

**FFXIV data** (`src/lib/ffxiv-data.ts`): Static data for regions, data centers, servers, housing districts, venue types, tags, and schedule helpers.

**Zod schemas** (`src/lib/schemas.ts`): Shared form validation schemas used by both client forms and API route handlers.

### API Routes (`src/app/api/`)
- `auth/[...all]` — Better Auth handler
- `estates/` — create estates; `estates/[id]` — read/update/delete
- `comments/[estateId]` — list/post comments
- `likes/[estateId]` — toggle like
- `upload` — image upload
- `lodestone/start` + `lodestone/confirm` — character verification
- `characters/` + `characters/[id]` — character management
- `characters/[id]/reverify-fc` — re-verification flow for FC-related estates
- `cron/verify-fc-estates` — background verification
- `estate-transfer/confirm` — estate ownership transfer confirmation

### Branching and Release Flow

There are two long-lived branches:
- **`main`** — production; every push triggers a semantic-release run and a Cloudflare Workers production deploy
- **`develop`** — staging; Vercel preview deploys on push; all feature/fix work lands here first

**Normal flow (all work):**
1. Create a GitHub issue
2. Cut a branch from `develop`: `feature/<description>` or `fix/<issue-number>-<description>`
3. Open a PR targeting **`develop`**
4. Link the issue with `Closes #<issue-number>` in the PR body
5. Merge into `develop` — triggers CI and preview deploy

**Release flow (promoting develop → production):**
1. Open a PR from `develop` → `main`
2. Merge — triggers `semantic-release` on `main`:
   - Analyzes Conventional Commits since last tag
   - Determines next version (`feat` → minor, `fix`/`perf`/`revert` → patch, breaking → major)
   - Generates/updates `CHANGELOG.md`, creates GitHub release and tag
3. Release completion triggers the Cloudflare Workers production deploy

**Hotfixes** (rare — critical prod-only issues): cut from `main`, PR to `main` directly, then manually sync `main` → `develop` afterward.

Every PR must have a corresponding GitHub issue.

### Commit Conventions

Commits use Conventional Commits enforced by commitlint (husky pre-commit hook). Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`, `build`. Subject must not be start-case, pascal-case, or upper-case. Max header length: 100 chars.

Semantic Release runs on `main` and auto-generates CHANGELOG.md. `feat` → minor, `fix`/`perf`/`revert` → patch, breaking → major.
