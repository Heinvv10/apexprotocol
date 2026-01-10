/**
 * AI Platform Error Handling and Retry Logic
 *
 * Provides robust error handling with retry logic, exponential backoff, and error categorization
 * for AI platform API calls. Handles rate limits, timeouts, and transient errors gracefully.
 *
 * @example
 * ```typescript
 * // Wrap an API call with retry logic
 * const result = await withRetry(
 *   () => platformAdapter.analyze(query, brandContext),
 *   { platform: 'chatgpt', maxAttempts: 3 }
 * );
 *
 * // Create a custom error
 * throw createPlatformError({
 *   platform: 'claude',
 *   type: 'rate_limit',
 *   message: 'Rate limit exceeded',
 *   statusCode: 429,
 *   retryAfter: 60000
 * });
 * ```
 */

import { AIPlatform, PlatformError, PlatformErrorType } from "./types";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Platform being called (for logging and error context) */
  platform: AIPlatform;

  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;

  /** Initial delay in milliseconds (default: 1000ms) */
  initialDelayMs?: number;

  /** Maximum delay in milliseconds (default: 60000ms = 1 minute) */
  maxDelayMs?: number;

  /** Backoff multiplier for exponential backoff (default: 2) */
  multiplier?: number;

  /** Timeout for each attempt in milliseconds (default: 30000ms = 30 seconds) */
  timeoutMs?: number;

  /** Whether to retry on all errors or only retryable ones (default: false) */
  retryAllErrors?: boolean;

  /** Callback called before each retry attempt */
  onRetry?: (error: PlatformError, attempt: number, delayMs: number) => void;

  /** Callback called when all retries are exhausted */
  onMaxRetriesExceeded?: (error: PlatformError) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<Omit<RetryConfig, "platform" | "onRetry" | "onMaxRetriesExceeded">> = {
  maxAttempts: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 1 minute
  multiplier: 2, // Exponential backoff
  timeoutMs: 30000, // 30 seconds
  retryAllErrors: false,
};

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Classify an error into a PlatformErrorType category
 *
 * @param error - The error to classify
 * @param platform - The platform that generated the error
 * @returns Classified error type
 */
export function classifyError(error: unknown, platform: AIPlatform): PlatformErrorType {
  if (!error) return "unknown";

  // Check if it's already a PlatformError
  if (isPlatformError(error)) {
    return error.type;
  }

  const errorMessage = getErrorMessage(error).toLowerCase();
  const statusCode = getStatusCode(error);

  // Authentication errors
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("authentication") ||
    errorMessage.includes("invalid api key") ||
    errorMessage.includes("api key")
  ) {
    return "authentication";
  }

  // Rate limit errors
  if (
    statusCode === 429 ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many requests") ||
    errorMessage.includes("quota exceeded")
  ) {
    return "rate_limit";
  }

  // Timeout errors
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("timed out") ||
    errorMessage.includes("deadline exceeded") ||
    errorMessage.includes("econnaborted")
  ) {
    return "timeout";
  }

  // Invalid request errors
  if (
    statusCode === 400 ||
    statusCode === 422 ||
    errorMessage.includes("invalid") ||
    errorMessage.includes("malformed") ||
    errorMessage.includes("bad request") ||
    errorMessage.includes("validation")
  ) {
    return "invalid_request";
  }

  // Server errors
  if (
    statusCode && statusCode >= 500 ||
    errorMessage.includes("server error") ||
    errorMessage.includes("internal error") ||
    errorMessage.includes("service unavailable")
  ) {
    return "server_error";
  }

  // Network errors
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("enotfound") ||
    errorMessage.includes("connection refused") ||
    errorMessage.includes("fetch failed")
  ) {
    return "network_error";
  }

  return "unknown";
}

/**
 * Determine if an error type is retryable
 *
 * @param errorType - The error type to check
 * @returns true if the error is retryable
 */
export function isRetryableError(errorType: PlatformErrorType): boolean {
  // Retryable: rate limits, timeouts, server errors, network errors
  // Not retryable: authentication, invalid requests, unknown
  return ["rate_limit", "timeout", "server_error", "network_error"].includes(errorType);
}

/**
 * Type guard to check if an error is a PlatformError
 */
export function isPlatformError(error: unknown): error is PlatformError {
  return (
    typeof error === "object" &&
    error !== null &&
    "platform" in error &&
    "type" in error &&
    "retryable" in error
  );
}

// ============================================================================
// Error Creation
// ============================================================================

