/**
 * Rate Limiter Service Unit Tests
 * Tests for AI API rate limiting
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mock Redis store
const mockRedisStore = new Map<string, number>();

// Mock Redis client
vi.mock("@/lib/redis", () => ({
  getRedisClient: vi.fn(() => ({
    get: vi.fn((key: string) => Promise.resolve(mockRedisStore.get(key)?.toString() || null)),
    set: vi.fn((key: string, value: number) => {
      mockRedisStore.set(key, value);
      return Promise.resolve("OK");
    }),
    incr: vi.fn((key: string) => {
      const current = mockRedisStore.get(key) || 0;
      mockRedisStore.set(key, current + 1);
      return Promise.resolve(current + 1);
    }),
    incrby: vi.fn((key: string, increment: number) => {
      const current = mockRedisStore.get(key) || 0;
      mockRedisStore.set(key, current + increment);
      return Promise.resolve(current + increment);
    }),
    expire: vi.fn(() => Promise.resolve(1)),
    del: vi.fn((key: string) => {
      mockRedisStore.delete(key);
      return Promise.resolve(1);
    }),
  })),
}));

// Import after mocking
import {
  checkRateLimit,
  incrementRateLimit,
  checkTokenLimit,
  getRateLimitStatus,
  resetRateLimits,
  RateLimitError,
  RATE_LIMIT_TIERS,
} from "@/lib/ai/rate-limiter";

describe("Rate Limiter Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisStore.clear();
  });

  describe("RATE_LIMIT_TIERS", () => {
    it("should have free tier with correct limits", () => {
      expect(RATE_LIMIT_TIERS.free).toBeDefined();
      expect(RATE_LIMIT_TIERS.free.requestsPerMinute).toBe(5);
      expect(RATE_LIMIT_TIERS.free.requestsPerDay).toBe(200);
    });

    it("should have professional tier with higher limits", () => {
      expect(RATE_LIMIT_TIERS.professional).toBeDefined();
      expect(RATE_LIMIT_TIERS.professional.requestsPerMinute).toBeGreaterThan(
        RATE_LIMIT_TIERS.free.requestsPerMinute
      );
    });

    it("should have enterprise tier with highest limits", () => {
      expect(RATE_LIMIT_TIERS.enterprise).toBeDefined();
      expect(RATE_LIMIT_TIERS.enterprise.requestsPerDay).toBeGreaterThan(
        RATE_LIMIT_TIERS.professional.requestsPerDay
      );
    });
  });

  describe("checkRateLimit", () => {
    it("should allow request when under limit", async () => {
      const result = await checkRateLimit("org-123", "free");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it("should use free tier as default", async () => {
      const result = await checkRateLimit("org-123");
      expect(result.allowed).toBe(true);
    });

    it("should include resetAt date", async () => {
      const result = await checkRateLimit("org-123", "free");
      expect(result.resetAt).toBeInstanceOf(Date);
    });
  });

  describe("incrementRateLimit", () => {
    it("should increment rate limit counters", async () => {
      await incrementRateLimit("org-123", 100);
      // Verify by checking rate limit
      const result = await checkRateLimit("org-123", "free");
      expect(result.allowed).toBe(true);
    });

    it("should handle zero token count", async () => {
      await expect(incrementRateLimit("org-123", 0)).resolves.not.toThrow();
    });
  });

  describe("checkTokenLimit", () => {
    it("should allow when under token limit", async () => {
      const result = await checkTokenLimit("org-123", "free", 1000);
      expect(result.allowed).toBe(true);
    });

    it("should include remaining tokens", async () => {
      const result = await checkTokenLimit("org-123", "free", 1000);
      expect(result.remaining).toBeGreaterThan(0);
    });
  });

  describe("getRateLimitStatus", () => {
    it("should return status for all rate limit types", async () => {
      const status = await getRateLimitStatus("org-123", "free");

      expect(status.minute).toBeDefined();
      expect(status.hour).toBeDefined();
      expect(status.day).toBeDefined();
      expect(status.tokens).toBeDefined();
    });

    it("should include used count and limit for each type", async () => {
      const status = await getRateLimitStatus("org-123", "free");

      expect(status.minute.used).toBeDefined();
      expect(status.minute.limit).toBe(RATE_LIMIT_TIERS.free.requestsPerMinute);
      expect(status.day.limit).toBe(RATE_LIMIT_TIERS.free.requestsPerDay);
    });

    it("should include resetAt for each type", async () => {
      const status = await getRateLimitStatus("org-123", "free");

      expect(status.minute.resetAt).toBeInstanceOf(Date);
      expect(status.hour.resetAt).toBeInstanceOf(Date);
      expect(status.day.resetAt).toBeInstanceOf(Date);
      expect(status.tokens.resetAt).toBeInstanceOf(Date);
    });
  });

  describe("resetRateLimits", () => {
    it("should reset all rate limit counters", async () => {
      // First increment
      await incrementRateLimit("org-123", 100);

      // Then reset
      await resetRateLimits("org-123");

      // Verify limits are reset
      const status = await getRateLimitStatus("org-123", "free");
      expect(status.minute.used).toBe(0);
    });
  });

  describe("RateLimitError", () => {
    it("should create error with correct properties", () => {
      const resetAt = new Date();
      const error = new RateLimitError("Rate limit exceeded", "minute", resetAt);

      expect(error.message).toBe("Rate limit exceeded");
      expect(error.name).toBe("RateLimitError");
      expect(error.limitType).toBe("minute");
      expect(error.resetAt).toBe(resetAt);
    });

    it("should be an instance of Error", () => {
      const error = new RateLimitError("Test", "hour", new Date());
      expect(error).toBeInstanceOf(Error);
    });
  });
});
