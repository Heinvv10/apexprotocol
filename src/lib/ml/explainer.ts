/**
 * Prediction Explanation Generation
 * Generates human-readable explanations for ML forecast predictions
 * Implements template-based approach with trend, seasonality, and confidence factors
 */

import type {
  ForecastResult,
  ForecastPrediction,
  ModelMetadata,
  DataQualityInfo,
} from "./forecaster";
import type { HistoricalDataPoint } from "./data-pipeline";

/**
 * Explanation components
 */
export interface PredictionExplanation {
  summary: string; // High-level explanation
  trendDescription: string; // Trend direction and magnitude
  confidenceFactors: string[]; // Reasons for confidence level
  dataQualityNote?: string; // Optional note about data quality issues
  warnings?: string[]; // Optional warnings about reliability
  fullExplanation: string; // Combined comprehensive explanation
}

/**
 * Trend analysis result
 */
interface TrendAnalysis {
  direction: "increasing" | "decreasing" | "stable";
  magnitude: number; // Absolute change
  percentChange: number; // Percentage change
  strength: "strong" | "moderate" | "weak";
}

/**
 * Seasonality detection result
 */
interface SeasonalityAnalysis {
  hasSeasonality: boolean;
  pattern?: "weekly" | "monthly" | "none";
  confidence: number; // 0-1
  description: string;
}

/**
 * Analyze trend from historical data and predictions
 *
 * @param historicalData - Historical data points
 * @param predictions - Future predictions
 * @returns Trend analysis
 */
function analyzeTrend(
  historicalData: HistoricalDataPoint[],
  predictions: ForecastPrediction[]
): TrendAnalysis {
  if (historicalData.length === 0 || predictions.length === 0) {
    return {
      direction: "stable",
      magnitude: 0,
      percentChange: 0,
      strength: "weak",
    };
  }

  const currentValue = historicalData[historicalData.length - 1].score;
  const predictedValue = predictions[predictions.length - 1].predictedValue;
  const magnitude = predictedValue - currentValue;
  const percentChange = (magnitude / currentValue) * 100;

  // Determine direction
  let direction: "increasing" | "decreasing" | "stable" = "stable";
  if (Math.abs(percentChange) >= 5) {
    direction = percentChange > 0 ? "increasing" : "decreasing";
  }

  // Determine strength based on magnitude
  let strength: "strong" | "moderate" | "weak" = "weak";
  if (Math.abs(percentChange) >= 20) {
    strength = "strong";
  } else if (Math.abs(percentChange) >= 10) {
    strength = "moderate";
  }

  return {
    direction,
    magnitude,
    percentChange,
    strength,
  };
}

/**
 * Detect seasonality patterns in historical data
 *
 * @param historicalData - Historical data points
 * @returns Seasonality analysis
 */
function detectSeasonality(
  historicalData: HistoricalDataPoint[]
): SeasonalityAnalysis {
  if (historicalData.length < 30) {
    return {
      hasSeasonality: false,
      pattern: "none",
      confidence: 0,
      description: "Insufficient data to detect seasonal patterns",
    };
  }

  // Calculate variance in 7-day windows for weekly patterns
  const weeklyVariance = calculateWindowVariance(historicalData, 7);

  // Calculate variance in 30-day windows for monthly patterns
  const monthlyVariance = calculateWindowVariance(historicalData, 30);

  // For MVP, use simple heuristics
  // If variance is low in weekly windows, there might be weekly patterns
  const hasWeeklyPattern = weeklyVariance > 5 && weeklyVariance < 15;
  const hasMonthlyPattern = monthlyVariance > 10 && monthlyVariance < 25;

  if (hasWeeklyPattern) {
    return {
      hasSeasonality: true,
      pattern: "weekly",
      confidence: 0.6,
      description: "Detected weekly fluctuation patterns in historical data",
    };
  } else if (hasMonthlyPattern) {
    return {
      hasSeasonality: true,
      pattern: "monthly",
      confidence: 0.5,
      description: "Detected monthly variation patterns in historical data",
    };
  }

  return {
    hasSeasonality: false,
    pattern: "none",
    confidence: 0.8,
    description: "No significant seasonal patterns detected",
  };
}

/**
 * Calculate variance in sliding windows
 *
 * @param data - Historical data points
 * @param windowSize - Size of window in days
 * @returns Average variance across windows
 */
function calculateWindowVariance(
  data: HistoricalDataPoint[],
  windowSize: number
): number {
  if (data.length < windowSize) {
    return 0;
  }

  const variances: number[] = [];

  for (let i = 0; i <= data.length - windowSize; i++) {
    const window = data.slice(i, i + windowSize);
    const scores = window.map((d) => d.score);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    variances.push(variance);
  }

  return variances.reduce((sum, v) => sum + v, 0) / variances.length;
}

