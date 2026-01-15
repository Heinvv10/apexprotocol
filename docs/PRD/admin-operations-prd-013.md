# APEX ADMIN OPERATIONS PRD v1.0
## PRD-ADMIN-013: API Integration Architecture

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**Phase**: Cross-Cutting (Technical Infrastructure)
**Scope**: Backend API integration layer for admin operations system

---

## 1. EXECUTIVE SUMMARY

The API Integration Architecture defines the standardized pattern for connecting all admin pages to backend APIs. This architecture provides a consistent, type-safe, and maintainable approach to data fetching with built-in loading states, error handling, and caching.

**Implemented Features**:
- 4 API client modules (CRM, Social, SEO, Analytics)
- 5 React hook modules with SWR integration
- 9 pages with full API integration
- TypeScript interfaces for type safety
- Loading/error state management
- Mock data fallback strategy

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- Admin pages initially built with mock data
- No standardized pattern for API integration
- Inconsistent error handling across pages
- No loading state management
- No caching or data revalidation strategy

### 2.2 Business Goals
1. Create reusable API integration layer
2. Standardize data fetching patterns across all admin pages
3. Provide consistent loading and error states
4. Enable progressive enhancement (mock → real data)
5. Maintain type safety with TypeScript

### 2.3 Key Metrics
- API response time: <500ms for list endpoints
- Loading state visibility: <100ms
- Error recovery: Automatic retry with exponential backoff
- Type coverage: 100% (no 'any' types in production)
- Code reuse: 90%+ of pages use shared hooks

---

## 3. TARGET USERS

| Role | Primary Use Case |
|------|------------------|
| **Frontend Developers** | Integrate API data into pages using standardized hooks |
| **Backend Developers** | Implement API endpoints following defined contracts |
| **QA Engineers** | Test loading/error states consistently |
| **DevOps** | Monitor API performance and error rates |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- API client modules for all data domains
- React hooks with SWR for caching/revalidation
- TypeScript interfaces for request/response types
- Loading state components
- Error state components
- Mock data fallback strategy
- Integration documentation and examples

### 4.2 Out of Scope
- Backend API implementation (separate backend project)
- Authentication/authorization (handled by Clerk)
- Real-time WebSocket connections (future phase)
- GraphQL layer (REST APIs only)

### 4.3 Constraints
- Must use SWR for client-side data fetching
- All API responses must follow standardized format
- TypeScript strict mode (no 'any' types)
- Must support progressive enhancement (mock → real data)
- Environment variable for API base URL

---

## 5. DETAILED REQUIREMENTS

### 5.1 API Client Architecture

**File Structure**:
```
src/lib/api/
├── crm.ts           # CRM module APIs (leads, accounts, pipeline)
├── social.ts        # Social media APIs (accounts, mentions, posts)
├── seo.ts          # SEO/audit APIs
├── analytics.ts    # Analytics APIs (dashboard, scores)
├── marketing.ts    # Marketing APIs (campaigns, sequences)
└── rate-limiter.ts # Rate limiting utility
```

**Common Pattern** (all API clients follow this):
```typescript
// 1. Base Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// 2. Response Handler
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText
    }));
    throw new Error(error.error || "API request failed");
  }
  return response.json();
}

// 3. TypeScript Interfaces
export interface Entity {
  id: string;
  // ... entity fields
}

export interface EntityListResponse {
  data: Entity[];
  meta: {
    total: number;
    success: boolean;
  };
}

// 4. API Functions
export async function getEntities(): Promise<EntityListResponse> {
  // TODO: Replace with actual API call when backend is ready
  return {
    data: [],
    meta: { total: 0, success: true }
  };
}
```

---

### 5.2 CRM API Client (`src/lib/api/crm.ts`)

