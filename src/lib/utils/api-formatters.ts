/**
 * API Response Formatters
 *
 * Standardized utilities for formatting API responses with consistent structure,
 * error handling, pagination, and status codes. Provides generic helpers for
 * common API patterns while keeping domain-specific formatters in their modules.
 *
 * ðŸŸ¢ WORKING: All formatters tested with comprehensive test coverage
 *
 * @module api-formatters
 * @see API_FORMATTER_PATTERNS.md - Complete pattern documentation and examples
 */

// Re-export types and helpers from public-api for convenience
export type {
  ApiResponse,
  PaginationMeta,
} from "@/lib/api/public-api";

export {
  createSuccessResponse,
  createErrorResponse,
  createPaginationMeta,
} from "@/lib/api/public-api";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Standard error codes for API responses
 */
export const API_ERROR_CODES = {
  // Authentication & Authorization (401, 403)
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Request Errors (400, 404, 409, 422)
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  CONFLICT: "CONFLICT",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Server Errors (500, 503)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

/**
 * Validation error details for field-level errors
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Batch operation result
 */
export interface BatchResult<T = unknown> {
  successful: T[];
  failed: Array<{
    item: unknown;
    error: string;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}

/**
 * Operation status response
 */
export interface OperationStatus {
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number; // 0-100
  message?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
}

// ============================================================================
// Success Response Formatters
// ============================================================================

/**
 * Format a successful response with data
 * ðŸŸ¢ WORKING: Tested with various data types
 *
 * @param data - The response data
 * @param message - Optional success message
 * @returns Formatted success response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatSuccess({ id: "123", name: "Test" }, "User created successfully"),
 *   { status: 201 }
 * );
 * ```
 */
export function formatSuccess<T>(
  data: T,
  message?: string
): { success: true; data: T; message?: string } {
  const response: { success: true; data: T; message?: string } = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return response;
}

/**
 * Format a successful creation response (201 Created)
 * ðŸŸ¢ WORKING: Tested with resource creation
 *
 * @param data - The created resource data
 * @param resourceId - Optional resource ID
 * @returns Formatted creation response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatCreated(newUser, newUser.id),
 *   { status: 201 }
 * );
 * ```
 */
export function formatCreated<T>(
  data: T,
  resourceId?: string
): { success: true; data: T; id?: string; message: string } {
  return {
    success: true,
    data,
    ...(resourceId && { id: resourceId }),
    message: "Resource created successfully",
  };
}

/**
 * Format a successful update response (200 OK)
 * ðŸŸ¢ WORKING: Tested with resource updates
 *
 * @param data - The updated resource data
 * @returns Formatted update response
 *
 * @example
 * ```typescript
 * return NextResponse.json(formatUpdated(updatedUser));
 * ```
 */
export function formatUpdated<T>(
  data: T
): { success: true; data: T; message: string } {
  return {
    success: true,
    data,
    message: "Resource updated successfully",
  };
}

/**
 * Format a successful deletion response (200 OK or 204 No Content)
 * ðŸŸ¢ WORKING: Tested with resource deletion
 *
 * @param resourceId - Optional ID of deleted resource
 * @returns Formatted deletion response
 *
 * @example
 * ```typescript
 * return NextResponse.json(formatDeleted("user-123"));
 * ```
 */
export function formatDeleted(
  resourceId?: string
): { success: true; message: string; id?: string } {
  return {
    success: true,
    message: "Resource deleted successfully",
    ...(resourceId && { id: resourceId }),
  };
}

/**
 * Format a paginated list response
 * ðŸŸ¢ WORKING: Tested with pagination
 *
 * @param items - Array of items for current page
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @param totalItems - Total number of items across all pages
 * @returns Formatted paginated response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatPaginated(users, 1, 20, 100)
 * );
 * ```
 */
export function formatPaginated<T>(
  items: T[],
  page: number,
  pageSize: number,
  totalItems: number
): {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
} {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    success: true,
    data: items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

// ============================================================================
// Error Response Formatters
// ============================================================================

/**
 * Format a generic error response
 * ðŸŸ¢ WORKING: Tested with various error scenarios
 *
 * @param message - Error message
 * @param code - Error code (default: BAD_REQUEST)
 * @param details - Optional error details
 * @returns Formatted error response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatError("Invalid input", API_ERROR_CODES.VALIDATION_ERROR),
 *   { status: 400 }
 * );
 * ```
 */
export function formatError(
  message: string,
  code: string = API_ERROR_CODES.BAD_REQUEST,
  details?: unknown
): {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
} {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && typeof details === 'object' ? { details } : {}),
    },
  };
}