/**
 * Assess historical data stability
 *
 * @param historicalData - Historical data points
 * @returns Stability score (0-1) and description
 */
function assessHistoricalStability(historicalData: HistoricalDataPoint[]): {
  stability: number;
  description: string;
} {
  if (historicalData.length === 0) {
    return { stability: 0, description: "No historical data" };
  }

  const scores = historicalData.map((d) => d.score);
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (lower is more stable)
  const cv = mean === 0 ? 0 : stdDev / mean;

  // Convert to stability score (0-1, higher is more stable)
  const stability = Math.max(0, Math.min(1, 1 - cv));

  let description = "";
  if (stability >= 0.8) {
    description = "very stable historical pattern";
  } else if (stability >= 0.6) {
    description = "moderately stable historical pattern";
  } else if (stability >= 0.4) {
    description = "some historical variability";
  } else {
    description = "highly variable historical data";
  }

  return { stability, description };
}

/**
 * Generate confidence factors explanation
 *
 * @param modelMetadata - Model metadata
 * @param dataQuality - Data quality information
 * @param stabilityAnalysis - Historical stability analysis
 * @param seasonality - Seasonality analysis
 * @returns Array of confidence factor descriptions
 */
function generateConfidenceFactors(
  modelMetadata: ModelMetadata,
  dataQuality: DataQualityInfo,
  stabilityAnalysis: { stability: number; description: string },
  seasonality: SeasonalityAnalysis
): string[] {
  const factors: string[] = [];

  // R-squared factor
  if (modelMetadata.rSquared >= 0.8) {
    factors.push("excellent model fit to historical data");
  } else if (modelMetadata.rSquared >= 0.6) {
    factors.push("good model fit to historical data");
  } else if (modelMetadata.rSquared >= 0.4) {
    factors.push("moderate model fit to historical data");
  } else {
    factors.push("limited model fit - complex patterns may not be captured");
  }

  // Historical stability factor
  factors.push(stabilityAnalysis.description);

  // Data quality factor
  if (dataQuality.qualityScore >= 0.9) {
    factors.push("high-quality data with minimal gaps or outliers");
  } else if (dataQuality.qualityScore >= 0.7) {
    factors.push("good data quality with some minor adjustments");
  } else {
    factors.push(
      `data required ${dataQuality.interpolatedCount} interpolations and ${dataQuality.outliersRemoved} outlier removals`
    );
  }

  // Training data quantity factor
  if (modelMetadata.trainingDataPoints >= 120) {
    factors.push(`${modelMetadata.trainingDataPoints} days of training data`);
  } else if (modelMetadata.trainingDataPoints >= 90) {
    factors.push(
      `${modelMetadata.trainingDataPoints} days of training data (minimum met)`
    );
  } else {
    factors.push(
      `limited training data (${modelMetadata.trainingDataPoints} days)`
    );
  }

  // Seasonality factor
  if (seasonality.hasSeasonality) {
    factors.push(seasonality.description);
  }

  return factors;
}

/**
 * Generate human-readable explanation for predictions
 *
 * @param historicalData - Historical data points
 * @param forecastResult - Complete forecast result
 * @returns Structured prediction explanation
 */
export function generatePredictionExplanation(
  historicalData: HistoricalDataPoint[],
  forecastResult: ForecastResult
): PredictionExplanation {
  const { predictions, modelMetadata, dataQuality, isReliable, warnings } =
    forecastResult;

  // Analyze trend
  const trendAnalysis = analyzeTrend(historicalData, predictions);

  // Detect seasonality
  const seasonality = detectSeasonality(historicalData);

  // Assess historical stability
  const stabilityAnalysis = assessHistoricalStability(historicalData);

  // Calculate average confidence
  const avgConfidence =
    predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  const confidencePercent = Math.round(avgConfidence * 100);

  // Generate confidence factors
  const confidenceFactors = generateConfidenceFactors(
    modelMetadata,
    dataQuality,
    stabilityAnalysis,
    seasonality
  );

  // Build trend description
  const trendDescription = buildTrendDescription(trendAnalysis, predictions);

  // Build summary
  const summary = buildSummary(
    trendAnalysis,
    predictions,
    confidencePercent,
    isReliable
  );

  // Build data quality note if needed
  const dataQualityNote = buildDataQualityNote(dataQuality);

  // Build full explanation
  const fullExplanation = buildFullExplanation(
    summary,
    trendDescription,
    confidencePercent,
    confidenceFactors,
    dataQualityNote,
    warnings
  );

  return {
    summary,
    trendDescription,
    confidenceFactors,
    dataQualityNote,
    warnings: warnings.length > 0 ? warnings : undefined,
    fullExplanation,
  };
}

