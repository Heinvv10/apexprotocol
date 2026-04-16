# Perplexity Browser Query - Quick Reference

## File Locations

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/browser-query/types.ts` | 200 | Type definitions & error classes |
| `src/lib/browser-query/base-browser-query.ts` | 300 | Abstract base class |
| `src/lib/browser-query/perplexity-browser-query.ts` | 350 | Perplexity implementation |
| `src/lib/browser-query/session-manager.ts` | 450 | Session management & encryption |
| `src/lib/browser-query/index.ts` | 30 | Module exports |
| `src/lib/utils/logger.ts` | 120 | Logging utility |
| `src/lib/monitoring/integrations/perplexity-browser.ts` | 100 | Integration hook |
| `src/lib/db/schema/browser-sessions.ts` | 350 | Database schema |
| `src/app/api/monitor/run/browser-query-handler.ts` | 300 | API routing |
| `drizzle/migrations/add_browser_sessions.sql` | 200 | Database migration |
| `tests/lib/browser-query/perplexity-browser-query.test.ts` | 350 | Test suite |

**Total**: ~2,750 lines of production code

## Architecture Diagram

```
User Query (API)
      │
      ▼
executeBrowserQuery()
      │
      ├─ Session Manager: Get or create session
      │
      ├─ PerplexityBrowserQueryExecutor
      │  ├─ Initialize browser (Puppeteer)
      │  ├─ Navigate to Perplexity
      │  ├─ Wait for content
      │  ├─ Detect CAPTCHA/Rate Limit
      │  ├─ Extract DOM
      │  └─ Return result (with retries)
      │
      ├─ Log to browser_query_logs
      ├─ Update browser_platform_health
      │
      └─ Return MultiPlatformQueryResult
```

## Key Exports

```typescript
// Main executor
export { PerplexityBrowserQueryExecutor } from "./perplexity-browser-query";
export { getPerplexityExecutor, cleanupPerplexityExecutor } from "./perplexity-browser-query";

// Session manager
export { BrowserSessionManager } from "./session-manager";
export { getSessionManager, shutdownSessionManager } from "./session-manager";

// Types
export {
  BrowserQueryResult,
  BrowserSession,
  BrowserQueryError,
  CaptchaDetectedError,
  RateLimitError,
  TimeoutError,
  ContentExtractionError,
} from "./types";

// Integration hook
export { queryPerplexityBrowser } from "./monitoring/integrations/perplexity-browser";
```

## Common Operations

### Execute a Query
```typescript
import { getPerplexityExecutor } from "@/lib/browser-query";

const executor = getPerplexityExecutor();
const result = await executor.executeQuery(
  "What is ApexGEO?",
  "integration-123",
  { timeoutMs: 30000, maxRetries: 2 }
);

if (result.status === "success") {
  console.log(result.rawContent);
  console.log(result.extractedData.citations);
}
```

### Use via API Handler
```typescript
import { executeBrowserQuery } from "@/app/api/monitor/run/browser-query-handler";

const response = await executeBrowserQuery({
  brandId: "brand-123",
  integrationId: "integration-456",
  query: "What is the brand?",
  platformName: "perplexity",
  brandContext: "ApexGEO",
});

if (response.success) {
  console.log("Session:", response.sessionId);
  console.log("Time:", response.executionTime, "ms");
}
```

### Manage Sessions
```typescript
import { getSessionManager } from "@/lib/browser-query";

const mgr = getSessionManager();

// Create/reuse session
const session = mgr.getOrCreateSession("perplexity", "user-123");

// Record result
mgr.recordSuccess(session.id, 2500); // 2500ms
mgr.recordFailure(session.id, "Rate limited");

// Get stats
const stats = mgr.getSessionStats(session.id);
console.log(`Success: ${stats.successRate}%`);

// Cleanup
await mgr.shutdown();
```

## Error Handling

### Error Types
```typescript
// CAPTCHA detected - requires manual intervention
if (error instanceof CaptchaDetectedError) {
  console.log("Screenshot:", error.screenshotPath);
  // Alert human to solve CAPTCHA
}

