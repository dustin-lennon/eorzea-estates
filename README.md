# Eorzea Estates

A community directory for Final Fantasy XIV player housing estates. Browse, submit, and discover decorated homes across all worlds.

## Features

- Browse the estate directory with search and filtering
- Submit your own estate with screenshots and details
- Estate detail pages with images and community engagement
- User profiles listing submitted estates
- Discord OAuth login via Auth.js
- Admin dashboard with estate verification workflow

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Auth | Auth.js v5 (Discord OAuth) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Image Hosting | Cloudinary |
| UI | Tailwind CSS v4, shadcn/ui, Radix UI |
| Forms | React Hook Form + Zod |
| Testing | Vitest (unit), Playwright (E2E) |
| CI/CD | GitHub Actions, semantic-release |

## Getting Started

### Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/installation)

### Environment Setup

Follow [SETUP.md](SETUP.md) to configure Supabase, Discord OAuth, and Cloudinary, then create your `.env` file.

### Install & Run

```bash
pnpm install
pnpm prisma migrate dev --name init
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm lint             # ESLint
pnpm test             # Unit tests (Vitest)
pnpm test:coverage    # Unit tests with coverage report
pnpm test:e2e         # E2E tests (Playwright)
pnpm prisma generate  # Regenerate Prisma client after schema changes
pnpm prisma studio    # Open Prisma Studio to browse the database
```

## Project Structure

```
src/
  app/              # Next.js App Router pages
    directory/      # Estate browser
    estate/[id]/    # Estate detail
    submit/         # Submit an estate
    dashboard/      # Admin dashboard + verification
    profile/[id]/   # User profile
    login/          # Login page
  auth.ts           # Auth.js server instance (with Prisma adapter)
  auth.config.ts    # Shared Auth.js config (Edge-compatible)
prisma/
  schema.prisma     # Database schema
  migrations/       # Migration history
```

## CI/CD

| Workflow | Trigger | Description |
|---|---|---|
| CI | Push / PR to `main`, `develop` | Type check, lint, unit tests, E2E tests |
| Release | Push to `main` | Creates a GitHub release via semantic-release |
| Sync develop | Push to `main` | Merges `main` back into `develop` |
| Auto Assign | Issue / PR opened | Assigns the opener as the assignee |
| Claude Code Review | PR opened | AI-assisted code review |

Commits follow the [Conventional Commits](https://www.conventionalcommits.org/) spec. `semantic-release` determines the version bump automatically.

## Contributing

1. Branch off `develop`
2. Open a PR targeting `develop`
3. Releases to `main` are made via a separate release PR from `develop`
