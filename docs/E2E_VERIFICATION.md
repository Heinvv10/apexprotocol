# End-to-End Verification Guide
## Predictive GEO Analytics Feature

This document provides step-by-step instructions for verifying the complete predictive GEO analytics flow from data seeding through alert generation.

## Overview

The E2E verification process validates:

1. âœ… **Database Seeding**: Historical GEO scores (6+ months)
2. âœ… **Model Training**: ML forecasting pipeline execution
3. âœ… **Prediction Storage**: Database persistence of predictions
4. âœ… **API Endpoints**: Confidence intervals and metadata
5. âœ… **Chart Visualization**: Historical + forecast display
6. âœ… **Opportunity Detection**: Emerging trend identification
7. âœ… **Alert Generation**: Predictive drop alerts
8. âœ… **Notification Metadata**: Confidence scores and lead times

## Prerequisites

Before running the verification:

```bash
# 1. Ensure database is accessible
echo $DATABASE_URL  # Should be set

# 2. Install dependencies
npm install

# 3. Apply database migrations
npm run db:push

# 4. Ensure at least one brand exists in the database
# (The script will use an existing brand or prompt you to create one)
```

## Automated Verification

### Run the Verification Script

```bash
npm run verify:e2e
```

This script will:

1. **Seed Test Data** (6 months of synthetic GEO scores with downward trend)
2. **Extract Historical Data** from the database
3. **Train ML Model** using linear regression
4. **Generate Predictions** (90-day forecast)
5. **Store Predictions** in the database
6. **Validate Data Quality**:
   - Confidence scores in [0, 1] range
   - Proper confidence interval bounds
   - All required fields present
7. **Test Opportunity Detection** algorithm
8. **Trigger Predictive Alerts** for forecasted drops
9. **Verify Alert Metadata** (confidence, lead time, severity)

### Expected Output

```
============================================================
Predictive GEO Analytics - E2E Verification
============================================================

Step 1: Seed database with 6+ months historical GEO scores
â„¹ Using existing brand: Test Brand (brand-123)
â„¹ Generating 6 months of synthetic historical data...
âœ“ Inserted 180 historical GEO score records
â„¹ Verified: 180 records in database

Step 2: Trigger model training via data pipeline
â„¹ Extracting historical scores from database...
âœ“ Extracted 180 data points
â„¹ Date range: 2024-06-25 to 2024-12-25
â„¹ Data quality: 95%
â„¹ Training model and generating 90-day forecast...
âœ“ Generated 90 predictions
â„¹ Model RÂ²: 0.892
â„¹ Mean Absolute Error: 3.45
â„¹ Average Confidence: 78.3%

Step 3: Store predictions in database and verify
âœ“ Inserted 90 prediction records
âœ“ Verified 10 predictions in database
â„¹ Sample prediction:
  - Target Date: 2025-03-25
  - Predicted Value: 62.34
  - Confidence: 78%
  - Confidence Interval: [58.12, 66.56]
  - Trend: down

Step 4: Verify confidence intervals are properly calculated
âœ“ All confidence scores are within valid range [0, 1]
âœ“ All confidence intervals are properly bounded

Step 5: Verify historical + forecast data format
â„¹ Historical data points: 30
â„¹ Forecast data points: 30
âœ“ Both historical and forecast data available for chart display
â„¹ Last historical score: 60.23 (2024-12-25)
â„¹ First forecast score: 58.91 (2024-12-26)

Step 6: Check emerging opportunities detection
â„¹ Current average score: 60.15
âš  No opportunities detected (expected for downward trend)
â„¹ This is normal since we generated data with a downward trend

Step 7: Verify predictive alert triggering for forecasted drop
âœ“ 15 predictive alerts would be triggered
â„¹ Sample alert:
  - Type: predicted_drop
  - Severity: high
  - Confidence: 78%
  - Lead Time: 45 days
  - Predicted Drop: 25.3%
  - Target Date: 2025-02-08

Step 8: Confirm notification metadata includes confidence score and leadTime
âœ“ Confidence score present: 78%
âœ“ Lead time present: 45 days
âœ“ Severity level present: high
âœ“ Alert type present: predicted_drop
âœ“ Target date present: 2025-02-08
âœ“ Explanation present
   "Based on current trends, we predict a 25.3% drop in your GEO score over..."

âœ“ All required alert metadata fields are present and valid

============================================================
Verification Summary
============================================================

âœ“ Step 1: Historical data seeded (6+ months)
âœ“ Step 2: Model training completed
âœ“ Step 3: Predictions stored in database
âœ“ Step 4: Confidence intervals validated
âœ“ Step 5: Historical + forecast data verified
âœ“ Step 6: Opportunity detection tested (no upward trends)
âœ“ Step 7: Predictive alerts triggered
âœ“ Step 8: Alert metadata validated

============================================================
ALL VERIFICATION STEPS PASSED
============================================================
```

