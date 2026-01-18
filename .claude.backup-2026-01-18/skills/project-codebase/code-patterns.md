---
name: code-patterns
description: |
  Codebase code patterns and structure.
  USE WHEN implementing features to follow existing patterns.
---

# Code Patterns

This file contains actual code patterns extracted from the codebase.



## Components (Sample)

### default
**File**: `src/app/dashboard/audit/history/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/audit/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/audit/results/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/brands/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/competitive/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/create/brief/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/create/new/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/create/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/engine-room/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/feedback/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/layout.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/monitor/analytics/citations/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/monitor/analytics/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/monitor/mentions/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/monitor/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/monitor/prompts/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/monitor/settings/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/people/page.tsx`
**Type**: Server Component

### default
**File**: `src/app/dashboard/portfolios/page.tsx`
**Type**: Server Component


*Showing first 20 of 26 components*


## Custom Hooks

### useMentionAnalytics
**File**: `src/hooks/useAnalytics.ts`
**Params**: brandId, range, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").MentionAnalytics, Error>

### useAuditAnalytics
**File**: `src/hooks/useAnalytics.ts`
**Params**: brandId, range, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").AuditAnalytics, Error>

### useContentAnalytics
**File**: `src/hooks/useAnalytics.ts`
**Params**: brandId, range, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").ContentAnalytics, Error>

### useCompetitorAnalytics
**File**: `src/hooks/useAnalytics.ts`
**Params**: brandId, range, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").CompetitorAnalytics, Error>

### usePlatformAnalytics
**File**: `src/hooks/useAnalytics.ts`
**Params**: brandId, range, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").PlatformAnalytics, Error>

### useGEOScoreBreakdown
**File**: `src/hooks/useAnalytics.ts`
**Params**: brandId, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").GEOScoreBreakdown, Error>

### useRecommendationAnalytics
**File**: `src/hooks/useAnalytics.ts`
**Params**: brandId, range, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").RecommendationAnalytics, Error>

### useAllAnalytics
**File**: `src/hooks/useAnalytics.ts`
**Params**: brandId, range
**Returns**: { mentions: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").MentionAnalytics | undefined; audits: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").AuditAnalytics | undefined; content: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").ContentAnalytics | undefined; competitors: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").CompetitorAnalytics | undefined; platforms: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").PlatformAnalytics | undefined; geoScore: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").GEOScoreBreakdown | undefined; recommendations: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAnalytics").RecommendationAnalytics | undefined; isLoading: boolean; error: Error | null; }

### useOrganizationAnalytics
**File**: `src/hooks/useAnalytics.ts`
**Params**: range
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useExportAnalytics
**File**: `src/hooks/useAnalytics.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<{ available: boolean; }, Error>

### useScheduledReports
**File**: `src/hooks/useAnalytics.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useAudits
**File**: `src/hooks/useAudit.ts`
**Params**: filters, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAudit").AuditListResponse, Error>

### useAuditsByBrand
**File**: `src/hooks/useAudit.ts`
**Params**: brandId, filters
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAudit").AuditListResponse, Error>

### useAudit
**File**: `src/hooks/useAudit.ts`
**Params**: id, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAudit").Audit, Error>

### useAuditIssues
**File**: `src/hooks/useAudit.ts`
**Params**: auditId, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAudit").AuditIssue[], Error>

### useStartAudit
**File**: `src/hooks/useAudit.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAudit").Audit, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAudit").StartAuditInput, unknown>

### useCancelAudit
**File**: `src/hooks/useAudit.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, { previousAudit: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAudit").Audit | undefined; }>

### useRetryAudit
**File**: `src/hooks/useAudit.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useUpdateIssueStatus
**File**: `src/hooks/useAudit.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { auditId: string; issueId: string; status: "fixed" | "open" | "ignored"; }, { previousIssues: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useAudit").AuditIssue[] | undefined; }>

### useDeleteAudit
**File**: `src/hooks/useAudit.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, unknown>

### useExportAuditReport
**File**: `src/hooks/useAudit.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<Blob, Error, { auditId: string; format: "pdf" | "csv" | "json"; }, unknown>

### usePlans
**File**: `src/hooks/useBilling.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").Plan[], Error>

### useSubscription
**File**: `src/hooks/useBilling.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").Subscription | null, Error>

### useCurrentPlan
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: { plan: null; subscription: null; } | { plan: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").Plan | null; subscription: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").Subscription; }

### useCreateCheckoutSession
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { planId: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").PlanId; interval: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").BillingInterval; successUrl?: string | undefined; cancelUrl?: string | undefined; }, unknown>

