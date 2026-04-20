# Enabling Bugsink Error Tracking (BL-55)

ApexGEO ships with Bugsink error tracking **dark** by default. Errors are
instrumented (`@sentry/nextjs`) but nothing is sent until `SENTRY_ENABLED=true`.

## Prerequisites

- Bugsink project created at `errors.isaflow.co.za` (project 3 in BL-55)
- DSN copied from that project's settings
- VPS has `.env.production` populated (see `env.production.template`)

## Enable on the VPS

1. SSH to the VPS and edit `/opt/apex/.env` (or your source `.env.production`):

   ```bash
   SENTRY_ENABLED=true
   SENTRY_DSN=https://<key>@errors.isaflow.co.za/3
   NEXT_PUBLIC_SENTRY_ENABLED=true
   NEXT_PUBLIC_SENTRY_DSN=https://<key>@errors.isaflow.co.za/3
   ```

   `NEXT_PUBLIC_*` values are inlined at **build time** into the browser bundle —
   rebuild required after any change.

2. Redeploy:

   ```bash
   bash deploy-to-vps.sh
   ```

   `deploy-to-vps.sh` automatically captures the current git SHA and passes it
   to the Docker build as `GIT_SHA` / `NEXT_PUBLIC_GIT_SHA` so Bugsink events
   are tagged with the release.

3. (Optional) Source-map upload: set `SENTRY_AUTH_TOKEN` in the deploy shell
   environment. The `withSentryConfig` wrapper uploads maps during `next build`
   only when that token is present, and `deploy-to-vps.sh` will finalize a
   Sentry release and record a `production` deploy.

## Smoke test

After the redeploy, trigger the smoke-test route:

```bash
curl "https://<apex-domain>/api/sentry-test?password=secret&token=abc"
```

Expected:

- HTTP 500 response from the route
- A new event in Bugsink project 3 with:
  - `release` = short git SHA
  - `request.query_string` containing `password=[REDACTED]` and `token=[REDACTED]`
  - `tenant`/`request_id` tags populated (see `src/lib/sentry/tags.ts`)
- Telegram alert in the ops channel via the Cloudflare Worker relay

Once you have a green smoke event, delete the route
(`src/app/api/sentry-test/route.ts`) in a follow-up PR.

## Disable

Set `SENTRY_ENABLED=false` (or remove the var) and redeploy. All
instrumentation becomes inert — no DSN probing, no network traffic.
