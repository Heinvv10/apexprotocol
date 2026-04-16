# OpenAI o1 Browser Automation Guide

## Overview

ApexGEO now supports OpenAI's o1 reasoning model via browser automation. This provides access to extended thinking and advanced reasoning capabilities for competitive monitoring queries.

## Features

- **o1 Reasoning**: Full extended thinking capability for complex analysis
- **o1-mini Fallback**: Automatic fallback to faster, cheaper o1-mini model
- **Claude Fallback**: Final fallback to Claude when reasoning budget exhausted
- **Thinking Token Tracking**: Separate tracking of thinking vs output tokens
- **Cost Calculation**: Real-time cost calculation based on OpenAI pricing
- **Rate Limiting**: 40 requests/minute (slower due to reasoning time)
- **Extended Timeouts**: 120-second timeout for thinking operations
- **Reasoning Chain Extraction**: Debug reasoning for complex queries

## Installation & Setup

### Prerequisites

1. OpenAI account with o1 access (currently limited availability)
2. Browser automation infrastructure (Puppeteer with Chrome/Chromium)
3. Environment variables configured

### Environment Setup

```bash
# Required for authentication
export OPENAI_API_KEY="your-api-key"

# Optional: Puppeteer configuration
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

## Usage

### Basic Query (o1 with automatic fallback)

```typescript
import { queryO1Browser } from "@/lib/monitoring/integrations/o1-browser";

const result = await queryO1Browser(
  "Analyze competitor pricing trends in the SaaS market",
  "integration-123",
  {
    timeoutMs: 120000, // 2 minutes for thinking
    captureScreenshot: false,
  }
);

console.log(result.response); // o1's reasoning + analysis
console.log(result.metrics.thinkingTokens); // Thinking tokens used
console.log(result.metrics.totalCost); // Cost in USD
```

### Forced o1-mini (Budget-Constrained)

```typescript
import { queryO1MiniBrowser } from "@/lib/monitoring/integrations/o1-browser";

const result = await queryO1MiniBrowser(
  "Quick competitive analysis",
  "integration-456"
);

// o1-mini is faster and cheaper, good for routine monitoring
```

### Budget-Aware Execution

```typescript
const result = await queryO1Browser(
  "Complex market analysis",
  "integration-789",
  {
    budgetContext: {
      remainingTokenBudget: 2000, // Low budget
      estimatedTokenCost: 800,
      preferredModel: "o1-mini", // Prefer cheaper model
    },
  }
);

console.log(result.metrics.fallbackReason); // If fallback occurred
```

## API Integration

### Via HTTP Endpoint

```bash
# Query with o1 (automatic fallback chain)
curl -X POST "http://localhost:3000/api/monitor/run?platform=o1_browser" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the latest trends in AI-powered monitoring?",
    "brandId": "brand-123",
    "integrationId": "o1-integration-1"
  }'

# Query with o1-mini (fast & cheap)
curl -X POST "http://localhost:3000/api/monitor/run?platform=o1_mini_browser" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Summarize competitor updates",
    "brandId": "brand-123",
    "integrationId": "o1-mini-integration-1"
  }'
```

## Response Format

```json
{
  "platformName": "o1_browser",
  "platformId": "integration-123",
  "status": "success",
  "response": "Extended analysis with reasoning...",
  "metrics": {
    "confidence": 0.95,
    "relevance": 0.92,
    "brandMentioned": true,
    "thinkingTokens": 1850,
    "outputTokens": 450,
    "totalCost": 0.0405,
    "model": "o1",
    "fallbackReason": null
  },
  "responseTimeMs": 45000,
  "error": null
}
```

## Token Tracking

### Thinking vs Output Tokens

o1's pricing model distinguishes between thinking tokens (extended reasoning) and output tokens:

```typescript
const metadata = o1Executor.getThinkingMetadata();

console.log(metadata.thinkingTokens); // Reasoning tokens
console.log(metadata.outputTokens); // Response tokens
console.log(metadata.totalTokens); // Sum of both