## Manual UI Verification

After running the automated script, manually verify the frontend components:

### 1. Start Development Server

```bash
npm run dev
```

### 2. Main Dashboard (EmergingOpportunities Widget)

**URL**: `http://localhost:3000/dashboard`

**Verify**:
- [ ] EmergingOpportunities widget displays
- [ ] Widget shows list of opportunities (if upward trends exist)
- [ ] Each opportunity shows:
  - Entity name
  - Current score
  - Predicted score
  - Impact percentage
  - Confidence indicator
  - Timeframe (days)
- [ ] Click on opportunity opens modal with:
  - Full prediction chart
  - Confidence indicator
  - Explanation text
  - Additional details
- [ ] No console errors

### 3. Brand Detail Page (PredictiveChart)

**URL**: `http://localhost:3000/dashboard/brands/[brandId]`

**Verify**:
- [ ] PredictiveChart component renders
- [ ] Chart displays:
  - Historical data (solid line, cyan/purple gradient)
  - Predicted data (dashed line, orange color)
  - Confidence bands (gradient fill)
- [ ] Tooltip shows:
  - Actual values (for historical)
  - Predicted values (for forecast)
  - Confidence ranges
  - Date
- [ ] Legend displays correctly
- [ ] Loading state works
- [ ] Error state handles gracefully
- [ ] No layout issues
- [ ] No console errors

### 4. Analytics Test Page

**URL**: `http://localhost:3000/dashboard/analytics`

**Verify**:
- [ ] Page loads successfully
- [ ] PredictiveChart with sample data displays
- [ ] ConfidenceIndicator examples show:
  - Different confidence levels (high/medium/low)
  - Color coding (green >80%, yellow 70-80%, red <70%)
  - Different sizes (small, medium, large)
  - Tooltips on hover
- [ ] EmergingOpportunities widget displays
- [ ] All components render without errors

### 5. API Endpoints

#### GET /api/predictions

```bash
# Test predictions API (replace BRAND_ID with actual ID)
curl "http://localhost:3000/api/predictions?brandId=BRAND_ID&horizon=90" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verify Response**:
- [ ] Status code: 200
- [ ] Response contains:
  - `predictions` array
  - `modelVersion` string
  - `lastUpdated` timestamp
  - `metadata` object with:
    - `historicalDataPoints`
    - `dataQuality`
    - `modelFit` (RÂ², MAE)
  - `explanation` object with:
    - `summary`
    - `trendDescription`
    - `confidenceFactors`
- [ ] Each prediction has:
  - `date`, `value`
  - `confidenceLower`, `confidenceUpper`
  - `confidence` (percentage)
  - `trend`, `explanation`

#### POST /api/predictions/train

```bash
# Trigger model training
curl -X POST "http://localhost:3000/api/predictions/train" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"brandId": "BRAND_ID"}'
```

**Verify Response**:
- [ ] Status code: 202 (Accepted)
- [ ] Response contains:
  - `jobId` (model metadata ID)
  - `modelVersion`
  - `brandId`
  - `dataPoints`
  - `estimatedCompletionTime`
  - `status: "training"`

#### GET /api/predictions/opportunities

```bash
# Test opportunities API
curl "http://localhost:3000/api/predictions/opportunities?brandId=BRAND_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verify Response**:
- [ ] Status code: 200
- [ ] Response contains `opportunities` array
- [ ] Each opportunity has:
  - `entityType`, `entityId`, `entityName`
  - `currentScore`, `predictedScore`
  - `impact`, `confidence`
  - `timeframe`, `targetDate`
  - `trend`, `explanation`

### 6. Database Verification

```bash
# Open Drizzle Studio
npm run db:studio
```

**Verify Tables**:

