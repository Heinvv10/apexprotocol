/**
 * QStash Client Unit Tests
 * Tests for QStash scheduling wrapper functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the QStash Client before importing our module
// Environment variables are set in tests/setup.ts

// Use vi.hoisted() to properly handle mocks before module initialization
const {
  mockPublishJSON,
  mockSchedulesCreate,
  mockSchedulesDelete,
  mockSchedulesGet,
  mockSchedulesList,
  mockMessagesDelete,
} = vi.hoisted(() => {
  return {
    mockPublishJSON: vi.fn(),
    mockSchedulesCreate: vi.fn(),
    mockSchedulesDelete: vi.fn(),
    mockSchedulesGet: vi.fn(),
    mockSchedulesList: vi.fn(),
    mockMessagesDelete: vi.fn(),
  };
});

vi.mock("@upstash/qstash", () => ({
  Client: vi.fn(() => ({
    publishJSON: mockPublishJSON,
    schedules: {
      create: mockSchedulesCreate,
      delete: mockSchedulesDelete,
      get: mockSchedulesGet,
      list: mockSchedulesList,
    },
    messages: {
      delete: mockMessagesDelete,
    },
  })),
}));

// Import after mocking
import {
  calculateDelay,
  validateScheduledTime,
  createDelayedPublish,
  createRecurringSchedule,
  cancelSchedule,
  getSchedule,
  listSchedules,
  cronExpressions,
  type CreateScheduleOptions,
  type CancelScheduleOptions,
} from "@/lib/scheduling/qstash";

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockScheduleOptions(
  overrides?: Partial<CreateScheduleOptions>
): CreateScheduleOptions {
  const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  return {
    contentId: "content-123",
    platforms: ["wordpress"],
    scheduledAt: futureDate,
    ...overrides,
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe("QStash Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("calculateDelay", () => {
    it("should calculate delay in seconds correctly", () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
      const delay = calculateDelay(futureDate);

      expect(delay).toBeGreaterThanOrEqual(299); // Allow for test execution time
      expect(delay).toBeLessThanOrEqual(300);
    });

    it("should return 0 for past dates", () => {
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      const delay = calculateDelay(pastDate);
      expect(delay).toBe(0);
    });

    it("should return 0 for current time", () => {
      const now = new Date();
      const delay = calculateDelay(now);
      expect(delay).toBeLessThanOrEqual(1); // Allow for minimal execution time
    });

    it("should calculate delay for dates far in the future", () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      const delay = calculateDelay(futureDate);
      expect(delay).toBeGreaterThanOrEqual(86399);
      expect(delay).toBeLessThanOrEqual(86400);
    });

    it("should floor fractional seconds", () => {
      const futureDate = new Date(Date.now() + 1500); // 1.5 seconds from now
      const delay = calculateDelay(futureDate);
      expect(delay).toBe(1);
    });
  });

  describe("validateScheduledTime", () => {
    it("should not throw for future dates", () => {
      const futureDate = new Date(Date.now() + 60 * 1000);
      expect(() => validateScheduledTime(futureDate)).not.toThrow();
    });

    it("should throw for past dates", () => {
      const pastDate = new Date(Date.now() - 60 * 1000);
      expect(() => validateScheduledTime(pastDate)).toThrow(
        "Scheduled time must be in the future"
      );
    });

    it("should throw for current time", () => {
      const now = new Date();
      expect(() => validateScheduledTime(now)).toThrow(
        "Scheduled time must be in the future"
      );
    });
  });

  describe("createDelayedPublish", () => {
    it("should create delayed publish for single platform", async () => {
      mockPublishJSON.mockResolvedValueOnce({ messageId: "msg-123" });

      const options = createMockScheduleOptions();
      const result = await createDelayedPublish(options);

      expect(mockPublishJSON).toHaveBeenCalledTimes(1);
      expect(mockPublishJSON).toHaveBeenCalledWith({
        url: "https://example.com/api/webhooks/publish",
        body: {
          contentId: "content-123",
          platform: "wordpress",
          scheduledAt: options.scheduledAt.toISOString(),
        },
        delay: expect.any(Number),
      });

      expect(result).toEqual({
        messageId: "msg-123",
        scheduledAt: options.scheduledAt,
        platforms: ["wordpress"],
      });
    });

    it("should create delayed publish for multiple platforms", async () => {
      mockPublishJSON
        .mockResolvedValueOnce({ messageId: "msg-123" })
        .mockResolvedValueOnce({ messageId: "msg-456" });

      const options = createMockScheduleOptions({
        platforms: ["wordpress", "medium"],
      });
      const result = await createDelayedPublish(options);

      expect(mockPublishJSON).toHaveBeenCalledTimes(2);
      expect(result.messageId).toBe("msg-123,msg-456");
      expect(result.platforms).toEqual(["wordpress", "medium"]);
    });

    it("should validate scheduled time is in the future", async () => {
      const pastDate = new Date(Date.now() - 60 * 1000);
      const options = createMockScheduleOptions({ scheduledAt: pastDate });

      await expect(createDelayedPublish(options)).rejects.toThrow(
        "Scheduled time must be in the future"
      );

      expect(mockPublishJSON).not.toHaveBeenCalled();
    });

    it("should throw error if QStash API fails", async () => {
      mockPublishJSON.mockRejectedValueOnce(new Error("QStash API error"));

      const options = createMockScheduleOptions();

      await expect(createDelayedPublish(options)).rejects.toThrow(
        "Failed to create delayed publish: QStash API error"
      );
    });

    it("should handle missing messageId in response", async () => {
      mockPublishJSON.mockResolvedValueOnce({});

      const options = createMockScheduleOptions();
      const result = await createDelayedPublish(options);

      expect(result.messageId).toBe("");
    });

    it("should calculate correct delay for scheduled time", async () => {
      mockPublishJSON.mockResolvedValueOnce({ messageId: "msg-123" });

      const scheduledAt = new Date(Date.now() + 3600000); // 1 hour from now
      const options = createMockScheduleOptions({ scheduledAt });

      await createDelayedPublish(options);

      const callArgs = mockPublishJSON.mock.calls[0][0];
      expect(callArgs.delay).toBeGreaterThanOrEqual(3599);
      expect(callArgs.delay).toBeLessThanOrEqual(3600);
    });
  });

  describe("createRecurringSchedule", () => {
    it("should create recurring schedule with cron expression", async () => {
      mockSchedulesCreate.mockResolvedValueOnce({ scheduleId: "sched-123" });

      const options = createMockScheduleOptions({ cron: "0 9 * * *" });
      const result = await createRecurringSchedule(options as CreateScheduleOptions & { cron: string });

      expect(mockSchedulesCreate).toHaveBeenCalledTimes(1);
      expect(mockSchedulesCreate).toHaveBeenCalledWith({
        destination: "https://example.com/api/webhooks/publish",
        cron: "0 9 * * *",
        body: JSON.stringify({
          contentId: "content-123",
          platform: "wordpress",
          scheduledAt: options.scheduledAt.toISOString(),
        }),
      });

      expect(result).toEqual({
        scheduleId: "sched-123",
        scheduledAt: options.scheduledAt,
        platforms: ["wordpress"],
      });
    });

    it("should create recurring schedule for multiple platforms", async () => {
      mockSchedulesCreate
        .mockResolvedValueOnce({ scheduleId: "sched-123" })
        .mockResolvedValueOnce({ scheduleId: "sched-456" });

      const options = createMockScheduleOptions({
        platforms: ["wordpress", "medium"],
        cron: "0 9 * * *",
      });
      const result = await createRecurringSchedule(options as CreateScheduleOptions & { cron: string });

      expect(mockSchedulesCreate).toHaveBeenCalledTimes(2);
      expect(result.scheduleId).toBe("sched-123,sched-456");
    });

    it("should throw error if cron is missing", async () => {
      const options = createMockScheduleOptions();

      await expect(createRecurringSchedule(options as CreateScheduleOptions & { cron: string })).rejects.toThrow(
        "Cron expression is required for recurring schedules"
      );
    });

    it("should throw error if QStash API fails", async () => {
      mockSchedulesCreate.mockRejectedValueOnce(new Error("QStash API error"));

      const options = createMockScheduleOptions({ cron: "0 9 * * *" });

      await expect(createRecurringSchedule(options as CreateScheduleOptions & { cron: string })).rejects.toThrow(
        "Failed to create recurring schedule: QStash API error"
      );
    });
  });

  describe("cancelSchedule", () => {
    it("should cancel recurring schedule by scheduleId", async () => {
      mockSchedulesDelete.mockResolvedValueOnce(undefined);

      const options: CancelScheduleOptions = { scheduleId: "sched-123" };
      const result = await cancelSchedule(options);

      expect(mockSchedulesDelete).toHaveBeenCalledWith("sched-123");
      expect(result).toBe(true);
    });

    it("should cancel multiple recurring schedules", async () => {
      mockSchedulesDelete
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const options: CancelScheduleOptions = { scheduleId: "sched-123,sched-456" };
      const result = await cancelSchedule(options);

      expect(mockSchedulesDelete).toHaveBeenCalledTimes(2);
      expect(mockSchedulesDelete).toHaveBeenCalledWith("sched-123");
      expect(mockSchedulesDelete).toHaveBeenCalledWith("sched-456");
      expect(result).toBe(true);
    });

    it("should cancel delayed publish by messageId", async () => {
      mockMessagesDelete.mockResolvedValueOnce(undefined);

      const options: CancelScheduleOptions = { messageId: "msg-123" };
      const result = await cancelSchedule(options);

      expect(mockMessagesDelete).toHaveBeenCalledWith("msg-123");
      expect(result).toBe(true);
    });

    it("should cancel multiple delayed publishes", async () => {
      mockMessagesDelete
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const options: CancelScheduleOptions = { messageId: "msg-123,msg-456" };
      const result = await cancelSchedule(options);

      expect(mockMessagesDelete).toHaveBeenCalledTimes(2);
      expect(mockMessagesDelete).toHaveBeenCalledWith("msg-123");
      expect(mockMessagesDelete).toHaveBeenCalledWith("msg-456");
      expect(result).toBe(true);
    });

    it("should throw error if neither scheduleId nor messageId provided", async () => {
      const options: CancelScheduleOptions = {};

      await expect(cancelSchedule(options)).rejects.toThrow(
        "Either scheduleId or messageId must be provided"
      );
    });

    it("should trim whitespace from IDs", async () => {
      mockSchedulesDelete.mockResolvedValueOnce(undefined);

      const options: CancelScheduleOptions = { scheduleId: " sched-123 , sched-456 " };
      await cancelSchedule(options);

      expect(mockSchedulesDelete).toHaveBeenCalledWith("sched-123");
      expect(mockSchedulesDelete).toHaveBeenCalledWith("sched-456");
    });

    it("should throw error if cancel fails", async () => {
      mockSchedulesDelete.mockRejectedValueOnce(new Error("Cancel failed"));

      const options: CancelScheduleOptions = { scheduleId: "sched-123" };

      await expect(cancelSchedule(options)).rejects.toThrow(
        "Failed to cancel schedule: Cancel failed"
      );
    });
  });

  describe("getSchedule", () => {
    it("should get schedule by ID", async () => {
      const mockSchedule = {
        scheduleId: "sched-123",
        cron: "0 9 * * *",
        destination: "https://example.com/api/webhooks/publish",
      };
      mockSchedulesGet.mockResolvedValueOnce(mockSchedule);

      const result = await getSchedule("sched-123");

      expect(mockSchedulesGet).toHaveBeenCalledWith("sched-123");
      expect(result).toEqual(mockSchedule);
    });

    it("should throw error if get fails", async () => {
      mockSchedulesGet.mockRejectedValueOnce(new Error("Not found"));

      await expect(getSchedule("sched-123")).rejects.toThrow(
        "Failed to get schedule: Not found"
      );
    });
  });

  describe("listSchedules", () => {
    it("should list all schedules", async () => {
      const mockSchedules = [
        { scheduleId: "sched-123", cron: "0 9 * * *" },
        { scheduleId: "sched-456", cron: "0 18 * * *" },
      ];
      mockSchedulesList.mockResolvedValueOnce(mockSchedules);

      const result = await listSchedules();

      expect(mockSchedulesList).toHaveBeenCalled();
      expect(result).toEqual(mockSchedules);
    });

    it("should return empty array when no schedules exist", async () => {
      mockSchedulesList.mockResolvedValueOnce([]);

      const result = await listSchedules();

      expect(result).toEqual([]);
    });

    it("should throw error if list fails", async () => {
      mockSchedulesList.mockRejectedValueOnce(new Error("API error"));

      await expect(listSchedules()).rejects.toThrow(
        "Failed to list schedules: API error"
      );
    });
  });

  describe("cronExpressions", () => {
    it("should generate daily cron expression", () => {
      expect(cronExpressions.daily(9)).toBe("0 9 * * *");
      expect(cronExpressions.daily(18)).toBe("0 18 * * *");
      expect(cronExpressions.daily(0)).toBe("0 0 * * *");
    });

    it("should generate weekly cron expression", () => {
      expect(cronExpressions.weekly(0, 9)).toBe("0 9 * * 0"); // Sunday at 9am
      expect(cronExpressions.weekly(6, 18)).toBe("0 18 * * 6"); // Saturday at 6pm
      expect(cronExpressions.weekly(3, 12)).toBe("0 12 * * 3"); // Wednesday at noon
    });

    it("should generate monthly cron expression", () => {
      expect(cronExpressions.monthly(1, 9)).toBe("0 9 1 * *"); // 1st at 9am
      expect(cronExpressions.monthly(15, 18)).toBe("0 18 15 * *"); // 15th at 6pm
      expect(cronExpressions.monthly(31, 0)).toBe("0 0 31 * *"); // 31st at midnight
    });

    it("should generate every N hours cron expression", () => {
      expect(cronExpressions.everyNHours(1)).toBe("0 */1 * * *");
      expect(cronExpressions.everyNHours(6)).toBe("0 */6 * * *");
      expect(cronExpressions.everyNHours(12)).toBe("0 */12 * * *");
    });

    it("should generate every N minutes cron expression", () => {
      expect(cronExpressions.everyNMinutes(5)).toBe("*/5 * * * *");
      expect(cronExpressions.everyNMinutes(15)).toBe("*/15 * * * *");
      expect(cronExpressions.everyNMinutes(30)).toBe("*/30 * * * *");
    });
  });
});
