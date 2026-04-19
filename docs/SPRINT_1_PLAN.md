# Sprint 1 — Foundation Fixes

**Sprint:** 1 (post-migration)
**Duration:** 2 weeks (10 working days)
**Starts:** T+0 after Sprint 0 exit gate signed off
**Team:** 2 FTE — Dev A (backend-lead), Dev B (full-stack)
**Source:** `docs/APEX_RFP.md` §9, `docs/APEX_RFP_TRACEABILITY.csv` filtered Sprint=S1 + Priority=P0

---

## 1. Goal

Close the **P0 launch blockers** that came out of the gap analysis. By end of sprint:

1. Every LLM call observable + cost-tracked (Langfuse + LiteLLM)
2. Grok fully wired (was the last missing LLM on the P0 list)
3. GA4 + GSC attribution data flowing into the platform
4. Brand voice v0.5 shipping usable drafts
5. Public REST API v1 + API key management live
6. Status page publicly visible
7. RLS policies verified with negative-test suite

**Non-goal:** Sprint 1 is *not* for new category-leading 🏆 features. Those are Sprint 3+. Any 🏆 work bleeding into Sprint 1 is scope creep — push back.

---

## 2. Pre-requisites (Sprint 0 must be green)

- [ ] Supabase self-hosted stack running on project server
- [ ] Neon data fully migrated + row-count parity confirmed
- [ ] Clerk users migrated to `auth.users` + mapping table live
- [ ] `@clerk/*` imports gone from `src/`
- [ ] RLS policies applied via `drizzle/0010_supabase_rls.sql`
- [ ] Backup + restore drill passed
- [ ] Sprint 0 retrospective held

If any of these are amber/red at Sprint 1 kickoff, **pause Sprint 1 and finish Sprint 0 first**. Building on a shaky migration loses faster than it ships.

---

## 3. Scope

### 3.1 In scope — 14 new-build items (4 Medium, 6 Small, 1 Large-scoped-to-v0.5)

| # | Req ID | Title | Effort | Owner |
|---|---|---|---|---|
| 1 | TR-ARC-001 | Langfuse self-host + wire all LLM calls | M | A |
| 2 | TR-ARC-002 | LiteLLM proxy for provider routing | M | A |
| 3 | NFR-OBS-001 | All LLM calls traced via Langfuse | M | A |
| 4 | FR-MON-005 | Grok xAI API wired | S | A |
| 5 | FR-API-001 | Public REST API v1 (read-only endpoints) | M | A |
| 6 | FR-API-002 | API key management | M | B |
| 7 | FR-API-003 | Rate limiting per key + tenant | S | A |
| 8 | FR-ATT-001 | GA4 OAuth + data pulls | M | A |
| 9 | FR-ATT-002 | GSC OAuth + query ingestion | M | A |
| 10 | FR-PRV-002 | GSC query-level ingestion per client | M | A (overlaps with 9) |
| 11 | FR-CRE-002 v0.5 | Brand voice — style-descriptor injection (not full training) | M-scoped | B |
| 12 | NFR-AVL-006 | Public status page | S | B |
| 13 | NFR-SEC-003 verify | RLS negative-test suite | M | A |
| 14 | NFR-SEC-010 | Security headers CSP + X-Frame + Referrer-Policy | S | B |

### 3.2 Also closed — 10 "Partial" items tightened to Shipping

| # | Req ID | Title |
|---|---|---|
| 15 | NFR-SEC-011 | Snyk / Dependabot + CI gate for high/critical CVEs |
| 16 | NFR-SEC-014 | Secrets management — Doppler or env.local-only + CI gate |
| 17 | NFR-SEC-015 | Rate limiting per-tenant per-endpoint |
| 18 | NFR-PER-003 | API p95 response <200ms (measure + optimize hot paths) |
| 19 | NFR-OBS-003 | Structured JSON logs → Grafana Loki |
| 20 | NFR-OBS-006 | PagerDuty/Opsgenie wired for error rate + p95 + queue depth |
| 21 | DR-003 | Scores 2yr retention + cold-storage policy |
| 22 | DR-004 | LLM responses archived raw + embedded |
| 23 | DR-006 | Backup + PITR + restore test documented (builds on Sprint 0 drill) |
| 24 | FR-API-001 (partial → Shipping) | OpenAPI spec + /v1/brands + /v1/scores + /v1/recommendations read endpoints |

