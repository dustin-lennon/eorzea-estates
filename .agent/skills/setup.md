# Setup Playbook

First-time setup for FFXIV Estate Directory.

## Environment Variables

Create `.env` file in project root:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@db.supabase.co:5432/postgres"

# Supabase Storage (images)
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Better Auth (OAuth)
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Discord OAuth
AUTH_DISCORD_ID="xxx"
AUTH_DISCORD_SECRET="xxx"

# Google OAuth
AUTH_GOOGLE_ID="xxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="xxx"

# Web Push (optional, for future notifications)
VAPID_PUBLIC_KEY="xxx"
VAPID_PRIVATE_KEY="xxx"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="xxx"
```

## Install & Build

```bash
# Install deps
pnpm install

# Type-check
pnpm tsc --noEmit

# Dev server
pnpm dev                    # localhost:3000

# Linting
pnpm lint
```

## Database Setup

First time after cloning:

```bash
# Generate Prisma client
pnpm prisma generate

# Apply schema to Supabase
pnpm prisma migrate deploy
```

After schema changes:

```bash
# Create migration
pnpm prisma migrate dev --name <description>

# Apply to production
pnpm prisma migrate deploy
```

## Supabase Setup

1. Go to https://app.supabase.com
2. Create project (or use existing)
3. Get connection strings from Settings → Database → Connection Pooling
   - `DATABASE_URL` (pgBouncer pooled, for app)
   - `DIRECT_URL` (direct connection, for migrations)
4. Enable Storage bucket for images:
   - Storage → New Bucket → `estate-images` (public)
   - Allow authenticated users to upload

## OAuth Setup

### Discord
1. Go to https://discord.com/developers/applications
2. Create application
3. Copy Client ID + Secret to `.env`
4. Add OAuth redirect: `http://localhost:3000/api/auth/callback/discord`

### Google
1. Go to https://console.cloud.google.com
2. Create OAuth credentials (Web)
3. Copy Client ID + Secret to `.env`
4. Add redirect: `http://localhost:3000/api/auth/callback/google`

### Better Auth
1. Generate secret: `openssl rand -base64 32`
2. Add to `.env` as `BETTER_AUTH_SECRET`
3. Set `BETTER_AUTH_URL` to your domain

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e              # headless
pnpm test:e2e:ui           # with UI
```

## Verify Setup

```bash
# Type check passes
pnpm tsc --noEmit

# Dev server starts
pnpm dev

# Can login with Discord/Google
# Browser → http://localhost:3000 → click social login button

# Database connection works
# Dev server logs: "Prisma client initialized"
```

If any step fails:
- Check `.env` is readable (not tracked in git)
- Verify Supabase credentials work: `psql $DATABASE_URL -c "SELECT 1"`
- OAuth redirect URLs must exactly match `.env` URL
- Refresh token if using expired Discord/Google OAuth keys