// Rate limit hit - will retry with backoff
if (error instanceof RateLimitError) {
  console.log("Retry after:", error.retryAfterSeconds, "seconds");
  // Automatic retry in place
}

// Navigation timeout - will retry
if (error instanceof TimeoutError) {
  console.log("Timeout after:", error.timeoutMs, "ms");
}

// Content extraction failed - check page source
if (error instanceof ContentExtractionError) {
  console.log("Context:", error.context);
}
```

### Query Failure Handling
```typescript
const result = await executor.executeQuery("...", "id", {});

if (result.status === "failed") {
  console.error(`Error: ${result.error}`);
  
  if (result.error?.includes("CAPTCHA")) {
    // Handle CAPTCHA
  } else if (result.error?.includes("rate limit")) {
    // Implement backoff (automatic in retry logic)
  } else if (result.error?.includes("timeout")) {
    // Check network/Perplexity availability
  } else {
    // Generic error - check logs
  }
}
```

## Database Queries

### Check Recent Queries
```sql
SELECT id, platform_name, status, error_type, response_time_ms, executed_at
FROM browser_query_logs
ORDER BY executed_at DESC
LIMIT 10;
```

### Check CAPTCHA Errors
```sql
SELECT id, session_id, query, error_type, screenshot_path, executed_at
FROM browser_query_logs
WHERE error_type = 'captcha'
ORDER BY executed_at DESC
LIMIT 5;
```

### Monitor Platform Health
```sql
SELECT 
  platform_name,
  status,
  stats->>'uptime' as uptime,
  consecutive_failures,
  (stats->>'totalQueries')::int as total,
  (stats->>'successfulQueries')::int as success
FROM browser_platform_health
ORDER BY updated_at DESC;
```

### Check Session Stats
```sql
SELECT 
  id,
  platform_name,
  status,
  metadata->>'requestCount' as requests,
  metadata->>'successCount' as successes,
  last_used_at,
  expires_at
FROM browser_sessions
WHERE platform_name = 'perplexity'
ORDER BY last_used_at DESC;
```

## Configuration

### Environment Variables
```bash
# Required
ENCRYPTION_KEY=a1b2c3d4e5f6...(64 hex chars)

# Optional
HEADLESS_BROWSER=true
BROWSER_VIEWPORT_WIDTH=1366
BROWSER_VIEWPORT_HEIGHT=768
BROWSER_TIMEOUT_MS=30000
CONTENT_READY_TIMEOUT_MS=15000
SKIP_BROWSER_TESTS=true  # For CI/CD
```

### Retry Configuration
```typescript
const executor = new PerplexityBrowserQueryExecutor({
  maxRetries: 3,           // Retry up to 3 times
  initialDelayMs: 1000,    // Start with 1s delay
  maxDelayMs: 30000,       // Cap at 30s delay
  backoffMultiplier: 2,    // Double each time
  retryOn: {
    timeout: true,         // Retry timeouts
    captcha: false,        // Don't auto-retry CAPTCHA
    rateLimit: true,       // Retry rate limits
    networkError: true,    // Retry network errors
  }
});
```

## Testing

### Run Tests
```bash
npm test -- browser-query
npm test -- perplexity-browser-query.test.ts
SKIP_BROWSER_TESTS=true npm test
npm test -- --coverage browser-query
```

### Manual Testing
```bash
# Test query execution
curl -X POST http://localhost:3000/api/monitor/run \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "test-123",
    "query": "What is ApexGEO?"
  }'