### 3.3 Explicitly OUT of Sprint 1

- ❌ Brand voice training with embeddings or fine-tune (Sprint 2–3)
- ❌ Public API write endpoints (Sprint 2)
- ❌ Webhooks (Sprint 2)
- ❌ Sentiment analysis (Sprint 2)
- ❌ Alerts delivery (Sprint 2)
- ❌ Any Rolls Royce 🏆 feature (Sprint 3+)
- ❌ Cmd+K palette (Sprint 2)
- ❌ Customer-facing SSO beyond what Supabase Auth gives us out of the box (Sprint 4)

---

## 4. Ticket backlog — full specs

Each ticket below maps 1:1 to a Linear/Jira issue. Title, AC, deps, files.

### TICKET-01 — TR-ARC-001 Langfuse self-host

**Title:** Deploy self-hosted Langfuse and wire every LLM call through it
**Owner:** Dev A
**Effort:** 1.5 days

**Description:** Stand up Langfuse alongside Supabase on the project server. Add a typed Langfuse wrapper in `src/lib/llm/observability.ts` that every LLM call routes through. Backfill tracing into existing scraper classes.

**Acceptance criteria:**
- [ ] `langfuse` container running in docker-compose, reachable via `https://langfuse.apex.dev` (or internal)
- [ ] Self-hosted Postgres dedicated for Langfuse (separate from app DB)
- [ ] Every call in `src/lib/scraping/*-scraper.ts`, `src/lib/ai/content-generator.ts`, and `src/lib/monitoring/integrations/*` emits a Langfuse trace with: provider, model, prompt, completion, token usage, cost, latency, tenant_id, prompt_id (if any)
- [ ] 100% trace coverage verified: count(trace) = count(LLM API calls) over a 1hr window
- [ ] Langfuse dashboard shows ≥1 trace per provider

**Files touched:**
- `docker-compose.supabase.yml` (extend)
- `src/lib/llm/observability.ts` (new)
- `src/lib/scraping/*-scraper.ts` (wrap)
- `src/lib/ai/content-generator.ts` (wrap)
- `.env.example` (add LANGFUSE_* vars)

**Dependencies:** Sprint 0 Supabase stack running.

---

### TICKET-02 — TR-ARC-002 LiteLLM proxy

**Title:** Deploy LiteLLM proxy as unified LLM gateway
**Owner:** Dev A
**Effort:** 1 day

**Description:** LiteLLM acts as a single internal endpoint for all LLM providers. Gives us per-tenant budgets, fallback routing, unified error handling. Runs as sidecar container.

**Acceptance criteria:**
- [ ] LiteLLM container running, reachable internally at `http://litellm:4000/v1/`
- [ ] Config file at `infra/litellm/config.yaml` routes to Anthropic, OpenAI, Google, Perplexity, xAI, DeepSeek
- [ ] All app code calls LLMs via `http://litellm:4000/v1/chat/completions` (OpenAI-compat format) — not provider SDKs directly
- [ ] Per-tenant budget caps configurable (default: $50/mo/tenant)
- [ ] LiteLLM logs flow into Langfuse via webhook
- [ ] Fallback tested: primary provider 429 → fallback provider succeeds

**Files touched:**
- `docker-compose.supabase.yml` (extend)
- `infra/litellm/config.yaml` (new)
- `src/lib/llm/client.ts` (new — unified OpenAI-compat client)
- `src/lib/scraping/*-scraper.ts` (swap direct SDK calls for unified client)

**Dependencies:** TICKET-01 (Langfuse first, LiteLLM ships traces there).

---

### TICKET-03 — FR-MON-005 Grok xAI API

