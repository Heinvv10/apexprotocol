/**
 * Content Workflow Validation Unit Tests
 * Tests for workflow status transition validation logic
 */

import { describe, it, expect } from "vitest";

/**
 * Validates if a status transition is allowed based on workflow rules
 * This is the core validation logic from src/app/api/content/status/route.ts
 */
function isValidTransition(currentStatus: string, newStatus: string): boolean {
  // Published is terminal - cannot move back
  if (currentStatus === "published") {
    return false;
  }

  // Draft can move to review or scheduled
  if (currentStatus === "draft") {
    return newStatus === "review" || newStatus === "scheduled";
  }

  // Review can move to draft (reject) or scheduled (approve)
  if (currentStatus === "review") {
    return newStatus === "draft" || newStatus === "scheduled";
  }

  // Scheduled can move to published (auto/manual) or back to draft (cancel)
  if (currentStatus === "scheduled") {
    return newStatus === "published" || newStatus === "draft";
  }

  return false;
}

/**
 * Validates that scheduled time is in the future
 */
function validateScheduledTime(scheduledAt: Date): { valid: boolean; error?: string } {
  const now = new Date();
  if (scheduledAt <= now) {
    return {
      valid: false,
      error: "scheduledAt must be in the future",
    };
  }
  return { valid: true };
}

/**
 * Validates schedule data for creating a schedule
 */
function validateScheduleData(data: {
  contentId: string;
  scheduledAt: string;
  platforms: string[];
  contentStatus: string;
}): { valid: boolean; error?: string } {
  // Validate contentId
  if (!data.contentId || data.contentId.trim() === "") {
    return { valid: false, error: "Content ID is required" };
  }

  // Validate platforms
  if (!data.platforms || data.platforms.length === 0) {
    return { valid: false, error: "At least one platform is required" };
  }

  // Validate platform values
  for (const platform of data.platforms) {
    if (platform !== "wordpress" && platform !== "medium") {
      return {
        valid: false,
        error: `Invalid platform: ${platform}. Must be 'wordpress' or 'medium'`,
      };
    }
  }

  // Verify content is in a schedulable status
  if (data.contentStatus !== "scheduled" && data.contentStatus !== "draft") {
    return {
      valid: false,
      error: `Content must be in 'draft' or 'scheduled' status to create a schedule. Current status: '${data.contentStatus}'`,
    };
  }

  // Validate scheduledAt is in the future
  try {
    const scheduledDate = new Date(data.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return { valid: false, error: "Invalid datetime format" };
    }

    const timeValidation = validateScheduledTime(scheduledDate);
    if (!timeValidation.valid) {
      return timeValidation;
    }
  } catch {
    return { valid: false, error: "Invalid datetime format" };
  }

  return { valid: true };
}

// ============================================================================
// Test Suites
// ============================================================================

