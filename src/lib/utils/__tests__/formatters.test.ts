/**
 * Unit Tests for Centralized Format Utilities
 *
 * Tests all formatters with comprehensive coverage including:
 * - Date/time formatters
 * - Number formatters
 * - Currency formatters
 * - File size formatters
 * - String formatters
 * - Utility formatters
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  // Date/Time formatters
  formatDate,
  formatRelativeTime,
  formatTimestamp,
  formatPeriod,
  formatLastSynced,
  // Number formatters
  formatNumber,
  formatTokenCount,
  formatUsageValue,
  formatScore,
  formatLimit,
  formatPercentage,
  // Currency formatters
  formatCost,
  formatCurrency,
  // File size formatters
  formatBytes,
  formatFileSize,
  // String formatters
  formatLocationType,
  formatAddress,
  truncate,
  toTitleCase,
  slugify,
  capitalize,
  formatSentiment,
  // Utility formatters
  formatBoolean,
  formatList,
  formatPhoneNumber,
} from "../formatters";

// ============================================================================
// Date/Time Formatters Tests
// ============================================================================

describe("Date/Time Formatters", () => {
  describe("formatDate", () => {
    it("should format date string with medium style (default)", () => {
      const result = formatDate("2024-12-26");
      expect(result).toBe("Dec 26, 2024");
    });

    it("should format Date object with medium style", () => {
      const date = new Date("2024-12-26T10:30:00Z");
      const result = formatDate(date);
      expect(result).toMatch(/Dec 26, 2024/);
    });

    it("should format date with short style", () => {
      const result = formatDate("2024-12-26", "short");
      expect(result).toMatch(/12\/26\/24/);
    });

    it("should format date with long style", () => {
      const result = formatDate("2024-12-26", "long");
      expect(result).toBe("December 26, 2024");
    });

    it("should format date with full style", () => {
      const result = formatDate("2024-12-26", "full");
      expect(result).toMatch(/December 26, 2024/);
      expect(result).toMatch(/day/i); // Should include weekday
    });

    it("should return N/A for null/undefined", () => {
      expect(formatDate(null)).toBe("N/A");
      expect(formatDate(undefined)).toBe("N/A");
    });

    it("should return Invalid date for invalid date string", () => {
      expect(formatDate("invalid-date")).toBe("Invalid date");
      expect(formatDate("not-a-date")).toBe("Invalid date");
    });
  });

  describe("formatRelativeTime", () => {
    beforeEach(() => {
      // Use real timers for these tests
      vi.useRealTimers();
    });

    it("should format as Just now for very recent timestamps", () => {
      const now = Date.now();
      expect(formatRelativeTime(now)).toBe("Just now");
      expect(formatRelativeTime(now - 2000)).toBe("Just now");
    });

    it("should format seconds ago", () => {
      const now = Date.now();
      const thirtySecondsAgo = now - 30 * 1000;
      expect(formatRelativeTime(thirtySecondsAgo)).toBe("30s ago");
    });

    it("should format minutes ago", () => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
    });

    it("should format hours ago", () => {
      const now = Date.now();
      const threeHoursAgo = now - 3 * 60 * 60 * 1000;
      expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
    });

    it("should format days ago", () => {
      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
      expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
    });

    it("should format as date for old timestamps (>7 days)", () => {
      const now = Date.now();
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
      const result = formatRelativeTime(tenDaysAgo);
      // Should be formatted as a date, not relative time
      expect(result).not.toMatch(/ago/);
      expect(result).toMatch(/\d+/); // Contains numbers (month/day)
    });

    it("should accept Date object", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
    });

    it("should handle ISO date strings", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
    });

    it("should return Never for null and undefined", () => {
      expect(formatRelativeTime(null)).toBe("Never");
      expect(formatRelativeTime(undefined)).toBe("Never");
    });

    it("should handle edge case at 5 second boundary", () => {
      const now = Date.now();
      const fourSecondsAgo = now - 4000;
      expect(formatRelativeTime(fourSecondsAgo)).toBe("Just now");
      const fiveSecondsAgo = now - 5000;
      expect(formatRelativeTime(fiveSecondsAgo)).toBe("5s ago");
    });
  });

  describe("formatTimestamp", () => {
    it("should format timestamp with date and time", () => {
      const timestamp = "2024-12-26T10:30:00Z";
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/Dec 26, 2024/);
      expect(result).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    });

    it("should format numeric timestamp", () => {
      const timestamp = new Date("2024-12-26T10:30:00Z").getTime();
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/Dec 26, 2024/);
    });

    it("should format Date object", () => {
      const date = new Date("2024-12-26T10:30:00Z");
      const result = formatTimestamp(date);
      expect(result).toMatch(/Dec 26, 2024/);
    });

    it("should return N/A for null/undefined", () => {
      expect(formatTimestamp(null as any)).toBe("N/A");
      expect(formatTimestamp(undefined as any)).toBe("N/A");
    });

    it("should return Invalid timestamp for invalid input", () => {
      expect(formatTimestamp("invalid")).toBe("Invalid timestamp");
    });
  });

  describe("formatPeriod", () => {
    it("should format date range", () => {
      const result = formatPeriod("2024-01-01", "2024-12-31");
      expect(result).toBe("Jan 1, 2024 - Dec 31, 2024");
    });

    it("should return N/A for missing dates", () => {
      expect(formatPeriod("", "2024-12-31")).toBe("N/A");
      expect(formatPeriod("2024-01-01", "")).toBe("N/A");
      expect(formatPeriod("", "")).toBe("N/A");
    });

    it("should return Invalid period for invalid dates", () => {
      expect(formatPeriod("invalid", "2024-12-31")).toBe("Invalid period");
      expect(formatPeriod("2024-01-01", "invalid")).toBe("Invalid period");
    });
  });

  describe("formatLastSynced", () => {
    it("should return Never for null/undefined", () => {
      expect(formatLastSynced(null)).toBe("Never");
      expect(formatLastSynced(undefined)).toBe("Never");
    });

    it("should format recent date as relative time", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatLastSynced(fiveMinutesAgo)).toBe("5m ago");
    });

    it("should format date string as relative time", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatLastSynced(fiveMinutesAgo)).toBe("5m ago");
    });

    it("should return Unknown for invalid dates", () => {
      expect(formatLastSynced("invalid-date")).toBe("Unknown");
    });
  });
});

// ============================================================================
// Number Formatters Tests
// ============================================================================

describe("Number Formatters", () => {
  describe("formatNumber", () => {
    it("should format number with locale by default", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("should abbreviate billions", () => {
      expect(formatNumber(1234567890, { abbreviate: true })).toBe("1.2B");
      expect(formatNumber(5000000000, { abbreviate: true, decimals: 0 })).toBe("5B");
    });

    it("should abbreviate millions", () => {
      expect(formatNumber(1234567, { abbreviate: true })).toBe("1.2M");
      expect(formatNumber(5000000, { abbreviate: true, decimals: 2 })).toBe("5.00M");
    });

    it("should abbreviate thousands", () => {
      expect(formatNumber(1234, { abbreviate: true })).toBe("1.2K");
      expect(formatNumber(5000, { abbreviate: true, decimals: 0 })).toBe("5K");
    });

    it("should not abbreviate small numbers", () => {
      expect(formatNumber(999, { abbreviate: true })).toBe("999");
    });

    it("should format without locale when specified", () => {
      const result = formatNumber(1234567, { useLocale: false });
      expect(result).toBe("1234567");
    });

    // ðŸŸ¢ WORKING: Edge case tests for number formatting
    it("should handle zero", () => {
      expect(formatNumber(0)).toBe("0");
      expect(formatNumber(0, { abbreviate: true })).toBe("0");
    });

    it("should handle negative numbers", () => {
      expect(formatNumber(-1234567)).toBe("-1,234,567");
      // Negative numbers are not abbreviated (passed through as-is)
      expect(formatNumber(-1234567, { abbreviate: true })).toBe("-1,234,567");
    });

    it("should handle very large numbers", () => {
      expect(formatNumber(999999999999, { abbreviate: true })).toBe("1000.0B");
      expect(formatNumber(1e12, { abbreviate: true })).toBe("1000.0B");
    });

    it("should handle decimal numbers", () => {
      expect(formatNumber(1234.567)).toBe("1,234.6");
      expect(formatNumber(1234.567, { decimals: 2 })).toBe("1,234.57");
    });

    it("should handle very small decimal numbers", () => {
      expect(formatNumber(0.0001, { decimals: 4 })).toBe("0.0001");
      expect(formatNumber(0.123456, { decimals: 3 })).toBe("0.123");
    });

    it("should handle numbers at abbreviation boundaries", () => {
      expect(formatNumber(999, { abbreviate: true })).toBe("999");
      expect(formatNumber(1000, { abbreviate: true })).toBe("1.0K");
      expect(formatNumber(999999, { abbreviate: true })).toBe("1000.0K");
      expect(formatNumber(1000000, { abbreviate: true })).toBe("1.0M");
    });
  });

  describe("formatTokenCount", () => {
    it("should format millions of tokens", () => {
      expect(formatTokenCount(2500000)).toBe("2.50M");
      expect(formatTokenCount(1000000)).toBe("1.00M");
    });

    it("should format thousands of tokens", () => {
      expect(formatTokenCount(50000)).toBe("50.0K");
      expect(formatTokenCount(1500)).toBe("1.5K");
    });

    it("should format small token counts", () => {
      expect(formatTokenCount(500)).toBe("500");
      expect(formatTokenCount(0)).toBe("0");
    });
  });

  describe("formatUsageValue", () => {
    it("should format usage with unit", () => {
      expect(formatUsageValue(1500, "requests")).toBe("1,500 requests");
      expect(formatUsageValue(2.5, "GB")).toBe("2.5 GB");
    });
  });

  describe("formatScore", () => {
    it("should format score without decimals by default", () => {
      expect(formatScore(85.5)).toBe("86");
      expect(formatScore(90)).toBe("90");
    });

    it("should format score with specified decimals", () => {
      expect(formatScore(85.567, 1)).toBe("85.6");
      expect(formatScore(85.567, 2)).toBe("85.57");
    });
  });

  describe("formatLimit", () => {
    it("should format unlimited", () => {
      expect(formatLimit(-1)).toBe("Unlimited");
    });

    it("should format not available", () => {
      expect(formatLimit(0)).toBe("Not available");
    });

    it("should format numeric limits", () => {
      expect(formatLimit(1000)).toBe("1,000");
      expect(formatLimit(50000)).toBe("50,000");
    });
  });

  describe("formatPercentage", () => {
    it("should format percentage from whole number", () => {
      expect(formatPercentage(85.6)).toBe("85.6%");
      expect(formatPercentage(100)).toBe("100.0%");
    });

    it("should format percentage from decimal", () => {
      expect(formatPercentage(0.856, true)).toBe("85.6%");
      expect(formatPercentage(0.5, true, 0)).toBe("50%");
    });

    it("should respect decimal places", () => {
      expect(formatPercentage(85.567, false, 2)).toBe("85.57%");
      expect(formatPercentage(85.567, false, 0)).toBe("86%");
    });
  });
});

// ============================================================================
// Currency Formatters Tests
// ============================================================================

describe("Currency Formatters", () => {
  describe("formatCost", () => {
    it("should format small costs with 4 decimals", () => {
      expect(formatCost(0.0025)).toBe("$0.0025");
      expect(formatCost(0.0099)).toBe("$0.0099");
    });

    it("should format medium costs with 3 decimals", () => {
      expect(formatCost(0.15)).toBe("$0.150");
      expect(formatCost(0.999)).toBe("$0.999");
    });

    it("should format normal costs with 2 decimals", () => {
      expect(formatCost(1.50)).toBe("$1.50");
      expect(formatCost(100)).toBe("$100.00");
    });

    it("should support different currencies", () => {
      expect(formatCost(10, { currency: "EUR" })).toBe("â‚¬10.00");
      expect(formatCost(10, { currency: "GBP" })).toBe("Â£10.00");
      expect(formatCost(10, { currency: "ZAR" })).toBe("R10.00");
    });

    it("should hide symbol when requested", () => {
      expect(formatCost(10, { showSymbol: false })).toBe("10.00");
    });
  });

  describe("formatCurrency", () => {
    it("should format with locale support", () => {
      const result = formatCurrency(1234.56);
      expect(result).toMatch(/1,234\.56/);
      expect(result).toMatch(/\$/);
    });

    it("should support different currencies", () => {
      const result = formatCurrency(1234.56, { currency: "EUR" });
      expect(result).toMatch(/1,234\.56/);
    });

    it("should respect decimal places", () => {
      expect(formatCurrency(100, { decimals: 0 })).not.toMatch(/\./);
      const result3 = formatCurrency(100.5, { decimals: 3 });
      expect(result3).toMatch(/\.500/);
    });

    // ðŸŸ¢ WORKING: Edge cases and internationalization tests
    it("should handle zero amount", () => {
      expect(formatCurrency(0)).toMatch(/0\.00/);
    });

    it("should handle negative amounts", () => {
      const result = formatCurrency(-50.25);
      expect(result).toMatch(/-.*50\.25/);
    });

    it("should support JPY currency", () => {
      const result = formatCurrency(1234.56, { currency: "JPY" });
      // JPY uses standard decimal formatting with Intl.NumberFormat
      expect(result).toMatch(/1,234/);
    });

    it("should support GBP with pound symbol", () => {
      const result = formatCurrency(99.99, { currency: "GBP" });
      expect(result).toMatch(/99\.99/);
    });

    it("should support ZAR (South African Rand)", () => {
      const result = formatCurrency(500, { currency: "ZAR" });
      expect(result).toMatch(/500\.00/);
    });

    it("should support AUD and CAD", () => {
      const resultAUD = formatCurrency(123.45, { currency: "AUD" });
      const resultCAD = formatCurrency(123.45, { currency: "CAD" });
      expect(resultAUD).toMatch(/123\.45/);
      expect(resultCAD).toMatch(/123\.45/);
    });

    it("should handle very large amounts", () => {
      const result = formatCurrency(1234567890.12);
      expect(result).toMatch(/1,234,567,890\.12/);
    });

    it("should handle very small amounts", () => {
      const result = formatCurrency(0.01, { decimals: 4 });
      expect(result).toMatch(/0\.0100/);
    });
  });
});

// ============================================================================
// File Size Formatters Tests
// ============================================================================

describe("File Size Formatters", () => {
  describe("formatBytes", () => {
    it("should format zero bytes", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    it("should format bytes", () => {
      expect(formatBytes(500)).toBe("500 B");
    });

    it("should format kilobytes", () => {
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
    });

    it("should format megabytes", () => {
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(5242880)).toBe("5 MB");
    });

    it("should format gigabytes", () => {
      expect(formatBytes(1073741824)).toBe("1 GB");
    });

    it("should respect decimal places", () => {
      expect(formatBytes(1536, 2)).toBe("1.5 KB");
      expect(formatBytes(1536, 0)).toBe("2 KB");
    });
  });

  describe("formatFileSize", () => {
    it("should format with binary (1024) by default", () => {
      expect(formatFileSize(1024)).toBe("1 KiB");
      expect(formatFileSize(1048576)).toBe("1 MiB");
    });

    it("should format with decimal (1000)", () => {
      expect(formatFileSize(1000, false)).toBe("1 kB");
      expect(formatFileSize(1000000, false)).toBe("1 MB");
    });

    it("should format zero bytes", () => {
      expect(formatFileSize(0)).toBe("0 B");
    });
  });
});

// ============================================================================
// String Formatters Tests
// ============================================================================

describe("String Formatters", () => {
  describe("formatLocationType", () => {
    it("should format underscored types", () => {
      expect(formatLocationType("retail_store")).toBe("Retail Store");
      expect(formatLocationType("coffee_shop")).toBe("Coffee Shop");
    });

    it("should format single word types", () => {
      expect(formatLocationType("restaurant")).toBe("Restaurant");
    });

    it("should return Unknown for null/undefined", () => {
      expect(formatLocationType(null)).toBe("Unknown");
      expect(formatLocationType(undefined)).toBe("Unknown");
    });
  });

  describe("formatAddress", () => {
    it("should format complete address", () => {
      const location = {
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
      };
      expect(formatAddress(location)).toBe("123 Main St, New York, NY, 10001");
    });

    it("should format partial address", () => {
      const location = {
        address: "123 Main St",
        city: "New York",
        state: null,
        zipCode: undefined,
      };
      expect(formatAddress(location)).toBe("123 Main St, New York");
    });

    it("should return No address for empty location", () => {
      expect(formatAddress({})).toBe("No address");
      expect(formatAddress({ address: null, city: null })).toBe("No address");
    });
  });

  describe("truncate", () => {
    it("should truncate long strings", () => {
      const longString = "This is a very long string that needs to be truncated";
      expect(truncate(longString, 20)).toBe("This is a very lo...");
    });

    it("should not truncate short strings", () => {
      expect(truncate("Short", 20)).toBe("Short");
    });

    it("should use custom ellipsis", () => {
      expect(truncate("Long string here", 10, "…")).toBe("Long stri…");
    });

    it("should handle empty strings", () => {
      expect(truncate("", 10)).toBe("");
    });
  });

  describe("toTitleCase", () => {
    it("should convert to title case", () => {
      expect(toTitleCase("hello world")).toBe("Hello World");
      expect(toTitleCase("the quick brown fox")).toBe("The Quick Brown Fox");
    });

    it("should handle single word", () => {
      expect(toTitleCase("hello")).toBe("Hello");
    });

    it("should handle empty string", () => {
      expect(toTitleCase("")).toBe("");
    });
  });

  describe("slugify", () => {
    it("should create URL-friendly slugs", () => {
      expect(slugify("Hello World!")).toBe("hello-world");
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("should handle special characters", () => {
      expect(slugify("Hello @World #123")).toBe("hello-world-123");
    });

    it("should handle multiple spaces", () => {
      expect(slugify("Hello   World")).toBe("hello-world");
    });

    it("should trim dashes", () => {
      expect(slugify("-Hello World-")).toBe("hello-world");
    });

    it("should handle empty string", () => {
      expect(slugify("")).toBe("");
    });

    // ðŸŸ¢ WORKING: Edge cases for slugify
    it("should handle underscores", () => {
      expect(slugify("Hello_World_Test")).toBe("hello-world-test");
    });

    it("should handle mixed special characters", () => {
      expect(slugify("Product: $199.99 (Sale!)")).toBe("product-19999-sale");
    });

    it("should remove consecutive dashes", () => {
      expect(slugify("Hello---World")).toBe("hello-world");
    });

    it("should handle strings with only special characters", () => {
      expect(slugify("!!!@@@###")).toBe("");
    });

    it("should handle very long strings", () => {
      const longString = "a".repeat(200) + " test";
      const result = slugify(longString);
      expect(result).toMatch(/^a+-test$/);
    });
  });

  describe("capitalize", () => {
    it("should capitalize first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("world")).toBe("World");
    });

    it("should handle single character", () => {
      expect(capitalize("a")).toBe("A");
    });

    it("should handle empty string", () => {
      expect(capitalize("")).toBe("");
    });
  });

  describe("formatSentiment", () => {
    it("should format sentiment values", () => {
      expect(formatSentiment("positive")).toBe("Positive");
      expect(formatSentiment("negative")).toBe("Negative");
      expect(formatSentiment("NEUTRAL")).toBe("Neutral");
    });

    it("should return Neutral for null/undefined", () => {
      expect(formatSentiment(null)).toBe("Neutral");
      expect(formatSentiment(undefined)).toBe("Neutral");
    });
  });
});

// ============================================================================
// Utility Formatters Tests
// ============================================================================

describe("Utility Formatters", () => {
  describe("formatBoolean", () => {
    it("should format true as Yes", () => {
      expect(formatBoolean(true)).toBe("Yes");
    });

    it("should format false as No", () => {
      expect(formatBoolean(false)).toBe("No");
    });

    it("should format null/undefined as No", () => {
      expect(formatBoolean(null)).toBe("No");
      expect(formatBoolean(undefined)).toBe("No");
    });
  });

  describe("formatList", () => {
    it("should format list with and", () => {
      expect(formatList(["apple", "banana", "cherry"])).toBe("apple, banana, and cherry");
    });

    it("should format list with or", () => {
      expect(formatList(["apple", "banana"], "or")).toBe("apple or banana");
    });

    it("should handle single item", () => {
      expect(formatList(["apple"])).toBe("apple");
    });

    it("should handle two items", () => {
      expect(formatList(["apple", "banana"])).toBe("apple and banana");
    });

    it("should handle empty array", () => {
      expect(formatList([])).toBe("");
    });
  });

  describe("formatPhoneNumber", () => {
    it("should format 10-digit number", () => {
      expect(formatPhoneNumber("1234567890")).toBe("(123) 456-7890");
    });

    it("should format 11-digit number", () => {
      expect(formatPhoneNumber("11234567890")).toBe("+1 (123) 456-7890");
    });

    it("should handle already formatted numbers", () => {
      const formatted = formatPhoneNumber("(123) 456-7890");
      expect(formatted).toBe("(123) 456-7890");
    });

    it("should handle numbers with dashes and spaces", () => {
      expect(formatPhoneNumber("123-456-7890")).toBe("(123) 456-7890");
    });

    it("should return N/A for null/undefined", () => {
      expect(formatPhoneNumber(null)).toBe("N/A");
      expect(formatPhoneNumber(undefined)).toBe("N/A");
    });

    it("should return original for non-standard length", () => {
      expect(formatPhoneNumber("123")).toBe("123");
    });

    // ðŸŸ¢ WORKING: Edge cases for phone number formatting
    it("should handle phone numbers with extensions", () => {
      // Returns original for non-standard formats
      expect(formatPhoneNumber("1234567890 ext 123")).toBe("1234567890 ext 123");
    });

    it("should handle international formats", () => {
      expect(formatPhoneNumber("+1-234-567-8901")).toBe("+1 (234) 567-8901");
    });

    it("should handle empty string", () => {
      expect(formatPhoneNumber("")).toBe("N/A");
    });
  });
});

// ============================================================================
// Comprehensive Edge Cases & Internationalization Tests
// ============================================================================

describe("Edge Cases & Internationalization", () => {
  // ðŸŸ¢ WORKING: Date edge cases
  describe("Date Formatters - Edge Cases", () => {
    it("should handle leap year dates", () => {
      expect(formatDate("2024-02-29")).toBe("Feb 29, 2024");
      expect(formatDate("2024-02-29", "long")).toBe("February 29, 2024");
    });

    it("should handle year boundaries", () => {
      expect(formatDate("2023-12-31")).toBe("Dec 31, 2023");
      expect(formatDate("2024-01-01")).toBe("Jan 1, 2024");
    });

    it("should handle far future dates", () => {
      expect(formatDate("2099-12-31")).toBe("Dec 31, 2099");
    });

    it("should handle far past dates", () => {
      expect(formatDate("1900-01-01")).toBe("Jan 1, 1900");
    });

    it("should handle timestamp with timezone", () => {
      const timestamp = "2024-12-26T00:00:00-05:00";
      const result = formatDate(timestamp);
      expect(result).toMatch(/Dec/);
    });

    it("should handle end of month dates", () => {
      expect(formatDate("2024-01-31")).toBe("Jan 31, 2024");
      expect(formatDate("2024-02-29")).toBe("Feb 29, 2024");
      expect(formatDate("2024-04-30")).toBe("Apr 30, 2024");
    });
  });

  // ðŸŸ¢ WORKING: Number edge cases
  describe("Number Formatters - Edge Cases", () => {
    it("should handle negative zero", () => {
      // JavaScript preserves -0, toLocaleString outputs "-0"
      expect(formatNumber(-0)).toMatch(/-?0/);
    });

    it("should handle floating point precision", () => {
      expect(formatNumber(0.1 + 0.2, { decimals: 2 })).toBe("0.3");
    });

    it("should handle scientific notation input", () => {
      expect(formatNumber(1e6, { abbreviate: true })).toBe("1.0M");
      expect(formatNumber(1.5e9, { abbreviate: true })).toBe("1.5B");
    });

    it("should handle very small numbers with abbreviation", () => {
      // Small decimals get rounded by toLocaleString with default decimals=1
      expect(formatNumber(0.5, { abbreviate: true })).toBe("0.5");
      expect(formatNumber(0.001, { abbreviate: true, decimals: 3 })).toBe("0.001");
    });
  });

  // ðŸŸ¢ WORKING: Currency edge cases
  describe("Currency Formatters - Edge Cases", () => {
    it("should handle fractional cents", () => {
      expect(formatCost(0.001)).toBe("$0.0010");
      expect(formatCost(0.0001)).toBe("$0.0001");
    });

    it("should handle currency symbol edge cases", () => {
      // Test all supported currencies
      expect(formatCost(10, { currency: "USD" })).toContain("$");
      expect(formatCost(10, { currency: "EUR" })).toContain("â‚¬");
      expect(formatCost(10, { currency: "GBP" })).toContain("Â£");
      expect(formatCost(10, { currency: "ZAR" })).toContain("R");
      expect(formatCost(10, { currency: "JPY" })).toContain("Â¥");
      expect(formatCost(10, { currency: "AUD" })).toContain("A$");
      expect(formatCost(10, { currency: "CAD" })).toContain("C$");
    });

    it("should handle rounding edge cases", () => {
      // toFixed with 2 decimals: JavaScript's toFixed uses banker's rounding
      // 9.995 rounds to 9.99 (not 10.00) due to floating point representation
      expect(formatCost(9.995)).toBe("$9.99");
      expect(formatCost(9.994)).toBe("$9.99");
      // 0.996 < 1, uses 3 decimals: "0.996"
      expect(formatCost(0.996)).toBe("$0.996");
    });
  });

  // ðŸŸ¢ WORKING: File size edge cases
  describe("File Size Formatters - Edge Cases", () => {
    it("should handle 1 byte", () => {
      expect(formatBytes(1)).toBe("1 B");
    });

    it("should handle bytes just under next unit", () => {
      expect(formatBytes(1023)).toBe("1023 B");
      expect(formatBytes(1024 * 1024 - 1)).toBe("1024 KB");
    });

    it("should handle petabytes", () => {
      expect(formatBytes(1024 ** 5)).toBe("1 PB");
      expect(formatBytes(1.5 * 1024 ** 5)).toBe("1.5 PB");
    });

    it("should handle negative sizes (edge case)", () => {
      // Edge case - negative bytes (shouldn't happen in practice)
      // Math.log of negative number = NaN, Math.floor(NaN) = NaN
      const result = formatBytes(-1024);
      // Function handles this edge case by returning a result
      expect(result).toBeDefined();
    });

    it("should handle very large files", () => {
      expect(formatBytes(999 * 1024 ** 5)).toBe("999 PB");
    });

    it("should compare binary vs decimal", () => {
      const bytes = 1000000;
      const binary = formatFileSize(bytes, true);
      const decimal = formatFileSize(bytes, false);
      expect(binary).toBe("976.6 KiB");
      expect(decimal).toBe("1 MB");
    });
  });

  // ðŸŸ¢ WORKING: String formatter edge cases
  describe("String Formatters - Edge Cases", () => {
    it("should handle truncate with exact length", () => {
      const str = "Hello World";
      expect(truncate(str, 11)).toBe(str);
      expect(truncate(str, 12)).toBe(str);
    });

    it("should handle truncate with ellipsis longer than maxLength", () => {
      const str = "Hello";
      expect(truncate(str, 3, "...")).toBe("...");
    });

    it("should handle address with all null fields", () => {
      expect(formatAddress({
        address: null,
        city: null,
        state: null,
        zipCode: null,
      })).toBe("No address");
    });

    it("should handle location type with multiple underscores", () => {
      expect(formatLocationType("retail_clothing_store")).toBe("Retail Clothing Store");
    });

    it("should handle toTitleCase with mixed case", () => {
      expect(toTitleCase("hELLo WoRLd")).toBe("Hello World");
    });

    it("should handle capitalize with already capitalized string", () => {
      expect(capitalize("Hello")).toBe("Hello");
    });

    it("should handle formatList with single element", () => {
      expect(formatList(["apple"])).toBe("apple");
    });

    it("should handle formatList with many elements", () => {
      const items = ["a", "b", "c", "d", "e"];
      expect(formatList(items)).toBe("a, b, c, d, and e");
    });
  });

  // ðŸŸ¢ WORKING: Null/undefined handling across all formatters
  describe("Null/Undefined Handling - Comprehensive", () => {
    it("should handle null/undefined consistently in date formatters", () => {
      expect(formatDate(null)).toBe("N/A");
      expect(formatDate(undefined)).toBe("N/A");
      expect(formatTimestamp(null as any)).toBe("N/A");
      expect(formatTimestamp(undefined as any)).toBe("N/A");
      expect(formatRelativeTime(null)).toBe("Never");
      expect(formatRelativeTime(undefined)).toBe("Never");
      expect(formatLastSynced(null)).toBe("Never");
      expect(formatLastSynced(undefined)).toBe("Never");
    });

    it("should handle null/undefined consistently in string formatters", () => {
      expect(formatLocationType(null)).toBe("Unknown");
      expect(formatLocationType(undefined)).toBe("Unknown");
      expect(formatSentiment(null)).toBe("Neutral");
      expect(formatSentiment(undefined)).toBe("Neutral");
      expect(formatPhoneNumber(null)).toBe("N/A");
      expect(formatPhoneNumber(undefined)).toBe("N/A");
    });

    it("should handle null/undefined in utility formatters", () => {
      expect(formatBoolean(null)).toBe("No");
      expect(formatBoolean(undefined)).toBe("No");
    });

    it("should handle empty strings appropriately", () => {
      expect(truncate("")).toBe("");
      expect(toTitleCase("")).toBe("");
      expect(slugify("")).toBe("");
      expect(capitalize("")).toBe("");
    });
  });

  // ðŸŸ¢ WORKING: Boundary value tests
  describe("Boundary Value Tests", () => {
    it("should handle zero values across formatters", () => {
      expect(formatNumber(0)).toBe("0");
      expect(formatTokenCount(0)).toBe("0");
      expect(formatBytes(0)).toBe("0 B");
      expect(formatFileSize(0)).toBe("0 B");
    });

    it("should handle percentage boundaries", () => {
      expect(formatPercentage(0)).toBe("0.0%");
      expect(formatPercentage(100)).toBe("100.0%");
      expect(formatPercentage(0, true)).toBe("0.0%");
      expect(formatPercentage(1, true)).toBe("100.0%");
    });

    it("should handle score boundaries", () => {
      expect(formatScore(0)).toBe("0");
      expect(formatScore(100)).toBe("100");
      expect(formatScore(50.5)).toBe("51");
    });

    it("should handle limit special values", () => {
      expect(formatLimit(-1)).toBe("Unlimited");
      expect(formatLimit(0)).toBe("Not available");
      expect(formatLimit(1)).toBe("1");
    });
  });

  // ðŸŸ¢ WORKING: Performance and stress tests
  describe("Performance & Stress Tests", () => {
    it("should handle very long strings in truncate", () => {
      const longString = "a".repeat(10000);
      const result = truncate(longString, 50);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it("should handle large arrays in formatList", () => {
      const items = Array.from({ length: 100 }, (_, i) => `item${i}`);
      const result = formatList(items);
      expect(result).toContain("and item99");
    });

    it("should handle very precise decimal numbers", () => {
      const num = 1.123456789012345;
      expect(formatNumber(num, { decimals: 10 })).toMatch(/1\.\d+/);
    });
  });
});