# Check results in database
psql $DATABASE_URL -c "SELECT * FROM browser_query_logs ORDER BY executed_at DESC LIMIT 1;"
```

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Average Response | < 5s | Including page load |
| P95 Response | < 10s | With network variance |
| Session Reuse | > 80% | Same user/platform |
| Success Rate | > 90% | Excluding CAPTCHA |
| Memory/Browser | < 200MB | Puppeeter instance |
| Concurrent Queries | 5-10 | Per instance |

## Monitoring Checklist

- [ ] Query success rates by platform
- [ ] CAPTCHA frequency (alert if > 10%)
- [ ] Rate limit frequency (alert if > 5%)
- [ ] Average response time (alert if > 8s)
- [ ] Session reuse rate (track efficiency)
- [ ] Platform uptime (target: > 95%)
- [ ] Browser error logs (check daily)
- [ ] Database size (browser_query_logs growth)

## Troubleshooting Quick Links

| Problem | Solution | Location |
|---------|----------|----------|
| CAPTCHA always triggers | Proxy rotation needed | See "Security" in docs |
| Sessions expire too fast | Increase TTL or implement heartbeat | session-manager.ts |
| Memory leak | Run cleanup timer | Sessions auto-cleanup hourly |
| Browser won't start | Install Chrome/Chromium | README.md |
| Tests timeout | Set SKIP_BROWSER_TESTS=true | CI config |
| Encryption error | Check ENCRYPTION_KEY format (64 hex) | .env.local |

## Key Code Patterns

### Create Custom Executor (for other platforms)
```typescript
export class CustomPlatformExecutor extends BaseBrowserQueryExecutor {
  protected async executeQueryInternal(
    query: string,
    integrationId: string,
    options: BrowserQueryOptions
  ): Promise<BrowserQueryResult> {
    // Custom implementation
  }
}
```

### Custom Retry Configuration
```typescript
const customExecutor = new PerplexityBrowserQueryExecutor({
  maxRetries: 5,
  retryOn: { timeout: true, captcha: false, rateLimit: true }
});
```

### Session Lifecycle
```typescript
// Create
const session = mgr.createSession("perplexity", "user-123");

// Use
const result = await executor.executeQuery(..., session.id);

// Update stats
if (result.status === "success") {
  mgr.recordSuccess(session.id, responseTime);
} else {
  mgr.recordFailure(session.id, result.error);
}

// Revoke when needed
mgr.revokeSession(session.id, "User logged out");
```

## Integration Points

### In PLATFORM_CONFIG
```typescript
import { queryPerplexityBrowser } from "./perplexity-browser";

export const PLATFORM_CONFIG = {
  perplexity: {
    name: "Perplexity",
    tier: 1,
    color: "#20808d",
    icon: "🔍",
    queryFn: queryPerplexityBrowser,  // Switch from API to browser
  },
};
```

### In API Route
```typescript
// POST /api/monitor/run
import { executeBrowserQuery } from "./browser-query-handler";

const response = await executeBrowserQuery({
  brandId: req.brandId,
  integrationId: req.integrationId,
  query: req.query,
  platformName: "perplexity",
  brandContext: brand.name,
});
```

## Security Essentials

- [ ] ENCRYPTION_KEY set to 64-char hex string
- [ ] Never log session data (auto-redacted)
- [ ] ENCRYPTION_KEY never committed to Git
- [ ] Session data encrypted with AES-256-GCM
- [ ] Screenshots contain no credentials
- [ ] Session tied to user + platform combo
- [ ] Automatic session expiration (24h)
- [ ] Session revocation support

## Performance Optimization

1. **Session Reuse** (80% of queries should reuse)
   - Create new session only on expiration/failure
   - Track session age and metrics

2. **Content Extraction** (~180ms total)
   - Extract main content first (~100ms)
   - Extract citations (~50ms)
   - Extract related queries (~30ms)

3. **Browser Pool** (for future)
   - Currently: 1 browser per platform
   - Future: Pool of 3-5 browsers
   - Load balance queries

## References

- **Full Docs**: docs/BROWSER_QUERY_POC.md
- **Implementation**: IMPLEMENTATION_GUIDE.md
- **Tests**: tests/lib/browser-query/perplexity-browser-query.test.ts
- **Schema**: src/lib/db/schema/browser-sessions.ts
- **Integration**: src/lib/monitoring/integrations/perplexity-browser.ts

---

**Quick Links**:
- Copy files from IMPLEMENTATION_GUIDE.md
- Run `npm test -- browser-query` to verify
- Check BROWSER_QUERY_POC.md for detailed docs
- See PERPLEXITY_BROWSER_QUICK_REFERENCE.md (this file) for quick answers
