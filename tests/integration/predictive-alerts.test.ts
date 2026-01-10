/**
 * Predictive Alert Integration Tests
 *
 * Tests full CRUD cycle for predictive alerts against real database.
 * Verifies that alert triggering logic and database operations work correctly end-to-end.
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
import { eq, and, desc } from "drizzle-orm";
import {
  setupIntegrationTest,
  isDatabaseConfigured,
} from "./setup";
import { TEST_IDS } from "./seed";
import {
  shouldTriggerPredictiveAlert,
  generateAlertTitle,
  generateAlertMessage,
  generateActionRecommendation,
} from "../../src/lib/alerts/predictive-alerts";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("Predictive Alert Integration Tests", () => {
  // If database is not configured, skip all tests with a clear message
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured (set DATABASE_URL or TEST_DATABASE_URL)", () => {});
    return;
  }

  // Set up integration test infrastructure
  const { getDb, getSchema: getSchemaFn, getSeededData } =
    setupIntegrationTest();

  // Helper to create a unique alert for testing
  const createUniqueAlert = (suffix: string = Date.now().toString()) => {
    const seededData = getSeededData();
    const brandId = TEST_IDS.BRANDS[0];
    const userId = seededData?.users[0]?.id || TEST_IDS.USERS[0];
    const predictedImpactDate = new Date();
    predictedImpactDate.setDate(predictedImpactDate.getDate() + 7); // 7 days out

    return {
      brandId,
      userId,
      alertType: "predicted_drop" as const,
      severity: "high" as const,
      confidence: 0.85,
      currentValue: 75.0,
      predictedValue: 50.0,
      predictedChange: -33.3,
      leadTime: 7,
      predictedImpactDate,
      title: `Test Alert ${suffix}`,
      explanation: `Test explanation ${suffix}`,
      actionRecommendation: "Test action recommendation",
      isRead: false,
      isDismissed: false,
    };
  };

  // Cleanup function for alerts created during tests
  const cleanupAlert = async (alertId: string) => {
    const db = getDb();
    const schema = getSchemaFn();
    try {
      await db.delete(schema.predictiveAlerts).where(eq(schema.predictiveAlerts.id, alertId));
    } catch {
      // Ignore cleanup errors
    }
  };

  describe("Create Alert (INSERT)", () => {
    let createdAlertIds: string[] = [];

    afterAll(async () => {
      for (const id of createdAlertIds) {
        await cleanupAlert(id);
      }
    });

    it("should insert a new alert into the database", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const alertData = createUniqueAlert("create-test-1");

      // Insert alert into database
      const [insertedAlert] = await db
        .insert(schema.predictiveAlerts)
        .values(alertData)
        .returning();

      createdAlertIds.push(insertedAlert.id);

      // Verify the insert returned data
      expect(insertedAlert).toBeDefined();
      expect(insertedAlert.brandId).toBe(alertData.brandId);
      expect(insertedAlert.userId).toBe(alertData.userId);
      expect(insertedAlert.alertType).toBe("predicted_drop");
      expect(insertedAlert.severity).toBe("high");
      expect(insertedAlert.confidence).toBe(0.85);
      expect(insertedAlert.isRead).toBe(false);
      expect(insertedAlert.isDismissed).toBe(false);
    });

    it("should persist alert data that can be queried", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const alertData = createUniqueAlert("create-test-2");

      // Insert alert
      const [inserted] = await db.insert(schema.predictiveAlerts).values(alertData).returning();
      createdAlertIds.push(inserted.id);

      // Query it back
      const [queriedAlert] = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.id, inserted.id))
        .limit(1);

      // Verify data was persisted
      expect(queriedAlert).toBeDefined();
      expect(queriedAlert.id).toBe(inserted.id);
      expect(queriedAlert.currentValue).toBe(alertData.currentValue);
      expect(queriedAlert.predictedValue).toBe(alertData.predictedValue);
      expect(queriedAlert.predictedChange).toBe(alertData.predictedChange);
      expect(queriedAlert.leadTime).toBe(alertData.leadTime);
    });

    it("should support different alert types and severities", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const alertTypes = [
        { type: "predicted_drop" as const, severity: "high" as const },
        { type: "emerging_opportunity" as const, severity: "medium" as const },
        { type: "trend_reversal" as const, severity: "low" as const },
      ];

      for (const { type, severity } of alertTypes) {
        const alertData = createUniqueAlert(`type-${type}`);
        alertData.alertType = type;
        alertData.severity = severity;

        const [inserted] = await db
          .insert(schema.predictiveAlerts)
          .values(alertData)
          .returning();

        createdAlertIds.push(inserted.id);

        expect(inserted.alertType).toBe(type);
        expect(inserted.severity).toBe(severity);
      }
    });

    it("should link alert to a prediction", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create a prediction first
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);

      const [prediction] = await db
        .insert(schema.predictions)
        .values({
          brandId: TEST_IDS.BRANDS[0],
          targetDate,
          predictedValue: 60.0,
          confidenceLower: 55.0,
          confidenceUpper: 65.0,
          confidence: 0.8,
          modelVersion: "test-alert-link",
        })
        .returning();

      // Create an alert linked to this prediction
      const alertData = createUniqueAlert("with-prediction");
      alertData.predictionId = prediction.id;

      const [inserted] = await db
        .insert(schema.predictiveAlerts)
        .values(alertData)
        .returning();

      createdAlertIds.push(inserted.id);

      expect(inserted.predictionId).toBe(prediction.id);

      // Cleanup prediction
      await db.delete(schema.predictions).where(eq(schema.predictions.id, prediction.id));
    });
  });

  describe("Read Alerts (SELECT)", () => {
    let testAlertIds: string[] = [];

    beforeEach(async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();
      const userId = seededData?.users[0]?.id || TEST_IDS.USERS[0];

      // Create test alerts
      const alerts = [
        { ...createUniqueAlert("read-test-1"), userId, isRead: false },
        { ...createUniqueAlert("read-test-2"), userId, isRead: true },
        { ...createUniqueAlert("read-test-3"), userId, isDismissed: true },
      ];

      const inserted = await db
        .insert(schema.predictiveAlerts)
        .values(alerts)
        .returning();

      testAlertIds = inserted.map((a) => a.id);
    });

    afterAll(async () => {
      for (const id of testAlertIds) {
        await cleanupAlert(id);
      }
    });

    it("should fetch alerts by user ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();
      const userId = seededData?.users[0]?.id || TEST_IDS.USERS[0];

      const alerts = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.userId, userId));

      expect(alerts.length).toBeGreaterThanOrEqual(3);
      alerts.forEach((a) => {
        expect(a.userId).toBe(userId);
      });
    });

    it("should fetch only unread alerts", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();
      const userId = seededData?.users[0]?.id || TEST_IDS.USERS[0];

      const unreadAlerts = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(
          and(
            eq(schema.predictiveAlerts.userId, userId),
            eq(schema.predictiveAlerts.isRead, false)
          )
        );

      expect(unreadAlerts.length).toBeGreaterThanOrEqual(1);
      unreadAlerts.forEach((a) => {
        expect(a.isRead).toBe(false);
      });
    });

    it("should fetch alerts by brand ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const brandAlerts = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.brandId, TEST_IDS.BRANDS[0]));

      expect(brandAlerts.length).toBeGreaterThanOrEqual(3);
      brandAlerts.forEach((a) => {
        expect(a.brandId).toBe(TEST_IDS.BRANDS[0]);
      });
    });

    it("should fetch alerts by severity", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const highSeverityAlerts = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.severity, "high"));

      expect(highSeverityAlerts.length).toBeGreaterThanOrEqual(1);
      highSeverityAlerts.forEach((a) => {
        expect(a.severity).toBe("high");
      });
    });

    it("should order alerts by creation date descending", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();
      const userId = seededData?.users[0]?.id || TEST_IDS.USERS[0];

      const alerts = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.userId, userId))
        .orderBy(desc(schema.predictiveAlerts.createdAt));

      expect(alerts.length).toBeGreaterThanOrEqual(3);

      // Verify ordering
      for (let i = 0; i < alerts.length - 1; i++) {
        expect(alerts[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          alerts[i + 1].createdAt.getTime()
        );
      }
    });
  });

  describe("Update Alerts (UPDATE)", () => {
    let testAlertId: string | null = null;

    beforeEach(async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const [inserted] = await db
        .insert(schema.predictiveAlerts)
        .values(createUniqueAlert("update-test"))
        .returning();

      testAlertId = inserted.id;
    });

    afterAll(async () => {
      if (testAlertId) {
        await cleanupAlert(testAlertId);
      }
    });

    it("should mark alert as read", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Update alert to read
      const [updatedAlert] = await db
        .update(schema.predictiveAlerts)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(schema.predictiveAlerts.id, testAlertId!))
        .returning();

      expect(updatedAlert).toBeDefined();
      expect(updatedAlert.isRead).toBe(true);
    });

    it("should dismiss an alert", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const dismissedAt = new Date();

      // Update alert to dismissed
      const [updatedAlert] = await db
        .update(schema.predictiveAlerts)
        .set({
          isDismissed: true,
          dismissedAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.predictiveAlerts.id, testAlertId!))
        .returning();

      expect(updatedAlert.isDismissed).toBe(true);
      expect(updatedAlert.dismissedAt).toBeDefined();
    });

    it("should validate alert accuracy", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const validatedAt = new Date();

      // Update with validation info
      const [updated] = await db
        .update(schema.predictiveAlerts)
        .set({
          wasAccurate: true,
          validatedAt,
          validationNotes: "Prediction was correct",
          updatedAt: new Date(),
        })
        .where(eq(schema.predictiveAlerts.id, testAlertId!))
        .returning();

      expect(updated.wasAccurate).toBe(true);
      expect(updated.validatedAt).toBeDefined();
      expect(updated.validationNotes).toBe("Prediction was correct");
    });

    it("should bulk mark alerts as read for a user", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();
      const userId = seededData?.users[0]?.id || TEST_IDS.USERS[0];

      // Create multiple unread alerts
      const alerts = [
        createUniqueAlert("bulk-1"),
        createUniqueAlert("bulk-2"),
      ];

      const inserted = await db
        .insert(schema.predictiveAlerts)
        .values(alerts)
        .returning();

      const insertedIds = inserted.map((a) => a.id);

      // Bulk mark as read
      await db
        .update(schema.predictiveAlerts)
        .set({ isRead: true, updatedAt: new Date() })
        .where(
          and(
            eq(schema.predictiveAlerts.userId, userId),
            eq(schema.predictiveAlerts.isRead, false)
          )
        );

      // Verify updates
      const updatedAlerts = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.userId, userId));

      const unreadCount = updatedAlerts.filter((a) => !a.isRead).length;
      expect(unreadCount).toBe(0);

      // Cleanup
      for (const id of insertedIds) {
        await cleanupAlert(id);
      }
    });
  });

  describe("Delete Alerts (DELETE)", () => {
    it("should delete an alert by ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create an alert
      const [inserted] = await db
        .insert(schema.predictiveAlerts)
        .values(createUniqueAlert("delete-test"))
        .returning();

      // Delete it
      await db
        .delete(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.id, inserted.id));

      // Verify it's gone
      const [deleted] = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.id, inserted.id))
        .limit(1);

      expect(deleted).toBeUndefined();
    });

    it("should cascade delete alerts when brand is deleted", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();
      const userId = seededData?.users[0]?.id || TEST_IDS.USERS[0];

      // Create a temporary brand
      const brandId = `integration-test-brand-${Date.now()}`;
      await db.insert(schema.brands).values({
        id: brandId,
        organizationId: TEST_IDS.ORG,
        name: "Temp Brand for Alert Cascade Test",
        isActive: true,
        monitoringPlatforms: ["chatgpt"],
      });

      // Create an alert for this brand
      const predictedImpactDate = new Date();
      predictedImpactDate.setDate(predictedImpactDate.getDate() + 7);

      await db.insert(schema.predictiveAlerts).values({
        brandId,
        userId,
        alertType: "predicted_drop",
        severity: "high",
        confidence: 0.8,
        currentValue: 70.0,
        predictedValue: 50.0,
        predictedChange: -28.6,
        leadTime: 7,
        predictedImpactDate,
        title: "Cascade test alert",
        explanation: "Test",
        isRead: false,
        isDismissed: false,
      });

      // Verify alert exists
      const alertsBefore = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.brandId, brandId));

      expect(alertsBefore.length).toBe(1);

      // Delete the brand (should cascade)
      await db.delete(schema.brands).where(eq(schema.brands.id, brandId));

      // Verify alerts were cascade deleted
      const alertsAfter = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.brandId, brandId));

      expect(alertsAfter.length).toBe(0);
    });

    it("should set predictionId to null when prediction is deleted", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create a prediction
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);

      const [prediction] = await db
        .insert(schema.predictions)
        .values({
          brandId: TEST_IDS.BRANDS[0],
          targetDate,
          predictedValue: 60.0,
          confidenceLower: 55.0,
          confidenceUpper: 65.0,
          confidence: 0.8,
          modelVersion: "test-set-null",
        })
        .returning();

      // Create an alert linked to this prediction
      const alertData = createUniqueAlert("set-null-test");
      alertData.predictionId = prediction.id;

      const [alert] = await db
        .insert(schema.predictiveAlerts)
        .values(alertData)
        .returning();

      // Delete the prediction
      await db.delete(schema.predictions).where(eq(schema.predictions.id, prediction.id));

      // Verify alert still exists but predictionId is null
      const [updatedAlert] = await db
        .select()
        .from(schema.predictiveAlerts)
        .where(eq(schema.predictiveAlerts.id, alert.id))
        .limit(1);

      expect(updatedAlert).toBeDefined();
      expect(updatedAlert.predictionId).toBeNull();

      // Cleanup
      await cleanupAlert(alert.id);
    });
  });

  describe("Alert Triggering Logic", () => {
    it("should trigger alert for high severity drop (>30%)", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create a prediction with significant drop
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 14);

      const [prediction] = await db
        .insert(schema.predictions)
        .values({
          brandId: TEST_IDS.BRANDS[0],
          targetDate,
          predictedValue: 50.0, // Down from 80
          confidenceLower: 45.0,
          confidenceUpper: 55.0,
          confidence: 0.85,
          modelVersion: "test-trigger-high",
        })
        .returning();

      const currentScore = 80.0;
      const evaluation = shouldTriggerPredictiveAlert({
        prediction,
        currentScore,
      });

      expect(evaluation.trigger).toBe(true);
      expect(evaluation.severity).toBe("high");
      expect(evaluation.leadTime).toBeGreaterThan(0);

      // Cleanup
      await db.delete(schema.predictions).where(eq(schema.predictions.id, prediction.id));
    });

    it("should trigger alert for medium severity drop (20-30%)", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);

      const [prediction] = await db
        .insert(schema.predictions)
        .values({
          brandId: TEST_IDS.BRANDS[0],
          targetDate,
          predictedValue: 65.0, // Down from 85 (23.5% drop)
          confidenceLower: 60.0,
          confidenceUpper: 70.0,
          confidence: 0.75,
          modelVersion: "test-trigger-medium",
        })
        .returning();

      const currentScore = 85.0;
      const evaluation = shouldTriggerPredictiveAlert({
        prediction,
        currentScore,
      });

      expect(evaluation.trigger).toBe(true);
      expect(evaluation.severity).toBe("medium");

      // Cleanup
      await db.delete(schema.predictions).where(eq(schema.predictions.id, prediction.id));
    });

    it("should NOT trigger alert for small drop (<20%)", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);

      const [prediction] = await db
        .insert(schema.predictions)
        .values({
          brandId: TEST_IDS.BRANDS[0],
          targetDate,
          predictedValue: 75.0, // Down from 80 (6.25% drop)
          confidenceLower: 70.0,
          confidenceUpper: 80.0,
          confidence: 0.9,
          modelVersion: "test-no-trigger-small",
        })
        .returning();

      const currentScore = 80.0;
      const evaluation = shouldTriggerPredictiveAlert({
        prediction,
        currentScore,
      });

      expect(evaluation.trigger).toBe(false);
      expect(evaluation.reason).toContain("below threshold");

      // Cleanup
      await db.delete(schema.predictions).where(eq(schema.predictions.id, prediction.id));
    });

    it("should NOT trigger alert for low confidence (<70%)", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);

      const [prediction] = await db
        .insert(schema.predictions)
        .values({
          brandId: TEST_IDS.BRANDS[0],
          targetDate,
          predictedValue: 50.0, // Big drop but low confidence
          confidenceLower: 40.0,
          confidenceUpper: 60.0,
          confidence: 0.65, // Below 70% threshold
          modelVersion: "test-no-trigger-confidence",
        })
        .returning();

      const currentScore = 80.0;
      const evaluation = shouldTriggerPredictiveAlert({
        prediction,
        currentScore,
      });

      expect(evaluation.trigger).toBe(false);
      expect(evaluation.reason).toContain("Confidence");

      // Cleanup
      await db.delete(schema.predictions).where(eq(schema.predictions.id, prediction.id));
    });

    it("should generate appropriate alert title and message", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 10);

      const [prediction] = await db
        .insert(schema.predictions)
        .values({
          brandId: TEST_IDS.BRANDS[0],
          targetDate,
          predictedValue: 55.0,
          confidenceLower: 50.0,
          confidenceUpper: 60.0,
          confidence: 0.85,
          modelVersion: "test-message-gen",
        })
        .returning();

      const currentScore = 80.0;
      const evaluation = shouldTriggerPredictiveAlert({
        prediction,
        currentScore,
      });

      const title = generateAlertTitle(evaluation);
      const message = generateAlertMessage("Test Brand", currentScore, prediction, evaluation);
      const action = generateActionRecommendation(evaluation);

      expect(title).toContain("Predicted GEO Score Drop");
      expect(message).toContain("Test Brand");
      expect(message).toContain("80.0");
      expect(message).toContain("55.0");
      expect(action).toContain("URGENT");

      // Cleanup
      await db.delete(schema.predictions).where(eq(schema.predictions.id, prediction.id));
    });
  });
});
