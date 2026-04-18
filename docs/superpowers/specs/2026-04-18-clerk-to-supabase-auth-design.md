# Clerk → Supabase Auth Migration Design

**Date:** 2026-04-18
**Status:** Approved (brainstorm), pending implementation plan
**Author:** Hein van Vuuren + Claude
**Scope:** Replace Clerk auth with self-hosted Supabase Auth (GoTrue) across 133 Apex code sites
**Predecessor:** Plan 2 (DB driver swap) — `2026-04-18-apex-db-driver-swap.md`. Plan 2 must be COMPLETE.

---

## 1. Goals

- Drop Clerk as the identity provider; replace with self-hosted Supabase Auth on the apexgeo-supabase stack (Plan 1)
- Preserve every non-Clerk capability: API-key auth, `DEV_SUPER_ADMIN` env bypass, dev-mode session, rate limiting, public/super-admin/org-admin route gates
- Wire ApexGEO's existing SMTP (`noreply@apexgeo.app` via `41.203.18.12:465`) into GoTrue so verification + password-reset emails work from day one
- Add Google + GitHub social login alongside email/password
- Hand-rolled sign-in / sign-up / password-reset / OAuth-callback pages that match Apex's design system

## 2. Non-goals (explicit)

- Multi-org membership / organization switching — v1 is one user = one org (`users.organization_id`)
- JWT custom claims for `organization_id` — server fetches it from `public.users` after auth verifies the user; the existing `set_config()` RLS pattern from Plan 2 stays in place
- Magic-link sign-in (only password + OAuth in v1)
- 2FA / MFA (Supabase supports it, defer until users ask)
- Organization-invite flow (Plan 3 covers self-signup of org founders only; team invites are a future feature)
- Removing `users.clerk_user_id` column (kept one release as historical data; dropped in a follow-up migration after cutover stability is verified)
- Migrating existing Clerk users — handled in Plan 6 (cutover) under the hard-cutover-with-seed-admin model already chosen

## 3. Architecture

### 3.1 Four-layer model

```
Browser                            Server                              Postgres
───────                            ──────                              ────────
@supabase/supabase-js       →     @supabase/ssr cookie session    →  auth.users
(client SDK)                       in middleware + server comps         (Supabase-managed)
                                            ↓                                ↓
                                   getSession() / requireSession()        TRIGGER
                                            ↓                                ↓
                                   getOrgContext() reads                public.users
                                   public.users.organization_id      (auth_user_id FK
                                            ↓                         to auth.users)
                                   executeWithContext() sets RLS
                                   vars in pg transaction (Plan 2)
```

### 3.2 Three preserved auth modes

The existing 3-mode auth model carries over identically — only the underlying session source changes for the "session auth" mode.

| Mode | Today (Clerk) | After Plan 3 (Supabase) |
|---|---|---|
| Session auth | Clerk cookie + `auth()` from `@clerk/nextjs/server` | Supabase Auth cookie + `getSession()` from `@/lib/auth/supabase-server` |
| API-key auth | Bearer `apx_*` token, middleware validates, sets `x-apex-*` headers | **Unchanged** — middleware path identical, `api-key-auth.ts` already pg-typed (Plan 2) |
| Dev-mode bypass | `if (!CLERK_CONFIGURED)` returns mock session `{userId:'dev-user-id', orgId:'demo-org-id'}` | `if (!SUPABASE_AUTH_CONFIGURED)` returns same mock — flag detection swaps env-var name only |

`DEV_SUPER_ADMIN=true` env bypass for admin-route access in dev: **preserved unchanged**.

### 3.3 `AuthSession` contract (unchanged shape)

```ts
export interface AuthSession {
  userId: string;        // Supabase auth.users.id (uuid) — was Clerk user_xxx
  orgId: string | null;  // public.users.organization_id (cuid)
  orgRole: "admin" | "editor" | "viewer" | null;  // From public.users.role
  orgSlug: string | null;  // From public.organizations.slug, joined by org id
}
```

Same field names, same null semantics, just the `userId` value-shape changes from `user_xxx` strings to UUIDs. Code that compared `session.userId === "user_someid"` will break (rare; greppable).

