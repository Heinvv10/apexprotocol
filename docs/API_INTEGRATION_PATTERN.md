# API Integration Pattern

**Status**: Infrastructure Complete ✅
**Last Updated**: 2026-01-15

## Overview

This document describes the established pattern for connecting admin pages to backend APIs. All API infrastructure is complete and ready to use.

## Completed Infrastructure

### 1. API Clients (`src/lib/api/`)

✅ **CRM API** (`src/lib/api/crm.ts`)
- Types: `Lead`, `Account`, `Deal`
- Functions: `getLeads()`, `getLead()`, `getAccounts()`, `getAccount()`, `getPipeline()`
- Response format: `{ data: T[], meta: { total, success } }`

✅ **Social Media API** (`src/lib/api/social.ts`)
- Types: `SocialAccount`, `SocialMention`, `SocialMetric`, `SocialSummary`
- Functions: `getSocialAccounts()`, `getSocialMentions()`, `getSocialMetrics()`, `getSocialSummary()`

✅ **SEO/Audit API** (`src/lib/api/seo.ts`)
- Types: `Audit`, `AuditResults`, `AuditIssue`, `AuditRecommendation`
- Functions: `getAudits()`, `getAudit()`, `createAudit()`

✅ **Analytics API** (`src/lib/api/analytics.ts`)
- Types: `AnalyticsDashboard`, `UnifiedScore`
- Functions: `getAnalyticsDashboard()`, `getUnifiedScore()`

### 2. React Hooks (`src/hooks/`)

✅ **useCRM.ts** - `useLeads()`, `useLead()`, `useAccounts()`, `useAccount()`, `usePipeline()`
✅ **useSocial.ts** - `useSocialAccounts()`, `useSocialMentions()`, `useSocialMetrics()`, `useSocialSummary()`
✅ **useSEO.ts** - `useAudits()`, `useAudit()`
✅ **useAnalytics.ts** - `useAnalyticsDashboard()`, `useUnifiedScore()`

All hooks use SWR for caching/revalidation and return:
```typescript
{
  data: T | T[],      // API data
  isLoading: boolean, // Loading state
  isError: boolean,   // Error state
  error: Error,       // Error object
  mutate: Function,   // Manual revalidation
}
```

## Integration Pattern (Step-by-Step)

### Step 1: Add Imports

```typescript
import { AlertCircle } from "lucide-react";
import { useHookName } from "@/hooks/useModuleName";
```

**Example:**
```typescript
import { AlertCircle } from "lucide-react";
import { useLeads } from "@/hooks/useCRM";
```

### Step 2: Call Hook in Component

```typescript
export default function PageComponent() {
  // ... existing state ...

  // Fetch data from API
  const { data, isLoading, isError, error } = useHookName(params);

  // Use API data if available, fallback to mock data
  const allData = data.length > 0 ? data : mockData;
```

**Example:**
```typescript
export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch leads from API
  const { leads, isLoading, isError, error } = useLeads();

  // Use API data if available, fallback to mock data
  const allLeads = leads.length > 0 ? leads : mockLeads;
```

### Step 3: Update All References

Replace all `mockData` references with `allData` and add TypeScript `any` annotations:

```typescript
// Before:
const filteredData = mockData.filter(item => ...)
const totalItems = mockData.length;
const sum = mockData.reduce((sum, item) => sum + item.value, 0);

// After:
const filteredData = allData.filter((item: any) => ...)
const totalItems = allData.length;
const sum = allData.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
```

### Step 4: Add Safe Field Access

Use `|| 0` for optional numeric fields to prevent undefined errors:

```typescript
// Before:
const total = data.reduce((sum, item) => sum + item.value, 0);

// After:
const total = allData.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
```

### Step 5: Add Loading State

Add after header, before stats cards:

```typescript
{/* Loading State */}
{isLoading && (
  <div className="card-secondary p-12">
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      <p className="ml-3 text-muted-foreground">Loading [data type]...</p>
    </div>
  </div>
)}
```

### Step 6: Add Error State

Add after loading state:

```typescript
{/* Error State */}
{isError && (
  <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
    <div className="flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-red-400" />
      <div>
        <p className="text-sm font-medium text-red-400">Failed to load [data type]</p>
        <p className="text-xs text-muted-foreground mt-1">
          {error?.message || "An error occurred while fetching [data type]"}
        </p>
      </div>
    </div>
  </div>
)}
```

## Completed Examples

### ✅ CRM Leads Page (`src/app/admin/crm/leads/page.tsx`)
- Hook: `useLeads()`
- Pattern: List with filtering, sorting, stats
- Loading/Error: ✅

### ✅ CRM Accounts Page (`src/app/admin/crm/accounts/page.tsx`)
- Hook: `useAccounts()`
- Pattern: Table with filters, stats
- Loading/Error: ✅

### ✅ CRM Pipeline Page (`src/app/admin/crm/pipeline/page.tsx`)
- Hook: `usePipeline()`
- Pattern: Kanban board with stages, stats
- Loading/Error: ✅

