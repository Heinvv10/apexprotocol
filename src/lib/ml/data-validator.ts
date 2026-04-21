/**
 * Data Validation and Transformation Utilities for ML Forecasting
 * Ensures data quality and handles edge cases before model training
 */

import type { HistoricalDataPoint } from "./data-pipeline";

export type { HistoricalDataPoint };

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error with severity and context
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  context?: Record<string, unknown>;
}

/**
 * Validation warning for non-critical issues
 */
export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

/**
 * Outlier detection result
 */
export interface OutlierDetectionResult {
  outliers: OutlierPoint[];
  cleanData: HistoricalDataPoint[];
  outlierCount: number;
  removalRate: number; // Percentage of data removed
}

/**
 * Data point identified as outlier
 */
export interface OutlierPoint {
  index: number;
  point: HistoricalDataPoint;
  zScore: number;
  reason: string;
}

/**
 * Missing value handling result
 */
export interface InterpolationResult {
  data: HistoricalDataPoint[];
  interpolatedCount: number;
  gaps: DataGap[];
  interpolatedIndices: number[];
}

/**
 * Detected gap in data
 */
export interface DataGap {
  startIndex: number;
  endIndex: number;
  startDate: Date;
  endDate: Date;
  gapDays: number;
  interpolated: boolean;
  reason?: string;
}

/**
 * Configuration for data validation
 */
export interface ValidationConfig {
  minDataPoints?: number; // Minimum required data points (default: 90)
  minDaysForForecast?: number; // Minimum days of data (default: 90)
  maxGapDays?: number; // Maximum allowed gap before flagging (default: 3)
  outlierThreshold?: number; // Z-score threshold for outliers (default: 3)
  scoreMin?: number; // Minimum valid score (default: 0)
  scoreMax?: number; // Maximum valid score (default: 100)
  allowInterpolation?: boolean; // Allow gap interpolation (default: true)
}

const DEFAULT_VALIDATION_CONFIG: Required<ValidationConfig> = {
  minDataPoints: 90,
  minDaysForForecast: 90,
  maxGapDays: 3,
  outlierThreshold: 3,
  scoreMin: 0,
  scoreMax: 100,
  allowInterpolation: true,
};

/**
 * Validate minimum data points requirement
 * Per spec: require 90+ days of data for reliable forecasting
 *
 * @param data - Historical data points
 * @param config - Validation configuration
 * @returns Validation result with errors if insufficient data
 */
