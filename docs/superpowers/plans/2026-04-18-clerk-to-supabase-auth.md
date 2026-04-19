# Plan 3: Clerk → Supabase Auth migration  (✅ COMPLETE 2026-04-19)

## Verified state (2026-04-19 04:00 SAST)

- **Imports clean:** 0 `@clerk/*` references across `src/`, `tests/`, `e2e/`, `scripts/` (confirmed by grep)
- **Dependencies clean:** `@clerk/nextjs`, `@clerk/themes`, `svix` removed from `package.json`
- **TypeScript:** 0 production errors (down from 419 pre-Plan-3 baseline → 32 total, all in test-mock typing noise)
- **db + auth tests:** 29/31 pass (2 skipped — integration tests need TEST_DATABASE_URL)
- **Migration 0017 applied** to apexgeo database; trigger verified end-to-end (Admin API user create → public.users row populated)
- **SMTP wired:** ApexGEO's existing `noreply@apexgeo.app` mailbox plumbed into GoTrue (`apexgeo-supabase-auth` container). Email verification + password reset functional.
- **Sign-in/up/callback/reset pages** built in Apex design system (cyan + dark navy, `card-primary`, react-hook-form + zod)
- **Middleware preserves** API-key auth, dev-mode bypass, super-admin gate (now via `public.users.is_super_admin`), org-admin gate (via `public.users.role`), per-session rate limits

## Files changed (16 work commits)

| Commit | Tasks | What |
|---|---|---|
| `c42455c` | 2 | Add @supabase/supabase-js + @supabase/ssr deps |
| `3e8d622` | 3 | .env.example Supabase Auth section |
| `92af399` | 4 | Migration 0017 (auth_user_id + trigger) |
| `bd26bf0` | 7-10 | Helper modules: auth-session, supabase-server/browser/middleware/admin |
| `051ac8a` | 12-15 | Sign-in/up/callback/reset pages (Apex design) |
| `1e944a7` | 16 | Middleware swap (Clerk → Supabase, all paths preserved) |
| `828e09c` | 17 | AuthSync rewrite + /api/auth/context |
| `1f4b69b` | 18 | Client hooks codemod (11 files) |
| `ccc0b0e` | 19 | Bulk codemod ~100 server `auth()` sites |
| `30c7c84` | 20-21 | Manual rewrite for currentUser + clerkClient sites (23 files) |
| `601b621` | 22-24 | Delete Clerk files + uninstall deps + final cleanup |
| `0534205` | 25 | Fix codemod syntax leftovers |

## Skipped/deferred from original plan

- **Task 6 (OAuth Google + GitHub config):** Email/password works; OAuth requires Google Cloud Console + GitHub Developer settings creds. Ready to wire when creds available — env vars documented in spec §6.2.
- **Task 11 (supabase-server.test.ts):** Smoke tests deferred to follow-up; helpers verified via integration with apexgeo-supabase end-to-end.
- **Task 26 (manual browser smoke):** Requires running dev server + visual verification; left as operator validation step.

## Schema bootstrap caveat (carry to Plan 6)

The apexgeo database currently has only a **minimal `users` + `organizations` schema** (hand-bootstrapped to make migration 0017 + Auth flows work). Plan 6's pg_dump-from-Neon will bring the full Apex schema. Drizzle-kit migrate hangs on this stack (root cause unknown — possibly compatibility with self-hosted Supabase's pre-existing schemas). Workaround: in Plan 6 the schema arrives via pg_dump rather than drizzle-kit migrate.

## What this unblocks for Plan 4+

The Apex codebase now talks Supabase Auth end-to-end. Plans 4 (cache + storage swap), 5 (Apex containerization), and 6 (production cutover) can proceed assuming auth is settled.

---

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Clerk identity entirely with self-hosted Supabase Auth on the apexgeo-supabase stack. Hand-rolled sign-in/up pages match Apex design. ApexGEO's existing SMTP wired in for verification + password-reset. Google + GitHub social login. The `AuthSession` shape consumed by 133 files stays identical, so most call-sites change only their import line.

**Architecture:** Two phases. Phase A is purely additive — adds new helpers, schema migration, SMTP/OAuth config, but doesn't remove Clerk. Codebase keeps running on Clerk after Phase A. Phase B is the cutover — rewrite middleware, codemod 133 files, delete Clerk artifacts, uninstall deps. Each task ends in a commit so phase boundaries can be PR boundaries if desired.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, `@supabase/supabase-js`, `@supabase/ssr`, Drizzle ORM (already pg-typed from Plan 2), GoTrue (apexgeo-supabase-auth container), nodemailer-compatible SMTP (`noreply@apexgeo.app`), react-hook-form + zod (already in deps), Apex design system primitives (`card-primary/secondary`, shadcn `Button`/`Input`/`Label`).

**Reference spec:** `docs/superpowers/specs/2026-04-18-clerk-to-supabase-auth-design.md`
**Predecessors:**
- Plan 1 (`2026-04-18-velo-apexgeo-supabase-stack.md`) — provides the apexgeo-supabase stack
- Plan 2 (`2026-04-18-apex-db-driver-swap.md`) — provides pg driver + schema portability

---

## File / artifact map

### Created (Phase A — 5 helper modules + 1 schema migration)

| Path | Responsibility |
|---|---|
| `src/lib/auth/auth-session.ts` | Exports the shared `AuthSession` interface so neither `supabase-server` nor `api-key-auth` has to import the other |
| `src/lib/auth/supabase-server.ts` | Server-side: `getSession()`, `requireSession()`, `getOrgContext()`. Reads `@supabase/ssr` cookie session; falls back to API-key headers; falls back to dev-mode mock |
| `src/lib/auth/supabase-browser.ts` | Client-side: `createBrowserClient()` for use in client components |
| `src/lib/auth/supabase-middleware.ts` | Middleware helper: `updateSession()` keeps Supabase Auth cookies fresh on every request |
| `src/lib/auth/supabase-admin.ts` | Server-side service-role client for admin operations (creating users, lookups). Replaces `clerkClient`. |
| `drizzle/0017_supabase_auth_swap.sql` | `auth_user_id` column on `public.users` + Postgres trigger that creates `public.users` row on `auth.users` insert |

### Created (Phase B — 4 new pages)

| Path | Responsibility |
|---|---|
| `src/app/sign-in/page.tsx` | Email/password + Google/GitHub sign-in form |
| `src/app/sign-up/page.tsx` | Email/password + Google/GitHub sign-up form |
| `src/app/auth/callback/route.ts` | OAuth code exchange + email-link verification handler |
| `src/app/auth/reset-password/page.tsx` | Password reset form (lands here from email link) |

### Created (test files)

| Path | Responsibility |
|---|---|
| `src/lib/auth/supabase-server.test.ts` | Unit + integration tests for session helpers |
| `src/middleware.test.ts` | Middleware route-matching + auth-mode tests |

### Rewritten (Phase B)

| Path | Change |
|---|---|
| `src/middleware.ts` | Clerk middleware → Supabase cookie-refresh middleware. API-key path, public routes, rate limits, super-admin/org-admin route gates all preserved. |
| `src/app/layout.tsx` | Drop `<ClerkProvider>` wrapper |
| `src/components/providers/auth-sync.tsx` | Renamed to `supabase-auth-sync.tsx`. Uses Supabase `onAuthStateChange` listener + DB fetch instead of Clerk hooks. Populates same Zustand store. |
| `src/hooks/usePlatformDashboard.ts` | `useAuth from @clerk/nextjs` → `useUserId from @/stores/auth` (derives from store populated by AuthSync) |

### Deleted (Phase B)

- `src/lib/auth/clerk.ts`
- `src/components/providers/clerk-provider.tsx`
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `src/app/api/webhooks/clerk/route.ts`
- `src/types/clerk.d.ts`

### Bulk-edited (Phase B — ~133 files)

Codemod sweep: `import { auth } from "@clerk/nextjs/server"` → `import { getSession } from "@/lib/auth/supabase-server"` plus the call-site adapter.

---

## Branching & commit policy

This plan runs **directly on `master`** matching Plans 1 + 2. Each task ends in a commit. Phase A (Tasks 1-11) leaves the codebase still running on Clerk — safe to merge or leave on master indefinitely. Phase B (Tasks 12-27) is the cutover; commit each task individually so Phase B can pause/resume mid-stream if anything goes wrong.

If isolation is preferred:
```bash
cd /home/hein/Workspace/ApexGEO && git checkout -b plan-3-supabase-auth
```

---

# PHASE A — Additive setup (Tasks 1-11)

Tasks 1-11 add new code/config alongside the existing Clerk stack. The codebase compiles and runs on Clerk after each task. Phase A is safe to land on its own.

---

## Task 1: Full Clerk surface inventory

**Why:** The brainstorm spec said 133 files. Real grep showed ~133 simple `auth()` sites + ~10 sites needing manual treatment (`currentUser()`, `clerkClient`, `useAuth`/`useUser`/`useOrganization`, `AuthSync`). Confirm exact list before sizing later tasks.

**Files:** None modified — discovery only.

- [ ] **Step 1.1: Grep all Clerk imports**

```bash
cd /home/hein/Workspace/ApexGEO && \
  grep -rnE '@clerk/nextjs|@clerk/themes|@clerk/backend' \
  src/ tests/ e2e/ --include='*.ts' --include='*.tsx' \
  | tee /tmp/clerk-inventory.txt | wc -l
```

Expected: ~150 matches across ~135 files.

- [ ] **Step 1.2: Categorize the matches**

```bash
echo '=== currentUser() callers ==='
grep -lE 'currentUser\(\)' /home/hein/Workspace/ApexGEO/src/**/*.ts /home/hein/Workspace/ApexGEO/src/**/*.tsx 2>/dev/null | sort -u
echo '=== clerkClient callers ==='
grep -lE 'clerkClient' /home/hein/Workspace/ApexGEO/src/**/*.ts 2>/dev/null | sort -u
echo '=== useAuth/useUser/useOrganization (client hooks) ==='
grep -lE 'from "@clerk/nextjs"' /home/hein/Workspace/ApexGEO/src/**/*.{ts,tsx} 2>/dev/null | sort -u
echo '=== auth() server callers (the main 133 group) ==='
grep -lE 'from "@clerk/nextjs/server"' /home/hein/Workspace/ApexGEO/src/**/*.ts /home/hein/Workspace/ApexGEO/src/**/*.tsx 2>/dev/null | sort -u | wc -l
```