describe("Workflow Status Transition Validation", () => {
  describe("isValidTransition", () => {
    describe("from draft status", () => {
      it("should allow transition from draft to review", () => {
        expect(isValidTransition("draft", "review")).toBe(true);
      });

      it("should allow transition from draft to scheduled", () => {
        expect(isValidTransition("draft", "scheduled")).toBe(true);
      });

      it("should not allow transition from draft to published", () => {
        expect(isValidTransition("draft", "published")).toBe(false);
      });

      it("should not allow transition from draft to draft", () => {
        expect(isValidTransition("draft", "draft")).toBe(false);
      });
    });

    describe("from review status", () => {
      it("should allow transition from review to draft (reject)", () => {
        expect(isValidTransition("review", "draft")).toBe(true);
      });

      it("should allow transition from review to scheduled (approve)", () => {
        expect(isValidTransition("review", "scheduled")).toBe(true);
      });

      it("should not allow transition from review to published", () => {
        expect(isValidTransition("review", "published")).toBe(false);
      });

      it("should not allow transition from review to review", () => {
        expect(isValidTransition("review", "review")).toBe(false);
      });
    });

    describe("from scheduled status", () => {
      it("should allow transition from scheduled to published", () => {
        expect(isValidTransition("scheduled", "published")).toBe(true);
      });

      it("should allow transition from scheduled to draft (cancel)", () => {
        expect(isValidTransition("scheduled", "draft")).toBe(true);
      });

      it("should not allow transition from scheduled to review", () => {
        expect(isValidTransition("scheduled", "review")).toBe(false);
      });

      it("should not allow transition from scheduled to scheduled", () => {
        expect(isValidTransition("scheduled", "scheduled")).toBe(false);
      });
    });

    describe("from published status (terminal)", () => {
      it("should not allow any transition from published", () => {
        expect(isValidTransition("published", "draft")).toBe(false);
        expect(isValidTransition("published", "review")).toBe(false);
        expect(isValidTransition("published", "scheduled")).toBe(false);
        expect(isValidTransition("published", "published")).toBe(false);
      });
    });

    describe("invalid status values", () => {
      it("should return false for unknown current status", () => {
        expect(isValidTransition("unknown", "draft")).toBe(false);
      });

      it("should return false for unknown new status", () => {
        expect(isValidTransition("draft", "unknown")).toBe(false);
      });
    });
  });

  describe("validateScheduledTime", () => {
    it("should return valid for future dates", () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      const result = validateScheduledTime(futureDate);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return invalid for past dates", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const result = validateScheduledTime(pastDate);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("scheduledAt must be in the future");
    });

    it("should return invalid for current time (same timestamp)", () => {
      const now = new Date();
      const result = validateScheduledTime(now);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("scheduledAt must be in the future");
    });

    it("should return valid for date far in the future", () => {
      const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      const result = validateScheduledTime(farFuture);
      expect(result.valid).toBe(true);
    });
  });

  describe("validateScheduleData", () => {
    const validScheduleData = {
      contentId: "content-123",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      platforms: ["wordpress"],
      contentStatus: "draft",
    };

    it("should return valid for correct schedule data", () => {
      const result = validateScheduleData(validScheduleData);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return invalid for empty contentId", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        contentId: "",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Content ID is required");
    });

    it("should return invalid for whitespace-only contentId", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        contentId: "   ",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Content ID is required");
    });

    it("should return invalid for empty platforms array", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        platforms: [],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("At least one platform is required");
    });

    it("should return invalid for invalid platform name", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        platforms: ["invalid-platform"],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid platform");
    });

    it("should accept wordpress platform", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        platforms: ["wordpress"],
      });
      expect(result.valid).toBe(true);
    });

    it("should accept medium platform", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        platforms: ["medium"],
      });
      expect(result.valid).toBe(true);
    });

    it("should accept multiple valid platforms", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        platforms: ["wordpress", "medium"],
      });
      expect(result.valid).toBe(true);
    });

    it("should return invalid for review status", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        contentStatus: "review",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must be in 'draft' or 'scheduled' status");
    });

    it("should return invalid for published status", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        contentStatus: "published",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must be in 'draft' or 'scheduled' status");
    });

    it("should accept scheduled status", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        contentStatus: "scheduled",
      });
      expect(result.valid).toBe(true);
    });

    it("should return invalid for past scheduledAt date", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("scheduledAt must be in the future");
    });

    it("should return invalid for invalid datetime format", () => {
      const result = validateScheduleData({
        ...validScheduleData,
        scheduledAt: "not-a-date",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid datetime format");
    });
  });

  describe("workflow state machine completeness", () => {
    const statuses = ["draft", "review", "scheduled", "published"];

    it("should have defined transitions for all status pairs", () => {
      statuses.forEach((currentStatus) => {
        statuses.forEach((newStatus) => {
          const result = isValidTransition(currentStatus, newStatus);
          expect(typeof result).toBe("boolean");
        });
      });
    });

    it("should prevent self-transitions for all statuses", () => {
      statuses.forEach((status) => {
        expect(isValidTransition(status, status)).toBe(false);
      });
    });

    it("should have at least one valid outgoing transition from non-terminal states", () => {
      const nonTerminalStatuses = ["draft", "review", "scheduled"];
      nonTerminalStatuses.forEach((currentStatus) => {
        const hasValidTransition = statuses.some((newStatus) =>
          isValidTransition(currentStatus, newStatus)
        );
        expect(hasValidTransition).toBe(true);
      });
    });

    it("should have no valid outgoing transitions from terminal state", () => {
      const hasValidTransition = statuses.some((newStatus) =>
        isValidTransition("published", newStatus)
      );
      expect(hasValidTransition).toBe(false);
    });
  });
});