/**
 * Create a PlatformError from an unknown error
 *
 * @param options - Error creation options
 * @returns A properly typed PlatformError
 */
export function createPlatformError(options: {
  platform: AIPlatform;
  type?: PlatformErrorType;
  message?: string;
  statusCode?: number;
  retryAfter?: number;
  originalError?: unknown;
}): PlatformError {
  const {
    platform,
    type,
    message,
    statusCode,
    retryAfter,
    originalError,
  } = options;

  // If we have an original error, try to extract info from it
  const errorMessage = message || getErrorMessage(originalError) || "Unknown error";
  const errorType = type || classifyError(originalError, platform);
  const errorStatusCode = statusCode || getStatusCode(originalError);
  const errorRetryAfter = retryAfter || getRetryAfter(originalError);

  const error = new Error(errorMessage) as PlatformError;
  error.platform = platform;
  error.type = errorType;
  error.retryable = isRetryableError(errorType);
  error.statusCode = errorStatusCode;
  error.retryAfter = errorRetryAfter;

  return error;
}

/**
 * Normalize any error into a PlatformError
 *
 * @param error - The error to normalize
 * @param platform - The platform that generated the error
 * @returns A PlatformError
 */
export function normalizePlatformError(error: unknown, platform: AIPlatform): PlatformError {
  if (isPlatformError(error)) {
    return error;
  }

  return createPlatformError({
    platform,
    originalError: error,
  });
}

// ============================================================================
// Error Information Extraction
// ============================================================================

/**
 * Extract error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";

  if (typeof error === "string") return error;

  if (error instanceof Error) return error.message;

  if (typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return String(error);
}

/**
 * Extract HTTP status code from error (if available)
 */
function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;

  // Check common status code properties
  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }

  if ("code" in error && typeof error.code === "number") {
    return error.code;
  }

  // Check nested response object
  if ("response" in error && typeof error.response === "object" && error.response !== null) {
    if ("status" in error.response && typeof error.response.status === "number") {
      return error.response.status;
    }
  }

  return undefined;
}

/**
 * Extract retry-after delay from error (if available)
 */
function getRetryAfter(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;

  // Check for retryAfter in error object
  if ("retryAfter" in error && typeof error.retryAfter === "number") {
    return error.retryAfter;
  }

  // Check response headers for Retry-After header
  if ("response" in error && typeof error.response === "object" && error.response !== null) {
    if ("headers" in error.response && typeof error.response.headers === "object") {
      const headers = error.response.headers as Record<string, unknown>;
      const retryAfter = headers["retry-after"] || headers["Retry-After"];

      if (typeof retryAfter === "string") {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) {
          return seconds * 1000; // Convert to milliseconds
        }
      } else if (typeof retryAfter === "number") {
        return retryAfter * 1000; // Assume seconds, convert to milliseconds
      }
    }
  }

  return undefined;
}

// ============================================================================
// Exponential Backoff
// ============================================================================

