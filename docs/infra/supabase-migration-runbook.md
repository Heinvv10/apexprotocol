# Supabase Migration Runbook

**Sprint:** 0
**Duration:** 2 weeks
**Owner:** DevOps + Backend
**Status:** Draft — not yet executed
**Source RFP:** `docs/APEX_RFP.md` §9.0
**Traceability IDs:** `TR-ARC-000`, `TR-MIG-001` through `TR-MIG-006`

Moving Neon + Clerk SaaS → self-hosted Supabase stack on the project server. Zero-data-loss, minimum-disruption cutover.

---

## 0. Pre-flight

### 0.1 Server requirements

Target host: the project server (confirm IP/hostname before starting).

| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 4 vCPU | 8 vCPU |
| RAM | 8 GB | 16 GB |
| Disk (Postgres data) | 100 GB SSD | 500 GB NVMe |
| Disk (app + Docker) | 50 GB | 100 GB |
| Network | 100 Mbps | 1 Gbps |
| OS | Ubuntu 22.04 LTS / Debian 12 | Ubuntu 24.04 LTS |

Check with:
```bash
ssh project-server
lscpu | grep "^CPU(s):"
free -h
df -h
docker --version && docker compose version
```

### 0.2 Access & credentials to have ready

- [ ] Server root/sudo SSH access
- [ ] Neon project URL + production connection string (read-only + admin)
- [ ] Clerk dashboard API key (Backend API — for user export)
- [ ] Cloudflare R2 bucket + keys (offsite backup target)
- [ ] Domain DNS control (for `auth.apex.dev` and `db.apex.dev` — internal CNAMEs)
- [ ] Stripe customer list (if user IDs are cross-referenced)

### 0.3 Communication plan

- [ ] Notify all users 7 days before cutover — email + in-app banner
- [ ] Notify 24h before — force re-login warning
- [ ] Maintenance window: Saturday 02:00–05:00 SAST (lowest traffic)
- [ ] Status page in-progress entry pre-scheduled

### 0.4 Rollback plan (must exist before starting)

If any step fails at the cutover stage:
1. Re-point `DATABASE_URL` back to Neon
2. Re-enable Clerk middleware in `middleware.ts`
3. Restart app; users log back in via Clerk
4. Supabase stack continues running (idle) for post-mortem
5. Retain Neon subscription until Week 4 post-cutover as safety net

**Rollback window:** 30 min max. If not resolved in 30 min, roll back and regroup.

---

## 1. Provision self-hosted Supabase (Day 1–2)

### 1.1 Clone Supabase official docker-compose

```bash
ssh project-server
sudo mkdir -p /opt/supabase
cd /opt/supabase
sudo git clone --depth 1 https://github.com/supabase/supabase.git
cd supabase/docker
sudo cp .env.example .env
```

### 1.2 Configure `.env` — generate secrets

```bash
# Generate secrets (save these in your password manager)
openssl rand -base64 48  # → POSTGRES_PASSWORD
openssl rand -base64 48  # → JWT_SECRET (min 32 chars, we use 48)
openssl rand -base64 48  # → DASHBOARD_PASSWORD
```

Edit `/opt/supabase/supabase/docker/.env` and set:

```bash
POSTGRES_PASSWORD=<generated>
JWT_SECRET=<generated — 48 chars>
ANON_KEY=<generate via supabase.com/docs/guides/self-hosting#api-keys>
SERVICE_ROLE_KEY=<generate via same tool>
DASHBOARD_USERNAME=apex_admin
DASHBOARD_PASSWORD=<generated>

SITE_URL=https://app.apex.dev
API_EXTERNAL_URL=https://api.apex.dev
STUDIO_PORT=3001
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

# SMTP (for magic link + password reset emails)
SMTP_ADMIN_EMAIL=ops@apex.dev
SMTP_HOST=<your SMTP — Postmark, Resend, SES>
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-pass>
SMTP_SENDER_NAME=Apex

# Enable email + OAuth
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
ENABLE_ANONYMOUS_USERS=false

# OAuth providers (fill keys during 4.2)
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_AZURE_ENABLED=true
```

