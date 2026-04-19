# On-Call Runbook

**Pager:** Sentry + Grafana → Opsgenie / PagerDuty
**Secondary channel:** `#ops-alerts` (Slack)
**Status page:** https://status.apex.dev

## Alert priorities

| Level | Trigger | SLA | Example |
|---|---|---|---|
| P1 | Prod down, auth broken, data leak suspected | Page immediately | 5xx rate >5%, cannot log in, RLS bypass detected |
| P2 | Feature broken, perf degraded, queue stuck | Respond within 30 min | BullMQ depth >1k, Langfuse down, p95 >1s for 15 min |
| P3 | Single-tenant anomaly, dashboards glitching | Respond within 4 hours (business hours) | One tenant's GA4 sync failing, minor UI regression |

## First response (any page)

1. **Acknowledge** the page within 5 minutes
2. **Confirm scope** — is it global, single-region, single-tenant?
3. **Post in `#ops-alerts`** with: symptom, scope, timestamp, Sentry/Grafana links
4. **Declare incident** if P1 — create status-page entry at https://status.apex.dev/incidents/new

## Common runbooks

### 5xx rate spike on `/api/*`

1. Check Sentry — group similar errors, find stack trace
2. Check Grafana `loki` panel: `{app="apex"} |= "ERROR"` for last 15 min
3. Common causes:
   - Supabase down → check `docker compose ps` on project server
   - LiteLLM 429 cascade → check `/health/liveliness`
   - DB connection pool exhausted → `SELECT count(*) FROM pg_stat_activity`
4. If LLM-related, fall back path should kick in — verify direct-SDK calls working

### BullMQ queue backed up

1. Check Upstash Redis dashboard for queue depth
2. `docker compose logs -f worker`
3. Scale workers if CPU-bound; add retries if upstream flaky
4. If queue is auth-locked, verify `SUPABASE_SERVICE_ROLE_KEY` is set in worker env

### Langfuse down → LLM calls still work but no traces

Langfuse is non-blocking by design. Calls succeed, we lose observability until it's back.

1. `docker compose restart langfuse-worker langfuse-web`
2. Check ClickHouse disk usage — it fills up first
3. Gate: if ClickHouse is corrupted, temporarily disable Langfuse by unsetting `LANGFUSE_HOST` in app env

### Rate-limit false positives

1. Confirm Upstash Redis is reachable: `curl -H "Authorization: Bearer $UPSTASH_TOKEN" $UPSTASH_URL/ping`
2. Classify the affected route: check `src/lib/api/api-rate-limiter.ts` `classifyRoute()`
3. Temp relief: bump the bucket's `perMinute` 2× via env override (document in change log)

### RLS suspected bypass

**Stop. This is P0.**

1. Rotate all `SUPABASE_SERVICE_ROLE_KEY` values
2. Scan `src/lib/db/__tests__/rls-isolation.test.ts` output — any failures?
3. Run ad-hoc: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'` — every tenant-scoped table must be `t`
4. Engage security advisor before resuming traffic

## Debugging without touching prod

1. `docker-compose -f docker-compose.supabase.yml` on project-server-staging
2. Replay from Sentry event: click "Create issue" → copy curl → hit staging
3. Langfuse "Playground" can replay exact LLM calls with same prompt + model

## Hand-off template (end of shift)

```
Shift: 2026-04-19 08:00–20:00 SAST
Pages: 2
  - P2 at 14:23 — Langfuse ClickHouse disk 92%, extended retention → resolved
  - P3 at 17:05 — Tenant `acme` GSC sync failing, OAuth expired → user reconnected
Open concerns:
  - Upstash latency trending up in EU region; watch overnight
  - pgaudit extension PR pending review
```