#### `predictions` table
- [ ] Rows exist for test brand
- [ ] Columns include:
  - `id`, `brandId`, `entityType`
  - `predictionDate`, `targetDate`
  - `predictedValue`, `confidenceLower`, `confidenceUpper`
  - `confidence`, `trend`, `trendMagnitude`
  - `explanation`, `modelVersion`, `status`
- [ ] Confidence values between 0-1
- [ ] Target dates in future
- [ ] Status = "active" for recent predictions

#### `modelMetadata` table
- [ ] Rows exist for trained models
- [ ] Columns include:
  - `id`, `modelVersion`, `modelType`
  - `trainedAt`, `trainingDuration`
  - `dataPointsUsed`, `dateRangeStart`, `dateRangeEnd`
  - `performanceMetrics` (JSON: mae, rmse, r2, accuracy)
  - `hyperparameters` (JSON)
  - `status`, `isLatest`
- [ ] Latest model has `isLatest = true`
- [ ] Performance metrics populated

#### `geoScoreHistory` table
- [ ] Historical data exists (6+ months)
- [ ] Scores between 0-100
- [ ] Dates in chronological order

## Performance Verification

### Response Times

**Target**: API responses < 2 seconds

```bash
# Test with browser DevTools Network tab
# Or use curl with timing:
time curl "http://localhost:3000/api/predictions?brandId=BRAND_ID"
```

**Verify**:
- [ ] GET /api/predictions: < 2s
- [ ] POST /api/predictions/train: < 500ms (returns immediately, processes async)
- [ ] GET /api/opportunities: < 2s

### Chart Render Performance

**Target**: Chart renders in < 1 second

Use React DevTools Profiler:
1. Open React DevTools
2. Go to Profiler tab
3. Click "Record"
4. Navigate to brand detail page
5. Stop recording

**Verify**:
- [ ] PredictiveChart render time < 1s
- [ ] No unnecessary re-renders
- [ ] Smooth interactions (tooltips, zoom)

## Troubleshooting

### Issue: No brands found

**Solution**: Create a brand first:
```bash
# Use the application UI to create a brand, or seed the database
npm run db:seed
```

### Issue: Insufficient historical data

**Solution**: The verification script generates synthetic data. If using real data:
- Ensure 90+ days of historical GEO scores exist
- Check `geoScoreHistory` table for data

### Issue: Database connection error

**Solution**:
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test database connection
npm run db:studio
```

### Issue: Predictions not displaying in UI

**Solution**:
1. Check browser console for errors
2. Verify API endpoints return data (use Network tab)
3. Ensure brand has predictions in database
4. Check authentication (logged in user)

### Issue: Alerts not triggering

**Solution**:
1. Verify predictions show >20% drop
2. Check confidence > 70%
3. Ensure current score is calculated
4. Review `shouldTriggerPredictiveAlert` logic

## Success Criteria

All verification steps pass when:

- âœ… Automated script completes without errors
- âœ… All 8 verification steps show green checkmarks
- âœ… Database tables contain valid data
- âœ… API endpoints return proper responses
- âœ… UI components render correctly
- âœ… Performance targets met (API < 2s, chart < 1s)
- âœ… No console errors or warnings
- âœ… Confidence intervals properly calculated
- âœ… Alerts trigger with correct metadata

## Next Steps

After successful verification:

1. âœ… Mark subtask-9-1 as completed
2. âœ… Commit changes with message:
   ```bash
   git add .
   git commit -m "auto-claude: subtask-9-1 - End-to-end verification of complete prediction flow"
   ```
3. âœ… Update implementation plan status
4. âœ… Proceed to subtask-9-2 (documentation) and subtask-9-3 (performance optimization)

## Additional Resources

- **ML Forecaster**: `src/lib/ml/forecaster.ts`
- **Data Pipeline**: `src/lib/ml/data-pipeline.ts`
- **Opportunity Detector**: `src/lib/ml/opportunity-detector.ts`
- **Predictive Alerts**: `src/lib/alerts/predictive-alerts.ts`
- **API Routes**: `src/app/api/predictions/`
- **Frontend Components**: `src/components/analytics/`
- **Database Schema**: `src/lib/db/schema/predictions.ts`

## Contact

For issues or questions about this verification process, refer to:
- Implementation Plan: `.auto-claude/specs/019-predictive-geo-trends/implementation_plan.json`
- Spec Document: `.auto-claude/specs/019-predictive-geo-trends/spec.md`