### 1.3 Launch the stack

```bash
cd /opt/supabase/supabase/docker
sudo docker compose pull
sudo docker compose up -d
```

Wait ~60s for containers to settle:

```bash
sudo docker compose ps
# Expect all services healthy: db, kong, auth (gotrue), rest (postgrest),
# realtime, storage, studio, analytics, vector, meta, functions
```

### 1.4 Verify health

```bash
# Postgres reachable
sudo docker exec -it supabase-db psql -U postgres -c "SELECT version();"

# Studio reachable locally (tunnel from workstation)
ssh -L 3001:localhost:3001 project-server
# Then visit http://localhost:3001 — log in with DASHBOARD_USERNAME/PASSWORD

# API (PostgREST) reachable via Kong gateway
curl -H "apikey: $ANON_KEY" http://localhost:8000/rest/v1/
```

### 1.5 Firewall + reverse proxy

```bash
# Only expose Kong gateway (443) to the internet; DB stays internal
sudo ufw allow 443/tcp
sudo ufw deny 5432/tcp   # Postgres internal-only
sudo ufw deny 3001/tcp   # Studio via SSH tunnel only

# Nginx reverse proxy config
sudo tee /etc/nginx/sites-available/supabase <<'EOF'
server {
    listen 443 ssl http2;
    server_name api.apex.dev;

    ssl_certificate     /etc/letsencrypt/live/apex.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apex.dev/privkey.pem;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 1.6 Acceptance

- [ ] All Supabase containers healthy per `docker compose ps`
- [ ] Studio UI accessible via SSH tunnel
- [ ] `api.apex.dev` returns Supabase API response over HTTPS
- [ ] Postgres NOT reachable from public internet (`nmap -p 5432 api.apex.dev` → filtered/closed)

---

## 2. Schema migration (Day 3)

Drizzle is staying; only the target host changes.

### 2.1 Apply existing Drizzle schema to Supabase Postgres

```bash
# In apex repo, add Supabase connection temporarily
cat >> .env.migration <<EOF
DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@project-server:5432/postgres
EOF

# From local workstation with access to server:
npx drizzle-kit push --env-file=.env.migration
```

**Note:** Supabase reserves schema `auth`, `storage`, `realtime`, `extensions`. Our app schema is `public`. Drizzle defaults to `public` — no conflict.

### 2.2 Drop Supabase's default `public.users` if our schema conflicts

Supabase doesn't create a public.users by default, but verify:

```sql
\dt public.*
-- If any collision exists, resolve before next step
```

### 2.3 Verify schema parity

```bash
# Dump schema from Neon
pg_dump --schema-only --no-owner --no-privileges \
  "$NEON_DATABASE_URL" > /tmp/neon-schema.sql

# Dump schema from Supabase
pg_dump --schema-only --no-owner --no-privileges \
  "$SUPABASE_DATABASE_URL" > /tmp/supabase-schema.sql

# Diff (excluding Supabase-specific auth/storage schemas)
diff <(grep -v "^--\|^SET\|^SELECT" /tmp/neon-schema.sql | grep -E "CREATE TABLE public\." | sort) \
     <(grep -v "^--\|^SET\|^SELECT" /tmp/supabase-schema.sql | grep -E "CREATE TABLE public\." | sort)
# Expect: empty diff
```

### 2.4 Acceptance

- [ ] Every Neon `public.*` table exists in Supabase with same column list
- [ ] All indexes reapplied
- [ ] All foreign keys reapplied
- [ ] Drizzle CI test suite runs green against Supabase connection

---

## 3. Data migration: Neon → Supabase (Day 4–5)

### 3.1 Snapshot + freeze Neon (staging dry-run first)

Run the entire migration against **staging** Supabase first before touching prod.

### 3.2 Full pg_dump from Neon

```bash
# On workstation with Neon + Supabase access
NEON_URL="postgresql://...neon.tech/apex"
SUPA_URL="postgresql://postgres:...@project-server:5432/postgres"

# Full dump — schema + data, compressed
pg_dump \
  --no-owner --no-privileges \
  --format=custom \
  --file=/tmp/neon-apex-$(date +%Y%m%d-%H%M).dump \
  "$NEON_URL"

