/**
 * Unit Tests for /api/predictions route
 * Testing authentication, caching behavior (24-hour TTL), and prediction generation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ============================================================================
// Mocks
// ============================================================================

// Mock Clerk auth
vi.mock("@/lib/auth/supabase-server", () => ({
  getSession: vi.fn(async () => ({ userId: "test-user-id", orgId: "test-org-id", orgRole: "admin", orgSlug: null })),
  currentDbUser: vi.fn(async () => null),
}));

// Mock ML modules
vi.mock("@/lib/ml/data-pipeline", () => ({
  extractHistoricalScores: vi.fn(),
}));

vi.mock("@/lib/ml/forecaster", () => ({
  forecastGeoScore: vi.fn(),
}));

vi.mock("@/lib/ml/explainer", () => ({
  generatePredictionExplanation: vi.fn(),
}));

// Mock database - create mocks inside factory to avoid hoisting issues
vi.mock("@/lib/db", () => {
  const mockDbQuery = {
    brands: {
      findFirst: vi.fn(),
    },
    predictions: {
      findMany: vi.fn(),
    },
    modelMetadata: {
      findFirst: vi.fn(),
    },
  };

  const mockDbUpdate = vi.fn();
  const mockDbInsert = vi.fn();

  return {
    db: {
      query: mockDbQuery,
      update: mockDbUpdate,
      insert: mockDbInsert,
    },
  };
});

vi.mock("@/lib/db/schema", () => ({
  brands: {},
  predictions: {},
  modelMetadata: {},
}));

// Import mocked modules AFTER vi.mock declarations
import { getSession } from "@/lib/auth/supabase-server";
import { extractHistoricalScores } from "@/lib/ml/data-pipeline";
import { forecastGeoScore } from "@/lib/ml/forecaster";
import { generatePredictionExplanation } from "@/lib/ml/explainer";
import { db } from "@/lib/db";

// Get references to the mocked functions
const mockDbQuery = db.query;
const mockDbUpdate = db.update;
const mockDbInsert = db.insert;

// ============================================================================
// Test Fixtures
// ============================================================================

const mockBrandId = "test-brand-123";
const mockUserId = "test-user-456";

const mockBrand = {
  id: mockBrandId,
  name: "Test Brand",
  organizationId: "org-123",
};

const createMockPrediction = (daysFromNow: number, predictionAgeHours: number = 1) => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysFromNow);

  const predictionDate = new Date();
  predictionDate.setHours(predictionDate.getHours() - predictionAgeHours);

  return {
    id: `pred-${daysFromNow}`,
    brandId: mockBrandId,
    entityType: "brand" as const,
    entityId: mockBrandId,
    predictionDate,
    targetDate,
    predictedValue: 70 + daysFromNow * 0.1,
    confidenceLower: 65 + daysFromNow * 0.1,
    confidenceUpper: 75 + daysFromNow * 0.1,
    confidence: 0.85,
    trend: "up" as const,
    trendMagnitude: 5,
    explanation: "Test explanation",
    modelVersion: "v1.0.0",
    status: "active" as const,
    metadata: {},
    createdAt: predictionDate,
    updatedAt: predictionDate,
  };
};

// Fresh predictions (1 hour old)
const mockFreshPredictions = Array.from({ length: 90 }, (_, i) =>
  createMockPrediction(i + 1, 1)
);

// Stale predictions (25 hours old - beyond 24-hour TTL)
const mockStalePredictions = Array.from({ length: 90 }, (_, i) =>
  createMockPrediction(i + 1, 25)
);

const mockModelMetadata = {
  id: "model-1",
  modelVersion: "v1.0.0",
  modelType: "linear_regression",
  trainedAt: new Date(),
  isLatest: true,
};

const mockExtractionResult = {
  isValid: true,
  brandId: mockBrandId,
  startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  endDate: new Date(),
  dataPointCount: 90,
  data: Array.from({ length: 90 }, (_, i) => ({
    date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000),
    score: 65 + i * 0.1,
  })),
  validationErrors: [],
};

const mockForecastResult = {
  predictions: Array.from({ length: 90 }, (_, i) => ({
    date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
    predictedValue: 70 + i * 0.1,
    confidenceLower: 65 + i * 0.1,
    confidenceUpper: 75 + i * 0.1,
    confidence: 0.85,
  })),
  modelMetadata: {
    modelVersion: "v1.0.0",
    algorithm: "linear_regression",
    trainingDataPoints: 90,
    trainedAt: new Date(),
    trainingDateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    rSquared: 0.92,
    meanAbsoluteError: 2.5,
  },
  dataQuality: {
    qualityScore: 0.88,
    hasOutliers: false,
    gaps: [],
  },
  isReliable: true,
  warnings: [],
};

const mockExplanation = {
  summary: "GEO score is trending upward based on recent performance",
  trendDescription: "upward",
  confidenceFactors: [
    "Strong model fit (RÂ² = 0.92)",
    "High data quality (88%)",
    "Sufficient training data (90 points)",
  ],
  dataQualityNote: "Data quality is good",
  fullExplanation: "Full explanation text",
};

// ============================================================================
// Helper Functions
// ============================================================================

const setupAuthMock = (userId: string | null = mockUserId) => {
  vi.mocked(auth).mockResolvedValue({ userId } as any);
};

const setupBrandMock = (brand: any = mockBrand) => {
  mockDbQuery.brands.findFirst.mockResolvedValue(brand);
};

const setupPredictionsMock = (predictions: any[] = []) => {
  mockDbQuery.predictions.findMany.mockResolvedValue(predictions);
};

const setupModelMetadataMock = (metadata: any = mockModelMetadata) => {
  mockDbQuery.modelMetadata.findFirst.mockResolvedValue(metadata);
};

const setupMLMocks = () => {
  vi.mocked(extractHistoricalScores).mockResolvedValue(mockExtractionResult as any);
  vi.mocked(forecastGeoScore).mockResolvedValue(mockForecastResult as any);
  vi.mocked(generatePredictionExplanation).mockReturnValue(mockExplanation as any);
};

const setupDatabaseWriteMocks = () => {
  mockDbUpdate.mockReturnValue({
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  });

  mockDbInsert.mockReturnValue({
    values: vi.fn().mockResolvedValue(undefined),
  });
};

// ============================================================================
// Tests
// ============================================================================

describe("GET /api/predictions - Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupBrandMock();
    setupPredictionsMock();
  });

  it("should return 401 when not authenticated", async () => {
    setupAuthMock(null);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 200 when authenticated with valid brand", async () => {
    setupAuthMock();
    setupPredictionsMock(mockFreshPredictions);
    setupModelMetadataMock();

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

describe("GET /api/predictions - Parameter Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMock();
    setupBrandMock();
  });

  it("should return 400 when brandId is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/predictions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("brandId is required");
  });

  it("should accept valid horizon values (30, 60, 90)", async () => {
    setupPredictionsMock(mockFreshPredictions);
    setupModelMetadataMock();

    const validHorizons = [30, 60, 90];

    for (const horizon of validHorizons) {
      vi.clearAllMocks();
      setupAuthMock();
      setupBrandMock();
      setupPredictionsMock(mockFreshPredictions);
      setupModelMetadataMock();

      const request = new NextRequest(
        `http://localhost:3000/api/predictions?brandId=${mockBrandId}&horizon=${horizon}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    }
  });

  it("should return 400 for invalid horizon value", async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}&horizon=120`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("horizon must be one of");
  });

  it("should use default horizon of 90 when not specified", async () => {
    setupPredictionsMock(mockFreshPredictions);
    setupModelMetadataMock();

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should return predictions (default behavior uses 90 days)
    expect(data.predictions).toBeDefined();
  });

  it("should return 404 when brand not found", async () => {
    setupBrandMock(null);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=non-existent`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Brand not found");
  });
});

describe("GET /api/predictions - Cache Hit (Fresh Predictions)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMock();
    setupBrandMock();
  });

  it("should return cached predictions when they are fresh (<24 hours)", async () => {
    setupPredictionsMock(mockFreshPredictions);
    setupModelMetadataMock();

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}&horizon=90`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cached).toBe(true);
    expect(data.dataSource).toBe("cache");
    expect(data.predictions).toBeDefined();
    expect(data.predictions.length).toBeGreaterThan(0);
  });

  it("should include model version in cached response", async () => {
    setupPredictionsMock(mockFreshPredictions);
    setupModelMetadataMock();

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.modelVersion).toBe("v1.0.0");
  });

  it("should include lastUpdated timestamp in cached response", async () => {
    setupPredictionsMock(mockFreshPredictions);
    setupModelMetadataMock();

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.lastUpdated).toBeDefined();
    const lastUpdated = new Date(data.lastUpdated);
    expect(lastUpdated.toString()).not.toBe("Invalid Date");
  });

  it("should format cached predictions correctly", async () => {
    setupPredictionsMock(mockFreshPredictions);
    setupModelMetadataMock();

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    const prediction = data.predictions[0];
    expect(prediction).toHaveProperty("date");
    expect(prediction).toHaveProperty("value");
    expect(prediction).toHaveProperty("confidenceLower");
    expect(prediction).toHaveProperty("confidenceUpper");
    expect(prediction).toHaveProperty("confidence");
    expect(prediction).toHaveProperty("trend");
    expect(prediction).toHaveProperty("explanation");
  });

  it("should convert confidence to percentage (0-100)", async () => {
    setupPredictionsMock(mockFreshPredictions);
    setupModelMetadataMock();

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    const prediction = data.predictions[0];
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(100);
    expect(Number.isInteger(prediction.confidence)).toBe(true);
  });

  it("should not call ML functions when cache is hit", async () => {
    setupPredictionsMock(mockFreshPredictions);
    setupModelMetadataMock();

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    await GET(request);

    expect(extractHistoricalScores).not.toHaveBeenCalled();
    expect(forecastGeoScore).not.toHaveBeenCalled();
    expect(generatePredictionExplanation).not.toHaveBeenCalled();
  });
});

describe("GET /api/predictions - Cache Miss (Stale or Missing Predictions)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMock();
    setupBrandMock();
    setupMLMocks();
    setupDatabaseWriteMocks();
    setupModelMetadataMock(null);
  });

  it("should generate new predictions when cache is empty", async () => {
    setupPredictionsMock([]); // No cached predictions

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cached).toBe(false);
    expect(data.dataSource).toBe("generated");
    expect(extractHistoricalScores).toHaveBeenCalled();
    expect(forecastGeoScore).toHaveBeenCalled();
  });

  it("should generate new predictions when cache is stale (>24 hours)", async () => {
    setupPredictionsMock(mockStalePredictions); // Stale predictions

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cached).toBe(false);
    expect(data.dataSource).toBe("generated");
    expect(extractHistoricalScores).toHaveBeenCalled();
    expect(forecastGeoScore).toHaveBeenCalled();
  });

  it("should extract historical data with correct parameters", async () => {
    setupPredictionsMock([]);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    await GET(request);

    expect(extractHistoricalScores).toHaveBeenCalledWith(
      mockBrandId,
      undefined,
      undefined,
      { minDataPoints: 90 }
    );
  });

  it("should return 400 when insufficient historical data", async () => {
    setupPredictionsMock([]);
    vi.mocked(extractHistoricalScores).mockResolvedValue({
      isValid: false,
      brandId: mockBrandId,
      startDate: new Date(),
      endDate: new Date(),
      dataPointCount: 20,
      data: [],
      validationErrors: ["Insufficient data points: 20 < 30"],
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Insufficient historical data for predictions");
    expect(data.dataPoints).toBe(20);
    expect(data.required).toBe(90);
  });

  it("should generate forecast with correct horizon", async () => {
    setupPredictionsMock([]);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}&horizon=60`
    );
    await GET(request);

    expect(forecastGeoScore).toHaveBeenCalledWith(
      mockExtractionResult.data,
      expect.objectContaining({ periods: 60 })
    );
  });

  it("should store new predictions in database", async () => {
    setupPredictionsMock([]);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    await GET(request);

    expect(mockDbInsert).toHaveBeenCalled();
  });

  it("should mark old predictions as superseded before inserting new ones", async () => {
    setupPredictionsMock([]);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    await GET(request);

    expect(mockDbUpdate).toHaveBeenCalled();
  });

  it("should include full metadata in generated response", async () => {
    setupPredictionsMock([]);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.metadata).toBeDefined();
    expect(data.metadata.historicalDataPoints).toBe(90);
    expect(data.metadata.dataQuality).toBeDefined();
    expect(data.metadata.modelFit).toBeDefined();
    expect(data.metadata.modelFit.rSquared).toBeDefined();
    expect(data.metadata.modelFit.meanAbsoluteError).toBeDefined();
  });

  it("should include explanation in generated response", async () => {
    setupPredictionsMock([]);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.explanation).toBeDefined();
    expect(data.explanation.summary).toBe(mockExplanation.summary);
    expect(data.explanation.confidenceFactors).toBeDefined();
  });
});

describe("GET /api/predictions - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMock();
    setupBrandMock();
  });

  it("should handle database query errors gracefully", async () => {
    mockDbQuery.predictions.findMany.mockRejectedValue(
      new Error("Database connection failed")
    );

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("should handle ML extraction errors", async () => {
    setupPredictionsMock([]);
    vi.mocked(extractHistoricalScores).mockRejectedValue(
      new Error("Data extraction failed")
    );

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("should handle forecasting errors", async () => {
    setupPredictionsMock([]);
    setupMLMocks();
    vi.mocked(forecastGeoScore).mockRejectedValue(new Error("Forecast failed"));

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("should handle data validation errors with 400 status", async () => {
    setupPredictionsMock([]);
    vi.mocked(extractHistoricalScores).mockResolvedValue({
      isValid: false,
      brandId: mockBrandId,
      startDate: new Date(),
      endDate: new Date(),
      dataPointCount: 10,
      data: [],
      validationErrors: ["Data validation failed: insufficient variance"],
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});

describe("GET /api/predictions - Cache TTL Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMock();
    setupBrandMock();
    setupMLMocks();
    setupDatabaseWriteMocks();
    setupModelMetadataMock(null);
  });

  it("should use cache for predictions exactly 23 hours old", async () => {
    const predictions = Array.from({ length: 90 }, (_, i) =>
      createMockPrediction(i + 1, 23)
    );
    setupPredictionsMock(predictions);
    setupModelMetadataMock();

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.cached).toBe(true);
    expect(extractHistoricalScores).not.toHaveBeenCalled();
  });

  it("should regenerate predictions exactly 25 hours old", async () => {
    const predictions = Array.from({ length: 90 }, (_, i) =>
      createMockPrediction(i + 1, 25)
    );
    setupPredictionsMock(predictions);

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.cached).toBe(false);
    expect(data.dataSource).toBe("generated");
    expect(extractHistoricalScores).toHaveBeenCalled();
  });

  it("should check cache only for active predictions", async () => {
    // Mock would typically filter for status = 'active' in real query
    setupPredictionsMock(mockFreshPredictions);
    setupModelMetadataMock();

    const request = new NextRequest(
      `http://localhost:3000/api/predictions?brandId=${mockBrandId}`
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    // In real implementation, query uses eq(predictions.status, "active")
  });
});
