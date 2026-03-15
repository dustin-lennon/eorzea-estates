# Eorzea Estates — Environment Setup Guide

This guide walks through configuring all external services required to run the app locally.

---

## Prerequisites

- [pnpm](https://pnpm.io/installation) installed globally
- Node.js 18+
- A Discord account
- A Cloudinary account (free)
- A Supabase account (free)

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

## Step 2 — NextAuth Secret

Run this command to generate a random secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as `AUTH_SECRET` in your `.env`:

```env
AUTH_SECRET="paste-the-generated-value-here"
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

## Step 4 — Cloudinary (Image Hosting)

1. Go to [https://cloudinary.com](https://cloudinary.com) and sign in or create a free account.
2. After signing in, you land on the **Dashboard**.
3. In the **Product Environment Credentials** section you will see:
   - **Cloud name** → paste as `CLOUDINARY_CLOUD_NAME`
   - **API key** → paste as `CLOUDINARY_API_KEY`
   - **API secret** → click the eye icon to reveal it → paste as `CLOUDINARY_API_SECRET`

Your `.env` should now look like:
```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="your-api-secret-here"
```

> **Optional — create an upload preset (not required for this app):** The app uses server-side signed uploads, so no preset is needed.

---

## Step 5 — Final .env File

Your completed `.env` should look like this:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:password@aws-0-us-east-1.supabase.com:5432/postgres"

# Auth.js / NextAuth
AUTH_SECRET="your-generated-secret"
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# App
NEXTAUTH_URL="http://localhost:3000"

# Sentry (optional — errors only captured in production)
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
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
| Images fail to upload | Double-check all three `CLOUDINARY_*` values are set |
| `AUTH_SECRET` error on sign-in | Make sure `AUTH_SECRET` is set and not the placeholder text |
| Migration fails | Ensure `DIRECT_URL` is set — pooled connections cannot run migrations |

---

## Production Deployment (Later)

When you deploy:
1. Add all `.env` values to your hosting provider's environment variables
2. Change `NEXTAUTH_URL` to your production domain
3. Add the production callback URL to Discord OAuth redirects
4. Run `pnpm prisma migrate deploy` (not `dev`) on the production database