ls -lh /tmp/neon-apex-*.dump
# Note the size — expect ~1-10GB depending on mention history
```

### 3.3 Restore to Supabase

```bash
# Restore, skipping roles (Supabase uses its own)
pg_restore \
  --no-owner --no-privileges \
  --clean --if-exists \
  --dbname="$SUPA_URL" \
  --schema=public \
  /tmp/neon-apex-*.dump

# Expect: "completed successfully" or ONLY benign errors about roles/ownership
```

### 3.4 Row-count parity check

```bash
# List all tables + counts from Neon
psql "$NEON_URL" -Atc "
  SELECT tablename, (xpath('/row/c/text()',
    query_to_xml('SELECT COUNT(*) FROM ' || quote_ident(schemaname) || '.' || quote_ident(tablename), true, false, '')))[1]::text::int
  FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
" > /tmp/neon-counts.txt

# Same from Supabase
psql "$SUPA_URL" -Atc "<same query>" > /tmp/supabase-counts.txt

# Diff
diff /tmp/neon-counts.txt /tmp/supabase-counts.txt
# Expect: empty diff
```

### 3.5 Spot-check critical tables

```sql
-- In Supabase
SELECT COUNT(*) FROM organizations;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM brands;
SELECT COUNT(*) FROM audits;
SELECT COUNT(*) FROM recommendations;
SELECT MAX(created_at) FROM recommendations;  -- freshness
```

### 3.6 Acceptance (TR-MIG-001)

- [ ] Row counts identical across every table
- [ ] `MAX(created_at)` on a rolling table (e.g. audits) within 1 minute of Neon's
- [ ] Sample foreign-key references resolve correctly
- [ ] Integration test suite (`vitest run`) passes against Supabase

---

## 4. RLS policy migration (Day 6–7)

Existing RLS in `drizzle/0001_rls_setup.sql` uses the app-layer pattern:
```sql
USING (organization_id = current_setting('app.current_organization_id', true)::text)
```

Supabase lets us use `auth.jwt()` natively — cleaner, enforced by Postgres, no app-layer `SET` required.

### 4.1 New RLS policy template

```sql
-- Replace old policies with Supabase auth.jwt() pattern
DROP POLICY IF EXISTS users_org_isolation ON users;
CREATE POLICY users_org_isolation ON users
  FOR ALL
  USING (
    organization_id = (auth.jwt() ->> 'org_id')
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS brands_org_isolation ON brands;
CREATE POLICY brands_org_isolation ON brands
  FOR ALL
  USING (
    organization_id = (auth.jwt() ->> 'org_id')
    OR auth.role() = 'service_role'
  );

-- Repeat for: mentions, audits, recommendations, content, geo_scores,
-- platform_queries, prompts, alerts, integrations, api_keys, etc.
```

Generate the full policy set with a script:

```bash
# scripts/generate-rls-policies.ts — iterates every tenant-scoped table
bun run scripts/generate-rls-policies.ts > drizzle/0010_supabase_rls.sql
```

### 4.2 JWT claim wiring

Supabase GoTrue auto-populates `auth.jwt()`. For `org_id` to appear, we add a custom JWT hook:

```sql
-- Supabase Studio → Authentication → Hooks
-- Or directly:
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_org_id text;
BEGIN
  SELECT organization_id INTO user_org_id
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';
  IF user_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{org_id}', to_jsonb(user_org_id));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
```

Register the hook:
```bash
# Studio → Authentication → Hooks → "Custom Access Token"
# Set to: public.custom_access_token_hook
```

### 4.3 Negative-path test

```sql
-- As service_role (bypasses RLS)
SELECT organization_id FROM brands LIMIT 5;
-- Expect: rows returned

-- Set session to authenticated role with org_id claim
SET LOCAL request.jwt.claims TO '{"role":"authenticated","sub":"<user-uuid>","org_id":"org-alpha"}';
SELECT organization_id FROM brands LIMIT 100;
-- Expect: only org-alpha rows

SET LOCAL request.jwt.claims TO '{"role":"authenticated","sub":"<user-uuid>","org_id":"org-beta"}';
SELECT organization_id FROM brands LIMIT 100;
-- Expect: only org-beta rows, NEVER org-alpha
```

### 4.4 Acceptance (TR-MIG-004)

- [ ] Every tenant-scoped table has RLS `ENABLED`
- [ ] Every table has at least one policy
- [ ] Cross-tenant negative test fails with 0 rows (not error — policy just filters)
- [ ] `auth.role() = 'service_role'` bypass path works for admin scripts
- [ ] App-layer `current_setting('app.current_organization_id')` calls removed from Drizzle queries

---

## 5. Clerk → Supabase Auth migration (Day 8–10)

### 5.1 Export Clerk users + orgs

```typescript
// scripts/export-clerk-users.ts
import { clerkClient } from '@clerk/nextjs/server';
import { writeFileSync } from 'node:fs';

async function main() {
  const allUsers: any[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const batch = await clerkClient().users.getUserList({ limit, offset });
    if (batch.data.length === 0) break;
    allUsers.push(...batch.data);
    offset += limit;
    console.log(`Exported ${allUsers.length} users…`);
  }

  const allOrgs: any[] = [];
  offset = 0;
  while (true) {
    const batch = await clerkClient().organizations.getOrganizationList({ limit, offset });
    if (batch.data.length === 0) break;
    allOrgs.push(...batch.data);
    offset += limit;
  }

  const memberships: any[] = [];
  for (const org of allOrgs) {
    const ms = await clerkClient().organizations.getOrganizationMembershipList({
      organizationId: org.id,
      limit: 500,
    });
    memberships.push(...ms.data);
  }

  writeFileSync('/tmp/clerk-export.json', JSON.stringify({
    exportedAt: new Date().toISOString(),
    users: allUsers.map(u => ({
      clerk_user_id: u.id,
      email: u.emailAddresses[0]?.emailAddress,
      email_verified: u.emailAddresses[0]?.verification?.status === 'verified',
      first_name: u.firstName,
      last_name: u.lastName,
      image_url: u.imageUrl,
      created_at: new Date(u.createdAt).toISOString(),
      external_accounts: u.externalAccounts.map(ea => ({
        provider: ea.provider,
        external_id: ea.externalId,
      })),
    })),
    organizations: allOrgs.map(o => ({
      clerk_org_id: o.id,
      name: o.name,
      slug: o.slug,
      created_at: new Date(o.createdAt).toISOString(),
    })),
    memberships: memberships.map(m => ({
      clerk_user_id: m.publicUserData?.userId,
      clerk_org_id: m.organization.id,
      role: m.role,
    })),
  }, null, 2));

  console.log(`Exported ${allUsers.length} users, ${allOrgs.length} orgs, ${memberships.length} memberships`);
}

main().catch(console.error);
```

Run:
```bash
bun run scripts/export-clerk-users.ts
ls -lh /tmp/clerk-export.json
```

### 5.2 Import users into Supabase Auth

```typescript
// scripts/import-to-supabase-auth.ts
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { db } from '@/lib/db';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // admin access
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const data = JSON.parse(readFileSync('/tmp/clerk-export.json', 'utf8'));
  const mapping: Array<{ clerk_user_id: string; supabase_user_id: string; email: string }> = [];

  for (const user of data.users) {
    if (!user.email) {
      console.warn(`Skipping user without email: ${user.clerk_user_id}`);
      continue;
    }

    // Create user with email_confirmed so no re-verification needed
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: user.email_verified,
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.image_url,
        migrated_from_clerk: true,
        clerk_user_id: user.clerk_user_id,
      },
      app_metadata: {
        provider: user.external_accounts[0]?.provider ?? 'email',
        providers: user.external_accounts.map((ea: any) => ea.provider),
      },
    });

    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message);
      continue;
    }

    mapping.push({
      clerk_user_id: user.clerk_user_id,
      supabase_user_id: created.user!.id,
      email: user.email,
    });
    console.log(`✓ ${user.email} → ${created.user!.id}`);
  }

  // Write mapping table for 90-day retention
  await db.execute(`
    CREATE TABLE IF NOT EXISTS clerk_to_supabase_migration (
      clerk_user_id TEXT PRIMARY KEY,
      supabase_user_id UUID NOT NULL,
      email TEXT NOT NULL,
      migrated_at TIMESTAMPTZ DEFAULT NOW(),
      retain_until DATE DEFAULT (CURRENT_DATE + INTERVAL '90 days')
    );
  `);

  for (const m of mapping) {
    await db.execute(
      `INSERT INTO clerk_to_supabase_migration (clerk_user_id, supabase_user_id, email)
       VALUES ($1, $2, $3) ON CONFLICT (clerk_user_id) DO NOTHING`,
      [m.clerk_user_id, m.supabase_user_id, m.email]
    );
  }

  // Update users table: replace clerk_user_id → supabase auth.users.id
  for (const m of mapping) {
    await db.execute(
      `UPDATE users SET id = $1 WHERE clerk_user_id = $2`,
      [m.supabase_user_id, m.clerk_user_id]
    );
  }

  console.log(`\nMigrated ${mapping.length} users. Mapping retained in clerk_to_supabase_migration.`);
}

