/**
 * Tests for API Response Formatters
 * Comprehensive test coverage for all API formatter utilities
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  // Success formatters
  formatSuccess,
  formatCreated,
  formatUpdated,
  formatDeleted,
  formatPaginated,
  // Error formatters
  formatError,
  formatValidationError,
  formatNotFound,
  formatUnauthorized,
  formatForbidden,
  formatConflict,
  formatRateLimitExceeded,
  formatServerError,
  // Batch formatters
  formatBatchResult,
  formatOperationStatus,
  // Utilities
  sanitizeError,
  extractPaginationParams,
  API_ERROR_CODES,
} from "../api-formatters";

describe("API Formatters", () => {
  // ============================================================================
  // Success Response Formatters
  // ============================================================================

  describe("formatSuccess", () => {
    it("should format success response with data", () => {
      const data = { id: "123", name: "Test" };
      const result = formatSuccess(data);

      expect(result).toEqual({
        success: true,
        data,
      });
    });

    it("should include optional message", () => {
      const data = { id: "123" };
      const result = formatSuccess(data, "Operation completed");

      expect(result).toEqual({
        success: true,
        data,
        message: "Operation completed",
      });
    });

    it("should handle array data", () => {
      const data = [1, 2, 3];
      const result = formatSuccess(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it("should handle null data", () => {
      const result = formatSuccess(null);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe("formatCreated", () => {
    it("should format creation response with data", () => {
      const data = { id: "123", name: "New User" };
      const result = formatCreated(data, "123");

      expect(result).toEqual({
        success: true,
        data,
        id: "123",
        message: "Resource created successfully",
      });
    });

    it("should work without resource ID", () => {
      const data = { name: "New Item" };
      const result = formatCreated(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.message).toBe("Resource created successfully");
      expect(result).not.toHaveProperty("id");
    });
  });

  describe("formatUpdated", () => {
    it("should format update response", () => {
      const data = { id: "123", name: "Updated User" };
      const result = formatUpdated(data);

      expect(result).toEqual({
        success: true,
        data,
        message: "Resource updated successfully",
      });
    });
  });

  describe("formatDeleted", () => {
    it("should format deletion response with ID", () => {
      const result = formatDeleted("user-123");

      expect(result).toEqual({
        success: true,
        message: "Resource deleted successfully",
        id: "user-123",
      });
    });

    it("should work without ID", () => {
      const result = formatDeleted();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Resource deleted successfully");
      expect(result).not.toHaveProperty("id");
    });
  });

  describe("formatPaginated", () => {
    it("should format paginated response with items", () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = formatPaginated(items, 1, 10, 30);

      expect(result).toEqual({
        success: true,
        data: items,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 30,
          totalPages: 3,
          hasMore: true,
        },
      });
    });

    it("should handle last page (hasMore = false)", () => {
      const items = [{ id: 1 }];
      const result = formatPaginated(items, 3, 10, 30);

      expect(result.pagination.hasMore).toBe(false);
    });

    it("should handle empty results", () => {
      const result = formatPaginated([], 1, 10, 0);

      expect(result.data).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should calculate total pages correctly", () => {
      // 25 items with pageSize 10 = 3 pages
      const result = formatPaginated([], 1, 10, 25);

      expect(result.pagination.totalPages).toBe(3);
    });

    it("should handle exact page boundary", () => {
      // 30 items with pageSize 10 = exactly 3 pages
      const result = formatPaginated([], 3, 10, 30);

      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  // ============================================================================
  // Error Response Formatters
  // ============================================================================

  describe("formatError", () => {
    it("should format basic error", () => {
      const result = formatError("Something went wrong");

      expect(result).toEqual({
        success: false,
        error: {
          code: API_ERROR_CODES.BAD_REQUEST,
          message: "Something went wrong",
        },
      });
    });

    it("should use custom error code", () => {
      const result = formatError(
        "Not found",
        API_ERROR_CODES.RESOURCE_NOT_FOUND
      );

      expect(result.error.code).toBe(API_ERROR_CODES.RESOURCE_NOT_FOUND);
    });

    it("should include optional details", () => {
      const details = { field: "email", reason: "invalid format" };
      const result = formatError("Validation error", "VALIDATION", details);

      expect(result.error.details).toEqual(details);
    });

    it("should omit details when not provided", () => {
      const result = formatError("Error");

      expect(result.error).not.toHaveProperty("details");
    });
  });

  describe("formatValidationError", () => {
    it("should format validation errors", () => {
      const errors = [
        { field: "email", message: "Invalid email format" },
        { field: "password", message: "Too short" },
      ];
      const result = formatValidationError(errors);

      expect(result).toEqual({
        success: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: "Validation failed",
          validationErrors: errors,
        },
      });
    });

    it("should use custom message", () => {
      const result = formatValidationError(
        [{ field: "name", message: "Required" }],
        "Form validation failed"
      );

      expect(result.error.message).toBe("Form validation failed");
    });

    it("should handle empty error array", () => {
      const result = formatValidationError([]);

      expect(result.error.validationErrors).toEqual([]);
    });

    it("should include error codes in validation errors", () => {
      const errors = [
        { field: "email", message: "Invalid", code: "INVALID_FORMAT" },
      ];
      const result = formatValidationError(errors);

      expect(result.error.validationErrors[0].code).toBe("INVALID_FORMAT");
    });
  });

  describe("formatNotFound", () => {
    it("should format not found error with identifier", () => {
      const result = formatNotFound("User", "user-123");

      expect(result).toEqual({
        success: false,
        error: {
          code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
          message: "User with identifier 'user-123' not found",
          resource: "User",
          identifier: "user-123",
        },
      });
    });

    it("should work without identifier", () => {
      const result = formatNotFound("User");

      expect(result.error.message).toBe("User not found");
      expect(result.error).not.toHaveProperty("identifier");
    });

    it("should use default resource name", () => {
      const result = formatNotFound();

      expect(result.error.message).toBe("Resource not found");
      expect(result.error.resource).toBe("Resource");
    });
  });

  describe("formatUnauthorized", () => {
    it("should format unauthorized error with default message", () => {
      const result = formatUnauthorized();

      expect(result).toEqual({
        success: false,
        error: {
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: "Authentication required",
        },
      });
    });

    it("should use custom message", () => {
      const result = formatUnauthorized("Invalid API key");

      expect(result.error.message).toBe("Invalid API key");
    });
  });

  describe("formatForbidden", () => {
    it("should format forbidden error with default message", () => {
      const result = formatForbidden();

      expect(result).toEqual({
        success: false,
        error: {
          code: API_ERROR_CODES.FORBIDDEN,
          message: "Access forbidden",
        },
      });
    });

    it("should use custom message", () => {
      const result = formatForbidden("Insufficient permissions");

      expect(result.error.message).toBe("Insufficient permissions");
    });
  });

  describe("formatConflict", () => {
    it("should format conflict error", () => {
      const result = formatConflict("Email already exists");

      expect(result).toEqual({
        success: false,
        error: {
          code: API_ERROR_CODES.CONFLICT,
          message: "Email already exists",
        },
      });
    });

    it("should include optional details", () => {
      const details = { field: "email", value: "test@example.com" };
      const result = formatConflict("Duplicate entry", details);

      expect(result.error.details).toEqual(details);
    });
  });

  describe("formatRateLimitExceeded", () => {
    it("should format rate limit error", () => {
      const result = formatRateLimitExceeded(60);

      expect(result).toEqual({
        success: false,
        error: {
          code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: "Rate limit exceeded",
          retryAfter: 60,
        },
      });
    });

    it("should use custom message", () => {
      const result = formatRateLimitExceeded(
        120,
        "Too many requests. Please wait."
      );

      expect(result.error.message).toBe("Too many requests. Please wait.");
      expect(result.error.retryAfter).toBe(120);
    });
  });

  describe("formatServerError", () => {
    it("should format server error with default message", () => {
      const result = formatServerError();

      expect(result).toEqual({
        success: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });

    it("should include custom message", () => {
      const result = formatServerError("Database connection failed");

      expect(result.error.message).toBe("Database connection failed");
    });

    it("should include request ID when provided", () => {
      const result = formatServerError("Error occurred", "req-123");

      expect(result.error.requestId).toBe("req-123");
    });

    it("should omit request ID when not provided", () => {
      const result = formatServerError("Error occurred");

      expect(result.error).not.toHaveProperty("requestId");
    });
  });

  // ============================================================================
  // Batch & Bulk Operation Formatters
  // ============================================================================

  describe("formatBatchResult", () => {
    it("should format successful batch operation", () => {
      const successful = [{ id: 1 }, { id: 2 }];
      const failed: Array<{ item: unknown; error: string }> = [];
      const result = formatBatchResult(successful, failed);

      expect(result).toEqual({
        success: true,
        data: {
          successful,
          failed: [],
          total: 2,
          successCount: 2,
          failureCount: 0,
        },
      });
    });

    it("should format partial batch operation", () => {
      const successful = [{ id: 1 }];
      const failed = [{ item: { id: 2 }, error: "Invalid data" }];
      const result = formatBatchResult(successful, failed);

      expect(result.success).toBe(false);
      expect(result.data.successCount).toBe(1);
      expect(result.data.failureCount).toBe(1);
      expect(result.data.total).toBe(2);
    });

    it("should format completely failed batch operation", () => {
      const successful: unknown[] = [];
      const failed = [
        { item: { id: 1 }, error: "Error 1" },
        { item: { id: 2 }, error: "Error 2" },
      ];
      const result = formatBatchResult(successful, failed);

      expect(result.success).toBe(false);
      expect(result.data.successCount).toBe(0);
      expect(result.data.failureCount).toBe(2);
    });
  });

  describe("formatOperationStatus", () => {
    it("should format operation status with minimal data", () => {
      const result = formatOperationStatus("pending");

      expect(result).toEqual({
        success: true,
        data: {
          status: "pending",
        },
      });
    });

    it("should include progress when provided", () => {
      const result = formatOperationStatus("processing", 45);

      expect(result.data.progress).toBe(45);
    });

    it("should include message when provided", () => {
      const result = formatOperationStatus(
        "processing",
        50,
        "Processing batch 2 of 4"
      );

      expect(result.data.message).toBe("Processing batch 2 of 4");
    });

    it("should handle completed status", () => {
      const result = formatOperationStatus("completed", 100);

      expect(result.data.status).toBe("completed");
      expect(result.data.progress).toBe(100);
    });

    it("should handle failed status", () => {
      const result = formatOperationStatus("failed", 0, "Operation failed");

      expect(result.data.status).toBe("failed");
      expect(result.data.message).toBe("Operation failed");
    });
  });

  // ============================================================================
  // Utility Functions
  // ============================================================================

  describe("sanitizeError", () => {
    it("should sanitize Error object", () => {
      const error = new Error("Test error");
      const result = sanitizeError(error, false);

      expect(result).toBe("Test error");
    });

    it("should include stack trace in development", () => {
      const error = new Error("Test error");
      const result = sanitizeError(error, true);

      expect(result).toContain("Test error");
      expect(result).toContain("Stack trace:");
    });

    it("should handle string errors", () => {
      const result = sanitizeError("Simple error message", false);

      expect(result).toBe("Simple error message");
    });

    it("should handle unknown error types", () => {
      const result = sanitizeError({ foo: "bar" }, false);

      expect(result).toBe("An unexpected error occurred");
    });

    it("should handle null error", () => {
      const result = sanitizeError(null, false);

      expect(result).toBe("An unexpected error occurred");
    });

    it("should handle undefined error", () => {
      const result = sanitizeError(undefined, false);

      expect(result).toBe("An unexpected error occurred");
    });
  });

  describe("extractPaginationParams", () => {
    it("should extract valid pagination params", () => {
      const searchParams = new URLSearchParams("page=2&pageSize=50");
      const result = extractPaginationParams(searchParams);

      expect(result).toEqual({
        page: 2,
        pageSize: 50,
      });
    });

    it("should use defaults when params missing", () => {
      const searchParams = new URLSearchParams("");
      const result = extractPaginationParams(searchParams);

      expect(result).toEqual({
        page: 1,
        pageSize: 20,
      });
    });

    it("should enforce minimum page of 1", () => {
      const searchParams = new URLSearchParams("page=0");
      const result = extractPaginationParams(searchParams);

      expect(result.page).toBe(1);
    });

    it("should enforce minimum page of 1 for negative values", () => {
      const searchParams = new URLSearchParams("page=-5");
      const result = extractPaginationParams(searchParams);

      expect(result.page).toBe(1);
    });

    it("should enforce max page size", () => {
      const searchParams = new URLSearchParams("pageSize=500");
      const result = extractPaginationParams(searchParams, 20, 100);

      expect(result.pageSize).toBe(100);
    });

    it("should enforce minimum page size of 1", () => {
      const searchParams = new URLSearchParams("pageSize=0");
      const result = extractPaginationParams(searchParams);

      expect(result.pageSize).toBe(1);
    });

    it("should handle invalid page values", () => {
      const searchParams = new URLSearchParams("page=invalid");
      const result = extractPaginationParams(searchParams);

      expect(result.page).toBe(1);
    });

    it("should handle invalid pageSize values", () => {
      const searchParams = new URLSearchParams("pageSize=invalid");
      const result = extractPaginationParams(searchParams);

      expect(result.pageSize).toBe(20);
    });

    it("should use custom defaults", () => {
      const searchParams = new URLSearchParams("");
      const result = extractPaginationParams(searchParams, 50, 200);

      expect(result.pageSize).toBe(50);
    });
  });

  // ============================================================================
  // Error Codes
  // ============================================================================

  describe("API_ERROR_CODES", () => {
    it("should have all required error codes", () => {
      expect(API_ERROR_CODES.UNAUTHORIZED).toBe("UNAUTHORIZED");
      expect(API_ERROR_CODES.FORBIDDEN).toBe("FORBIDDEN");
      expect(API_ERROR_CODES.BAD_REQUEST).toBe("BAD_REQUEST");
      expect(API_ERROR_CODES.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
      expect(API_ERROR_CODES.NOT_FOUND).toBe("NOT_FOUND");
      expect(API_ERROR_CODES.RESOURCE_NOT_FOUND).toBe("RESOURCE_NOT_FOUND");
      expect(API_ERROR_CODES.CONFLICT).toBe("CONFLICT");
      expect(API_ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe("RATE_LIMIT_EXCEEDED");
      expect(API_ERROR_CODES.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
      expect(API_ERROR_CODES.SERVICE_UNAVAILABLE).toBe("SERVICE_UNAVAILABLE");
      expect(API_ERROR_CODES.DATABASE_ERROR).toBe("DATABASE_ERROR");
    });
  });
});
