# Supabase Migration Design

**Date:** 2026-04-18
**Status:** Approved (brainstorm), pending implementation plan
**Author:** Hein van Vuuren + Claude
**Scope:** Move Apex GEO/AEO from VPS+Neon+Clerk+Upstash → Velo+Supabase (DB+Auth+Storage+Realtime) + local Redis

---

## 1. Goals

- Consolidate Apex hosting onto the Velo server (`100.96.203.105`) where the rest of the Velocity Fibre infrastructure already lives
- Replace Neon (Postgres) with self-hosted Supabase Postgres
- Replace Clerk (auth) with Supabase Auth
- Replace Upstash Redis with the local `redis` container already running on Velo
- Adopt Supabase Storage and Realtime as part of the same migration (option D — "full Supabase")
- Cancel Neon, Clerk, and Upstash subscriptions after a 30-day safety window

## 2. Non-goals

- Migrating existing Clerk users into Supabase Auth — **hard cutover**, no user export, everyone re-onboards
- Preserving any existing Clerk session, SSO config, or MFA setup
- Multi-region deployment (Velo is single-node)
- Migrating to Supabase Cloud — this is **self-hosted only**
- Adopting Supabase Edge Functions in this cutover (Apex stays Next.js API routes; Edge Functions are out of scope)
- Replacing Pinecone (vector search), PayFast (payments), the AI provider APIs (Anthropic, OpenAI, Gemini, Perplexity, DeepSeek), Google PageSpeed, social APIs (Twitter), or Bugsink — these stay exactly as they are; only their env vars carry over to the new deploy

## 3. Target topology

Apex and its dedicated Supabase stack co-locate on Velo, on a private Docker network. Only Apex web and the Supabase Kong gateway are publicly reachable, via the existing Cloudflare Tunnel.

```
                        Browser (anywhere on internet)
                                  │
                                  ▼
                    Cloudflare Tunnel (cloudflared on Velo)
                                  │
                ┌─────────────────┴────────────────────┐
                ▼                                      ▼
         apex.<domain>                          api.apex.<domain>
         (Apex Next.js, port 7777)              (apexgeo-supabase-kong:8000
                                                 → Auth/Storage/Realtime/REST)
                ▲                                      ▲
                │                                      │
                └────────── apexgeo_network (Docker bridge) ──────────┐
                                                                       │
        ┌────────────────────────────────────────────────────┐         │
        │  apex-app                            (host :7777)  │         │
        │  apex-worker            (no host port, BullMQ consumer)
        │  apexgeo-supabase-kong       (host :7780 / :7781)  │ ◄───────┘
        │  apexgeo-supabase-db         (host :7782, internal 5432)
        │  apexgeo-supabase-pooler     (host :7783 txn / :7784 session)
        │  apexgeo-supabase-studio     (host :7785)
        │  apexgeo-supabase-analytics  (host :7786)
        │  apexgeo-supabase-auth       (internal only, behind Kong)
        │  apexgeo-supabase-storage    (internal only, behind Kong)
        │  apexgeo-supabase-realtime   (internal only, behind Kong)
        │  apexgeo-supabase-meta       (internal only)
        │  apexgeo-supabase-edge-fn    (internal, unused initially)
        │  apexgeo-supabase-vector     (internal)
        │  apexgeo-supabase-imgproxy   (internal)
        │  redis (existing shared)               (internal :6379)
        └────────────────────────────────────────────────────┘
```

### Why a dedicated Supabase stack (not the existing shared one)

The existing `supabase-*` stack on Velo is single-database (Auth/Storage/Realtime each connect to one Postgres database via env vars). Sharing it across 8 projects would mean:
- All projects share one JWT secret (compromise = total breach)
- Coordinated upgrade cadence across all 8 projects
- One project's GoTrue crash takes down everyone's sign-in
- Per-project rate limits, email templates, storage quotas all impossible

ApexGEO gets its own stack. ~15 extra containers, ~2-3GB RAM. Worth it.

### Port allocation

All ApexGEO ports live in the empty `7777-7786` range (away from FibreFlow's `3xxx` and the existing Supabase stack's `5436/6543/8300`):

