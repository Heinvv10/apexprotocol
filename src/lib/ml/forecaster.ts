/**
 * TypeScript Forecasting Service
 * Uses simple-statistics for linear regression-based GEO score forecasting
 */

import {
  linearRegression,
  linearRegressionLine,
  mean,
  standardDeviation,
} from "simple-statistics";
import type { HistoricalDataPoint } from "./data-pipeline";
import { prepareDataForForecasting } from "./data-validator";

/**
 * Performance timing result
 */
export interface PerformanceTiming {
  dataPreparationMs: number;
  regressionCalculationMs: number;
  predictionGenerationMs: number;
  totalMs: number;
}

/**
 * In-memory cache for forecast results
 * Key: `${brandId}_${periods}_${dataHash}`
 */
const forecastCache = new Map<
  string,
  { result: ForecastResult; expiry: number; timing: PerformanceTiming }
>();

/**
 * Cache TTL in milliseconds (5 minutes for in-memory cache)
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Maximum cache size
 */
const MAX_CACHE_SIZE = 100;

/**
 * Generate a simple hash for cache key from data
 */
function generateDataHash(data: HistoricalDataPoint[]): string {
  if (data.length === 0) return "empty";
  const first = data[0];
  const last = data[data.length - 1];
  return `${data.length}_${first.date.getTime()}_${last.date.getTime()}_${first.score}_${last.score}`;
}

/**
 * Clean expired entries from cache
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of forecastCache.entries()) {
    if (value.expiry < now) {
      forecastCache.delete(key);
    }
  }
  // If still over limit, remove oldest entries
  if (forecastCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(forecastCache.entries());
    entries.sort((a, b) => a[1].expiry - b[1].expiry);
    const toRemove = entries.slice(0, forecastCache.size - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {
      forecastCache.delete(key);
    }
  }
}

/**
 * Get cached forecast if available
 */
function getCachedForecast(
  cacheKey: string
): { result: ForecastResult; timing: PerformanceTiming } | null {
  const cached = forecastCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return { result: cached.result, timing: cached.timing };
  }
  return null;
}

/**
 * Store forecast in cache
 */
function cacheForecast(
  cacheKey: string,
  result: ForecastResult,
  timing: PerformanceTiming
): void {
  cleanExpiredCache();
  forecastCache.set(cacheKey, {
    result,
    expiry: Date.now() + CACHE_TTL_MS,
    timing,
  });
}

/**
 * Single forecast prediction with confidence interval
 */
export interface ForecastPrediction {
  date: Date;
  predictedValue: number;
  confidenceLower: number;
  confidenceUpper: number;
  confidence: number; // 0-1 scale
}

/**
 * Complete forecast result with metadata
 */
export interface ForecastResult {
  predictions: ForecastPrediction[];
  modelMetadata: ModelMetadata;
  dataQuality: DataQualityInfo;
  isReliable: boolean;
  warnings: string[];
  timing?: PerformanceTiming; // Performance timing info
  cached?: boolean; // Whether result was from cache
}

/**
 * Model metadata for tracking and reproducibility
 */
export interface ModelMetadata {
  modelVersion: string;
  algorithm: "linear-regression";
  trainedAt: Date;
  trainingDataPoints: number;
  trainingDateRange: {
    start: Date;
    end: Date;
  };
  rSquared: number; // Goodness of fit (0-1)
  meanAbsoluteError: number;
  standardError: number;
}

/**
 * Data quality information
 */
export interface DataQualityInfo {
  totalPoints: number;
  interpolatedCount: number;
  outliersRemoved: number;
  gapsDetected: number;
  qualityScore: number; // 0-1 scale
}

/**
 * Configuration for forecasting
 */
export interface ForecastConfig {
  periods?: number; // Number of days to forecast (default: 90)
  confidenceLevel?: number; // Confidence level for intervals (default: 0.95 = 95%)
  minConfidenceThreshold?: number; // Minimum confidence to flag as reliable (default: 0.7)
  cacheKey?: string; // Optional cache key (e.g., brandId) for caching results
  skipCache?: boolean; // Force fresh computation, skip cache lookup
}

const DEFAULT_CONFIG: Required<Omit<ForecastConfig, "cacheKey">> & {
  cacheKey?: string;
} = {
  periods: 90,
  confidenceLevel: 0.95,
  minConfidenceThreshold: 0.7,
  skipCache: false,
};

const MODEL_VERSION = "1.0.0";

