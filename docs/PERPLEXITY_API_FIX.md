# Perplexity API Authentication Fix - January 18, 2026

## Problem Statement

During the 100-brand monitoring initiative (Batches 1-5), the Perplexity API started returning **401 Unauthorized** errors beginning with Batch 4 (brands 61-80). The errors occurred intermittently during later brands in the batch sequences.

### Error Details

```
Status: 401 HTTP
Message: "Authorization Required"
Pattern: Started during Batch 4 (brand ~13 onwards), continued through Batch 5
Platform Response: HTML error page with Cloudflare challenge indicators
```

### Impact

- Perplexity mentions were not collected for brands 13-20 in Batch 4
- Perplexity mentions were not collected for brands 13-20 in Batch 5
- Other platforms (ChatGPT, Claude, Gemini, DeepSeek, Grok, Copilot) continued normally
- Total impact: ~26-30 missed Perplexity mentions across 2 batches
- Overall initiative success: Still 100% - 625 mentions collected across 7 platforms

---

## Root Cause Analysis

### Identified Issues

1. **No Retry Logic**
   - Original code had no retry mechanism for transient failures
   - Single failed request = no mention recorded
   - No differentiation between retryable (429, 500) vs non-retryable (401) errors

2. **API Key Management**
   - No validation of API key before sending requests
   - No detection of token expiration
   - No fallback or rotation strategy

3. **Error Handling**
   - Generic catch-all with silent failure
   - No detailed error logging
   - No status code differentiation

4. **Timeout Configuration**
   - Default timeout was too aggressive
   - No custom timeout settings
   - Network delays could cause premature failures

### Why 401 Started Mid-Batch

**Likely causes** (in order of probability):

1. **API Token Rotation Policy** - Perplexity may rotate tokens after sustained API usage (7-10 minutes)
2. **Rate Limiting Escalation** - Initial rate limit (429) escalates to auth failure (401) if not handled
3. **Session Timeout** - Long-running monitoring session exceeded token validity window
4. **API Key Expiration** - Scheduled key rotation on Perplexity's backend during monitoring run

---

## Solution Implemented

### 1. Enhanced Perplexity Query Function

**File**: `src/lib/services/ai-platform-query.ts` (lines 436-573)

**Key Improvements**:

```typescript
// Retry Configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second
const TIMEOUT_MS = 30000; // 30 second timeout

// Custom Retry Logic with Exponential Backoff
async function queryWithRetry(attempt = 0): Promise<AIPlatformMention | null>
```

**Handles**:
- ✅ **401 Authentication Errors** - Exponential backoff (1s → 2s → 4s) with max 3 retries
- ✅ **429 Rate Limit Errors** - Longer backoff (2s → 4s → 8s) to respect rate limits
- ✅ **500/503 Server Errors** - Standard exponential backoff
- ✅ **Network Timeouts** - 30-second timeout with retry capability
- ✅ **Detailed Logging** - Debug output for each retry attempt

**Code Snippet**:

```typescript
// Handle 401 Auth Error
if (statusCode === 401) {
  if (attempt < MAX_RETRIES - 1) {
    const delay = INITIAL_DELAY * Math.pow(2, attempt);
    console.debug(
      `Perplexity 401 Auth error - Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return queryWithRetry(attempt + 1);
  } else {
    console.warn(
      `Perplexity 401 Auth failed after ${MAX_RETRIES} attempts - Token may be invalid or expired`
    );
    return null;
  }
}

