/**
 * Centralized Utilities Library
 *
 * Single import point for all utility functions including:
 * - cn() - Tailwind CSS class merging
 * - Formatters - Date, number, currency, file size, string formatters
 * - API Formatters - Standardized API response formatters
 *
 * ðŸŸ¢ WORKING: All formatters tested and verified
 *
 * @example
 * // Import everything from one location
 * import { cn, formatDate, formatCurrency, formatSuccess } from '@/lib/utils';
 *
 * @module utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================================================
// Tailwind CSS Utilities
// ============================================================================

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 * ðŸŸ¢ WORKING: Tested utility function
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// Formatters - Re-exports from ./utils/formatters.ts
// ============================================================================

export type {
  CurrencyCode,
  DateFormatStyle,
  NumberFormatOptions,
  CurrencyFormatOptions,
} from "./utils/formatters";

export {
  // Date & Time Formatters
  formatDate,
  formatRelativeTime,
  formatTimestamp,
  formatPeriod,
  formatLastSynced,

  // Number Formatters
  formatNumber,
  formatTokenCount,
  formatUsageValue,
  formatScore,
  formatLimit,
  formatPercentage,

  // Currency Formatters
  formatCost,
  formatCurrency,

  // File Size Formatters
  formatBytes,
  formatFileSize,

  // String Formatters
  formatLocationType,
  formatAddress,
  truncate,
  toTitleCase,
  slugify,
  capitalize,
  formatSentiment,

  // Utility Formatters
  formatBoolean,
  formatList,
  formatPhoneNumber,
} from "./utils/formatters";

// ============================================================================
// API Formatters - Re-exports from ./utils/api-formatters.ts
// ============================================================================

export type {
  ApiResponse,
  PaginationMeta,
  ValidationError,
  BatchResult,
  OperationStatus,
} from "./utils/api-formatters";

export {
  // Error codes constant
  API_ERROR_CODES,

  // Re-exported from public-api
  createSuccessResponse,
  createErrorResponse,
  createPaginationMeta,

  // Success Formatters
  formatSuccess,
  formatCreated,
  formatUpdated,
  formatDeleted,
  formatPaginated,

  // Error Formatters
  formatError,
  formatValidationError,
  formatNotFound,
  formatUnauthorized,
  formatForbidden,
  formatConflict,
  formatRateLimitExceeded,
  formatServerError,

  // Batch & Status Formatters
  formatBatchResult,
  formatOperationStatus,

  // Utilities
  sanitizeError,
  extractPaginationParams,
} from "./utils/api-formatters";