/**
 * Calculate R-squared (coefficient of determination)
 * Measures how well the regression line fits the data
 *
 * @param actual - Actual y values
 * @param predicted - Predicted y values
 * @returns R-squared value (0-1, higher is better)
 */
function calculateRSquared(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) {
    return 0;
  }

  const meanActual = mean(actual);

  // Total sum of squares
  const ssTot = actual.reduce(
    (sum, y) => sum + Math.pow(y - meanActual, 2),
    0
  );

  // Residual sum of squares
  const ssRes = actual.reduce(
    (sum, y, i) => sum + Math.pow(y - predicted[i], 2),
    0
  );

  if (ssTot === 0) {
    return 0;
  }

  const rSquared = 1 - ssRes / ssTot;

  // R-squared can be negative for very poor fits, clamp to 0
  return Math.max(0, rSquared);
}

/**
 * Calculate Mean Absolute Error (MAE)
 *
 * @param actual - Actual y values
 * @param predicted - Predicted y values
 * @returns Mean absolute error
 */
function calculateMAE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) {
    return 0;
  }

  const errors = actual.map((y, i) => Math.abs(y - predicted[i]));
  return mean(errors);
}

/**
 * Get confidence interval multiplier for given confidence level
 * Uses Z-score for normal distribution
 *
 * @param confidenceLevel - Confidence level (0-1)
 * @returns Z-score multiplier
 */
function getConfidenceMultiplier(confidenceLevel: number): number {
  // Common confidence levels
  const confidenceLevels: Record<number, number> = {
    0.99: 2.576, // 99%
    0.95: 1.96, // 95%
    0.9: 1.645, // 90%
    0.8: 1.282, // 80%
  };

  // Find closest match
  const closest = Object.keys(confidenceLevels)
    .map(Number)
    .reduce((prev, curr) =>
      Math.abs(curr - confidenceLevel) < Math.abs(prev - confidenceLevel)
        ? curr
        : prev
    );

  return confidenceLevels[closest];
}

/**
 * Forecast GEO scores using linear regression
 * Main forecasting function implementing the spec pattern
 *
 * @param historicalData - Historical data points (chronologically sorted)
 * @param config - Forecasting configuration
 * @returns Complete forecast result with predictions and metadata
 */