The API-key auth path keeps using `public.users.id` (cuid) in the `x-apex-user-id` header — no shape change for programmatic API consumers.

## 4. File map

### 4.1 Created (5 helper files + 4 pages)

**Helper modules in `src/lib/auth/`:**
- `auth-session.ts` — exports the shared `AuthSession` interface (extracted from current `clerk.ts` so neither `supabase-server` nor `api-key-auth` has to import the other)
- `supabase-server.ts` — `getSession()`, `requireSession()`, `getOrgContext()`. Replaces all server-side Clerk helpers exported from `clerk.ts`. Reads `@supabase/ssr` cookie session, falls back to API-key headers, falls back to dev-mode mock.
- `supabase-browser.ts` — `createBrowserClient()` for client components (sign-in form, sign-out button)
- `supabase-middleware.ts` — cookie-refresh helper used by `src/middleware.ts` to keep Supabase session fresh on every request
- `supabase-admin.ts` — service-role client for server-side admin operations (creating users, listing users for admin panel, looking up users by email). Replaces `clerkClient`.

**New pages in `src/app/`:**
- `sign-in/page.tsx`
- `sign-up/page.tsx`
- `auth/callback/route.ts` — handles OAuth code exchange, email-link verification, password-reset confirmation. Calls `supabase.auth.exchangeCodeForSession()`, redirects to `/dashboard` (or `/onboarding` if new user with `organization_id=NULL`).
- `auth/reset-password/page.tsx` — password-reset form (user lands here from email link with valid recovery session).

### 4.2 Deleted (7 files)

- `src/lib/auth/clerk.ts`
- `src/components/providers/clerk-provider.tsx`
- `src/components/providers/auth-sync.tsx`
- `src/app/sign-in/[[...sign-in]]/page.tsx` (replaced by `sign-in/page.tsx` without the catch-all)
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `src/app/api/webhooks/clerk/route.ts` (replaced by Postgres trigger — see §5)
- `src/types/clerk.d.ts`

### 4.3 Rewritten (2 files)

- `src/middleware.ts` — Clerk middleware → Supabase cookie-refresh middleware. **API-key path, public-route matcher, rate limits, super-admin/org-admin route gates all preserved verbatim** — only the production-mode session source swaps from `clerkMiddleware` → `@supabase/ssr` `updateSession` + `getSession()`.
- `src/app/layout.tsx` — drop the outer `<ClerkProvider>` wrapper. No replacement needed; Supabase Auth doesn't need a React provider (cookies + server fetches handle session state).

### 4.4 Bulk-edited (133 files)

Codemod sweep across all sites importing from `@clerk/nextjs` or `@clerk/nextjs/server`. The transformation:

```ts
// Before
import { auth, currentUser } from "@clerk/nextjs/server";
const { userId, orgId, orgRole } = await auth();
const user = await currentUser();

// After
import { getSession } from "@/lib/auth/supabase-server";
const session = await getSession();   // returns AuthSession | null
const userId = session?.userId;
const orgId = session?.orgId;
const orgRole = session?.orgRole;
// currentUser() use cases handled by server-side fetch from public.users when needed
```

Most call sites only consume `userId` + `orgId`; few use `currentUser()`. Manual review for the latter group.

## 5. User provisioning — Postgres trigger replaces Clerk webhook

### 5.1 The problem

Clerk webhook (Svix-signed) fires on `user.created` / `user.updated` / `user.deleted` and our `/api/webhooks/clerk/route.ts` writes corresponding rows in `public.users`. Without Clerk, we need an alternate way to keep `auth.users` ↔ `public.users` in sync.

### 5.2 The solution

A Postgres trigger on `auth.users` AFTER INSERT, defined in migration `0017`, fires within the same transaction as the user creation. Atomic, no race condition, no webhook signature verification needed, no Svix dependency.

### 5.3 Migration `drizzle/0017_supabase_auth_swap.sql`

