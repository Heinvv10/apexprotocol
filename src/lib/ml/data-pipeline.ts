/**
 * Historical GEO Score Data Extraction Utility
 * Extracts and transforms historical GEO score data for ML model training
 */

import { db } from "@/lib/db";
import { geoScoreHistory, brands } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, isNotNull } from "drizzle-orm";

/**
 * Historical data point for time series forecasting
 */
export interface HistoricalDataPoint {
  date: Date;
  score: number;
}

/**
 * Detailed historical data point with all score components
 */
export interface DetailedHistoricalDataPoint extends HistoricalDataPoint {
  visibilityScore: number;
  sentimentScore: number;
  recommendationScore: number;
  competitorGapScore: number | null;
  mentionCount: number;
  dataQuality: number;
}

/**
 * Data extraction result with metadata
 */
export interface ExtractionResult {
  data: HistoricalDataPoint[];
  brandId: string;
  startDate: Date;
  endDate: Date;
  dataPointCount: number;
  isValid: boolean;
  validationErrors: string[];
}

/**
 * Detailed data extraction result with all score components
 */
export interface DetailedExtractionResult {
  data: DetailedHistoricalDataPoint[];
  brandId: string;
  startDate: Date;
  endDate: Date;
  dataPointCount: number;
  isValid: boolean;
  validationErrors: string[];
}

/**
 * Configuration for data extraction
 */
export interface ExtractionConfig {
  minDataPoints?: number; // Minimum required data points (default: 30)
  maxGapDays?: number; // Maximum allowed gap in days between data points (default: 7)
  requireDataQuality?: number; // Minimum data quality threshold 0-100 (default: 0 - no minimum)
}

const DEFAULT_CONFIG: Required<ExtractionConfig> = {
  minDataPoints: 30,
  maxGapDays: 7,
  requireDataQuality: 0,
};

/**
 * Extract historical GEO scores for a brand within a date range
 * Returns data in format suitable for time series forecasting
 *
 * @param brandId - Brand ID to extract data for
 * @param startDate - Start date for historical data (optional, defaults to 90 days ago)
 * @param endDate - End date for historical data (optional, defaults to now)
 * @param config - Extraction configuration options
 * @returns Extraction result with data and validation metadata
 */
