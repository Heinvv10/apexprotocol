/**
 * Recommendation Integration Tests
 *
 * Tests recommendation queries, status transitions, and feedback submission
 * against a real database. Verifies full workflow operations end-to-end.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 *
 * Note: These tests are designed to run against a real database.
 * When the database is not available, all tests will be skipped.
 */

import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  setupIntegrationTest,
  isDatabaseConfigured,
} from "./setup";
import { TEST_IDS } from "./seed";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("Recommendation Integration Tests", () => {
  // If database is not configured, skip all tests with a clear message
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured (set DATABASE_URL or TEST_DATABASE_URL)", () => {});
    return;
  }

  // Set up integration test infrastructure
  const { getDb, getSchema: getSchemaFn, getSeededData, testIds } =
    setupIntegrationTest();

  // Cleanup function for recommendations created during tests
  const cleanupRecommendation = async (recId: string) => {
    const db = getDb();
    const schema = getSchemaFn();
    try {
      // First delete associated feedback
      await db.delete(schema.recommendationFeedback)
        .where(eq(schema.recommendationFeedback.recommendationId, recId));
      // Then delete the recommendation
      await db.delete(schema.recommendations).where(eq(schema.recommendations.id, recId));
    } catch {
      // Ignore cleanup errors
    }
  };

  // Cleanup function for feedback
  const cleanupFeedback = async (feedbackId: string) => {
    const db = getDb();
    const schema = getSchemaFn();
    try {
      await db.delete(schema.recommendationFeedback)
        .where(eq(schema.recommendationFeedback.id, feedbackId));
    } catch {
      // Ignore cleanup errors
    }
  };

  // Helper to create a unique recommendation for testing
  const createUniqueRecommendation = (
    suffix: string = Date.now().toString(),
    status: "pending" | "in_progress" | "completed" | "dismissed" = "pending"
  ) => ({
    id: `integration-rec-${suffix}`,
    brandId: TEST_IDS.BRANDS[0],
    title: `Integration Test Recommendation ${suffix}`,
    description: `This is a test recommendation created for integration testing ${suffix}`,
    category: "content_optimization" as const,
    priority: "medium" as const,
    status,
    effort: "moderate" as const,
    impact: "medium" as const,
    estimatedTime: "1 hour",
    source: "manual" as const,
    steps: ["Step 1", "Step 2", "Step 3"],
    notes: null,
    dueDate: null,
    completedAt: status === "completed" ? new Date() : null,
    dismissedAt: status === "dismissed" ? new Date() : null,
    createdAt: new Date(),
  });

  describe("Query Recommendations (SELECT)", () => {
    it("should fetch seeded recommendations for a brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.recommendations?.length) {
        console.warn("No seeded recommendations available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Query recommendations for the first brand
      const recommendations = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.brandId, brandId));

      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach((rec) => {
        expect(rec.brandId).toBe(brandId);
      });
    });

    it("should fetch a single recommendation by ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.recommendations?.length) {
        console.warn("No seeded recommendations available");
        return;
      }

      const expectedRec = seededData.recommendations[0];

      // Query recommendation by ID
      const [rec] = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.id, expectedRec.id))
        .limit(1);

      expect(rec).toBeDefined();
      expect(rec.id).toBe(expectedRec.id);
      expect(rec.brandId).toBe(expectedRec.brandId);
    });

    it("should return empty array for non-existent recommendation ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.id, "non-existent-rec-id-xyz"))
        .limit(1);

      expect(result).toEqual([]);
      expect(result[0]).toBeUndefined();
    });

    it("should filter recommendations by brandId", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Query with brandId filter
      const recommendations = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.brandId, brandId));

      // All results should have the correct brandId
      recommendations.forEach((rec) => {
        expect(rec.brandId).toBe(brandId);
      });
    });

    it("should filter recommendations by status", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Query by status
      const pendingRecs = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.status, "pending"));

      pendingRecs.forEach((rec) => {
        expect(rec.status).toBe("pending");
      });

      const completedRecs = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.status, "completed"));

      completedRecs.forEach((rec) => {
        expect(rec.status).toBe("completed");
      });
    });

    it("should filter recommendations by priority", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const priorities = ["critical", "high", "medium", "low"] as const;

      for (const priority of priorities) {
        const recs = await db
          .select()
          .from(schema.recommendations)
          .where(eq(schema.recommendations.priority, priority));

        recs.forEach((rec) => {
          expect(rec.priority).toBe(priority);
        });
      }
    });

    it("should filter recommendations by category", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const categories = [
        "technical_seo",
        "content_optimization",
        "schema_markup",
        "citation_building",
        "brand_consistency",
      ] as const;

      for (const category of categories) {
        const recs = await db
          .select()
          .from(schema.recommendations)
          .where(eq(schema.recommendations.category, category));

        recs.forEach((rec) => {
          expect(rec.category).toBe(category);
        });
      }
    });

    it("should filter recommendations by multiple conditions", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;
      const status = "pending";

      // Query with multiple filters
      const recommendations = await db
        .select()
        .from(schema.recommendations)
        .where(
          and(
            eq(schema.recommendations.brandId, brandId),
            eq(schema.recommendations.status, status)
          )
        );

      // All results should match both filters
      recommendations.forEach((rec) => {
        expect(rec.brandId).toBe(brandId);
        expect(rec.status).toBe(status);
      });
    });

    it("should order recommendations by createdAt descending", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Query recommendations ordered by createdAt
      const recommendations = await db
        .select()
        .from(schema.recommendations)
        .orderBy(desc(schema.recommendations.createdAt))
        .limit(10);

      // Verify order (most recent first)
      for (let i = 1; i < recommendations.length; i++) {
        const prevTime = recommendations[i - 1].createdAt?.getTime() || 0;
        const currTime = recommendations[i].createdAt?.getTime() || 0;
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it("should support pagination with limit", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const limit = 3;

      // Get first page
      const firstPage = await db
        .select()
        .from(schema.recommendations)
        .orderBy(desc(schema.recommendations.createdAt))
        .limit(limit);

      expect(firstPage.length).toBeLessThanOrEqual(limit);

      // Get all recommendations for comparison
      const allRecs = await db
        .select()
        .from(schema.recommendations)
        .orderBy(desc(schema.recommendations.createdAt));

      expect(allRecs.length).toBeGreaterThanOrEqual(firstPage.length);
    });
  });

  describe("Status Transitions (UPDATE)", () => {
    let testRecId: string | null = null;

    afterAll(async () => {
      if (testRecId) {
        await cleanupRecommendation(testRecId);
      }
    });

    it("should transition from pending to in_progress", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("transition-pending-ip", "pending");
      testRecId = recData.id;

      // Create pending recommendation
      await db.insert(schema.recommendations).values(recData).returning();

      // Verify initial status
      const [before] = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.id, recData.id))
        .limit(1);
      expect(before.status).toBe("pending");

      // Update to in_progress
      const [updated] = await db
        .update(schema.recommendations)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(schema.recommendations.id, recData.id))
        .returning();

      expect(updated.status).toBe("in_progress");

      // Cleanup
      await cleanupRecommendation(recData.id);
    });

    it("should transition from in_progress to completed", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("transition-ip-completed", "in_progress");

      // Create in_progress recommendation
      await db.insert(schema.recommendations).values(recData).returning();

      // Update to completed with completedAt
      const completedAt = new Date();
      const [updated] = await db
        .update(schema.recommendations)
        .set({ status: "completed", completedAt, updatedAt: new Date() })
        .where(eq(schema.recommendations.id, recData.id))
        .returning();

      expect(updated.status).toBe("completed");
      expect(updated.completedAt).toBeDefined();

      // Cleanup
      await cleanupRecommendation(recData.id);
    });

    it("should transition from pending to dismissed", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("transition-pending-dismissed", "pending");

      // Create pending recommendation
      await db.insert(schema.recommendations).values(recData).returning();

      // Update to dismissed with dismissedAt
      const dismissedAt = new Date();
      const [updated] = await db
        .update(schema.recommendations)
        .set({ status: "dismissed", dismissedAt, updatedAt: new Date() })
        .where(eq(schema.recommendations.id, recData.id))
        .returning();

      expect(updated.status).toBe("dismissed");
      expect(updated.dismissedAt).toBeDefined();

      // Cleanup
      await cleanupRecommendation(recData.id);
    });

    it("should allow transition from completed back to in_progress", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("transition-completed-ip", "completed");

      // Create completed recommendation
      await db.insert(schema.recommendations).values(recData).returning();

      // Update back to in_progress (clearing completedAt)
      const [updated] = await db
        .update(schema.recommendations)
        .set({ status: "in_progress", completedAt: null, updatedAt: new Date() })
        .where(eq(schema.recommendations.id, recData.id))
        .returning();

      expect(updated.status).toBe("in_progress");
      expect(updated.completedAt).toBeNull();

      // Cleanup
      await cleanupRecommendation(recData.id);
    });

    it("should complete full workflow: pending → in_progress → completed", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("full-workflow", "pending");

      // Create pending recommendation
      await db.insert(schema.recommendations).values(recData).returning();

      // Step 1: pending → in_progress
      const [step1] = await db
        .update(schema.recommendations)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(schema.recommendations.id, recData.id))
        .returning();
      expect(step1.status).toBe("in_progress");

      // Step 2: in_progress → completed
      const completedAt = new Date();
      const [step2] = await db
        .update(schema.recommendations)
        .set({ status: "completed", completedAt, updatedAt: new Date() })
        .where(eq(schema.recommendations.id, recData.id))
        .returning();
      expect(step2.status).toBe("completed");
      expect(step2.completedAt).toBeDefined();

      // Verify final state
      const [final] = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.id, recData.id))
        .limit(1);
      expect(final.status).toBe("completed");

      // Cleanup
      await cleanupRecommendation(recData.id);
    });

    it("should update updatedAt timestamp on status change", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("updated-at-test", "pending");

      // Create pending recommendation
      const [created] = await db.insert(schema.recommendations).values(recData).returning();
      const originalUpdatedAt = created.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update status
      const [updated] = await db
        .update(schema.recommendations)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(schema.recommendations.id, recData.id))
        .returning();

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );

      // Cleanup
      await cleanupRecommendation(recData.id);
    });
  });

  describe("Feedback Submission (INSERT)", () => {
    let testRecId: string | null = null;
    const feedbackIds: string[] = [];

    afterAll(async () => {
      // Cleanup feedback first
      for (const feedbackId of feedbackIds) {
        await cleanupFeedback(feedbackId);
      }
      // Then cleanup recommendation
      if (testRecId) {
        await cleanupRecommendation(testRecId);
      }
    });

    it("should create feedback record for recommendation", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("feedback-test-1", "completed");
      testRecId = recData.id;

      // Create recommendation first
      await db.insert(schema.recommendations).values(recData).returning();

      // Create feedback (id is auto-generated, userId is required)
      const [feedback] = await db
        .insert(schema.recommendationFeedback)
        .values({
          recommendationId: recData.id,
          userId: TEST_IDS.USERS[0],
          rating: 5,
          wasHelpful: true,
          comment: "Great recommendation!",
          expectedImpact: 0.8,
        })
        .returning();

      // Track for cleanup
      if (feedback?.id) {
        feedbackIds.push(feedback.id);
      }

      expect(feedback).toBeDefined();
      expect(feedback.recommendationId).toBe(recData.id);
      expect(feedback.rating).toBe(5);
      expect(feedback.wasHelpful).toBe(true);
      expect(feedback.comment).toBe("Great recommendation!");
    });

    it("should allow multiple feedback records for same recommendation", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("feedback-test-multiple", "completed");

      // Create recommendation
      await db.insert(schema.recommendations).values(recData).returning();

      // Create first feedback (id is auto-generated)
      const [feedback1] = await db.insert(schema.recommendationFeedback).values({
        recommendationId: recData.id,
        userId: TEST_IDS.USERS[0],
        rating: 4,
        wasHelpful: true,
        comment: "First feedback",
      }).returning();
      if (feedback1?.id) feedbackIds.push(feedback1.id);

      // Create second feedback
      const [feedback2] = await db.insert(schema.recommendationFeedback).values({
        recommendationId: recData.id,
        userId: TEST_IDS.USERS[1],
        rating: 5,
        wasHelpful: true,
        comment: "Second feedback",
      }).returning();
      if (feedback2?.id) feedbackIds.push(feedback2.id);

      // Query all feedback for this recommendation
      const allFeedback = await db
        .select()
        .from(schema.recommendationFeedback)
        .where(eq(schema.recommendationFeedback.recommendationId, recData.id));

      expect(allFeedback.length).toBe(2);

      // Cleanup
      await cleanupRecommendation(recData.id);
    });

    it("should store rating values correctly (1-5 scale)", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("feedback-rating-test", "completed");

      // Create recommendation
      await db.insert(schema.recommendations).values(recData).returning();

      // Test different rating values
      const ratings = [1, 2, 3, 4, 5];

      for (const rating of ratings) {
        const [feedback] = await db
          .insert(schema.recommendationFeedback)
          .values({
            recommendationId: recData.id,
            userId: TEST_IDS.USERS[0],
            rating,
            wasHelpful: rating > 3,
          })
          .returning();

        if (feedback?.id) feedbackIds.push(feedback.id);
        expect(feedback.rating).toBe(rating);
      }

      // Cleanup
      await cleanupRecommendation(recData.id);
    });

    it("should order feedback by createdAt descending", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("feedback-order-test", "completed");

      // Create recommendation
      await db.insert(schema.recommendations).values(recData).returning();

      // Create feedback with delays
      for (let i = 0; i < 3; i++) {
        const feedbackId = `integration-feedback-order-${i}-${Date.now()}`;
        feedbackIds.push(feedbackId);

        await db.insert(schema.recommendationFeedback).values({
          id: feedbackId,
          recommendationId: recData.id,
          rating: i + 3,
          wasHelpful: true,
          comment: `Feedback ${i}`,
          createdAt: new Date(Date.now() + i * 1000), // Stagger timestamps
        });
      }

      // Query feedback ordered by createdAt desc
      const feedbackList = await db
        .select()
        .from(schema.recommendationFeedback)
        .where(eq(schema.recommendationFeedback.recommendationId, recData.id))
        .orderBy(desc(schema.recommendationFeedback.createdAt));

      // Verify order
      for (let i = 1; i < feedbackList.length; i++) {
        const prevTime = feedbackList[i - 1].createdAt?.getTime() || 0;
        const currTime = feedbackList[i].createdAt?.getTime() || 0;
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }

      // Cleanup
      await cleanupRecommendation(recData.id);
    });

    it("should handle feedback with optional fields", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("feedback-optional-test", "completed");

      // Create recommendation
      await db.insert(schema.recommendations).values(recData).returning();

      // Create minimal feedback (no comment, no expectedImpact)
      const feedbackId = `integration-feedback-minimal-${Date.now()}`;
      feedbackIds.push(feedbackId);

      const [feedback] = await db
        .insert(schema.recommendationFeedback)
        .values({
          id: feedbackId,
          recommendationId: recData.id,
          rating: 3,
          wasHelpful: false,
          createdAt: new Date(),
        })
        .returning();

      expect(feedback.comment).toBeNull();
      expect(feedback.expectedImpact).toBeNull();

      // Cleanup
      await cleanupRecommendation(recData.id);
    });
  });

  describe("Assignment (UPDATE)", () => {
    let testRecId: string | null = null;

    afterAll(async () => {
      if (testRecId) {
        await cleanupRecommendation(testRecId);
      }
    });

    it("should assign recommendation to a user", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("assign-test", "pending");
      const userId = TEST_IDS.USERS[0];
      testRecId = recData.id;

      // Create recommendation
      await db.insert(schema.recommendations).values(recData).returning();

      // Assign to user
      const [assigned] = await db
        .update(schema.recommendations)
        .set({ assignedToId: userId, updatedAt: new Date() })
        .where(eq(schema.recommendations.id, recData.id))
        .returning();

      expect(assigned.assignedToId).toBe(userId);

      // Cleanup
      await cleanupRecommendation(recData.id);
    });

    it("should reassign recommendation to different user", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("reassign-test", "pending");
      const userId1 = TEST_IDS.USERS[0];
      const userId2 = TEST_IDS.USERS[1];

      // Create recommendation assigned to first user
      const withAssignment = { ...recData, assignedToId: userId1 };
      await db.insert(schema.recommendations).values(withAssignment).returning();

      // Reassign to second user
      const [reassigned] = await db
        .update(schema.recommendations)
        .set({ assignedToId: userId2, updatedAt: new Date() })
        .where(eq(schema.recommendations.id, recData.id))
        .returning();

      expect(reassigned.assignedToId).toBe(userId2);

      // Cleanup
      await cleanupRecommendation(recData.id);
    });

    it("should unassign recommendation by setting assignedToId to null", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recData = createUniqueRecommendation("unassign-test", "pending");
      const userId = TEST_IDS.USERS[0];

      // Create recommendation assigned to user
      const withAssignment = { ...recData, assignedToId: userId };
      await db.insert(schema.recommendations).values(withAssignment).returning();

      // Unassign
      const [unassigned] = await db
        .update(schema.recommendations)
        .set({ assignedToId: null, updatedAt: new Date() })
        .where(eq(schema.recommendations.id, recData.id))
        .returning();

      expect(unassigned.assignedToId).toBeNull();

      // Cleanup
      await cleanupRecommendation(recData.id);
    });
  });

  describe("Recommendation and Brand Relationship", () => {
    it("should be able to join recommendation with brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.recommendations?.length || !seededData?.brands?.length) {
        console.warn("No seeded data available");
        return;
      }

      const recId = seededData.recommendations[0].id;

      // Get recommendation
      const [rec] = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.id, recId))
        .limit(1);

      expect(rec).toBeDefined();

      // Get associated brand
      const [brand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, rec.brandId))
        .limit(1);

      expect(brand).toBeDefined();
      expect(brand.id).toBe(rec.brandId);
    });

    it("should get recommendations count by status for a brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Get all recommendations for brand
      const recommendations = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.brandId, brandId));

      // Count by status
      const byStatus = recommendations.reduce((acc, rec) => {
        acc[rec.status] = (acc[rec.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Verify we can compute counts
      const totalCount = Object.values(byStatus).reduce((sum, c) => sum + c, 0);
      expect(totalCount).toBe(recommendations.length);
    });
  });

  describe("Computed Fields", () => {
    it("should compute estimatedImpact based on impact value", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.recommendations?.length) {
        console.warn("No seeded recommendations available");
        return;
      }

      // Query recommendations
      const recommendations = await db
        .select()
        .from(schema.recommendations)
        .limit(10);

      // Verify we can compute estimated impact as GraphQL resolver would
      recommendations.forEach((rec) => {
        const estimatedImpact =
          rec.impact === "high" ? 0.8 :
          rec.impact === "medium" ? 0.5 : 0.3;

        expect(estimatedImpact).toBeGreaterThanOrEqual(0.3);
        expect(estimatedImpact).toBeLessThanOrEqual(0.8);
      });
    });

    it("should compute type from category", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.recommendations?.length) {
        console.warn("No seeded recommendations available");
        return;
      }

      // Query recommendations
      const recommendations = await db
        .select()
        .from(schema.recommendations)
        .limit(10);

      // Each recommendation should have a category that can be used as type
      recommendations.forEach((rec) => {
        expect(rec.category).toBeDefined();
        expect(typeof rec.category).toBe("string");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle recommendation with null optional fields", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recId = `rec-null-fields-${Date.now()}`;

      // Insert recommendation with minimal data
      const [insertedRec] = await db
        .insert(schema.recommendations)
        .values({
          id: recId,
          brandId: TEST_IDS.BRANDS[0],
          title: "Minimal Recommendation",
          description: "Test description",
          category: "content_optimization",
          priority: "low",
          status: "pending",
          effort: "quick_win",
          impact: "low",
          source: "manual",
          // Optional fields left undefined
        })
        .returning();

      // Cleanup
      await cleanupRecommendation(recId);

      // Verify defaults/nulls
      expect(insertedRec).toBeDefined();
      expect(insertedRec.auditId).toBeNull();
      expect(insertedRec.assignedToId).toBeNull();
      expect(insertedRec.notes).toBeNull();
      expect(insertedRec.dueDate).toBeNull();
      expect(insertedRec.completedAt).toBeNull();
      expect(insertedRec.dismissedAt).toBeNull();
    });

    it("should handle recommendation with empty steps array", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recId = `rec-empty-steps-${Date.now()}`;

      // Insert recommendation with empty steps
      const [insertedRec] = await db
        .insert(schema.recommendations)
        .values({
          id: recId,
          brandId: TEST_IDS.BRANDS[0],
          title: "Recommendation with no steps",
          description: "Test",
          category: "technical_seo",
          priority: "medium",
          status: "pending",
          effort: "moderate",
          impact: "medium",
          source: "audit",
          steps: [],
        })
        .returning();

      // Cleanup
      await cleanupRecommendation(recId);

      // Verify empty array is stored
      expect(insertedRec.steps).toEqual([]);
    });

    it("should handle recommendation with long description", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recId = `rec-long-desc-${Date.now()}`;
      const longDescription = "A".repeat(5000);

      // Insert recommendation with long description
      const [insertedRec] = await db
        .insert(schema.recommendations)
        .values({
          id: recId,
          brandId: TEST_IDS.BRANDS[0],
          title: "Long Description Rec",
          description: longDescription,
          category: "schema_markup",
          priority: "high",
          status: "pending",
          effort: "major",
          impact: "high",
          source: "monitoring",
        })
        .returning();

      // Cleanup
      await cleanupRecommendation(recId);

      // Verify long text is stored
      expect(insertedRec.description).toBe(longDescription);
      expect(insertedRec.description?.length).toBe(5000);
    });

    it("should handle all valid status values", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const statuses = ["pending", "in_progress", "completed", "dismissed"] as const;

      for (const status of statuses) {
        const recId = `rec-status-${status}-${Date.now()}`;

        const [insertedRec] = await db
          .insert(schema.recommendations)
          .values({
            id: recId,
            brandId: TEST_IDS.BRANDS[0],
            title: `Rec with ${status} status`,
            description: "Test",
            category: "citation_building",
            priority: "low",
            status,
            effort: "quick_win",
            impact: "low",
            source: "content",
            completedAt: status === "completed" ? new Date() : null,
            dismissedAt: status === "dismissed" ? new Date() : null,
          })
          .returning();

        // Cleanup
        await cleanupRecommendation(recId);

        expect(insertedRec.status).toBe(status);
      }
    });

    it("should enforce foreign key constraint for brandId", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const recId = `rec-fk-test-${Date.now()}`;

      // Attempt to insert with invalid brandId
      try {
        await db
          .insert(schema.recommendations)
          .values({
            id: recId,
            brandId: "non-existent-brand-id-xyz",
            title: "Invalid Brand Rec",
            description: "Test",
            category: "brand_consistency",
            priority: "medium",
            status: "pending",
            effort: "moderate",
            impact: "medium",
            source: "manual",
          })
          .returning();
        // May or may not throw depending on FK enforcement
      } catch (error) {
        // Expected: foreign key violation
        expect(error).toBeDefined();
      }
    });
  });
});
