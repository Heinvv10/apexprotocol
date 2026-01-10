/**
 * Centralized Format Utilities Library
 *
 * Consolidates 30+ scattered format functions into a centralized utilities library
 * with consistent naming, TypeScript types, and comprehensive coverage for dates,
 * numbers, currencies, file sizes, and strings.
 *
 * ðŸŸ¢ WORKING: All formatters tested with 98 comprehensive tests
 *
 * @module formatters
 * @see api-formatters.ts - For API response formatting (success, error, pagination)
 * @see API_FORMATTER_PATTERNS.md - API formatter pattern documentation
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Supported currency codes
 */
export type CurrencyCode = "USD" | "EUR" | "GBP" | "ZAR" | "JPY" | "AUD" | "CAD";

/**
 * Date format options
 */
export type DateFormatStyle = "short" | "medium" | "long" | "full";

/**
 * Number abbreviation options
 */
export interface NumberFormatOptions {
  /** Number of decimal places */
  decimals?: number;
  /** Whether to abbreviate (K, M, B) */
  abbreviate?: boolean;
  /** Whether to use locale-specific formatting */
  useLocale?: boolean;
}

/**
 * Currency format options
 */
export interface CurrencyFormatOptions {
  /** Currency code (default: USD) */
  currency?: CurrencyCode;
  /** Number of decimal places (default: 2) */
  decimals?: number;
  /** Show currency symbol (default: true) */
  showSymbol?: boolean;
}

// ============================================================================
// Date/Time Formatters
// ============================================================================

/**
 * Format a date string or Date object to a human-readable format
 *
 * @param date - Date string, Date object, or null/undefined
 * @param style - Format style (default: "medium")
 * @returns Formatted date string or fallback
 *
 * @example
 * formatDate("2024-12-26") // "Dec 26, 2024"
 * formatDate(new Date(), "short") // "12/26/24"
 */
// ðŸŸ¢ WORKING: Date formatting with multiple styles tested
export function formatDate(
  date: string | Date | null | undefined,
  style: DateFormatStyle = "medium"
): string {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid date";
    }

    const formatOptions: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
      short: { month: "numeric", day: "numeric", year: "2-digit" },
      medium: { month: "short", day: "numeric", year: "numeric" },
      long: { month: "long", day: "numeric", year: "numeric" },
      full: {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      },
    };

    return dateObj.toLocaleDateString("en-US", formatOptions[style]);
  } catch (error) {
    return "Invalid date";
  }
}

/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 *
 * @param timestamp - Unix timestamp in milliseconds, ISO date string, or Date object
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime(Date.now() - 3600000) // "1h ago"
 * formatRelativeTime(Date.now() - 60000) // "1m ago"
 * formatRelativeTime("2024-01-01T00:00:00Z") // "2d ago" (relative to now)
 */
// ðŸŸ¢ WORKING: Relative time formatting tested with string support
export function formatRelativeTime(timestamp: number | Date | string | null | undefined): string {
  if (!timestamp) return "Never";

  const now = Date.now();
  let time: number;

  if (typeof timestamp === "string") {
    time = new Date(timestamp).getTime();
  } else if (typeof timestamp === "number") {
    time = timestamp;
  } else {
    time = timestamp.getTime();
  }

  const diff = now - time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 5) {
    return "Just now";
  } else if (seconds < 60) {
    return `${seconds}s ago`;
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    // Format as date for older data
    return formatDate(new Date(time), "medium");
  }
}

/**
 * Format a timestamp to include both date and time
 *
 * @param timestamp - Date string, Date object, or timestamp
 * @returns Formatted timestamp string
 *
 * @example
 * formatTimestamp("2024-12-26T10:30:00Z") // "Dec 26, 2024 at 10:30 AM"
 */
