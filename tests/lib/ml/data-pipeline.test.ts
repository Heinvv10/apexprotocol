/**
 * Tests for Historical GEO Score Data Extraction Utility
 * Tests data extraction, validation, and transformation for ML forecasting
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractHistoricalScores,
  extractDetailedHistoricalScores,
  transformToRegressionFormat,
  calculateDataQualityMetrics,
  type HistoricalDataPoint,
  type DetailedHistoricalDataPoint,
  type ExtractionResult,
  type DetailedExtractionResult,
} from "../../../src/lib/ml/data-pipeline";
import * as dbModule from "@/lib/db";

// ============================================================================
// Test Fixtures
// ============================================================================

const mockBrandId = "test-brand-123";
const mockBrand = {
  id: mockBrandId,
  name: "Test Brand",
  organizationId: "org-123",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockScoreRecord = (
  daysAgo: number,
  score: number,
  dataQuality: number = 90
) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `score-${daysAgo}`,
    brandId: mockBrandId,
    overallScore: score,
    visibilityScore: score - 5,
    sentimentScore: score + 3,
    recommendationScore: score - 2,
    competitorGapScore: score + 1,
    previousScore: score - 2,
    scoreChange: 2,
    trend: "up" as const,
    mentionCount: 100,
    positiveMentions: 80,
    negativeMentions: 10,
    neutralMentions: 10,
    recommendationCount: 5,
    completedRecommendations: 3,
    calculationNotes: "Test calculation",
    dataQuality,
    calculatedAt: date,
    periodStart: null,
    periodEnd: null,
    platformScores: null,
  };
};

// Create 90 days of historical data with gradual increase
const mockHistoricalScores = Array.from({ length: 90 }, (_, i) =>
  createMockScoreRecord(89 - i, 60 + Math.floor(i / 3))
);

// Create data with gaps
const mockDataWithGaps = [
  createMockScoreRecord(30, 70),
  createMockScoreRecord(20, 72), // 10 day gap
  createMockScoreRecord(10, 74), // 10 day gap
  createMockScoreRecord(0, 76),
];

// Create insufficient data (only 20 days)
const mockInsufficientData = Array.from({ length: 20 }, (_, i) =>
  createMockScoreRecord(19 - i, 65 + i)
);

// Mock database
const mockDb = {
  query: {
    brands: {
      findFirst: vi.fn(),
    },
    geoScoreHistory: {
      findMany: vi.fn(),
    },
  },
};

// ============================================================================
// extractHistoricalScores Tests
// ============================================================================

describe("extractHistoricalScores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the db module
    vi.spyOn(dbModule, "db", "get").mockReturnValue(mockDb as any);
  });

  it("should extract historical scores for valid brand", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(mockHistoricalScores);

    const result = await extractHistoricalScores(mockBrandId);

    expect(result.isValid).toBe(true);
    expect(result.brandId).toBe(mockBrandId);
    expect(result.dataPointCount).toBe(90);
    expect(result.data.length).toBe(90);
    expect(result.validationErrors).toHaveLength(0);
  });

  it("should return error for non-existent brand", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(null);

    const result = await extractHistoricalScores("non-existent-brand");

    expect(result.isValid).toBe(false);
    expect(result.dataPointCount).toBe(0);
    expect(result.validationErrors).toContain("Brand not found");
  });

  it("should validate minimum data points requirement", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(mockInsufficientData);

    const result = await extractHistoricalScores(mockBrandId);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(result.validationErrors.some(e => e.includes("Insufficient data points"))).toBe(true);
    expect(result.validationErrors.some(e => e.includes("20") && e.includes("30"))).toBe(true);
  });

  it("should detect large gaps in data", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(mockDataWithGaps);

    const result = await extractHistoricalScores(mockBrandId, undefined, undefined, {
      minDataPoints: 3, // Lower requirement for test
    });

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.some((e) => e.includes("Large gap detected"))).toBe(
      true
    );
  });

  it("should return data in chronological order", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    // Mock returns data in DESC order (newest first), which will be reversed by the function
    const descOrderScores = [...mockHistoricalScores].reverse();
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(descOrderScores);

    const result = await extractHistoricalScores(mockBrandId);

    // Check that dates are in ascending order
    for (let i = 1; i < result.data.length; i++) {
      expect(result.data[i].date.getTime()).toBeGreaterThan(
        result.data[i - 1].date.getTime()
      );
    }
  });

  it("should accept custom date range", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(mockHistoricalScores.slice(0, 30));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const result = await extractHistoricalScores(mockBrandId, startDate, endDate);

    expect(result.startDate).toEqual(startDate);
    expect(result.endDate).toEqual(endDate);
  });

  it("should accept custom configuration", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(mockInsufficientData);

    const result = await extractHistoricalScores(mockBrandId, undefined, undefined, {
      minDataPoints: 20,
      maxGapDays: 3,
    });

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toHaveLength(0);
  });

  it("should validate score values are in 0-100 range", async () => {
    const invalidScores = [
      createMockScoreRecord(2, 120), // Too high
      createMockScoreRecord(1, -10), // Too low
      createMockScoreRecord(0, 75), // Valid
    ];

    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(invalidScores);

    const result = await extractHistoricalScores(mockBrandId, undefined, undefined, {
      minDataPoints: 3,
    });

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.some((e) => e.includes("invalid score values"))).toBe(
      true
    );
  });

  it("should check data quality threshold when specified", async () => {
    const lowQualityScores = [
      createMockScoreRecord(2, 70, 40), // Low quality
      createMockScoreRecord(1, 72, 50), // Low quality
      createMockScoreRecord(0, 74, 90), // Good quality
    ];

    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(lowQualityScores);

    const result = await extractHistoricalScores(mockBrandId, undefined, undefined, {
      minDataPoints: 3,
      requireDataQuality: 60,
    });

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.some((e) => e.includes("below quality threshold"))).toBe(
      true
    );
  });

  it("should use default date range of 90 days when not specified", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(mockHistoricalScores);

    const result = await extractHistoricalScores(mockBrandId);

    const daysDiff =
      (result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24);

    expect(daysDiff).toBeGreaterThanOrEqual(89);
    expect(daysDiff).toBeLessThanOrEqual(91); // Allow for rounding
  });
});

// ============================================================================
// extractDetailedHistoricalScores Tests
// ============================================================================

describe("extractDetailedHistoricalScores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dbModule, "db", "get").mockReturnValue(mockDb as any);
  });

  it("should extract detailed scores with all components", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(mockHistoricalScores);

    const result = await extractDetailedHistoricalScores(mockBrandId);

    expect(result.isValid).toBe(true);
    expect(result.data.length).toBe(90);

    const firstPoint = result.data[0];
    expect(firstPoint).toHaveProperty("score");
    expect(firstPoint).toHaveProperty("visibilityScore");
    expect(firstPoint).toHaveProperty("sentimentScore");
    expect(firstPoint).toHaveProperty("recommendationScore");
    expect(firstPoint).toHaveProperty("competitorGapScore");
    expect(firstPoint).toHaveProperty("mentionCount");
    expect(firstPoint).toHaveProperty("dataQuality");
  });

  it("should handle null values in score components", async () => {
    const scoresWithNulls = [
      createMockScoreRecord(0, 72), // Newest (will be reversed to index 1)
      {
        ...createMockScoreRecord(1, 70), // Oldest (will be reversed to index 0)
        mentionCount: null,
        dataQuality: null,
      },
    ];

    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(scoresWithNulls);

    const result = await extractDetailedHistoricalScores(mockBrandId, undefined, undefined, {
      minDataPoints: 2,
    });

    // After reversal, the record with nulls should be at index 0 (oldest)
    expect(result.data[0].mentionCount).toBe(0);
    expect(result.data[0].dataQuality).toBe(50);
  });

  it("should validate detailed data same as basic extraction", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(mockInsufficientData);

    const result = await extractDetailedHistoricalScores(mockBrandId);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.some(e => e.includes("Insufficient data points"))).toBe(true);
  });
});

// ============================================================================
// transformToRegressionFormat Tests
// ============================================================================

describe("transformToRegressionFormat", () => {
  it("should transform data to [[x, y], ...] format", () => {
    const data: HistoricalDataPoint[] = [
      { date: new Date("2024-01-01"), score: 60 },
      { date: new Date("2024-01-02"), score: 62 },
      { date: new Date("2024-01-03"), score: 64 },
    ];

    const result = transformToRegressionFormat(data);

    expect(result).toEqual([
      [0, 60],
      [1, 62],
      [2, 64],
    ]);
  });

  it("should handle empty data", () => {
    const result = transformToRegressionFormat([]);

    expect(result).toEqual([]);
  });

  it("should use array index as x coordinate", () => {
    const data: HistoricalDataPoint[] = [
      { date: new Date("2024-01-01"), score: 70 },
      { date: new Date("2024-01-10"), score: 72 }, // Gap in dates
      { date: new Date("2024-01-11"), score: 74 },
    ];

    const result = transformToRegressionFormat(data);

    expect(result[0][0]).toBe(0);
    expect(result[1][0]).toBe(1);
    expect(result[2][0]).toBe(2);
  });

  it("should preserve score values exactly", () => {
    const data: HistoricalDataPoint[] = [
      { date: new Date(), score: 45.7 },
      { date: new Date(), score: 89.3 },
      { date: new Date(), score: 100 },
    ];

    const result = transformToRegressionFormat(data);

    expect(result[0][1]).toBe(45.7);
    expect(result[1][1]).toBe(89.3);
    expect(result[2][1]).toBe(100);
  });
});

// ============================================================================
// calculateDataQualityMetrics Tests
// ============================================================================

describe("calculateDataQualityMetrics", () => {
  it("should calculate metrics for valid dataset", () => {
    const data: HistoricalDataPoint[] = [
      { date: new Date("2024-01-01"), score: 60 },
      { date: new Date("2024-01-02"), score: 65 },
      { date: new Date("2024-01-03"), score: 70 },
      { date: new Date("2024-01-04"), score: 68 },
      { date: new Date("2024-01-05"), score: 72 },
    ];

    const metrics = calculateDataQualityMetrics(data);

    expect(metrics.totalPoints).toBe(5);
    expect(metrics.dateRange).toBe(4); // 5 days - 1
    expect(metrics.averageGap).toBe(1); // 1 day between each
    expect(metrics.maxGap).toBe(1);
    expect(metrics.minScore).toBe(60);
    expect(metrics.maxScore).toBe(72);
    expect(metrics.meanScore).toBeCloseTo(67);
  });

  it("should handle empty dataset", () => {
    const metrics = calculateDataQualityMetrics([]);

    expect(metrics.totalPoints).toBe(0);
    expect(metrics.dateRange).toBe(0);
    expect(metrics.averageGap).toBe(0);
    expect(metrics.maxGap).toBe(0);
    expect(metrics.meanScore).toBe(0);
  });

  it("should handle single data point", () => {
    const data: HistoricalDataPoint[] = [{ date: new Date(), score: 75 }];

    const metrics = calculateDataQualityMetrics(data);

    expect(metrics.totalPoints).toBe(1);
    expect(metrics.dateRange).toBe(0);
    expect(metrics.averageGap).toBe(0);
    expect(metrics.maxGap).toBe(0);
    expect(metrics.meanScore).toBe(75);
  });

  it("should detect outliers using 3-sigma rule", () => {
    // Use a dataset with many normal values and one extreme outlier
    // This ensures the mean and stdDev aren't too heavily influenced by the outlier
    const normalScores = Array.from({ length: 50 }, () => ({
      date: new Date(),
      score: 70 + Math.random() * 5, // Scores between 70-75
    }));
    const data: HistoricalDataPoint[] = [
      ...normalScores,
      { date: new Date(), score: 200 }, // Extreme outlier
    ];

    const metrics = calculateDataQualityMetrics(data);

    expect(metrics.hasOutliers).toBe(true);
  });

  it("should not flag normal variation as outliers", () => {
    const data: HistoricalDataPoint[] = [
      { date: new Date(), score: 65 },
      { date: new Date(), score: 70 },
      { date: new Date(), score: 68 },
      { date: new Date(), score: 72 },
      { date: new Date(), score: 67 },
    ];

    const metrics = calculateDataQualityMetrics(data);

    expect(metrics.hasOutliers).toBe(false);
  });

  it("should calculate gaps correctly with irregular spacing", () => {
    const data: HistoricalDataPoint[] = [
      { date: new Date("2024-01-01"), score: 70 },
      { date: new Date("2024-01-03"), score: 72 }, // 2 day gap
      { date: new Date("2024-01-10"), score: 74 }, // 7 day gap
      { date: new Date("2024-01-11"), score: 76 }, // 1 day gap
    ];

    const metrics = calculateDataQualityMetrics(data);

    expect(metrics.maxGap).toBe(7);
    expect(metrics.averageGap).toBeCloseTo((2 + 7 + 1) / 3);
  });

  it("should calculate date range in days correctly", () => {
    const data: HistoricalDataPoint[] = [
      { date: new Date("2024-01-01"), score: 70 },
      { date: new Date("2024-01-31"), score: 75 },
    ];

    const metrics = calculateDataQualityMetrics(data);

    expect(metrics.dateRange).toBe(30);
  });

  it("should calculate mean score accurately", () => {
    const data: HistoricalDataPoint[] = [
      { date: new Date(), score: 50 },
      { date: new Date(), score: 60 },
      { date: new Date(), score: 70 },
      { date: new Date(), score: 80 },
    ];

    const metrics = calculateDataQualityMetrics(data);

    expect(metrics.meanScore).toBe(65);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Data Pipeline Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dbModule, "db", "get").mockReturnValue(mockDb as any);
  });

  it("should complete full extraction and transformation workflow", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(mockHistoricalScores);

    // Extract data
    const extraction = await extractHistoricalScores(mockBrandId);

    expect(extraction.isValid).toBe(true);

    // Transform to regression format
    const regressionData = transformToRegressionFormat(extraction.data);

    expect(regressionData.length).toBe(extraction.dataPointCount);
    expect(regressionData[0]).toHaveLength(2); // [x, y] tuple

    // Calculate quality metrics
    const metrics = calculateDataQualityMetrics(extraction.data);

    expect(metrics.totalPoints).toBe(extraction.dataPointCount);
    expect(metrics.hasOutliers).toBe(false);
  });

  it("should handle extraction with validation warnings", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    // Return in DESC order (newest first) as DB would
    const descOrderGaps = [...mockDataWithGaps].reverse();
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(descOrderGaps);

    const extraction = await extractHistoricalScores(mockBrandId, undefined, undefined, {
      minDataPoints: 3,
    });

    expect(extraction.isValid).toBe(false);
    expect(extraction.validationErrors.length).toBeGreaterThan(0);

    // Data should still be usable for analysis even with warnings
    const metrics = calculateDataQualityMetrics(extraction.data);
    expect(metrics.totalPoints).toBeGreaterThan(0);
    expect(metrics.maxGap).toBeGreaterThan(7);
  });

  it("should work with detailed extraction", async () => {
    mockDb.query.brands.findFirst.mockResolvedValue(mockBrand);
    mockDb.query.geoScoreHistory.findMany.mockResolvedValue(mockHistoricalScores);

    const detailed = await extractDetailedHistoricalScores(mockBrandId);

    expect(detailed.isValid).toBe(true);

    // Should work with basic transformation too
    const regressionData = transformToRegressionFormat(detailed.data);
    expect(regressionData.length).toBe(detailed.dataPointCount);
  });
});