export async function forecastGeoScore(
  historicalData: HistoricalDataPoint[],
  config: ForecastConfig = {}
): Promise<ForecastResult> {
  const startTime = performance.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const warnings: string[] = [];

  // Check cache if cacheKey is provided and cache is not skipped
  const dataHash = generateDataHash(historicalData);
  const cacheKey = mergedConfig.cacheKey
    ? `${mergedConfig.cacheKey}_${mergedConfig.periods}_${dataHash}`
    : null;

  if (cacheKey && !mergedConfig.skipCache) {
    const cached = getCachedForecast(cacheKey);
    if (cached) {
      return {
        ...cached.result,
        cached: true,
        timing: cached.timing,
      };
    }
  }

  // Step 1: Prepare and validate data
  const prepStartTime = performance.now();
  const prepared = prepareDataForForecasting(historicalData);
  const prepEndTime = performance.now();

  if (!prepared.isReady) {
    throw new Error(
      `Data validation failed: ${prepared.validation.errors.map((e) => e.message).join(", ")}`
    );
  }

  // Add warnings from validation
  warnings.push(
    ...prepared.validation.warnings.map((w) => w.message)
  );

  const { data } = prepared;

  // Step 2: Transform data to [[x, y], ...] format for linear regression
  const regressionStartTime = performance.now();
  const dataPoints: [number, number][] = data.map((point, index) => [
    index, // x: time index
    point.score, // y: GEO score
  ]);

  // Step 3: Calculate linear regression
  const regression = linearRegression(dataPoints);
  const predict = linearRegressionLine(regression);

  // Step 4: Calculate residuals and standard error
  const actualScores = dataPoints.map(([, y]) => y);
  const predictedScores = dataPoints.map(([x]) => predict(x));
  const residuals = dataPoints.map(([x, y]) => y - predict(x));

  const stdError = standardDeviation(residuals);
  const rSquared = calculateRSquared(actualScores, predictedScores);
  const mae = calculateMAE(actualScores, predictedScores);

  // Step 5: Calculate confidence multiplier
  const confidenceMultiplier = getConfidenceMultiplier(
    mergedConfig.confidenceLevel
  );
  const regressionEndTime = performance.now();

  // Step 6: Generate predictions for future periods
  const predictionStartTime = performance.now();
  const predictions: ForecastPrediction[] = [];
  const startIndex = data.length;
  const lastDate = data[data.length - 1].date;

  for (let i = 0; i < mergedConfig.periods; i++) {
    const futureIndex = startIndex + i;
    const predictedValue = predict(futureIndex);

    // Calculate future date
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i + 1);

    // Calculate confidence interval
    // For linear regression, uncertainty increases as we forecast further out
    // Add a small penalty for distance from training data
    const distancePenalty = 1 + (i / mergedConfig.periods) * 0.2; // Up to 20% wider intervals
    const adjustedStdError = stdError * distancePenalty;

    const confidenceLower =
      predictedValue - confidenceMultiplier * adjustedStdError;
    const confidenceUpper =
      predictedValue + confidenceMultiplier * adjustedStdError;

    // Calculate confidence score (0-1)
    // Based on:
    // 1. How tight the confidence interval is (narrower = higher confidence)
    // 2. R-squared value (better fit = higher confidence)
    // 3. Distance from training data (closer = higher confidence)
    const intervalWidth = confidenceUpper - confidenceLower;
    const meanScore = mean(actualScores);
    const intervalConfidence = Math.max(
      0,
      1 - intervalWidth / (2 * meanScore)
    );
    const distanceConfidence = 1 - i / (mergedConfig.periods * 2); // Decrease confidence over time
    const confidence = Math.max(
      0,
      Math.min(1, (intervalConfidence + rSquared + distanceConfidence) / 3)
    );

    predictions.push({
      date: futureDate,
      predictedValue: Math.max(0, Math.min(100, predictedValue)), // Clamp to 0-100
      confidenceLower: Math.max(0, confidenceLower), // Clamp to 0 minimum
      confidenceUpper: Math.min(100, confidenceUpper), // Clamp to 100 maximum
      confidence,
    });
  }

  // Step 7: Check if forecast is reliable
  const avgConfidence =
    predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  const isReliable =
    avgConfidence >= mergedConfig.minConfidenceThreshold && rSquared >= 0.5;

  if (!isReliable) {
    if (avgConfidence < mergedConfig.minConfidenceThreshold) {
      warnings.push(
        `Low confidence predictions (average: ${(avgConfidence * 100).toFixed(1)}%). Predictions may be unreliable.`
      );
    }
    if (rSquared < 0.5) {
      warnings.push(
        `Poor model fit (RÂ² = ${rSquared.toFixed(2)}). Linear regression may not capture the data pattern well.`
      );
    }
  }

  // Step 8: Build result with metadata
  const endTime = performance.now();
  const predictionEndTime = endTime;

  const timing: PerformanceTiming = {
    dataPreparationMs: Math.round(prepEndTime - prepStartTime),
    regressionCalculationMs: Math.round(regressionEndTime - regressionStartTime),
    predictionGenerationMs: Math.round(predictionEndTime - predictionStartTime),
    totalMs: Math.round(endTime - startTime),
  };

  const result: ForecastResult = {
    predictions,
    modelMetadata: {
      modelVersion: MODEL_VERSION,
      algorithm: "linear-regression",
      trainedAt: new Date(),
      trainingDataPoints: data.length,
      trainingDateRange: {
        start: data[0].date,
        end: data[data.length - 1].date,
      },
      rSquared,
      meanAbsoluteError: mae,
      standardError: stdError,
    },
    dataQuality: {
      totalPoints: data.length,
      interpolatedCount: prepared.interpolation.interpolatedCount,
      outliersRemoved: prepared.outliers.outlierCount,
      gapsDetected: prepared.interpolation.gaps.length,
      qualityScore: Math.max(
        0,
        Math.min(
          1,
          (1 - prepared.outliers.removalRate / 100) *
            (1 - prepared.interpolation.interpolatedCount / data.length)
        )
      ),
    },
    isReliable,
    warnings,
    timing,
    cached: false,
  };

  // Cache the result if cacheKey was provided
  if (cacheKey) {
    cacheForecast(cacheKey, result, timing);
  }

  return result;
}

/**
 * Calculate trend direction from predictions
 *
 * @param predictions - Forecast predictions
 * @returns Trend direction: 'increasing', 'decreasing', or 'stable'
 */
export function calculateTrendDirection(
  predictions: ForecastPrediction[]
): "increasing" | "decreasing" | "stable" {
  if (predictions.length < 2) {
    return "stable";
  }

  const firstValue = predictions[0].predictedValue;
  const lastValue = predictions[predictions.length - 1].predictedValue;
  const change = lastValue - firstValue;
  const percentChange = (change / firstValue) * 100;

  // Threshold for "stable" is Â±5%
  if (Math.abs(percentChange) < 5) {
    return "stable";
  }

  return change > 0 ? "increasing" : "decreasing";
}

