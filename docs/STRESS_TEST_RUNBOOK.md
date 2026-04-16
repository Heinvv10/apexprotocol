# Apex stress-test runbook

**⚠️ COST WARNING**: `/api/monitor/run` calls Anthropic/OpenAI/Perplexity on every request. A naive stress test can burn hundreds of dollars in minutes. Always:

1. Set a hard spend cap on your AI provider dashboards BEFORE running.
2. Point tests at **dev with mocked AI keys** where possible.
3. Cap total request volume with `--duration` + `--vus` (never unbounded).
4. Monitor `/api/admin/dashboard/ai-costs` live while the test runs.

Never run this against production.

---

## Install

```bash
# k6 — the actual load generator
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
     --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update && sudo apt install k6

# Or Homebrew
brew install k6
```

---

## Scenario 1: Dashboard read fan-out

Safe — no AI calls. Simulates 50 users all loading `/dashboard/monitor` simultaneously, each fanning out to ~8 read endpoints.

Save as `stress/dashboard-fanout.js`:

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    dashboard_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "2m", target: 50 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],   // 95% under 2s
    http_req_failed: ["rate<0.05"],      // <5% errors
  },
};

const BASE = __ENV.APEX_URL || "http://localhost:3010";
const COOKIE = __ENV.APEX_COOKIE;

export default function () {
  const headers = { Cookie: COOKIE };
  const reqs = [
    ["GET", `${BASE}/api/monitor/mentions`],
    ["GET", `${BASE}/api/monitor/platforms`],
    ["GET", `${BASE}/api/monitor/citations`],
    ["GET", `${BASE}/api/brands`],
    ["GET", `${BASE}/api/notifications/unread-count`],
    ["GET", `${BASE}/api/analytics/geo-score`],
    ["GET", `${BASE}/api/usage/summary`],
    ["GET", `${BASE}/api/insights`],
  ];

  const responses = http.batch(reqs.map(([method, url]) => ({ method, url, params: { headers } })));

  responses.forEach((r, i) => {
    check(r, {
      [`${reqs[i][1]} 2xx/429`]: (res) => res.status < 300 || res.status === 429,
    });
  });

  sleep(1);
}
```

Run:

```bash
APEX_URL="http://localhost:3010" \
APEX_COOKIE="__session=..." \
k6 run stress/dashboard-fanout.js
```

**What to look for**:
- p95 < 2s → DB indexes are doing their job
- p95 > 5s → check slow queries, likely missing index
- `http_req_failed` > 5% → something's actually broken
- 429s are FINE here (rate limiter working); just confirm ratio is reasonable

---

## Scenario 2: AI endpoint cost ceiling

⚠️ **Uses real AI credits.** Run ONLY with spend cap set.

Save as `stress/monitor-run-cost.js`:

```javascript
import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 1,
  iterations: 20,    // HARD CAP — 20 total requests, no more
  thresholds: {
    http_req_duration: ["p(95)<30000"],   // AI calls can legitimately take 20s+
  },
};

const BASE = __ENV.APEX_URL || "http://localhost:3010";
const COOKIE = __ENV.APEX_COOKIE;
const BRAND_ID = __ENV.BRAND_ID;

if (!BRAND_ID) {
  throw new Error("Set BRAND_ID env var to a test brand you own");
}

export default function () {
  const res = http.post(
    `${BASE}/api/monitor/run`,
    JSON.stringify({ brandId: BRAND_ID }),
    {
      headers: {
        "Content-Type": "application/json",
        Cookie: COOKIE,
      },
      timeout: "60s",
    }
  );

  check(res, {
    "2xx or 429": (r) => r.status < 300 || r.status === 429,
  });
}
```

Run:

```bash
APEX_URL="http://localhost:3010" \
APEX_COOKIE="__session=..." \
BRAND_ID="your-test-brand-id" \
k6 run stress/monitor-run-cost.js
```

**What to measure**:
- Cost per request (check AI provider dashboard AFTER)
- Rate limit kicks in at request ~11 (expensive bucket = 10/min)
- Average response time — if >30s, there's a timeout/retry issue
- Total spend ÷ 20 = per-request cost → multiply by expected daily usage for a budget forecast

---

## Scenario 3: Concurrent writes — race conditions

Safe, no AI calls. Tests DB concurrency on a write-heavy route.

Save as `stress/mention-bulk-update.js`:

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 20,
  duration: "1m",
};

const BASE = __ENV.APEX_URL || "http://localhost:3010";
const COOKIE = __ENV.APEX_COOKIE;
const MENTION_IDS = (__ENV.MENTION_IDS || "").split(",").filter(Boolean);

if (MENTION_IDS.length < 10) {
  throw new Error("Set MENTION_IDS env var to 10+ comma-separated mention IDs");
}

export default function () {
  const picks = MENTION_IDS.sort(() => Math.random() - 0.5).slice(0, 5);
  const res = http.patch(
    `${BASE}/api/monitor/mentions/bulk`,
    JSON.stringify({ ids: picks, status: "reviewed" }),
    {
      headers: { "Content-Type": "application/json", Cookie: COOKIE },
    }
  );
  check(res, { "2xx": (r) => r.status < 300 });
  sleep(0.5);
}
```

**What to look for**:
- All 200s → no deadlocks, no lost updates
- 500s with serialization errors → add `FOR UPDATE` or retry logic
- 504s → DB connection pool exhaustion

---

## Interpreting results & where to tune

| Symptom | Likely cause | Fix |
|---|---|---|
| p95 latency climbs with VUs | Missing index or N+1 query | Check `drizzle/0015_add_hot_table_indexes.sql` applied + add EXPLAIN ANALYZE to slow routes |
| 429s on normal routes | Rate limit too tight | Adjust `RATE_LIMITS.read` in `api-rate-limiter.ts` |
| 429s NEVER on expensive routes | `classifyRoute()` misclassified | Add path to the expensive list |
| 504s at moderate VUs | DB pool too small | Bump Neon compute size or add connection pooler |
| Real AI cost >$0.10/request | Prompt too large or retries looping | Audit `/src/lib/ai/*` for cache hits + retry caps |

---

## Budget planner

Before running Scenario 2, estimate max spend:

```
max_spend = iterations × avg_cost_per_request × safety_factor
         ≈ 20 × $0.05 × 2 = $2.00
```

If you don't know the per-request cost, start with `iterations: 1` and read the bill, not the speculation.