| Service | Internal | Host port | Reachability |
|---|---|---|---|
| `apex-app` | 3000 | **7777** | Internal + tunnel `apex.<domain>` |
| `apexgeo-supabase-kong` HTTP | 8000 | **7780** | Internal + tunnel `api.apex.<domain>` |
| `apexgeo-supabase-kong` HTTPS | 8443 | **7781** | Reserved |
| `apexgeo-supabase-db` direct | 5432 | **7782** | Internal + admin SSH only |
| `apexgeo-supabase-pooler` txn | 6543 | **7783** | Internal (Apex queries) |
| `apexgeo-supabase-pooler` session | 5432 | **7784** | Internal (migrations) |
| `apexgeo-supabase-studio` | 3000 | **7785** | Internal + tunnel behind Cloudflare Access |
| `apexgeo-supabase-analytics` | 4000 | **7786** | Internal |

## 4. Data migration

### 4.1 Decisions

- **Hard cutover for users** — no Clerk → Supabase Auth user export; everyone re-onboards
- **Preserve all non-user data** — brands, audits, mentions, recommendations, content, organizations all carry over
- **Reassign org ownership to one seed admin** — `hein@h10.co.za` becomes owner of every organization post-cutover

### 4.2 Sequence

1. **Stand up empty `apexgeo-supabase` stack** on Velo with fresh JWT secrets
2. **Apply Drizzle schema migrations 0000→0016** against the empty `apexgeo` database. Drizzle is the schema source of truth; we do not restore DDL from Neon.
3. **Data-only dump from Neon:**
   ```bash
   pg_dump --data-only --disable-triggers --schema=public \
     --format=custom --file=apex-data.dump $NEON_URL
   ```
4. **Restore data** into `apexgeo`:
   ```bash
   pg_restore --data-only --disable-triggers \
     --dbname=$APEXGEO_URL apex-data.dump
   ```
5. **Apply migration 0017** (`drizzle/0017_supabase_auth_swap.sql`):
   - Add `users.auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL`
   - Drop unique constraint on `users.clerk_user_id` (keep column for one release as historical data)
   - Add Postgres trigger on `auth.users` INSERT → INSERT corresponding `public.users` row
   - Existing RLS policies stay as-is (they read `current_setting('app.current_organization_id', true)`); the setting will be injected by the new pg-based connection helper instead of by the neon-http path
6. **Create seed admin** via Supabase Auth Admin API:
   ```
   POST https://api.apex.<domain>/auth/v1/admin/users
   { "email": "hein@h10.co.za", "password": "<strong>", "email_confirm": true }
   ```
   Capture the returned `id` (uuid) as `:seed_uuid`.
7. **Run `seed-admin.sql`** (idempotent):
   ```sql
   -- Insert seed admin row
   INSERT INTO users (id, auth_user_id, email, name, role, is_super_admin, organization_id)
   VALUES (gen_random_cuid(), :seed_uuid, 'hein@h10.co.za', 'Hein',
           'admin', true, NULL)
   ON CONFLICT (auth_user_id) DO NOTHING
   RETURNING id INTO :seed_user_id;

   -- Reassign every org to seed admin
   UPDATE organizations SET owner_id = :seed_user_id;

   -- Drop other user rows; their data lives on the org, not on them
   DELETE FROM users WHERE id != :seed_user_id;
   ```
8. **Verify** with row-count diff vs Neon:
   - Match required: `brands`, `audits`, `mentions`, `recommendations`, `content`, `organizations`
   - Drift expected: `users` (down to 1)
   - Any other table drifting → **abort cutover**

### 4.3 Why Drizzle migrations come first, not pg_dump's DDL

`pg_dump --data-only` writes only INSERT statements. We get the schema from Drizzle so:
- `__drizzle_migrations` table is in a clean, expected state for future `drizzle-kit migrate` runs
- No risk of pg_dump emitting DDL that conflicts with Supabase's existing `auth`, `storage`, `realtime` schemas
- Schema drift between Drizzle source and Neon's actual DDL gets surfaced now, not later

## 5. Code changes

### 5.1 Database driver swap

**Files:** `src/lib/db/index.ts`, `src/lib/db/rls.ts`

- Drop `@neondatabase/serverless`, drop `ws`, drop `neonConfig.webSocketConstructor` line
- Replace with `pg` (already a dep) `Pool` + `drizzle-orm/node-postgres`
- Single connection pool used by both default queries and RLS-scoped queries
- RLS context applied via `pool.connect()` + `BEGIN; SELECT set_config(...); ...query...; COMMIT;` instead of per-request neon-http connection
- Remove `@neondatabase/serverless` and `ws` from `package.json` after the swap is verified

### 5.2 Auth swap (Clerk → Supabase Auth)

**Surface area:** 148 Clerk references across 133 files (`src/middleware.ts`, sign-in/sign-up pages, `lib/auth/clerk.ts`, providers, header components, 100+ API routes, webhook).

