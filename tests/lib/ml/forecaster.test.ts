/**
 * Tests for TypeScript Forecasting Service
 * Tests linear regression forecasting, confidence intervals, and prediction quality
 */

import { describe, it, expect, vi } from "vitest";
import {
  forecastGeoScore,
  calculateTrendDirection,
  calculatePredictedChange,
  identifyLowConfidencePredictions,
  getPredictionSummary,
  type ForecastPrediction,
} from "../../../src/lib/ml/forecaster";
import type { HistoricalDataPoint } from "../../../src/lib/ml/data-pipeline";

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Generate mock historical data with linear trend
 * Note: days parameter is the number of days the data should span
 * The function generates days + 1 data points to ensure the date range is exactly `days` days
 */
function generateLinearTrendData(
  days: number,
  startScore: number,
  dailyChange: number
): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Generate days + 1 data points to span exactly `days` days
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    data.push({
      date,
      score: startScore + i * dailyChange,
    });
  }

  return data;
}

/**
 * Generate mock historical data with noise
 * Note: days parameter is the number of days the data should span
 * The function generates days + 1 data points to ensure the date range is exactly `days` days
 */
function generateNoisyData(
  days: number,
  baseScore: number,
  noiseLevel: number
): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Generate days + 1 data points to span exactly `days` days
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const noise = (Math.random() - 0.5) * 2 * noiseLevel;
    data.push({
      date,
      score: Math.max(0, Math.min(100, baseScore + noise)),
    });
  }

  return data;
}

/**
 * Generate stable data (no trend)
 */
function generateStableData(days: number, score: number): HistoricalDataPoint[] {
  return generateNoisyData(days, score, 1); // Very low noise
}

// ============================================================================
// forecastGeoScore Tests
// ============================================================================