**Title:** Wire real xAI/Grok API credentials + production calls
**Owner:** Dev A
**Effort:** 0.5 day

**Description:** Scraper class exists; just needs API key wiring through LiteLLM proxy and a real-call integration test.

**Acceptance criteria:**
- [ ] `XAI_API_KEY` added to `.env.example` with sign-up URL comment
- [ ] LiteLLM config includes `grok-4-fast` model routing
- [ ] `src/lib/scraping/grok-scraper.ts` calls via LiteLLM proxy
- [ ] Integration test in `src/lib/scraping/__tests__/grok-scraper.test.ts` — 10 canned prompts return non-null
- [ ] Feature-list entry updated (after actual test)

**Files touched:**
- `.env.example`
- `infra/litellm/config.yaml`
- `src/lib/scraping/grok-scraper.ts`
- `src/lib/scraping/__tests__/grok-scraper.test.ts` (new)

**Dependencies:** TICKET-02 (LiteLLM).

---

### TICKET-04 — FR-API-001 Public REST API v1 (read-only)

**Title:** Ship `/api/v1/*` REST endpoints with OpenAPI 3.1 spec
**Owner:** Dev A
**Effort:** 2 days

**Description:** Externally-consumable, versioned REST API. Read-only in v1. Write endpoints deferred to Sprint 2. Uses same auth (Supabase JWT + API key). Documented via OpenAPI.

**Acceptance criteria:**
- [ ] OpenAPI 3.1 spec at `src/app/api/v1/openapi.json`
- [ ] Endpoints live and tested:
  - `GET /api/v1/brands` — list caller's tenant brands
  - `GET /api/v1/brands/:id` — single brand
  - `GET /api/v1/brands/:id/scores` — time series
  - `GET /api/v1/brands/:id/mentions?platform=&since=` — paginated
  - `GET /api/v1/brands/:id/recommendations?status=pending` — paginated
  - `GET /api/v1/audits/:id` — single audit result
  - `GET /api/v1/health` — liveness (no auth)
- [ ] Every endpoint respects RLS — validated by switching JWT org_id and getting different rows
- [ ] Error envelope standardized: `{ error: { code, message, docs_url } }`
- [ ] Response p95 < 200ms for non-aggregated endpoints (NFR-PER-003)
- [ ] Swagger UI served at `/api/docs`
- [ ] Postman collection exported to `docs/api/apex-v1.postman_collection.json`

**Files touched:**
- `src/app/api/v1/` (new route tree)
- `src/lib/api/openapi-builder.ts` (new)
- `src/lib/api/error.ts` (new)
- `src/lib/api/middleware/auth.ts` (update — JWT + API key)
- `src/app/api/docs/page.tsx` (new — Swagger UI)
- `docs/api/` (new)

**Dependencies:** TICKET-06 (API key auth).

---

### TICKET-05 — FR-API-002 API key management

**Title:** API key CRUD (create/list/revoke/rotate) + hashed storage
**Owner:** Dev B
**Effort:** 2 days

**Description:** Per-tenant API keys for public REST API. Keys shown once on creation, then only prefix shown. Hashed at rest. Rotation supported.

**Acceptance criteria:**
- [ ] DB table `api_keys` (already exists — verify schema): `id`, `tenant_id`, `name`, `key_prefix`, `key_hash`, `scopes[]`, `expires_at`, `last_used_at`, `created_at`, `revoked_at`
- [ ] Keys stored as bcrypt hash (never plaintext)
- [ ] UI at `/dashboard/settings/api` — create, list, revoke, rotate
- [ ] Create shows key once in a modal with copy-to-clipboard; after that, only `apex_live_abc123…` prefix visible
- [ ] API key auth middleware validates against hash; records `last_used_at`
- [ ] Revoked keys return 401
- [ ] Expired keys return 401
- [ ] RLS policy ensures tenants only see own keys
- [ ] E2E test: create key → use in curl → revoke → curl returns 401

