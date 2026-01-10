/**
 * Retry Utility with Exponential Backoff
 *
 * A reusable retry utility for handling transient failures in async operations.
 * Supports exponential backoff, error classification, and comprehensive callbacks.
 *
 * Extracted from ai/recommendations.ts to provide consistent retry behavior
 * across API calls, database operations, and external service integrations.
 *
 * ## Features
 *
 * - **Exponential Backoff**: Configurable base delay and multiplier
 * - **Error Classification**: Built-in classifiers for network, rate limit, and client errors
 * - **Composable Classifiers**: Combine multiple classifiers with `createErrorClassifier()`
 * - **Comprehensive Callbacks**: Track errors, retries, and success with optional callbacks
 * - **TypeScript Support**: Full type safety with generics
 * - **Zero Dependencies**: No external dependencies required
 *
 * ## Quick Start
 *
 * @example
 * ```typescript
 * import { retry, isNetworkError, isRateLimitError } from '@/lib/utils/retry';
 *
 * // Basic usage - retry with defaults (3 retries, 1s base delay, 2x multiplier)
 * const data = await retry(async () => {
 *   const response = await fetch('https://api.example.com/data');
 *   return response.json();
 * });
 *
 * // Custom configuration
 * const user = await retry(
 *   async () => fetchUserData(userId),
 *   {
 *     maxRetries: 5,
 *     baseDelay: 2000,
 *     backoffMultiplier: 1.5,
 *     shouldRetry: (error) => isNetworkError(error) || isRateLimitError(error),
 *     onRetry: (info) => {
 *       logger.warn(`Retry attempt ${info.attempt}/${info.maxAttempts} after ${info.delayMs}ms`);
 *     }
 *   }
 * );
 *
 * // Error handling
 * try {
 *   const result = await retry(() => apiCall());
 * } catch (error) {
 *   if (error instanceof RetryError) {
 *     logger.error(`Failed after ${error.attempts} attempts`, error.lastError);
 *   }
 * }
 * ```
 *
 * @see {@link retry} - Main retry function
 * @see {@link RetryOptions} - Configuration options
 * @see {@link RetryError} - Error thrown when all retries are exhausted
 * @see {@link isNetworkError} - Classifier for network errors
 * @see {@link isRateLimitError} - Classifier for rate limit errors
 * @see {@link isNonRetryableError} - Classifier for non-retryable errors
 * @see {@link createErrorClassifier} - Combine multiple classifiers
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Information about a retry attempt passed to callbacks
 *
 * This interface is passed to the `onRetry` callback to provide context
 * about the current retry attempt, including timing and error details.
 *
 * @example
 * ```typescript
 * await retry(fetchData, {
 *   onRetry: (info) => {
 *     logger.warn('Retry attempt', {
 *       attempt: info.attempt,
 *       maxAttempts: info.maxAttempts,
 *       error: info.error.message,
 *       delayMs: info.delayMs,
 *       elapsedMs: info.elapsedMs
 *     });
 *   }
 * });
 * ```
 */
export interface RetryAttemptInfo {
  /** Current attempt number (1-indexed) */
  attempt: number;
  /** Maximum number of retry attempts configured */
  maxAttempts: number;
  /** The error that triggered this retry */
  error: Error;
  /** Delay in milliseconds before this retry */
  delayMs: number;
  /** Total elapsed time since first attempt (ms) */
  elapsedMs: number;
}

/**
 * Result information passed to onSuccess callback
 *
 * This interface is passed to the `onSuccess` callback when an operation
 * succeeds, providing the result and metrics about the retry attempts.
 *
 * @template T - The type of the successful result
 *
 * @example
 * ```typescript
 * await retry(async () => fetchUserData(userId), {
 *   onSuccess: (info) => {
 *     logger.info('Operation succeeded', {
 *       attempts: info.attempts,
 *       elapsedMs: info.elapsedMs,
 *       userId: info.result.id
 *     });
 *   }
 * });
 * ```
 */
export interface RetrySuccessInfo<T> {
  /** The successful result value */
  result: T;
  /** Number of attempts it took to succeed (1 = success on first try) */
  attempts: number;
  /** Total elapsed time including retries (ms) */
  elapsedMs: number;
}

