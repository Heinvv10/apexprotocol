# Manual QA Testing: AI-Powered Recommendation Generation

## Overview

This document provides comprehensive manual QA testing procedures for the AI-powered recommendation generation feature. The goal is to verify that recommendations generated from brand visibility data are:
- **Specific**: Target concrete AI platforms and content gaps
- **Actionable**: Include clear, executable steps
- **Correctly Prioritized**: Critical issues ranked higher than minor optimizations

## Pre-requisites

1. Development server running: `npm run dev`
2. Valid API key for Claude AI configured in `.env`
3. Database connection configured
4. At least one brand exists in the database with visibility data

## Test Data Preparation

### Option 1: Use Existing Brand Data

If you have existing brands with monitor data:
```bash
# Find a brand with visibility data
# Query the database for brands with recent mentions
```

### Option 2: Create Test Brand

For testing without existing data, create a brand first via the admin interface or database.

---

## Test Scenarios

### Scenario 1: Successful AI Recommendation Generation

**Objective**: Verify AI generates specific, actionable recommendations from visibility data.

**Request**:
```bash
curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: [YOUR_AUTH_COOKIE]" \
  -d '{
    "brandId": "[VALID_BRAND_ID]",
    "includeMonitor": true,
    "includeAudit": true,
    "maxRecommendations": 10,
    "useAI": true
  }'
```

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "brandId": "[BRAND_ID]",
  "generatedAt": "2025-12-23T...",
  "summary": {
    "total": 5,
    "critical": 1,
    "high": 2,
    "medium": 2,
    "low": 0,
    "persisted": 5,
    "duplicatesSkipped": 0
  },
  "sources": {
    "monitorPlatforms": 3,
    "auditIncluded": true
  },
  "tokenUsage": {
    "input": 1500,
    "output": 2000
  },
  "recommendations": [...]
}
```

**Validation Checklist**:
- [ ] Response status is 200
- [ ] `success` is `true`
- [ ] `recommendations` array is not empty
- [ ] Each recommendation has all required fields:
  - [ ] `category` (one of: technical_seo, content_optimization, schema_markup, citation_building, brand_consistency, competitor_analysis, content_freshness, authority_building)
  - [ ] `priority` (one of: critical, high, medium, low)
  - [ ] `impact` (one of: high, medium, low)
  - [ ] `effort` (one of: quick_win, moderate, major)
  - [ ] `title` (concise, specific)
  - [ ] `description` (detailed explanation)
  - [ ] `steps` (array of 2-5 actionable steps)
  - [ ] `aiPlatforms` (array of specific platforms)
  - [ ] `expectedOutcome` (measurable result)
  - [ ] `estimatedTimeframe` (time estimate)
  - [ ] `impactScore` (0-100)
- [ ] Recommendations are sorted by priority (critical > high > medium > low)
- [ ] `tokenUsage` shows input and output tokens
- [ ] Generation completed within 30 seconds

---

### Scenario 2: Empty Visibility Data Handling

**Objective**: Verify graceful handling when no visibility data is available.

**Request**:
```bash
curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: [YOUR_AUTH_COOKIE]" \
  -d '{
    "brandId": "[BRAND_ID_WITH_NO_DATA]",
    "includeMonitor": false,
    "includeAudit": false,
    "useAI": true
  }'
```

**Expected Response (200 OK with warning)**:
```json
{
  "success": true,
  "brandId": "[BRAND_ID]",
  "warning": "Insufficient visibility data for analysis",
  "summary": {
    "total": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "persisted": 0,
    "duplicatesSkipped": 0
  },
  "recommendations": []
}
```

**Validation Checklist**:
- [ ] Response status is 200 (not error)
- [ ] `success` is `true`
- [ ] `warning` message explains insufficient data
- [ ] `recommendations` array is empty
- [ ] No errors thrown

---

### Scenario 3: Invalid Brand ID

**Objective**: Verify proper error handling for non-existent brands.

**Request**:
```bash
curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: [YOUR_AUTH_COOKIE]" \
  -d '{
    "brandId": "non-existent-brand-id-12345",
    "useAI": true
  }'
```

**Expected Response (404 Not Found)**:
```json
{
  "success": false,
  "error": "Brand not found"
}
```

**Validation Checklist**:
- [ ] Response status is 404
- [ ] `success` is `false`
- [ ] Error message is clear and descriptive

---

### Scenario 4: Missing Brand ID Validation

**Objective**: Verify input validation catches missing required fields.

**Request**:
```bash
curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: [YOUR_AUTH_COOKIE]" \
  -d '{
    "includeMonitor": true
  }'
```

**Expected Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Invalid request body",
  "details": [
    {
      "message": "Required",
      "path": ["brandId"]
    }
  ]
}
```

**Validation Checklist**:
- [ ] Response status is 400
- [ ] `success` is `false`
- [ ] Validation errors specify which field is missing

---

### Scenario 5: Unauthorized Access

**Objective**: Verify authentication is required.

**Request**:
```bash
curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "[VALID_BRAND_ID]",
    "useAI": true
  }'
```

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Validation Checklist**:
- [ ] Response status is 401
- [ ] `success` is `false`

---

### Scenario 6: Duplicate Recommendation Detection

**Objective**: Verify duplicate recommendations are skipped on repeat generation.

