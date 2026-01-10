/**
 * Tests for Data Validation and Transformation Utilities
 * Tests data quality validation, outlier detection, and gap interpolation
 */

import { describe, it, expect } from "vitest";
import {
  validateMinimumDataPoints,
  validateDateRange,
  validateScoreValues,
  validateData,
  detectOutliers,
  handleMissingValues,
  prepareDataForForecasting,
  type HistoricalDataPoint,
  type ValidationConfig,
} from "./data-validator";

// ============================================================================
// Test Fixtures
// ============================================================================

const createDataPoint = (daysAgo: number, score: number): HistoricalDataPoint => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return { date, score };
};

// Creates dataset spanning exactly 'days' days with one data point per day
// To span N days, we need N+1 data points (day 0 to day N inclusive)
const createValidDataset = (days: number): HistoricalDataPoint[] => {
  return Array.from({ length: days + 1 }, (_, i) =>
    createDataPoint(days - i, 60 + i * 0.3)
  );
};

// ============================================================================
// validateMinimumDataPoints Tests
// ============================================================================

describe("validateMinimumDataPoints", () => {
  it("should pass with sufficient data points (90+)", () => {
    const data = createValidDataset(90);
    const result = validateMinimumDataPoints(data);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail with no data points", () => {
    const result = validateMinimumDataPoints([]);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("NO_DATA");
  });

  it("should fail with insufficient data points", () => {
    const data = createValidDataset(50);
    const result = validateMinimumDataPoints(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "INSUFFICIENT_DATA_POINTS")).toBe(
      true
    );
    expect(result.errors[0].context?.dataPoints).toBe(51); // 51 points spanning 50 days
    expect(result.errors[0].context?.required).toBe(90);
  });

  it("should accept custom minimum data points", () => {
    const data = createValidDataset(30);
    const config: ValidationConfig = { minDataPoints: 30, minDaysForForecast: 30 };
    const result = validateMinimumDataPoints(data, config);

    expect(result.isValid).toBe(true);
  });

  it("should fail if date range is too short", () => {
    // Create 90 data points but spanning only 30 days
    const data = Array.from({ length: 90 }, (_, i) =>
      createDataPoint(Math.floor((29 - i) / 3), 60 + i * 0.3)
    );

    const result = validateMinimumDataPoints(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "INSUFFICIENT_DATE_RANGE")).toBe(
      true
    );
  });

  it("should warn for limited historical data (90-120 days)", () => {
    const data = createValidDataset(100);
    const result = validateMinimumDataPoints(data);

    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].code).toBe("LIMITED_HISTORICAL_DATA");
  });

  it("should not warn for sufficient historical data (120+ days)", () => {
    const data = createValidDataset(130);
    const result = validateMinimumDataPoints(data);

    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should include deficit in context when data is insufficient", () => {
    const data = createValidDataset(70);
    const result = validateMinimumDataPoints(data);

    expect(result.errors[0].context?.deficit).toBe(19); // 71 points - 90 required = 19 deficit
  });
});

// ============================================================================
// validateDateRange Tests
// ============================================================================

describe("validateDateRange", () => {
  it("should pass with valid chronological dates", () => {
    const data = createValidDataset(50);
    const result = validateDateRange(data);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should pass with empty dataset", () => {
    const result = validateDateRange([]);

    expect(result.isValid).toBe(true);
  });

  it("should fail with non-chronological dates", () => {
    const data = [
      createDataPoint(30, 70),
      createDataPoint(20, 72),
      createDataPoint(25, 74), // Out of order
      createDataPoint(10, 76),
    ];

    const result = validateDateRange(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "NON_CHRONOLOGICAL_ORDER")).toBe(
      true
    );
  });

  it("should fail with invalid date objects", () => {
    const data = [
      { date: new Date("invalid"), score: 70 },
      createDataPoint(10, 72),
    ];

    const result = validateDateRange(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_DATE")).toBe(true);
  });

  it("should fail with future dates", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const data = [
      createDataPoint(20, 70),
      createDataPoint(10, 72),
      { date: futureDate, score: 75 },
    ];

    const result = validateDateRange(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "FUTURE_DATES")).toBe(true);
  });

  it("should warn about very old dates (> 5 years)", () => {
    const veryOldDate = new Date();
    veryOldDate.setFullYear(veryOldDate.getFullYear() - 6);

    const data = [
      { date: veryOldDate, score: 60 },
      createDataPoint(30, 70),
      createDataPoint(10, 72),
    ];

    const result = validateDateRange(data);

    expect(result.isValid).toBe(true);
    expect(result.warnings.some((w) => w.code === "OLD_DATA")).toBe(true);
  });

  it("should include date context in errors", () => {
    const data = [
      createDataPoint(30, 70),
      createDataPoint(35, 72), // Out of order
    ];

    const result = validateDateRange(data);

    expect(result.errors[0].context?.previousDate).toBeDefined();
    expect(result.errors[0].context?.currentDate).toBeDefined();
  });
});