/**
 * Format a validation error response (422 Unprocessable Entity)
 * ðŸŸ¢ WORKING: Tested with validation errors
 *
 * @param errors - Array of field-level validation errors
 * @param message - Optional general validation message
 * @returns Formatted validation error response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatValidationError([
 *     { field: "email", message: "Invalid email format" },
 *     { field: "password", message: "Password too short" }
 *   ]),
 *   { status: 422 }
 * );
 * ```
 */
export function formatValidationError(
  errors: ValidationError[],
  message: string = "Validation failed"
): {
  success: false;
  error: {
    code: string;
    message: string;
    validationErrors: ValidationError[];
  };
} {
  return {
    success: false,
    error: {
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message,
      validationErrors: errors,
    },
  };
}

/**
 * Format a not found error response (404 Not Found)
 * ðŸŸ¢ WORKING: Tested with missing resources
 *
 * @param resource - Type of resource not found (e.g., "User", "Post")
 * @param identifier - Optional resource identifier
 * @returns Formatted not found response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatNotFound("User", userId),
 *   { status: 404 }
 * );
 * ```
 */
export function formatNotFound(
  resource: string = "Resource",
  identifier?: string
): {
  success: false;
  error: {
    code: string;
    message: string;
    resource: string;
    identifier?: string;
  };
} {
  const message = identifier
    ? `${resource} with identifier '${identifier}' not found`
    : `${resource} not found`;

  return {
    success: false,
    error: {
      code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
      message,
      resource,
      ...(identifier && { identifier }),
    },
  };
}

/**
 * Format an unauthorized error response (401 Unauthorized)
 * ðŸŸ¢ WORKING: Tested with auth failures
 *
 * @param message - Optional custom message
 * @returns Formatted unauthorized response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatUnauthorized("Invalid API key"),
 *   { status: 401 }
 * );
 * ```
 */
export function formatUnauthorized(
  message: string = "Authentication required"
): {
  success: false;
  error: {
    code: string;
    message: string;
  };
} {
  return {
    success: false,
    error: {
      code: API_ERROR_CODES.UNAUTHORIZED,
      message,
    },
  };
}

/**
 * Format a forbidden error response (403 Forbidden)
 * ðŸŸ¢ WORKING: Tested with permission checks
 *
 * @param message - Optional custom message
 * @returns Formatted forbidden response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatForbidden("Insufficient permissions"),
 *   { status: 403 }
 * );
 * ```
 */
export function formatForbidden(
  message: string = "Access forbidden"
): {
  success: false;
  error: {
    code: string;
    message: string;
  };
} {
  return {
    success: false,
    error: {
      code: API_ERROR_CODES.FORBIDDEN,
      message,
    },
  };
}

/**
 * Format a conflict error response (409 Conflict)
 * ðŸŸ¢ WORKING: Tested with duplicate resources
 *
 * @param message - Conflict description
 * @param details - Optional conflict details
 * @returns Formatted conflict response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatConflict("User with this email already exists"),
 *   { status: 409 }
 * );
 * ```
 */
export function formatConflict(
  message: string,
  details?: unknown
): {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
} {
  return {
    success: false,
    error: {
      code: API_ERROR_CODES.CONFLICT,
      message,
      ...(details && typeof details === 'object' ? { details } : {}),
    },
  };
}

/**
 * Format a rate limit error response (429 Too Many Requests)
 * ðŸŸ¢ WORKING: Tested with rate limiting
 *
 * @param retryAfter - Seconds until retry is allowed
 * @param message - Optional custom message
 * @returns Formatted rate limit response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatRateLimitExceeded(60),
 *   {
 *     status: 429,
 *     headers: { 'Retry-After': '60' }
 *   }
 * );
 * ```
 */
export function formatRateLimitExceeded(
  retryAfter: number,
  message: string = "Rate limit exceeded"
): {
  success: false;
  error: {
    code: string;
    message: string;
    retryAfter: number;
  };
} {
  return {
    success: false,
    error: {
      code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message,
      retryAfter,
    },
  };
}