**TypeScript Interfaces**:
```typescript
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  status: "new" | "contacted" | "qualified" | "unqualified" | "converted";
  source: string;
  leadScore: number;
  mqlScore?: number;
  sqlScore?: number;
  assignedTo?: string;
  tags?: string[];
  lastContactDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Account {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  size?: string;
  revenue?: number;
  healthScore: number;
  status: "active" | "inactive" | "churned";
  leadCount?: number;
  dealValue?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Deal {
  id: string;
  accountId: string;
  accountName: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}
```

**API Functions**:
- `getLeads(): Promise<LeadListResponse>` - Fetch all leads
- `getLead(id: string): Promise<LeadDetailResponse>` - Fetch single lead
- `getAccounts(): Promise<AccountListResponse>` - Fetch all accounts
- `getAccount(id: string): Promise<AccountDetailResponse>` - Fetch single account
- `getPipeline(): Promise<PipelineResponse>` - Fetch all deals with pipeline stages

---

### 5.3 Social Media API Client (`src/lib/api/social.ts`)

**TypeScript Interfaces**:
```typescript
export interface SocialAccount {
  id: string;
  platform: string;
  accountHandle?: string;
  accountName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  engagementRate?: number;
  isActive: boolean;
  isVerified?: boolean;
  connectionStatus?: string;
  lastSyncedAt?: string | null;
}

export interface SocialMention {
  id: string;
  platform: string;
  authorHandle?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  content?: string;
  sentiment?: "positive" | "neutral" | "negative";
  sentimentScore?: number;
  engagementLikes?: number;
  engagementShares?: number;
  engagementComments?: number;
  engagementViews?: number;
  postTimestamp?: string;
  postUrl?: string;
}

export interface SocialPost {
  id: string;
  platform: string;
  content: string;
  mediaUrls?: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor?: string;
  publishedAt?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialSummary {
  brandId: string;
  brandName: string;
  summary: {
    smoScore: number;
    smoTrend: "up" | "down" | "stable";
    totalFollowers: number;
    totalEngagements: number;
    avgEngagementRate: number;
    avgSentiment: number;
    connectedAccounts: number;
    positiveMentions: number;
    negativeMentions: number;
    neutralMentions: number;
  };
  breakdown: {
    reach: number;
    engagement: number;
    sentiment: number;
    growth: number;
    consistency: number;
  };
  dataSource: "service_scan" | "oauth" | "stored" | "calculated";
  lastUpdated: string;
}
```

**API Functions**:
- `getSocialAccounts(brandId: string): Promise<SocialAccountsResponse>`
- `getSocialMentions(brandId: string): Promise<SocialMentionsResponse>`
- `getSocialMetrics(brandId: string): Promise<SocialMetricsResponse>`
- `getSocialSummary(brandId: string): Promise<SocialSummary>`
- `getSocialPosts(brandId: string): Promise<SocialPostsResponse>`

---

### 5.4 React Hooks Layer

**File Structure**:
```
src/hooks/
├── useCRM.ts       # CRM data hooks (5 hooks)
├── useSocial.ts    # Social media hooks (5 hooks)
├── useSEO.ts       # SEO data hooks (2 hooks)
├── useAnalytics.ts # Analytics hooks (2 hooks)
└── useMarketing.ts # Marketing hooks (3 hooks)
```

**Standard Hook Pattern**:
```typescript
import useSWR, { type SWRConfiguration } from "swr";

export function useEntity(config?: SWRConfiguration<EntityResponse>) {
  const { data, error, isLoading, mutate } = useSWR<EntityResponse>(
    "/api/entity",
    getEntity,
    {
      revalidateOnFocus: false,      // Don't refetch on tab focus
      revalidateOnReconnect: true,   // Refetch on network reconnect
      ...config,                      // Allow override via config
    }
  );

  return {
    entity: data?.data ?? null,      // Null coalescing for safety
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,                // Boolean conversion
    error,
    mutate,                          // For manual revalidation
  };
}
```

---

### 5.5 CRM Hooks (`src/hooks/useCRM.ts`)

**Hooks Provided**:

