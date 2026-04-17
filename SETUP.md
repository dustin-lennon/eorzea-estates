# Eorzea Estates — Environment Setup Guide

This guide walks through configuring all external services required to run the app locally.

---

## Prerequisites

- [pnpm](https://pnpm.io/installation) installed globally
- Node.js 18+
- A Discord account (for OAuth)
- A Google Cloud account (for OAuth)
- A Supabase account (free, for database + image storage)

---

## Step 1 — Supabase (PostgreSQL Database)

1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New project**.
3. Fill in:
   - **Name:** `eorzea-estates` (or any name you prefer)
   - **Database Password:** choose a strong password and save it somewhere — you'll need it in the connection strings
   - **Region:** pick the one closest to you
   - **Pricing plan:** Free
4. Click **Create new project** and wait ~2 minutes for provisioning.
5. Once ready, click the **Connect** button near the top of the project dashboard.
6. In the modal that opens, click the **Connection String** tab.
7. Set **Type** to `URI` and **Source** to `Primary Database`.
8. For `DATABASE_URL` (pooled connection):
   - Set **Method** to **Transaction pooler**
   - Copy the connection string. It will look like:
     ```
     postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
     ```
   - Append `?pgbouncer=true` to the end and paste as `DATABASE_URL` in your `.env`.
9. For `DIRECT_URL` (direct connection):
   - Set **Method** to **Direct connection**
   - Copy the connection string. It will look like:
     ```
     postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
     ```
   - Paste this as `DIRECT_URL` in your `.env`.

Your `.env` should now look like:
```env
DATABASE_URL="postgresql://postgres.xxxx:yourpassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:yourpassword@aws-0-us-east-1.supabase.com:5432/postgres"
```

---

## Step 2 — Better Auth Secret

Run this command to generate a random secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as `BETTER_AUTH_SECRET` in your `.env`:

```env
BETTER_AUTH_SECRET="paste-the-generated-value-here"
```

---

## Step 3 — Discord OAuth Application

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications).
2. Click **New Application** (top-right).
3. Enter a name: `Eorzea Estates` (or any name you like) and click **Create**.
4. In the left sidebar, click **OAuth2**.
5. Under **Redirects**, click **Add Redirect** and enter:
   ```
   http://localhost:3000/api/auth/callback/discord
   ```
   Click **Save Changes**.
6. Still on the OAuth2 page, find:
   - **Client ID** — copy this and paste as `AUTH_DISCORD_ID` in your `.env`
   - **Client Secret** — click **Reset Secret**, confirm, then copy it and paste as `AUTH_DISCORD_SECRET`

Your `.env` should now look like:
```env
AUTH_DISCORD_ID="your-client-id-here"
AUTH_DISCORD_SECRET="your-client-secret-here"
```

> **Note:** When you deploy to production, add your production URL as a second redirect:
> `https://yourdomain.com/api/auth/callback/discord`

---

## Step 4 — Supabase Storage (Image Hosting)

Images are stored in Supabase Storage using the same Supabase project you set up in Step 1.

1. In your Supabase project dashboard, go to **Project Settings → API**.
2. Find the **Service role** key under **Project API keys** (not the `anon` key). Click the eye icon to reveal it.
3. Copy the **Project URL** (e.g. `https://xxxx.supabase.co`) and the service role key:

Your `.env` should now look like:
```env
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

> **Note:** The service role key has full access to your database and storage — keep it secret and never expose it client-side.

---

## Step 5 — Final .env File

Your completed `.env` should look like this:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:password@aws-0-us-east-1.supabase.com:5432/postgres"

# Supabase Storage
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Better Auth
BETTER_AUTH_SECRET="your-generated-secret"
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# App
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Web Push (VAPID) — generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY="your-vapid-public-key"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"  # same value as above
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:you@example.com"

# Sentry (optional — errors only captured in production)
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"  # client-side
SENTRY_DSN="https://your-dsn@sentry.io/project-id"               # server-side (same value)
SENTRY_ORG="your-sentry-org-slug"
SENTRY_PROJECT="your-sentry-project-slug"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
```

---

## Step 6 — Run the Database Migration

With the `.env` configured, run:

```bash
pnpm prisma migrate dev --name init
```

This creates all the database tables in your Supabase project. You should see output confirming each migration was applied.

To verify the tables were created, go to your Supabase project → **Table Editor** in the left sidebar. You should see tables like `User`, `Estate`, `Image`, `Comment`, `Like`, etc.

---

## Step 7 — Generate the Prisma Client

```bash
pnpm prisma generate
```

This regenerates the typed Prisma client from your schema. Run this any time the schema changes.

---

## Step 8 — Start the Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the homepage. Click **Sign In** and you should be redirected to Discord for authentication.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `PrismaClientInitializationError` | Check `DATABASE_URL` is correct and Supabase project is active |
| Discord sign-in fails | Verify the redirect URL in Discord matches exactly (including `http://`) |
| Images fail to upload | Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly |
| `BETTER_AUTH_SECRET` error on sign-in | Make sure `BETTER_AUTH_SECRET` is set and not the placeholder text |
| Migration fails | Ensure `DIRECT_URL` is set — pooled connections cannot run migrations |

---

## Production Deployment (Later)

When you deploy:
1. Add all `.env` values to your hosting provider's environment variables
2. Change `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain
3. Add the production callback URL to Discord OAuth redirects
4. Run `pnpm prisma migrate deploy` (not `dev`) on the production database