/**
 * Build trend description string
 *
 * @param trend - Trend analysis
 * @param predictions - Forecast predictions
 * @returns Trend description
 */
function buildTrendDescription(
  trend: TrendAnalysis,
  predictions: ForecastPrediction[]
): string {
  const direction =
    trend.direction === "stable" ? "stable" : `${trend.direction}`;
  const strength = trend.strength;
  const absChange = Math.abs(trend.magnitude).toFixed(1);
  const percentChange = Math.abs(trend.percentChange).toFixed(1);
  const forecastPeriod = predictions.length;

  if (trend.direction === "stable") {
    return `GEO score expected to remain stable over the next ${forecastPeriod} days with minimal change (Â±${percentChange}%)`;
  }

  return `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction} trend predicted over ${forecastPeriod} days, with an expected change of ${absChange} points (${percentChange}%)`;
}

/**
 * Build summary string (template-based)
 *
 * @param trend - Trend analysis
 * @param predictions - Forecast predictions
 * @param confidencePercent - Confidence percentage
 * @param isReliable - Whether prediction is reliable
 * @returns Summary string
 */
function buildSummary(
  trend: TrendAnalysis,
  predictions: ForecastPrediction[],
  confidencePercent: number,
  isReliable: boolean
): string {
  const period = predictions.length;
  const direction =
    trend.direction === "stable" ? "stable trend" : `${trend.direction} trend`;
  const changeMagnitude =
    trend.direction === "stable"
      ? "minimal change"
      : `${Math.abs(trend.percentChange).toFixed(1)}% ${trend.direction === "increasing" ? "increase" : "decrease"}`;

  const reliabilityNote = isReliable ? "" : " (low reliability)";

  return `Based on ${direction} over ${period} days, predict ${changeMagnitude}. Confidence ${confidencePercent}%${reliabilityNote}.`;
}

/**
 * Build data quality note if there are issues
 *
 * @param dataQuality - Data quality information
 * @returns Data quality note or undefined
 */
function buildDataQualityNote(dataQuality: DataQualityInfo): string | undefined {
  const issues: string[] = [];

  if (dataQuality.interpolatedCount > 0) {
    issues.push(`${dataQuality.interpolatedCount} missing values interpolated`);
  }

  if (dataQuality.outliersRemoved > 0) {
    issues.push(`${dataQuality.outliersRemoved} outliers removed`);
  }

  if (dataQuality.gapsDetected > 0) {
    issues.push(`${dataQuality.gapsDetected} data gaps detected`);
  }

  if (issues.length === 0) {
    return undefined;
  }

  return `Data quality adjustments: ${issues.join(", ")}.`;
}

/**
 * Build full explanation combining all components
 *
 * @param summary - Summary string
 * @param trendDescription - Trend description
 * @param confidencePercent - Confidence percentage
 * @param confidenceFactors - Array of confidence factors
 * @param dataQualityNote - Optional data quality note
 * @param warnings - Optional warnings
 * @returns Full explanation string
 */
function buildFullExplanation(
  summary: string,
  trendDescription: string,
  confidencePercent: number,
  confidenceFactors: string[],
  dataQualityNote?: string,
  warnings?: string[]
): string {
  let explanation = `${summary}\n\n`;
  explanation += `${trendDescription}\n\n`;
  explanation += `Confidence level: ${confidencePercent}%\n`;
  explanation += `Confidence factors:\n`;

  confidenceFactors.forEach((factor, index) => {
    explanation += `  ${index + 1}. ${factor}\n`;
  });

  if (dataQualityNote) {
    explanation += `\n${dataQualityNote}`;
  }

  if (warnings && warnings.length > 0) {
    explanation += `\n\nWarnings:\n`;
    warnings.forEach((warning, index) => {
      explanation += `  - ${warning}\n`;
    });
  }

  return explanation.trim();
}

/**
 * Generate short explanation for UI display
 *
 * @param explanation - Full prediction explanation
 * @returns Short explanation suitable for tooltips or cards
 */
export function generateShortExplanation(
  explanation: PredictionExplanation
): string {
  return explanation.summary;
}

/**
 * Generate detailed explanation for full view
 *
 * @param explanation - Full prediction explanation
 * @returns Detailed explanation with all factors
 */
export function generateDetailedExplanation(
  explanation: PredictionExplanation
): string {
  return explanation.fullExplanation;
}

/**
 * Format confidence factors as bullet list
 *
 * @param factors - Array of confidence factors
 * @returns HTML-formatted bullet list
 */
export function formatConfidenceFactors(factors: string[]): string {
  return factors.map((factor) => `â€¢ ${factor}`).join("\n");
}
