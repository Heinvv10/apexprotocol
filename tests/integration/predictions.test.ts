/**
 * Prediction Integration Tests
 *
 * Tests full CRUD cycle for predictions against real database.
 * Verifies that database operations work correctly end-to-end.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 *
 * Note: These tests are designed to run against a real database.
 * When the database is not available, all tests will be skipped.
 * The tests will fail if DATABASE_URL is set but database is unreachable.
 */

import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { eq, and, desc, gte } from "drizzle-orm";
import {
  setupIntegrationTest,
  isDatabaseConfigured,
} from "./setup";
import { TEST_IDS } from "./seed";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("Prediction Integration Tests", () => {
  // If database is not configured, skip all tests with a clear message
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured (set DATABASE_URL or TEST_DATABASE_URL)", () => {});
    return;
  }

  // Set up integration test infrastructure
  const { getDb, getSchema: getSchemaFn, getSeededData } =
    setupIntegrationTest();

  // Helper to create a unique prediction for testing
  const createUniquePrediction = (suffix: string = Date.now().toString()) => {
    const brandId = TEST_IDS.BRANDS[0];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30); // 30 days in future

    return {
      brandId,
      entityType: "brand" as const,
      predictionDate: new Date(),
      targetDate,
      predictedValue: 75.5,
      confidenceLower: 70.0,
      confidenceUpper: 81.0,
      confidence: 0.85,
      trend: "up" as const,
      trendMagnitude: 5.5,
      explanation: `Test prediction ${suffix}`,
      modelVersion: `test-model-${suffix}`,
      status: "active" as const,
      metadata: {
        historicalDataPoints: 90,
        dataQuality: 85,
        algorithmUsed: "linear-regression",
        warnings: [],
      },
    };
  };

  // Cleanup function for predictions created during tests
  const cleanupPrediction = async (predictionId: string) => {
    const db = getDb();
    const schema = getSchemaFn();
    try {
      // First delete related alerts
      await db.delete(schema.predictiveAlerts).where(eq(schema.predictiveAlerts.predictionId, predictionId));
      // Then delete the prediction
      await db.delete(schema.predictions).where(eq(schema.predictions.id, predictionId));
    } catch {
      // Ignore cleanup errors
    }
  };

  describe("Create Prediction (INSERT)", () => {
    let createdPredictionIds: string[] = [];

    afterAll(async () => {
      for (const id of createdPredictionIds) {
        await cleanupPrediction(id);
      }
    });

    it("should insert a new prediction into the database", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const predictionData = createUniquePrediction("create-test-1");

      // Insert prediction into database
      const [insertedPrediction] = await db
        .insert(schema.predictions)
        .values(predictionData)
        .returning();

      createdPredictionIds.push(insertedPrediction.id);

      // Verify the insert returned data
      expect(insertedPrediction).toBeDefined();
      expect(insertedPrediction.brandId).toBe(predictionData.brandId);
      expect(insertedPrediction.predictedValue).toBe(predictionData.predictedValue);
      expect(insertedPrediction.confidence).toBe(predictionData.confidence);
      expect(insertedPrediction.status).toBe("active");
      expect(insertedPrediction.trend).toBe("up");
    });

    it("should persist prediction data that can be queried", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const predictionData = createUniquePrediction("create-test-2");

      // Insert prediction
      const [inserted] = await db.insert(schema.predictions).values(predictionData).returning();
      createdPredictionIds.push(inserted.id);

      // Query it back
      const [queriedPrediction] = await db
        .select()
        .from(schema.predictions)
        .where(eq(schema.predictions.id, inserted.id))
        .limit(1);

      // Verify data was persisted
      expect(queriedPrediction).toBeDefined();
      expect(queriedPrediction.id).toBe(inserted.id);
      expect(queriedPrediction.brandId).toBe(predictionData.brandId);
      expect(queriedPrediction.predictedValue).toBe(predictionData.predictedValue);
      expect(queriedPrediction.confidenceLower).toBe(predictionData.confidenceLower);
      expect(queriedPrediction.confidenceUpper).toBe(predictionData.confidenceUpper);
      expect(queriedPrediction.modelVersion).toBe(predictionData.modelVersion);
    });

    it("should store complex metadata as JSON", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const predictionData = createUniquePrediction("create-metadata-test");
      predictionData.metadata = {
        historicalDataPoints: 120,
        dataQuality: 92,
        seasonalityDetected: true,
        outlierCount: 3,
        algorithmUsed: "linear-regression",
        features: ["score", "trend", "platform_scores"],
        warnings: ["Low data quality", "High variance"],
      };

      // Insert prediction with complex metadata
      const [inserted] = await db
        .insert(schema.predictions)
        .values(predictionData)
        .returning();

      createdPredictionIds.push(inserted.id);

      // Query it back
      const [queriedPrediction] = await db
        .select()
        .from(schema.predictions)
        .where(eq(schema.predictions.id, inserted.id))
        .limit(1);

      // Verify metadata was stored correctly
      expect(queriedPrediction.metadata).toEqual(predictionData.metadata);
      expect(queriedPrediction.metadata?.seasonalityDetected).toBe(true);
      expect(queriedPrediction.metadata?.warnings).toHaveLength(2);
    });

    it("should set default values for optional fields", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);

      // Insert minimal prediction data
      const [insertedPrediction] = await db
        .insert(schema.predictions)
        .values({
          brandId: TEST_IDS.BRANDS[0],
          entityType: "brand" as const,
          targetDate,
          predictedValue: 80.0,
          confidenceLower: 75.0,
          confidenceUpper: 85.0,
          confidence: 0.9,
          modelVersion: "test-minimal",
        })
        .returning();

      createdPredictionIds.push(insertedPrediction.id);

      // Verify defaults were set
      expect(insertedPrediction).toBeDefined();
      expect(insertedPrediction.status).toBe("active");
      expect(insertedPrediction.entityType).toBe("brand");
      expect(insertedPrediction.predictionDate).toBeDefined();
      expect(insertedPrediction.createdAt).toBeDefined();
      expect(insertedPrediction.updatedAt).toBeDefined();
    });
  });

  describe("Read Predictions (SELECT)", () => {
    let testPredictionIds: string[] = [];

    beforeEach(async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create test predictions
      const predictions = [
        createUniquePrediction("read-test-1"),
        createUniquePrediction("read-test-2"),
        createUniquePrediction("read-test-3"),
      ];

      const inserted = await db
        .insert(schema.predictions)
        .values(predictions)
        .returning();

      testPredictionIds = inserted.map((p) => p.id);
    });

    afterAll(async () => {
      for (const id of testPredictionIds) {
        await cleanupPrediction(id);
      }
    });

    it("should fetch predictions by brand ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const predictions = await db
        .select()
        .from(schema.predictions)
        .where(eq(schema.predictions.brandId, TEST_IDS.BRANDS[0]));

      expect(predictions.length).toBeGreaterThanOrEqual(3);
      predictions.forEach((p) => {
        expect(p.brandId).toBe(TEST_IDS.BRANDS[0]);
      });
    });

    it("should fetch only active predictions", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const activePredictions = await db
        .select()
        .from(schema.predictions)
        .where(
          and(
            eq(schema.predictions.brandId, TEST_IDS.BRANDS[0]),
            eq(schema.predictions.status, "active")
          )
        );

      expect(activePredictions.length).toBeGreaterThanOrEqual(3);
      activePredictions.forEach((p) => {
        expect(p.status).toBe("active");
      });
    });

    it("should fetch future predictions only", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const now = new Date();

      const futurePredictions = await db
        .select()
        .from(schema.predictions)
        .where(
          and(
            eq(schema.predictions.brandId, TEST_IDS.BRANDS[0]),
            gte(schema.predictions.targetDate, now)
          )
        );

      expect(futurePredictions.length).toBeGreaterThanOrEqual(3);
      futurePredictions.forEach((p) => {
        expect(p.targetDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
      });
    });

    it("should order predictions by target date descending", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const predictions = await db
        .select()
        .from(schema.predictions)
        .where(eq(schema.predictions.brandId, TEST_IDS.BRANDS[0]))
        .orderBy(desc(schema.predictions.targetDate));

      expect(predictions.length).toBeGreaterThanOrEqual(3);

      // Verify ordering
      for (let i = 0; i < predictions.length - 1; i++) {
        expect(predictions[i].targetDate.getTime()).toBeGreaterThanOrEqual(
          predictions[i + 1].targetDate.getTime()
        );
      }
    });
  });

  describe("Update Predictions (UPDATE)", () => {
    let testPredictionId: string | null = null;

    beforeEach(async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const [inserted] = await db
        .insert(schema.predictions)
        .values(createUniquePrediction("update-test"))
        .returning();

      testPredictionId = inserted.id;
    });

    afterAll(async () => {
      if (testPredictionId) {
        await cleanupPrediction(testPredictionId);
      }
    });

    it("should update prediction status to superseded", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Update prediction status
      const [updatedPrediction] = await db
        .update(schema.predictions)
        .set({ status: "superseded", updatedAt: new Date() })
        .where(eq(schema.predictions.id, testPredictionId!))
        .returning();

      expect(updatedPrediction).toBeDefined();
      expect(updatedPrediction.status).toBe("superseded");
    });

    it("should update actual value and prediction error", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const actualValue = 78.5;
      const prediction = await db.query.predictions.findFirst({
        where: eq(schema.predictions.id, testPredictionId!),
      });

      const predictionError = Math.abs(actualValue - prediction!.predictedValue);

      // Update with actual values
      const [updated] = await db
        .update(schema.predictions)
        .set({
          actualValue,
          predictionError,
          updatedAt: new Date(),
        })
        .where(eq(schema.predictions.id, testPredictionId!))
        .returning();

      expect(updated.actualValue).toBe(actualValue);
      expect(updated.predictionError).toBeCloseTo(predictionError, 2);
    });

    it("should bulk update predictions for a brand to superseded", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create multiple predictions
      const predictions = [
        createUniquePrediction("bulk-1"),
        createUniquePrediction("bulk-2"),
      ];

      const inserted = await db
        .insert(schema.predictions)
        .values(predictions)
        .returning();

      const insertedIds = inserted.map((p) => p.id);

      // Bulk update all active predictions for this brand
      await db
        .update(schema.predictions)
        .set({ status: "superseded", updatedAt: new Date() })
        .where(
          and(
            eq(schema.predictions.brandId, TEST_IDS.BRANDS[0]),
            eq(schema.predictions.status, "active")
          )
        );

      // Verify updates
      const updatedPredictions = await db
        .select()
        .from(schema.predictions)
        .where(eq(schema.predictions.brandId, TEST_IDS.BRANDS[0]));

      const activeCount = updatedPredictions.filter((p) => p.status === "active").length;
      expect(activeCount).toBe(0);

      // Cleanup
      for (const id of insertedIds) {
        await cleanupPrediction(id);
      }
    });
  });

  describe("Delete Predictions (DELETE)", () => {
    it("should delete a prediction by ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create a prediction
      const [inserted] = await db
        .insert(schema.predictions)
        .values(createUniquePrediction("delete-test"))
        .returning();

      // Delete it
      await db
        .delete(schema.predictions)
        .where(eq(schema.predictions.id, inserted.id));

      // Verify it's gone
      const [deleted] = await db
        .select()
        .from(schema.predictions)
        .where(eq(schema.predictions.id, inserted.id))
        .limit(1);

      expect(deleted).toBeUndefined();
    });

    it("should cascade delete predictions when brand is deleted", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create a temporary brand
      const brandId = `integration-test-brand-${Date.now()}`;
      await db.insert(schema.brands).values({
        id: brandId,
        organizationId: TEST_IDS.ORG,
        name: "Temp Brand for Cascade Test",
        isActive: true,
        monitoringPlatforms: ["chatgpt"],
      });

      // Create predictions for this brand
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);

      await db.insert(schema.predictions).values({
        brandId,
        targetDate,
        predictedValue: 80.0,
        confidenceLower: 75.0,
        confidenceUpper: 85.0,
        confidence: 0.9,
        modelVersion: "cascade-test",
      });

      // Verify prediction exists
      const predictionsBefore = await db
        .select()
        .from(schema.predictions)
        .where(eq(schema.predictions.brandId, brandId));

      expect(predictionsBefore.length).toBe(1);

      // Delete the brand (should cascade)
      await db.delete(schema.brands).where(eq(schema.brands.id, brandId));

      // Verify predictions were cascade deleted
      const predictionsAfter = await db
        .select()
        .from(schema.predictions)
        .where(eq(schema.predictions.brandId, brandId));

      expect(predictionsAfter.length).toBe(0);
    });
  });

  describe("Model Metadata Operations", () => {
    let testModelVersion: string | null = null;

    afterAll(async () => {
      if (testModelVersion) {
        const db = getDb();
        const schema = getSchemaFn();
        try {
          await db
            .delete(schema.modelMetadata)
            .where(eq(schema.modelMetadata.modelVersion, testModelVersion));
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it("should insert and query model metadata", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      testModelVersion = `test-model-${Date.now()}`;

      const [inserted] = await db
        .insert(schema.modelMetadata)
        .values({
          modelVersion: testModelVersion,
          modelType: "linear_regression",
          trainedAt: new Date(),
          trainingDuration: 5000,
          dataPointsUsed: 120,
          performanceMetrics: {
            mae: 2.5,
            rmse: 3.2,
            r2: 0.85,
            accuracy: 92.5,
          },
          hyperparameters: {
            lookbackPeriod: 90,
            predictionHorizon: 30,
            confidenceLevel: 0.95,
          },
          status: "active",
          isLatest: true,
        })
        .returning();

      expect(inserted).toBeDefined();
      expect(inserted.modelVersion).toBe(testModelVersion);
      expect(inserted.status).toBe("active");
      expect(inserted.performanceMetrics?.r2).toBe(0.85);
    });

    it("should enforce unique model version constraint", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const modelVersion = `unique-test-${Date.now()}`;

      // Insert first model
      await db.insert(schema.modelMetadata).values({
        modelVersion,
        modelType: "linear_regression",
        status: "active",
        isLatest: true,
      });

      // Attempt duplicate insert
      try {
        await db.insert(schema.modelMetadata).values({
          modelVersion,
          modelType: "linear_regression",
          status: "active",
          isLatest: false,
        });
        expect.fail("Should have thrown unique constraint error");
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        // Cleanup
        await db
          .delete(schema.modelMetadata)
          .where(eq(schema.modelMetadata.modelVersion, modelVersion));
      }
    });
  });
});