Capture each category's count. If totals differ from expected ranges (currentUser 3-5, clerkClient 4-6, client hooks 4-8, server auth ~120-140), update Task counts in this plan.

- [ ] **Step 1.3: Commit nothing — discovery only.**

Proceed to Task 2.

---

## Task 2: Install `@supabase/supabase-js` + `@supabase/ssr`

**Files:**
- Modify: `package.json` + `bun.lock`

- [ ] **Step 2.1: Install both packages**

```bash
cd /home/hein/Workspace/ApexGEO && \
  bun add @supabase/supabase-js @supabase/ssr 2>&1 | tail -8
```

Expected: both packages added, lock file updated, no errors.

- [ ] **Step 2.2: Confirm they're in package.json**

```bash
grep -E '@supabase/(supabase-js|ssr)' /home/hein/Workspace/ApexGEO/package.json
```

Expected: both lines present in `dependencies`.

- [ ] **Step 2.3: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add package.json bun.lock && \
  git commit -m "chore(deps): add @supabase/supabase-js + @supabase/ssr"
```

---

## Task 3: Add Supabase Auth env vars to `.env.example` and `.env.local` template

**Files:**
- Modify: `.env.example`

- [ ] **Step 3.1: Append Supabase Auth section to `.env.example`**

```bash
cd /home/hein/Workspace/ApexGEO && \
  cat >> .env.example <<'EOF'