main().catch(console.error);
```

Run:
```bash
bun run scripts/import-to-supabase-auth.ts
```

### 5.3 Password handling

**Clerk stores bcrypt hashes, Supabase Auth uses bcrypt too — but the hash formats differ.** We cannot migrate password hashes directly.

**Decision:** force password reset on first login. The `email_confirm: true` flag skips verification; users get a "set new password" magic link on next login attempt.

```typescript
// Send magic-link to all migrated users post-migration
for (const m of mapping) {
  await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: m.email,
  });
  // GoTrue will email them a reset link automatically
}
```

**Alternative:** use Supabase `reauthenticate` flow — user logs in with email, gets OTP, sets new password.

### 5.4 OAuth users

Users who signed in with Google/Microsoft via Clerk will re-auth via Supabase's Google/Microsoft providers. Their `external_accounts[].external_id` matches the OAuth subject, so Supabase will link them on first sign-in by matching email.

### 5.5 Acceptance (TR-MIG-002)

- [ ] All non-empty-email users from Clerk exist in `auth.users`
- [ ] `clerk_to_supabase_migration` mapping table populated
- [ ] `public.users.id` updated to Supabase UUIDs (not Clerk IDs)
- [ ] Test user from each OAuth provider can log in via Supabase
- [ ] Test user with password receives reset email and can set new password
- [ ] Retention policy: mapping table drops automatically after 90 days

---

## 6. App code refactor: `@clerk/nextjs` → `@supabase/ssr` (Day 8–11, parallel to Day 5)

### 6.1 Install Supabase deps

```bash
bun add @supabase/supabase-js @supabase/ssr
bun remove @clerk/nextjs @clerk/themes
```

### 6.2 Replace middleware

```typescript
// middleware.ts (was Clerk-wrapped)
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect /dashboard/*, /api/* (except public)
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith('/dashboard') || path.startsWith('/api');
  const isPublic = path.startsWith('/api/public') || path.startsWith('/api/health');

  if (isProtected && !isPublic && !user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 6.3 Replace `auth()` / `currentUser()` server helpers

Search-and-replace pattern:

```typescript
// BEFORE (Clerk)
import { auth, currentUser } from '@clerk/nextjs/server';
const { userId, orgId } = auth();

// AFTER (Supabase)
import { createServerClient } from '@/lib/supabase/server';
const supabase = createServerClient();
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
const orgId = user?.app_metadata?.org_id ?? user?.user_metadata?.org_id;
```

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerClient() {
  const cookieStore = cookies();
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* RSC context — ignore */ }
        },
      },
    }
  );
}
```

### 6.4 Replace `<ClerkProvider>` + `<SignIn>` / `<SignUp>` components

- Replace `<ClerkProvider>` wrap with Supabase client context via `@supabase/ssr`
- Replace `<SignIn/>` and `<SignUp/>` with custom forms calling `supabase.auth.signInWithPassword()` / `signInWithOAuth()`
- Replace `<UserButton/>` with custom dropdown reading from `supabase.auth.getUser()`

See files flagged by:
```bash
grep -rln "ClerkProvider\|<SignIn\|<SignUp\|<UserButton\|<OrganizationSwitcher" src/
```

(37 occurrences across 10 files per recent scan — budget ~1.5 days for this.)

### 6.5 Update `.env.example`

```bash
# Remove
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# CLERK_SECRET_KEY
# NEXT_PUBLIC_CLERK_SIGN_IN_URL etc.

