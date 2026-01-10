# Formatter Migration Guide

**Status:** ðŸŸ¢ WORKING - Comprehensive migration guide for centralized formatters

This guide helps you migrate from scattered formatter functions to the centralized format utilities library.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Import Path Changes](#import-path-changes)
4. [Formatter Categories](#formatter-categories)
5. [Migration Examples](#migration-examples)
6. [Step-by-Step Migration Process](#step-by-step-migration-process)
7. [Common Patterns](#common-patterns)
8. [Testing After Migration](#testing-after-migration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What Changed?

**Before:** 47+ format functions scattered across 45+ files with inconsistent implementations.

**After:** 42 centralized formatters organized in two files:
- **`formatters.ts`** - 25 core formatters (dates, numbers, currency, file sizes, strings)
- **`api-formatters.ts`** - 17 API response formatters (success, error, pagination)

### Benefits of Migration

âœ… **Single import source** - Import from `@/lib/utils` instead of scattered locations
âœ… **Consistent behavior** - All formatters tested with 159 comprehensive tests
âœ… **TypeScript support** - Full type safety with interfaces and type exports
âœ… **Better documentation** - JSDoc comments with usage examples
âœ… **Null-safe** - Proper handling of null/undefined values
âœ… **Tree-shakeable** - Only import what you need

---

## Quick Start

### One-Line Import Change

**Before:**
```typescript
// Scattered imports from multiple files
import { formatDate } from './utils/dateHelpers';
import { formatCost } from './billing/helpers';
import { formatBytes } from '../admin/utils';
```

**After:**
```typescript
// Single import source
import { formatDate, formatCost, formatBytes } from '@/lib/utils';
```

### Available Formatters

All 42 formatters are available from `@/lib/utils`:

```typescript
import {
  // Date & Time (5)
  formatDate, formatRelativeTime, formatTimestamp, formatPeriod, formatLastSynced,

  // Numbers (6)
  formatNumber, formatTokenCount, formatUsageValue, formatScore, formatLimit, formatPercentage,

  // Currency (2)
  formatCost, formatCurrency,

  // File Sizes (2)
  formatBytes, formatFileSize,

  // Strings (7)
  formatLocationType, formatAddress, truncate, toTitleCase, slugify, capitalize, formatSentiment,

  // Utilities (3)
  formatBoolean, formatList, formatPhoneNumber,

  // API Formatters (17)
  formatSuccess, formatError, formatCreated, formatUpdated, formatDeleted,
  formatPaginated, formatValidationError, formatNotFound, formatUnauthorized,
  formatForbidden, formatConflict, formatRateLimitExceeded, formatServerError,
  formatBatchResult, formatOperationStatus, sanitizeError, extractPaginationParams,

  // Types
  type CurrencyCode, type DateFormatStyle, type ApiResponse, type PaginationMeta,
} from '@/lib/utils';
```

---

## Import Path Changes

### Pattern: Local Formatter â†’ Centralized

| Old Location | Old Import | New Import |
|--------------|------------|------------|
| `components/locations/location-card.tsx` | Local `formatLocationType()` | `import { formatLocationType } from '@/lib/utils'` |
| `components/locations/location-card.tsx` | Local `formatAddress()` | `import { formatAddress } from '@/lib/utils'` |
| `lib/ai/token-tracker.ts` | Local `formatTokenCount()` | `import { formatTokenCount } from '@/lib/utils'` |
| `lib/ai/token-tracker.ts` | Local `formatCost()` | `import { formatCost } from '@/lib/utils'` |
| `components/admin/dashboard` | Local `formatBytes()` | `import { formatBytes } from '@/lib/utils'` |
| Any file | Local `formatDate()` | `import { formatDate } from '@/lib/utils'` |

### Direct Import (Alternative)

If you prefer importing directly from the formatter files:

```typescript
// Import from formatters.ts directly
import { formatDate, formatNumber } from '@/lib/utils/formatters';

// Import from api-formatters.ts directly
import { formatSuccess, formatError } from '@/lib/utils/api-formatters';
```

**Recommendation:** Use `@/lib/utils` for convenience and consistency.

---

## Formatter Categories

### 1. Date & Time Formatters

| Formatter | Purpose | Example Output |
|-----------|---------|----------------|
| `formatDate()` | Format dates with multiple styles | `"Dec 26, 2025"` |
| `formatRelativeTime()` | Relative time strings | `"2 hours ago"` |
| `formatTimestamp()` | Date + time with AM/PM | `"Dec 26, 2025 3:45 PM"` |
| `formatPeriod()` | Date range formatting | `"Dec 1 - Dec 31, 2025"` |
| `formatLastSynced()` | Last sync time display | `"Last synced 5 minutes ago"` |

### 2. Number Formatters

| Formatter | Purpose | Example Output |
|-----------|---------|----------------|
| `formatNumber()` | Format numbers with K/M/B | `"1.5M"` |
| `formatTokenCount()` | Token counts with abbreviations | `"1.2M tokens"` |
| `formatUsageValue()` | Value + unit formatting | `"150 requests"` |
| `formatScore()` | Score with configurable decimals | `"8.7"` |
| `formatLimit()` | Unlimited/Not available handling | `"Unlimited"` |
| `formatPercentage()` | Decimal to percentage | `"85.5%"` |

### 3. Currency Formatters

| Formatter | Purpose | Example Output |
|-----------|---------|----------------|
| `formatCost()` | Simple USD formatting | `"$99.99"` |
| `formatCurrency()` | Multi-currency support | `"â‚¬99.99"` |

### 4. File Size Formatters

| Formatter | Purpose | Example Output |
|-----------|---------|----------------|
| `formatBytes()` | Auto unit selection | `"1.5 MB"` |
| `formatFileSize()` | Binary/decimal base options | `"1.5 GB"` |

### 5. String Formatters

| Formatter | Purpose | Example Output |
|-----------|---------|----------------|
| `formatLocationType()` | Underscore to title case | `"Distribution Center"` |
| `formatAddress()` | Location component formatting | `"123 Main St, Austin, TX"` |
| `truncate()` | String truncation with ellipsis | `"Hello..."` |
| `toTitleCase()` | Title case conversion | `"Hello World"` |
| `slugify()` | URL-friendly slugs | `"hello-world"` |
| `capitalize()` | First letter capitalization | `"Hello"` |
| `formatSentiment()` | Sentiment value formatting | `"Positive"` |

### 6. Utility Formatters

| Formatter | Purpose | Example Output |
|-----------|---------|----------------|
| `formatBoolean()` | Yes/No conversion | `"Yes"` |
| `formatList()` | Grammatical list formatting | `"apples, oranges, and bananas"` |
| `formatPhoneNumber()` | US phone formatting | `"(555) 123-4567"` |

### 7. API Response Formatters

| Category | Formatters |
|----------|-----------|
| **Success** | `formatSuccess`, `formatCreated`, `formatUpdated`, `formatDeleted`, `formatPaginated` |
| **Errors** | `formatError`, `formatValidationError`, `formatNotFound`, `formatUnauthorized`, `formatForbidden`, `formatConflict`, `formatRateLimitExceeded`, `formatServerError` |
| **Batch** | `formatBatchResult`, `formatOperationStatus` |
| **Utilities** | `sanitizeError`, `extractPaginationParams` |

---

## Migration Examples

### Example 1: Location Card Component

**File:** `components/locations/location-card.tsx`

**Before:**
```typescript
"use client";

import { cn } from "@/lib/utils";

// Local helper functions
function formatLocationType(type: string | null | undefined): string {
  if (!type) return "Location";
  const typeMap: Record<string, string> = {
    headquarters: "Headquarters",
    branch: "Branch",
    store: "Store",
    office: "Office",
    warehouse: "Warehouse",
    factory: "Factory",
    distribution_center: "Distribution Center",
  };
  return typeMap[type] || type;
}

function formatAddress(location: LocationData): string {
  const parts = [
    location.address,
    location.city,
    location.state,
  ].filter(Boolean);
  return parts.join(", ") || "No address";
}

function formatLastSynced(date: string | null | undefined): string {
  if (!date) return "Never synced";
  const now = new Date();
  const synced = new Date(date);
  const diffMs = now.getTime() - synced.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function LocationCard({ location }: LocationCardProps) {
  return (
    <div>
      <h3>{formatLocationType(location.locationType)}</h3>
      <p>{formatAddress(location)}</p>
      <span>{formatLastSynced(location.lastSyncedAt)}</span>
    </div>
  );
}
```

**After:**
```typescript
"use client";

import {
  cn,
  formatLocationType,
  formatAddress,
  formatLastSynced
} from "@/lib/utils";

// âœ… All local helper functions removed
// âœ… Using centralized, tested formatters

export function LocationCard({ location }: LocationCardProps) {
  return (
    <div>
      <h3>{formatLocationType(location.locationType)}</h3>
      <p>{formatAddress(location)}</p>
      <span>{formatLastSynced(location.lastSyncedAt)}</span>
    </div>
  );
}
```

**Changes:**
- âœ… Removed 3 local helper functions (~40 lines)
- âœ… Added centralized imports
- âœ… Component logic unchanged
- âœ… Now using tested, null-safe formatters

---

### Example 2: Token Tracker

**File:** `lib/ai/token-tracker.ts`

**Before:**
```typescript
// Local helper functions
function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`;
  }
  if (cost < 1) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

export function displayUsageStats(usage: TokenUsageRecord) {
  console.log(`Tokens: ${formatTokenCount(usage.totalTokens)}`);
  console.log(`Cost: ${formatCost(usage.cost)}`);
}
```

**After:**
```typescript
import { formatTokenCount, formatCost } from '@/lib/utils';

// âœ… All local helper functions removed
// âœ… Using centralized, tested formatters

export function displayUsageStats(usage: TokenUsageRecord) {
  console.log(`Tokens: ${formatTokenCount(usage.totalTokens)}`);
  console.log(`Cost: ${formatCost(usage.cost)}`);
}
```

**Changes:**
- âœ… Removed 2 local helper functions (~20 lines)
- âœ… Added centralized imports
- âœ… Logic unchanged, but now null-safe and tested

---

### Example 3: Admin Dashboard

**File:** `components/admin/dashboard/resources.tsx`

**Before:**
```typescript
// Local helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <div>
      <span>Size: {formatBytes(resource.size)}</span>
    </div>
  );
}
```

**After:**
```typescript
import { formatBytes } from '@/lib/utils';

// âœ… Local helper function removed
// âœ… Using centralized, tested formatter

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <div>
      <span>Size: {formatBytes(resource.size)}</span>
    </div>
  );
}
```

**Changes:**
- âœ… Removed 1 local helper function (~8 lines)
- âœ… Added centralized import
- âœ… Component unchanged

---

### Example 4: API Routes with Error Formatting

**File:** `app/api/admin/users/route.ts`

**Before:**
```typescript
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const users = await db.query.users.findMany();

    return NextResponse.json({
      success: true,
      data: users,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch users",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
```

**After:**
```typescript
import { NextResponse } from "next/server";
import { formatSuccess, formatServerError } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const users = await db.query.users.findMany();

    return NextResponse.json(formatSuccess(users));
  } catch (error) {
    const errorResponse = formatServerError(
      "Failed to fetch users",
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
```

**Changes:**
- âœ… Using standardized response formatters
- âœ… Consistent response structure across all routes
- âœ… Automatic timestamp and error sanitization
- âœ… Type-safe responses with `ApiResponse<T>`

---

### Example 5: Pagination in API Routes

**File:** `app/api/content/assets/route.ts`

**Before:**
```typescript
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const [assets, totalCount] = await Promise.all([
    db.query.assets.findMany({ limit, offset }),
    db.select({ count: sql`count(*)` }).from(assetsTable),
  ]);

  return NextResponse.json({
    success: true,
    data: assets,
    pagination: {
      page,
      limit,
      total: totalCount[0].count,
      totalPages: Math.ceil(totalCount[0].count / limit),
      hasNext: page * limit < totalCount[0].count,
      hasPrev: page > 1,
    },
  });
}
```

**After:**
```typescript
import { NextResponse } from "next/server";
import { formatPaginated, extractPaginationParams } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = extractPaginationParams(searchParams);

  const [assets, totalCount] = await Promise.all([
    db.query.assets.findMany({ limit, offset }),
    db.select({ count: sql`count(*)` }).from(assetsTable),
  ]);

  return NextResponse.json(
    formatPaginated(assets, page, limit, totalCount[0].count)
  );
}
```

**Changes:**
- âœ… Using `extractPaginationParams()` for input validation and clamping
- âœ… Using `formatPaginated()` for consistent pagination structure
- âœ… Reduced boilerplate code
- âœ… Automatic hasNext/hasPrev calculation

---

## Step-by-Step Migration Process

### For Components and Pages

**Step 1: Identify Local Formatters**

Search for local formatter functions in your file:
```bash
# Common patterns to search for
grep -n "function format" your-file.tsx
grep -n "const format" your-file.tsx
```

**Step 2: Check Available Centralized Formatters**

Review available formatters in:
- `src/lib/utils/formatters.ts` - Core formatters
- `src/lib/utils/api-formatters.ts` - API response formatters
- This migration guide's [Formatter Categories](#formatter-categories) section

**Step 3: Update Imports**

Replace local functions with centralized imports:
```typescript
// Add to top of file
import { formatDate, formatNumber, formatCost } from '@/lib/utils';
```

**Step 4: Remove Local Implementations**

Delete the local formatter functions from your file.

**Step 5: Test Functionality**

Run your component/page and verify:
- âœ… No TypeScript errors
- âœ… Formatters produce expected output
- âœ… Null/undefined values handled gracefully

**Step 6: Clean Up Unused Imports**

Remove any helper imports that are no longer needed.

---

### For API Routes

**Step 1: Identify Response Patterns**

Look for manual response construction:
```typescript
// Pattern 1: Success responses
return NextResponse.json({ success: true, data: ... });

// Pattern 2: Error responses
return NextResponse.json({ success: false, error: ... }, { status: 500 });

// Pattern 3: Pagination
return NextResponse.json({ data: items, pagination: { ... } });
```

**Step 2: Choose Appropriate Formatters**

- **Success:** `formatSuccess()`, `formatCreated()`, `formatUpdated()`, `formatDeleted()`
- **Errors:** `formatError()`, `formatValidationError()`, `formatNotFound()`, `formatServerError()`
- **Pagination:** `formatPaginated()` + `extractPaginationParams()`

**Step 3: Update Imports**

```typescript
import {
  formatSuccess,
  formatError,
  formatPaginated,
  extractPaginationParams
} from '@/lib/utils';
```

**Step 4: Replace Manual Construction**

```typescript
// Before
return NextResponse.json({ success: true, data: user });

// After
return NextResponse.json(formatSuccess(user));
```

**Step 5: Test API Endpoints**

```bash
# Test success response
curl http://localhost:3000/api/your-endpoint

# Test error handling
curl http://localhost:3000/api/your-endpoint/invalid-id

# Test pagination
curl http://localhost:3000/api/your-endpoint?page=1&limit=20
```

---

## Common Patterns

### Pattern 1: Multiple Formatters in One Component

**Before:**
```typescript
// Multiple scattered imports
import { formatDate } from './utils/date';
import { formatCost } from '../billing/utils';
import { truncate } from '../../lib/string-utils';
```

**After:**
```typescript
// Single import
import { formatDate, formatCost, truncate } from '@/lib/utils';
```

---

### Pattern 2: Conditional Formatting

**Before:**
```typescript
function displayValue(value: number | null) {
  if (value === null) return "N/A";
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}
```

**After:**
```typescript
import { formatNumber } from '@/lib/utils';

// formatNumber handles null/undefined and abbreviations automatically
function displayValue(value: number | null) {
  return formatNumber(value, { abbreviate: true });
}
```

---

### Pattern 3: Date Formatting with Styles

**Before:**
```typescript
function formatDate(date: string, format: "short" | "long") {
  const d = new Date(date);
  if (format === "short") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}
```

**After:**
```typescript
import { formatDate } from '@/lib/utils';

// Use built-in style options
formatDate(date, "short");  // "12/26/24"
formatDate(date, "medium"); // "Dec 26, 2025"
formatDate(date, "long");   // "December 26, 2025"
formatDate(date, "full");   // "Thursday, December 26, 2025"
```

---

### Pattern 4: API Response with Domain-Specific Data

When you need both generic response structure AND domain-specific formatting:

```typescript
// Domain-specific formatter (stays in your module)
function formatUserProfile(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    joinedAt: formatDate(user.createdAt), // Use centralized formatter
    lastActive: formatRelativeTime(user.lastActiveAt), // Use centralized formatter
    // Don't expose sensitive fields like password, tokens, etc.
  };
}

// Combine with generic success formatter
import { formatSuccess } from '@/lib/utils';

export async function GET(request: Request) {
  const user = await db.query.users.findFirst();
  const formattedUser = formatUserProfile(user);
  return NextResponse.json(formatSuccess(formattedUser));
}
```

**Result:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "joinedAt": "Dec 26, 2025",
    "lastActive": "2 hours ago"
  },
  "timestamp": "2025-12-26T12:00:00.000Z"
}
```

See `API_FORMATTER_PATTERNS.md` for more details on this pattern.

---

## Testing After Migration

### Component Testing

**Before migration:**
```typescript
// component.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './my-component';

test('displays formatted date', () => {
  render(<MyComponent date="2025-12-26" />);
  expect(screen.getByText('Dec 26, 2025')).toBeInTheDocument();
});
```

**After migration:**
```typescript
// component.test.tsx - NO CHANGES NEEDED
import { render, screen } from '@testing-library/react';
import { MyComponent } from './my-component';

test('displays formatted date', () => {
  render(<MyComponent date="2025-12-26" />);
  // Test still passes - centralized formatter has identical behavior
  expect(screen.getByText('Dec 26, 2025')).toBeInTheDocument();
});
```

The centralized formatters are **backwards compatible** with expected outputs.

---

### API Route Testing

**Test success responses:**
```typescript
// route.test.ts
import { GET } from './route';

describe('GET /api/users', () => {
  it('returns formatted success response', async () => {
    const response = await GET(new Request('http://localhost/api/users'));
    const data = await response.json();

    expect(data).toMatchObject({
      success: true,
      data: expect.any(Array),
      timestamp: expect.any(String),
    });
  });
});
```

**Test error responses:**
```typescript
it('returns formatted error response', async () => {
  // Mock database error
  mockDb.query.users.findMany.mockRejectedValueOnce(new Error('DB Error'));

  const response = await GET(new Request('http://localhost/api/users'));
  const data = await response.json();

  expect(data).toMatchObject({
    success: false,
    error: {
      message: expect.any(String),
      code: expect.any(String),
    },
    timestamp: expect.any(String),
  });
});
```

---

### Integration Testing

Run your existing test suite:
```bash
# Run all tests
npm test

# Run specific test file
npm test -- your-component.test.tsx

# Run tests in watch mode
npm test -- --watch
```

**Expected results:**
- âœ… Existing tests should pass without modification
- âœ… If tests fail, check for:
  - Exact string matching (centralized formatters may have slightly different output)
  - Locale differences (centralized formatters use en-US)
  - Edge case handling (centralized formatters are more robust)

---

## Troubleshooting

### Issue 1: Import Errors

**Error:**
```
Module not found: Can't resolve '@/lib/utils'
```

**Solution:**
Check your `tsconfig.json` has the path alias configured:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### Issue 2: TypeScript Type Errors

**Error:**
```
Type 'string | undefined' is not assignable to type 'string'
```

**Solution:**
The centralized formatters handle `null` and `undefined` automatically. Update your component types:

```typescript
// Before
function MyComponent({ date }: { date: string }) {
  return <span>{formatDate(date)}</span>;
}

// After - Allow null/undefined
function MyComponent({ date }: { date: string | null | undefined }) {
  return <span>{formatDate(date)}</span>; // Returns "N/A" for null/undefined
}
```

---

### Issue 3: Different Output Format

**Error:**
```
Expected "12/26/24" but got "Dec 26, 2024"
```

**Solution:**
The centralized formatters use consistent default formats. Update your expectations or pass style options:

```typescript
// Use specific style
formatDate(date, "short");  // "12/26/24"
formatDate(date, "medium"); // "Dec 26, 2024" (default)
```

---

### Issue 4: Missing Formatter

**Error:**
```
Can't find formatter for my specific use case
```

**Solution:**

**Option A:** Check if an existing formatter can be configured:
```typescript
// Many formatters have options
formatNumber(value, { decimals: 2, abbreviate: true });
formatCurrency(value, { currency: "EUR", decimals: 0 });
```

**Option B:** Create a domain-specific formatter in your module:
```typescript
// Keep domain-specific logic in your file
export function formatCustomMetric(value: number) {
  // Use centralized formatters as building blocks
  return `${formatNumber(value)} custom units`;
}
```

**Option C:** Submit a request to add the formatter to the centralized library:
```bash
# Create an issue or discussion
# Include: use case, expected behavior, example inputs/outputs
```

---

### Issue 5: Locale/Internationalization

**Error:**
```
Need non-US date formats
```

**Current State:**
All centralized formatters use `en-US` locale for consistency and predictability.

**Solution for i18n:**
```typescript
// For internationalized apps, wrap the formatters
import { formatDate as formatDateBase } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';

function useFormatDate() {
  const locale = useLocale(); // e.g., "en-GB", "fr-FR"

  return (date: string | Date | null) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, { /* options */ });
  };
}
```

Future enhancement: Add `locale` parameter to formatters.

---

## Migration Checklist

Use this checklist when migrating a file:

- [ ] **Identify** all local formatter functions in the file
- [ ] **Check** if equivalent centralized formatters exist
- [ ] **Import** needed formatters from `@/lib/utils`
- [ ] **Replace** local function calls with centralized formatters
- [ ] **Remove** local formatter implementations
- [ ] **Update** TypeScript types to allow null/undefined if needed
- [ ] **Test** the file (component renders, API returns expected format)
- [ ] **Run** existing tests to verify backwards compatibility
- [ ] **Clean up** unused imports
- [ ] **Commit** changes with descriptive message

**Commit message template:**
```bash
git commit -m "refactor: migrate [component/route name] to centralized formatters

- Replaced X local formatters with centralized utilities
- Removed Y lines of duplicate code
- Maintained backwards compatibility
"
```

---

## Next Steps

### After Migrating Your File

1. **Run tests** - Ensure existing tests still pass
2. **Check TypeScript** - `npm run type-check` or `tsc --noEmit`
3. **Test in browser** - Manually verify formatting looks correct
4. **Commit changes** - Create a clean commit with descriptive message

### Gradual Migration Strategy

**Phase 1: High-Traffic Files (Priority)**
- Dashboard components
- API routes with heavy usage
- User-facing pages

**Phase 2: Medium-Traffic Files**
- Admin pages
- Settings components
- Internal tools

**Phase 3: Low-Traffic Files**
- Utility components
- Legacy pages
- Deprecated features

**You don't need to migrate everything at once.** The centralized formatters coexist with local formatters.

---

## Additional Resources

- **Formatter Reference:** See `formatters.ts` for all core formatters with JSDoc
- **API Patterns:** See `API_FORMATTER_PATTERNS.md` for API response patterns
- **Tests:** See `__tests__/formatters.test.ts` for usage examples (159 tests)
- **Type Definitions:** Import types from `@/lib/utils` for TypeScript support

---

## Questions or Issues?

If you encounter issues during migration:

1. **Check this guide** - Most common issues are covered in [Troubleshooting](#troubleshooting)
2. **Review tests** - The test files show correct usage patterns
3. **Check API patterns** - See `API_FORMATTER_PATTERNS.md` for API-specific guidance
4. **Ask the team** - Reach out if you're stuck or need clarification

---

**Last Updated:** 2025-12-26
**Status:** ðŸŸ¢ WORKING - All formatters tested with 159 comprehensive tests