```sql
-- 1. Add auth_user_id column linking public.users to auth.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Drop the old unique constraint on clerk_user_id (keep the column for one
--    release as historical data; drop in a follow-up migration after Plan 6
--    cutover is verified stable)
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_clerk_user_id_unique;

-- 3. Make clerk_user_id nullable (so new Supabase signups don't fail NOT NULL)
ALTER TABLE public.users
  ALTER COLUMN clerk_user_id DROP NOT NULL;

-- 4. Trigger function: create public.users row when auth.users row appears.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, auth_user_id, email, name, role, organization_id)
  VALUES (
    encode(gen_random_bytes(12), 'hex'),    -- 24-char hex id, CUID-shaped
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'viewer',         -- default role; admin promotion happens via separate flow
    NULL              -- organization_id assigned during onboarding wizard
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Wire trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 6. Grant trigger function execute permission to GoTrue's role
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO supabase_auth_admin;
```

### 5.4 ID generation

`encode(gen_random_bytes(12), 'hex')` produces 24-char lowercase hex strings. Same length and visual shape as `@paralleldrive/cuid2` IDs but technically random hex, not true CUIDs. Acceptable for v1 — IDs are opaque tokens; format detail doesn't matter to the app and avoids installing custom CUID-in-Postgres functions. If true CUID format becomes important later, install `pgcrypto` + a small plpgsql function in a follow-up migration.

### 5.5 Onboarding flow