/**
 * Configuration options for retry behavior
 *
 * All options are optional. When not specified, defaults will be used.
 *
 * @example
 * ```typescript
 * // Minimal configuration (uses defaults)
 * await retry(async () => fetchData());
 *
 * // Custom retry limits and timing
 * await retry(fetchData, {
 *   maxRetries: 5,
 *   baseDelay: 2000,  // 2 seconds
 *   backoffMultiplier: 1.5  // Delays: 2s, 3s, 4.5s, 6.75s, 10.125s
 * });
 *
 * // With error classification
 * await retry(fetchData, {
 *   shouldRetry: (error) => {
 *     // Only retry network errors and rate limits
 *     return isNetworkError(error) || isRateLimitError(error);
 *   }
 * });
 *
 * // With logging callbacks
 * await retry(fetchData, {
 *   onError: (error, attempt) => {
 *     logger.error(`Attempt ${attempt} failed: ${error.message}`);
 *   },
 *   onRetry: (info) => {
 *     logger.warn(`Retrying in ${info.delayMs}ms (attempt ${info.attempt}/${info.maxAttempts})`);
 *   },
 *   onSuccess: (info) => {
 *     logger.info(`Operation succeeded after ${info.attempts} attempt(s)`);
 *   }
 * });
 *
 * // Complete example with all options
 * await retry(
 *   async () => apiClient.fetchUser(userId),
 *   {
 *     maxRetries: 3,
 *     baseDelay: 1000,
 *     backoffMultiplier: 2,
 *     shouldRetry: createErrorClassifier([isNetworkError, isRateLimitError]),
 *     onError: (error) => metrics.trackError(error),
 *     onRetry: (info) => logger.warn(`Retry ${info.attempt}`, info),
 *     onSuccess: (info) => metrics.trackSuccess(info.elapsedMs)
 *   }
 * );
 * ```
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds for the first retry
   * @default 1000
   */
  baseDelay?: number;

  /**
   * Multiplier for exponential backoff calculation
   * Formula: baseDelay * Math.pow(backoffMultiplier, attempt - 1)
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Custom function to determine if an error is retryable
   * Return true to retry, false to fail immediately
   * @default () => true (all errors are retryable)
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /**
   * Callback invoked before each retry attempt
   * Useful for logging or metrics
   */
  onRetry?: (info: RetryAttemptInfo) => void | Promise<void>;

  /**
   * Callback invoked when an error occurs (before determining if retry should happen)
   * Useful for error logging or tracking
   */
  onError?: (error: Error, attempt: number) => void | Promise<void>;

  /**
   * Callback invoked when operation succeeds
   * Useful for success logging or metrics
   */
  onSuccess?: <T>(info: RetrySuccessInfo<T>) => void | Promise<void>;
}

/**
 * Internal retry configuration with defaults applied
 * @internal
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  backoffMultiplier: number;
  shouldRetry: (error: Error, attempt: number) => boolean;
  onRetry?: (info: RetryAttemptInfo) => void | Promise<void>;
  onError?: (error: Error, attempt: number) => void | Promise<void>;
  onSuccess?: <T>(info: RetrySuccessInfo<T>) => void | Promise<void>;
}

/**
 * Error thrown when all retry attempts are exhausted
 *
 * This error is thrown when an operation fails after all retry attempts
 * have been exhausted. It includes information about all failed attempts
 * and timing details.
 *
 * @example
 * ```typescript
 * try {
 *   await retry(async () => fetchData(), {
 *     maxRetries: 3,
 *     shouldRetry: isNetworkError
 *   });
 * } catch (error) {
 *   if (error instanceof RetryError) {
 *     logger.error('All retry attempts failed', {
 *       attempts: error.attempts,
 *       elapsedMs: error.elapsedMs,
 *       lastError: error.lastError.message,
 *       allErrors: error.errors.map(e => e.message)
 *     });
 *   }
 *   throw error;
 * }
 * ```
 */
export class RetryError extends Error {
  /** Number of attempts made before failure */
  public readonly attempts: number;

  /** All errors encountered during retry attempts */
  public readonly errors: Error[];

  /** The last error that caused the final failure */
  public readonly lastError: Error;

  /** Total elapsed time across all attempts (ms) */
  public readonly elapsedMs: number;

  constructor(
    message: string,
    attempts: number,
    errors: Error[],
    elapsedMs: number
  ) {
    super(message);
    this.name = "RetryError";
    this.attempts = attempts;
    this.errors = errors;
    this.lastError = errors[errors.length - 1] || new Error("Unknown error");
    this.elapsedMs = elapsedMs;

    // Maintain proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RetryError);
    }
  }
}

