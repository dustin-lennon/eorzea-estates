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
DATABASE_URL          # Supabase pooled connection (with ?pgbouncer=true)
DIRECT_URL            # Supabase direct connection (required for migrations)
AUTH_SECRET           # NextAuth secret (generate with: openssl rand -base64 32)
AUTH_DISCORD_ID       # Discord OAuth client ID
AUTH_DISCORD_SECRET   # Discord OAuth client secret
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXTAUTH_URL          # http://localhost:3000 (dev) or production domain
```

## Architecture

**Eorzea Estates** is a Next.js 16 app (App Router) for FFXIV players to list, browse, and share in-game housing estates.

### Tech Stack
- **Next.js 16** with App Router, React 19, TypeScript
- **Auth**: NextAuth v5 (beta) with Discord OAuth, JWT sessions, Prisma adapter
- **Database**: PostgreSQL via Supabase, accessed with Prisma 7 (client generated to `src/generated/prisma/`)
- **Images**: Cloudinary (server-side signed uploads)
- **UI**: Tailwind CSS v4, shadcn/ui components (`src/components/ui/`), Radix UI
- **Forms**: react-hook-form + Zod validation
- **Testing**: Vitest (unit/component), Playwright (E2E)

### Key Patterns

**Auth split** (`src/auth.config.ts` / `src/auth.ts`): Config is split so `auth.config.ts` can be imported in the Edge-compatible auth/proxy layer without pulling in Node-only Prisma dependencies. `src/auth.ts` has the full adapter-based setup used in API routes and server components.

**Protected routes**: `src/proxy.ts` protects `/submit`, `/dashboard`, `/estate` (except GET `/estate/[id]` which is public).

**Prisma client**: Singleton in `src/lib/prisma.ts`, types from `src/generated/prisma/`. Run `pnpm prisma generate` after any schema change — the generated output is committed to the repo.

**Lodestone verification**: Users can optionally verify their FFXIV character by placing a generated code in their Lodestone bio. Flow: `/api/lodestone/start` issues a code → user pastes it into Lodestone → `/api/lodestone/confirm` polls xivapi.com to verify.

**FFXIV characters and estates**: Estates are tied to verified `FfxivCharacter` records. The current schema supports estate types `PRIVATE`, `FC_ESTATE`, `VENUE`, `APARTMENT`, and `FC_ROOM`, plus venue staff/details and estate transfer flows.

**FFXIV data** (`src/lib/ffxiv-data.ts`): Static data for regions, data centers, servers, housing districts, venue types, tags, and schedule helpers.

**Zod schemas** (`src/lib/schemas.ts`): Shared form validation schemas used by both client forms and API route handlers.

### API Routes (`src/app/api/`)
- `auth/[...nextauth]` — NextAuth handler
- `estates/` — create estates; `estates/[id]` — read/update/delete
- `comments/[estateId]` — list/post comments
- `likes/[estateId]` — toggle like
- `upload` — Cloudinary signed upload
- `lodestone/start` + `lodestone/confirm` — character verification
- `characters/` + `characters/[id]` — character management
- `characters/[id]/reverify-fc` — re-verification flow for FC-related estates
- `cron/verify-fc-estates` — background verification
- `estate-transfer/confirm` — estate ownership transfer confirmation

### Branching and Release Flow

There are two long-lived branches:
- **`main`** — production; every push triggers a semantic-release run and a Vercel production deploy
- **`develop`** — staging; automatically synced from `main` after every release; Vercel preview deploys on push

Feature branches should be named `feature/<description>`, fix branches `fix/<issue-number>-<description>` (matching the CI patterns). PRs target `develop` for staging or `main` for direct release work.

Every PR must have a corresponding GitHub issue. Link the issue in the PR description using `Closes #<issue-number>` so it closes automatically when the PR is merged into `develop`.

**Release process** is fully automated via `semantic-release` on push to `main`:
1. Analyzes commits since the last tag using Conventional Commits
2. Determines the next version (major/minor/patch) based on commit types
3. Generates/updates `CHANGELOG.md`
4. Creates a GitHub release and tag
5. After the release push, the `sync-develop` workflow merges `main` → `develop` automatically

There is no manual release step — merging to `main` is the release.

### Commit Conventions

Commits use Conventional Commits enforced by commitlint (husky pre-commit hook). Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`, `build`. Subject must not be start-case, pascal-case, or upper-case. Max header length: 100 chars.

Semantic Release runs on `main` and auto-generates CHANGELOG.md. `feat` → minor, `fix`/`perf`/`revert` → patch, breaking → major.