**Add:**
- `@supabase/supabase-js` (browser)
- `@supabase/ssr` (Next.js server-side cookie session helpers)
- `src/lib/auth/supabase-server.ts` — `getSession()`, `requireSession()`, `getOrgContext()`
- `src/lib/auth/supabase-browser.ts` — `createBrowserClient()`
- `src/lib/auth/supabase-middleware.ts` — middleware helper for cookie refresh

**Delete:**
- `src/lib/auth/clerk.ts`
- `src/components/providers/clerk-provider.tsx`
- `src/components/providers/auth-sync.tsx`
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `src/app/api/webhooks/clerk/route.ts`
- `src/types/clerk.d.ts`

**Rewrite:**
- `src/middleware.ts` — Supabase cookie session refresh, route protection
- `src/app/sign-in/page.tsx` — hand-rolled form using existing Apex design system
- `src/app/sign-up/page.tsx` — hand-rolled form using existing Apex design system
- 133 files using `import { auth } from "@clerk/nextjs"` → `import { getSession } from "@/lib/auth/supabase-server"`. Codemod-able with one sed pass; manual review per route to handle the user id shape change (uuid vs `user_xxx`).

**User provisioning replacement:**
- Postgres trigger on `auth.users` AFTER INSERT → INSERT corresponding `public.users` row with `auth_user_id` set
- No `/api/webhooks/clerk` equivalent needed
- Trigger lives in migration 0017

### 5.3 Storage swap (local/whatever → Supabase Storage)

- New: `src/lib/storage/supabase-storage.ts` wrapping `@supabase/supabase-js` storage client
- Brand logos, audit PDFs, generated content media, user avatars all upload to bucket `apex-assets`
- ~6-8 routes affected; identifiable by current upload paths
- Bucket created once via `supabase-meta` API or Studio UI during stack init

### 5.4 Cache swap (Upstash REST → ioredis)

- Drop `@upstash/redis`
- Add `ioredis`
- ~12 files importing the upstash client; same call-site shape (`get`, `set`, `del`, `expire`)
- BullMQ jobs (already on ioredis under the hood) point at `redis://redis:6379`

### 5.5 Realtime (new capability — optional in cutover)

- Replace SSE in `src/app/api/monitor/stream/route.ts` with a Supabase Realtime channel subscribed in the browser
- Listens to `INSERT` on `mentions` filtered by `organization_id`
- Can defer to post-cutover; SSE keeps working in the meantime

## 6. Networking

### 6.1 Internal

- Docker network: `apexgeo_network` (bridge). All ApexGEO containers join.
- Apex → Supabase via service-name DNS:
  - Queries: `apexgeo-supabase-pooler:6543` (transaction pooler)
  - Migrations: `apexgeo-supabase-db:5432` (direct, session pooler also OK)
  - Auth/Storage/Realtime: `apexgeo-supabase-kong:8000` (server-side calls go through Kong, same as browser)

### 6.2 Public (via existing Velo `cloudflared`)

- `apex.<domain>` → `apex-app:3000` (Apex web)
- `api.apex.<domain>` → `apexgeo-supabase-kong:8000` (browser hits this for Auth/Storage/Realtime/REST)
- `studio.apex.<domain>` → `apexgeo-supabase-studio:3000` (behind Cloudflare Access for Hein only — optional)

### 6.3 Apex production env

```
DATABASE_URL=postgresql://postgres:<pw>@apexgeo-supabase-pooler:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:<pw>@apexgeo-supabase-db:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://api.apex.<domain>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-jwt>
SUPABASE_SERVICE_ROLE_KEY=<service-role-jwt>
SUPABASE_JWT_SECRET=<jwt-secret>
REDIS_URL=redis://redis:6379
```

`SUPABASE_SERVICE_ROLE_KEY` is **server-only** — never prefix `NEXT_PUBLIC_` or it leaks to the browser.

### 6.4 CORS

Kong's `cors` plugin must whitelist `https://apex.<domain>`. Without this, browser Auth/Realtime/Storage calls fail silently in production.

## 7. Cutover runbook

### T-7d → T-1d (preparation)

