/**
 * Notification Triggers Unit Tests
 * Tests for notification trigger functions including predictive alerts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Prediction } from "@/lib/db/schema/predictions";

// Mock database
vi.mock("@/lib/db", () => {
  const mockBrand = {
    id: "brand-1",
    name: "Test Brand",
    domain: "testbrand.com",
    organizationId: "org-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const exports: Record<string, unknown> = {
    db: {
      query: {
        brands: {
          findFirst: vi.fn().mockResolvedValue(mockBrand),
        },
        notifications: {
          findFirst: vi.fn().mockResolvedValue(null), // No recent alerts by default
        },
      },
    },
  };

  return exports;
});

// Mock notification service
vi.mock("./service", () => ({
  createNotification: vi.fn().mockResolvedValue({
    id: "notif-1",
    deduplicated: false,
  }),
}));

// Mock predictive alerts module
vi.mock("@/lib/alerts/predictive-alerts", () => ({
  shouldTriggerPredictiveAlert: vi.fn(),
  generateAlertTitle: vi.fn().mockReturnValue("ðŸš¨ Predicted GEO Score Drop of 25.0%"),
  generateAlertMessage: vi.fn().mockReturnValue("Test Brand's GEO score is predicted to drop from 80.0 to 60.0 in 30 days (80.0% confidence)"),
  generateActionRecommendation: vi.fn().mockReturnValue("RECOMMENDED: Monitor the situation closely"),
  calculateAlertPriority: vi.fn().mockReturnValue("high"),
}));

import { onPredictedScoreDrop, type PredictiveTriggerInput } from "./triggers";
import { createNotification } from "./service";
import {
  shouldTriggerPredictiveAlert,
  generateAlertTitle,
  generateAlertMessage,
  generateActionRecommendation,
} from "@/lib/alerts/predictive-alerts";

// Helper function to create mock predictions
function createMockPrediction(
  overrides: Partial<Prediction> = {}
): Prediction {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30); // 30 days in future

  return {
    id: "test-prediction-id",
    brandId: "brand-1",
    entityType: "brand",
    entityId: null,
    predictionDate: new Date(),
    targetDate: futureDate,
    predictedValue: 60.0,
    confidenceLower: 55.0,
    confidenceUpper: 65.0,
    confidence: 0.8,
    trend: "down",
    trendMagnitude: -0.25,
    explanation: "Test prediction explanation",
    modelVersion: "v1.0.0",
    status: "active",
    actualValue: null,
    predictionError: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("onPredictedScoreDrop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create notification with confidence and leadTime when alert criteria are met", async () => {
    const prediction = createMockPrediction();
    const currentScore = 80.0;

    // Mock evaluation to trigger alert (returns boolean true)
    vi.mocked(shouldTriggerPredictiveAlert).mockReturnValue(true);

    const input: PredictiveTriggerInput = {
      prediction,
      currentScore,
      userId: "user-1",
      organizationId: "org-1",
    };

    const result = await onPredictedScoreDrop(input);

    expect(result.success).toBe(true);
    expect(result.notificationId).toBe("notif-1");
    expect(result.skipped).toBeUndefined();

    // Verify notification was created with correct metadata
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        organizationId: "org-1",
        type: "important",
        metadata: expect.objectContaining({
          brandId: "brand-1",
          brandName: "Test Brand",
          predictionId: "test-prediction-id",
          currentScore: 80.0,
          predictedValue: 60.0,
          confidence: 0.8,
          linkUrl: "/dashboard/brands/brand-1/predictions",
        }),
      })
    );
  });

  it("should skip notification when alert criteria are not met", async () => {
    const prediction = createMockPrediction();
    const currentScore = 80.0;

    // Mock evaluation to NOT trigger alert (returns boolean false)
    vi.mocked(shouldTriggerPredictiveAlert).mockReturnValue(false);

    const input: PredictiveTriggerInput = {
      prediction,
      currentScore,
      userId: "user-1",
      organizationId: "org-1",
    };

    const result = await onPredictedScoreDrop(input);

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBeTruthy();

    // Verify notification was NOT created
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("should include targetDate in notification metadata", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);

    const prediction = createMockPrediction({
      targetDate: futureDate,
    });

    vi.mocked(shouldTriggerPredictiveAlert).mockReturnValue({
      trigger: true,
      severity: "critical",
      leadTime: 60,
      percentageChange: 0.35,
    });

    const input: PredictiveTriggerInput = {
      prediction,
      currentScore: 100.0,
      userId: "user-1",
      organizationId: "org-1",
    };

    await onPredictedScoreDrop(input);

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          targetDate: futureDate,
          leadTime: 60,
        }),
      })
    );
  });

  it("should include explanation in notification metadata", async () => {
    const prediction = createMockPrediction({
      explanation: "Score drop predicted due to declining content performance",
    });

    vi.mocked(shouldTriggerPredictiveAlert).mockReturnValue({
      trigger: true,
      severity: "warning",
      leadTime: 30,
      percentageChange: 0.25,
    });

    const input: PredictiveTriggerInput = {
      prediction,
      currentScore: 80.0,
      userId: "user-1",
      organizationId: "org-1",
    };

    await onPredictedScoreDrop(input);

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          explanation: "Score drop predicted due to declining content performance",
        }),
      })
    );
  });

  it("should handle deduplication correctly", async () => {
    const prediction = createMockPrediction();

    vi.mocked(shouldTriggerPredictiveAlert).mockReturnValue({
      trigger: true,
      severity: "warning",
      leadTime: 30,
      percentageChange: 0.25,
    });

    // Mock createNotification to return deduplicated result
    vi.mocked(createNotification).mockResolvedValueOnce({
      id: "notif-1",
      notification: {} as never,
      published: false,
      deduplicated: true,
    });

    const input: PredictiveTriggerInput = {
      prediction,
      currentScore: 80.0,
      userId: "user-1",
      organizationId: "org-1",
    };

    const result = await onPredictedScoreDrop(input);

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("Duplicate notification within deduplication window");
  });

  it("should handle brand not found error", async () => {
    const prediction = createMockPrediction();

    vi.mocked(shouldTriggerPredictiveAlert).mockReturnValue({
      trigger: true,
      severity: "warning",
      leadTime: 30,
      percentageChange: 0.25,
    });

    // Mock brand not found
    const { db } = await import("@/lib/db");
    vi.mocked(db.query.brands.findFirst).mockResolvedValueOnce(undefined);

    const input: PredictiveTriggerInput = {
      prediction,
      currentScore: 80.0,
      userId: "user-1",
      organizationId: "org-1",
    };

    const result = await onPredictedScoreDrop(input);

    expect(result.success).toBe(false);
    expect(result.reason).toBe("Brand not found");
  });

  it("should use helper functions to generate notification content", async () => {
    const prediction = createMockPrediction();

    vi.mocked(shouldTriggerPredictiveAlert).mockReturnValue({
      trigger: true,
      severity: "critical",
      leadTime: 30,
      percentageChange: 0.35,
    });

    const input: PredictiveTriggerInput = {
      prediction,
      currentScore: 100.0,
      userId: "user-1",
      organizationId: "org-1",
    };

    await onPredictedScoreDrop(input);

    // Verify helper functions were called
    expect(generateAlertTitle).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: true,
        severity: "critical",
        leadTime: 30,
        percentageChange: 0.35,
      })
    );

    expect(generateAlertMessage).toHaveBeenCalledWith(
      "Test Brand",
      100.0,
      prediction,
      expect.objectContaining({
        trigger: true,
        severity: "critical",
      })
    );

    expect(generateActionRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: true,
        severity: "critical",
      })
    );
  });

  it("should include action recommendation in metadata", async () => {
    const prediction = createMockPrediction();

    vi.mocked(shouldTriggerPredictiveAlert).mockReturnValue({
      trigger: true,
      severity: "critical",
      leadTime: 30,
      percentageChange: 0.35,
    });

    vi.mocked(generateActionRecommendation).mockReturnValue(
      "URGENT: Review your content strategy immediately"
    );

    const input: PredictiveTriggerInput = {
      prediction,
      currentScore: 100.0,
      userId: "user-1",
      organizationId: "org-1",
    };

    await onPredictedScoreDrop(input);

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          actionRecommendation: "URGENT: Review your content strategy immediately",
        }),
      })
    );
  });
});