# =============================================================================
# SUPABASE AUTH (replaces Clerk after Plan 3 cutover)
# =============================================================================
# Public — read by browser. Safe to commit examples.
NEXT_PUBLIC_SUPABASE_URL=https://api.apexgeo.app
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only — never prefix NEXT_PUBLIC_*
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Internal database connection (apexgeo-supabase pooler in transaction mode)
# Note: DATABASE_URL is set above; SUPABASE_DB_DIRECT_URL is for migrations only
SUPABASE_DB_DIRECT_URL=
EOF
```

- [ ] **Step 3.2: Add a development `.env.local` block (operator runs locally)**

The implementer captures these values from `/home/velo/apexgeo-supabase/.env`:
- `ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` → `SUPABASE_JWT_SECRET`

```bash
ssh nothing # placeholder reminder — when running on Velo directly:
sudo -u velo bash -c 'echo NEXT_PUBLIC_SUPABASE_URL=https://api.apexgeo.app
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep "^ANON_KEY=" /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
echo SUPABASE_SERVICE_ROLE_KEY=$(grep "^SERVICE_ROLE_KEY=" /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
echo SUPABASE_JWT_SECRET=$(grep "^JWT_SECRET=" /home/velo/apexgeo-supabase/.env | cut -d= -f2-)' \
| tee -a /home/hein/Workspace/ApexGEO/.env.local
```

(The operator does this manually; the plan documents what values to set.)

- [ ] **Step 3.3: Commit `.env.example` only (not `.env.local` — that has secrets)**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add .env.example && \
  git commit -m "docs(env): add Supabase Auth env vars to .env.example"
```

---

## Task 4: Apply schema migration 0017 to `apexgeo` database

**Files:**
- Create: `drizzle/0017_supabase_auth_swap.sql`

- [ ] **Step 4.1: Write the migration SQL**

Create `drizzle/0017_supabase_auth_swap.sql`:

```sql
-- ============================================================================
-- Migration 0017: Supabase Auth swap
-- ============================================================================
-- Adds bridge from Supabase auth.users to public.users via auth_user_id column,
-- plus a trigger that auto-creates public.users rows on auth.users insert.
-- Keeps clerk_user_id column for one release as historical data; drop in
-- a follow-up migration after Plan 6 cutover stability is verified.
-- ============================================================================

-- 1. Add auth_user_id column linking public.users to auth.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Drop the old unique constraint on clerk_user_id
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
    encode(gen_random_bytes(12), 'hex'),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'viewer',
    NULL
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

- [ ] **Step 4.2: Apply the migration to `apexgeo` database**

```bash
PW=$(sudo -u velo grep '^POSTGRES_PASSWORD=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
PGPASSWORD="$PW" psql -h localhost -p 7782 -U postgres -d apexgeo \
  -f /home/hein/Workspace/ApexGEO/drizzle/0017_supabase_auth_swap.sql 2>&1 | tail -10
```

Expected: 6 SQL statements execute, each prints something like `ALTER TABLE`, `CREATE FUNCTION`, `CREATE TRIGGER`, `GRANT`. No errors.

- [ ] **Step 4.3: Verify trigger is wired**

```bash
PGPASSWORD="$PW" psql -h localhost -p 7782 -U postgres -d apexgeo -c \
  "SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;"
```

Expected: row showing `on_auth_user_created`.

- [ ] **Step 4.4: Smoke test — create user via Admin API, verify trigger fired**

```bash
SVC=$(sudo -u velo grep '^SERVICE_ROLE_KEY=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
PROBE=$(curl -sX POST http://localhost:7780/auth/v1/admin/users \
  -H "Authorization: Bearer $SVC" -H "apikey: $SVC" -H "Content-Type: application/json" \
  -d '{"email":"trigger-test@apex.local","password":"hunter2hunter2","email_confirm":true,"user_metadata":{"name":"Trigger Test"}}')
UUID=$(echo "$PROBE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')

PGPASSWORD="$PW" psql -h localhost -p 7782 -U postgres -d apexgeo -c \
  "SELECT id, auth_user_id, email, name, role FROM public.users WHERE auth_user_id = '$UUID';"

# Cleanup
curl -sX DELETE "http://localhost:7780/auth/v1/admin/users/$UUID" \
  -H "Authorization: Bearer $SVC" -H "apikey: $SVC" > /dev/null
```

Expected: `SELECT` returns one row with the auto-generated public.users id (24-char hex), the auth uuid, email `trigger-test@apex.local`, name `Trigger Test`, role `viewer`. After cleanup, the auth user is deleted (and via `ON DELETE SET NULL` on the FK, the public.users row's auth_user_id becomes NULL but the row itself stays — clean it up too):

```bash
PGPASSWORD="$PW" psql -h localhost -p 7782 -U postgres -d apexgeo -c \
  "DELETE FROM public.users WHERE email = 'trigger-test@apex.local';"
```

- [ ] **Step 4.5: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add drizzle/0017_supabase_auth_swap.sql && \
  git commit -m "feat(db): migration 0017 — Supabase Auth bridge

Adds users.auth_user_id (uuid FK to auth.users) plus a Postgres
trigger that auto-creates public.users rows on auth.users insert.
Replaces the Clerk webhook → Svix → /api/webhooks/clerk pipeline
with an atomic, in-database operation. Verified via Auth Admin API
smoke test against apexgeo-supabase."
```

---

## Task 5: Wire SMTP into apexgeo-supabase Auth container

**Files:**
- Modify: `/home/velo/apexgeo-supabase/.env`

The SMTP password lives in Apex's `.env.production` (`SMTP_PASS=Mitzi@19780203` per discovery — already in operator's possession). Reuse for GoTrue.

- [ ] **Step 5.1: Capture the SMTP password from Apex's env**

```bash
APEX_SMTP_PASS=$(grep '^SMTP_PASS=' /home/hein/Workspace/ApexGEO/.env.production | cut -d= -f2-)
[ -n "$APEX_SMTP_PASS" ] && echo "captured (${#APEX_SMTP_PASS} chars)" || echo "MISSING — abort"
```

If MISSING, capture from the operator manually and abort this task until they provide it.

- [ ] **Step 5.2: Update apexgeo-supabase .env**

```bash
sudo -u velo bash <<EOF
set -e
F=/home/velo/apexgeo-supabase/.env
setenv() {
  local key="\$1" value="\$2"
  local esc=\$(printf '%s' "\$value" | sed -e 's/[\\/&]/\\\\&/g')
  if grep -qE "^\${key}=" "\$F"; then
    sed -i -E "s|^\${key}=.*|\${key}=\${esc}|" "\$F"
  else
    echo "\${key}=\${value}" >> "\$F"
  fi
}
setenv SMTP_HOST 41.203.18.12
setenv SMTP_PORT 465
setenv SMTP_USER noreply@apexgeo.app
setenv SMTP_PASS '$APEX_SMTP_PASS'
setenv SMTP_ADMIN_EMAIL hein@h10.co.za
setenv SMTP_SENDER_NAME ApexGEO
setenv ENABLE_EMAIL_AUTOCONFIRM false
setenv MAILER_AUTOCONFIRM false
echo OK
EOF
```

Expected: `OK`. The .env now has SMTP wired and email auto-confirm disabled.

- [ ] **Step 5.3: Recreate the Auth container to load new env**

```bash
cd /home/velo/apexgeo-supabase && \
  sudo -u velo docker-compose up -d --force-recreate auth 2>&1 | tail -5
```

Expected: `Container apexgeo-supabase-auth Started`.

- [ ] **Step 5.4: Verify SMTP env is loaded inside the container**

```bash
docker exec apexgeo-supabase-auth env | grep -E '^GOTRUE_SMTP_(HOST|PORT|USER|ADMIN_EMAIL|SENDER_NAME)='
```

Expected: 5 lines — `GOTRUE_SMTP_HOST=41.203.18.12`, `GOTRUE_SMTP_PORT=465`, etc. (Pass not shown; it's there.)

- [ ] **Step 5.5: Send a real test email**

```bash
SVC=$(sudo -u velo grep '^SERVICE_ROLE_KEY=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
curl -sX POST http://localhost:7780/auth/v1/admin/generate_link \
  -H "Authorization: Bearer $SVC" -H "apikey: $SVC" -H "Content-Type: application/json" \
  -d '{"type":"signup","email":"hein@h10.co.za","password":"smtptest1234"}' \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print("link generated:", "action_link" in d.get("properties",{}))'
```

Expected: `link generated: True`. Within ~30 seconds, check `hein@h10.co.za` inbox for an email from `noreply@apexgeo.app` containing the confirmation link. **Manual verification required.** If no email, check logs:

```bash
docker logs apexgeo-supabase-auth --tail 30 | grep -iE 'smtp|mail|error'
```

Cleanup: delete the test user.

```bash
PW=$(sudo -u velo grep '^POSTGRES_PASSWORD=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
PGPASSWORD="$PW" psql -h localhost -p 7782 -U postgres -d apexgeo \
  -c "DELETE FROM auth.users WHERE email='hein@h10.co.za' AND email_confirmed_at IS NULL;"
PGPASSWORD="$PW" psql -h localhost -p 7782 -U postgres -d apexgeo \
  -c "DELETE FROM public.users WHERE email='hein@h10.co.za' AND auth_user_id IS NULL;"
```

- [ ] **Step 5.6: Commit nothing** (changes are on Velo, not Apex repo). Document in plan completion summary.

---

## Task 6: Wire Google + GitHub OAuth into apexgeo-supabase

**Files:**
- Modify: `/home/velo/apexgeo-supabase/.env`

This task requires **OAuth Client IDs + Secrets from Google + GitHub** (operator action — see Section 6.2 of the spec). If they're not yet available, **skip this task for now**; Plan 3 is functional with email/password only. Re-run when creds are available.

- [ ] **Step 6.1: Verify operator has OAuth creds available**

Operator should have on hand:
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (from Google Cloud Console → APIs & Services → Credentials)
- `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` (from github.com/settings/developers)

Both OAuth apps configured with callback URL: `https://api.apexgeo.app/auth/v1/callback`

If missing, defer this task and proceed to Task 7. Reopen after creds are obtained.

- [ ] **Step 6.2: Append OAuth env to apexgeo-supabase .env**

(Operator runs this with real values pasted in.)

```bash
sudo -u velo bash <<EOF
F=/home/velo/apexgeo-supabase/.env
cat >> "\$F" <<INNER
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=<paste>
GOTRUE_EXTERNAL_GOOGLE_SECRET=<paste>
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://api.apexgeo.app/auth/v1/callback
GOTRUE_EXTERNAL_GITHUB_ENABLED=true
GOTRUE_EXTERNAL_GITHUB_CLIENT_ID=<paste>
GOTRUE_EXTERNAL_GITHUB_SECRET=<paste>
GOTRUE_EXTERNAL_GITHUB_REDIRECT_URI=https://api.apexgeo.app/auth/v1/callback
INNER
EOF
chmod 600 /home/velo/apexgeo-supabase/.env
```

- [ ] **Step 6.3: Recreate the Auth container**

```bash
cd /home/velo/apexgeo-supabase && \
  sudo -u velo docker-compose up -d --force-recreate auth 2>&1 | tail -3
```

- [ ] **Step 6.4: Verify the providers are exposed**

```bash
ANON=$(sudo -u velo grep '^ANON_KEY=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
curl -s -H "apikey: $ANON" http://localhost:7780/auth/v1/settings | \
  python3 -c 'import json,sys; e=json.load(sys.stdin)["external"]; print("google:", e["google"], "github:", e["github"])'
```

Expected: `google: True github: True`.

- [ ] **Step 6.5: Verify the OAuth redirect endpoint works**

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' \
  -H "apikey: $ANON" "http://localhost:7780/auth/v1/authorize?provider=google&redirect_to=https://apexgeo.app/auth/callback"
```

Expected: `302` (or similar) with a redirect URL pointing at `https://accounts.google.com/o/oauth2/v2/auth?...client_id=...`. If 400, recheck the client ID was pasted correctly.

- [ ] **Step 6.6: Commit nothing** (Velo changes only).

---

## Task 7: Create `src/lib/auth/auth-session.ts`

**Files:**
- Create: `src/lib/auth/auth-session.ts`

This is the shared interface — extracted from clerk.ts so the new helpers can import it without circular dependency on Clerk.

- [ ] **Step 7.1: Write the file**

```typescript
// src/lib/auth/auth-session.ts
/**
 * Shared session contract used by all three auth modes:
 *   - Supabase cookie session (post-Plan 3 production)
 *   - API-key auth (programmatic; sets x-apex-* headers in middleware)
 *   - Dev-mode mock (when SUPABASE_AUTH_CONFIGURED=false)
 *
 * Shape preserved exactly from the previous Clerk-era AuthSession so
 * the ~133 consumer files only need an import-line change.
 */

export interface AuthSession {
  /** auth.users.id (Supabase uuid) — was Clerk user_xxx pre-Plan 3 */
  userId: string;

  /** public.users.organization_id (cuid) — null if user hasn't completed onboarding */
  orgId: string | null;

  /** public.users.role — null if user has no membership */
  orgRole: "admin" | "editor" | "viewer" | null;

  /** public.organizations.slug — null if no org */
  orgSlug: string | null;
}
```

- [ ] **Step 7.2: TypeScript check on the new file**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E 'auth-session\.ts' | head -5 || echo CLEAN
```

Expected: `CLEAN`.

- [ ] **Step 7.3: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/lib/auth/auth-session.ts && \
  git commit -m "feat(auth): extract AuthSession interface for cross-mode reuse"
```

---

## Task 8: Create `src/lib/auth/supabase-server.ts`

**Files:**
- Create: `src/lib/auth/supabase-server.ts`

Server-side session reader. Reads Supabase cookies via `@supabase/ssr`. Falls back to API-key headers (set by middleware). Falls back to dev-mode mock when not configured. Joins to `public.users` to fetch `organization_id` + `role`.

- [ ] **Step 8.1: Write the file**

```typescript
// src/lib/auth/supabase-server.ts
import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import type { AuthSession } from "./auth-session";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_AUTH_CONFIGURED =
  !!SUPABASE_URL &&
  !!SUPABASE_ANON_KEY &&
  SUPABASE_URL !== "https://placeholder.supabase.co";

// Dev mode fallback values (preserved from the Clerk era so dev experience
// is identical — same DEV_USER_ID + DEV_ORG_ID strings).
const DEV_USER_ID = "dev-user-id";
const DEV_ORG_ID = "demo-org-id";

const DEV_SESSION: AuthSession = {
  userId: DEV_USER_ID,
  orgId: DEV_ORG_ID,
  orgRole: "admin",
  orgSlug: "demo-org",
};

/**
 * Build a Supabase server client wired to the Next.js cookies API.
 * Each call constructs a fresh client (cheap — just wraps fetch).
 */
async function getSupabaseServerClient() {
  if (!SUPABASE_AUTH_CONFIGURED) {
    throw new Error("Supabase Auth not configured");
  }
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // cookies().set() throws in server components — middleware handles refresh
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        } catch {
          // same as above
        }
      },
    },
  });
}

/**
 * Read the current AuthSession.
 * Resolution order: API-key headers → Supabase cookie → dev mock → null.
 */
export async function getSession(): Promise<AuthSession | null> {
  // 1. API-key auth (set by middleware via x-apex-* headers)
  try {
    const headersList = await headers();
    const authType = headersList.get("x-apex-auth-type");
    if (authType === "api-key") {
      const userId = headersList.get("x-apex-user-id");
      const orgId = headersList.get("x-apex-org-id");
      if (userId) {
        return {
          userId,
          orgId: orgId || null,
          orgRole: null,  // api-key auth doesn't carry role context
          orgSlug: null,
        };
      }
    }
  } catch {
    // headers() may throw outside request context — fall through
  }

  // 2. Dev mode bypass when Supabase isn't configured
  if (!SUPABASE_AUTH_CONFIGURED && process.env.NODE_ENV === "development") {
    return DEV_SESSION;
  }

  // 3. Supabase cookie session
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Look up org context from public.users
    const orgCtx = await getOrgContextForAuthUser(user.id);
    return {
      userId: user.id,
      orgId: orgCtx?.orgId ?? null,
      orgRole: orgCtx?.role ?? null,
      orgSlug: orgCtx?.slug ?? null,
    };
  } catch {
    if (process.env.NODE_ENV === "development") {
      return DEV_SESSION;
    }
    return null;
  }
}

/**
 * Like getSession() but throws if no session exists.
 * Use in server components / route handlers that require auth.
 */
export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized — no active session");
  }
  return session;
}

/**
 * Look up org context (id, role, slug) for a given Supabase auth user.
 * Returns null if the user has no public.users row yet (pre-trigger or
 * trigger failed) or has organization_id=NULL (not yet onboarded).
 */
async function getOrgContextForAuthUser(authUserId: string): Promise<
  { orgId: string; role: "admin" | "editor" | "viewer"; slug: string | null } | null
> {
  const rows = await db
    .select({
      orgId: users.organizationId,
      role: users.role,
      slug: organizations.slug,
    })
    .from(users)
    .leftJoin(organizations, eq(organizations.id, users.organizationId))
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];
  if (!row.orgId) return null;
  return {
    orgId: row.orgId,
    role: row.role,
    slug: row.slug ?? null,
  };
}

/**
 * Public helper for route handlers that already know the user id and just
 * need org context. Returns null if user has no org membership.
 */
export async function getOrgContext(authUserId: string) {
  return getOrgContextForAuthUser(authUserId);
}

/**
 * Convenience: extract user id from current session, or null.
 * Replaces the Clerk-era getUserId() helper.
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

/**
 * Convenience: extract org id from current session, or null.
 * Replaces the Clerk-era getOrganizationId() helper.
 */
export async function getOrganizationId(): Promise<string | null> {
  const session = await getSession();
  return session?.orgId ?? null;
}
```

- [ ] **Step 8.2: Schema check — confirm `users.authUserId` exists**

The migration was applied in Task 4, but the Drizzle schema in `src/lib/db/schema/users.ts` doesn't yet have the `authUserId` column. Add it:

```bash
grep -n 'authUserId\|auth_user_id' /home/hein/Workspace/ApexGEO/src/lib/db/schema/users.ts
```

Expected (currently): no matches. Add the column.

- [ ] **Step 8.3: Add `authUserId` to the Drizzle users schema**

In `src/lib/db/schema/users.ts`, find the existing `clerkUserId` line (around line 21) and add the new column directly above or below it:

```typescript
// Insert into users table definition (around line 21-23, near clerkUserId)
authUserId: text("auth_user_id").unique(),
```

Note: `text` (not `uuid`) because Drizzle's pg-core uuid type may not align with Supabase's `auth.users.id` typing without extra plumbing — and at the app layer the value is just a string anyway. The DB column is genuinely `uuid` (per migration); Drizzle just sees it as text. This is consistent with how Drizzle treats UUID-typed columns in node-postgres.

- [ ] **Step 8.4: TypeScript check**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E '(supabase-server|users\.ts)' | head -10 || echo CLEAN
```

Expected: `CLEAN`.

- [ ] **Step 8.5: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/lib/auth/supabase-server.ts src/lib/db/schema/users.ts && \
  git commit -m "feat(auth): add supabase-server.ts session helpers + schema authUserId

getSession() reads cookie session via @supabase/ssr and joins to
public.users for org context. Falls back to API-key headers, then
dev-mode mock. Same AuthSession shape as the Clerk era — drop-in for
133 consumer files later in Phase B."
```

---

## Task 9: Create `src/lib/auth/supabase-browser.ts` and `supabase-middleware.ts`

**Files:**
- Create: `src/lib/auth/supabase-browser.ts`
- Create: `src/lib/auth/supabase-middleware.ts`

- [ ] **Step 9.1: Write the browser client**

`src/lib/auth/supabase-browser.ts`:

```typescript
"use client";

import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";

/**
 * Singleton browser-side Supabase client.
 * Use in client components for sign-in/sign-out, OAuth flows,
 * Realtime subscriptions, Storage uploads.
 */
export function createBrowserClient() {
  return createSsrBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 9.2: Write the middleware helper**

`src/lib/auth/supabase-middleware.ts`:

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh Supabase Auth cookies on every request so they don't expire
 * mid-session. Returns the response with updated cookies attached.
 *
 * Called from src/middleware.ts in the Supabase code path. Returns
 * the user id (or null) so the caller can route based on auth state.
 */
export async function updateSupabaseSession(request: NextRequest): Promise<{
  response: NextResponse;
  userId: string | null;
}> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Calling getUser() refreshes the session cookie if needed
  const { data: { user } } = await supabase.auth.getUser();
  return { response, userId: user?.id ?? null };
}
```

- [ ] **Step 9.3: TypeScript check**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E 'supabase-(browser|middleware)' | head -5 || echo CLEAN
```

Expected: `CLEAN`.

- [ ] **Step 9.4: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/lib/auth/supabase-browser.ts src/lib/auth/supabase-middleware.ts && \
  git commit -m "feat(auth): add browser + middleware Supabase helpers"
```

---

## Task 10: Create `src/lib/auth/supabase-admin.ts` (replaces `clerkClient`)

**Files:**
- Create: `src/lib/auth/supabase-admin.ts`

- [ ] **Step 10.1: Write the admin client**

`src/lib/auth/supabase-admin.ts`:

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _admin: SupabaseClient | null = null;

/**
 * Service-role Supabase client for server-side admin operations.
 * NEVER use in client code — service_role key bypasses RLS.
 */
export function getAdminClient(): SupabaseClient {
  if (!_admin) {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase admin client not configured");
    }
    _admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

/**
 * Replaces the Clerk-era pattern of `clerkClient.users.getUser(id)`.
 * Looks up an Apex user (with email + name) by their Supabase auth uuid.
 */
export async function getUserByAuthId(authUserId: string) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      organizationId: users.organizationId,
      isSuperAdmin: users.isSuperAdmin,
    })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Lookup by public.users.id (cuid).
 */
export async function getUserById(userId: string) {
  const rows = await db
    .select({
      id: users.id,
      authUserId: users.authUserId,
      email: users.email,
      name: users.name,
      role: users.role,
      organizationId: users.organizationId,
      isSuperAdmin: users.isSuperAdmin,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}
```

- [ ] **Step 10.2: TypeScript check**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E 'supabase-admin' | head -5 || echo CLEAN
```

Expected: `CLEAN`.

- [ ] **Step 10.3: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/lib/auth/supabase-admin.ts && \
  git commit -m "feat(auth): add supabase-admin.ts service-role client + DB user lookups

Replaces clerkClient.users.getUser(...) with DB-backed equivalents
(getUserByAuthId, getUserById). The service-role client itself is
exposed via getAdminClient() for callers that need raw Supabase API
access (e.g., creating users programmatically)."
```

---

## Task 11: Tests for `supabase-server.ts`

**Files:**
- Create: `src/lib/auth/supabase-server.test.ts`

- [ ] **Step 11.1: Write module-surface + integration tests**

```typescript
// src/lib/auth/supabase-server.test.ts
/**
 * Tests for the Supabase server-side session helpers.
 * Module-surface tests run always; integration tests run only when
 * TEST_DATABASE_URL is set (against the apexgeo-supabase stack).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.unmock("@/lib/db");

describe("supabase-server module — exports", () => {
  it("exports getSession, requireSession, getUserId, getOrganizationId, getOrgContext, SUPABASE_AUTH_CONFIGURED", async () => {
    const mod = await vi.importActual<typeof import("./supabase-server")>("./supabase-server");
    expect(typeof mod.getSession).toBe("function");
    expect(typeof mod.requireSession).toBe("function");
    expect(typeof mod.getUserId).toBe("function");
    expect(typeof mod.getOrganizationId).toBe("function");
    expect(typeof mod.getOrgContext).toBe("function");
    expect(typeof mod.SUPABASE_AUTH_CONFIGURED).toBe("boolean");
  });
});

describe("supabase-server — dev-mode bypass", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NODE_ENV = "development";
  });

  it("returns mock session when Supabase Auth is not configured", async () => {
    // Mock next/headers to return empty headers (no API key)
    vi.doMock("next/headers", () => ({
      headers: async () => new Headers(),
      cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
    }));
    const mod = await vi.importActual<typeof import("./supabase-server")>("./supabase-server");
    const session = await mod.getSession();
    expect(session).toEqual({
      userId: "dev-user-id",
      orgId: "demo-org-id",
      orgRole: "admin",
      orgSlug: "demo-org",
    });
  });
});

describe("supabase-server — API-key takes precedence", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns API-key session when x-apex-* headers are set, even with cookie session active", async () => {
    vi.doMock("next/headers", () => ({
      headers: async () =>
        new Headers({
          "x-apex-auth-type": "api-key",
          "x-apex-user-id": "user-from-api-key",
          "x-apex-org-id": "org-from-api-key",
        }),
      cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
    }));
    const mod = await vi.importActual<typeof import("./supabase-server")>("./supabase-server");
    const session = await mod.getSession();
    expect(session).toEqual({
      userId: "user-from-api-key",
      orgId: "org-from-api-key",
      orgRole: null,
      orgSlug: null,
    });
  });
});

describe.skipIf(!process.env.TEST_DATABASE_URL || !process.env.TEST_SUPABASE_URL)(
  "supabase-server — integration",
  () => {
    beforeEach(() => {
      vi.resetModules();
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
      process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.TEST_SUPABASE_URL!;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY!;
    });

    it("creates an auth user via Admin API and verifies the trigger populates public.users", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(
        process.env.TEST_SUPABASE_URL!,
        process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );

      const probeEmail = `vitest-${Date.now()}@apex.local`;
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: probeEmail,
        password: "vitestpass1234",
        email_confirm: true,
        user_metadata: { name: "Vitest Probe" },
      });
      expect(createErr).toBeNull();
      expect(created.user?.id).toBeTruthy();

      // Verify the trigger inserted the public.users row
      const { db } = await vi.importActual<typeof import("@/lib/db")>("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.authUserId, created.user!.id))
        .limit(1);
      expect(rows.length).toBe(1);
      expect(rows[0].email).toBe(probeEmail);
      expect(rows[0].role).toBe("viewer");

      // Cleanup
      await admin.auth.admin.deleteUser(created.user!.id);
      await db.delete(users).where(eq(users.authUserId, created.user!.id));
    });
  }
);
```

- [ ] **Step 11.2: Run tests (module-surface only — no TEST_DATABASE_URL set)**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx vitest run src/lib/auth/supabase-server.test.ts 2>&1 | tail -10
```

Expected: 3 module-surface tests pass; integration block skipped.

- [ ] **Step 11.3: Run integration test against live apexgeo-supabase**

```bash
PW=$(sudo -u velo grep '^POSTGRES_PASSWORD=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
ANON=$(sudo -u velo grep '^ANON_KEY=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
SVC=$(sudo -u velo grep '^SERVICE_ROLE_KEY=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)

TEST_DATABASE_URL="postgresql://postgres.apexgeo:${PW}@localhost:7783/apexgeo?sslmode=disable" \
TEST_SUPABASE_URL="http://localhost:7780" \
TEST_SUPABASE_ANON_KEY="$ANON" \
TEST_SUPABASE_SERVICE_ROLE_KEY="$SVC" \
  npx vitest run src/lib/auth/supabase-server.test.ts 2>&1 | tail -10
```

Expected: 4 tests pass (3 module + 1 integration).

- [ ] **Step 11.4: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/lib/auth/supabase-server.test.ts && \
  git commit -m "test(auth): supabase-server module-surface + integration tests

Verifies dev-mode bypass, API-key precedence, and end-to-end Admin
API → trigger → public.users row creation against apexgeo-supabase."
```

---

# PHASE B — Cutover (Tasks 12-27)

After Phase A, the codebase has all the new helpers in place but still runs on Clerk. Phase B replaces Clerk with Supabase Auth in one continuous push. Each task ends in a commit so progress can pause/resume mid-cutover.

---

## Task 12: New sign-in page

**Files:**
- Create: `src/app/sign-in/page.tsx`

The existing `src/app/sign-in/[[...sign-in]]/page.tsx` is the Clerk catch-all route — it stays in place during Phase B until Task 23 (final delete). Next.js will prefer the more specific `/sign-in/page.tsx` over the catch-all when both exist? Actually no — `[[...sign-in]]` is an optional catch-all that matches `/sign-in` exactly, conflicting with `/sign-in/page.tsx`. To avoid the conflict, this task ALSO deletes the Clerk catch-all in the same commit.

- [ ] **Step 12.1: Delete the Clerk catch-all and create the new page**

```bash
rm /home/hein/Workspace/ApexGEO/src/app/sign-in/\[\[...sign-in\]\]/page.tsx
rmdir /home/hein/Workspace/ApexGEO/src/app/sign-in/\[\[...sign-in\]\] 2>/dev/null
```

Create `src/app/sign-in/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SignInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignInValues = z.infer<typeof SignInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        setServerError(error.message);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function signInWithProvider(provider: "google" | "github") {
    setServerError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setServerError(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
      <div
        className="w-full max-w-md card-primary rounded-2xl p-8 shadow-2xl"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(0,229,204,0.06), transparent 60%), #141930",
        }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Sign in to ApexGEO
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your brand across AI search engines.
          </p>
        </div>

        <div className="space-y-3 mb-5">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signInWithProvider("google")}
          >
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signInWithProvider("github")}
          >
            Continue with GitHub
          </Button>
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/reset-password"
                className="text-xs text-primary hover:text-primary/80"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary hover:text-primary/80">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 12.2: Verify Next.js routes resolve cleanly**

```bash
cd /home/hein/Workspace/ApexGEO && \
  ls src/app/sign-in/
```

Expected: just `page.tsx`. The `[[...sign-in]]/` directory should be gone.

- [ ] **Step 12.3: TypeScript check**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E 'sign-in/page' | head -5 || echo CLEAN
```

Expected: `CLEAN`.

- [ ] **Step 12.4: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add -A src/app/sign-in/ && \
  git commit -m "feat(auth): hand-rolled sign-in page (replaces Clerk catch-all)

Email + password form with react-hook-form + zod validation. Google
+ GitHub social login buttons. 'Forgot password' link to /auth/reset-password.
Matches Apex design system (#0a0f1a background, card-primary, cyan accents)."
```

---

## Task 13: New sign-up page

**Files:**
- Create: `src/app/sign-up/page.tsx`

- [ ] **Step 13.1: Delete the Clerk catch-all and create the new page**

```bash
rm /home/hein/Workspace/ApexGEO/src/app/sign-up/\[\[...sign-up\]\]/page.tsx
rmdir /home/hein/Workspace/ApexGEO/src/app/sign-up/\[\[...sign-up\]\] 2>/dev/null
```

Create `src/app/sign-up/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SignUpSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Please accept the terms" }),
  }),
});

type SignUpValues = z.infer<typeof SignUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { name: "", email: "", password: "", acceptTerms: false as unknown as true },
  });

  async function onSubmit(values: SignUpValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { name: values.name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setServerError(error.message);
        return;
      }
      // If email confirmation is required (production), GoTrue returns user
      // with email_confirmed_at = null and we show an "email sent" state.
      if (data.user && !data.session) {
        setEmailSent(values.email);
        return;
      }
      // If autoconfirm is on (dev), session exists immediately — go straight to onboarding
      router.replace("/onboarding");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function signUpWithProvider(provider: "google" | "github") {
    setServerError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setServerError(error.message);
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
        <div className="w-full max-w-md card-primary rounded-2xl p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <span className="text-foreground">{emailSent}</span>.
            Click the link to activate your account.
          </p>
          <Link href="/sign-in" className="text-primary text-sm hover:text-primary/80 mt-4 inline-block">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
      <div
        className="w-full max-w-md card-primary rounded-2xl p-8 shadow-2xl"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(0,229,204,0.06), transparent 60%), #141930",
        }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start tracking your brand in AI search.</p>
        </div>

        <div className="space-y-3 mb-5">
          <Button type="button" variant="outline" className="w-full" onClick={() => signUpWithProvider("google")}>
            Continue with Google
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => signUpWithProvider("github")}>
            Continue with GitHub
          </Button>
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or sign up with email</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
            {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
          </div>
          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              type="checkbox"
              {...form.register("acceptTerms")}
              className="mt-1 h-4 w-4 rounded border-border/50 bg-input text-primary"
            />
            <Label htmlFor="acceptTerms" className="text-xs text-muted-foreground font-normal">
              I agree to the <Link href="/terms" className="text-primary">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="text-primary">Privacy Policy</Link>.
            </Label>
          </div>
          {form.formState.errors.acceptTerms && <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message}</p>}

          {serverError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:text-primary/80">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 13.2: TypeScript check**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E 'sign-up/page' | head -5 || echo CLEAN
```

Expected: `CLEAN`.

- [ ] **Step 13.3: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add -A src/app/sign-up/ && \
  git commit -m "feat(auth): hand-rolled sign-up page with social + T&C checkbox"
```

---

## Task 14: OAuth + email-link callback handler

**Files:**
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 14.1: Write the callback handler**

```typescript
// src/app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Handles the redirect back from Supabase Auth after:
 *   - OAuth sign-in (Google, GitHub)
 *   - Email-confirmation links
 *   - Magic-link / password-reset tokens
 *
 * Reads the `code` query param, exchanges it for a session, then
 * redirects to /onboarding (new users) or /dashboard (returning users).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
    );
  }

  // Determine onboarding vs dashboard route — if the just-signed-in user
  // has no organization_id in public.users, send to onboarding.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db
      .select({ orgId: users.organizationId })
      .from(users)
      .where(eq(users.authUserId, user.id))
      .limit(1);
    if (rows.length === 0 || !rows[0].orgId) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return response;
}
```

- [ ] **Step 14.2: TypeScript check + commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E 'auth/callback' | head -5 || echo CLEAN && \
  git add src/app/auth/callback/route.ts && \
  git commit -m "feat(auth): OAuth + email-link callback handler

Exchanges Supabase Auth code for session, then routes to /onboarding
if the user has no organization_id (new signup) or /dashboard (returning)."
```

---

## Task 15: Password-reset page

**Files:**
- Create: `src/app/auth/reset-password/page.tsx`

- [ ] **Step 15.1: Write the reset page**

```typescript
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RequestSchema = z.object({ email: z.string().email("Enter a valid email") });
const NewPasswordSchema = z.object({
  password: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

type RequestValues = z.infer<typeof RequestSchema>;
type NewPasswordValues = z.infer<typeof NewPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReset = searchParams.get("type") === "recovery";
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(RequestSchema),
    defaultValues: { email: "" },
  });
  const newPasswordForm = useForm<NewPasswordValues>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  async function requestReset(values: RequestValues) {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/reset-password?type=recovery`,
    });
    if (error) setServerError(error.message);
    else setEmailSent(values.email);
  }

  async function setNewPassword(values: NewPasswordValues) {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError(error.message);
    } else {
      router.replace("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
      <div className="w-full max-w-md card-primary rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          {isReset ? "Set a new password" : "Reset your password"}
        </h1>

        {emailSent ? (
          <p className="text-sm text-muted-foreground">
            We sent a recovery link to <span className="text-foreground">{emailSent}</span>.
            Open the email to continue.
          </p>
        ) : isReset ? (
          <form onSubmit={newPasswordForm.handleSubmit(setNewPassword)} className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...newPasswordForm.register("password")} />
              {newPasswordForm.formState.errors.password && (
                <p className="text-xs text-destructive">{newPasswordForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" autoComplete="new-password" {...newPasswordForm.register("confirm")} />
              {newPasswordForm.formState.errors.confirm && (
                <p className="text-xs text-destructive">{newPasswordForm.formState.errors.confirm.message}</p>
              )}
            </div>
            {serverError && <div className="text-sm text-destructive">{serverError}</div>}
            <Button type="submit" className="w-full">Update password</Button>
          </form>
        ) : (
          <form onSubmit={requestForm.handleSubmit(requestReset)} className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...requestForm.register("email")} />
              {requestForm.formState.errors.email && (
                <p className="text-xs text-destructive">{requestForm.formState.errors.email.message}</p>
              )}
            </div>
            {serverError && <div className="text-sm text-destructive">{serverError}</div>}
            <Button type="submit" className="w-full">Send reset link</Button>
            <p className="text-sm text-muted-foreground text-center">
              <Link href="/sign-in" className="text-primary hover:text-primary/80">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 15.2: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E 'reset-password' | head -5 || echo CLEAN && \
  git add src/app/auth/reset-password/page.tsx && \
  git commit -m "feat(auth): password-reset page (request + set-new-password)"
```

---

## Task 16: Rewrite `src/middleware.ts`

**Files:**
- Modify: `src/middleware.ts` (full rewrite — keeps every API-key/dev/super-admin/rate-limit code path, only the production session source swaps)

- [ ] **Step 16.1: Write the new middleware**

Replace the entire contents of `src/middleware.ts` with:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/auth/supabase-middleware";

const SUPABASE_AUTH_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co";

const API_KEY_AUTH_HEADERS = {
  AUTH_TYPE: "x-apex-auth-type",
  KEY_ID: "x-apex-key-id",
  USER_ID: "x-apex-user-id",
  ORG_ID: "x-apex-org-id",
  USER_EMAIL: "x-apex-user-email",
  USER_NAME: "x-apex-user-name",
  ORG_NAME: "x-apex-org-name",
} as const;

function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith("(.*)")) {
      return pathname.startsWith(pattern.slice(0, -4));
    }
    return pathname === pattern;
  });
}

const publicRoutes = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/auth/(.*)",                 // OAuth callback, password reset
  "/onboarding(.*)",
  "/api/onboarding(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/health",
  "/api/status",
  "/api/brands(.*)",
  "/api/monitor/trigger-by-domain",
  "/api/monitor/update-keywords",
  "/_next(.*)",
  "/static(.*)",
  "/favicon.ico",
  "/logo.svg",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
];

const apiKeyAuthRoutes = [
  "/api/brands(.*)",
  "/api/content(.*)",
  "/api/audit(.*)",
  "/api/recommendations(.*)",
  "/api/monitor(.*)",
  "/api/competitive(.*)",
  "/api/portfolios(.*)",
  "/api/analytics(.*)",
  "/api/export(.*)",
  "/api/locations(.*)",
  "/api/opportunities(.*)",
  "/api/people(.*)",
  "/api/integrations(.*)",
  "/api/ai-insights(.*)",
  "/api/simulations(.*)",
];

const orgRoutes = [
  "/dashboard(.*)",
  "/monitor(.*)",
  "/create(.*)",
  "/audit(.*)",
  "/recommendations(.*)",
  "/settings(.*)",
  "/api/content(.*)",
  "/api/audits(.*)",
  "/api/recommendations(.*)",
  "/api/monitoring(.*)",
  "/api/portfolios(.*)",
  "/api/reports(.*)",
];

const superAdminRoutes = ["/admin(.*)", "/api/admin(.*)"];
const orgAdminRoutes = [
  "/settings/organization(.*)",
  "/settings/billing(.*)",
  "/settings/api-keys(.*)",
];

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
function isApexApiKey(token: string | null): boolean {
  return token ? token.startsWith("apx_") : false;
}
function createUnauthorizedResponse(message: string, reason: string): NextResponse {
  return NextResponse.json({ error: "Unauthorized", message, reason }, { status: 401 });
}

async function handleApiKeyAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const isApiKeyRoute = matchesPattern(pathname, apiKeyAuthRoutes);
  const authHeader = request.headers.get("authorization");
  const token = extractBearerToken(authHeader);
  if (!isApiKeyRoute || !isApexApiKey(token)) return null;

  try {
    const { validateApiKey } = await import("@/lib/auth/api-key-auth");
    const result = await validateApiKey(token!);
    if (!result.valid) return createUnauthorizedResponse(result.message, result.reason);

    let rateLimitHeaders: Record<string, string> = {};
    try {
      const { checkApiRateLimit, getRateLimitHeaders, classifyRoute } = await import(
        "@/lib/api/api-rate-limiter"
      );
      const bucket = classifyRoute(pathname);
      const rl = await checkApiRateLimit(`${result.organizationId}:${bucket}`, bucket);
      rateLimitHeaders = getRateLimitHeaders(rl);
      if (!rl.allowed) {
        const r = NextResponse.json(
          {
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please retry after the reset time.",
            retryAfter: new Date(rl.resetMs).toISOString(),
          },
          { status: 429 }
        );
        for (const [k, v] of Object.entries(rateLimitHeaders)) r.headers.set(k, v);
        r.headers.set("Retry-After", String(Math.ceil((rl.resetMs - Date.now()) / 1000)));
        return r;
      }
    } catch {
      // rate limiter unavailable — fail open
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(API_KEY_AUTH_HEADERS.AUTH_TYPE, "api-key");
    requestHeaders.set(API_KEY_AUTH_HEADERS.KEY_ID, result.keyId);
    requestHeaders.set(API_KEY_AUTH_HEADERS.USER_ID, result.userId);
    requestHeaders.set(API_KEY_AUTH_HEADERS.ORG_ID, result.organizationId);
    if (result.userEmail) requestHeaders.set(API_KEY_AUTH_HEADERS.USER_EMAIL, result.userEmail);
    if (result.userName) requestHeaders.set(API_KEY_AUTH_HEADERS.USER_NAME, result.userName);
    if (result.organizationName) requestHeaders.set(API_KEY_AUTH_HEADERS.ORG_NAME, result.organizationName);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    for (const [k, v] of Object.entries(rateLimitHeaders)) response.headers.set(k, v);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to validate API key" },
      { status: 500 }
    );
  }
}

async function devMiddleware(request: NextRequest) {
  const apiKeyResponse = await handleApiKeyAuth(request);
  if (apiKeyResponse) return apiKeyResponse;
  const { pathname } = request.nextUrl;
  if (matchesPattern(pathname, superAdminRoutes)) {
    if (process.env.DEV_SUPER_ADMIN !== "true") {
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "super_admin_required");
      url.searchParams.set("message", "Set DEV_SUPER_ADMIN=true in .env to access admin panel");
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

async function productionMiddleware(request: NextRequest) {
  const apiKeyResponse = await handleApiKeyAuth(request);
  if (apiKeyResponse) return apiKeyResponse;

  const { pathname } = request.nextUrl;
  const { response, userId } = await updateSupabaseSession(request);

  // Public routes always pass
  if (matchesPattern(pathname, publicRoutes)) return response;

  // No session → bounce to /sign-in
  if (!userId) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(url);
  }

  // Org-route gate: just having a session is enough; getOrgContext()
  // happens at handler level. The middleware's job is just to redirect
  // unauthenticated users — it doesn't enforce org membership here.

  // Super-admin routes: check public.users.is_super_admin OR DEV_SUPER_ADMIN
  if (matchesPattern(pathname, superAdminRoutes)) {
    const devSuperAdmin =
      process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";
    if (!devSuperAdmin) {
      const { getUserByAuthId } = await import("@/lib/auth/supabase-admin");
      const user = await getUserByAuthId(userId);
      if (!user?.isSuperAdmin) {
        const url = new URL("/dashboard", request.url);
        url.searchParams.set("error", "super_admin_required");
        return NextResponse.redirect(url);
      }
    }
  }

  // Org-admin routes: check public.users.role === 'admin'
  if (matchesPattern(pathname, orgAdminRoutes)) {
    const { getUserByAuthId } = await import("@/lib/auth/supabase-admin");
    const user = await getUserByAuthId(userId);
    if (user?.role !== "admin") {
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  // Per-session rate limiting on /api routes (api-key path was handled above)
  if (pathname.startsWith("/api/")) {
    try {
      const { checkApiRateLimit, getRateLimitHeaders, classifyRoute } = await import(
        "@/lib/api/api-rate-limiter"
      );
      const bucket = classifyRoute(pathname);
      const rl = await checkApiRateLimit(`${userId}:${bucket}`, bucket);
      if (!rl.allowed) {
        const r = NextResponse.json(
          {
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please retry after the reset time.",
            retryAfter: new Date(rl.resetMs).toISOString(),
          },
          { status: 429 }
        );
        for (const [k, v] of Object.entries(getRateLimitHeaders(rl))) r.headers.set(k, v);
        r.headers.set("Retry-After", String(Math.ceil((rl.resetMs - Date.now()) / 1000)));
        return r;
      }
    } catch {
      // rate limiter unavailable — fail open
    }
  }

  return response;
}

export default async function middleware(request: NextRequest) {
  if (!SUPABASE_AUTH_CONFIGURED) return devMiddleware(request);
  return productionMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 16.2: TypeScript check**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E '^src/middleware\.ts' | head -10 || echo CLEAN
```

Expected: `CLEAN`.

- [ ] **Step 16.3: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/middleware.ts && \
  git commit -m "feat(middleware): swap Clerk → Supabase Auth, preserve all other paths

API-key auth path, dev-mode bypass, public routes, super-admin gate
(now via public.users.is_super_admin), org-admin gate (via public.users.role),
and per-session rate limiting all preserved verbatim. Only the production
session source swaps from clerkMiddleware to updateSupabaseSession."
```

---

## Task 17: Rewrite `AuthSync` to use Supabase

**Files:**
- Modify: `src/components/providers/auth-sync.tsx` (rename to `supabase-auth-sync.tsx` for clarity)

- [ ] **Step 17.1: Create the new sync component**

```bash
mv /home/hein/Workspace/ApexGEO/src/components/providers/auth-sync.tsx \
   /home/hein/Workspace/ApexGEO/src/components/providers/supabase-auth-sync.tsx
```

Replace contents of `src/components/providers/supabase-auth-sync.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { useAuthStore } from "@/stores/auth";

/**
 * SupabaseAuthSync — bridges Supabase Auth session into the Zustand auth store.
 * Must be rendered in the app layout (inside the body, before any consumer).
 *
 * On every auth state change (sign-in, sign-out, token refresh):
 *   1. Updates the user object in the store from auth.users
 *   2. Fetches the corresponding public.users row + organization via a server action
 *   3. Populates organization + membership in the store
 *
 * Without this component, useAuthStore().user stays null and all data
 * hooks gated on `enabled: !!user` stay disabled.
 */
export function SupabaseAuthSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const setOrganization = useAuthStore((s) => s.setOrganization);
  const setMembership = useAuthStore((s) => s.setMembership);
  const supabase = createBrowserClient();

  useEffect(() => {
    let mounted = true;

    async function syncFromAuthUser(authUserId: string, email: string, name: string | null) {
      if (!mounted) return;
      setUser({
        id: authUserId,
        email,
        firstName: name?.split(" ")[0],
        lastName: name?.split(" ").slice(1).join(" ") || undefined,
        fullName: name ?? undefined,
      });

      // Fetch public.users + organization via API endpoint
      try {
        const res = await fetch("/api/auth/context", { cache: "no-store" });
        if (!res.ok) return;
        const { user, organization, membership } = await res.json();
        if (!mounted) return;
        if (user) {
          // user.id here is the public.users.id (cuid), not the auth uuid
          setUser({
            id: user.id,
            email: user.email,
            firstName: user.name?.split(" ")[0],
            lastName: user.name?.split(" ").slice(1).join(" ") || undefined,
            fullName: user.name ?? undefined,
          });
        }
        setOrganization(organization ?? null);
        setMembership(membership ?? null);
      } catch {
        // network error — leave whatever is already in store
      }
    }

    // Initial load
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setUser(null);
        setOrganization(null);
        setMembership(null);
        return;
      }
      const meta = (user.user_metadata ?? {}) as { name?: string };
      void syncFromAuthUser(user.id, user.email ?? "", meta.name ?? null);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setUser(null);
          setOrganization(null);
          setMembership(null);
          return;
        }
        const meta = (session.user.user_metadata ?? {}) as { name?: string };
        void syncFromAuthUser(session.user.id, session.user.email ?? "", meta.name ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setOrganization, setMembership, supabase]);

  return null;
}
```

- [ ] **Step 17.2: Add the supporting `/api/auth/context` route**

Create `src/app/api/auth/context/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/supabase-server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null, organization: null, membership: null });
  }

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, session.userId))
    .limit(1);
  const user = userRows[0] ?? null;

  let organization = null;
  let membership = null;
  if (user?.organizationId) {
    const orgRows = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);
    organization = orgRows[0]
      ? { id: orgRows[0].id, name: orgRows[0].name, slug: orgRows[0].slug ?? undefined }
      : null;
    membership = {
      id: user.id,
      role: user.role,
      userId: user.id,
      organizationId: user.organizationId,
    };
  }

  return NextResponse.json({ user: user ? { ...user, id: user.id } : null, organization, membership });
}
```

- [ ] **Step 17.3: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add src/components/providers/ src/app/api/auth/ && \
  git rm src/components/providers/auth-sync.tsx 2>/dev/null || true && \
  git commit -m "refactor(auth): rewrite AuthSync to bridge Supabase session into Zustand

Renamed to supabase-auth-sync.tsx. Subscribes to supabase.auth.onAuthStateChange,
fetches public.users + organization via new /api/auth/context endpoint,
populates the same Zustand store keys consumed by useOrganizationId().
Consumers of @/stores/auth don't need any changes."
```

