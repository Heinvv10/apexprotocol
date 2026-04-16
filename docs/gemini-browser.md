# Gemini Browser Automation

Puppeteer-based automation for Google Gemini with Google OAuth session management, streaming detection, and aggressive anti-detection measures.

## Overview

The Gemini browser module provides automated querying of `gemini.google.com` by driving a real Chrome browser. It follows the same pattern as the Perplexity, Claude, and ChatGPT browser integrations.

Key capabilities:
- Google OAuth + session cookie persistence (~30-day sessions)
- 2FA detection with human-in-the-loop handling
- Streaming response completion detection (waits for Gemini to finish generating)
- Citation extraction from response links
- Related suggestions extraction
- Chrome DevTools Protocol evasion (anti-bot measures)
- Rate limiting: 5 requests/minute (conservative for Google's strict limits)

## Files

| File | Purpose |
|------|---------|
| `src/lib/browser-query/gemini-browser-query.ts` | Core executor — DOM extraction, auth detection, query submission |
| `src/lib/browser-query/gemini-browser.ts` | Integration hook — wraps executor for multi-platform query system |
| `src/lib/monitoring/integrations/gemini-browser.ts` | Re-export for platform config wiring |
| `tests/lib/browser-query/gemini-browser-query.test.ts` | 74-test suite (68+ pass) |

## Configuration

Set these environment variables before running:

```bash
# Google account credentials (required for authenticated queries)
GOOGLE_EMAIL=your@gmail.com
GOOGLE_PASSWORD=your_password

# Optional: pre-saved session cookies (base64-encoded JSON)
GEMINI_SESSION_COOKIES=<base64-cookies>

# Skip live browser tests in CI
SKIP_BROWSER_TESTS=1
```

## Usage

### Direct executor

```typescript
import { GeminiBrowserQueryExecutor } from "@/lib/browser-query/gemini-browser-query";

const executor = new GeminiBrowserQueryExecutor();
const result = await executor.executeQuery(
  "What AI monitoring tools exist?",
  "my-integration-id",
  {
    headless: true,
    timeoutMs: 30000,
    captureScreenshot: false,
  }
);

if (result.status === "success") {
  console.log(result.rawContent);
  console.log(result.extractedData.citations);
}

await executor.cleanup();
```

### Singleton (recommended for production)

```typescript
import { getGeminiExecutor, cleanupGeminiExecutor } from "@/lib/browser-query/gemini-browser-query";

// Reuses the same browser session across calls
const executor = getGeminiExecutor();
const result = await executor.executeQuery(query, integrationId);

// On shutdown
await cleanupGeminiExecutor();
```

### Via multi-platform query system

```typescript
import { queryGeminiBrowser } from "@/lib/browser-query/gemini-browser";

const result = await queryGeminiBrowser(
  "What is ApexGEO?",
  "integration-id-123",
  { timeoutMs: 30000 }
);
```

### Via HTTP API

```bash
curl -X POST /api/monitor/run \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand-uuid",
    "integrationId": "gemini-test",
    "query": "What is ApexGEO brand monitoring?",
    "platformName": "gemini_browser"
  }'
```

## Return Shape

```typescript
{
  platformName: "gemini_browser",
  platformId: string,          // your integrationId
  query: string,
  rawContent: string,          // full extracted text
  extractedData: {
    mainContent: string,
    citations: Array<{ url: string; title?: string }>,
    relatedQueries: string[],
    responseTime: number,      // epoch ms
  },
  status: "success" | "partial" | "failed",
  timestamp: Date,
  error?: string,
}
```

## Rate Limits

Google Gemini enforces strict rate limits. The executor is configured conservatively:

| Parameter | Value |
|-----------|-------|
| Min interval between queries | 12 seconds |
| Max queries/minute | 5 |
| Initial retry delay | 5 seconds |
| Max retry delay | 60 seconds |
| Backoff multiplier | 2.5x |
| Max retries | 2 |

CAPTCHA and 2FA are NOT auto-retried — they require human intervention.

## Error Types

| Error | Meaning |
|-------|---------|
| `AuthenticationError` | Google login required — no valid session cookies |
| `CaptchaDetectedError` (provider: `google_recaptcha`) | reCAPTCHA challenge |
| `CaptchaDetectedError` (provider: `google_2fa`) | 2-factor verification required |
| `CaptchaDetectedError` (provider: `bot_detection`) | Unusual activity / bot block |
| `RateLimitError` | Too many requests — retry after `retryAfterSeconds` |
| `ContentExtractionError` | Response appeared but text extraction failed |
| `TimeoutError` | Page or content did not load within `timeoutMs` |

## Anti-Detection Measures

The executor applies several Chrome DevTools Protocol overrides to blend in with real browser traffic:

- `navigator.webdriver` set to `false`
- `navigator.plugins` populated with 5 fake plugins
- `navigator.languages` set to `["en-US", "en"]`
- `window.chrome.runtime` populated
- User-agent: realistic Chrome 125 on Linux
- Viewport: 1366×768 (common desktop resolution)
- Human-like typing delays: 60–180ms per character
- Random delays between interactions: 400–1700ms

## Session Persistence

Google sessions via cookies can last ~30 days. To persist sessions across restarts, export cookies after a successful authenticated run and store them as `GEMINI_SESSION_COOKIES`.

## Platform Config Entry

The platform config at `src/lib/monitoring/integrations/platform-config.ts` includes:

```typescript
gemini_browser: {
  name: "Gemini (Browser)",
  tier: 1,
  color: "#4285f4",
  icon: "✨",
  queryFn: queryGeminiBrowser,
}
```

This means `gemini_browser` is a first-class tier-1 platform alongside `gemini` (API), `claude_browser`, `chatgpt_browser`, and `perplexity_browser`.