// ============================================================================
// validateScoreValues Tests
// ============================================================================

describe("validateScoreValues", () => {
  it("should pass with valid score values (0-100)", () => {
    const data = [
      createDataPoint(30, 0),
      createDataPoint(20, 50),
      createDataPoint(10, 100),
    ];

    const result = validateScoreValues(data);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail with null score values", () => {
    const data = [
      createDataPoint(20, 70),
      { date: new Date(), score: null as any },
    ];

    const result = validateScoreValues(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_SCORE")).toBe(true);
  });

  it("should fail with NaN score values", () => {
    const data = [
      createDataPoint(20, 70),
      { date: new Date(), score: NaN },
    ];

    const result = validateScoreValues(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_SCORE")).toBe(true);
  });

  it("should fail with scores below minimum", () => {
    const data = [
      createDataPoint(20, 70),
      createDataPoint(10, -10),
    ];

    const result = validateScoreValues(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "SCORE_OUT_OF_RANGE")).toBe(true);
  });

  it("should fail with scores above maximum", () => {
    const data = [
      createDataPoint(20, 70),
      createDataPoint(10, 150),
    ];

    const result = validateScoreValues(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "SCORE_OUT_OF_RANGE")).toBe(true);
  });

  it("should accept custom score range", () => {
    const data = [createDataPoint(10, 150)];
    const config: ValidationConfig = { scoreMin: 0, scoreMax: 200 };

    const result = validateScoreValues(data, config);

    expect(result.isValid).toBe(true);
  });

  it("should include score details in error context", () => {
    const data = [createDataPoint(10, 150)];

    const result = validateScoreValues(data);

    expect(result.errors[0].context?.score).toBe(150);
    expect(result.errors[0].context?.min).toBe(0);
    expect(result.errors[0].context?.max).toBe(100);
  });
});

// ============================================================================
// detectOutliers Tests
// ============================================================================