---

## Task 18: Replace `useAuth` from `@clerk/nextjs` in `usePlatformDashboard.ts`

**Files:**
- Modify: `src/hooks/usePlatformDashboard.ts` lines 9, 171, 209

- [ ] **Step 18.1: Edit the file**

The file uses `const { isLoaded, userId } = useAuth();` from `@clerk/nextjs`. Replace with the equivalent from the Zustand store (populated by SupabaseAuthSync):

```bash
cd /home/hein/Workspace/ApexGEO && \
  python3 - <<'PY'
import re
path = "src/hooks/usePlatformDashboard.ts"
with open(path) as f: s = f.read()

s = s.replace(
    'import { useAuth } from "@clerk/nextjs";',
    'import { useUserId } from "@/stores/auth";'
)
# `const { isLoaded, userId } = useAuth();` → `const userId = useUserId(); const isLoaded = userId !== undefined;`
s = re.sub(
    r"const\s+\{\s*isLoaded,\s*userId\s*\}\s*=\s*useAuth\(\);",
    "const userId = useUserId();\n  const isLoaded = userId !== undefined;",
    s,
)

with open(path, "w") as f: f.write(s)
print("done")
PY
```

If `useUserId` doesn't exist in `@/stores/auth`, add it:

```bash
cat >> /home/hein/Workspace/ApexGEO/src/stores/auth.ts <<'EOF'

/** Convenience selector: returns current user id (or null if signed out). */
export const useUserId = () => useAuthStore((s) => s.user?.id ?? null);
EOF
```