describe("forecastGeoScore", () => {
  it("should forecast upward trend correctly", async () => {
    // 90 days of upward trend: 60 -> 90 (0.33 points per day)
    const data = generateLinearTrendData(90, 60, 0.33);

    const result = await forecastGeoScore(data, { periods: 30 });

    expect(result.predictions).toHaveLength(30);
    expect(result.predictions[0].predictedValue).toBeGreaterThan(
      data[data.length - 1].score
    );
    expect(
      result.predictions[29].predictedValue
    ).toBeGreaterThan(result.predictions[0].predictedValue);
    expect(result.modelMetadata.algorithm).toBe("linear-regression");
  });

  it("should forecast downward trend correctly", async () => {
    // 90 days of downward trend: 80 -> 50
    const data = generateLinearTrendData(90, 80, -0.33);

    const result = await forecastGeoScore(data, { periods: 30 });

    expect(result.predictions).toHaveLength(30);
    expect(result.predictions[0].predictedValue).toBeLessThan(
      data[data.length - 1].score
    );
    expect(result.predictions[29].predictedValue).toBeLessThan(
      result.predictions[0].predictedValue
    );
  });

  it("should include confidence intervals for all predictions", async () => {
    const data = generateLinearTrendData(90, 70, 0.1);

    const result = await forecastGeoScore(data, { periods: 60 });

    result.predictions.forEach((prediction) => {
      expect(prediction.confidenceLower).toBeDefined();
      expect(prediction.confidenceUpper).toBeDefined();
      // Confidence intervals should include the predicted value (or equal in rare cases)
      expect(prediction.confidenceLower).toBeLessThanOrEqual(
        prediction.predictedValue
      );
      expect(prediction.confidenceUpper).toBeGreaterThanOrEqual(
        prediction.predictedValue
      );
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });
  });

  it("should have wider confidence intervals for distant predictions", async () => {
    const data = generateLinearTrendData(90, 70, 0.1);

    const result = await forecastGeoScore(data, { periods: 90 });

    const firstInterval =
      result.predictions[0].confidenceUpper -
      result.predictions[0].confidenceLower;
    const lastInterval =
      result.predictions[89].confidenceUpper -
      result.predictions[89].confidenceLower;

    // Last interval should be wider or equal (less confident)
    expect(lastInterval).toBeGreaterThanOrEqual(firstInterval);
  });

  it("should decrease confidence for distant predictions", async () => {
    const data = generateLinearTrendData(90, 70, 0.1);

    const result = await forecastGeoScore(data, { periods: 90 });

    // Confidence should generally decrease over time
    const firstConfidence = result.predictions[0].confidence;
    const lastConfidence = result.predictions[89].confidence;

    expect(lastConfidence).toBeLessThan(firstConfidence);
  });

  it("should clamp predictions to 0-100 range", async () => {
    // Create data that would exceed 100 after forecasting but is valid during training
    // Start at 50 and increase by 0.5 per day, so after 91 days we're at ~95
    // Then forecast 20 more days which would go to ~105 without clamping
    const data = generateLinearTrendData(90, 50, 0.5);

    const result = await forecastGeoScore(data, { periods: 20 });

    // Check that predictions are clamped to 0-100 even though trend would exceed it
    result.predictions.forEach((prediction) => {
      expect(prediction.predictedValue).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedValue).toBeLessThanOrEqual(100);
      expect(prediction.confidenceLower).toBeGreaterThanOrEqual(0);
      expect(prediction.confidenceUpper).toBeLessThanOrEqual(100);
    });
  });

  it("should include model metadata", async () => {
    const data = generateLinearTrendData(90, 70, 0.2);

    const result = await forecastGeoScore(data);

    expect(result.modelMetadata).toBeDefined();
    expect(result.modelMetadata.modelVersion).toBeDefined();
    expect(result.modelMetadata.algorithm).toBe("linear-regression");
    expect(result.modelMetadata.trainedAt).toBeInstanceOf(Date);
    // Data length is 91 because we generate 91 points to span 90 days
    expect(result.modelMetadata.trainingDataPoints).toBeGreaterThanOrEqual(90);
    expect(result.modelMetadata.trainingDateRange.start).toBeInstanceOf(Date);
    expect(result.modelMetadata.trainingDateRange.end).toBeInstanceOf(Date);
    expect(result.modelMetadata.rSquared).toBeGreaterThanOrEqual(0);
    expect(result.modelMetadata.rSquared).toBeLessThanOrEqual(1);
    expect(result.modelMetadata.meanAbsoluteError).toBeGreaterThanOrEqual(0);
    expect(result.modelMetadata.standardError).toBeGreaterThanOrEqual(0);
  });

  it("should include data quality information", async () => {
    const data = generateLinearTrendData(90, 70, 0.2);

    const result = await forecastGeoScore(data);

    expect(result.dataQuality).toBeDefined();
    // Data length is 91 because we generate 91 points to span 90 days
    expect(result.dataQuality.totalPoints).toBeGreaterThanOrEqual(90);
    expect(result.dataQuality.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQuality.qualityScore).toBeLessThanOrEqual(1);
  });

  it("should flag predictions as unreliable for very noisy data", async () => {
    // Very noisy data with no clear trend
    const data = generateNoisyData(90, 70, 30); // High noise

    const result = await forecastGeoScore(data);

    // Either low R-squared or low confidence should trigger unreliable flag
    expect(result.isReliable).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("should flag predictions as reliable for clean linear data", async () => {
    const data = generateLinearTrendData(90, 70, 0.2);

    const result = await forecastGeoScore(data);

    expect(result.isReliable).toBe(true);
  });

  it("should respect custom periods configuration", async () => {
    const data = generateLinearTrendData(90, 70, 0.2);

    const result30 = await forecastGeoScore(data, { periods: 30 });
    const result60 = await forecastGeoScore(data, { periods: 60 });
    const result90 = await forecastGeoScore(data, { periods: 90 });

    expect(result30.predictions).toHaveLength(30);
    expect(result60.predictions).toHaveLength(60);
    expect(result90.predictions).toHaveLength(90);
  });

  it("should respect custom confidence level", async () => {
    const data = generateLinearTrendData(90, 70, 0.2);

    const result95 = await forecastGeoScore(data, { confidenceLevel: 0.95 });
    const result80 = await forecastGeoScore(data, { confidenceLevel: 0.8 });

    // 95% confidence interval should be wider than or equal to 80%
    const interval95 =
      result95.predictions[0].confidenceUpper -
      result95.predictions[0].confidenceLower;
    const interval80 =
      result80.predictions[0].confidenceUpper -
      result80.predictions[0].confidenceLower;

    expect(interval95).toBeGreaterThanOrEqual(interval80);
  });

  it("should generate predictions with incrementing dates", async () => {
    const data = generateLinearTrendData(90, 70, 0.2);

    const result = await forecastGeoScore(data, { periods: 30 });

    for (let i = 1; i < result.predictions.length; i++) {
      const prevDate = result.predictions[i - 1].date;
      const currDate = result.predictions[i].date;
      const diffDays =
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffDays).toBe(1); // Exactly 1 day apart
    }
  });

  it("should start predictions from day after last historical data point", async () => {
    const data = generateLinearTrendData(90, 70, 0.2);
    const lastHistoricalDate = data[data.length - 1].date;

    const result = await forecastGeoScore(data, { periods: 30 });

    const firstPredictionDate = result.predictions[0].date;
    const diffDays =
      (firstPredictionDate.getTime() - lastHistoricalDate.getTime()) /
      (1000 * 60 * 60 * 24);

    expect(diffDays).toBe(1); // First prediction is next day
  });

  it("should throw error for insufficient data", async () => {
    const insufficientData = generateLinearTrendData(20, 70, 0.2); // Only 20 days

    await expect(forecastGeoScore(insufficientData)).rejects.toThrow(
      /Data validation failed/
    );
  });

  it("should throw error for invalid data", async () => {
    const invalidData: HistoricalDataPoint[] = [
      { date: new Date(), score: NaN },
      { date: new Date(), score: 120 }, // Out of range
    ];

    await expect(forecastGeoScore(invalidData)).rejects.toThrow(
      /Data validation failed/
    );
  });

  it("should have high R-squared for perfect linear data", async () => {
    const perfectLinearData = generateLinearTrendData(90, 60, 0.3);

    const result = await forecastGeoScore(perfectLinearData);

    // Perfect linear data should have RÂ² close to 1
    expect(result.modelMetadata.rSquared).toBeGreaterThan(0.95);
  });

  it("should have low standard error for clean data", async () => {
    const cleanData = generateLinearTrendData(90, 70, 0.2);

    const result = await forecastGeoScore(cleanData);

    // Clean linear data should have very low standard error
    expect(result.modelMetadata.standardError).toBeLessThan(1);
  });
});