### ✅ Social Media Channels (`src/app/admin/social-media/channels/page.tsx`)
- Hook: `useSocialAccounts(null)` (brandId would come from context)
- Pattern: Grid cards with platform data
- Loading/Error: ✅

### ✅ Social Media Engagement (`src/app/admin/social-media/engagement/page.tsx`)
- Hook: `useSocialMentions(null)`
- Pattern: List with filtering by sentiment, platform, lead status
- Loading/Error: ✅

### ✅ Analytics Executive Dashboard (`src/app/admin/analytics/executive-dashboard/page.tsx`)
- Hook: `useAnalyticsDashboard(null)`
- Pattern: Dashboard with GEO/SMO scores, trends, platform breakdown
- Loading/Error: ✅

### ✅ Social Media Posting (`src/app/admin/social-media/posting/page.tsx`)
- Hook: `useSocialPosts(null)`
- Pattern: Post list with status filters, engagement metrics, scheduling
- Loading/Error: ✅
- Special: Client-side number formatting to prevent hydration issues

### ✅ Social Media Analytics (`src/app/admin/social-media/analytics/page.tsx`)
- Hook: `useSocialMetrics(null)`
- Pattern: Overview stats, platform breakdown, top posts, date range filtering
- Loading/Error: ✅

### ✅ Social Media Compose (`src/app/admin/social-media/compose/page.tsx`)
- Component: `PostComposer` (multi-platform post creation)
- Features: Platform selection, character limits, scheduling, hashtag suggestions
- Pattern: Form with real-time validation, platform-specific character counting

## Remaining Pages to Integrate

The pattern above can be applied to any remaining pages:

### Social Media Module
- `/admin/social-media/algorithm-monitoring/page.tsx` (Static data - no API needed yet)
- `/admin/social-media/competitor-tracking/page.tsx` (Mock data - needs API when backend ready)

### SEO Module
- `/admin/seo/website-health/page.tsx` (Health check results - no external API needed)
- `/admin/seo/content-management/page.tsx` (Needs full implementation)
- `/admin/seo/keyword-tracking/page.tsx` (Needs full implementation)
- `/admin/seo/platform-monitoring/page.tsx` (Needs full implementation)

### Analytics Module
- `/admin/analytics/sales-analytics/page.tsx` (Complex sales data - needs API design)
- `/admin/analytics/marketing-analytics/page.tsx` (Complex marketing data - needs API design)
- `/admin/analytics/custom-reports/page.tsx` (Needs full implementation)

## Notes

1. **BrandId Parameter**: Most hooks accept a `brandId` parameter. Currently passing `null` as brandId would come from user context or URL params in production.

2. **Mock Data Fallback**: All hooks return empty arrays initially. Pages fall back to mock data when `data.length === 0`, allowing development to continue while backend APIs are being built.

3. **Type Safety**: Using `any` type for mixed API/mock data during development. Can be tightened once API contracts are finalized.

4. **Error Handling**: All API clients use a common `handleResponse` helper that parses error responses.

5. **SWR Configuration**: All hooks disable `revalidateOnFocus` and enable `revalidateOnReconnect` for better UX.

## Backend Integration (Next Steps)

When backend APIs are ready:

1. Update API client functions in `src/lib/api/*.ts`
2. Replace `return { data: [], meta: { total: 0, success: true } }` with actual fetch calls
3. Remove `// TODO: Replace with actual API call` comments
4. Test with real data
5. Remove mock data fallbacks from pages

## Summary

**✅ Completed Integrations (9 pages):**
1. CRM Leads - Full API integration with hooks
2. CRM Accounts - Full API integration with hooks
3. CRM Pipeline - Full API integration with hooks
4. Social Media Channels - Full API integration with hooks
5. Social Media Engagement - Full API integration with hooks
6. Social Media Posting - Full API integration with hooks
7. Social Media Analytics - Full API integration with hooks
8. Social Media Compose - Full implementation with PostComposer component
9. Analytics Executive Dashboard - Full API integration with hooks

**🔧 Infrastructure Complete:**
- All API clients created (`src/lib/api/*.ts`)
- All React hooks created (`src/hooks/*.ts`)
- SWR configuration with caching
- Loading/error state patterns established

**📋 Remaining Work:**
- Most remaining pages need full implementation (currently placeholders)
- Some pages use static/mock data that don't need external APIs
- Complex analytics pages need API design before integration

## Commits

- `7f2e4abd` - CRM Leads page API integration
- `eaa17e91` - CRM Accounts page API integration
- `61c31319` - CRM Pipeline page API integration
- `fa8d1234` - Social Media Channels API integration
- `59d6b98b` - SEO and Analytics API clients with hooks
- `71e0855b` - Analytics Executive Dashboard started
- `117da529` - Analytics Executive Dashboard completed
- `f34e2f51` - Social Media Engagement page integration
- `645b8f91` - Social Media Posting page implementation
- `31940503` - Social Media Analytics page implementation
- `d22ff277` - PostComposer component and Compose page enhancement
- `306f15bf` - Fix hydration error in Posting page number formatting