**Files touched:**
- `src/lib/db/schema/api-keys.ts` (verify/update)
- `src/app/dashboard/settings/api/page.tsx` (new)
- `src/app/dashboard/settings/api/api-keys-client.tsx` (new)
- `src/app/api/settings/api-keys/route.ts` (new)
- `src/app/api/settings/api-keys/[id]/route.ts` (new)
- `src/lib/api/middleware/auth.ts` (update)
- `drizzle/00NN_api_keys.sql` (new if schema change)

**Dependencies:** Sprint 0 RLS policies applied.

---

### TICKET-06 — FR-API-003 Rate limiting

**Title:** Tiered rate limiting per API key + per tenant
**Owner:** Dev A
**Effort:** 0.5 day

**Description:** Upstash Redis sliding-window rate limiter. Tier quotas: Free 100/hr, Starter 1k/hr, Pro 10k/hr, Enterprise 100k/hr. Per-key + per-tenant aggregate caps.

**Acceptance criteria:**
- [ ] `@upstash/ratelimit` integrated
- [ ] Per-key quota from `api_keys.scopes` field (default: tenant tier)
- [ ] Per-tenant aggregate = sum of all keys' quotas
- [ ] 429 response with `Retry-After` and `X-RateLimit-*` headers
- [ ] Rate limit state stored in Upstash (not app memory — must survive deploys)
- [ ] Test: fire 150 requests at a 100/hr-limited key → 100 pass + 50 return 429 with correct headers

**Files touched:**
- `src/lib/api/middleware/ratelimit.ts` (new)
- `src/app/api/v1/**/route.ts` (apply middleware)
- `.env.example` (UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN already there — verify)

**Dependencies:** TICKET-04, TICKET-05.

---

### TICKET-07 — FR-ATT-001 GA4 integration

**Title:** Google Analytics 4 OAuth + data pulls per brand
**Owner:** Dev A
**Effort:** 2 days

**Description:** Client authorizes GA4 property per brand via Google OAuth. Nightly BullMQ job pulls sessions, conversions, revenue per landing page. Used for FR-ATT-004 attribution later.

**Acceptance criteria:**
- [ ] Google OAuth flow: Settings → Integrations → "Connect GA4" → authorize → select property
- [ ] Selected `propertyId` stored in `brand_integrations` table (encrypted at rest)
- [ ] Nightly job `ga4-sync` pulls last 7 days rolling: sessions, users, conversions, landing page URL
- [ ] Data lands in `ga4_daily_metrics` table, partitioned by brand_id
- [ ] Dashboard widget on brand page shows "Traffic from AI sources" (rows where medium=referral + source contains `chat.openai.com|perplexity.ai|claude.ai|gemini.google.com|copilot.microsoft.com`)
- [ ] Reconnect flow if refresh token invalid
- [ ] E2E: connect test GA4 property → trigger sync → verify row count > 0

**Files touched:**
- `src/lib/db/schema/integrations.ts` (add `ga4_daily_metrics`)
- `src/app/api/integrations/ga4/auth/route.ts` (new)
- `src/app/api/integrations/ga4/callback/route.ts` (new)
- `src/app/api/integrations/ga4/sync/route.ts` (new — triggered by job)
- `src/lib/queue/workers/ga4-sync.ts` (new)
- `src/lib/integrations/ga4-client.ts` (new — wraps google-analytics-data-api)
- `src/app/dashboard/brands/[id]/attribution.tsx` (new widget)

**Dependencies:** None.

---

### TICKET-08 — FR-ATT-002 + FR-PRV-002 GSC integration

**Title:** Search Console OAuth + per-client query ingestion
**Owner:** Dev A
**Effort:** 2 days

**Description:** Combines the attribution integration (FR-ATT-002) and prompt intelligence ingestion (FR-PRV-002) — same OAuth, same API, different consumers.