// ============================================================================
// calculateTrendDirection Tests
// ============================================================================

describe("calculateTrendDirection", () => {
  it("should identify increasing trend", () => {
    const predictions: ForecastPrediction[] = [
      {
        date: new Date(),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.8,
      },
      {
        date: new Date(),
        predictedValue: 80,
        confidenceLower: 75,
        confidenceUpper: 85,
        confidence: 0.75,
      },
    ];

    const trend = calculateTrendDirection(predictions);

    expect(trend).toBe("increasing");
  });

  it("should identify decreasing trend", () => {
    const predictions: ForecastPrediction[] = [
      {
        date: new Date(),
        predictedValue: 80,
        confidenceLower: 75,
        confidenceUpper: 85,
        confidence: 0.8,
      },
      {
        date: new Date(),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.75,
      },
    ];

    const trend = calculateTrendDirection(predictions);

    expect(trend).toBe("decreasing");
  });

  it("should identify stable trend for small changes", () => {
    const predictions: ForecastPrediction[] = [
      {
        date: new Date(),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.8,
      },
      {
        date: new Date(),
        predictedValue: 71,
        confidenceLower: 66,
        confidenceUpper: 76,
        confidence: 0.8,
      },
    ];

    const trend = calculateTrendDirection(predictions);

    expect(trend).toBe("stable");
  });

  it("should return stable for empty predictions", () => {
    const trend = calculateTrendDirection([]);

    expect(trend).toBe("stable");
  });

  it("should return stable for single prediction", () => {
    const predictions: ForecastPrediction[] = [
      {
        date: new Date(),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.8,
      },
    ];

    const trend = calculateTrendDirection(predictions);

    expect(trend).toBe("stable");
  });
});

