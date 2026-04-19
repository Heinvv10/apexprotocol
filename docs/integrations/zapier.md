# Zapier Integration

Apex exposes a REST-Hook style integration that drops into Zapier, Make.com,
n8n, and any other service that speaks outbound webhooks. One integration,
5,000+ downstream apps.

## Triggers (events we fire)

| Event | When it fires | Payload |
|---|---|---|
| `score_changed` | Daily, whenever a brand's overall score moves | `brand_id`, `previous_score`, `current_score`, `delta`, `platform` |
| `new_recommendation` | A new recommendation is generated | `recommendation_id`, `title`, `priority`, `impact`, `effort` |
| `alert_fired` | An anomaly or rule-based alert triggers | `kind`, `severity`, `z_score`, `summary` |
| `mention_detected` | A new brand mention lands in a tracked platform response | `mention_id`, `platform`, `query`, `position`, `sentiment`, `citation_url` |
| `audit_completed` | A brand audit finishes | `audit_id`, `url`, `overall_score`, `issues` |

## Actions (Zapier calls us)

All actions are standard REST on `/api/v1/*` — use the Apex API key as a
Bearer token. No Zapier-specific actions required beyond the standard
subscribe/unsubscribe pair below.

## Subscribe

Zapier calls this when the user turns on a Zap.

```http
POST /api/v1/webhooks/subscribe
Authorization: Bearer apx_...
Content-Type: application/json

{
  "event": "score_changed",
  "target_url": "https://hooks.zapier.com/hooks/catch/123/abc",
  "brand_id": null,
  "zapier_bundle_id": "bundle_xyz"
}
```

Response:

```json
{
  "data": {
    "id": "sub_...",
    "event": "score_changed",
    "target_url": "https://...",
    "brand_id": null,
    "created_at": "2026-04-19T09:00:00Z"
  }
}
```

## Unsubscribe

```http
DELETE /api/v1/webhooks/subscribe
Authorization: Bearer apx_...
Content-Type: application/json

{ "id": "sub_..." }
```

Returns 204.

## Sample payloads (for Zapier preview)

```http
GET /api/v1/webhooks/events
Authorization: Bearer apx_...
```

Returns 5 synthetic examples — one per event type. Zapier uses these to
render its field-picker UI without needing a live event.

## Signature verification

Every outbound webhook carries:

- `X-Apex-Event: <event_name>`
- `X-Apex-Delivery: <uuid>` — idempotency key
- `X-Apex-Signature: sha256=<hex>` — HMAC-SHA256 of the raw request body,
  keyed by `WEBHOOK_SIGNING_SECRET`. Verify in your Zap filter step or your
  own receiver.

Node verification example:

```ts
import crypto from "node:crypto";

const raw = await request.text();
const expected = "sha256=" +
  crypto.createHmac("sha256", process.env.WEBHOOK_SIGNING_SECRET)
        .update(raw)
        .digest("hex");
const received = request.headers.get("X-Apex-Signature");
if (expected !== received) throw new Error("bad signature");
```

## Delivery semantics

- At-least-once. Idempotency via `X-Apex-Delivery` — store recent IDs on
  your side for ~1h to dedupe.
- 10-second timeout per delivery.
- Up to 16 concurrent deliveries per event.
- Failures increment a per-subscription counter and stash the error; no
  retries in v1 (Zapier's "Retry" step covers most cases).