export async function extractHistoricalScores(
  brandId: string,
  startDate?: Date,
  endDate?: Date,
  config: ExtractionConfig = {}
): Promise<ExtractionResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const validationErrors: string[] = [];

  // Verify brand exists
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    return {
      data: [],
      brandId,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      dataPointCount: 0,
      isValid: false,
      validationErrors: ["Brand not found"],
    };
  }

  // Set default date range if not provided (90 days)
  const now = new Date();
  const defaultStartDate = new Date(now);
  defaultStartDate.setDate(defaultStartDate.getDate() - 90);

  const queryStartDate = startDate || defaultStartDate;
  const queryEndDate = endDate || now;

  // Build query conditions
  const conditions = [
    eq(geoScoreHistory.brandId, brandId),
    isNotNull(geoScoreHistory.overallScore),
  ];

  // Add date range filters if provided
  if (startDate) {
    conditions.push(gte(geoScoreHistory.calculatedAt, queryStartDate));
  }
  if (endDate) {
    conditions.push(lte(geoScoreHistory.calculatedAt, queryEndDate));
  }

  // Fetch historical scores ordered by date
  const historicalScores = await db.query.geoScoreHistory.findMany({
    where: and(...conditions),
    orderBy: [desc(geoScoreHistory.calculatedAt)],
  });

  // Transform to time series format
  const data: HistoricalDataPoint[] = historicalScores
    .map((record) => ({
      date: record.calculatedAt,
      score: record.overallScore,
    }))
    .reverse(); // Reverse to get chronological order (oldest first)

  // Validate data quality
  const dataPointCount = data.length;

  // Check minimum data points
  if (dataPointCount < mergedConfig.minDataPoints) {
    validationErrors.push(
      `Insufficient data points: ${dataPointCount} (minimum: ${mergedConfig.minDataPoints})`
    );
  }

  // Check for large gaps in data
  if (dataPointCount > 1) {
    for (let i = 1; i < data.length; i++) {
      const gap = Math.abs(
        (data[i].date.getTime() - data[i - 1].date.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (gap > mergedConfig.maxGapDays) {
        validationErrors.push(
          `Large gap detected: ${gap.toFixed(1)} days between ${data[i - 1].date.toISOString()} and ${data[i].date.toISOString()}`
        );
      }
    }
  }

  // Check data quality threshold if specified
  if (mergedConfig.requireDataQuality > 0) {
    const lowQualityRecords = historicalScores.filter(
      (record) =>
        record.dataQuality !== null &&
        record.dataQuality < mergedConfig.requireDataQuality
    );
    if (lowQualityRecords.length > 0) {
      validationErrors.push(
        `${lowQualityRecords.length} records below quality threshold (${mergedConfig.requireDataQuality})`
      );
    }
  }

  // Validate score values
  const invalidScores = data.filter(
    (point) => point.score < 0 || point.score > 100 || isNaN(point.score)
  );
  if (invalidScores.length > 0) {
    validationErrors.push(
      `${invalidScores.length} records with invalid score values (must be 0-100)`
    );
  }

  return {
    data,
    brandId,
    startDate: queryStartDate,
    endDate: queryEndDate,
    dataPointCount,
    isValid: validationErrors.length === 0,
    validationErrors,
  };
}

/**
 * Extract detailed historical GEO scores with all score components
 * Useful for advanced analysis and multi-metric forecasting
 *
 * @param brandId - Brand ID to extract data for
 * @param startDate - Start date for historical data (optional, defaults to 90 days ago)
 * @param endDate - End date for historical data (optional, defaults to now)
 * @param config - Extraction configuration options
 * @returns Detailed extraction result with all score components
 */
export async function extractDetailedHistoricalScores(
  brandId: string,
  startDate?: Date,
  endDate?: Date,
  config: ExtractionConfig = {}
): Promise<DetailedExtractionResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const validationErrors: string[] = [];

  // Verify brand exists
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    return {
      data: [],
      brandId,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      dataPointCount: 0,
      isValid: false,
      validationErrors: ["Brand not found"],
    };
  }

  // Set default date range if not provided (90 days)
  const now = new Date();
  const defaultStartDate = new Date(now);
  defaultStartDate.setDate(defaultStartDate.getDate() - 90);

  const queryStartDate = startDate || defaultStartDate;
  const queryEndDate = endDate || now;

  // Build query conditions
  const conditions = [
    eq(geoScoreHistory.brandId, brandId),
    isNotNull(geoScoreHistory.overallScore),
  ];

  if (startDate) {
    conditions.push(gte(geoScoreHistory.calculatedAt, queryStartDate));
  }
  if (endDate) {
    conditions.push(lte(geoScoreHistory.calculatedAt, queryEndDate));
  }

  // Fetch historical scores ordered by date
  const historicalScores = await db.query.geoScoreHistory.findMany({
    where: and(...conditions),
    orderBy: [desc(geoScoreHistory.calculatedAt)],
  });

  // Transform to detailed time series format
  const data: DetailedHistoricalDataPoint[] = historicalScores
    .map((record) => ({
      date: record.calculatedAt,
      score: record.overallScore,
      visibilityScore: record.visibilityScore,
      sentimentScore: record.sentimentScore,
      recommendationScore: record.recommendationScore,
      competitorGapScore: record.competitorGapScore,
      mentionCount: record.mentionCount || 0,
      dataQuality: record.dataQuality || 50,
    }))
    .reverse(); // Reverse to get chronological order

  const dataPointCount = data.length;

  // Validate minimum data points
  if (dataPointCount < mergedConfig.minDataPoints) {
    validationErrors.push(
      `Insufficient data points: ${dataPointCount} (minimum: ${mergedConfig.minDataPoints})`
    );
  }

  // Check for large gaps in data
  if (dataPointCount > 1) {
    for (let i = 1; i < data.length; i++) {
      const gap = Math.abs(
        (data[i].date.getTime() - data[i - 1].date.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (gap > mergedConfig.maxGapDays) {
        validationErrors.push(
          `Large gap detected: ${gap.toFixed(1)} days between ${data[i - 1].date.toISOString()} and ${data[i].date.toISOString()}`
        );
      }
    }
  }

  // Check data quality threshold
  if (mergedConfig.requireDataQuality > 0) {
    const lowQualityRecords = data.filter(
      (record) => record.dataQuality < mergedConfig.requireDataQuality
    );
    if (lowQualityRecords.length > 0) {
      validationErrors.push(
        `${lowQualityRecords.length} records below quality threshold (${mergedConfig.requireDataQuality})`
      );
    }
  }

  // Validate score values
  const invalidScores = data.filter(
    (point) => point.score < 0 || point.score > 100 || isNaN(point.score)
  );
  if (invalidScores.length > 0) {
    validationErrors.push(
      `${invalidScores.length} records with invalid score values (must be 0-100)`
    );
  }

  return {
    data,
    brandId,
    startDate: queryStartDate,
    endDate: queryEndDate,
    dataPointCount,
    isValid: validationErrors.length === 0,
    validationErrors,
  };
}

/**
 * Transform historical data to simple-statistics format [[x, y], ...]
 * Used for linear regression and other statistical operations
 *
 * @param data - Historical data points
 * @returns Array of [index, score] tuples suitable for simple-statistics
 */
export function transformToRegressionFormat(
  data: HistoricalDataPoint[]
): [number, number][] {
  return data.map((point, index) => [index, point.score]);
}

/**
 * Calculate data quality metrics for validation
 *
 * @param data - Historical data points
 * @returns Quality metrics object
 */
export function calculateDataQualityMetrics(data: HistoricalDataPoint[]): {
  totalPoints: number;
  dateRange: number; // days
  averageGap: number; // days
  maxGap: number; // days
  minScore: number;
  maxScore: number;
  meanScore: number;
  hasOutliers: boolean;
} {
  if (data.length === 0) {
    return {
      totalPoints: 0,
      dateRange: 0,
      averageGap: 0,
      maxGap: 0,
      minScore: 0,
      maxScore: 0,
      meanScore: 0,
      hasOutliers: false,
    };
  }

  const scores = data.map((d) => d.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Calculate standard deviation for outlier detection
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) /
    scores.length;
  const stdDev = Math.sqrt(variance);

  // Check for outliers (> 3 standard deviations from mean)
  const hasOutliers = scores.some(
    (score) => Math.abs(score - meanScore) > 3 * stdDev
  );

  // Calculate gaps
  const gaps: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const gap =
      (data[i].date.getTime() - data[i - 1].date.getTime()) /
      (1000 * 60 * 60 * 24);
    gaps.push(gap);
  }

  const averageGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;

  const dateRange =
    data.length > 1
      ? (data[data.length - 1].date.getTime() - data[0].date.getTime()) /
        (1000 * 60 * 60 * 24)
      : 0;

  return {
    totalPoints: data.length,
    dateRange,
    averageGap,
    maxGap,
    minScore,
    maxScore,
    meanScore,
    hasOutliers,
  };
}