// ============================================================================
// calculatePredictedChange Tests
// ============================================================================

describe("calculatePredictedChange", () => {
  it("should calculate positive change correctly", () => {
    const currentValue = 70;
    const predictions: ForecastPrediction[] = [
      {
        date: new Date("2024-02-01"),
        predictedValue: 80,
        confidenceLower: 75,
        confidenceUpper: 85,
        confidence: 0.8,
      },
    ];

    const change = calculatePredictedChange(currentValue, predictions);

    expect(change.absoluteChange).toBe(10);
    expect(change.percentChange).toBeCloseTo(14.29, 1);
    expect(change.targetValue).toBe(80);
  });

  it("should calculate negative change correctly", () => {
    const currentValue = 80;
    const predictions: ForecastPrediction[] = [
      {
        date: new Date("2024-02-01"),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.8,
      },
    ];

    const change = calculatePredictedChange(currentValue, predictions);

    expect(change.absoluteChange).toBe(-10);
    expect(change.percentChange).toBe(-12.5);
    expect(change.targetValue).toBe(70);
  });

  it("should use last prediction as target", () => {
    const currentValue = 70;
    const predictions: ForecastPrediction[] = [
      {
        date: new Date("2024-02-01"),
        predictedValue: 75,
        confidenceLower: 70,
        confidenceUpper: 80,
        confidence: 0.8,
      },
      {
        date: new Date("2024-03-01"),
        predictedValue: 85,
        confidenceLower: 80,
        confidenceUpper: 90,
        confidence: 0.75,
      },
    ];

    const change = calculatePredictedChange(currentValue, predictions);

    expect(change.targetValue).toBe(85);
    expect(change.absoluteChange).toBe(15);
  });

  it("should handle empty predictions", () => {
    const currentValue = 70;

    const change = calculatePredictedChange(currentValue, []);

    expect(change.absoluteChange).toBe(0);
    expect(change.percentChange).toBe(0);
    expect(change.targetValue).toBe(70);
  });
});

// ============================================================================
// identifyLowConfidencePredictions Tests
// ============================================================================

describe("identifyLowConfidencePredictions", () => {
  it("should identify predictions below threshold", () => {
    const predictions: ForecastPrediction[] = [
      {
        date: new Date(),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.8,
      },
      {
        date: new Date(),
        predictedValue: 72,
        confidenceLower: 65,
        confidenceUpper: 79,
        confidence: 0.6,
      },
      {
        date: new Date(),
        predictedValue: 74,
        confidenceLower: 65,
        confidenceUpper: 83,
        confidence: 0.5,
      },
    ];

    const lowConfidence = identifyLowConfidencePredictions(predictions, 0.7);

    expect(lowConfidence).toHaveLength(2);
    expect(lowConfidence[0].confidence).toBe(0.6);
    expect(lowConfidence[1].confidence).toBe(0.5);
  });

  it("should return empty array when all predictions are high confidence", () => {
    const predictions: ForecastPrediction[] = [
      {
        date: new Date(),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.9,
      },
      {
        date: new Date(),
        predictedValue: 72,
        confidenceLower: 67,
        confidenceUpper: 77,
        confidence: 0.85,
      },
    ];

    const lowConfidence = identifyLowConfidencePredictions(predictions, 0.7);

    expect(lowConfidence).toHaveLength(0);
  });

  it("should use default threshold of 0.7", () => {
    const predictions: ForecastPrediction[] = [
      {
        date: new Date(),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.65,
      },
    ];

    const lowConfidence = identifyLowConfidencePredictions(predictions);

    expect(lowConfidence).toHaveLength(1);
  });
});