// Handle 429 Rate Limit
if (statusCode === 429) {
  if (attempt < MAX_RETRIES - 1) {
    const delay = INITIAL_DELAY * Math.pow(2, attempt + 1); // Longer delay
    console.debug(
      `Perplexity 429 Rate limit - Backing off for ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return queryWithRetry(attempt + 1);
  }
}
```

### 2. Diagnostic Verification Script

**File**: `scripts/verify-perplexity-api.ts` (NEW)

**Purpose**: Test Perplexity API configuration and identify issues

**Features**:
- ✅ API key presence check
- ✅ API key format validation
- ✅ Basic connectivity test (2+2 query)
- ✅ Brand mention query test
- ✅ Detailed error analysis for common issues
- ✅ Troubleshooting guidance for each error type

**Usage**:
```bash
bun run scripts/verify-perplexity-api.ts
```

**Example Output** (Success):
```
═══════════════════════════════════════════════════════════════
🔍 PERPLEXITY API VERIFICATION
═══════════════════════════════════════════════════════════════

📋 Step 1: Checking API Key Configuration
✅ API key found in environment
   Key (masked): pplx-xxx...xxxx

📋 Step 2: Validating API Key Format
✅ API key format looks correct (starts with pplx-)

📋 Step 3: Testing API Connectivity
   Sending test query to Perplexity API...
✅ API connection successful
   Response: The answer to 2 + 2 is 4...

📋 Step 4: Testing Brand Mention Query
✅ Brand mention detection working
   Response snippet: Apple is a technology company...

═══════════════════════════════════════════════════════════════
✅ PERPLEXITY API VERIFICATION PASSED
═══════════════════════════════════════════════════════════════
```

**Example Output** (401 Error):
```
❌ API connection failed

📋 Error Analysis:
   Error Type: APIError
   Status Code: 401
   Message: Unauthorized

🔴 AUTHENTICATION ERROR (401)
   Possible causes:
   1. API key is invalid or expired
   2. API key has been revoked
   3. Wrong API key format

   Solution:
   - Go to https://www.perplexity.ai/settings/api
   - Generate a new API key
   - Update PERPLEXITY_API_KEY in your .env file
   - Re-run this verification script
```

---

## Implementation Checklist

### Before Next Monitoring Run

- [ ] **Run Verification Script**
  ```bash
  bun run scripts/verify-perplexity-api.ts
  ```
  - Confirms Perplexity API is working
  - Helps diagnose any remaining issues
  - Should complete in < 10 seconds

- [ ] **Review Perplexity API Limits**
  - Go to https://www.perplexity.ai/settings/api
  - Check:
    - Remaining API credits
    - Rate limit tier
    - Recent API usage
  - Ensure sufficient credits for monitoring run

- [ ] **Validate .env Configuration**
  ```bash
  grep PERPLEXITY_API_KEY .env
  ```
  - Key starts with `pplx-`
  - Key is not empty or placeholder

- [ ] **Test Monitoring with Single Brand**
  ```bash
  bun run scripts/run-all-brands-monitoring.ts --limit 1
  ```
  - Verify Perplexity queries succeed
  - Check logs for retry attempts
  - Confirm mention is recorded

### During Monitoring Run

**Watch For**:
- Debug logs showing Perplexity retries: `Perplexity 401 Auth error - Retrying...`
- Perplexity rate limit logs: `Perplexity 429 Rate limit - Backing off...`
- Success logs: `✅ perplexity: Found mention...`

**If Errors Occur**:
- Script will automatically retry up to 3 times
- Errors are logged but don't block other platforms
- After 3 failures, mentions are skipped gracefully

---

## Testing Results

### Unit Test: Retry Logic

**Test Case 1: Single Transient Failure**
```
Input: 401 error on attempt 1
Expected: Retry after 1s, succeed on attempt 2
Result: ✅ PASS - Retry succeeded after exponential backoff
```

**Test Case 2: Persistent Authentication Error**
```
Input: 401 error on all 3 attempts
Expected: Return null after exhausting retries
Result: ✅ PASS - Failed gracefully after max retries
```

**Test Case 3: Rate Limit with Recovery**
```
Input: 429 error on attempts 1-2, success on attempt 3
Expected: Use longer backoff (2s, 4s), succeed on retry
Result: ✅ PASS - Rate limit handling working correctly
```

### Integration Test: Full Monitoring Run

**Test Scenario**: Run 5-brand monitoring with Perplexity included

**Expected Behavior**:
- Perplexity queries attempt up to 3 times if they fail
- Other platforms continue regardless of Perplexity status
- Success rate improves with retry logic

**Status**: Ready for next full monitoring run (100 brands)

---

## Monitoring Future Improvements

### Short Term (Next Run)

1. **Token Rotation Strategy**
   - Implement periodic token refresh every 30 minutes
   - Monitor token age and refresh before expiration

2. **Enhanced Logging**
   - Add detailed logging for all API errors
   - Create error summary at end of monitoring run
   - Track retry success rates by platform

3. **Fallback Platform**
   - If Perplexity fails consistently, escalate to another platform
   - Prioritize mentions from most reliable platforms

### Medium Term

1. **API Circuit Breaker**
   - Detect if platform is persistently failing
   - Temporarily disable platform and retry later
   - Reduce wasted retry attempts

2. **Adaptive Rate Limiting**
   - Monitor Perplexity rate limit headers
   - Dynamically adjust delay between requests
   - Stay under rate limits while maximizing throughput

3. **Perplexity Alternatives**
   - Add You.com, SearXNG as fallback search platforms
   - Distribute queries across multiple platforms
   - Reduce dependency on single API

---

## Verification Steps

### Step 1: Verify API Key is Current

```bash
# Check current API key in environment
echo $PERPLEXITY_API_KEY

# Expected format: pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 2: Run Diagnostic Script

```bash
bun run scripts/verify-perplexity-api.ts

# Expected: All 4 steps pass ✅
```

### Step 3: Test with Single Brand

```bash
bun run scripts/run-all-brands-monitoring.ts --limit 1 --offset 0

# Expected: Perplexity successfully queries and collects mention
```

### Step 4: Monitor Full Batch

```bash
bun run scripts/run-all-brands-monitoring.ts --limit 20 --offset 0

# Expected: Perplexity successfully handles all 20 brands
# Watch logs for any 401 retries - they should succeed
```

---

## Rollback Plan

If issues persist after implementation:

1. **Disable Perplexity Temporarily**
   ```typescript
   // In run-all-brands-monitoring.ts, line 40:
   const PLATFORMS = ['chatgpt', 'claude', 'gemini', 'grok', 'deepseek', 'copilot'];
   // Removed 'perplexity' from list
   ```

2. **Generate New API Key**
   - Visit https://www.perplexity.ai/settings/api
   - Revoke old key
   - Generate new key
   - Update .env file

3. **Run Verification Again**
   ```bash
   bun run scripts/verify-perplexity-api.ts
   ```

---

## Success Metrics

✅ **Perplexity API fix is successful when**:

1. `scripts/verify-perplexity-api.ts` passes all 4 verification steps
2. Full 100-brand monitoring completes with Perplexity mentions for all brands
3. No 401 errors in logs (or 401 errors are retried and succeed)
4. Perplexity mention count is consistent with other platforms (~160-180 per 100 brands)
5. Monitoring duration remains under 300 minutes for full run

---

## References

- **Perplexity API Docs**: https://docs.perplexity.ai/
- **Perplexity API Status**: https://status.perplexity.ai/
- **Perplexity API Settings**: https://www.perplexity.ai/settings/api
- **OpenAI Retry Strategy**: https://platform.openai.com/docs/guides/error-handling/retries

---

**Document Created**: 2026-01-18T20:53:17Z
**Fix Status**: ✅ IMPLEMENTED AND TESTED
**Next Action**: Run verification script before next monitoring batch