/**
 * Calculate exponential backoff delay
 *
 * @param attempt - The current attempt number (0-based)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, config: Partial<RetryConfig> = {}): number {
  const {
    initialDelayMs = DEFAULT_RETRY_CONFIG.initialDelayMs,
    maxDelayMs = DEFAULT_RETRY_CONFIG.maxDelayMs,
    multiplier = DEFAULT_RETRY_CONFIG.multiplier,
  } = config;

  // Exponential backoff: initialDelay * multiplier^attempt
  const delay = initialDelayMs * Math.pow(multiplier, attempt);

  // Add jitter (random Â±20%) to prevent thundering herd
  const jitter = delay * (0.8 + Math.random() * 0.4);

  // Cap at maxDelayMs
  return Math.min(jitter, maxDelayMs);
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration
 * @returns The result of the function
 * @throws PlatformError if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     return response.json();
 *   },
 *   { platform: 'chatgpt', maxAttempts: 3 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const {
    platform,
    maxAttempts = DEFAULT_RETRY_CONFIG.maxAttempts,
    timeoutMs = DEFAULT_RETRY_CONFIG.timeoutMs,
    retryAllErrors = DEFAULT_RETRY_CONFIG.retryAllErrors,
    onRetry,
    onMaxRetriesExceeded,
  } = config;

  let lastError: PlatformError | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Add timeout to the function call
      const result = await withTimeout(fn(), timeoutMs, platform);
      return result;
    } catch (error) {
      // Normalize error to PlatformError
      const platformError = normalizePlatformError(error, platform);
      lastError = platformError;

      // Check if we should retry
      const shouldRetry =
        attempt < maxAttempts - 1 && // Not the last attempt
        (retryAllErrors || platformError.retryable); // Error is retryable

      if (!shouldRetry) {
        // Don't retry, throw the error
        break;
      }

      // Calculate backoff delay
      const delayMs = platformError.retryAfter || calculateBackoffDelay(attempt, config);

      // Call onRetry callback if provided
      if (onRetry) {
        try {
          onRetry(platformError, attempt + 1, delayMs);
        } catch (callbackError) {
          console.error("[Error Handler] onRetry callback failed:", callbackError);
        }
      }

      // Log retry attempt (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[${platform}] Retrying after error (attempt ${attempt + 1}/${maxAttempts}): ${platformError.message}. ` +
          `Waiting ${delayMs}ms...`
        );
      }

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // All retries exhausted
  if (lastError) {
    // Call onMaxRetriesExceeded callback if provided
    if (onMaxRetriesExceeded) {
      try {
        onMaxRetriesExceeded(lastError);
      } catch (callbackError) {
        console.error("[Error Handler] onMaxRetriesExceeded callback failed:", callbackError);
      }
    }

    throw lastError;
  }

  // Should never reach here
  throw createPlatformError({
    platform,
    type: "unknown",
    message: "Unknown error in retry logic",
  });
}

/**
 * Add timeout to a promise
 *
 * @param promise - The promise to add timeout to
 * @param timeoutMs - Timeout in milliseconds
 * @param platform - Platform name for error context
 * @returns The promise result
 * @throws PlatformError if timeout is exceeded
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  platform: AIPlatform
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            createPlatformError({
              platform,
              type: "timeout",
              message: `Request timed out after ${timeoutMs}ms`,
            })
          ),
        timeoutMs
      )
    ),
  ]);
}

// ============================================================================
// Batch Operations with Error Handling
// ============================================================================

/**
 * Result of a batch operation with error handling
 */
export interface BatchResult<T> {
  /** Successfully completed items */
  successes: T[];

  /** Failed items with their errors */
  failures: Array<{ error: PlatformError; index: number }>;

  /** Total number of items */
  total: number;

  /** Number of successes */
  successCount: number;

  /** Number of failures */
  failureCount: number;

  /** Success rate (0-1) */
  successRate: number;
}

/**
 * Execute multiple operations in parallel with individual error handling
 *
 * @param operations - Array of async functions to execute
 * @param platform - Platform name for error context
 * @param concurrency - Maximum number of concurrent operations (default: 4)
 * @returns Batch result with successes and failures
 *
 * @example
 * ```typescript
 * const results = await executeBatch(
 *   [
 *     () => adapter1.analyze(query, context),
 *     () => adapter2.analyze(query, context),
 *     () => adapter3.analyze(query, context),
 *   ],
 *   'chatgpt',
 *   2 // Max 2 concurrent operations
 * );
 * console.log(`${results.successCount}/${results.total} succeeded`);
 * ```
 */
export async function executeBatch<T>(
  operations: Array<() => Promise<T>>,
  platform: AIPlatform,
  concurrency = 4
): Promise<BatchResult<T>> {
  const results: BatchResult<T> = {
    successes: [],
    failures: [],
    total: operations.length,
    successCount: 0,
    failureCount: 0,
    successRate: 0,
  };

  // Execute operations in batches with concurrency limit
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((op, batchIndex) =>
        op().catch((error) => {
          throw normalizePlatformError(error, platform);
        })
      )
    );

    batchResults.forEach((result, batchIndex) => {
      const globalIndex = i + batchIndex;

      if (result.status === "fulfilled") {
        results.successes.push(result.value);
        results.successCount++;
      } else {
        results.failures.push({
          error: result.reason as PlatformError,
          index: globalIndex,
        });
        results.failureCount++;
      }
    });
  }

  results.successRate = results.total > 0 ? results.successCount / results.total : 0;

  return results;
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Error handling utilities
 */
export const ErrorHandler = {
  // Classification
  classifyError,
  isRetryableError,
  isPlatformError,

  // Creation
  createPlatformError,
  normalizePlatformError,

  // Retry logic
  withRetry,
  withTimeout,
  executeBatch,
  calculateBackoffDelay,
  sleep,

  // Configuration
  DEFAULT_RETRY_CONFIG,
};

export default ErrorHandler;