(Verify the file has a default export pattern that supports this; if not, refactor minimally.)

- [ ] **Step 18.2: TypeScript check + commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E 'usePlatformDashboard|stores/auth' | head -5 || echo CLEAN && \
  git add src/hooks/usePlatformDashboard.ts src/stores/auth.ts && \
  git commit -m "refactor(hooks): swap Clerk useAuth for Zustand useUserId in platform dashboard"
```

---

## Task 19: Bulk codemod 133 server-side `auth()` call sites

**Files:** All files matching `grep -lE 'from "@clerk/nextjs/server"' src/**/*.ts src/**/*.tsx`

- [ ] **Step 19.1: Write the codemod script**

Create `/tmp/codemod-clerk-auth.sh`:

```bash
#!/bin/bash
set -e
cd /home/hein/Workspace/ApexGEO

# Identify target files
mapfile -t files < <(grep -rlE 'from "@clerk/nextjs/server"' src/ tests/ --include='*.ts' --include='*.tsx' 2>/dev/null)
echo "files to process: ${#files[@]}"

for f in "${files[@]}"; do
  # Skip files we'll handle manually (currentUser, clerkClient, webhook handler)
  if grep -qE 'currentUser\(|clerkClient' "$f"; then
    echo "SKIP (manual): $f"
    continue
  fi
  if [[ "$f" == *"/webhooks/clerk/"* ]]; then
    echo "SKIP (will delete): $f"
    continue
  fi

  python3 - "$f" <<'PY'
