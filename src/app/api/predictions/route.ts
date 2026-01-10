/**
 * Predictions API Route
 * GET /api/predictions?brandId=xxx&horizon=90
 * Returns GEO score predictions with confidence intervals
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brands, predictions, modelMetadata } from "@/lib/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { extractHistoricalScores } from "@/lib/ml/data-pipeline";
import { forecastGeoScore } from "@/lib/ml/forecaster";
import { generatePredictionExplanation } from "@/lib/ml/explainer";

/**
 * Prediction cache TTL in milliseconds (24 hours)
 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Valid horizon values (days to forecast)
 */
const VALID_HORIZONS = [30, 60, 90] as const;
type Horizon = (typeof VALID_HORIZONS)[number];

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
};

/**
 * Execute a function with exponential backoff retry
 *
 * @param fn - Async function to execute
 * @param retries - Number of retries (defaults to RETRY_CONFIG.maxRetries)
 * @returns Result of the function
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === retries) {
        break;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(
        RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelayMs
      );

      // Add jitter (Â±25%)
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      const actualDelay = Math.round(delay + jitter);

      await new Promise((resolve) => setTimeout(resolve, actualDelay));
    }
  }

  throw lastError;
}

/**
 * Performance timing tracker
 */
interface PerformanceTimings {
  authMs: number;
  cacheCheckMs: number;
  dataExtractionMs: number;
  forecastingMs: number;
  dbWriteMs: number;
  totalMs: number;
}

/**
 * Check if predictions are stale (older than 24 hours)
 */
function arePredictionsStale(predictionDate: Date): boolean {
  const age = Date.now() - predictionDate.getTime();
  return age > CACHE_TTL_MS;
}

/**
 * GET /api/predictions
 * Fetches GEO score predictions for a brand
 */