/**
 * Result type for successful retry operations
 *
 * This interface represents the complete result of a successful retry operation,
 * including the value and metadata about the attempts.
 *
 * Note: The main `retry()` function returns the value directly (type `T`),
 * not a `RetryResult<T>`. Use the `onSuccess` callback to access this metadata.
 *
 * @template T - The type of the successful result value
 *
 * @example
 * ```typescript
 * // The retry function returns T directly, not RetryResult<T>
 * const user = await retry(() => fetchUser(id));
 *
 * // To get metadata, use the onSuccess callback
 * let metadata: { attempts: number; elapsedMs: number } | undefined;
 * const user = await retry(() => fetchUser(id), {
 *   onSuccess: (info) => {
 *     metadata = {
 *       attempts: info.attempts,
 *       elapsedMs: info.elapsedMs
 *     };
 *   }
 * });
 * ```
 */
export interface RetryResult<T> {
  /** The successful result value */
  value: T;
  /** Number of attempts it took to succeed */
  attempts: number;
  /** Total elapsed time (ms) */
  elapsedMs: number;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if a value is an Error object
 * @internal
 */
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Converts unknown error value to Error object
 * @internal
 */
function toError(value: unknown): Error {
  if (isError(value)) {
    return value;
  }
  if (typeof value === "string") {
    return new Error(value);
  }
  return new Error(String(value));
}

// ðŸŸ¢ WORKING: Core type definitions for retry utility
// All types properly defined with comprehensive JSDoc documentation
// Support for error classification, callbacks, and configurable retry behavior

// ============================================================================
// Core Retry Implementation
// ============================================================================

/**
 * Sleep utility for retry delays
 * @internal
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Apply default values to retry options
 * @internal
 */
function applyDefaults(options: RetryOptions = {}): RetryConfig {
  return {
    maxRetries: options.maxRetries ?? 3,
    baseDelay: options.baseDelay ?? 1000,
    backoffMultiplier: options.backoffMultiplier ?? 2,
    shouldRetry: options.shouldRetry ?? (() => true),
    onRetry: options.onRetry,
    onError: options.onError,
    onSuccess: options.onSuccess,
  };
}

/**
 * Calculate exponential backoff delay
 * Formula: baseDelay * Math.pow(backoffMultiplier, attempt - 1)
 * @internal
 */
function calculateDelay(
  baseDelay: number,
  backoffMultiplier: number,
  attempt: number
): number {
  return baseDelay * Math.pow(backoffMultiplier, attempt - 1);
}

/**
 * Retry an async operation with exponential backoff
 *
 * Executes the provided async function with automatic retries on failure.
 * Supports exponential backoff, error classification, and comprehensive callbacks.
 *
 * @template T - The return type of the async operation
 * @param fn - The async function to retry
 * @param options - Configuration options for retry behavior
 * @returns Promise resolving to the successful result
 * @throws {RetryError} When all retry attempts are exhausted
 *
 * @example
 * ```typescript
 * // Basic usage with defaults (3 retries, 1s base delay, 2x multiplier)
 * const result = await retry(async () => {
 *   return await fetch('https://api.example.com/data');
 * });
 *
 * // Custom configuration
 * const result = await retry(
 *   async () => await fetchUserData(userId),
 *   {
 *     maxRetries: 5,
 *     baseDelay: 2000,
 *     backoffMultiplier: 1.5,
 *     shouldRetry: (error) => !error.message.includes('404'),
 *     onRetry: (info) => {
 *       logger.warn(`Retrying after error (attempt ${info.attempt}/${info.maxAttempts})`);
 *     }
 *   }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // ðŸŸ¢ WORKING: Main retry function with exponential backoff
  // Extracted from recommendations.ts lines 217-321, generalized for reusability
  const config = applyDefaults(options);
  const errors: Error[] = [];
  const startTime = Date.now();

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      // Execute the operation
      const result = await fn();
      const elapsedMs = Date.now() - startTime;

      // Call success callback if provided
      if (config.onSuccess) {
        await config.onSuccess({
          result,
          attempts: attempt,
          elapsedMs,
        });
      }

      return result;
    } catch (error) {
      const err = toError(error);
      errors.push(err);
      const elapsedMs = Date.now() - startTime;

      // Call error callback if provided
      if (config.onError) {
        await config.onError(err, attempt);
      }

      // Check if we should retry
      const shouldRetry = config.shouldRetry(err, attempt);
      const hasMoreAttempts = attempt <= config.maxRetries;

      // If this is the last attempt or error is non-retryable, throw RetryError
      if (!hasMoreAttempts || !shouldRetry) {
        throw new RetryError(
          `Operation failed after ${attempt} attempt(s): ${err.message}`,
          attempt,
          errors,
          elapsedMs
        );
      }

      // Calculate delay and call retry callback
      const delayMs = calculateDelay(config.baseDelay, config.backoffMultiplier, attempt);

      if (config.onRetry) {
        await config.onRetry({
          attempt,
          maxAttempts: config.maxRetries + 1,
          error: err,
          delayMs,
          elapsedMs,
        });
      }

      // Wait before next retry
      await sleep(delayMs);
    }
  }

  // This should never be reached due to the throw in the catch block
  // but TypeScript needs this for type safety
  const elapsedMs = Date.now() - startTime;
  throw new RetryError(
    "Operation failed after all retry attempts",
    config.maxRetries + 1,
    errors,
    elapsedMs
  );
}

// ðŸŸ¢ WORKING: Core retry implementation with exponential backoff
// Matches pattern from recommendations.ts (lines 217-321) but more configurable
// No console.log statements - uses callbacks for logging
// Proper error handling and classification support

// ============================================================================
// Error Classification Utilities
// ============================================================================

/**
 * Type guard to check if an error has a status code property
 * @internal
 */
function hasStatusCode(error: unknown): error is Error & { statusCode: number } {
  return error instanceof Error && 'statusCode' in error && typeof (error as any).statusCode === 'number';
}

/**
 * Type guard to check if an error has a status property
 * @internal
 */
function hasStatus(error: unknown): error is Error & { status: number } {
  return error instanceof Error && 'status' in error && typeof (error as any).status === 'number';
}

/**
 * Type guard to check if an error has a code property
 * @internal
 */
function hasCode(error: unknown): error is Error & { code: string } {
  return error instanceof Error && 'code' in error && typeof (error as any).code === 'string';
}

/**
 * Extract HTTP status code from various error formats
 * @internal
 */
function getStatusCode(error: Error): number | undefined {
  if (hasStatusCode(error)) {
    return error.statusCode;
  }
  if (hasStatus(error)) {
    return error.status;
  }
  return undefined;
}

/**
 * Checks if an error is a network-related error that should be retried
 *
 * Identifies transient network errors such as:
 * - Connection refused (ECONNREFUSED)
 * - Connection timeout (ETIMEDOUT)
 * - DNS lookup failed (ENOTFOUND)
 * - Connection reset (ECONNRESET)
 * - Network unreachable (ENETUNREACH)
 * - Socket timeout (ESOCKETTIMEDOUT)
 *
 * @param error - The error to check
 * @returns true if the error is a retryable network error
 *
 * @example
 * ```typescript
 * const shouldRetry = (error: Error) => isNetworkError(error);
 * await retry(fetchData, { shouldRetry });
 * ```
 */
export function isNetworkError(error: Error): boolean {
  // ðŸŸ¢ WORKING: Identifies common network errors for retry
  // Checks error codes and messages for network-related issues

  if (hasCode(error)) {
    const networkCodes = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNRESET',
      'ENETUNREACH',
      'ESOCKETTIMEDOUT',
      'EAI_AGAIN',
    ];
    return networkCodes.includes(error.code);
  }