**Acceptance criteria:**
- [ ] Google OAuth flow: Settings → Integrations → "Connect Search Console" → authorize → select verified site
- [ ] Store `siteUrl` per brand in `brand_integrations`
- [ ] Nightly job `gsc-sync` pulls top 10,000 queries per site (impressions, clicks, CTR, position)
- [ ] Data lands in `gsc_query_metrics` (brand_id, query, date, impressions, clicks, ctr, position)
- [ ] Clustering job (deferred to Sprint 3) will consume this
- [ ] Dashboard widget: "Top queries from Google" with 30-day trend
- [ ] E2E: connect → sync → widget renders

**Files touched:**
- `src/lib/db/schema/integrations.ts` (add `gsc_query_metrics`)
- `src/app/api/integrations/gsc/auth/route.ts`
- `src/app/api/integrations/gsc/callback/route.ts`
- `src/lib/queue/workers/gsc-sync.ts`
- `src/lib/integrations/gsc-client.ts`
- `src/app/dashboard/brands/[id]/search-console.tsx` (new widget)

**Dependencies:** None (can share OAuth app with GA4 or separate).

---

### TICKET-09 — FR-CRE-002 v0.5 Brand voice (scoped)

**Title:** Brand voice v0.5 — style-descriptor injection from uploaded samples
**Owner:** Dev B
**Effort:** 2 days

**Description:** **This is NOT the full training system.** v0.5 = upload 1–5 writing samples → LLM extracts style descriptors (tone, avg sentence length, formality, vocabulary patterns, signature phrases) → inject those descriptors into generation prompts. No embeddings, no cosine-similarity eval, no fine-tune.

**Why v0.5:** full "training" with cosine ≥0.8 acceptance is 3–8 weeks. For Sprint 1 we ship the plumbing: user-uploaded samples, stored, descriptors extracted once, used in prompts. v1.0 (Sprint 2/3) adds embedding-based mimicry + eval.

**Acceptance criteria:**
- [ ] Table `brand_voice_samples` (brand_id, source_url_or_text, raw_text, descriptor_json, created_at)
- [ ] UI at `/dashboard/brands/[id]/voice`: upload via paste / URL / file (up to 5 samples × 10k words)
- [ ] On upload, run extraction prompt against Claude Sonnet 4.6 → JSON: `{ tone, formality, avgSentenceLength, vocabulary, signaturePhrases, avoid }`
- [ ] Content generator in `src/lib/ai/content-generator.ts` includes voice descriptors in system prompt when generating for that brand
- [ ] Side-by-side "without voice" vs "with voice" preview in UI for QA
- [ ] A human judge says "with voice" sounds closer to samples in a blind test (5 samples, 4/5 correct = passes)
- [ ] Descriptor JSON shown in UI + editable by user
- [ ] Flag `brand_voice_version: '0.5'` stored so Sprint 2 can migrate

**Files touched:**
- `src/lib/db/schema/brand-voice.ts` (new)
- `src/app/dashboard/brands/[id]/voice/page.tsx` (new)
- `src/app/dashboard/brands/[id]/voice/voice-client.tsx` (new)
- `src/app/api/brands/[id]/voice-samples/route.ts` (new)
- `src/lib/ai/brand-voice-extractor.ts` (new)
- `src/lib/ai/content-generator.ts` (update — inject descriptors)

**Dependencies:** TICKET-01 (Langfuse — want to trace extraction cost).

---

### TICKET-10 — NFR-AVL-006 Public status page

**Title:** `status.apex.dev` with live healthchecks and 90-day incident history
**Owner:** Dev B
**Effort:** 0.5 day

**Description:** Use Better Stack or self-host a simple status page. Not self-building this — it's a solved commodity. Point at our health endpoints. 90-day retention.

**Acceptance criteria:**
- [ ] `status.apex.dev` publicly reachable (no auth)
- [ ] Monitored services: app, API, LiteLLM, Langfuse, Supabase, Upstash, GA4 sync, GSC sync, audit queue
- [ ] 90-day rolling uptime % visible
- [ ] Incident log (auto-generated from probe failures)
- [ ] Scheduled-maintenance announcements supported
- [ ] Subscribe-for-email-updates form works
- [ ] Linked from app footer + help center + `/trust` (later)