export async function GET(request: NextRequest) {
  const requestStartTime = performance.now();
  const timings: Partial<PerformanceTimings> = {};

  try {
    // Step 1: Authenticate
    const authStartTime = performance.now();
    const { userId } = await auth();
    timings.authMs = Math.round(performance.now() - authStartTime);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const horizonParam = searchParams.get("horizon");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Parse horizon with default value
    let horizon: Horizon = 90; // default
    if (horizonParam) {
      const parsedHorizon = parseInt(horizonParam, 10);
      if (!VALID_HORIZONS.includes(parsedHorizon as Horizon)) {
        return NextResponse.json(
          { error: `horizon must be one of: ${VALID_HORIZONS.join(", ")}` },
          { status: 400 }
        );
      }
      horizon = parsedHorizon as Horizon;
    }

    // Step 3: Verify brand exists and user has access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Step 4: Check for cached predictions (< 24 hours old)
    const cacheCheckStartTime = performance.now();
    const now = new Date();
    const cacheThreshold = new Date(now.getTime() - CACHE_TTL_MS);

    const cachedPredictions = await withRetry(() =>
      db.query.predictions.findMany({
        where: and(
          eq(predictions.brandId, brandId),
          eq(predictions.status, "active"),
          gte(predictions.predictionDate, cacheThreshold)
        ),
        orderBy: [desc(predictions.targetDate)],
        limit: horizon,
      })
    );
    timings.cacheCheckMs = Math.round(performance.now() - cacheCheckStartTime);

    // If we have valid cached predictions for this horizon, return them
    if (
      cachedPredictions.length > 0 &&
      !arePredictionsStale(cachedPredictions[0].predictionDate)
    ) {
      // Get latest model metadata
      const latestModel = await db.query.modelMetadata.findFirst({
        where: eq(modelMetadata.isLatest, true),
        orderBy: [desc(modelMetadata.trainedAt)],
      });

      // Format cached predictions for response
      const formattedPredictions = cachedPredictions.map((pred) => ({
        date: pred.targetDate.toISOString(),
        value: pred.predictedValue,
        confidenceLower: pred.confidenceLower,
        confidenceUpper: pred.confidenceUpper,
        confidence: Math.round(pred.confidence * 100), // Convert to percentage
        trend: pred.trend,
        explanation: pred.explanation || "No explanation available",
      }));

      return NextResponse.json({
        predictions: formattedPredictions,
        modelVersion: cachedPredictions[0].modelVersion,
        lastUpdated: cachedPredictions[0].predictionDate.toISOString(),
        cached: true,
        dataSource: "cache",
      });
    }

    // Step 5: Generate new predictions
    // Extract historical data (90+ days recommended)
    const extractionStartTime = performance.now();
    const extractionResult = await withRetry(() =>
      extractHistoricalScores(
        brandId,
        undefined, // start date (defaults to 90 days ago)
        undefined, // end date (defaults to now)
        { minDataPoints: 90 }
      )
    );
    timings.dataExtractionMs = Math.round(
      performance.now() - extractionStartTime
    );

    // Check if we have sufficient data
    if (!extractionResult.isValid) {
      return NextResponse.json(
        {
          error: "Insufficient historical data for predictions",
          details: extractionResult.validationErrors,
          dataPoints: extractionResult.dataPointCount,
          required: 90,
        },
        { status: 400 }
      );
    }

    // Generate forecast with caching enabled
    const forecastingStartTime = performance.now();
    const forecastResult = await forecastGeoScore(extractionResult.data, {
      periods: horizon,
      cacheKey: brandId,
    });
    timings.forecastingMs = Math.round(performance.now() - forecastingStartTime);

    // Generate explanation
    const explanation = generatePredictionExplanation(
      extractionResult.data,
      forecastResult
    );

    // Step 6: Store predictions in database
    const dbWriteStartTime = performance.now();
    const modelVersion = forecastResult.modelMetadata.modelVersion;
    const predictionDate = new Date();

    // Mark old predictions as superseded (with retry)
    await withRetry(() =>
      db
        .update(predictions)
        .set({ status: "superseded", updatedAt: predictionDate })
        .where(
          and(
            eq(predictions.brandId, brandId),
            eq(predictions.status, "active")
          )
        )
    );

    // Insert new predictions
    const newPredictions = forecastResult.predictions.map((pred) => ({
      brandId,
      entityType: "brand" as const,
      predictionDate,
      targetDate: pred.date,
      predictedValue: pred.predictedValue,
      confidenceLower: pred.confidenceLower,
      confidenceUpper: pred.confidenceUpper,
      confidence: pred.confidence,
      trend:
        pred.predictedValue >
        extractionResult.data[extractionResult.data.length - 1].score
          ? ("up" as const)
          : pred.predictedValue <
            extractionResult.data[extractionResult.data.length - 1].score
          ? ("down" as const)
          : ("stable" as const),
      trendMagnitude:
        ((pred.predictedValue -
          extractionResult.data[extractionResult.data.length - 1].score) /
          extractionResult.data[extractionResult.data.length - 1].score) *
        100,
      explanation: explanation.summary,
      modelVersion,
      status: "active" as const,
      metadata: {
        historicalDataPoints: forecastResult.modelMetadata.trainingDataPoints,
        dataQuality: Math.round(forecastResult.dataQuality.qualityScore * 100),
        algorithmUsed: forecastResult.modelMetadata.algorithm,
        warnings: forecastResult.warnings,
      },
    }));

    await withRetry(() => db.insert(predictions).values(newPredictions));

    // Step 7: Store model metadata if this is a new model version
    const existingModel = await withRetry(() =>
      db.query.modelMetadata.findFirst({
        where: eq(modelMetadata.modelVersion, modelVersion),
      })
    );

    if (!existingModel) {
      // Mark previous models as not latest
      await withRetry(() =>
        db
          .update(modelMetadata)
          .set({ isLatest: false, updatedAt: predictionDate })
      );

      // Insert new model metadata
      await withRetry(() =>
        db.insert(modelMetadata).values({
          modelVersion,
          modelType: "linear_regression",
          trainedAt: forecastResult.modelMetadata.trainedAt,
          dataPointsUsed: forecastResult.modelMetadata.trainingDataPoints,
          dateRangeStart: forecastResult.modelMetadata.trainingDateRange.start,
          dateRangeEnd: forecastResult.modelMetadata.trainingDateRange.end,
          performanceMetrics: {
            r2: forecastResult.modelMetadata.rSquared,
            mae: forecastResult.modelMetadata.meanAbsoluteError,
            avgConfidence:
              forecastResult.predictions.reduce(
                (sum, p) => sum + p.confidence,
                0
              ) / forecastResult.predictions.length,
          },
          hyperparameters: {
            predictionHorizon: horizon,
            lookbackPeriod: extractionResult.dataPointCount,
            confidenceLevel: 0.95,
            minDataPoints: 90,
          },
          status: "active",
          isLatest: true,
        })
      );
    }
    timings.dbWriteMs = Math.round(performance.now() - dbWriteStartTime);

    // Step 8: Format response
    const formattedPredictions = forecastResult.predictions.map((pred) => ({
      date: pred.date.toISOString(),
      value: pred.predictedValue,
      confidenceLower: pred.confidenceLower,
      confidenceUpper: pred.confidenceUpper,
      confidence: Math.round(pred.confidence * 100), // Convert to percentage
      trend:
        pred.predictedValue >
        extractionResult.data[extractionResult.data.length - 1].score
          ? "up"
          : pred.predictedValue <
            extractionResult.data[extractionResult.data.length - 1].score
          ? "down"
          : "stable",
      explanation: explanation.summary,
    }));

    // Calculate total timing
    timings.totalMs = Math.round(performance.now() - requestStartTime);

    // Create response with timing headers for performance monitoring
    const response = NextResponse.json(
      {
        predictions: formattedPredictions,
        modelVersion,
        lastUpdated: predictionDate.toISOString(),
        cached: forecastResult.cached || false,
        dataSource: forecastResult.cached ? "forecaster-cache" : "generated",
        metadata: {
          historicalDataPoints: forecastResult.modelMetadata.trainingDataPoints,
          dateRange: {
            start:
              forecastResult.modelMetadata.trainingDateRange.start.toISOString(),
            end: forecastResult.modelMetadata.trainingDateRange.end.toISOString(),
          },
          dataQuality: Math.round(
            forecastResult.dataQuality.qualityScore * 100
          ),
          modelFit: {
            rSquared: forecastResult.modelMetadata.rSquared,
            meanAbsoluteError: forecastResult.modelMetadata.meanAbsoluteError,
          },
          isReliable: forecastResult.isReliable,
          warnings: forecastResult.warnings,
        },
        explanation: {
          summary: explanation.summary,
          trendDescription: explanation.trendDescription,
          confidenceFactors: explanation.confidenceFactors,
          dataQualityNote: explanation.dataQualityNote,
          fullExplanation: explanation.fullExplanation,
        },
        performance: {
          timings: timings as PerformanceTimings,
          forecasterTiming: forecastResult.timing,
        },
      },
      { status: 200 }
    );

    // Add Server-Timing header for performance monitoring
    response.headers.set(
      "Server-Timing",
      Object.entries(timings)
        .map(([key, value]) => `${key};dur=${value}`)
        .join(", ")
    );

    return response;
  } catch (error) {
    const totalMs = Math.round(performance.now() - requestStartTime);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Data validation failed")) {
        const response = NextResponse.json(
          {
            error: "Data quality issues prevented prediction generation",
            details: error.message,
            performance: { totalMs },
          },
          { status: 400 }
        );
        response.headers.set("Server-Timing", `totalMs;dur=${totalMs}`);
        return response;
      }
    }

    const response = NextResponse.json(
      {
        error: "Internal server error",
        performance: { totalMs },
      },
      { status: 500 }
    );
    response.headers.set("Server-Timing", `totalMs;dur=${totalMs}`);
    return response;
  }
}
