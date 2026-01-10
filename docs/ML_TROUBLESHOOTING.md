# ML Troubleshooting Guide
## Predictive Analytics - Common Issues and Solutions

This guide helps you diagnose and fix common issues with the predictive analytics system for GEO score forecasting.

---

## ðŸ“‹ Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Installation Issues](#installation-issues)
3. [Data Issues](#data-issues)
4. [Training Failures](#training-failures)
5. [Prediction Quality Issues](#prediction-quality-issues)
6. [API Errors](#api-errors)
7. [UI Display Issues](#ui-display-issues)
8. [Performance Problems](#performance-problems)
9. [Alert Issues](#alert-issues)
10. [Database Issues](#database-issues)

---

## Quick Diagnostics

### Run Health Check

```bash
# Verify ML environment is working
npm run test:ml
```

**All tests should pass:**
- âœ“ Library Import
- âœ“ Linear Regression
- âœ“ Confidence Intervals
- âœ“ Statistical Functions
- âœ“ Forecasting Workflow

If any fail, see [Installation Issues](#installation-issues).

### Check Database Connection

```bash
# Test database connectivity
npm run db:studio
```

Should open Drizzle Studio. If it fails, see [Database Issues](#database-issues).

### Verify Historical Data

```bash
# Check if you have enough historical data (90+ days)
npm run verify:e2e
```

This script will tell you if data requirements are met.

---

## Installation Issues

### Issue: `simple-statistics` not found

**Error:**
```
Error: Cannot find module 'simple-statistics'
```

**Solution:**
```bash
# Install dependencies
npm install

# Verify installation
npm list simple-statistics
# Should show: simple-statistics@7.8.8 or higher
```

### Issue: TypeScript compilation errors

**Error:**
```
TS2307: Cannot find module 'simple-statistics'
```

**Solution:**
```bash
# Clean build cache
rm -rf .next
rm -rf node_modules
rm -rf tsconfig.tsbuildinfo

# Reinstall
npm install

# Rebuild
npm run build
```

### Issue: Test script fails to run

**Error:**
```
Error: Cannot find module 'tsx'
```

**Solution:**
```bash
# Install tsx globally or use npx
npm install -g tsx

# Or use npx
npx tsx scripts/ml/setup.ts --test
```

---

## Data Issues

### Issue: "Insufficient historical data"

**Error:**
```
{
  "error": "Insufficient historical data for predictions",
  "details": "Minimum 90 days of historical GEO scores required. Found: 45 days"
}
```

**Root Cause:** Not enough historical GEO scores in database.

**Solution:**

**Option 1: Wait for data accumulation**
```bash
# Check current data
SELECT
  brandId,
  COUNT(*) as days_of_data,
  MIN(recordedAt) as oldest_record,
  MAX(recordedAt) as latest_record
FROM geoScoreHistory
GROUP BY brandId;
```

**Option 2: Generate synthetic test data (dev only)**
```bash
npm run verify:e2e
# Creates 6 months of synthetic data for testing
```

**Option 3: Import historical data**
```typescript
// Use data-pipeline to import existing historical scores
import { db } from '@/lib/db';
import { geoScoreHistory } from '@/lib/db/schema/feedback';

// Bulk insert historical data
await db.insert(geoScoreHistory).values(historicalRecords);
```

### Issue: Too many data gaps

**Error:**
```
{
  "warnings": ["Multiple data gaps detected: 5 gaps > 3 days"]
}
```

**Root Cause:** Missing GEO score records for several days.

**Impact:**
- Lower confidence scores
- Less reliable predictions
- Flagged as "unreliable" in metadata

**Solution:**

**Option 1: Fill gaps retrospectively**
```typescript
// Interpolate missing values
import { handleMissingValues } from '@/lib/ml/data-validator';

const cleanedData = handleMissingValues(dataWithGaps, {
  maxGapDays: 3,
  interpolationMethod: 'linear'
});
```

**Option 2: Accept lower confidence**
- System will flag predictions as lower confidence
- Alerts will be suppressed for low-confidence predictions
- Continue monitoring and wait for more data

### Issue: Outliers detected

**Warning:**
```
{
  "dataQuality": {
    "outliersRemoved": 8,
    "qualityScore": 0.92
  }
}
```

**Root Cause:** Unusual GEO score spikes or drops (>3 standard deviations from mean).

**Investigation:**
```sql
-- Find outlier dates
SELECT
  recordedAt,
  overallScore,
  (overallScore - AVG(overallScore) OVER ()) / STDDEV(overallScore) OVER () as z_score
FROM geoScoreHistory
WHERE brandId = 'BRAND_ID'
HAVING ABS((overallScore - AVG(overallScore) OVER ()) / STDDEV(overallScore) OVER ()) > 3
ORDER BY recordedAt;
```

**Solution:**
- **If legitimate spikes**: Outliers are correctly removed to prevent skewing predictions
- **If data errors**: Fix source data and retrain model
- **If systematic issue**: Investigate GEO score calculation logic

### Issue: "No score data found for brand"

**Error:**
```
{
  "error": "No score data found",
  "brandId": "brand-123"
}
```

**Root Cause:** Brand exists but has no GEO score history.

**Solution:**
```bash
# Verify brand exists
SELECT * FROM brands WHERE id = 'brand-123';

# Check for any score history
SELECT COUNT(*) FROM geoScoreHistory WHERE brandId = 'brand-123';

# If count = 0, trigger GEO score calculation first
curl -X POST "http://localhost:3000/api/analytics/geo-score" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"brandId": "brand-123"}'
```

---

## Training Failures

### Issue: Training job hangs or times out

**Symptoms:**
- Model status stuck on "training" for >5 minutes
- No predictions generated
- No error messages in logs

**Diagnosis:**
```sql
-- Check training status
SELECT
  id,
  brandId,
  status,
  trainedAt,
  trainingDuration,
  performanceMetrics
FROM modelMetadata
WHERE status = 'training'
ORDER BY trainedAt DESC;
```

**Solution 1: Check for database locks**
```sql
-- PostgreSQL: Check for long-running queries
SELECT pid, age(clock_timestamp(), query_start), usename, query
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY query_start DESC;
```

**Solution 2: Retry training**
```bash
# Manually update status to failed
UPDATE modelMetadata
SET status = 'failed'
WHERE id = 'STUCK_JOB_ID';

# Trigger new training
curl -X POST "http://localhost:3000/api/predictions/train" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"brandId": "brand-123"}'
```

**Solution 3: Check server logs**
```bash
# Look for errors in Next.js logs
npm run dev

# Or check production logs (Vercel)
vercel logs
```

### Issue: Linear regression fails

**Error:**
```
Error: linearRegression requires at least 2 data points
```

**Root Cause:** Insufficient data points after validation/outlier removal.

**Solution:**
```typescript
// Check data points before training
if (validatedData.length < 30) {
  throw new Error(`Insufficient data points: ${validatedData.length}. Minimum 30 required.`);
}
```

### Issue: Model performance metrics are poor

**Warning:**
```
{
  "performanceMetrics": {
    "rSquared": 0.42,
    "meanAbsoluteError": 15.8
  }
}
```

**Acceptable Metrics:**
- RÂ² > 0.7 (good fit)
- MAE < 10 (predictions within Â±10 points)

**Root Causes:**
1. **Highly volatile scores**: GEO scores fluctuate too much for linear regression
2. **Seasonal patterns**: Linear model can't capture seasonality
3. **Recent trend change**: Historical pattern doesn't predict future

**Solutions:**

**Option 1: Collect more data**
- Linear regression improves with more historical data
- Wait for 180+ days of history

**Option 2: Accept limitations**
- Flag predictions as "low confidence"
- Continue monitoring
- Use for directional insights only

**Option 3: Consider model upgrade** (future)
- Exponential smoothing for seasonal patterns
- Moving average for volatile data
- See `docs/ML_APPROACH_DECISION.md` for migration path

---

## Prediction Quality Issues

### Issue: Confidence scores too low (<70%)

**Symptoms:**
- Most predictions flagged as "low confidence"
- Alerts suppressed
- UI shows warnings

**Diagnosis:**
```sql
-- Check confidence distribution
SELECT
  CASE
    WHEN confidence > 0.8 THEN 'High (>80%)'
    WHEN confidence > 0.7 THEN 'Medium (70-80%)'
    ELSE 'Low (<70%)'
  END as confidence_tier,
  COUNT(*) as prediction_count,
  AVG(confidence) as avg_confidence
FROM predictions
WHERE brandId = 'BRAND_ID'
  AND status = 'active'
GROUP BY confidence_tier;
```

**Root Causes:**
1. **High residual variance**: Actual scores deviate significantly from trend line
2. **Poor model fit**: Low RÂ² value
3. **Insufficient data**: <90 days of history

**Solutions:**

**Option 1: Improve data quality**
- Fill data gaps
- Remove or investigate outliers
- Ensure consistent GEO score calculation

**Option 2: Wait for more data**
- Collect 180+ days of history
- More data reduces standard error â†’ higher confidence

**Option 3: Adjust confidence calculation**
```typescript
// In forecaster.ts, modify confidence formula
const confidence = Math.max(0, 1 - (stdError / mean(actualValues)));

// To be more lenient:
const confidence = Math.max(0, 1 - (stdError / (2 * mean(actualValues))));
```

### Issue: Predictions don't match reality

**Symptoms:**
- Predicted values significantly off from actual outcomes
- Systematic over/underprediction

**Diagnosis:**
```sql
-- Compare predictions to actual outcomes (after target date)
SELECT
  p.targetDate,
  p.predictedValue,
  a.overallScore as actual_value,
  ABS(p.predictedValue - a.overallScore) as error,
  p.confidence
FROM predictions p
LEFT JOIN geoScoreHistory a
  ON p.brandId = a.brandId
  AND p.targetDate = DATE(a.recordedAt)
WHERE p.brandId = 'BRAND_ID'
  AND p.targetDate < CURRENT_DATE
ORDER BY p.targetDate DESC
LIMIT 30;
```

**Root Causes:**
1. **Trend changed**: Historical pattern broke down
2. **External events**: Market shifts, algorithm updates
3. **Model limitations**: Linear regression too simple

**Solutions:**

**Option 1: Retrain more frequently**
- Daily retraining captures recent trends
- Set up cron job: `GET /api/cron/check-predictions`

**Option 2: Acknowledge limitations**
- Use predictions for directional insights, not exact values
- Display wider confidence intervals
- Add disclaimer to UI

**Option 3: Hybrid approach** (future)
- Combine statistical predictions with qualitative analysis
- Use LLM to explain unexpected deviations
- Implement changepoint detection

### Issue: Trend direction incorrect

**Symptoms:**
- Model predicts "up" but scores are dropping
- Or vice versa

**Diagnosis:**
```typescript
// Check slope of regression line
const regression = linearRegression(dataPoints);
const slope = regression.m; // Positive = upward trend, negative = downward

// Check recent vs older data
const recentData = dataPoints.slice(-30); // Last 30 days
const olderData = dataPoints.slice(0, 30); // First 30 days
const recentMean = mean(recentData.map(([, y]) => y));
const olderMean = mean(olderData.map(([, y]) => y));
```

**Solution:**
- If trend recently changed, retrain model
- Consider shorter historical window (e.g., 90 days instead of 180)
- Weigh recent data more heavily (future enhancement)

---

## API Errors

### Issue: 401 Unauthorized

**Error:**
```
{
  "error": "Unauthorized"
}
```

**Root Cause:** Missing or invalid Clerk authentication token.

**Solution:**
```bash
# Ensure you're authenticated
# In browser: Check that you're logged in
# In API call: Include Authorization header

curl "http://localhost:3000/api/predictions?brandId=brand-123" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### Issue: 400 Bad Request - Invalid brandId

**Error:**
```
{
  "error": "Missing brandId parameter"
}
```

**Solution:**
```bash
# Ensure brandId is provided as query parameter
curl "http://localhost:3000/api/predictions?brandId=BRAND_ID"

# Or in request body for POST
curl -X POST "http://localhost:3000/api/predictions/train" \
  -d '{"brandId": "BRAND_ID"}'
```

### Issue: 404 Brand Not Found

**Error:**
```
{
  "error": "Brand not found"
}
```

**Solution:**
```sql
-- Verify brand exists
SELECT id, name FROM brands WHERE id = 'BRAND_ID';

-- Check user has access to brand
SELECT * FROM userBrands
WHERE userId = 'USER_ID' AND brandId = 'BRAND_ID';
```

### Issue: 500 Internal Server Error

**Error:**
```
{
  "error": "Internal server error"
}
```

**Diagnosis:**
1. Check server logs for stack trace
2. Look for database connection errors
3. Verify environment variables are set

**Common Causes:**

**Database connection failure:**
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection
npm run db:studio
```

**Missing dependencies:**
```bash
# Reinstall
npm install
```

**TypeScript compilation errors:**
```bash
# Check for build errors
npm run build
```

---

## UI Display Issues

### Issue: PredictiveChart not rendering

**Symptoms:**
- Empty chart container
- Loading state persists indefinitely
- No error messages

**Diagnosis:**
```javascript
// Open browser DevTools Console
// Check for errors

// Check Network tab
// Verify /api/predictions request succeeded
```

**Solutions:**

**Issue 1: API returns no data**
```bash
# Test API directly
curl "http://localhost:3000/api/predictions?brandId=BRAND_ID" \
  -H "Authorization: Bearer TOKEN"

# If empty, trigger training first
curl -X POST "http://localhost:3000/api/predictions/train" \
  -d '{"brandId": "BRAND_ID"}'
```

**Issue 2: Component props incorrect**
```tsx
// Ensure brandId is provided
<PredictiveChart brandId={brandId} />

// Check brandId is defined
console.log('brandId:', brandId);
```

**Issue 3: Data format mismatch**
```typescript
// PredictiveChart expects specific format
interface ChartData {
  historical: Array<{ date: string; value: number }>;
  forecast: Array<{
    date: string;
    value: number;
    confidenceLower: number;
    confidenceUpper: number;
  }>;
}
```

### Issue: ConfidenceIndicator shows wrong color

**Symptoms:**
- Confidence 85% shows as red (should be green)
- Colors don't match thresholds

**Solution:**
```tsx
// Check confidence value format
// Should be 0-1 (e.g., 0.85) OR 0-100 (e.g., 85)
// Component auto-normalizes both formats

<ConfidenceIndicator
  confidence={0.85}  // âœ“ Correct (0-1)
  // OR
  confidence={85}    // âœ“ Correct (0-100)
/>

// NOT
<ConfidenceIndicator
  confidence="85%"  // âœ— Wrong (string)
/>
```

### Issue: EmergingOpportunities shows no results

**Symptoms:**
- "No opportunities detected" message
- Even though predictions exist

**Diagnosis:**
```bash
# Check opportunities API
curl "http://localhost:3000/api/predictions/opportunities?brandId=BRAND_ID" \
  -H "Authorization: Bearer TOKEN"
```

**Common Causes:**

1. **No upward trends**: All predictions show downward or stable trends
   - **Solution**: Normal behavior if GEO scores are declining

2. **Confidence too low**: Opportunities filtered out due to <70% confidence
   - **Solution**: Lower `minConfidence` threshold
   ```tsx
   <EmergingOpportunities
     brandId={brandId}
     minConfidence={0.6}  // Lower from default 0.7
   />
   ```

3. **Impact too small**: Predicted increases <10%
   - **Solution**: Lower `minImpact` threshold
   ```tsx
   <EmergingOpportunities
     brandId={brandId}
     minImpact={5}  // Lower from default 10
   />
   ```

---

## Performance Problems

### Issue: API responses slow (>2 seconds)

**Diagnosis:**
```bash
# Measure API response time
time curl "http://localhost:3000/api/predictions?brandId=BRAND_ID"
```

**Common Causes:**

**Issue 1: Missing database indexes**
```sql
-- Check if indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'predictions';

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_predictions_brand_date
  ON predictions(brandId, targetDate);

CREATE INDEX IF NOT EXISTS idx_predictions_status
  ON predictions(status);
```

**Issue 2: Unnecessary retraining**
```typescript
// Ensure caching is working
// Predictions should be cached for 24 hours
// Check lastUpdated timestamp in response

// If retraining on every request:
// 1. Check cache logic in /api/predictions/route.ts
// 2. Verify predictionDate comparison logic
```

**Issue 3: Large result sets**
```sql
-- Check prediction count
SELECT COUNT(*) FROM predictions
WHERE brandId = 'BRAND_ID' AND status = 'active';

-- Should be ~90 predictions per brand
-- If much higher, check status update logic
```

**Solutions:**
- Add database indexes (see above)
- Enable query result caching
- Paginate large result sets
- Optimize database queries with `EXPLAIN ANALYZE`

### Issue: Chart rendering slow

**Diagnosis:**
```javascript
// Use React DevTools Profiler
// 1. Open React DevTools
// 2. Click Profiler tab
// 3. Record rendering
// 4. Analyze PredictiveChart component
```

**Solutions:**

**Option 1: Memoize chart data**
```tsx
import { useMemo } from 'react';

const chartData = useMemo(() => {
  return transformPredictionsToChartData(predictions);
}, [predictions]);
```

**Option 2: Reduce data points**
```typescript
// Sample data for large datasets
const sampledData = predictions.filter((_, i) => i % 2 === 0);
// Shows every other point (half the data)
```

**Option 3: Optimize Recharts**
```tsx
<ResponsiveContainer>
  <LineChart
    data={chartData}
    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
    // Add performance optimizations
    isAnimationActive={false}  // Disable animations
    syncId="anyId"             // Sync multiple charts
  >
```

---

## Alert Issues

### Issue: No alerts triggered

**Symptoms:**
- Predictions show >20% drop
- Confidence >70%
- But no alerts in UI or notifications

**Diagnosis:**
```sql
-- Check if alerts exist in database
SELECT
  COUNT(*) as alert_count,
  severity,
  type
FROM predictiveAlerts
WHERE brandId = 'BRAND_ID'
  AND createdAt > NOW() - INTERVAL '7 days'
GROUP BY severity, type;
```

**Common Causes:**

**Issue 1: Cron job not running**
```bash
# Check if /api/cron/check-predictions is configured
# Vercel: Check vercel.json for cron config
# Manual: Verify crontab entry

# Manually trigger alert check
curl "http://localhost:3000/api/cron/check-predictions" \
  -H "Authorization: Bearer CRON_SECRET"
```

**Issue 2: Rate limiting suppressing alerts**
```typescript
// Default: 1 alert/week per brand (unless HIGH severity)
// Check if recent alert already sent

SELECT * FROM predictiveAlerts
WHERE brandId = 'BRAND_ID'
  AND createdAt > NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC;

// If alert exists within 7 days, new alerts suppressed
// Solution: Wait, or adjust rate limit logic
```

**Issue 3: Alert logic not evaluating predictions**
```typescript
// Check shouldTriggerPredictiveAlert logic
import { shouldTriggerPredictiveAlert } from '@/lib/alerts/predictive-alerts';

const alert = shouldTriggerPredictiveAlert(
  prediction,
  currentScore,
  0.20  // 20% drop threshold
);

console.log('Alert triggered?', alert !== null);
```

### Issue: Too many alerts (alert fatigue)

**Symptoms:**
- Multiple alerts per day for same brand
- Users complain about noise

**Solutions:**

**Option 1: Increase drop threshold**
```typescript
// In predictive-alerts.ts
const HIGH_SEVERITY_DROP = 0.40;  // Increase from 0.30 (40% drop)
const MEDIUM_SEVERITY_DROP = 0.30; // Increase from 0.20 (30% drop)
```

**Option 2: Increase confidence requirement**
```typescript
const MIN_CONFIDENCE = 0.80;  // Increase from 0.70 (80% confidence)
```

**Option 3: Extend rate limit window**
```typescript
// In notifications/triggers.ts
const RATE_LIMIT_DAYS = 14;  // Increase from 7 (2 weeks between alerts)
```

### Issue: Alert confidence/leadTime missing

**Error:**
```
{
  "metadata": {}  // Empty, should have confidence and leadTime
}
```

**Root Cause:** Notification metadata not properly passed.

**Solution:**
```typescript
// In notifications/triggers.ts
export async function onPredictedScoreDrop(
  brandId: string,
  prediction: ForecastPrediction,
  currentScore: number
) {
  const alert = shouldTriggerPredictiveAlert(prediction, currentScore, 0.20);

  if (!alert) return;

  await createNotification({
    type: 'predicted_score_drop',
    severity: alert.severity,
    metadata: {
      confidence: alert.confidence,      // âœ“ Include
      leadTime: alert.leadTime,          // âœ“ Include
      targetDate: alert.targetDate,      // âœ“ Include
      predictedDrop: alert.predictedDrop // âœ“ Include
    }
  });
}
```

---

## Database Issues

### Issue: Migrations not applied

**Error:**
```
relation "predictions" does not exist
```

**Solution:**
```bash
# Apply migrations
npm run db:push

# Verify tables exist
npm run db:studio
# Check for: predictions, modelMetadata, predictiveAlerts tables
```

### Issue: Foreign key constraint failures

**Error:**
```
ERROR: insert or update on table "predictions" violates foreign key constraint
```

**Root Cause:** Referencing non-existent brandId or entityId.

**Solution:**
```sql
-- Verify brand exists
SELECT id FROM brands WHERE id = 'BRAND_ID';

-- For entity-level predictions (keywords, topics):
-- Ensure entity exists before creating predictions
```

### Issue: Duplicate predictions

**Symptoms:**
- Multiple prediction sets for same brand/date
- Performance degradation

**Diagnosis:**
```sql
-- Check for duplicates
SELECT
  brandId,
  targetDate,
  COUNT(*) as duplicate_count
FROM predictions
WHERE status = 'active'
GROUP BY brandId, targetDate
HAVING COUNT(*) > 1;
```

**Solution:**
```sql
-- Mark older duplicates as superseded
WITH ranked_predictions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY brandId, targetDate
      ORDER BY predictionDate DESC
    ) as rn
  FROM predictions
  WHERE status = 'active'
)
UPDATE predictions
SET status = 'superseded'
WHERE id IN (
  SELECT id FROM ranked_predictions WHERE rn > 1
);
```

### Issue: Database connection timeouts

**Error:**
```
Error: Connection timeout
```

**Solutions:**

**Option 1: Check DATABASE_URL**
```bash
echo $DATABASE_URL
# Should be: postgresql://user:password@host:port/database
```

**Option 2: Verify network connectivity**
```bash
# Test connection to database host
ping your-db-host.com

# Test PostgreSQL port
nc -zv your-db-host.com 5432
```

**Option 3: Increase connection timeout**
```typescript
// In database configuration
const db = drizzle(client, {
  schema,
  logger: true,
  // Add connection pool settings
  connectionTimeoutMillis: 30000  // 30 seconds
});
```

---

## Getting Help

If you can't resolve an issue:

### 1. Check Logs

**Development:**
```bash
npm run dev
# Watch console output for errors
```

**Production (Vercel):**
```bash
vercel logs
# Or check Vercel dashboard â†’ Logs
```

### 2. Enable Debug Mode

```typescript
// In forecaster.ts or other ML files
const DEBUG = true;

if (DEBUG) {
  console.log('Historical data:', historicalData);
  console.log('Regression result:', regression);
  console.log('Predictions:', predictions);
}
```

### 3. Run E2E Verification

```bash
npm run verify:e2e
# Comprehensive test of entire system
# Reports which step fails
```

### 4. Check Documentation

- **Setup Guide**: [`docs/PREDICTIVE_ANALYTICS_SETUP.md`](./PREDICTIVE_ANALYTICS_SETUP.md)
- **E2E Verification**: [`docs/E2E_VERIFICATION.md`](./E2E_VERIFICATION.md)
- **ML Approach**: [`docs/ML_APPROACH_DECISION.md`](./ML_APPROACH_DECISION.md)

### 5. Review Source Code

Key files to inspect:
- **Forecaster**: `src/lib/ml/forecaster.ts`
- **Data Pipeline**: `src/lib/ml/data-pipeline.ts`
- **Validator**: `src/lib/ml/data-validator.ts`
- **API Routes**: `src/app/api/predictions/`
- **Components**: `src/components/analytics/`

---

## Common Error Codes

| Code | Meaning | Common Cause | Solution |
|------|---------|--------------|----------|
| 400 | Bad Request | Missing brandId, invalid parameters | Check request format |
| 401 | Unauthorized | Missing/invalid auth token | Verify Clerk authentication |
| 404 | Not Found | Brand doesn't exist | Check brand ID |
| 500 | Internal Error | Database/ML error | Check logs, verify database connection |
| 503 | Service Unavailable | Database down, training overload | Retry later, check database |

---

## Preventive Maintenance

### Weekly Checks

```bash
# 1. Verify model performance
npm run db:studio
# Check modelMetadata table â†’ RÂ² > 0.7, MAE < 10

# 2. Check data quality
# Query geoScoreHistory for gaps

# 3. Review alert frequency
# Check predictiveAlerts table
```

### Monthly Reviews

1. **Prediction Accuracy**:
   - Compare predictions to actual outcomes
   - Calculate actual MAE vs predicted MAE
   - Adjust thresholds if needed

2. **Performance Metrics**:
   - API response times still <2s?
   - Chart rendering still <1s?
   - Database query times <500ms?

3. **User Feedback**:
   - Are predictions useful?
   - Too many/few alerts?
   - Confidence scores accurate?

---

**Last Updated**: December 25, 2024
**Version**: 1.0
**Maintainer**: Auto-Claude Implementation Agent