### useChangePlan
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { planId: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").PlanId; interval?: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").BillingInterval | undefined; }, unknown>

### useCancelSubscription
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { immediate?: boolean | undefined; feedback?: string | undefined; }, { previousSubscription: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").Subscription | undefined; }>

### useResumeSubscription
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, void, unknown>

### useCreatePortalSession
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string | undefined, unknown>

### usePaymentMethods
**File**: `src/hooks/useBilling.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").PaymentMethod[], Error>

### useSetDefaultPaymentMethod
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useDeletePaymentMethod
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, unknown>

### useInvoices
**File**: `src/hooks/useBilling.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").Invoice[], Error>

### useDownloadInvoice
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, unknown>

### useUsageMetrics
**File**: `src/hooks/useBilling.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").UsageMetrics, Error>

### useUsageLimitCheck
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: { usage: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").UsageMetrics | undefined; isLimitReached: (metric: keyof import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").UsageMetrics) => boolean; getUsagePercentage: (metric: keyof import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").UsageMetrics) => number; isApproachingLimit: (metric: keyof import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").UsageMetrics, threshold?: number) => boolean; }

### useStartTrial
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useBilling").PlanId, unknown>

### useApplyPromoCode
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useValidatePromoCode
**File**: `src/hooks/useBilling.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useContentList
**File**: `src/hooks/useContent.ts`
**Params**: filters, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").ContentListResponse, Error>

### useContentByBrand
**File**: `src/hooks/useContent.ts`
**Params**: brandId, filters
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").ContentListResponse, Error>

### useContent
**File**: `src/hooks/useContent.ts`
**Params**: id, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").Content, Error>

### useContentTemplates
**File**: `src/hooks/useContent.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").ContentTemplate[], Error>

### useCreateContent
**File**: `src/hooks/useContent.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").Content, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").ContentCreateInput, unknown>