/**
 * Calculate predicted change magnitude
 *
 * @param currentValue - Current GEO score
 * @param predictions - Forecast predictions
 * @returns Change information
 */
export function calculatePredictedChange(
  currentValue: number,
  predictions: ForecastPrediction[]
): {
  absoluteChange: number;
  percentChange: number;
  targetValue: number;
  targetDate: Date;
} {
  if (predictions.length === 0) {
    return {
      absoluteChange: 0,
      percentChange: 0,
      targetValue: currentValue,
      targetDate: new Date(),
    };
  }

  // Use the final prediction as target
  const targetPrediction = predictions[predictions.length - 1];
  const absoluteChange = targetPrediction.predictedValue - currentValue;
  const percentChange = (absoluteChange / currentValue) * 100;

  return {
    absoluteChange,
    percentChange,
    targetValue: targetPrediction.predictedValue,
    targetDate: targetPrediction.date,
  };
}

/**
 * Identify predictions with low confidence
 *
 * @param predictions - Forecast predictions
 * @param threshold - Confidence threshold (default: 0.7)
 * @returns Low confidence predictions
 */
export function identifyLowConfidencePredictions(
  predictions: ForecastPrediction[],
  threshold: number = 0.7
): ForecastPrediction[] {
  return predictions.filter((p) => p.confidence < threshold);
}

/**
 * Get summary statistics for predictions
 *
 * @param predictions - Forecast predictions
 * @returns Summary statistics
 */
export function getPredictionSummary(predictions: ForecastPrediction[]): {
  minValue: number;
  maxValue: number;
  meanValue: number;
  avgConfidence: number;
  trend: "increasing" | "decreasing" | "stable";
} {
  if (predictions.length === 0) {
    return {
      minValue: 0,
      maxValue: 0,
      meanValue: 0,
      avgConfidence: 0,
      trend: "stable",
    };
  }

  const values = predictions.map((p) => p.predictedValue);
  const confidences = predictions.map((p) => p.confidence);

  return {
    minValue: Math.min(...values),
    maxValue: Math.max(...values),
    meanValue: mean(values),
    avgConfidence: mean(confidences),
    trend: calculateTrendDirection(predictions),
  };
}

/**
 * Batch forecast input
 */
export interface BatchForecastInput {
  id: string; // Entity identifier (e.g., brandId)
  data: HistoricalDataPoint[];
  config?: ForecastConfig;
}

/**
 * Batch forecast result
 */
export interface BatchForecastResult {
  id: string;
  result?: ForecastResult;
  error?: string;
  success: boolean;
}

/**
 * Batch forecast multiple entities in parallel
 * Optimized for performance when forecasting multiple brands/entities
 *
 * @param inputs - Array of batch forecast inputs
 * @param concurrency - Maximum concurrent forecasts (default: 5)
 * @returns Array of batch forecast results
 */
export async function batchForecast(
  inputs: BatchForecastInput[],
  concurrency: number = 5
): Promise<{
  results: BatchForecastResult[];
  totalMs: number;
  successCount: number;
  failureCount: number;
}> {
  const startTime = performance.now();
  const results: BatchForecastResult[] = [];

  // Process in batches to control concurrency
  for (let i = 0; i < inputs.length; i += concurrency) {
    const batch = inputs.slice(i, i + concurrency);
    const batchPromises = batch.map(async (input) => {
      try {
        const config = {
          ...input.config,
          cacheKey: input.id,
        };
        const result = await forecastGeoScore(input.data, config);
        return {
          id: input.id,
          result,
          success: true,
        };
      } catch (error) {
        return {
          id: input.id,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const endTime = performance.now();
  const successCount = results.filter((r) => r.success).length;

  return {
    results,
    totalMs: Math.round(endTime - startTime),
    successCount,
    failureCount: results.length - successCount,
  };
}

/**
 * Clear the forecast cache
 * Useful for testing or forcing fresh predictions
 */
export function clearForecastCache(): void {
  forecastCache.clear();
}

/**
 * Get current cache size
 */
export function getForecastCacheSize(): number {
  return forecastCache.size;
}

/**
 * Get cache statistics
 */
export function getForecastCacheStats(): {
  size: number;
  maxSize: number;
  ttlMs: number;
} {
  return {
    size: forecastCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttlMs: CACHE_TTL_MS,
  };
}