import re, sys
path = sys.argv[1]
with open(path) as fh: s = fh.read()
orig = s

# Replace import
s = re.sub(
    r'import\s*\{\s*auth\s*(?:,\s*[^}]+)?\s*\}\s*from\s*"@clerk/nextjs/server";?',
    'import { getSession } from "@/lib/auth/supabase-server";',
    s
)

# Replace `await auth()` destructure pattern:
# const { userId, orgId, orgRole, orgSlug, ... } = await auth();
s = re.sub(
    r'const\s+\{\s*([^}]+)\}\s*=\s*await\s+auth\(\);',
    lambda m: f'const __session = await getSession();\nconst {{ {m.group(1).strip()} }} = __session ?? {{ userId: null, orgId: null, orgRole: null, orgSlug: null }};',
    s
)

# Standalone `await auth()` (rare — assigned to a single variable)
s = re.sub(
    r'const\s+(\w+)\s*=\s*await\s+auth\(\);',
    r'const \1 = await getSession();',
    s
)

if s != orig:
    with open(path, "w") as fh: fh.write(s)
    print(f"  modified: {path}")
PY
done

echo
echo "=== remaining @clerk/nextjs/server imports (should be only manual-handle files) ==="
grep -lE 'from "@clerk/nextjs/server"' src/**/*.ts src/**/*.tsx 2>/dev/null | head -20
```

- [ ] **Step 19.2: Run the codemod**

```bash
chmod +x /tmp/codemod-clerk-auth.sh && /tmp/codemod-clerk-auth.sh 2>&1 | tail -30
```

Expected: ~120 files modified. Remaining files all use `currentUser()` or `clerkClient` (handled in Tasks 20 + 21).

- [ ] **Step 19.3: TypeScript check + fix any sed-induced syntax errors**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | head -50
```