### useUpdateContent
**File**: `src/hooks/useContent.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").Content, Error, { id: string; data: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").ContentUpdateInput; }, { previousContent: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").Content | undefined; }>

### useDeleteContent
**File**: `src/hooks/useContent.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, { previousList: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").ContentListResponse | undefined; }>

### useGenerateContent
**File**: `src/hooks/useContent.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").Content, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").GenerateContentInput, unknown>

### usePublishContent
**File**: `src/hooks/useContent.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, { previousContent: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useContent").Content | undefined; }>

### useScheduleContent
**File**: `src/hooks/useContent.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { id: string; scheduledAt: string; }, unknown>

### useDuplicateContent
**File**: `src/hooks/useContent.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useAnalyzeContentSEO
**File**: `src/hooks/useContent.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useContentStats
**File**: `src/hooks/useContent.ts`
**Params**: brandId
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useDashboardMetrics
**File**: `src/hooks/useDashboard.ts`
**Params**: brandId, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useDashboard").DashboardMetrics, Error>

### useGEOScore
**File**: `src/hooks/useDashboard.ts`
**Params**: brandId, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useDashboard").GEOScoreDetails, Error>

### useUnifiedScore
**File**: `src/hooks/useDashboard.ts`
**Params**: brandId, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useDashboard").UnifiedScoreResponse, Error>

### useRecentActivity
**File**: `src/hooks/useDashboard.ts`
**Params**: brandId, limit
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### usePlatformAnalytics
**File**: `src/hooks/useDashboard.ts`
**Params**: brandId
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useTrends
**File**: `src/hooks/useDashboard.ts`
**Params**: brandId, range
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useHealthStatus
**File**: `src/hooks/useDashboard.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useGamificationProgress
**File**: `src/hooks/useDashboard.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useAchievements
**File**: `src/hooks/useDashboard.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useExportCSV
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob, Error, { dataType: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportDataType; brandId?: string | undefined; dateRange?: { start: string; end: string; } | undefined; filters?: Record<string, unknown> | undefined; columns?: string[] | undefined; }, unknown>

### useExportMentionsCSV
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob, Error, { brandId: string; dateRange?: { start: string; end: string; } | undefined; platforms?: string[] | undefined; sentiment?: string[] | undefined; }, unknown>

### useExportRecommendationsCSV
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob, Error, { brandId: string; status?: string[] | undefined; priority?: string[] | undefined; }, unknown>

### useExportAuditCSV
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob, Error, { auditId?: string | undefined; brandId: string; includeIssues?: boolean | undefined; }, unknown>

### useExportPDF
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob, Error, { dataType: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportDataType; brandId?: string | undefined; dateRange?: { start: string; end: string; } | undefined; template?: string | undefined; includeCharts?: boolean | undefined; }, unknown>

### useGenerateAuditReport
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob, Error, { auditId: string; brandId: string; template?: "executive" | "comprehensive" | "technical" | undefined; }, unknown>

### useGenerateAnalyticsReport
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob, Error, { brandId: string; dateRange: { start: string; end: string; }; sections?: string[] | undefined; }, unknown>

### useGenerateCompetitorReport
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob, Error, { brandId: string; competitorIds: string[]; }, unknown>

### useExportJobStatus
**File**: `src/hooks/useExport.ts`
**Params**: jobId
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob, Error>

### useDownloadExport
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ success: boolean; filename: string; }, Error, string, unknown>

### useExportHistory
**File**: `src/hooks/useExport.ts`
**Params**: limit
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportHistoryItem[], Error>

### useDeleteExport
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, unknown>

### useReportTemplates
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ReportTemplate[], Error>

### useCreateReportTemplate
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, Omit<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ReportTemplate, "id">, unknown>

### useExportXLSX
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob, Error, { dataType: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportDataType; brandId?: string | undefined; dateRange?: { start: string; end: string; } | undefined; filters?: Record<string, unknown> | undefined; sheets?: string[] | undefined; }, unknown>

### useScheduledReports
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ScheduledReport[], Error>

### useCreateScheduledReport
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, Omit<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ScheduledReport, "id" | "lastSentAt" | "nextSendAt">, unknown>

### useUpdateScheduledReport
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, Partial<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ScheduledReport> & { id: string; }, unknown>

### useDeleteScheduledReport
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, unknown>

### useQuickExport
**File**: `src/hooks/useExport.ts`
**Params**: none
**Returns**: { exportAndDownload: (options: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportOptions, onProgress?: ((status: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportStatus) => void) | undefined) => Promise<{ success: boolean; job: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useExport").ExportJob; }>; isLoading: boolean; }

### useGamificationProfile
**File**: `src/hooks/useGamification.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").GamificationProfile, Error>

### useUserLevel
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").UserLevel | undefined

### useXPHistory
**File**: `src/hooks/useGamification.ts`
**Params**: limit
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").XPTransaction[], Error>

### useAchievements
**File**: `src/hooks/useGamification.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Achievement[], Error>

### useAchievementsByCategory
**File**: `src/hooks/useGamification.ts`
**Params**: category
**Returns**: { achievements: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Achievement[]; earned: number; total: number; }

### useRecentAchievements
**File**: `src/hooks/useGamification.ts`
**Params**: limit
**Returns**: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Achievement[]

### useAchievementsInProgress
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Achievement[]

### useClaimAchievement
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useStreaks
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Streak[], Error>

### useCheckInStreak
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, void, unknown>

### useLeaderboard
**File**: `src/hooks/useGamification.ts`
**Params**: timeframe, limit
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<{ isCurrentUser: boolean; rank: number; userId: string; userName: string; userAvatar?: string | undefined; level: number; totalXP: number; achievements: number; }[], Error>

### useUserRank
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<{ rank: any; percentile: any; change: number; }, Error>

### useChallenges
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Challenge[], Error>

### useDailyChallenges
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Challenge[]

### useWeeklyChallenges
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Challenge[]

### useClaimChallengeReward
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ success: boolean; message: string; }, Error, string, unknown>

### useBadges
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Badge[], Error>

### useSetDisplayedBadge
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ success: boolean; message: string; }, Error, string, unknown>

### useAwardXP
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ newXP: any; levelUp: any; newLevel: any; achievementsUnlocked: any; }, Error, { amount: number; reason: string; source: string; metadata?: Record<string, unknown> | undefined; }, unknown>

### useGamificationDashboard
**File**: `src/hooks/useGamification.ts`
**Params**: none
**Returns**: { profile: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").GamificationProfile | undefined; achievements: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Achievement[] | undefined; streaks: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Streak[] | undefined; leaderboard: { isCurrentUser: boolean; rank: number; userId: string; userName: string; userAvatar?: string | undefined; level: number; totalXP: number; achievements: number; }[] | undefined; challenges: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useGamification").Challenge[] | undefined; isLoading: boolean; error: Error | null; refetch: () => void; }