**Files touched:**
- `infra/status-page/README.md` (new — setup notes)
- `src/components/layout/footer.tsx` (add link)

**Dependencies:** Pick Better Stack vs self-host (docker/upptime/openstatus) in Day 1 kickoff.

---

### TICKET-11 — NFR-SEC-003 RLS negative-test suite

**Title:** Automated RLS cross-tenant isolation tests
**Owner:** Dev A
**Effort:** 1 day

**Description:** Policies were applied in Sprint 0. Sprint 1 proves they hold. Vitest suite with seeded multi-tenant fixtures that tries to leak across orgs — every probe must return 0 rows.

**Acceptance criteria:**
- [ ] Test fixture seeds 3 tenants × 3 brands × 20 mentions each
- [ ] For each RLS-protected table, test: set JWT for org-A, SELECT should return only org-A rows
- [ ] Anonymous / no-JWT access returns 0 rows (not error — policy filters)
- [ ] Service-role bypass test confirms admin workers still see all rows
- [ ] Test runs in CI on every PR to main
- [ ] Expected tables covered: `brands`, `mentions`, `audits`, `recommendations`, `content`, `geo_scores`, `prompts`, `brand_voice_samples`, `ga4_daily_metrics`, `gsc_query_metrics`, `api_keys`, `alerts`, `integrations` (add new tables as we ship them)

**Files touched:**
- `src/lib/db/__tests__/rls-isolation.test.ts` (new)
- `src/lib/db/__tests__/fixtures/multi-tenant.ts` (new)
- `.github/workflows/ci.yml` (ensure rls tests run)

**Dependencies:** Sprint 0 RLS migration applied.

---

### TICKET-12 — NFR-SEC-010 Security headers

**Title:** CSP + X-Frame-Options + Referrer-Policy + HSTS to A rating
**Owner:** Dev B
**Effort:** 0.5 day

**Description:** Ship production-grade security headers via Next.js middleware. Target A rating on securityheaders.com.

**Acceptance criteria:**
- [ ] `middleware.ts` (or `next.config.mjs` headers) sets:
  - `Content-Security-Policy` — strict-dynamic with nonces
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `Permissions-Policy` — lock down camera/mic/geolocation
- [ ] CSP nonces threaded through to inline scripts (Next.js pattern)
- [ ] Dev environment has relaxed CSP (allow localhost, HMR)
- [ ] securityheaders.com reports **A** (not A+ — A+ requires specific CSP directives that break Clerk-style flows)

**Files touched:**
- `middleware.ts` (extend existing)
- `next.config.mjs`

**Dependencies:** None.

---

### TICKET-13 — NFR-SEC-011/014/015 + NFR-OBS-003/006 (grouped)

**Title:** Ops hardening — Dependabot, secrets, structured logs, alerting
**Owner:** Dev A
**Effort:** 1 day (bundled)

Five small items that share infrastructure:

**13a — Dependabot + Snyk CI gate (NFR-SEC-011, 0.25 day)**
- [ ] `.github/dependabot.yml` — daily schedule, grouped
- [ ] GitHub Action: Snyk scan on every PR; fail on high/critical CVE

**13b — Secrets management (NFR-SEC-014, 0.25 day)**
- [ ] `.gitignore` covers `.env.local`, `.env.production`
- [ ] Gitleaks CI action
- [ ] Doppler sync doc in `docs/infra/secrets.md`

**13c — Per-tenant rate limiting (NFR-SEC-015, built into TICKET-06 — verify coverage)**

**13d — Structured JSON logs (NFR-OBS-003, 0.25 day)**
- [ ] `src/lib/logger.ts` — pino-based, JSON output in prod
- [ ] Remove all `console.log` from `src/` (grep-verify)
- [ ] Logs ship to Grafana Loki or equivalent (config in `infra/observability/`)

**13e — Alerting (NFR-OBS-006, 0.25 day)**
- [ ] PagerDuty (or Opsgenie) integration in Sentry + Grafana
- [ ] On-call rotation doc in `docs/ops/on-call.md`
- [ ] Alert thresholds: error rate >1% for 5min, p95 >1s for 5min, queue depth >1000