// Cost calculation
const thinkingCost = metadata.thinkingTokens * 0.015; // $0.015 per 1K
const outputCost = metadata.outputTokens * 0.06; // $0.06 per 1K
const totalCost = thinkingCost + outputCost;
```

### Cost Examples

| Query Type | Thinking Tokens | Output Tokens | Cost |
|-----------|-----------------|---------------|------|
| Simple question | 500 | 200 | $0.019 |
| Moderate analysis | 2000 | 800 | $0.078 |
| Complex reasoning | 5000 | 1500 | $0.165 |

## Fallback Logic

o1 uses a 3-model fallback chain:

```
Query Request
    ↓
Try o1 (primary reasoning model)
    ├─ Success → Return result
    └─ Timeout/Error → Fallback
        ↓
    Try o1-mini (faster, cheaper)
        ├─ Success → Return result + fallback metadata
        └─ Rate limit/Error → Fallback
            ↓
        Try Claude (most reliable)
            ├─ Success → Return result + fallback metadata
            └─ Error → Return error
```

### When Fallback Occurs

**o1 → o1-mini fallback:**
- Thinking timeout (reasoning takes >120s)
- Content extraction failure

**o1-mini → Claude fallback:**
- Rate limit hit (40 req/min exceeded)
- Authentication issues
- Persistent content extraction errors

### Detecting Fallback

```typescript
const result = await queryO1Browser(query, integrationId);

if (result.metrics.fallbackReason) {
  console.log(`Fallback occurred: ${result.metrics.fallbackReason}`);
  console.log(`Original model: ${result.metrics.originalModel}`);
  console.log(`Used model: ${result.metrics.fallbackModel}`);
}
```

## Rate Limiting

### Limits

- **o1**: 40 requests/minute (1.5s minimum interval)
- **o1-mini**: 40 requests/minute (same, for consistency)
- **Claude**: Higher limits (20-60 req/min depending on plan)

### Handling Rate Limits

The executor automatically respects rate limits with exponential backoff:

```typescript
const result = await queryO1Browser(query, integrationId, {
  maxRetries: 2, // Retry up to 2 times
  timeoutMs: 120000,
  // Automatic backoff: 3s → 6s → 12s
});
```

## Thinking Chain Extraction

For debugging complex reasoning:

```typescript
// Execute query
await o1Executor.executeQuery(query, integrationId);

// Get thinking metadata
const metadata = o1Executor.getThinkingMetadata();

// Extract reasoning for debugging
console.log("Reasoning chain:");
console.log(metadata.reasoningChain); // First 500 chars of thinking
```

## Error Handling

### Common Errors

| Error | Cause | Action |
|-------|-------|--------|
| `Timeout after 120000ms` | Thinking took too long | Falls back to o1-mini |
| `CAPTCHA challenge detected` | Bot detection | Requires manual intervention |
| `Rate limit detected` | Exceeded 40 req/min | Retry with backoff |
| `Login required` | Session expired | Re-authenticate |

### Error Recovery

```typescript
try {
  const result = await queryO1Browser(query, integrationId);
  if (result.error) {
    console.error(`Query failed: ${result.error}`);
    if (result.error.includes("CAPTCHA")) {
      // Handle CAPTCHA: requires human intervention
    } else if (result.error.includes("rate limit")) {
      // Automatic retry with backoff already applied
    }
  }
} catch (error) {
  console.error(`Execution error: ${error.message}`);
}
```

## Performance Characteristics

### Timing

```
o1 query execution timeline:
├─ Navigate to ChatGPT: 2-3s
├─ Wait for interface: 2-5s
├─ Type query: 1-2s (human-like delays)
├─ Reasoning/Thinking: 10-60s (highly variable)
├─ Output generation: 5-15s
└─ DOM extraction: 1-2s
Total: 20-90 seconds (median: 45s)