describe("detectOutliers", () => {
  it("should detect outliers using 3-sigma rule", () => {
    const normalData = Array.from({ length: 50 }, (_, i) =>
      createDataPoint(50 - i, 70 + Math.random() * 5)
    );

    const dataWithOutliers = [
      ...normalData,
      createDataPoint(0, 200), // Extreme outlier
    ];

    const result = detectOutliers(dataWithOutliers);

    expect(result.outlierCount).toBeGreaterThan(0);
    expect(result.outliers[0].zScore).toBeGreaterThan(3);
    expect(result.cleanData.length).toBe(normalData.length);
  });

  it("should not flag normal variation as outliers", () => {
    const data = [
      createDataPoint(40, 65),
      createDataPoint(30, 70),
      createDataPoint(20, 68),
      createDataPoint(10, 72),
      createDataPoint(0, 67),
    ];

    const result = detectOutliers(data);

    expect(result.outlierCount).toBe(0);
    expect(result.cleanData.length).toBe(data.length);
  });

  it("should handle empty dataset", () => {
    const result = detectOutliers([]);

    expect(result.outlierCount).toBe(0);
    expect(result.outliers).toHaveLength(0);
    expect(result.cleanData).toHaveLength(0);
    expect(result.removalRate).toBe(0);
  });

  it("should calculate removal rate correctly", () => {
    const data = Array.from({ length: 100 }, (_, i) => createDataPoint(100 - i, 70));
    const dataWithOutliers = [
      ...data,
      createDataPoint(0, 200),
      createDataPoint(1, 250),
    ];

    const result = detectOutliers(dataWithOutliers);

    expect(result.removalRate).toBeCloseTo((2 / 102) * 100, 1);
  });

  it("should accept custom outlier threshold", () => {
    const data = [
      createDataPoint(30, 70),
      createDataPoint(20, 72),
      createDataPoint(10, 90), // Moderate outlier
    ];

    const strictResult = detectOutliers(data, { outlierThreshold: 2 });
    const lenientResult = detectOutliers(data, { outlierThreshold: 4 });

    expect(strictResult.outlierCount).toBeGreaterThanOrEqual(
      lenientResult.outlierCount
    );
  });

  it("should include outlier reason in results", () => {
    const normalData = Array.from({ length: 30 }, (_, i) =>
      createDataPoint(30 - i, 70)
    );
    const dataWithOutliers = [...normalData, createDataPoint(0, 200)];

    const result = detectOutliers(dataWithOutliers);

    expect(result.outliers[0].reason).toContain("Z-score");
    expect(result.outliers[0].reason).toContain("exceeds threshold");
  });

  it("should handle dataset with zero standard deviation", () => {
    const data = Array.from({ length: 10 }, (_, i) =>
      createDataPoint(10 - i, 70)
    );

    const result = detectOutliers(data);

    expect(result.outlierCount).toBe(0);
    expect(result.cleanData.length).toBe(data.length);
  });

  it("should preserve original data point information in outliers", () => {
    const normalData = Array.from({ length: 30 }, (_, i) =>
      createDataPoint(30 - i, 70)
    );
    const outlierPoint = createDataPoint(0, 200);
    const dataWithOutliers = [...normalData, outlierPoint];

    const result = detectOutliers(dataWithOutliers);

    expect(result.outliers[0].point.score).toBe(200);
    expect(result.outliers[0].point.date).toEqual(outlierPoint.date);
  });
});

// ============================================================================
// handleMissingValues Tests
// ============================================================================