**Steps**:
1. Generate recommendations for a brand (Scenario 1)
2. Note the recommendations generated
3. Run the same generation request again

**Second Request**:
```bash
curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: [YOUR_AUTH_COOKIE]" \
  -d '{
    "brandId": "[SAME_BRAND_ID]",
    "includeMonitor": true,
    "includeAudit": true,
    "useAI": true
  }'
```

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "summary": {
    "total": 5,
    "persisted": 0,
    "duplicatesSkipped": 5
  },
  ...
}
```

**Validation Checklist**:
- [ ] `duplicatesSkipped` > 0
- [ ] `persisted` is 0 or less than first run
- [ ] No database errors

---

### Scenario 7: Rule-Based Fallback

**Objective**: Verify rule-based generation works when AI is disabled.

**Request**:
```bash
curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: [YOUR_AUTH_COOKIE]" \
  -d '{
    "brandId": "[VALID_BRAND_ID]",
    "includeMonitor": true,
    "includeAudit": true,
    "useAI": false
  }'
```

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "recommendations": [...],
  "grouped": {
    "critical": [...],
    "high": [...],
    "medium": [...],
    "low": [...]
  }
}
```

**Validation Checklist**:
- [ ] Response status is 200
- [ ] Recommendations generated without AI
- [ ] No `tokenUsage` in response (no AI tokens consumed)
- [ ] Response format differs slightly (no `impactScore` field)

---

### Scenario 8: Performance - Response Time

**Objective**: Verify generation completes within acceptable time.

**Request**:
```bash
time curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: [YOUR_AUTH_COOKIE]" \
  -d '{
    "brandId": "[VALID_BRAND_ID]",
    "includeMonitor": true,
    "includeAudit": true,
    "maxRecommendations": 10,
    "useAI": true
  }'
```

**Validation Checklist**:
- [ ] Response time < 30 seconds
- [ ] No timeout errors
- [ ] Server logs show expected timing

---

## Recommendation Quality Validation

For each recommendation generated, verify:

### Platform Specificity
- [ ] `aiPlatforms` array contains specific platforms (ChatGPT, Claude, Perplexity, Gemini)
- [ ] NOT generic like "all platforms" or "AI platforms"

### Actionability of Steps
- [ ] Each step starts with an action verb (Add, Update, Create, Implement, etc.)
- [ ] Steps are concrete, not vague (e.g., "Add FAQ schema to /faq page" vs "Improve SEO")
- [ ] Steps can be followed by non-technical users

### Priority Alignment
- [ ] Critical recommendations address major gaps (>50% visibility deficit)
- [ ] High recommendations address significant gaps (30-50%)
- [ ] Medium recommendations address moderate gaps (15-30%)
- [ ] Low recommendations are minor optimizations

### Category Appropriateness
- [ ] Schema issues → `schema_markup` category
- [ ] Content freshness issues → `content_freshness` category
- [ ] Competitor gaps → `competitor_analysis` category
- [ ] Technical issues → `technical_seo` category

### No Hallucinations
- [ ] Recommendations based on actual data in visibility metrics
- [ ] No invented platforms or issues
- [ ] Timeframes are realistic

---

## Console Logging Verification

Check the server console during generation for:

1. **Request Start Log**:
   ```
   [API:Recommendations/Generate] Request received { brandId, userId, orgId, ... }
   ```

2. **AI Generation Start**:
   ```
   [AI:Recommendations] Starting recommendation generation { brandId, platformCount, ... }
   ```

3. **Prompt Construction**:
   ```
   [AI:Recommendations] Prompt constructed { userPromptLength, systemPromptLength, ... }
   ```

4. **AI Response**:
   ```
   [AI:Recommendations] AI response received { responseTimeMs, inputTokens, outputTokens, ... }
   ```

5. **Completion**:
   ```
   [AI:Recommendations] Generation completed successfully { totalTimeMs, recommendations, priorityBreakdown }
   ```

---

## Database Verification

After successful generation, verify in database:

```sql
-- Check recommendations were inserted
SELECT id, title, category, priority, status, source, created_at
FROM recommendations
WHERE brand_id = '[BRAND_ID]'
ORDER BY created_at DESC
LIMIT 10;

-- Verify JSONB steps field
SELECT id, title, steps
FROM recommendations
WHERE brand_id = '[BRAND_ID]'
  AND steps IS NOT NULL
LIMIT 5;

-- Check priority distribution
SELECT priority, COUNT(*) as count
FROM recommendations
WHERE brand_id = '[BRAND_ID]'
GROUP BY priority;
```

---

## QA Sign-Off Checklist

Before marking this subtask complete:

- [ ] All 8 test scenarios executed
- [ ] All validation checklists passed
- [ ] Recommendation quality verified (specificity, actionability, prioritization)
- [ ] Console logging verified
- [ ] Database persistence verified
- [ ] No console errors during testing
- [ ] Performance acceptable (< 30s generation time)
- [ ] No security issues observed (API keys not exposed)

---

## Test Execution Log

| Date | Tester | Scenario | Result | Notes |
|------|--------|----------|--------|-------|
| | | | | |

---

## Issues Found

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| | | | |

---

## Conclusion

After completing all test scenarios and verifying recommendation quality, the QA tester should:

1. Document all results in the Test Execution Log
2. Report any issues found
3. If all tests pass, update subtask status to "completed"
4. If issues found, document and mark as blocked until resolved