o1-mini timeline (similar but faster thinking):
├─ Reasoning/Thinking: 5-20s
├─ Output generation: 3-8s
Total: 15-45 seconds (median: 25s)
```

### Resource Usage

- **Memory**: 150-300 MB per browser instance
- **CPU**: 30-60% during thinking
- **Network**: 2-5 MB per query (including thinking payload)

## Best Practices

### 1. Use o1-mini for Routine Monitoring

```typescript
// For daily monitoring, use faster/cheaper o1-mini
const result = await queryO1MiniBrowser(
  "Today's competitor updates",
  integrationId
);
```

### 2. Reserve o1 for Complex Analysis

```typescript
// For deep analysis, use full o1
const result = await queryO1Browser(
  "Detailed competitive positioning analysis...",
  integrationId,
  { timeoutMs: 120000 }
);
```

### 3. Budget-Aware Queries

```typescript
// Check budget before expensive queries
if (remainingBudget < 1000) {
  // Use o1-mini for constrained scenarios
  return queryO1MiniBrowser(query, integrationId);
} else {
  return queryO1Browser(query, integrationId);
}
```

### 4. Batch Processing

```typescript
// Space out queries to respect rate limit
const queries = [...];
for (const query of queries) {
  const result = await queryO1Browser(query, integrationId);
  // Automatic rate limiting respects 1.5s interval
  await delay(2000); // Extra safety margin
}
```

### 5. Error Handling

```typescript
const result = await queryO1Browser(query, integrationId);

if (result.status === "failed") {
  if (result.error?.includes("CAPTCHA")) {
    // Manual resolution required
    notifyAdmin("CAPTCHA challenge - manual verification needed");
  } else {
    // Automatic fallback already attempted
    console.log("Query failed after fallback chain exhausted");
  }
}
```

## Monitoring & Alerts

### Thinking Token Costs

```typescript
// Track costs across queries
const costs = [];
for (const query of queries) {
  const result = await queryO1Browser(query, integrationId);
  const metadata = o1Executor.getThinkingMetadata();
  costs.push(metadata.totalCost);
}

const totalCost = costs.reduce((a, b) => a + b, 0);
console.log(`Total o1 costs: $${totalCost.toFixed(2)}`);

if (totalCost > 5.00) {
  // Alert: costs exceeded threshold
}
```

### Fallback Tracking

```typescript
// Monitor fallback frequency
let o1OnlyCount = 0;
let fallbackCount = 0;

for (const query of queries) {
  const result = await queryO1Browser(query, integrationId);
  if (result.metrics.fallbackReason) {
    fallbackCount++;
  } else {
    o1OnlyCount++;
  }
}

console.log(`o1 only: ${o1OnlyCount}, Fallbacks: ${fallbackCount}`);
```

## Troubleshooting

### o1 Not Available

If o1 is still in limited access:

```
Error: "o1 model not available for this account"
Solution: Use o1-mini or Claude until access granted
```

### Thinking Timeout

If queries regularly timeout at 120s:

```typescript
// Use o1-mini for faster results
const result = await queryO1MiniBrowser(query, integrationId);
```

### High Costs

Monitor thinking token costs:

```typescript
// Check cost per query
const metadata = o1Executor.getThinkingMetadata();
if (metadata.totalCost > 0.10) {
  // Switch to o1-mini for similar queries
  console.warn(`High cost query: $${metadata.totalCost.toFixed(4)}`);
}
```

### Authentication Issues

```typescript
// Verify OpenAI session is active
const health = await healthCheckO1Browser();
if (health.status === "unhealthy") {
  // Re-authenticate or check session
  console.log(health.message);
}
```

## Architecture

```
queryO1Browser()
├─ O1BrowserQueryExecutor (o1-browser-query.ts)
│  ├─ BaseBrowserQueryExecutor (base-browser-query.ts)
│  ├─ O1DOMExtractor
│  └─ ThinkingMetadata tracking
├─ Fallback chain
│  ├─ Try o1
│  ├─ Try o1-mini
│  └─ Try Claude
├─ MultiPlatformQueryResult conversion
└─ Session management
```

## Competitive Advantage

By EOS (end of quarter):

- **5+ platforms** with reasoning capability (vs Pontifex's manual approach)
- **Thinking token tracking** for cost optimization
- **Automatic fallback chain** for reliability
- **Speed + Quality** = competitive win

## See Also

- [ChatGPT Browser Guide](./chatgpt-browser.md)
- [Claude Browser Guide](./claude-browser.md)
- [Perplexity Browser Guide](./perplexity-browser.md)
- [Browser Query System](../src/lib/browser-query/README.md)
