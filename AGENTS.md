# AGENTS.md

Agent context for Antigravity, Kiro, and other AI coding tools.

## Project

FFXIV housing estate listing platform. Browse/share in-game estates. Public listings, OAuth-gated submission.
Live: **Not yet deployed** | GitHub: **github.com/dustinlennon/ffxiv-estate-directory**

## Commands

```bash
pnpm dev              # Next.js dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm tsc --noEmit     # Type check (run before every commit)

pnpm test             # Vitest single pass
pnpm test:watch       # Vitest watch mode
pnpm test:e2e         # Playwright E2E tests
pnpm test:e2e:ui      # Playwright E2E with UI

pnpm prisma generate  # Regenerate client after schema changes
pnpm prisma migrate dev --name <desc>  # Create + apply migration
pnpm prisma migrate deploy             # Apply migrations (production)
```

**Deployments**: Vercel. Merge to `main` = release. Feature branches → develop → main.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | React 19, breaking changes — read CLAUDE.md |
| Deploy | Vercel | Auto-deploys on `main` |
| Database | PostgreSQL + Supabase | Prisma 7 + migration files |
| Auth | Better Auth (v1) | Discord + Google OAuth, Prisma adapter |
| Storage | Supabase Storage | Images only, public CDN |
| UI | Tailwind + shadcn/ui + Radix | Forms: react-hook-form + Zod |
| Testing | Vitest (unit), Playwright (E2E) | 100% coverage expected |
| Forms | react-hook-form + Zod | Shared schemas in `src/lib/schemas.ts` |

## Critical Rules

1. **Type check first**: `pnpm tsc --noEmit` must pass before AND after changes.
2. **Auth**: Better Auth instance singleton in `src/lib/auth.ts`. Server: `auth.api.getSession()`. Client: `authClient.useSession()`.
3. **Protected routes**: `/submit`, `/dashboard`, `/estate` (except public reads). Enforced in `src/proxy.ts`.
4. **Prisma**: Client generated to `src/generated/prisma/`. Run `pnpm prisma generate` after schema changes — output is committed.
5. **Schemas**: Single source of truth in `src/lib/schemas.ts`. Used by both forms and API validators.
6. **FFXIV data**: Static in `src/lib/ffxiv-data.ts` (regions, data centers, servers, housing districts, venue types).
7. **Lodestone verification**: Users verify via Lodestone bio. Flow: `/api/lodestone/start` → user action → `/api/lodestone/confirm` polls xivapi.

## Key Architecture

- **Auth flow**: Discord/Google → Better Auth → session in DB → proxy.ts checks `/submit`, `/dashboard`, `/estate` routes
- **Estate lifecycle**: Create → optional Lodestone verify → list public → comments/likes → transfer flow
- **Tenant verification**: FC-related estates need nightly re-verify via `cron/verify-fc-estates` (calls xivapi)
- **Images**: Presigned Supabase Storage upload (client-side direct), store URL in DB
- **Semantic Release**: Merge to `main` triggers conventional-commits analysis → auto CHANGELOG + GitHub release

## File Structure (Key Paths)

```
src/
  lib/
    auth.ts / auth-client.ts      — Better Auth config + client helpers
    prisma.ts                      — Prisma singleton
    schemas.ts                     — Zod validation schemas
    ffxiv-data.ts                  — Static FFXIV regions/servers/districts
  app/
    (auth)/login                   — login page (public)
    (protected)/                   — auth-required routes (checked in proxy.ts)
      dashboard                    — user's estates
      submit                       — create estate
      /estate/[id]                 — estate detail (public reads, auth for edit)
    api/
      auth/[...all]               — Better Auth handler
      estates/[id]                — CRUD
      comments/[estateId]         — list/post
      likes/[estateId]            — toggle
      lodestone/start + confirm   — character verification
      characters/[id]             — character mgmt
      cron/verify-fc-estates      — nightly FC re-verify
```

## Deployment & Branching

- **`main`** → production + semantic-release
- **`develop`** → staging (auto-synced from `main` after release)
- Feature branches: `feature/<desc>` or `fix/<issue>-<desc>`
- Every PR needs GitHub issue (use `Closes #<issue>` in description)
- Commit format: Conventional Commits (enforced by husky + commitlint)

## Testing

- Unit: `pnpm test` (single pass), `pnpm test:watch` (watch)
- Coverage: `pnpm test:coverage`
- E2E: `pnpm test:e2e` (headless), `pnpm test:e2e:ui` (browser UI)
- Run single file: `pnpm exec vitest run src/test/unit/schemas.test.ts`

## Environment

Required in `.env`:
- `DATABASE_URL` — Supabase pooled (with `?pgbouncer=true`)
- `DIRECT_URL` — Supabase direct (migrations only)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` (dev) or domain (prod)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — web push (same as `VAPID_PUBLIC_KEY`)

See `SETUP.md` for full setup.