- Build & deploy `apexgeo-supabase` stack on Velo (empty)
- Build & deploy `apex-app:7777` pointed at it
- Pre-load Cloudflare Tunnel ingress entries (don't activate the apex DNS yet)
- Lower production DNS TTL on `apex.<domain>` to 60s, 24h before cutover
- Run full Playwright e2e suite against the staging URL (e.g. `apex-staging.<domain>`)
- Manual smoke: sign-up, onboard, run an audit, generate a recommendation, view mentions, upload a brand logo
- **Go/no-go decision based on staging signal, not optimism**

### T-2h

- Maintenance banner on production VPS (`72.61.197.178`)
- Notify any active users (probably nobody, but check)

### T-1h

- Final `pg_dump --data-only` from Neon (writes ≈ 0 since maintenance mode)
- `scp` dump to Velo
- `pg_restore` into `apexgeo-supabase-db`

### T-30m

- Run migration `0017_supabase_auth_swap.sql`
- Create seed admin via Supabase Auth Admin API
- Run `seed-admin.sql`
- Run row-count verification script
- **Abort if drift**

### T-15m

- Cloudflare DNS — `apex.<domain>` A/CNAME swung from VPS IP to Velo tunnel
- Verify with `dig +short apex.<domain> @1.1.1.1` from a clean resolver

### T-0

- Drop maintenance banner
- Monitor `apex-app` logs (Bugsink), uptime-kuma, Cloudflare analytics for 60 minutes

### T+1h (verification)

- Sign in as seed admin via `apex.<domain>/sign-in`
- Confirm dashboard loads, brand list populated
- Open one audit, confirm renders
- Trigger one recommendation generation, confirm it completes
- Fire one mention fetch, confirm new row appears
- **If anything fails: rollback (Section 8). Do not try to fix forward under pressure.**

### T+24h

- Cancel Upstash subscription
- Snapshot Neon DB (don't delete — keep snapshot for T+30d)
- Set Clerk app to read-only / dev mode

### T+7d

- Decommission VPS `72.61.197.178`
- Delete deploy artifacts in `/opt/apex` on the VPS

### T+30d

- Delete Neon DB
- Delete Clerk app
- Delete Neon snapshot

## 8. Rollback

Three layers, escalating in cost:

### 8.1 DNS flip back (≤5 min)

- Cloudflare DNS A record back to `72.61.197.178`
- TTL is 60s so propagation completes within ~2 min
- Old VPS still running through T+7d, still wired to Neon + Clerk
- Recovers any failure detected in the first hours

### 8.2 Re-restore from snapshot (≤30 min)

- Use case: Velo cutover otherwise looks salvageable but Apex data on Velo got corrupted
- Re-`pg_restore` from the T-1h dump into `apexgeo-supabase-db`
- Re-run migration 0017 + seed-admin SQL
- VPS path stays online during the redo

### 8.3 Walk away from the move (≤T+24h)

- Use case: discovered something fundamentally wrong post-cutover
- DNS back to VPS, Clerk reactivated, Upstash subscription resumed (it's not cancelled until T+24h for exactly this reason)
- Only the Velo side gets torn down

**Irreversibility timeline:**
- Nothing destructive before T+24h
- Nothing fully irreversible (Neon delete, Clerk delete) before T+30d

## 9. Open items for the implementation plan

These need answers during planning, not now:

- **Cloudflare Tunnel config** — does ApexGEO get its own tunnel, or share the existing one? Where does config live (`/home/velo/cloudflared/`)?
- **Supabase compose file source** — fork from Supabase's official self-hosting compose, or copy from the existing `/home/velo/<existing-supabase>/docker-compose.yml`?
- **Email provider for Auth** — Supabase Auth needs SMTP for confirmation/password-reset emails. Reuse FibreFlow's SMTP config, or wire a new transactional sender (Resend/Postmark)?
- **Backup strategy** — `pg_dump` cron on Velo dumping `apexgeo` to `/home/velo/backups/`? Off-site sync?
- **Apex container image registry** — push to Velo's local registry, or build on-host?
- **Seed admin password rotation** — initial password generated how, stored where (1Password / pass / env)?
- **Migration 0017 contents** — exact SQL needs writing, including the `auth.users` → `public.users` trigger function with proper SECURITY DEFINER scoping
- **Cross-schema FK on `auth.users`** — Drizzle doesn't natively model FKs into Supabase-managed schemas. The `users.auth_user_id` → `auth.users.id` reference may need to live in a hand-written `.sql` migration (not a TypeScript schema) to keep `drizzle-kit` happy; verify pattern during plan
- **Worker container** (`Dockerfile.worker`) — confirm BullMQ consumer config, env vars, restart policy, and that it joins the same `apexgeo_network` so it reaches both Postgres and Redis by service name