// ============================================================================
// getPredictionSummary Tests
// ============================================================================

describe("getPredictionSummary", () => {
  it("should calculate summary statistics correctly", () => {
    const predictions: ForecastPrediction[] = [
      {
        date: new Date(),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.9,
      },
      {
        date: new Date(),
        predictedValue: 75,
        confidenceLower: 70,
        confidenceUpper: 80,
        confidence: 0.85,
      },
      {
        date: new Date(),
        predictedValue: 80,
        confidenceLower: 75,
        confidenceUpper: 85,
        confidence: 0.8,
      },
    ];

    const summary = getPredictionSummary(predictions);

    expect(summary.minValue).toBe(70);
    expect(summary.maxValue).toBe(80);
    expect(summary.meanValue).toBe(75);
    expect(summary.avgConfidence).toBeCloseTo(0.85, 2);
    expect(summary.trend).toBe("increasing");
  });

  it("should handle empty predictions", () => {
    const summary = getPredictionSummary([]);

    expect(summary.minValue).toBe(0);
    expect(summary.maxValue).toBe(0);
    expect(summary.meanValue).toBe(0);
    expect(summary.avgConfidence).toBe(0);
    expect(summary.trend).toBe("stable");
  });

  it("should identify stable trend in summary", () => {
    const predictions: ForecastPrediction[] = [
      {
        date: new Date(),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.9,
      },
      {
        date: new Date(),
        predictedValue: 71,
        confidenceLower: 66,
        confidenceUpper: 76,
        confidence: 0.9,
      },
    ];

    const summary = getPredictionSummary(predictions);

    expect(summary.trend).toBe("stable");
  });

  it("should identify decreasing trend in summary", () => {
    const predictions: ForecastPrediction[] = [
      {
        date: new Date(),
        predictedValue: 80,
        confidenceLower: 75,
        confidenceUpper: 85,
        confidence: 0.9,
      },
      {
        date: new Date(),
        predictedValue: 70,
        confidenceLower: 65,
        confidenceUpper: 75,
        confidence: 0.85,
      },
    ];

    const summary = getPredictionSummary(predictions);

    expect(summary.trend).toBe("decreasing");
  });
});

// ============================================================================
// Edge Cases and Integration Tests
// ============================================================================

describe("Forecaster Edge Cases", () => {
  it("should handle data with outliers removed during preparation", async () => {
    const data = generateLinearTrendData(90, 70, 0.2);
    // Add some outliers that should be removed
    data[10] = { date: data[10].date, score: 200 }; // Extreme outlier
    data[50] = { date: data[50].date, score: -10 }; // Extreme outlier

    const result = await forecastGeoScore(data);

    // Should successfully forecast despite outliers
    expect(result.predictions.length).toBeGreaterThan(0);
    expect(result.dataQuality.outliersRemoved).toBeGreaterThan(0);
  });

  it("should handle stable data (no trend)", async () => {
    const stableData = generateStableData(90, 75);

    const result = await forecastGeoScore(stableData, { periods: 30 });

    // Predictions should remain around the stable value
    result.predictions.forEach((prediction) => {
      expect(prediction.predictedValue).toBeGreaterThan(70);
      expect(prediction.predictedValue).toBeLessThan(80);
    });
  });

  it("should produce consistent results for same data", async () => {
    const data = generateLinearTrendData(90, 70, 0.2);

    const result1 = await forecastGeoScore(data, { periods: 30 });
    const result2 = await forecastGeoScore(data, { periods: 30 });

    // Same input should produce same output
    expect(result1.predictions[0].predictedValue).toBeCloseTo(
      result2.predictions[0].predictedValue,
      2
    );
    expect(result1.predictions[29].predictedValue).toBeCloseTo(
      result2.predictions[29].predictedValue,
      2
    );
  });

  it("should include warnings in result", async () => {
    const noisyData = generateNoisyData(90, 70, 20);

    const result = await forecastGeoScore(noisyData);

    // Noisy data should generate warnings
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