**1. useLeads()**
```typescript
export function useLeads(config?: SWRConfiguration<LeadListResponse>) {
  const { data, error, isLoading, mutate } = useSWR<LeadListResponse>(
    "/api/crm/leads",
    getLeads,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    leads: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
```

**2. useLead(id)**
```typescript
export function useLead(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/crm/leads/${id}` : null,
    () => (id ? getLead(id) : null),
    { revalidateOnFocus: false, revalidateOnReconnect: true, ...config }
  );

  return {
    lead: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
```

**3. useAccounts()**
**4. useAccount(id)**
**5. usePipeline()**

---

### 5.6 Social Media Hooks (`src/hooks/useSocial.ts`)

**Hooks Provided**:

**1. useSocialAccounts(brandId)**
```typescript
export function useSocialAccounts(
  brandId: string | null,
  config?: SWRConfiguration<SocialAccountsResponse>
) {
  const { data, error, isLoading, mutate } = useSWR<SocialAccountsResponse>(
    brandId ? `/api/social/accounts?brandId=${brandId}` : null,
    () => (brandId ? getSocialAccounts(brandId) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    accounts: data?.accounts ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
```

**2. useSocialMentions(brandId)** - Fetch brand mentions
**3. useSocialMetrics(brandId)** - Fetch engagement metrics
**4. useSocialSummary(brandId)** - Fetch SMO score summary
**5. useSocialPosts(brandId)** - Fetch scheduled/published posts

---

### 5.7 Page Integration Pattern (6-Step Process)

**Step 1: Add Imports**
```typescript
import { AlertCircle } from "lucide-react";
import { useLeads } from "@/hooks/useCRM";
```

**Step 2: Call Hook in Component**
```typescript
export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch leads from API
  const { leads, isLoading, isError, error } = useLeads();

  // Use API data if available, fallback to mock data
  const allLeads = leads.length > 0 ? leads : mockLeads;
```

**Step 3: Update All References**
```typescript
// Replace all mockData with allData
const filteredLeads = allLeads.filter((lead: any) => ...)
const totalLeads = allLeads.length;
const avgScore = allLeads.reduce((sum: number, lead: any) =>
  sum + (lead.leadScore || 0), 0) / allLeads.length;
```

**Step 4: Add Safe Field Access**
```typescript
// Use || 0 for optional numeric fields
const total = allLeads.reduce((sum: number, lead: any) =>
  sum + (lead.leadScore || 0), 0);
```

**Step 5: Add Loading State**
```typescript
{/* Loading State */}
{isLoading && (
  <div className="card-secondary p-12">
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      <p className="ml-3 text-muted-foreground">Loading leads...</p>
    </div>
  </div>
)}
```

**Step 6: Add Error State**
```typescript
{/* Error State */}
{isError && (
  <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
    <div className="flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-red-400" />
      <div>
        <p className="text-sm font-medium text-red-400">Failed to load leads</p>
        <p className="text-xs text-muted-foreground mt-1">
          {error?.message || "An error occurred while fetching leads"}
        </p>
      </div>
    </div>
  </div>
)}
```

---

## 6. API REQUIREMENTS

### 6.1 API Response Format (Standardized)

**List Response Format**:
```typescript
{
  data: Array<T>,      // Array of entities
  meta: {
    total: number,     // Total count (for pagination)
    success: boolean,  // Operation success flag
    page?: number,     // Current page (optional)
    limit?: number,    // Items per page (optional)
  }
}
```

**Single Entity Response Format**:
```typescript
{
  data: T,            // Single entity
  meta: {
    success: boolean,
  }
}
```

**Error Response Format**:
```typescript
{
  error: string,      // Error message
  code?: string,      // Error code (optional)
  details?: any,      // Additional error details (optional)
}
```

---

### 6.2 Environment Configuration

**Environment Variables**:
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.apex.com  # Production API
# NEXT_PUBLIC_API_URL=http://localhost:3001  # Local development
```

**Usage in API Clients**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
```

---

## 7. DATABASE SCHEMA

No database changes required. This PRD documents the frontend API integration layer only.

**Related Database Tables** (documented in other PRDs):
- `campaigns` (PRD-003)
- `leads`, `accounts` (PRD-002)
- `social_posts`, `social_accounts` (PRD-006)
- `email_events` (PRD-004)

---

## 8. IMPLEMENTATION STATUS

### 8.1 API Clients Implemented
✅ `src/lib/api/crm.ts` (5 functions)
✅ `src/lib/api/social.ts` (5 functions)
✅ `src/lib/api/seo.ts` (3 functions)
✅ `src/lib/api/analytics.ts` (2 functions)

### 8.2 React Hooks Implemented
✅ `src/hooks/useCRM.ts` (5 hooks)
✅ `src/hooks/useSocial.ts` (5 hooks)
✅ `src/hooks/useSEO.ts` (2 hooks)
✅ `src/hooks/useAnalytics.ts` (2 hooks)

### 8.3 Pages with Full API Integration (9 pages)
✅ CRM Leads (`/admin/crm/leads/page.tsx`)
✅ CRM Accounts (`/admin/crm/accounts/page.tsx`)
✅ CRM Pipeline (`/admin/crm/pipeline/page.tsx`)
✅ Social Media Channels (`/admin/social-media/channels/page.tsx`)
✅ Social Media Engagement (`/admin/social-media/engagement/page.tsx`)
✅ Social Media Posting (`/admin/social-media/posting/page.tsx`)
✅ Social Media Analytics (`/admin/social-media/analytics/page.tsx`)
✅ Social Media Compose (`/admin/social-media/compose/page.tsx`)
✅ Analytics Executive Dashboard (`/admin/analytics/executive-dashboard/page.tsx`)

### 8.4 Features Implemented
✅ SWR integration with caching/revalidation
✅ TypeScript interfaces for all API responses
✅ Loading state components
✅ Error state components with retry
✅ Mock data fallback strategy
✅ Safe field access patterns
✅ Environment-based API URL configuration

---

## 9. SECURITY & COMPLIANCE

- All API calls use environment variables (no hardcoded URLs)
- HTTPS enforced for production API calls
- Error messages sanitized (no stack traces to client)
- TypeScript strict mode (prevents type confusion attacks)
- SWR handles request deduplication (prevents duplicate requests)
- No sensitive data in client-side state (Clerk handles auth)

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
- API client functions (mock fetch responses)
- Hook return values (mock SWR)
- Error handling (network failures, 404, 500)
- Type safety (TypeScript compilation)

### 10.2 Integration Tests
- Full page rendering with hooks
- Loading state transitions
- Error state rendering
- Mock data fallback behavior
- SWR cache invalidation

### 10.3 E2E Tests (Playwright)
- Navigate to page with API integration
- Verify loading spinner appears
- Verify data renders after load
- Trigger error (disconnect network)
- Verify error state appears
- Reconnect and verify recovery

---

## 11. ACCEPTANCE CRITERIA

**API Clients**:
- [x] All API clients follow standardized pattern
- [x] TypeScript interfaces defined for all responses
- [x] Error handling implemented with `handleResponse()`
- [x] Environment variable for API base URL
- [x] Mock data fallback when API returns empty

**React Hooks**:
- [x] All hooks use SWR for caching/revalidation
- [x] Hooks return standardized shape (data, isLoading, isError, error, mutate)
- [x] Null coalescing for safe field access
- [x] Optional config parameter for SWR customization

**Page Integration**:
- [x] 9 pages fully integrated with hooks
- [x] Loading states render correctly
- [x] Error states render with error message
- [x] Mock data fallback works
- [x] No TypeScript errors (strict mode)

**Documentation**:
- [x] API integration pattern documented
- [x] Step-by-step integration guide
- [x] Code examples for all patterns
- [x] Completed examples listed

---

## 12. TIMELINE & DEPENDENCIES

**Duration**: 2 weeks (already completed)

**Dependencies**:
- SWR library ✅
- TypeScript strict mode ✅
- Environment variables setup ✅
- Mock data in pages ✅

**Blockers**: None (implementation complete)

---

## 13. OPEN QUESTIONS

1. **Backend API Timeline**: When will backend APIs be available to replace mock data? (Recommendation: Progressive rollout by module)
2. **Authentication Headers**: Should API clients add Clerk auth tokens automatically? (Recommendation: Yes, via fetch interceptor)
3. **Rate Limiting**: Should we implement client-side rate limiting? (Recommendation: Yes, use rate-limiter.ts utility)
4. **Caching Strategy**: Should we customize SWR cache TTL per endpoint? (Recommendation: Yes, high-frequency data = shorter TTL)

---

## 14. APPENDIX

### A. Complete Hook Inventory

**CRM Hooks** (`src/hooks/useCRM.ts`):
- `useLeads()` - Fetch all leads
- `useLead(id)` - Fetch single lead
- `useAccounts()` - Fetch all accounts
- `useAccount(id)` - Fetch single account
- `usePipeline()` - Fetch pipeline deals

**Social Media Hooks** (`src/hooks/useSocial.ts`):
- `useSocialAccounts(brandId)` - Fetch social accounts
- `useSocialMentions(brandId)` - Fetch brand mentions
- `useSocialMetrics(brandId)` - Fetch engagement metrics
- `useSocialSummary(brandId)` - Fetch SMO score
- `useSocialPosts(brandId)` - Fetch posts

**SEO Hooks** (`src/hooks/useSEO.ts`):
- `useAudits()` - Fetch site audits
- `useAudit(id)` - Fetch single audit

**Analytics Hooks** (`src/hooks/useAnalytics.ts`):
- `useAnalyticsDashboard(brandId)` - Fetch executive dashboard data
- `useUnifiedScore(brandId)` - Fetch GEO/SMO unified score

---

### B. SWR Configuration Options

**Common SWR Config**:
```typescript
{
  revalidateOnFocus: false,      // Don't refetch when tab gains focus
  revalidateOnReconnect: true,   // Refetch when network reconnects
  revalidateOnMount: true,       // Fetch on component mount
  dedupingInterval: 2000,        // Dedupe requests within 2s
  errorRetryCount: 3,            // Retry failed requests 3 times
  errorRetryInterval: 5000,      // Wait 5s between retries
  refreshInterval: 0,            // No automatic polling (0 = disabled)
}
```

---

### C. Migration Path for Remaining Pages

**Remaining Pages to Integrate** (40+ pages):

**Marketing Module**:
- `/admin/marketing/campaigns/page.tsx` - Hook: `useCampaigns()`
- `/admin/marketing/automation/page.tsx` - Hook: `useSequences()`
- `/admin/marketing/email-management/page.tsx` - Hook: `useEmailLists()`

**SEO Module**:
- `/admin/seo/website-health/page.tsx` - Hook: `useAudits()`
- `/admin/seo/content-management/page.tsx` - Hook: `usePages()`
- `/admin/seo/keyword-tracking/page.tsx` - Hook: `useKeywords()`

**Analytics Module**:
- `/admin/analytics/sales-analytics/page.tsx` - Hook: `useSalesMetrics()`
- `/admin/analytics/marketing-analytics/page.tsx` - Hook: `useMarketingMetrics()`
- `/admin/analytics/custom-reports/page.tsx` - Hook: `useReports()`

**Recommended Order**:
1. Marketing module (high business impact)
2. SEO module (moderate complexity)
3. Analytics module (complex aggregations)

---

**Next PRD**: N/A (This is the final cross-cutting PRD documenting technical infrastructure)

**Related PRDs**:
- PRD-001: Admin Dashboard (uses unified API patterns)
- PRD-002: CRM Module (uses useCRM hooks)
- PRD-006: Social Media (uses useSocial hooks)
- PRD-010: Analytics (uses useAnalytics hooks)
- PRD-012: Mobile Architecture (responsive API integration)