/**
 * Format an internal server error response (500 Internal Server Error)
 * ðŸŸ¢ WORKING: Tested with server errors
 *
 * @param message - Optional custom message (avoid exposing sensitive details)
 * @param requestId - Optional request ID for debugging
 * @returns Formatted server error response
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatServerError("An unexpected error occurred", requestId),
 *   { status: 500 }
 * );
 * ```
 */
export function formatServerError(
  message: string = "Internal server error",
  requestId?: string
): {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
} {
  return {
    success: false,
    error: {
      code: API_ERROR_CODES.INTERNAL_ERROR,
      message,
      ...(requestId && { requestId }),
    },
  };
}

// ============================================================================
// Batch & Bulk Operation Formatters
// ============================================================================

/**
 * Format a batch operation result
 * ðŸŸ¢ WORKING: Tested with batch operations
 *
 * @param successful - Array of successfully processed items
 * @param failed - Array of failed items with error messages
 * @returns Formatted batch result
 *
 * @example
 * ```typescript
 * const result = formatBatchResult(
 *   [user1, user2],
 *   [{ item: invalidUser, error: "Invalid email" }]
 * );
 * return NextResponse.json(result);
 * ```
 */
export function formatBatchResult<T>(
  successful: T[],
  failed: Array<{ item: unknown; error: string }>
): {
  success: boolean;
  data: BatchResult<T>;
} {
  const total = successful.length + failed.length;
  const allSuccessful = failed.length === 0;

  return {
    success: allSuccessful,
    data: {
      successful,
      failed,
      total,
      successCount: successful.length,
      failureCount: failed.length,
    },
  };
}

/**
 * Format an async operation status response
 * ðŸŸ¢ WORKING: Tested with long-running operations
 *
 * @param status - Current operation status
 * @param progress - Optional progress percentage (0-100)
 * @param message - Optional status message
 * @returns Formatted operation status
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   formatOperationStatus("processing", 45, "Processing batch 3 of 5"),
 *   { status: 202 }
 * );
 * ```
 */
export function formatOperationStatus(
  status: OperationStatus["status"],
  progress?: number,
  message?: string
): {
  success: true;
  data: OperationStatus;
} {
  return {
    success: true,
    data: {
      status,
      ...(progress !== undefined && { progress }),
      ...(message && { message }),
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sanitize error for API response (remove sensitive stack traces, etc.)
 * ðŸŸ¢ WORKING: Tested with Error objects
 *
 * @param error - Error object or string
 * @param includeStack - Whether to include stack trace (only in development)
 * @returns Sanitized error message
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   return NextResponse.json(
 *     formatError(sanitizeError(error)),
 *     { status: 500 }
 *   );
 * }
 * ```
 */
export function sanitizeError(
  error: unknown,
  includeStack: boolean = process.env.NODE_ENV === "development"
): string {
  if (error instanceof Error) {
    if (includeStack && error.stack) {
      return `${error.message}\n\nStack trace:\n${error.stack}`;
    }
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
}

/**
 * Extract pagination params from URL search params
 * ðŸŸ¢ WORKING: Tested with URL parameters
 *
 * @param searchParams - URLSearchParams object
 * @param defaultPageSize - Default page size (default: 20)
 * @param maxPageSize - Maximum allowed page size (default: 100)
 * @returns Validated pagination parameters
 *
 * @example
 * ```typescript
 * const { page, pageSize } = extractPaginationParams(
 *   new URL(request.url).searchParams
 * );
 * ```
 */
export function extractPaginationParams(
  searchParams: URLSearchParams,
  defaultPageSize: number = 20,
  maxPageSize: number = 100
): { page: number; pageSize: number } {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  // Parse pageSize, use default if not provided
  const pageSizeParam = searchParams.get("pageSize");
  const requestedPageSize = pageSizeParam
    ? parseInt(pageSizeParam, 10)
    : defaultPageSize;

  // Use requestedPageSize if it's a valid number, otherwise use defaultPageSize
  // Then clamp between 1 and maxPageSize
  const validPageSize = !isNaN(requestedPageSize)
    ? requestedPageSize
    : defaultPageSize;
  const pageSize = Math.min(maxPageSize, Math.max(1, validPageSize));

  return { page, pageSize };
}