**Files touched:**
- `.github/dependabot.yml`, `.github/workflows/snyk.yml`, `.github/workflows/gitleaks.yml`
- `src/lib/logger.ts`
- `infra/observability/loki.yml`
- `docs/infra/secrets.md`, `docs/ops/on-call.md`

---

### Verification-only tickets (batch)

These are already Shipping per the codebase but need Sprint 1 sign-off:

| Ticket | Title | Effort |
|---|---|---|
| TICKET-V01 | FR-MON-001/002/003/004/006/013/027/032 verify live with Langfuse traces | 0.5d |
| TICKET-V02 | FR-CRE-001/006 verify via E2E draft generation | 0.25d |
| TICKET-V03 | FR-AUD-001/007/010/020 verify still green post-Supabase migration | 0.25d |
| TICKET-V04 | FR-REC-001/002/003/004 verify end-to-end audit → recommendation flow | 0.25d |
| TICKET-V05 | FR-AGY-001 verify white-label theming survives Supabase migration | 0.25d |
| TICKET-V06 | NFR-SEC-001/002/004/008 verify TLS, MFA, Supabase Auth scoping | 0.25d |

Assigned to whichever dev has bandwidth Day 9–10.

---

## 5. Day-by-day plan

### Week 1

| Day | Dev A (Backend-lead) | Dev B (Full-stack) |
|---|---|---|
| **Mon** | TICKET-01 Langfuse deploy | TICKET-10 Status page setup |
| **Tue** | TICKET-01 wire traces + TICKET-02 LiteLLM | TICKET-05 API key schema + API routes |
| **Wed** | TICKET-02 finish + TICKET-03 Grok | TICKET-05 API key UI |
| **Thu** | TICKET-04 REST API scaffolding + OpenAPI | TICKET-12 Security headers |
| **Fri** | TICKET-04 endpoints + TICKET-06 rate limiting | TICKET-04 Swagger UI + Postman + Week 1 demo |

**Week 1 demo (Fri 15:00):** Langfuse showing traces, LiteLLM routing, Grok hitting live API, Swagger UI up with 3 working endpoints, API keys UI.

### Week 2

| Day | Dev A | Dev B |
|---|---|---|
| **Mon** | TICKET-07 GA4 OAuth + sync job | TICKET-09 Brand voice v0.5 schema + upload UI |
| **Tue** | TICKET-07 GA4 data pulls + widget | TICKET-09 LLM descriptor extraction |
| **Wed** | TICKET-08 GSC OAuth + sync | TICKET-09 Prompt injection + side-by-side preview |
| **Thu** | TICKET-11 RLS negative-tests | TICKET-09 blind A/B test validation + polish |
| **Fri** | TICKET-13 Ops hardening bundle | Verification tickets V01–V06 + sprint demo + retro |

**Sprint demo (Fri 15:00):** Walkthrough of every P0 with Linear/Jira status. GA4 + GSC connected to a test brand showing traffic numbers. Brand voice generating two drafts side by side. RLS test suite green in CI. Status page public.

---

## 6. Definition of Done (applies to every ticket)

- [ ] All acceptance criteria ticked
- [ ] Unit tests written and passing
- [ ] Integration test written if touching a boundary
- [ ] E2E test written if touching user-facing UI
- [ ] TypeScript strict — `npx tsc --noEmit` clean
- [ ] Biome/ESLint + Prettier clean
- [ ] No `console.log` in `src/` (use `src/lib/logger.ts`)
- [ ] Langfuse traces for any new LLM call (verify in dashboard)
- [ ] RLS policy covers any new tenant-scoped table
- [ ] Docs updated — user-facing in `/docs/help/`, dev-facing in code JSDoc
- [ ] PR reviewed by the other dev
- [ ] Merged to `main`
- [ ] Deployed to staging
- [ ] Smoke-tested in staging by the other dev

---