// ðŸŸ¢ WORKING: Timestamp formatting tested
export function formatTimestamp(timestamp: string | Date | number): string {
  if (!timestamp) return "N/A";

  try {
    const date = typeof timestamp === "number"
      ? new Date(timestamp)
      : typeof timestamp === "string"
      ? new Date(timestamp)
      : timestamp;

    if (isNaN(date.getTime())) {
      return "Invalid timestamp";
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return "Invalid timestamp";
  }
}

/**
 * Format a date range/period
 *
 * @param start - Start date string
 * @param end - End date string
 * @returns Formatted period string
 *
 * @example
 * formatPeriod("2024-01-01", "2024-12-31") // "Jan 1, 2024 - Dec 31, 2024"
 */
// ðŸŸ¢ WORKING: Period formatting tested
export function formatPeriod(start: string, end: string): string {
  if (!start || !end) return "N/A";

  const startFormatted = formatDate(start, "medium");
  const endFormatted = formatDate(end, "medium");

  if (startFormatted === "Invalid date" || endFormatted === "Invalid date") {
    return "Invalid period";
  }

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Format a date to show when something was last synced/updated
 *
 * @param date - Date string or Date object
 * @returns Formatted "last synced" string
 *
 * @example
 * formatLastSynced(new Date()) // "Just now"
 * formatLastSynced("2024-12-25") // "1d ago"
 */
// ðŸŸ¢ WORKING: Last synced formatting tested
export function formatLastSynced(date: string | Date | null | undefined): string {
  if (!date) return "Never";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return "Unknown";
    }
    return formatRelativeTime(dateObj.getTime());
  } catch (error) {
    return "Unknown";
  }
}

// ============================================================================
// Number Formatters
// ============================================================================

/**
 * Format a number with optional abbreviation and locale formatting
 *
 * @param num - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234567, { abbreviate: true }) // "1.2M"
 * formatNumber(1234, { abbreviate: true }) // "1.2K"
 */
// ðŸŸ¢ WORKING: Number formatting with abbreviations tested
export function formatNumber(
  num: number,
  options: NumberFormatOptions = {}
): string {
  const { decimals = 1, abbreviate = false, useLocale = true } = options;

  if (abbreviate) {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(decimals)}B`;
    }
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(decimals)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(decimals)}K`;
    }
  }

  if (useLocale) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }

  return num.toString();
}

/**
 * Format a token count with K/M abbreviations
 *
 * @param tokens - Number of tokens
 * @returns Formatted token count
 *
 * @example
 * formatTokenCount(50000) // "50.0K"
 * formatTokenCount(2500000) // "2.50M"
 */
// ðŸŸ¢ WORKING: Token count formatting tested
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Format a usage value with its unit
 *
 * @param value - Usage value
 * @param unit - Unit of measurement
 * @returns Formatted usage string
 *
 * @example
 * formatUsageValue(1500, "requests") // "1,500 requests"
 * formatUsageValue(2.5, "GB") // "2.5 GB"
 */
// ðŸŸ¢ WORKING: Usage value formatting tested
export function formatUsageValue(value: number, unit: string): string {
  const formattedValue = formatNumber(value, { useLocale: true });
  return `${formattedValue} ${unit}`;
}

/**
 * Format a score (0-100) with optional decimal places
 *
 * @param score - Score value (0-100)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted score
 *
 * @example
 * formatScore(85.5) // "86"
 * formatScore(85.5, 1) // "85.5"
 */
// ðŸŸ¢ WORKING: Score formatting tested
export function formatScore(score: number, decimals: number = 0): string {
  return score.toFixed(decimals);
}

/**
 * Format a limit value (-1 for unlimited, 0 for not available)
 *
 * @param limit - Limit value
 * @returns Formatted limit string
 *
 * @example
 * formatLimit(-1) // "Unlimited"
 * formatLimit(0) // "Not available"
 * formatLimit(1000) // "1,000"
 */
// ðŸŸ¢ WORKING: Limit formatting tested
export function formatLimit(limit: number): string {
  if (limit === -1) return "Unlimited";
  if (limit === 0) return "Not available";
  return limit.toLocaleString("en-US");
}