1. User signs up → `auth.users` insert → trigger creates `public.users` row with `organization_id = NULL`, `role = 'viewer'`
2. Middleware sees user has session but `getOrgContext()` returns `null` → redirects to `/onboarding`
3. Existing onboarding wizard creates an `organizations` row, sets `users.organization_id`, promotes `users.role = 'admin'` (because they're the org founder)
4. Subsequent requests see populated org context, normal app flow

The `/onboarding` page already exists in the codebase. Plan 3 only changes the upstream trigger (Supabase auth → trigger → public.users) — the onboarding wizard itself is unchanged.

## 6. Sign-in / sign-up / OAuth pages

### 6.1 UX

Hand-rolled forms in Apex's design system:
- Centered card on full-bleed `#0a0f1a` background, subtle radial gradient accent
- Apex logo top-left, "Sign in to ApexGEO" / "Create your account" heading
- Form below: email + password Inputs (with Label), submit Button
- Above email/password divider: "Continue with Google" + "Continue with GitHub" buttons (icon + text)
- Below form: "Forgot password?" link → `/auth/reset-password`, plus link to `/sign-up` (or `/sign-in` on the other page)
- Forms use `react-hook-form` + `zod` (already in deps), client-side validation, server-side error rendering

### 6.2 OAuth provider configuration

What you (Hein) configure once, in Google / GitHub dashboards:

**Google:** Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID
- Authorized redirect URI: `https://api.apexgeo.app/auth/v1/callback`
- Capture: Client ID + Client Secret

**GitHub:** github.com/settings/developers → New OAuth App
- Authorization callback URL: `https://api.apexgeo.app/auth/v1/callback`
- Capture: Client ID + Client Secret

What I (Plan 3 implementation) configure in `/home/velo/apexgeo-supabase/.env`:

```
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=<from above>
GOTRUE_EXTERNAL_GOOGLE_SECRET=<from above>
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://api.apexgeo.app/auth/v1/callback

GOTRUE_EXTERNAL_GITHUB_ENABLED=true
GOTRUE_EXTERNAL_GITHUB_CLIENT_ID=<from above>
GOTRUE_EXTERNAL_GITHUB_SECRET=<from above>
GOTRUE_EXTERNAL_GITHUB_REDIRECT_URI=https://api.apexgeo.app/auth/v1/callback
```

Then `docker-compose up -d --force-recreate apexgeo-supabase-auth` to load.

The Apex sign-in page calls:
```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',  // or 'github'
  options: { redirectTo: 'https://apexgeo.app/auth/callback' }
});
```
GoTrue handles the rest (redirects to provider, exchanges code, sets session cookie, redirects back to `/auth/callback` → `/dashboard` or `/onboarding`).

### 6.3 SMTP (verification + password reset)

Reuses ApexGEO's existing `noreply@apexgeo.app` mailbox. Already in `.env.production`. New entries in `/home/velo/apexgeo-supabase/.env`:

```
GOTRUE_SMTP_HOST=41.203.18.12
GOTRUE_SMTP_PORT=465
GOTRUE_SMTP_USER=noreply@apexgeo.app
GOTRUE_SMTP_PASS=<copy from Apex's .env.production>
GOTRUE_SMTP_ADMIN_EMAIL=hein@h10.co.za
GOTRUE_SMTP_SENDER_NAME=ApexGEO
GOTRUE_MAILER_AUTOCONFIRM=false        # enable verification (was true in Plan 1)
```

Recreate `apexgeo-supabase-auth` to load. Verify by signing up a test address and checking that an email arrives.

GoTrue auto-detects SSL based on port: `465` → implicit TLS, `587` → STARTTLS, `25` → none. ApexGEO uses 465 → no extra `GOTRUE_SMTP_*` flag needed.

### 6.4 Password rotation note

The `SMTP_PASS` for `noreply@apexgeo.app` will live in two places: Apex's `.env.production` (existing) and apexgeo-supabase's `.env` (new). Same password, two consumers. Rotate in both places when rotated.

## 7. Tests

### 7.1 Unit tests

| File | Verifies |
|---|---|
| `src/lib/auth/supabase-server.test.ts` | `getSession()` returns null with no cookies; returns `AuthSession` shape from valid cookie; dev-mode bypass works when `SUPABASE_AUTH_CONFIGURED=false`; API-key headers (`x-apex-*`) take precedence over cookie session |
| `src/lib/auth/supabase-server.test.ts` (integration block) | Full sign-up via Admin API → trigger creates `public.users` row → cleanup. Skipped unless `TEST_DATABASE_URL` set (same pattern as Plan 2's RLS test). |
| `src/middleware.test.ts` | Public routes pass through; protected routes redirect to `/sign-in` when unauthenticated; super-admin routes check `is_super_admin`; org-admin routes check `role='admin'`; API-key path still sets `x-apex-*` headers; rate limiter still applies |

### 7.2 E2E test

`e2e/auth.spec.ts` (new Playwright spec):
- Sign-up flow: fill form → email auto-confirmed (in dev) or click verify link (in prod-config) → land on `/onboarding`
- Onboarding: create organization → land on `/dashboard`
- Sign in as that user (separate browser context) → see dashboard
- Sign out → redirected to `/sign-in`, can't access `/dashboard` directly

## 8. Out-of-scope items (explicit non-goals to keep Plan 3 sized)

- Multi-org membership / org switching (deferred — v1 is one user = one org)
- JWT custom claims for `organization_id` (current pattern fetches from `public.users`; works fine)
- Magic-link sign-in (only password + OAuth in v1)
- 2FA / MFA
- Organization invite flow (covers self-signup org founders only; team invites are future)
- Dropping `users.clerk_user_id` column (kept one release as historical, dropped in follow-up after cutover stability)
- Existing Clerk user migration (Plan 6 cutover handles via seed-admin reassignment under the hard-cutover model)

## 9. Open items for the implementation plan

- **Code-mod scope** — exact list of files needing manual review beyond the 133 sed-able call sites (anything using `currentUser()`, `clerkClient`, `WebhookEvent` types, `OrganizationMembershipJSON`, etc.)
- **`getOrgContext()` cache strategy** — does it hit the DB on every request, or per-request memoize? (Recommend per-request memoize via React `cache()`.)
- **OAuth client ID + secret capture** — how Hein delivers them to the implementer (separate channel, not in this conversation)
- **Onboarding wizard's plan/billing flow** — Currently Clerk had org-level metadata for billing tier. Does the wizard need adjustment? (Likely yes — small follow-up if needed.)
- **`auth-sync.tsx` provider behavior** — what does it currently sync between client + server? (Need to read the file during planning to confirm it's safely deletable.)
- **Test environment Supabase Auth configuration** — does Vitest setup need new env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) stubbed?
- **Bulk codemod tooling** — `sed` for the simple replace + grep for risky patterns; or AST-based via `ts-morph` for safer multi-line edits
- **Layout shell decision finalized** — confirm sign-in page is "centered card on dark gradient" not "split-screen marketing left + form right" before implementing