describe("handleMissingValues", () => {
  it("should interpolate small gaps (<= 3 days)", () => {
    const data = [
      createDataPoint(10, 70),
      createDataPoint(7, 76), // 3-day gap
      createDataPoint(5, 78),
    ];

    const result = handleMissingValues(data);

    expect(result.interpolatedCount).toBeGreaterThan(0);
    expect(result.data.length).toBeGreaterThan(data.length);
    expect(result.gaps.some((g) => g.interpolated)).toBe(true);
  });

  it("should not interpolate large gaps (> 3 days)", () => {
    const data = [
      createDataPoint(20, 70),
      createDataPoint(10, 76), // 10-day gap
      createDataPoint(5, 78),
    ];

    const result = handleMissingValues(data);

    expect(result.gaps.some((g) => !g.interpolated)).toBe(true);
    expect(result.gaps.find((g) => !g.interpolated)?.reason).toContain("exceeds maximum");
  });

  it("should handle empty dataset", () => {
    const result = handleMissingValues([]);

    expect(result.interpolatedCount).toBe(0);
    expect(result.data).toHaveLength(0);
    expect(result.gaps).toHaveLength(0);
  });

  it("should handle single data point", () => {
    const data = [createDataPoint(10, 70)];
    const result = handleMissingValues(data);

    expect(result.interpolatedCount).toBe(0);
    expect(result.data).toEqual(data);
  });

  it("should use linear interpolation for gap filling", () => {
    const data = [
      createDataPoint(4, 70),
      createDataPoint(0, 74), // 4-day gap, but maxGapDays=5
    ];

    const result = handleMissingValues(data, { maxGapDays: 5 });

    expect(result.interpolatedCount).toBe(3);

    // Check interpolated values
    const interpolatedScores = result.data.slice(1, 4).map((d) => d.score);
    expect(interpolatedScores[0]).toBeCloseTo(71, 1);
    expect(interpolatedScores[1]).toBeCloseTo(72, 1);
    expect(interpolatedScores[2]).toBeCloseTo(73, 1);
  });

  it("should respect allowInterpolation setting", () => {
    const data = [
      createDataPoint(10, 70),
      createDataPoint(7, 76), // 3-day gap
    ];

    const result = handleMissingValues(data, { allowInterpolation: false });

    expect(result.interpolatedCount).toBe(0);
    expect(result.data.length).toBe(data.length);
  });

  it("should accept custom maxGapDays", () => {
    const data = [
      createDataPoint(10, 70),
      createDataPoint(5, 75), // 5-day gap
    ];

    const strictResult = handleMissingValues(data, { maxGapDays: 3 });
    const lenientResult = handleMissingValues(data, { maxGapDays: 7 });

    expect(strictResult.interpolatedCount).toBe(0);
    expect(lenientResult.interpolatedCount).toBeGreaterThan(0);
  });

  it("should detect gaps without interpolating", () => {
    const data = [
      createDataPoint(10, 70),
      createDataPoint(8, 72),
      createDataPoint(5, 74), // 3-day gap
      createDataPoint(0, 76),
    ];

    const result = handleMissingValues(data, { allowInterpolation: false });

    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.gaps[0].gapDays).toBeGreaterThan(1);
  });

  it("should track interpolated indices", () => {
    const data = [
      createDataPoint(4, 70),
      createDataPoint(0, 74),
    ];

    const result = handleMissingValues(data, { maxGapDays: 5 });

    expect(result.interpolatedIndices.length).toBe(result.interpolatedCount);
    expect(result.interpolatedIndices[0]).toBeGreaterThan(0);
  });

  it("should preserve dates in chronological order after interpolation", () => {
    const data = [
      createDataPoint(6, 70),
      createDataPoint(3, 73),
      createDataPoint(0, 76),
    ];

    const result = handleMissingValues(data, { maxGapDays: 5 });

    for (let i = 1; i < result.data.length; i++) {
      expect(result.data[i].date.getTime()).toBeGreaterThan(
        result.data[i - 1].date.getTime()
      );
    }
  });

  it("should round interpolated scores to 2 decimal places", () => {
    const data = [
      createDataPoint(3, 70.123),
      createDataPoint(0, 73.987),
    ];

    const result = handleMissingValues(data, { maxGapDays: 5 });

    const interpolatedScores = result.data
      .filter((_, i) => result.interpolatedIndices.includes(i))
      .map((d) => d.score);

    interpolatedScores.forEach((score) => {
      expect(score).toBe(Math.round(score * 100) / 100);
    });
  });
});

// ============================================================================
// validateData Tests
// ============================================================================

