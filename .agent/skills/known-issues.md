# Known Issues & Workarounds

Documented bugs and their workarounds for FFXIV Estate Directory.

## Prisma Client Generation Issues

**Issue**: Type errors after schema change even though migration applied.

**Symptom**: `Property 'myField' does not exist on type 'MyTable'`

**Workaround**:
```bash
# Regenerate Prisma client
pnpm prisma generate

# Confirm types updated
pnpm tsc --noEmit
```

## OAuth Redirect Loop

**Issue**: User logs in → redirected back to login page → loop.

**Symptom**: Browser keeps navigating `/api/auth/callback/discord` → `/` → `/login`

**Workaround**:
1. Verify Discord/Google OAuth credentials in `.env`
2. Check redirect URL matches exactly (case-sensitive):
   - Discord: `http://localhost:3000/api/auth/callback/discord`
   - Google: `http://localhost:3000/api/auth/callback/google`
3. Verify `BETTER_AUTH_URL` is correct: `http://localhost:3000` (dev)
4. Clear browser cookies: DevTools → Application → Cookies → delete all
5. Clear cache and try again
6. Check database: `SELECT * FROM users` — new user should exist after successful auth

## Supabase Storage Upload Fails

**Issue**: Image upload to Supabase Storage returns 403 Forbidden.

**Symptom**: Upload form shows error "Unauthorized to upload"

**Workaround**:
1. Verify Supabase credentials in `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
2. Verify bucket exists and is public: Supabase Dashboard → Storage → `estate-images`
3. Verify bucket permissions: Allow authenticated users to upload
4. Check service role key has storage permissions
5. Test with curl:
   ```bash
   curl -X POST https://xxx.supabase.co/storage/v1/object/estate-images/test.txt \
     -H "Authorization: Bearer <service_role_key>" \
     -d "test"
   ```

## Database Connection Fails

**Issue**: `pnpm dev` fails to connect to Supabase.

**Symptom**: Error: "Can't reach database server at `db.supabase.co`"

**Workaround**:
1. Check `.env` has `DATABASE_URL`
2. Verify connection string format:
   ```
   postgresql://user:password@db.supabase.co:5432/postgres?pgbouncer=true
   ```
3. Test direct connection:
   ```bash
   psql "postgresql://user:password@db.supabase.co:5432/postgres"
   ```
4. Check Supabase Dashboard → Settings → Database → Connection info is correct
5. Verify password doesn't have special chars (or is URL-encoded)
6. Try restarting: `pnpm dev`

## Lodestone Verification Fails

**Issue**: Character verification always fails even though code is in Lodestone bio.

**Symptom**: After pasting code in Lodestone bio and clicking verify, endpoint returns 404

**Workaround**:
1. Verify Lodestone ID is correct (from xivapi.com search)
2. Wait ~5 min for Lodestone index to update (xivapi polls periodically)
3. Check if character name + world match exactly on Lodestone
4. Test xivapi directly:
   ```bash
   curl https://xivapi.com/character/12345678
   ```
5. Try again after waiting

## Semantic Release Doesn't Create Version

**Issue**: Merge to `main` but CHANGELOG not updated and no GitHub release created.

**Symptom**: `main` branch updated but no new version tag

**Workaround**:
1. Check commits use Conventional Commits format: `feat:`, `fix:`, `docs:`, etc.
2. Check husky pre-commit hook is installed:
   ```bash
   cat .husky/commit-msg
   ```
3. Check GitHub token has permission to create releases:
   - Go to GitHub → Settings → Personal access tokens
   - Token needs `repo` scope
4. Check CI/CD logs: https://github.com/dustinlennon/ffxiv-estate-directory/actions
5. Re-trigger manually (if needed):
   ```bash
   # Force push (dangerous!) or create new PR with valid commits
   git commit --amend --allow-empty -m "chore: trigger release"
   git push origin main
   ```

## E2E Tests Timeout

**Issue**: Playwright tests timeout waiting for page to load.

**Symptom**: Error: `Timeout waiting for selector: [data-testid="..."]`

**Workaround**:
1. Increase timeout in test:
   ```typescript
   await page.locator('[data-testid="submit"]').waitFor({ timeout: 10000 });
   ```
2. Check if element exists in DOM:
   ```bash
   PWDEBUG=1 pnpm test:e2e:ui
   # Opens browser; use DevTools to inspect
   ```
3. Verify dev server is running:
   ```bash
   # Tests need localhost:3000 to be up
   pnpm dev &
   pnpm test:e2e
   ```
4. Check for race conditions: use `waitForLoadState`:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

## Form Validation Errors Not Showing

**Issue**: Form submit fails but error messages don't appear.

**Symptom**: Form looks like it submitted but stays on same page, no error

**Workaround**:
1. Check browser console for JavaScript errors
2. Verify Zod schema is correct: `src/lib/schemas.ts`
3. Check form component displays validation errors:
   ```typescript
   {form.formState.errors.fieldName && (
     <span>{form.formState.errors.fieldName.message}</span>
   )}
   ```
4. Verify API endpoint returns proper error response (status 400 + JSON)
5. Test schema manually:
   ```typescript
   const result = createEstateSchema.safeParse(data);
   console.log(result.error?.flatten()); // Shows all errors
   ```

## Prisma Schema Conflicts with Generated Types

**Issue**: TypeScript can't find generated types after schema update.

**Symptom**: Error: `Cannot find type 'Prisma.EstateCreateInput'`

**Workaround**:
```bash
# Regenerate all Prisma types
pnpm prisma generate --force

# Verify
pnpm tsc --noEmit
```

## Comments/Likes Endpoint Returns 404

**Issue**: Trying to comment on estate but endpoint returns 404.

**Symptom**: `POST /api/comments/[estateId]` returns 404

**Workaround**:
1. Verify estate exists: `SELECT * FROM estates WHERE id = 123`
2. Check API route file exists: `src/app/api/comments/[estateId]/route.ts`
3. Verify estateId is correct (UUID or integer, depending on schema)
4. Check auth token is valid: Send `Authorization: Bearer <token>` header
5. Restart dev server: `pnpm dev`

## Estate Transfer Confirmation Email Not Received

**Issue**: Email sent to new owner but they don't receive confirmation.

**Symptom**: No email in inbox after initiating transfer

**Workaround**:
1. Check email provider (Gmail, Outlook, etc.) spam folder
2. Verify email address is correct in user profile
3. Check SendGrid/email service logs (if using external service)
4. Test manually: Check database `estate_transfers` table for pending transfer
5. Confirm URL in email is correct: Should link to `/api/estate-transfer/confirm?token=xxx`

## Database Quota Exceeded

**Issue**: Supabase says storage quota or row quota exceeded.

**Symptom**: Error "Quota exceeded" on insert/upload

**Workaround**:
1. Check Supabase Dashboard → Usage
2. Delete old/unused data
3. Upgrade plan if necessary
4. Optimize: Delete cascade for related records

## Staging (develop) vs Production (main) Out of Sync

**Issue**: Feature works on `develop` but not on `main`.

**Symptom**: `develop` has fixes but `main` is broken

**Workaround**:
1. Merge `develop` → `main` (creates release)
2. CI/CD auto-syncs `main` → `develop` after release
3. If manual sync needed:
   ```bash
   git checkout main
   git pull
   git checkout develop
   git merge main
   git push
   ```

Never force-push. Always merge forward.