  // Check for timeout errors in message
  const message = error.message.toLowerCase();
  return message.includes('timeout') ||
         message.includes('network') ||
         message.includes('connection');
}

/**
 * Checks if an error is a rate limit error (HTTP 429)
 *
 * Identifies rate limiting errors that should be retried with backoff:
 * - HTTP 429 Too Many Requests status code
 * - Error messages containing "rate limit" or "too many requests"
 *
 * @param error - The error to check
 * @returns true if the error is a rate limit error
 *
 * @example
 * ```typescript
 * const shouldRetry = (error: Error) => isRateLimitError(error);
 * await retry(apiCall, { shouldRetry, baseDelay: 5000 });
 * ```
 */
export function isRateLimitError(error: Error): boolean {
  // ðŸŸ¢ WORKING: Identifies HTTP 429 and rate limit errors
  // Checks both status codes and error messages

  const statusCode = getStatusCode(error);
  if (statusCode === 429) {
    return true;
  }

  const message = error.message.toLowerCase();
  return message.includes('rate limit') ||
         message.includes('too many requests');
}

/**
 * Checks if an error is a non-retryable client error
 *
 * Identifies errors that should NOT be retried:
 * - HTTP 4xx client errors (except 429 rate limit)
 * - Validation errors
 * - Authentication/authorization errors (401, 403)
 * - Not found errors (404)
 * - Bad request errors (400)
 *
 * @param error - The error to check
 * @returns true if the error should NOT be retried
 *
 * @example
 * ```typescript
 * const shouldRetry = (error: Error) => !isNonRetryableError(error);
 * await retry(operation, { shouldRetry });
 * ```
 */