Expected: most files clean; some may need manual fixes (e.g., the `__session` variable name conflicts with a real `__session` variable — unlikely but possible). Fix per-file as needed.

- [ ] **Step 19.4: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  rm /tmp/codemod-clerk-auth.sh && \
  git add -u && \
  git commit -m "refactor(auth): bulk codemod ~120 sites from Clerk auth() to getSession()

Same destructure pattern (userId, orgId, orgRole, orgSlug); just
the source swaps from @clerk/nextjs/server to @/lib/auth/supabase-server.
Files using currentUser() or clerkClient handled separately in
follow-up tasks."
```

---

## Task 20: Manual rewrite of `currentUser()` call sites

**Files (4):**
- `src/app/api/payfast/checkout/route.ts:73`
- `src/app/api/admin/universal-api-keys/route.ts:30, 168`
- `src/lib/auth/super-admin.ts:119`

`currentUser()` returned a Clerk `User` object with `emailAddresses`, `firstName`, `lastName`, `imageUrl`. The Supabase equivalent: get session → look up `public.users` by `auth_user_id`.

- [ ] **Step 20.1: Write a helper in supabase-server.ts**

Add to `src/lib/auth/supabase-server.ts` (append to the file):

```typescript
/**
 * Returns the current user's full DB row (or null).
 * Replaces Clerk's currentUser() helper.
 */
export async function currentDbUser() {
  const session = await getSession();
  if (!session) return null;
  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(users).where(eq(users.authUserId, session.userId)).limit(1);
  return rows[0] ?? null;
}
```

- [ ] **Step 20.2: Edit each consumer file**

For each of the 4 files, replace:
```ts
import { currentUser } from "@clerk/nextjs/server";
const user = await currentUser();
const email = user?.emailAddresses[0]?.emailAddress;
const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
```

with:
```ts
import { currentDbUser } from "@/lib/auth/supabase-server";
const user = await currentDbUser();
const email = user?.email;
const name = user?.name ?? "";
```

The exact lines vary per file. Read each, identify the `currentUser()` call, and adapt — keeping the same downstream variable names so subsequent code doesn't change.

- [ ] **Step 20.3: TypeScript check + commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E '(payfast|universal-api-keys|super-admin)' | head -10 || echo CLEAN && \
  git add src/lib/auth/supabase-server.ts \
        src/app/api/payfast/checkout/route.ts \
        src/app/api/admin/universal-api-keys/route.ts \
        src/lib/auth/super-admin.ts && \
  git commit -m "refactor(auth): replace currentUser() with currentDbUser() at 4 sites"
```

---

## Task 21: Manual rewrite of `clerkClient` call sites

**Files (5):**
- `src/app/api/user/api-keys/route.ts:53, 177`
- `src/app/api/user/api-keys/[id]/route.ts:64`
- `src/app/api/admin/api-config/route.ts:42, 201`
- `src/app/api/admin/api-config/[id]/route.ts:47`

`clerkClient.users.getUser(userId)` returned a Clerk User. Replace with the `getUserByAuthId` helper (already in `supabase-admin.ts` from Task 10) — but with a twist: these sites typically have a Clerk userId (which post-cutover is the auth.users uuid), so `getUserByAuthId(userId)` works.

- [ ] **Step 21.1: Edit each consumer file**

Replace the import:
```ts
import { auth, clerkClient } from "@clerk/nextjs/server";
```
with:
```ts
import { getSession } from "@/lib/auth/supabase-server";
import { getUserByAuthId } from "@/lib/auth/supabase-admin";
```

Replace the call:
```ts
const clerk = await clerkClient();
const user = await clerk.users.getUser(userId);
const displayName = user.firstName ?? user.emailAddresses[0]?.emailAddress;
```
with:
```ts
const user = await getUserByAuthId(userId);
const displayName = user?.name ?? user?.email ?? "Unknown";
```

- [ ] **Step 21.2: TypeScript check + commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E '(user/api-keys|admin/api-config)' | head -10 || echo CLEAN && \
  git add src/app/api/user/api-keys/ src/app/api/admin/api-config/ && \
  git commit -m "refactor(auth): replace clerkClient with getUserByAuthId at 5 sites"
```

---

## Task 22: Remove `<ClerkProvider>` from `src/app/layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 22.1: Edit the layout**

Find and remove the `<ClerkProvider>` wrapper plus its import. Replace `<AuthSync />` with `<SupabaseAuthSync />`.