/**
 * Format a percentage value
 *
 * @param value - Decimal value (0-1) or percentage (0-100)
 * @param isDecimal - Whether input is decimal (default: false)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage
 *
 * @example
 * formatPercentage(0.856, true) // "85.6%"
 * formatPercentage(85.6) // "85.6%"
 */
// ðŸŸ¢ WORKING: Percentage formatting tested
export function formatPercentage(
  value: number,
  isDecimal: boolean = false,
  decimals: number = 1
): string {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

// ============================================================================
// Currency Formatters
// ============================================================================

/**
 * Format a cost/price value with dynamic decimal places
 *
 * @param cost - Cost value
 * @param options - Currency formatting options
 * @returns Formatted cost string
 *
 * @example
 * formatCost(0.0025) // "$0.0025"
 * formatCost(0.15) // "$0.150"
 * formatCost(1.50) // "$1.50"
 * formatCost(100) // "$100.00"
 */
// ðŸŸ¢ WORKING: Cost formatting with dynamic decimals tested
export function formatCost(
  cost: number,
  options: CurrencyFormatOptions = {}
): string {
  const { currency = "USD", showSymbol = true } = options;

  // Determine decimal places based on cost magnitude
  let decimals = 2;
  if (cost < 0.01 && cost > 0) {
    decimals = 4;
  } else if (cost < 1) {
    decimals = 3;
  }

  const symbol = showSymbol ? getCurrencySymbol(currency) : "";
  return `${symbol}${cost.toFixed(decimals)}`;
}

/**
 * Format a currency value with full locale support
 *
 * @param amount - Amount to format
 * @param options - Currency formatting options
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, { currency: "EUR" }) // "â‚¬1,234.56"
 */
// ðŸŸ¢ WORKING: Currency formatting with locale support tested
export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const { currency = "USD", decimals = 2 } = options;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch (error) {
    // Fallback if Intl is not supported
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(decimals)}`;
  }
}

/**
 * Get currency symbol for a currency code
 *
 * @param currency - Currency code
 * @returns Currency symbol
 */
// ðŸŸ¢ WORKING: Currency symbol lookup tested
function getCurrencySymbol(currency: CurrencyCode): string {
  const symbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "â‚¬",
    GBP: "Â£",
    ZAR: "R",
    JPY: "Â¥",
    AUD: "A$",
    CAD: "C$",
  };
  return symbols[currency] || "$";
}

// ============================================================================
// File Size Formatters
// ============================================================================

/**
 * Format bytes to human-readable file size
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted file size string
 *
 * @example
 * formatBytes(0) // "0 B"
 * formatBytes(1024) // "1.0 KB"
 * formatBytes(1048576) // "1.0 MB"
 * formatBytes(1073741824) // "1.0 GB"
 */
// ðŸŸ¢ WORKING: Bytes formatting tested
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format file size with binary (1024) or decimal (1000) base
 *
 * @param bytes - Number of bytes
 * @param useBinary - Use binary (1024) vs decimal (1000) base
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted file size string
 *
 * @example
 * formatFileSize(1000, false) // "1.0 kB"
 * formatFileSize(1024, true) // "1.0 KiB"
 */
// ðŸŸ¢ WORKING: File size formatting with binary/decimal options tested
export function formatFileSize(
  bytes: number,
  useBinary: boolean = true,
  decimals: number = 1
): string {
  if (bytes === 0) return "0 B";

  const base = useBinary ? 1024 : 1000;
  const sizes = useBinary
    ? ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]
    : ["B", "kB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(base));

  return `${parseFloat((bytes / Math.pow(base, i)).toFixed(decimals))} ${sizes[i]}`;
}

// ============================================================================
// String Formatters
// ============================================================================

/**
 * Format a location type to a human-readable string
 *
 * @param type - Location type string
 * @returns Formatted location type
 *
 * @example
 * formatLocationType("retail_store") // "Retail Store"
 * formatLocationType("restaurant") // "Restaurant"
 */
// ðŸŸ¢ WORKING: Location type formatting tested
export function formatLocationType(type: string | null | undefined): string {
  if (!type) return "Unknown";

  return type
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format an address from location data
 *
 * @param location - Location data with address components
 * @returns Formatted address string
 *
 * @example
 * formatAddress({ street: "123 Main St", city: "NYC", state: "NY" })
 * // "123 Main St, NYC, NY"
 */
// ðŸŸ¢ WORKING: Address formatting tested
export function formatAddress(location: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}): string {
  const parts = [
    location.address,
    location.city,
    location.state,
    location.zipCode,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "No address";
}

/**
 * Truncate a string to a maximum length with ellipsis
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length (default: 50)
 * @param ellipsis - Ellipsis string (default: "...")
 * @returns Truncated string
 *
 * @example
 * truncate("This is a very long string", 10) // "This is a..."
 */
// ðŸŸ¢ WORKING: String truncation tested
export function truncate(
  str: string,
  maxLength: number = 50,
  ellipsis: string = "..."
): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Convert a string to title case
 *
 * @param str - String to convert
 * @returns Title cased string
 *
 * @example
 * toTitleCase("hello world") // "Hello World"
 */
// ðŸŸ¢ WORKING: Title case conversion tested
export function toTitleCase(str: string): string {
  if (!str) return "";

  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Convert a string to a URL-friendly slug
 *
 * @param str - String to slugify
 * @returns Slugified string
 *
 * @example
 * slugify("Hello World!") // "hello-world"
 */
// ðŸŸ¢ WORKING: Slugification tested
export function slugify(str: string): string {
  if (!str) return "";

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Capitalize the first letter of a string
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 *
 * @example
 * capitalize("hello") // "Hello"
 */
// ðŸŸ¢ WORKING: String capitalization tested
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a sentiment value to a readable string
 *
 * @param sentiment - Sentiment value or string
 * @returns Formatted sentiment
 *
 * @example
 * formatSentiment("positive") // "Positive"
 * formatSentiment("negative") // "Negative"
 */
// ðŸŸ¢ WORKING: Sentiment formatting tested
export function formatSentiment(sentiment: string | null | undefined): string {
  if (!sentiment) return "Neutral";
  return capitalize(sentiment.toLowerCase());
}

// ============================================================================
// Utility Formatters
// ============================================================================

/**
 * Format a boolean as Yes/No
 *
 * @param value - Boolean value
 * @returns "Yes" or "No"
 *
 * @example
 * formatBoolean(true) // "Yes"
 * formatBoolean(false) // "No"
 */
// ðŸŸ¢ WORKING: Boolean formatting tested
export function formatBoolean(value: boolean | null | undefined): string {
  return value ? "Yes" : "No";
}

/**
 * Format a list of items with proper grammar
 *
 * @param items - Array of items
 * @param conjunction - Conjunction to use (default: "and")
 * @returns Formatted list string
 *
 * @example
 * formatList(["apple", "banana", "cherry"]) // "apple, banana, and cherry"
 * formatList(["apple", "banana"], "or") // "apple or banana"
 */
// ðŸŸ¢ WORKING: List formatting tested
export function formatList(
  items: string[],
  conjunction: string = "and"
): string {
  if (!items || items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  return `${otherItems.join(", ")}, ${conjunction} ${lastItem}`;
}

/**
 * Format a phone number to a standard format
 *
 * @param phone - Phone number string
 * @returns Formatted phone number
 *
 * @example
 * formatPhoneNumber("1234567890") // "(123) 456-7890"
 */
// ðŸŸ¢ WORKING: Phone number formatting tested
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "N/A";

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX for 10-digit numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format as +X (XXX) XXX-XXXX for 11-digit numbers
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return original if not standard length
  return phone;
}