export function isNonRetryableError(error: Error): boolean {
  // ðŸŸ¢ WORKING: Identifies client errors that should not be retried
  // Excludes 429 (rate limit) which should be retried

  const statusCode = getStatusCode(error);
  if (statusCode !== undefined) {
    // 4xx errors except 429 are non-retryable
    return statusCode >= 400 && statusCode < 500 && statusCode !== 429;
  }

  // Check for validation error messages (pattern from recommendations.ts)
  const message = error.message.toLowerCase();
  return message.includes('invalid json') ||
         message.includes('validation') ||
         message.includes('invalid input') ||
         message.includes('bad request') ||
         message.includes('unauthorized') ||
         message.includes('forbidden') ||
         message.includes('not found');
}

/**
 * Type definition for error classifier functions
 *
 * Error classifiers are functions that examine an error and return true
 * if the error matches certain criteria. They are used to determine
 * whether an operation should be retried.
 *
 * @param error - The error to classify
 * @returns true if the error matches the classification criteria
 *
 * @example
 * ```typescript
 * // Simple custom classifier
 * const isTimeoutError: ErrorClassifier = (error) => {
 *   return error.message.toLowerCase().includes('timeout');
 * };
 *
 * // Use with retry
 * await retry(fetchData, {
 *   shouldRetry: isTimeoutError
 * });
 *
 * // Combine multiple classifiers
 * const shouldRetry = createErrorClassifier([
 *   isNetworkError,
 *   isRateLimitError,
 *   isTimeoutError
 * ]);
 *
 * await retry(fetchData, { shouldRetry });
 * ```
 */
export type ErrorClassifier = (error: Error) => boolean;

/**
 * Creates a combined error classifier from multiple classifier functions
 *
 * The combined classifier returns true if ANY of the provided classifiers return true.
 * Useful for building complex retry logic from simple, composable classifiers.
 *
 * @param classifiers - Array of classifier functions to combine
 * @returns A single classifier function that combines all inputs
 *
 * @example
 * ```typescript
 * // Retry on network errors OR rate limits
 * const shouldRetry = createErrorClassifier([
 *   isNetworkError,
 *   isRateLimitError
 * ]);
 *
 * await retry(fetchData, { shouldRetry });
 *
 * // Custom classifier with built-in ones
 * const isCustomError = (error: Error) => error.message.includes('custom');
 * const shouldRetry = createErrorClassifier([
 *   isNetworkError,
 *   isCustomError
 * ]);
 * ```
 */
export function createErrorClassifier(classifiers: ErrorClassifier[]): ErrorClassifier {
  // ðŸŸ¢ WORKING: Combines multiple classifiers with OR logic
  // Returns true if any classifier returns true

  return (error: Error): boolean => {
    return classifiers.some(classifier => classifier(error));
  };
}

/**
 * Default error classifier that determines if an error should be retried
 *
 * This is the default implementation used by the retry utility.
 * It retries on:
 * - Network errors (connection issues, timeouts)
 * - Rate limit errors (HTTP 429)
 * - Server errors (HTTP 5xx)
 *
 * It does NOT retry on:
 * - Client errors (HTTP 4xx except 429)
 * - Validation errors
 * - Authentication/authorization errors
 *
 * @param error - The error to check
 * @returns true if the error should be retried
 *
 * @example
 * ```typescript
 * // Use default retryable error logic
 * await retry(operation, {
 *   shouldRetry: isRetryableError
 * });
 *
 * // Or customize it
 * const shouldRetry = (error: Error) => {
 *   if (isRetryableError(error)) {
 *     return true;
 *   }
 *   // Add custom logic
 *   return error.message.includes('special case');
 * };
 * ```
 */
export function isRetryableError(error: Error): boolean {
  // ðŸŸ¢ WORKING: Default retry logic for common scenarios
  // Combines network errors and rate limits, excludes client errors

  // Don't retry client errors (4xx except 429)
  if (isNonRetryableError(error)) {
    return false;
  }

  // Retry network errors and rate limits
  if (isNetworkError(error) || isRateLimitError(error)) {
    return true;
  }

  // Retry server errors (5xx)
  const statusCode = getStatusCode(error);
  if (statusCode !== undefined && statusCode >= 500) {
    return true;
  }

  // Default: retry unknown errors (conservative approach)
  return true;
}

// ðŸŸ¢ WORKING: Error classification utilities for retry logic
// Provides built-in classifiers for network errors, rate limits, validation errors
// Extracted pattern from recommendations.ts (line 303-308) and made extensible
// All functions properly typed, exported, and documented