export function validateMinimumDataPoints(
  data: HistoricalDataPoint[],
  config: ValidationConfig = {}
): ValidationResult {
  const mergedConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check minimum number of data points
  if (data.length === 0) {
    errors.push({
      code: "NO_DATA",
      message: "No data points provided",
      context: { dataLength: 0, required: mergedConfig.minDataPoints },
    });
    return { isValid: false, errors, warnings };
  }

  if (data.length < mergedConfig.minDataPoints) {
    errors.push({
      code: "INSUFFICIENT_DATA_POINTS",
      message: `Insufficient data points: ${data.length} (minimum: ${mergedConfig.minDataPoints})`,
      context: {
        dataPoints: data.length,
        required: mergedConfig.minDataPoints,
        deficit: mergedConfig.minDataPoints - data.length,
      },
    });
  }

  // Check date range coverage
  if (data.length >= 2) {
    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;
    const daysCovered =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    // Allow a small tolerance for rounding (0.5 days)
    if (daysCovered < mergedConfig.minDaysForForecast - 0.5) {
      errors.push({
        code: "INSUFFICIENT_DATE_RANGE",
        message: `Date range too short: ${Math.round(daysCovered)} days (minimum: ${mergedConfig.minDaysForForecast} days)`,
        context: {
          daysCovered: Math.round(daysCovered),
          required: mergedConfig.minDaysForForecast,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    } else if (daysCovered < 120 - 0.5) {
      warnings.push({
        code: "LIMITED_HISTORICAL_DATA",
        message: `Limited historical data - ${Math.round(daysCovered)} days. Predictions may have lower confidence.`,
        suggestion: "Collect at least 120 days of data for optimal forecast accuracy",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Detect outliers using 3-sigma rule (Z-score method)
 * Points with |z-score| > threshold are considered outliers
 *
 * @param data - Historical data points
 * @param config - Validation configuration
 * @returns Outlier detection result with clean data and outlier information
 */
export function detectOutliers(
  data: HistoricalDataPoint[],
  config: ValidationConfig = {}
): OutlierDetectionResult {
  const mergedConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };

  if (data.length === 0) {
    return {
      outliers: [],
      cleanData: [],
      outlierCount: 0,
      removalRate: 0,
    };
  }

  // Calculate mean and standard deviation
  const scores = data.map((d) => d.score);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
    scores.length;
  const stdDev = Math.sqrt(variance);

  // Detect outliers using Z-score
  const outliers: OutlierPoint[] = [];
  const cleanData: HistoricalDataPoint[] = [];

  data.forEach((point, index) => {
    const zScore = stdDev === 0 ? 0 : (point.score - mean) / stdDev;

    if (Math.abs(zScore) > mergedConfig.outlierThreshold) {
      outliers.push({
        index,
        point,
        zScore,
        reason: `Z-score ${zScore.toFixed(2)} exceeds threshold ${mergedConfig.outlierThreshold}`,
      });
    } else {
      cleanData.push(point);
    }
  });

  return {
    outliers,
    cleanData,
    outlierCount: outliers.length,
    removalRate: data.length > 0 ? (outliers.length / data.length) * 100 : 0,
  };
}

/**
 * Handle missing values through interpolation
 * Interpolates gaps <= maxGapDays, flags larger gaps as unreliable
 *
 * @param data - Historical data points (must be sorted chronologically)
 * @param config - Validation configuration
 * @returns Interpolation result with filled data and gap information
 */
export function handleMissingValues(
  data: HistoricalDataPoint[],
  config: ValidationConfig = {}
): InterpolationResult {
  const mergedConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };

  if (data.length <= 1) {
    return {
      data: [...data],
      interpolatedCount: 0,
      gaps: [],
      interpolatedIndices: [],
    };
  }

  const gaps: DataGap[] = [];
  const interpolatedIndices: number[] = [];
  let interpolatedCount = 0;

  // Detect gaps between consecutive data points
  for (let i = 1; i < data.length; i++) {
    const prevPoint = data[i - 1];
    const currentPoint = data[i];
    const gapDays =
      (currentPoint.date.getTime() - prevPoint.date.getTime()) /
      (1000 * 60 * 60 * 24);

    if (gapDays > 1) {
      // There's a gap
      const gap: DataGap = {
        startIndex: i - 1,
        endIndex: i,
        startDate: prevPoint.date,
        endDate: currentPoint.date,
        gapDays,
        interpolated: false,
      };

      if (gapDays <= mergedConfig.maxGapDays && mergedConfig.allowInterpolation) {
        gap.interpolated = true;
      } else {
        gap.reason = `Gap of ${gapDays.toFixed(1)} days exceeds maximum ${mergedConfig.maxGapDays} days for interpolation`;
      }

      gaps.push(gap);
    }
  }

  // If no interpolation allowed or no gaps to fill, return original data
  if (!mergedConfig.allowInterpolation || gaps.length === 0) {
    return {
      data: [...data],
      interpolatedCount: 0,
      gaps,
      interpolatedIndices: [],
    };
  }

  // Build new dataset with interpolated values
  const resultData: HistoricalDataPoint[] = [];
  let currentOutputIndex = 0;

  for (let i = 0; i < data.length; i++) {
    resultData.push(data[i]);
    currentOutputIndex++;

    // Check if there's a gap after this point that needs interpolation
    const gap = gaps.find((g) => g.startIndex === i && g.interpolated);

    if (gap) {
      const startPoint = data[gap.startIndex];
      const endPoint = data[gap.endIndex];
      const daysBetween = gap.gapDays;

      // Linear interpolation for missing days
      for (let day = 1; day < daysBetween; day++) {
        const ratio = day / daysBetween;
        const interpolatedScore =
          startPoint.score + ratio * (endPoint.score - startPoint.score);

        const interpolatedDate = new Date(startPoint.date);
        interpolatedDate.setDate(interpolatedDate.getDate() + day);

        const interpolatedPoint: HistoricalDataPoint = {
          date: interpolatedDate,
          score: Math.round(interpolatedScore * 100) / 100, // Round to 2 decimal places
        };

        resultData.push(interpolatedPoint);
        interpolatedIndices.push(currentOutputIndex);
        currentOutputIndex++;
        interpolatedCount++;
      }
    }
  }

  return {
    data: resultData,
    interpolatedCount,
    gaps,
    interpolatedIndices,
  };
}

/**
 * Validate date range and chronological ordering
 * Ensures dates are in ascending order and within reasonable bounds
 *
 * @param data - Historical data points
 * @param config - Validation configuration
 * @returns Validation result with errors if date issues found
 */
export function validateDateRange(
  data: HistoricalDataPoint[],
  config: ValidationConfig = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (data.length === 0) {
    return { isValid: true, errors, warnings };
  }

  // Check for valid dates
  for (let i = 0; i < data.length; i++) {
    const point = data[i];

    if (!(point.date instanceof Date) || isNaN(point.date.getTime())) {
      errors.push({
        code: "INVALID_DATE",
        message: `Invalid date at index ${i}`,
        field: "date",
        context: { index: i, date: point.date },
      });
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Check chronological ordering
  for (let i = 1; i < data.length; i++) {
    if (data[i].date.getTime() <= data[i - 1].date.getTime()) {
      errors.push({
        code: "NON_CHRONOLOGICAL_ORDER",
        message: `Data not in chronological order at index ${i}`,
        context: {
          index: i,
          previousDate: data[i - 1].date.toISOString(),
          currentDate: data[i].date.toISOString(),
        },
      });
    }
  }

  // Check for future dates
  const now = new Date();
  const futureDates = data.filter((point) => point.date.getTime() > now.getTime());

  if (futureDates.length > 0) {
    errors.push({
      code: "FUTURE_DATES",
      message: `Found ${futureDates.length} data points with future dates`,
      context: {
        count: futureDates.length,
        firstFutureDate: futureDates[0].date.toISOString(),
      },
    });
  }

  // Check for very old dates (> 5 years ago)
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const veryOldDates = data.filter(
    (point) => point.date.getTime() < fiveYearsAgo.getTime()
  );

  if (veryOldDates.length > 0) {
    warnings.push({
      code: "OLD_DATA",
      message: `Found ${veryOldDates.length} data points older than 5 years`,
      suggestion: "Consider using more recent data for better prediction accuracy",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate score values are within acceptable range
 *
 * @param data - Historical data points
 * @param config - Validation configuration
 * @returns Validation result with errors if invalid scores found
 */
export function validateScoreValues(
  data: HistoricalDataPoint[],
  config: ValidationConfig = {}
): ValidationResult {
  const mergedConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (let i = 0; i < data.length; i++) {
    const point = data[i];

    // Check for null/undefined/NaN
    if (
      point.score === null ||
      point.score === undefined ||
      isNaN(point.score)
    ) {
      errors.push({
        code: "INVALID_SCORE",
        message: `Invalid score value at index ${i}`,
        field: "score",
        context: { index: i, score: point.score },
      });
      continue;
    }

    // Check range
    if (
      point.score < mergedConfig.scoreMin ||
      point.score > mergedConfig.scoreMax
    ) {
      errors.push({
        code: "SCORE_OUT_OF_RANGE",
        message: `Score ${point.score} at index ${i} is outside valid range [${mergedConfig.scoreMin}, ${mergedConfig.scoreMax}]`,
        field: "score",
        context: {
          index: i,
          score: point.score,
          min: mergedConfig.scoreMin,
          max: mergedConfig.scoreMax,
        },
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive data validation
 * Runs all validation checks and returns combined result
 *
 * @param data - Historical data points
 * @param config - Validation configuration
 * @returns Combined validation result from all checks
 */
export function validateData(
  data: HistoricalDataPoint[],
  config: ValidationConfig = {}
): ValidationResult {
  const results = [
    validateMinimumDataPoints(data, config),
    validateDateRange(data, config),
    validateScoreValues(data, config),
  ];

  const allErrors = results.flatMap((r) => r.errors);
  const allWarnings = results.flatMap((r) => r.warnings);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Prepare data for forecasting
 * Performs comprehensive validation, outlier removal, and gap filling
 *
 * @param data - Raw historical data points
 * @param config - Validation configuration
 * @returns Prepared data ready for ML forecasting with validation metadata
 */
export function prepareDataForForecasting(
  data: HistoricalDataPoint[],
  config: ValidationConfig = {}
): {
  data: HistoricalDataPoint[];
  validation: ValidationResult;
  outliers: OutlierDetectionResult;
  interpolation: InterpolationResult;
  isReady: boolean;
} {
  // Step 1: Initial lightweight validation (data points and dates only)
  // Skip score validation as outliers might be out of range - we'll remove them
  const initialValidation: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  const minDataPointsValidation = validateMinimumDataPoints(data, config);
  const dateValidation = validateDateRange(data, config);

  initialValidation.errors.push(...minDataPointsValidation.errors, ...dateValidation.errors);
  initialValidation.warnings.push(...minDataPointsValidation.warnings, ...dateValidation.warnings);
  initialValidation.isValid = initialValidation.errors.length === 0;

  // If basic validation fails critically (no data, invalid dates), stop here
  if (!initialValidation.isValid) {
    return {
      data: [],
      validation: initialValidation,
      outliers: {
        outliers: [],
        cleanData: [],
        outlierCount: 0,
        removalRate: 0,
      },
      interpolation: {
        data: [],
        interpolatedCount: 0,
        gaps: [],
        interpolatedIndices: [],
      },
      isReady: false,
    };
  }

  // Step 2: Remove outliers (this handles extreme score values too)
  const outliers = detectOutliers(data, config);

  // Step 3: Fill gaps through interpolation
  const interpolation = handleMissingValues(outliers.cleanData, config);

  // Step 4: Final comprehensive validation of prepared data
  const finalValidation = validateData(interpolation.data, config);

  return {
    data: interpolation.data,
    validation: finalValidation,
    outliers,
    interpolation,
    isReady: finalValidation.isValid,
  };
}
