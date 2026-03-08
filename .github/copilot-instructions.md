# GitHub Copilot Instructions

## Project Overview

This repository is **Eorzea Estates**, a Next.js 16 App Router application for browsing, submitting, and managing Final Fantasy XIV housing listings.

Primary stack:

- Next.js 16 with App Router
- React 19 and TypeScript
- Auth.js / NextAuth v5 with Discord OAuth
- Prisma 7 with PostgreSQL (Supabase)
- Tailwind CSS v4 with shadcn/ui and Radix UI
- React Hook Form with Zod
- Vitest for unit/component tests
- Playwright for E2E tests

## Development Commands

Prefer `pnpm`.

Common commands:

- `pnpm dev` - start the local dev server
- `pnpm build` - production build
- `pnpm lint` - run ESLint
- `pnpm tsc --noEmit` - type-check
- `pnpm test` - run Vitest once
- `pnpm test:watch` - run Vitest in watch mode
- `pnpm test:coverage` - run Vitest with coverage
- `pnpm test:e2e` - run Playwright tests
- `pnpm test:e2e:ui` - run Playwright with UI mode
- `pnpm prisma generate` - regenerate the Prisma client after schema changes
- `pnpm prisma migrate dev --name <name>` - create and apply a migration locally
- `pnpm prisma migrate deploy` - apply migrations in production

## Architecture and File Layout

Important project structure:

- `src/app/` - App Router pages and route handlers
- `src/app/api/` - API endpoints for auth, estates, comments, likes, uploads, Lodestone verification, characters, cron jobs, and estate transfer
- `src/auth.config.ts` - edge-safe Auth.js config
- `src/auth.ts` - full Auth.js setup with Prisma adapter
- `src/proxy.ts` - route protection for authenticated areas
- `src/lib/` - Prisma client, validation, FFXIV data, Cloudinary, Lodestone, email, utilities
- `src/components/` - shared UI and feature components
- `src/components/ui/` - shadcn/ui primitives
- `prisma/schema.prisma` - Prisma schema
- `prisma/migrations/` - committed migration history
- `src/generated/prisma/` - generated Prisma client output committed to the repo
- `src/test/` - Vitest test setup, unit tests, and component tests
- `e2e/` - Playwright tests

## Current Domain Model

The codebase currently includes:

- Users authenticated through Discord
- Verified FFXIV characters
- Estate listings tied to a verified character
- Estate types: `PRIVATE`, `FC_ESTATE`, `VENUE`, `APARTMENT`, `FC_ROOM`
- Venue-specific details including hours and staff
- Comments and likes
- Lodestone verification records
- Estate pending transfer flow

When suggesting schema-aware code, use the current Prisma schema rather than older assumptions.

## Auth and Route Protection

Follow the existing auth split:

- Keep `src/auth.config.ts` free of Node-only dependencies so it remains safe for edge/runtime use
- Put Prisma adapter usage and full auth wiring in `src/auth.ts`
- Use `auth()` from `@/auth` in server components and route handlers when session access is needed

Protected route behavior currently lives in `src/proxy.ts`, not `middleware.ts`.

Protected prefixes:

- `/submit`
- `/dashboard`
- `/estate`

Exception:

- `GET /estate/[id]` is public

When adding auth-sensitive features, preserve this pattern unless the surrounding code is explicitly being redesigned.

## Database and Prisma Conventions

- Import Prisma via `@/lib/prisma`
- Reuse the Prisma singleton from `src/lib/prisma.ts`; do not instantiate new clients ad hoc
- After schema changes, update migrations and regenerate the client
- Assume generated Prisma client types come from `src/generated/prisma/`
- Keep Prisma queries close to the server boundary: server components, route handlers, and server actions

## Validation and Forms

- Shared validation belongs in `src/lib/schemas.ts`
- Reuse Zod schemas across forms and API handlers instead of duplicating validation
- Existing forms use `react-hook-form` with `zodResolver`; follow that pattern for new complex forms
- Estate creation/edit flows should continue to validate against the shared estate schema and the current per-character ownership rules

## UI Conventions

- Prefer server components by default; add `"use client"` only when hooks, browser APIs, or client-side interactivity are required
- Reuse existing shadcn/ui components from `src/components/ui/` before creating new primitives
- Use the `cn` helper from `@/lib/utils` for class composition
- Maintain the existing Tailwind v4 token/theme approach defined in `src/app/globals.css`
- Preserve current naming and import conventions such as `@/` path aliases

## API and Data Handling

- Route handlers live under `src/app/api/**/route.ts`
- Return `NextResponse.json(...)` with explicit status codes
- Validate request payloads before writing to the database
- Keep authorization checks close to mutations
- Reuse existing static FFXIV data utilities from `src/lib/ffxiv-data.ts`
- For Lodestone and character-related features, build on the existing verification flow instead of introducing parallel logic

## Testing Expectations

When changing behavior:

- Add or update Vitest tests in `src/test/unit/` or `src/test/components/`
- Add or update Playwright coverage in `e2e/` for important user flows
- Prefer focused tests over broad snapshots

Before finishing a substantial change, the most relevant checks are:

- `pnpm lint`
- `pnpm tsc --noEmit`
- `pnpm test`
- `pnpm test:e2e` when the change affects end-to-end behavior

## Environment Variables

The project expects environment variables in `.env`, including:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_DISCORD_ID`
- `AUTH_DISCORD_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXTAUTH_URL`

Refer to `SETUP.md` for local setup details.

## Git and Release Workflow

The repository uses two long-lived branches:

- `main` - production and semantic-release
- `develop` - staging/integration

Conventions:

- Prefer feature branches like `feature/<description>`
- Prefer fix branches like `fix/<issue-number>-<description>`
- Commits should follow Conventional Commits
- Every PR should be tied to a GitHub issue

Release flow is automated:

- pushes to `main` run semantic-release
- changelog and release tagging are automated
- `main` is synced back into `develop`

## Copilot Guidance

When generating suggestions for this repository:

- prefer minimal diffs that fit the existing structure
- do not replace working patterns with generic boilerplate
- keep server-only logic out of client components
- avoid duplicating validation, auth wiring, or Prisma access helpers
- preserve existing feature-specific behavior around verified characters, estate ownership, venue details, likes, comments, and transfer flows
- align with current route names and file locations in the repository, not stale documentation