### useIntegrations
**File**: `src/hooks/useIntegrations.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").Integration[], Error>

### useIntegration
**File**: `src/hooks/useIntegrations.ts`
**Params**: type, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").Integration, Error>

### useConnectIntegration
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { type: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").IntegrationType; redirectUrl?: string | undefined; }, unknown>

### useCompleteOAuthCallback
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { type: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").IntegrationType; code: string; state?: string | undefined; }, unknown>

### useDisconnectIntegration
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").IntegrationType, { previousIntegrations: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").Integration[] | undefined; }>

### useUpdateIntegrationConfig
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { type: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").IntegrationType; config: Record<string, unknown>; }, unknown>

### useTestIntegration
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").IntegrationType, unknown>

### useRefreshIntegrationToken
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").IntegrationType, unknown>

### useJiraProjects
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useExportToJira
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { recommendationId: string; config?: Partial<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").JiraConfig> | undefined; }, unknown>

### useBulkExportToJira
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { recommendationIds: string[]; config?: Partial<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").JiraConfig> | undefined; }, unknown>

### useSyncJiraStatus
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useSlackChannels
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useSendToSlack
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { channelId: string; message?: string | undefined; blocks?: unknown[] | undefined; attachments?: unknown[] | undefined; }, unknown>

### useSendRecommendationToSlack
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { recommendationId: string; channelId: string; }, unknown>

### useSendAuditToSlack
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { auditId: string; channelId: string; }, unknown>

### useSendMentionToSlack
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { mentionId: string; channelId: string; }, unknown>

### useUpdateSlackConfig
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, Partial<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").SlackConfig>, unknown>

### useCreateWebhook
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useIntegrations").WebhookConfig, unknown>

### useTestWebhook
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useDeleteWebhook
**File**: `src/hooks/useIntegrations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, unknown>

### useJobs
**File**: `src/hooks/useJobs.ts`
**Params**: filter
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useJobs").JobsResponse, Error>

### useJobStats
**File**: `src/hooks/useJobs.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useJobs").JobStats, Error>

### useRetryJob
**File**: `src/hooks/useJobs.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ success: boolean; message: string; }, Error, { jobId: string; queueName?: string | undefined; }, unknown>

### usePauseJob
**File**: `src/hooks/useJobs.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ success: boolean; message: string; }, Error, { jobId: string; queueName?: string | undefined; }, unknown>

### useResumeJob
**File**: `src/hooks/useJobs.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ success: boolean; message: string; }, Error, { jobId: string; queueName?: string | undefined; }, unknown>

### useCancelJob
**File**: `src/hooks/useJobs.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ success: boolean; message: string; }, Error, { jobId: string; queueName?: string | undefined; }, unknown>

### useQueueJobs
**File**: `src/hooks/useJobs.ts`
**Params**: queueName, filter
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useJobs").JobsResponse, Error>

### useRefreshJobs
**File**: `src/hooks/useJobs.ts`
**Params**: none
**Returns**: () => void

### usePlatforms
**File**: `src/hooks/useMonitor.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").Platform[], Error>