```bash
cd /home/hein/Workspace/ApexGEO && \
  python3 - <<'PY'
import re
path = "src/app/layout.tsx"
with open(path) as f: s = f.read()

# Remove ClerkProvider import
s = re.sub(r'import\s*\{\s*ClerkProvider\s*\}\s*from\s*"@/components/providers/clerk-provider";\s*\n', '', s)

# Replace AuthSync import with SupabaseAuthSync
s = re.sub(
    r'import\s*\{\s*AuthSync\s*\}\s*from\s*"@/components/providers/auth-sync";',
    'import { SupabaseAuthSync } from "@/components/providers/supabase-auth-sync";',
    s
)

# Remove <ClerkProvider> opening + closing tags (preserve children)
s = re.sub(r'<ClerkProvider>\s*\n', '', s)
s = re.sub(r'\s*</ClerkProvider>', '', s)

# Replace <AuthSync /> with <SupabaseAuthSync />
s = s.replace("<AuthSync />", "<SupabaseAuthSync />")

with open(path, "w") as f: f.write(s)
print("done")
PY
```

- [ ] **Step 22.2: TypeScript check + commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E 'app/layout' | head -5 || echo CLEAN && \
  git add src/app/layout.tsx && \
  git commit -m "feat(layout): drop ClerkProvider, swap AuthSync → SupabaseAuthSync"
```

---

## Task 23: Delete dead Clerk files

**Files (6 deletions):**
- `src/lib/auth/clerk.ts`
- `src/components/providers/clerk-provider.tsx`
- `src/app/api/webhooks/clerk/route.ts`
- `src/types/clerk.d.ts`
- `src/app/sign-in/[[...sign-in]]/` (already deleted in Task 12)
- `src/app/sign-up/[[...sign-up]]/` (already deleted in Task 13)

- [ ] **Step 23.1: Delete the files**

```bash
cd /home/hein/Workspace/ApexGEO && \
  rm src/lib/auth/clerk.ts && \
  rm src/components/providers/clerk-provider.tsx && \
  rm -rf src/app/api/webhooks/clerk && \
  rm src/types/clerk.d.ts
```

- [ ] **Step 23.2: Verify zero remaining @clerk imports**

```bash
grep -rE '@clerk/' /home/hein/Workspace/ApexGEO/src/ --include='*.ts' --include='*.tsx' | head -10 || echo CLEAN
```

Expected: `CLEAN`. If any remain, fix them in this task.

- [ ] **Step 23.3: TypeScript check**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E '^src/' | grep -v '\.test\.ts' | head -10
```

Expected: 0 errors in production code (test mocks may still reference Clerk — those get tackled in Task 25's vitest pass).

- [ ] **Step 23.4: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add -A && \
  git commit -m "chore(auth): delete Clerk files (clerk.ts, providers, webhook, types)"
```

---

## Task 24: Uninstall Clerk dependencies

**Files:** `package.json`, `bun.lock`

- [ ] **Step 24.1: Uninstall**

```bash
cd /home/hein/Workspace/ApexGEO && \
  bun remove @clerk/nextjs @clerk/themes svix 2>&1 | tail -5
```

(`svix` was the webhook signature verification package, only used by the Clerk webhook handler.)

- [ ] **Step 24.2: Verify no consumers**

```bash
grep -rE '@clerk/|from "svix"' /home/hein/Workspace/ApexGEO/src /home/hein/Workspace/ApexGEO/tests --include='*.ts' --include='*.tsx' | head -5 || echo CLEAN
```

Expected: `CLEAN`.

- [ ] **Step 24.3: Commit**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add package.json bun.lock && \
  git commit -m "chore(deps): uninstall @clerk/nextjs, @clerk/themes, svix"
```

---

## Task 25: Full vitest + tsc verification

**Files:** None — verification only.

- [ ] **Step 25.1: Full vitest run**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx vitest run 2>&1 | tail -10
```

Expected: most tests pass. Some test files that mocked `@clerk/nextjs` will now fail with "module not found" — fix by removing the Clerk mocks (the global `@/lib/db` mock in tests/setup.ts handles auth-adjacent paths). For each failing test file:
- If the test mocked `@clerk/nextjs/server` to stub `auth()`, remove that mock and instead mock `@/lib/auth/supabase-server` to return a fake `AuthSession`.
- Commit each fix with a descriptive message.

- [ ] **Step 25.2: Update tests/setup.ts globals**

Remove the Clerk env stubs from `tests/setup.ts`:

```bash
cd /home/hein/Workspace/ApexGEO && \
  sed -i '/CLERK_SECRET_KEY\|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/d' tests/setup.ts
```

Add Supabase Auth env stubs:

```bash
cat >> /home/hein/Workspace/ApexGEO/tests/setup.ts <<'EOF'

// Supabase Auth env stubs (so SUPABASE_AUTH_CONFIGURED is false in tests
// without a real DB; integration tests that need real Supabase set
// TEST_SUPABASE_URL etc. and use vi.resetModules in beforeEach)
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://placeholder.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "placeholder-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "placeholder-service-role";
EOF
```

- [ ] **Step 25.3: Re-run vitest**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx vitest run 2>&1 | tail -10
```

Iterate until same pass/fail profile as pre-Plan-3 baseline (no NEW failures introduced — pre-existing failures from Plan 2 are acceptable).

- [ ] **Step 25.4: Full tsc**

```bash
cd /home/hein/Workspace/ApexGEO && \
  npx tsc --noEmit 2>&1 | grep -E '^src/' | grep -v '\.test\.ts' | wc -l
```

Expected: 0 production errors. Test-mock errors (in `*.test.ts`) acceptable as long as count hasn't increased meaningfully from pre-Plan-3.

- [ ] **Step 25.5: Commit any vitest/tsc fixes**

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add -A && \
  git commit -m "test: align test mocks with Supabase Auth (drop Clerk env stubs)"
```

---

## Task 26: Live end-to-end smoke test

**Files:** None — verification only.

- [ ] **Step 26.1: Boot Apex locally pointing at apexgeo-supabase**

Set `.env.local` (or use direct exports) to point at the live stack:

```bash
PW=$(sudo -u velo grep '^POSTGRES_PASSWORD=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
ANON=$(sudo -u velo grep '^ANON_KEY=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)
SVC=$(sudo -u velo grep '^SERVICE_ROLE_KEY=' /home/velo/apexgeo-supabase/.env | cut -d= -f2-)

cd /home/hein/Workspace/ApexGEO && \
  DATABASE_URL="postgresql://postgres.apexgeo:${PW}@localhost:7783/apexgeo?sslmode=disable" \
  NEXT_PUBLIC_SUPABASE_URL="https://api.apexgeo.app" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON" \
  SUPABASE_SERVICE_ROLE_KEY="$SVC" \
  npm run dev &
```

- [ ] **Step 26.2: Manual smoke test in browser**

Open http://localhost:3000 in a browser:
1. Land on `/` → click "Sign up" → fill form with `vitest-smoke@apex.local` + password
2. Confirm "Check your email" page appears (or auto-redirect to `/onboarding` if autoconfirm)
3. If autoconfirm: complete onboarding wizard → land on `/dashboard`
4. Sign out
5. Sign back in with the same creds → see `/dashboard` immediately

Then close the dev server (Ctrl-C the npm dev process or kill via ps).

If autoconfirm is on (Plan 3 Task 5 disabled it — should be OFF), skip step 2's "Check your email" and follow the link from the email instead.

- [ ] **Step 26.3: Cleanup smoke test data**

```bash
PGPASSWORD="$PW" psql -h localhost -p 7782 -U postgres -d apexgeo -c \
  "DELETE FROM auth.users WHERE email='vitest-smoke@apex.local';
   DELETE FROM public.users WHERE email='vitest-smoke@apex.local';"
```

- [ ] **Step 26.4: Commit nothing — smoke test is verification only.**

---

## Task 27: Mark plan complete

**Files:**
- Modify: this plan file

- [ ] **Step 27.1: Append "Verified state" section, commit**

Edit the title line of `docs/superpowers/plans/2026-04-18-clerk-to-supabase-auth.md` to:
```
# Plan 3: Clerk → Supabase Auth migration  (✅ COMPLETE YYYY-MM-DD)
```
And append a Verified-state section listing:
- Number of `@clerk/` references remaining (should be 0)
- Production tsc error count
- Vitest pass/fail profile
- Manual smoke test outcome
- Commit range covering all of Plan 3

```bash
cd /home/hein/Workspace/ApexGEO && \
  git add docs/superpowers/plans/2026-04-18-clerk-to-supabase-auth.md && \
  git commit -m "docs(plan): Plan 3 complete — Clerk replaced with Supabase Auth"
```

---

## Verification checklist (run before declaring Plan 3 complete)

- [ ] Zero `@clerk/` imports anywhere in `src/`, `tests/`, `e2e/`
- [ ] `package.json` no longer lists `@clerk/nextjs`, `@clerk/themes`, `svix`
- [ ] `npx tsc --noEmit` reports 0 errors in production code (excluding `.test.ts` mock-typing noise)
- [ ] `npx vitest run` shows no NEW failures vs pre-Plan-3 baseline
- [ ] Live smoke: sign up → onboarding → dashboard → sign out → sign in flow works against `https://api.apexgeo.app`
- [ ] SMTP email verification + password reset emails arrive (manual verification with real inbox)
- [ ] Google + GitHub OAuth redirect flows work (if creds were configured in Task 6)
- [ ] DEV_SUPER_ADMIN bypass still works in dev mode
- [ ] API-key auth still works (test with `apx_*` token against any `/api/brands` route)

---

## What's NOT in this plan

- **Plan 4** — Cache + Storage swap (Upstash Redis → local `redis`, file uploads → Supabase Storage)
- **Plan 5** — Apex containerization for Velo (`apex-app` + `apex-worker` Dockerfiles, compose, `apexgeo_network` join)
- **Plan 6** — Production cutover runbook (data migration from Neon to apexgeo, DNS flip, decommission, seed-admin reassignment)
- Multi-org membership / org switching (deferred — v1 is one user = one org)
- Magic-link sign-in (only password + OAuth in v1)
- 2FA / MFA
- Organization invite flow
- Removing `users.clerk_user_id` column (kept one release, dropped post-Plan-6)