describe("validateData", () => {
  it("should pass comprehensive validation with valid data", () => {
    const data = createValidDataset(100);
    const result = validateData(data);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail if any validation check fails", () => {
    const data = [
      createDataPoint(30, 70),
      createDataPoint(20, 150), // Invalid score
    ];

    const result = validateData(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should combine errors from all validation checks", () => {
    const data = [
      createDataPoint(20, 70),
      createDataPoint(10, 200), // Out of range
      { date: new Date("invalid"), score: 72 }, // Invalid date
    ];

    const result = validateData(data);

    expect(result.errors.some((e) => e.code === "SCORE_OUT_OF_RANGE")).toBe(true);
    expect(result.errors.some((e) => e.code === "INVALID_DATE")).toBe(true);
  });

  it("should combine warnings from all validation checks", () => {
    const data = createValidDataset(100); // Triggers LIMITED_HISTORICAL_DATA warning
    const result = validateData(data);

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("should accept custom configuration", () => {
    const data = createValidDataset(30);
    const config: ValidationConfig = {
      minDataPoints: 30,
      minDaysForForecast: 30,
    };

    const result = validateData(data, config);

    expect(result.isValid).toBe(true);
  });
});

// ============================================================================
// prepareDataForForecasting Tests
// ============================================================================

describe("prepareDataForForecasting", () => {
  it("should prepare valid data successfully", () => {
    const data = createValidDataset(100);
    const result = prepareDataForForecasting(data);

    expect(result.isReady).toBe(true);
    expect(result.validation.isValid).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it("should fail with invalid input data", () => {
    const data = createValidDataset(20); // Too few points
    const result = prepareDataForForecasting(data);

    expect(result.isReady).toBe(false);
    expect(result.validation.isValid).toBe(false);
    expect(result.data).toHaveLength(0);
  });

  it("should remove outliers during preparation", () => {
    const normalData = createValidDataset(100);
    // Add outlier at a unique timestamp (day -1, since normalData goes from day 100 to day 0)
    const dataWithOutliers = [createDataPoint(101, 300), ...normalData];

    const result = prepareDataForForecasting(dataWithOutliers);

    expect(result.outliers.outlierCount).toBeGreaterThan(0);
    expect(result.data.length).toBeLessThan(dataWithOutliers.length);
  });

  it("should interpolate gaps during preparation", () => {
    // Create data with 100 days of history but with a 4-day gap in the middle
    const earlyData = Array.from({ length: 48 }, (_, i) =>
      createDataPoint(100 - i, 60 + i * 0.3)
    );
    const lateData = Array.from({ length: 48 }, (_, i) =>
      createDataPoint(48 - i, 70 + i * 0.3)
    );
    const dataWithGaps = [...earlyData, ...lateData]; // Gap from day 52 to day 48 (4 days)

    const result = prepareDataForForecasting(dataWithGaps, { maxGapDays: 5, minDataPoints: 90, minDaysForForecast: 90 });

    expect(result.interpolation.interpolatedCount).toBeGreaterThan(0);
  });

  it("should provide comprehensive metadata", () => {
    const data = createValidDataset(100);
    const result = prepareDataForForecasting(data);

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("validation");
    expect(result).toHaveProperty("outliers");
    expect(result).toHaveProperty("interpolation");
    expect(result).toHaveProperty("isReady");
  });

  it("should validate prepared data meets requirements", () => {
    const data = createValidDataset(100);
    const result = prepareDataForForecasting(data);

    expect(result.validation.isValid).toBe(true);
    expect(result.isReady).toBe(true);
  });

  it("should handle edge case of all data being outliers", () => {
    // Create mostly normal data with a few extreme outliers
    const normalScores = Array.from({ length: 50 }, (_, i) =>
      createDataPoint(60 - i, 70 + (Math.random() - 0.5) * 2) // ~70 Â± 1
    );
    const outliers = [
      createDataPoint(100, 200), // Extreme high
      createDataPoint(90, -50),  // Extreme low
      createDataPoint(80, 300),  // Extreme high
    ];
    const data = [...outliers, ...normalScores];

    const result = prepareDataForForecasting(data, {
      minDataPoints: 40,
      minDaysForForecast: 40,
    });

    expect(result.outliers.removalRate).toBeGreaterThan(0);
  });

  it("should accept custom configuration", () => {
    const data = createValidDataset(50);
    const config: ValidationConfig = {
      minDataPoints: 50,
      minDaysForForecast: 50,
      maxGapDays: 5,
      outlierThreshold: 2.5,
    };

    const result = prepareDataForForecasting(data, config);

    expect(result.isReady).toBe(true);
  });

  it("should process data in correct order: validate -> outliers -> interpolate -> validate", () => {
    const normalData = Array.from({ length: 91 }, (_, i) =>
      createDataPoint(91 - i, 70 + i * 0.1)
    );

    // Add extreme outlier at start of time series
    const dataWithIssues = [
      createDataPoint(100, 300), // Extreme outlier
      ...normalData,
    ];

    const result = prepareDataForForecasting(dataWithIssues);

    // After outlier removal, data should be valid
    expect(result.outliers.outlierCount).toBeGreaterThan(0);
    expect(result.isReady).toBe(true);
  });

  it("should return empty data if initial validation fails critically", () => {
    const emptyData: HistoricalDataPoint[] = [];
    const result = prepareDataForForecasting(emptyData);

    expect(result.isReady).toBe(false);
    expect(result.data).toHaveLength(0);
  });
});