### useUpdatePlatform
**File**: `src/hooks/useMonitor.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").Platform, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").PlatformConfig, { previousPlatforms: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").Platform[] | undefined; }>

### useTogglePlatform
**File**: `src/hooks/useMonitor.ts`
**Params**: none
**Returns**: (platformId: string, enabled: boolean) => Promise<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").Platform>

### useBrandConfig
**File**: `src/hooks/useMonitor.ts`
**Params**: brandId, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").BrandConfig, Error>

### useSaveBrandConfig
**File**: `src/hooks/useMonitor.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").BrandConfig, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").BrandConfig, { previousConfig: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").BrandConfig | undefined; brandId: string; } | { previousConfig?: undefined; brandId?: undefined; }>

### useUpdateBrandKeywords
**File**: `src/hooks/useMonitor.ts`
**Params**: brandId
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string[], unknown>

### useUpdateBrandCompetitors
**File**: `src/hooks/useMonitor.ts`
**Params**: brandId
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string[], unknown>

### useMentions
**File**: `src/hooks/useMonitor.ts`
**Params**: filters, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").MentionListResponse, Error>

### useMention
**File**: `src/hooks/useMonitor.ts`
**Params**: id, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").Mention, Error>

### useMentionsByBrand
**File**: `src/hooks/useMonitor.ts`
**Params**: brandId, filters
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").MentionListResponse, Error>

### useUpdateMentionStatus
**File**: `src/hooks/useMonitor.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { id: string; status: "new" | "reviewed" | "actioned" | "archived"; }, { previousMention: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").Mention | undefined; }>

### useBulkUpdateMentions
**File**: `src/hooks/useMonitor.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { ids: string[]; updates: Partial<Pick<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useMonitor").Mention, "status" | "sentiment" | "tags">>; }, unknown>

### useRefreshMentions
**File**: `src/hooks/useMonitor.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useMentionAnalytics
**File**: `src/hooks/useMonitor.ts`
**Params**: brandId, range
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useNotifications
**File**: `src/hooks/useNotifications.ts`
**Params**: filters, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useNotifications").NotificationListResponse, Error>

### useUnreadNotificationCount
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<number, Error>

### useNotification
**File**: `src/hooks/useNotifications.ts`
**Params**: id, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useNotifications").Notification, Error>

### useMarkAsRead
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, { previousNotification: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useNotifications").Notification | undefined; }>

### useMarkAllAsRead
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, void, void>

### useArchiveNotification
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, { previousLists: [readonly unknown[], unknown][]; }>

### useDeleteNotification
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, unknown>

### useBulkArchiveNotifications
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string[], unknown>

### useClearAllNotifications
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, void, unknown>

### useNotificationPreferences
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useNotifications").NotificationPreferences, Error>

### useUpdateNotificationPreferences
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, Partial<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useNotifications").NotificationPreferences>, unknown>

### useNotificationSubscription
**File**: `src/hooks/useNotifications.ts`
**Params**: onNotification
**Returns**: void

### useRequestPushPermission
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ permission: string; subscription: PushSubscription; } | { permission: "default" | "denied"; subscription?: undefined; }, Error, void, unknown>

### useNotificationBell
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: { unreadCount: number; recentNotifications: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useNotifications").Notification[]; markAsRead: (id: string) => void; markAllAsRead: () => void; isMarkingAsRead: boolean; isMarkingAllAsRead: boolean; }

### useNotificationToast
**File**: `src/hooks/useNotifications.ts`
**Params**: none
**Returns**: { showNotification: (notification: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useNotifications").Notification) => void; }

### useOnboardingStatus
**File**: `src/hooks/useOnboarding.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error>

### useUpdateOnboardingStatus
**File**: `src/hooks/useOnboarding.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>

### useMarkBrandAdded
**File**: `src/hooks/useOnboarding.ts`
**Params**: none
**Returns**: { data: undefined; variables: undefined; error: null; isError: false; isIdle: true; isPending: false; isSuccess: false; status: "idle"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markBrandAdded: () => void; } | { data: undefined; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; error: null; isError: false; isIdle: false; isPending: true; isSuccess: false; status: "pending"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markBrandAdded: () => void; } | { data: undefined; error: Error; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; isError: true; isIdle: false; isPending: false; isSuccess: false; status: "error"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markBrandAdded: () => void; } | { data: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse; error: null; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; isError: false; isIdle: false; isPending: false; isSuccess: true; status: "success"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markBrandAdded: () => void; }

### useMarkMonitoringConfigured
**File**: `src/hooks/useOnboarding.ts`
**Params**: none
**Returns**: { data: undefined; variables: undefined; error: null; isError: false; isIdle: true; isPending: false; isSuccess: false; status: "idle"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markMonitoringConfigured: () => void; } | { data: undefined; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; error: null; isError: false; isIdle: false; isPending: true; isSuccess: false; status: "pending"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markMonitoringConfigured: () => void; } | { data: undefined; error: Error; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; isError: true; isIdle: false; isPending: false; isSuccess: false; status: "error"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markMonitoringConfigured: () => void; } | { data: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse; error: null; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; isError: false; isIdle: false; isPending: false; isSuccess: true; status: "success"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markMonitoringConfigured: () => void; }

### useMarkAuditRun
**File**: `src/hooks/useOnboarding.ts`
**Params**: none
**Returns**: { data: undefined; variables: undefined; error: null; isError: false; isIdle: true; isPending: false; isSuccess: false; status: "idle"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markAuditRun: () => void; } | { data: undefined; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; error: null; isError: false; isIdle: false; isPending: true; isSuccess: false; status: "pending"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markAuditRun: () => void; } | { data: undefined; error: Error; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; isError: true; isIdle: false; isPending: false; isSuccess: false; status: "error"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markAuditRun: () => void; } | { data: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse; error: null; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; isError: false; isIdle: false; isPending: false; isSuccess: true; status: "success"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markAuditRun: () => void; }

### useMarkRecommendationsReviewed
**File**: `src/hooks/useOnboarding.ts`
**Params**: none
**Returns**: { data: undefined; variables: undefined; error: null; isError: false; isIdle: true; isPending: false; isSuccess: false; status: "idle"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markRecommendationsReviewed: () => void; } | { data: undefined; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; error: null; isError: false; isIdle: false; isPending: true; isSuccess: false; status: "pending"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markRecommendationsReviewed: () => void; } | { data: undefined; error: Error; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; isError: true; isIdle: false; isPending: false; isSuccess: false; status: "error"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markRecommendationsReviewed: () => void; } | { data: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse; error: null; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; isError: false; isIdle: false; isPending: false; isSuccess: true; status: "success"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; markRecommendationsReviewed: () => void; }

### useDismissOnboarding
**File**: `src/hooks/useOnboarding.ts`
**Params**: none
**Returns**: { data: undefined; variables: undefined; error: null; isError: false; isIdle: true; isPending: false; isSuccess: false; status: "idle"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; dismissOnboarding: () => void; } | { data: undefined; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; error: null; isError: false; isIdle: false; isPending: true; isSuccess: false; status: "pending"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; dismissOnboarding: () => void; } | { data: undefined; error: Error; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; isError: true; isIdle: false; isPending: false; isSuccess: false; status: "error"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; dismissOnboarding: () => void; } | { data: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse; error: null; variables: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams; isError: false; isIdle: false; isPending: false; isSuccess: true; status: "success"; reset: () => void; context: unknown; failureCount: number; failureReason: Error | null; isPaused: boolean; submittedAt: number; mutateAsync: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutateAsyncFunction<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").OnboardingStatusResponse, Error, import("C:/Jarvis/AI Workspace/Apex/src/hooks/useOnboarding").UpdateOnboardingStatusParams, unknown>; dismissOnboarding: () => void; }

### useOnboardingProgress
**File**: `src/hooks/useOnboarding.ts`
**Params**: none
**Returns**: { progress: number; completedSteps: number; totalSteps: number; isComplete: boolean; status?: undefined; } | { progress: number; completedSteps: number; totalSteps: number; isComplete: boolean; status: import("C:/Jarvis/AI Workspace/Apex/src/lib/db/schema/organizations").OnboardingStatus; }

### useRecommendations
**File**: `src/hooks/useRecommendations.ts`
**Params**: filters, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse, Error>

### useRecommendationsByBrand
**File**: `src/hooks/useRecommendations.ts`
**Params**: brandId, filters
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse, Error>

### useRecommendationsByAudit
**File**: `src/hooks/useRecommendations.ts`
**Params**: auditId, filters
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse, Error>

### useRecommendation
**File**: `src/hooks/useRecommendations.ts`
**Params**: id, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").Recommendation, Error>

### useRecommendationsKanban
**File**: `src/hooks/useRecommendations.ts`
**Params**: brandId
**Returns**: { data: { columns: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").KanbanColumn[]; total: number; stats: { byCategory: Record<string, number>; byPriority: Record<string, number>; byStatus: Record<string, number>; } | undefined; }; error: Error; isError: true; isPending: false; isLoading: false; isLoadingError: false; isRefetchError: true; isSuccess: false; isPlaceholderData: false; status: "error"; dataUpdatedAt: number; errorUpdatedAt: number; failureCount: number; failureReason: Error | null; errorUpdateCount: number; isFetched: boolean; isFetchedAfterMount: boolean; isFetching: boolean; isInitialLoading: boolean; isPaused: boolean; isRefetching: boolean; isStale: boolean; isEnabled: boolean; refetch: (options?: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aq | undefined) => Promise<import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aH<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse, Error>>; fetchStatus: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").ay; promise: Promise<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse>; } | { data: { columns: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").KanbanColumn[]; total: number; stats: { byCategory: Record<string, number>; byPriority: Record<string, number>; byStatus: Record<string, number>; } | undefined; }; error: null; isError: false; isPending: false; isLoading: false; isLoadingError: false; isRefetchError: false; isSuccess: true; isPlaceholderData: false; status: "success"; dataUpdatedAt: number; errorUpdatedAt: number; failureCount: number; failureReason: Error | null; errorUpdateCount: number; isFetched: boolean; isFetchedAfterMount: boolean; isFetching: boolean; isInitialLoading: boolean; isPaused: boolean; isRefetching: boolean; isStale: boolean; isEnabled: boolean; refetch: (options?: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aq | undefined) => Promise<import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aH<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse, Error>>; fetchStatus: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").ay; promise: Promise<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse>; } | { data: { columns: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").KanbanColumn[]; total: number; stats: { byCategory: Record<string, number>; byPriority: Record<string, number>; byStatus: Record<string, number>; } | undefined; }; error: Error; isError: true; isPending: false; isLoading: false; isLoadingError: true; isRefetchError: false; isSuccess: false; isPlaceholderData: false; status: "error"; dataUpdatedAt: number; errorUpdatedAt: number; failureCount: number; failureReason: Error | null; errorUpdateCount: number; isFetched: boolean; isFetchedAfterMount: boolean; isFetching: boolean; isInitialLoading: boolean; isPaused: boolean; isRefetching: boolean; isStale: boolean; isEnabled: boolean; refetch: (options?: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aq | undefined) => Promise<import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aH<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse, Error>>; fetchStatus: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").ay; promise: Promise<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse>; } | { data: { columns: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").KanbanColumn[]; total: number; stats: { byCategory: Record<string, number>; byPriority: Record<string, number>; byStatus: Record<string, number>; } | undefined; }; error: null; isError: false; isPending: true; isLoading: true; isLoadingError: false; isRefetchError: false; isSuccess: false; isPlaceholderData: false; status: "pending"; dataUpdatedAt: number; errorUpdatedAt: number; failureCount: number; failureReason: Error | null; errorUpdateCount: number; isFetched: boolean; isFetchedAfterMount: boolean; isFetching: boolean; isInitialLoading: boolean; isPaused: boolean; isRefetching: boolean; isStale: boolean; isEnabled: boolean; refetch: (options?: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aq | undefined) => Promise<import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aH<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse, Error>>; fetchStatus: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").ay; promise: Promise<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse>; } | { data: { columns: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").KanbanColumn[]; total: number; stats: { byCategory: Record<string, number>; byPriority: Record<string, number>; byStatus: Record<string, number>; } | undefined; }; error: null; isError: false; isPending: true; isLoadingError: false; isRefetchError: false; isSuccess: false; isPlaceholderData: false; status: "pending"; dataUpdatedAt: number; errorUpdatedAt: number; failureCount: number; failureReason: Error | null; errorUpdateCount: number; isFetched: boolean; isFetchedAfterMount: boolean; isFetching: boolean; isLoading: boolean; isInitialLoading: boolean; isPaused: boolean; isRefetching: boolean; isStale: boolean; isEnabled: boolean; refetch: (options?: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aq | undefined) => Promise<import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aH<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse, Error>>; fetchStatus: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").ay; promise: Promise<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse>; } | { data: { columns: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").KanbanColumn[]; total: number; stats: { byCategory: Record<string, number>; byPriority: Record<string, number>; byStatus: Record<string, number>; } | undefined; }; isError: false; error: null; isPending: false; isLoading: false; isLoadingError: false; isRefetchError: false; isSuccess: true; isPlaceholderData: true; status: "success"; dataUpdatedAt: number; errorUpdatedAt: number; failureCount: number; failureReason: Error | null; errorUpdateCount: number; isFetched: boolean; isFetchedAfterMount: boolean; isFetching: boolean; isInitialLoading: boolean; isPaused: boolean; isRefetching: boolean; isStale: boolean; isEnabled: boolean; refetch: (options?: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aq | undefined) => Promise<import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").aH<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse, Error>>; fetchStatus: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/query-core/build/modern/hydration-DksKBgQq").ay; promise: Promise<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationListResponse>; }

### useUpdateRecommendationStatus
**File**: `src/hooks/useRecommendations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { id: string; status: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationStatus; }, { previousRecommendation: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").Recommendation | undefined; }>

### useUpdateRecommendation
**File**: `src/hooks/useRecommendations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").Recommendation, Error, { id: string; data: Partial<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").Recommendation>; }, { previousRecommendation: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").Recommendation | undefined; }>

### useCompleteRecommendation
**File**: `src/hooks/useRecommendations.ts`
**Params**: none
**Returns**: (id: string) => Promise<any>

### useDismissRecommendation
**File**: `src/hooks/useRecommendations.ts`
**Params**: none
**Returns**: (id: string) => Promise<any>

### useAssignRecommendation
**File**: `src/hooks/useRecommendations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { id: string; assigneeId: string | null; }, unknown>

### useSetRecommendationDueDate
**File**: `src/hooks/useRecommendations.ts`
**Params**: none
**Returns**: (id: string, dueDate: string | null) => Promise<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").Recommendation>

### useMoveRecommendation
**File**: `src/hooks/useRecommendations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { id: string; status: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationStatus; order: number; }, { previousLists: [readonly unknown[], unknown][]; }>

### useReorderRecommendations
**File**: `src/hooks/useRecommendations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { status: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").RecommendationStatus; orderedIds: string[]; }, unknown>

### useBulkUpdateRecommendations
**File**: `src/hooks/useRecommendations.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { ids: string[]; updates: Partial<Pick<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useRecommendations").Recommendation, "status" | "priority" | "assigneeId">>; }, unknown>

### useRecommendationStats
**File**: `src/hooks/useRecommendations.ts`
**Params**: brandId
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useRecommendationProgress
**File**: `src/hooks/useRecommendations.ts`
**Params**: brandId
**Returns**: { total: number; completed: number; inProgress: number; pending: number; completionRate: number; }

### useOrganizationSettings
**File**: `src/hooks/useSettings.ts`
**Params**: orgId, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").OrganizationSettings, Error>

### useUpdateOrganizationSettings
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").OrganizationSettings, Error, Partial<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").OrganizationSettings>, { previousSettings: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").OrganizationSettings | undefined; }>

### useUploadLogo
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, File, unknown>

### useTeamMembers
**File**: `src/hooks/useSettings.ts`
**Params**: orgId, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").TeamMember[], Error>

### useInviteTeamMember
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { email: string; role: "admin" | "member" | "owner" | "viewer"; }, unknown>

### useUpdateTeamMemberRole
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { memberId: string; role: "admin" | "member" | "owner" | "viewer"; }, { previousMembers: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").TeamMember[] | undefined; }>

### useRemoveTeamMember
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, { previousMembers: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").TeamMember[] | undefined; }>

### useResendInvite
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, unknown>

### useCancelInvite
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, unknown>

### useAPIKeys
**File**: `src/hooks/useSettings.ts`
**Params**: orgId, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").APIKey[], Error>

### useCreateAPIKey
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").APIKeyCreateResponse, Error, { name: string; permissions: string[]; expiresIn?: string | undefined; }, unknown>

### useRevokeAPIKey
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<void, Error, string, { previousKeys: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").APIKey[] | undefined; }>

### useRegenerateAPIKey
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useSettings").APIKeyCreateResponse, Error, string, unknown>

### useUpdateAPIKeyName
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { keyId: string; name: string; }, unknown>

### useUserPreferences
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useUpdateUserPreferences
**File**: `src/hooks/useSettings.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, Record<string, unknown>, unknown>

### useUsageSummary
**File**: `src/hooks/useUsage.ts`
**Params**: period, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageSummary, Error>

### useUsageMetric
**File**: `src/hooks/useUsage.ts`
**Params**: metricType, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageMetric, Error>

### useUsageBreakdown
**File**: `src/hooks/useUsage.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageBreakdown, Error>

### useUsageHistory
**File**: `src/hooks/useUsage.ts`
**Params**: period, options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageHistory, Error>

### useUsageQuotas
**File**: `src/hooks/useUsage.ts`
**Params**: options
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageQuota[], Error>

### useUsageAlerts
**File**: `src/hooks/useUsage.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageAlert[], Error>

### useAcknowledgeUsageAlert
**File**: `src/hooks/useUsage.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, string, { previousAlerts: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageAlert[] | undefined; }>

### useSetUsageAlertThreshold
**File**: `src/hooks/useUsage.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { metric: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageMetricType; threshold: number; enabled: boolean; }, unknown>

### useUsageLimitCheck
**File**: `src/hooks/useUsage.ts`
**Params**: metric
**Returns**: { isAtLimit: boolean; isNearLimit: boolean; percentage: number; remaining: number; current?: undefined; limit?: undefined; } | { isAtLimit: boolean; isNearLimit: boolean; percentage: number; remaining: number; current: number; limit: number; }

### usePurchaseAdditionalUsage
**File**: `src/hooks/useUsage.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { metric: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageMetricType; quantity: number; }, unknown>

### useTrackUsage
**File**: `src/hooks/useUsage.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<any, Error, { metric: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageMetricType; amount?: number | undefined; metadata?: Record<string, unknown> | undefined; }, unknown>

### useRealtimeUsage
**File**: `src/hooks/useUsage.ts`
**Params**: none
**Returns**: import("C:/Jarvis/AI Workspace/Apex/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<any, Error>

### useUsageDashboard
**File**: `src/hooks/useUsage.ts`
**Params**: period
**Returns**: { summary: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageSummary | undefined; breakdown: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageBreakdown | undefined; history: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageHistory | undefined; quotas: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageQuota[] | undefined; alerts: import("C:/Jarvis/AI Workspace/Apex/src/hooks/useUsage").UsageAlert[] | undefined; isLoading: boolean; error: Error | null; refetch: () => void; }




---

**Auto-generated by PAI Knowledge Extractor**