## 7. Risks specific to Sprint 1

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sprint 0 slips → Sprint 1 delayed | Medium | High | Don't start Sprint 1 work until Sprint 0 exit gate signed |
| Langfuse self-host bugs slow Week 1 | Medium | Medium | Have managed Langfuse as backup — they have a free tier; swap in 1hr if blocked |
| LiteLLM per-tenant budget feature quirks | Low | Medium | Start with basic routing; per-tenant budgets can slip to Sprint 2 if LiteLLM config gets hairy |
| Brand voice v0.5 output is bad quality | Medium | Medium | The blind A/B test is the gate — if it fails, scope down further to "tone descriptor only" and defer signature-phrase handling |
| GA4 Data API quota hit during development | Low | Low | Use test GA4 account, 25k requests/day = more than enough |
| GSC requires site-ownership verification that prod-client can't do | Medium | Medium | Document this as a prerequisite for client onboarding; for demo use an owned test domain |
| API key hashing performance (bcrypt every request) | Low | Medium | Cache validated hashes in Upstash with 60s TTL; accept the 60s-revocation-window trade-off |
| Status page vendor lock-in (Better Stack) | Low | Low | Openstatus (OSS) is our fallback — runs in docker-compose |

---

## 8. Out-of-band things the team needs

- [ ] xAI / Grok API account with billing enabled (Day 1) — request early
- [ ] Test GA4 property + test GSC site (Day 6) — set up Day 1 to avoid delays
- [ ] Google Cloud OAuth consent screen approved (Day 6) — **request Day 1**, Google approval takes 2–5 business days for sensitive scopes
- [ ] PagerDuty or Opsgenie account + on-call rotation (Day 10)
- [ ] Doppler or equivalent (Day 10)
- [ ] Snyk account (Day 10) — free tier sufficient
- [ ] Better Stack account (Day 1)

---

## 9. Sprint demo script (Friday week 2, 30 min)

1. (2 min) Sprint goal recap — "foundation fixes after Sprint 0 migration"
2. (3 min) **Langfuse**: show last 24h of LLM calls with tokens, cost, tenant breakdown
3. (2 min) **LiteLLM**: hit `http://litellm/v1/models` from the demo tab, show fallback routing test
4. (2 min) **Grok**: live query against xAI, show Langfuse trace
5. (5 min) **Public API**: walk through Swagger UI, make 3 calls with API key, show 429 on over-quota, show RLS isolation by swapping a token
6. (5 min) **GA4 + GSC**: connect a test brand, watch sync fire, show widget populate
7. (5 min) **Brand voice v0.5**: upload 3 samples, show descriptor extraction, generate draft with vs without voice, blind-vote with the audience
8. (2 min) **Status page**: open `status.apex.dev`, show incident history
9. (2 min) **RLS suite**: run CI, show all 14 tables' negative tests green
10. (2 min) Security headers A rating on securityheaders.com

---

## 10. Retrospective prompts (Friday week 2, 45 min)

- What went faster than estimated? Why?
- What went slower? Root cause?
- Where did we cut scope and was it the right call?
- Any tickets that should have been bigger / smaller?
- Anything Sprint 0 should have done differently?
- What's our first worry about Sprint 2 based on what we learned?
- Are the AC templates useful? Anything to tighten?
- How's Langfuse + LiteLLM in practice — keep, swap, or extend?
- Did 2 FTE feel right? Would 3 help Sprint 2 or just add coordination cost?

---

## 11. Sprint 1 exit gate (must be green to start Sprint 2)

- [ ] All 14 new-build tickets done per DoD
- [ ] All 10 Partial→Shipping tickets verified
- [ ] All 6 verification tickets signed off
- [ ] 95% of AC across all tickets checked
- [ ] Sprint demo done for stakeholders
- [ ] Retrospective held, action items in `docs/retrospectives/sprint-1-YYYY-MM-DD.md`
- [ ] Production traffic on Supabase + Langfuse + LiteLLM for ≥48h with error rate ≤ baseline
- [ ] APEX_RFP_TRACEABILITY.csv updated — Current_Apex_Status flipped where appropriate