# Add
NEXT_PUBLIC_SUPABASE_URL=https://api.apex.dev
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase studio>
SUPABASE_SERVICE_ROLE_KEY=<from supabase studio — server-only>
DATABASE_URL=postgresql://postgres:<password>@project-server:5432/postgres
```

### 6.6 Update CI / deployment

- Remove Clerk env vars from GitHub Actions secrets / Vercel project
- Add Supabase env vars
- Re-run full E2E suite against staging

### 6.7 Acceptance (TR-MIG-003)

- [ ] Zero `@clerk/*` imports in `src/`
- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes
- [ ] Playwright E2E auth flows pass on staging Supabase
- [ ] Sign-in, sign-up, OAuth, password-reset, org switch all tested

---

## 7. Dual-write window + cutover (Day 12)

### 7.1 48-hour dual-write

Point **staging** apps at Supabase. Keep **prod** on Neon + Clerk.

Write to both from the admin script for critical tables (audits, recommendations) so we can prove parity under live load:

```typescript
// scripts/dual-write-monitor.ts — runs every 5 min for 48h
const neonRows = await neonDb.select().from(audits).orderBy(desc(audits.createdAt)).limit(100);
const supaRows = await supaDb.select().from(audits).orderBy(desc(audits.createdAt)).limit(100);
const diff = neonRows.filter(n => !supaRows.some(s => s.id === n.id));
if (diff.length > 0) alert(`DRIFT: ${diff.length} missing`);
```

### 7.2 Cutover window (Saturday 02:00 SAST)

```bash
# T-0: Put app in maintenance mode
vercel env add MAINTENANCE_MODE true production
vercel redeploy

# T+5: Final Neon snapshot
pg_dump --format=custom --file=/tmp/final-$(date +%s).dump "$NEON_URL"

# T+10: Replay any delta since last dump
pg_dump --format=custom --file=/tmp/delta-$(date +%s).dump \
  --where="created_at > now() - interval '2 hours'" \
  "$NEON_URL"
pg_restore --data-only --dbname="$SUPA_URL" /tmp/delta-*.dump

# T+20: Row-count re-verify
./scripts/verify-parity.sh

# T+25: Swap env vars — point prod at Supabase
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL "$SUPA_URL" production
vercel env add NEXT_PUBLIC_SUPABASE_URL "https://api.apex.dev" production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "..." production
vercel env add SUPABASE_SERVICE_ROLE_KEY "..." production
vercel env rm NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env rm CLERK_SECRET_KEY production

# T+30: Deploy
vercel --prod

# T+35: Smoke test
curl https://app.apex.dev/api/health
curl -H "Authorization: Bearer $TEST_JWT" https://app.apex.dev/api/brands

# T+40: Disable maintenance mode
vercel env rm MAINTENANCE_MODE production
vercel redeploy

# T+45: Watch Sentry for error spikes
```

### 7.3 Set Neon to read-only (safety net)

```sql
-- Connect to Neon
ALTER DATABASE apex SET default_transaction_read_only = on;
```

Keep Neon on the read-only standby for **7 days** as rollback safety net.

### 7.4 Force re-login for all users

```sql
-- In Supabase — revoke all refresh tokens for migrated users
UPDATE auth.refresh_tokens SET revoked = true WHERE user_id IN (
  SELECT supabase_user_id FROM clerk_to_supabase_migration
);
```

Users land on `/sign-in`, re-auth via email (receive magic-link) or OAuth.

### 7.5 Acceptance (TR-MIG-005)

- [ ] Prod traffic on Supabase
- [ ] Sentry error rate within 2× baseline during first hour, baseline by hour 4
- [ ] 99% of active users successfully re-authenticated within 72h
- [ ] Zero cross-tenant data leaks reported
- [ ] Neon read-only for 7 days

---

## 8. Backup + disaster recovery (Day 13–14)

### 8.1 Daily pg_dump to Cloudflare R2

```bash
# /opt/supabase/backup.sh
#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_FILE="/tmp/apex-db-${TIMESTAMP}.dump"
R2_BUCKET="apex-db-backups"

docker exec supabase-db pg_dump -U postgres \
  --format=custom --compress=9 postgres > "$BACKUP_FILE"

# Encrypt
gpg --batch --yes --encrypt --recipient backup@apex.dev \
  --output "${BACKUP_FILE}.gpg" "$BACKUP_FILE"

# Upload to R2
aws s3 cp "${BACKUP_FILE}.gpg" \
  "s3://${R2_BUCKET}/daily/${TIMESTAMP}.dump.gpg" \
  --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com

# Retain 30 daily + 12 weekly + 24 monthly
find /tmp/apex-db-*.dump* -mtime +7 -delete
```

Schedule:
```bash
sudo crontab -e
# Daily at 03:00 UTC
0 3 * * * /opt/supabase/backup.sh >> /var/log/apex-backup.log 2>&1
```

### 8.2 Weekly restore drill

```bash
# /opt/supabase/restore-drill.sh — runs weekly on Sunday
# 1. Spin up temp Postgres container
# 2. Pull latest R2 backup
# 3. Decrypt + restore
# 4. Run parity check against live
# 5. Tear down temp container
# 6. Alert if drill fails
```

### 8.3 WAL archiving for PITR (point-in-time recovery)

Add to Supabase Postgres config:

```bash
# /opt/supabase/supabase/docker/volumes/db/postgresql.conf
archive_mode = on
archive_command = 'aws s3 cp %p s3://apex-db-wal/%f --endpoint-url https://$R2.r2.cloudflarestorage.com'
wal_level = replica
```

Enables RPO ≤15 min (per NFR-AVL-002).

### 8.4 HA consideration (deferred per R-009)

Single-server Supabase is fine up to ~$50k MRR. At that trigger point, provision a second server + Patroni cluster. Document the plan now, execute later:

```
docs/infra/supabase-ha-plan.md  — create this stub with TODO
```

### 8.5 Acceptance (TR-MIG-006)

- [ ] Daily backup job running + alerting on failure
- [ ] Weekly restore drill passing
- [ ] WAL archived to R2 continuously
- [ ] Recovery Time Objective (RTO) ≤1 hour demonstrated in drill
- [ ] Recovery Point Objective (RPO) ≤15 min demonstrated

---

## 9. Decommission (Day 14)

### 9.1 Wait 7 days post-cutover

Monitor for any rollback trigger. If none:

### 9.2 Decommission Neon

- [ ] Confirm no production writes in 7 days (CloudWatch / Neon console logs)
- [ ] Download final pg_dump to cold storage (R2 archive tier)
- [ ] Cancel Neon subscription
- [ ] Remove `NEON_DATABASE_URL` from all env config

### 9.3 Decommission Clerk

- [ ] Confirm no sign-ins via Clerk in 7 days (Clerk dashboard)
- [ ] Export final user + activity log to R2 archive
- [ ] Revoke all Clerk API keys
- [ ] Cancel Clerk subscription
- [ ] Remove Clerk secrets from Vercel / GitHub Actions

### 9.4 Update documentation

- [ ] `CLAUDE.md` — update stack section
- [ ] `app_spec.txt` — update auth + database lines
- [ ] `docs/COMPETITIVE_FEATURE_GAP_ANALYSIS.md` — update technical architecture references
- [ ] `.env.example` — remove Clerk block, Supabase block already added

### 9.5 Retrospective

Run a 30-min post-mortem on Day 14:
- What went well?
- What surprised us?
- What would we do differently?
- Any follow-up tickets?

---

## 10. Success criteria (Sprint 0 exit gate)

All must be green before Sprint 1 starts:

- [ ] **TR-ARC-000** — Supabase stack running on production server
- [ ] **TR-MIG-001** — Neon data fully migrated with row-count parity
- [ ] **TR-MIG-002** — Clerk users migrated to `auth.users`; mapping table live
- [ ] **TR-MIG-003** — Zero `@clerk/*` imports; E2E suite green
- [ ] **TR-MIG-004** — RLS policies using `auth.jwt()` pattern; negative tests pass
- [ ] **TR-MIG-005** — Cutover complete; Neon read-only; Sentry baseline
- [ ] **TR-MIG-006** — Backup + restore + WAL archive proven
- [ ] **NFR-SEC-001** — Postgres data encrypted at rest (LUKS or pgcrypto on sensitive columns)
- [ ] **NFR-SEC-003** — RLS enforced on every tenant-scoped table
- [ ] **NFR-AVL-001** — 99.9% uptime SLA achievable (single-server sufficient; HA plan documented)
- [ ] **NFR-AVL-002** — RPO ≤15 min demonstrated via WAL drill
- [ ] **NFR-AVL-003** — RTO ≤1 hour demonstrated via restore drill

---

## Appendix A — Why self-host Supabase over bare Postgres?

1. **Built-in GoTrue Auth** — replaces Clerk at zero marginal cost
2. **Native RLS tooling** — Supabase Studio lets policies be written + tested with a GUI
3. **Realtime server** — WebSocket answer-diff stream (`FR-MON-034`) is free
4. **Storage S3-compatible** — replaces R2/S3 for file uploads (optional)
5. **PostgREST auto-API** — instant CRUD API for non-critical paths
6. **Edge Functions** — Deno runtime for small utility functions
7. **Dashboard in-UI** — faster ops than psql-only
8. **All-in-one docker-compose** — single `docker compose up` deploys everything
9. **Upgrade path to cloud** — if we ever outgrow the server, `supabase.com` hosted is the same API

## Appendix B — Known gotchas

1. **JWT clock skew** — if server time drifts, tokens fail validation. Keep ntp in sync.
2. **Anon key in frontend** — the `NEXT_PUBLIC_SUPABASE_ANON_KEY` IS meant to ship to clients. RLS is the security boundary. Never ship `SERVICE_ROLE_KEY`.
3. **Realtime authorization** — subscribers must present a valid JWT; RLS applies to replication events too.
4. **Postgres version** — Supabase ships PG 15. If we ever need PG 16+ features, custom Docker image required.
5. **Storage quota** — `supabase-storage` defaults to 50 GB. Bump if audit blobs grow.
6. **Kong gateway** — front-door reverse proxy is another moving part. Know how to restart it independently.
7. **Supabase cron (pg_cron)** — different API from BullMQ; we keep BullMQ for queue work, pg_cron only for internal housekeeping.

## Appendix C — Files touched in this migration

```
/opt/supabase/                                  # new on server
/etc/nginx/sites-available/supabase             # new
/opt/supabase/backup.sh                         # new
middleware.ts                                    # rewrite
src/lib/supabase/server.ts                       # new
src/lib/supabase/client.ts                       # new
src/lib/auth/clerk.ts                            # delete
src/lib/auth/api-key-auth.ts                     # update (remove Clerk fallback)
src/stores/auth.ts                               # rewrite
src/app/(auth)/sign-in/page.tsx                  # rewrite
src/app/(auth)/sign-up/page.tsx                  # rewrite
src/app/dashboard/settings/settings-client.tsx   # update
src/components/settings/settings-sections.tsx    # update
src/components/settings/settings-error-boundary.tsx # update
src/app/admin/users/page.tsx                     # update
src/app/api/health/route.ts                      # update
src/app/api/settings/*/route.ts                  # update
drizzle/0010_supabase_rls.sql                    # new (replaces 0001_rls_setup.sql)
.env.example                                     # update
scripts/export-clerk-users.ts                    # new
scripts/import-to-supabase-auth.ts               # new
scripts/generate-rls-policies.ts                 # new
scripts/verify-parity.sh                         # new
scripts/dual-write-monitor.ts                    # new (temporary — delete post-migration)
package.json                                      # remove @clerk/*, add @supabase/*
```

---

**End of runbook.**
