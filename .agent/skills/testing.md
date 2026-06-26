# Testing Playbook

Testing strategies for FFXIV Estate Directory.

## Type Checking

Always run before committing:

```bash
pnpm tsc --noEmit
```

This catches schema mismatches, missing imports, type errors.

## Unit & Component Tests

```bash
# Run all tests
pnpm test

# Watch mode (auto-rerun on file change)
pnpm test:watch

# Single file
pnpm test:watch src/lib/schemas.test.ts

# Coverage report
pnpm test:coverage
```

**Test patterns**:
- Schemas: Validate form inputs with Zod
- Auth helpers: Test Better Auth session logic
- FFXIV data: Test region/server lookups

## E2E Tests

```bash
# Headless (CI mode)
pnpm test:e2e

# With browser UI (debugging)
pnpm test:e2e:ui
```

**Test flows**:
- User signup via Discord/Google
- Create estate listing
- Edit estate
- Delete estate
- Comment on estate
- Like/unlike estate
- Search estates by region/server

## Manual Testing (Dev Server)

```bash
pnpm dev
```

### Auth Flow
1. Navigate to http://localhost:3000
2. Click "Sign in with Discord" or "Sign in with Google"
3. Authorize on OAuth provider
4. Redirect back to `/dashboard`
5. Check session cookie (DevTools → Application → Cookies)

### Create Estate
1. Click "Submit Estate" or `/submit` route
2. Fill form:
   - Estate name, type (PRIVATE, FC_ESTATE, etc.)
   - Region, data center, server, district
   - Optional: Lodestone character link
3. Submit
4. Verify: Estate appears in `/dashboard`

### Upload Image
1. Create estate → image upload field
2. Click/drag to upload PNG/JPEG
3. Verify: Supabase Storage CDN URL stored in DB

### Lodestone Verification
1. Estate form → check "Verify character"
2. Copy lodestone code
3. Paste into character's Lodestone bio
4. Click "Verify"
5. Should poll xivapi.com and confirm

## Testing Lodestone Integration

Lodestone verification flow:

```bash
# 1. Generate code
curl -X POST http://localhost:3000/api/lodestone/start \
  -H "Authorization: Bearer <session-token>"
# Returns: { code: "abc123" }

# 2. User pastes code into Lodestone bio (simulated here)

# 3. Confirm verification
curl -X POST http://localhost:3000/api/lodestone/confirm \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{"code":"abc123","characterId":"12345"}'

# Endpoint polls xivapi.com to verify character bio contains code
```

## Testing Database Schema

After Prisma migrations:

```bash
# View schema
npx prisma studio

# Verify table structure
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
```

## Testing Form Validation

Schemas in `src/lib/schemas.ts` are used by both client forms and API routes.

Test manually:

```typescript
import { createEstateSchema } from '@/lib/schemas';

const result = createEstateSchema.safeParse({
  name: 'My Estate',
  type: 'PRIVATE',
  region: 'Amaldjaa',
  dataCenterId: 'Primal',
  serverId: 'Excalibur',
  districtId: 'SUBDIVISION',
});

console.log(result.success); // true or false
console.log(result.data);    // parsed data
console.log(result.error);   // validation errors
```

## Testing Comments & Likes

```bash
# Create comment
curl -X POST http://localhost:3000/api/comments/123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Love this estate!"}'

# Toggle like
curl -X POST http://localhost:3000/api/likes/123 \
  -H "Authorization: Bearer <token>"
```

## Testing FC Estate Verification

Nightly cron: `GET /api/cron/verify-fc-estates`

Verifies that FC-related estates still own the listed estate.

Manual test:

```bash
# Trigger verification (admin only)
curl http://localhost:3000/api/cron/verify-fc-estates

# Check: any estates with invalid FCs should be hidden/flagged
```

## CI/CD Testing

GitHub Actions runs on every push to `develop` and `main`:

1. Unit tests (Vitest)
2. E2E tests (Playwright)
3. Lint (ESLint)
4. Type check (tsc)

Check results: https://github.com/dustinlennon/ffxiv-estate-directory/actions

If any step fails:
- Semantic release **blocks merge** until all checks pass
- Fix locally, push again

## Debugging Tips

### Auth Won't Log In
1. Check Discord/Google OAuth credentials in `.env`
2. Verify redirect URI matches exactly
3. Check database: `SELECT * FROM users` — should have new user after successful OAuth
4. Clear cookies + cache, try again

### Schema Errors After Migration
```bash
# Regenerate Prisma client
pnpm prisma generate

# Re-apply migrations
pnpm prisma migrate deploy
```

### E2E Tests Fail
```bash
# Run with debugging
PWDEBUG=1 pnpm test:e2e:ui

# Check for timing issues — add waits
page.waitForTimeout(1000);
```

### Type Errors Won't Clear
```bash
# Force regenerate types
rm -rf node_modules/.prisma
pnpm prisma generate
pnpm tsc --noEmit
```
