/**
 * Analytics Hooks (F167)
 * Wire Analytics Charts to real data APIs
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/client";
import { useOrganizationId } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export type TimeRange = "7d" | "14d" | "30d" | "90d" | "1y" | "all";
export type ChartGranularity = "hour" | "day" | "week" | "month";

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface MentionAnalytics {
  total: number;
  change: number;
  trend: "up" | "down" | "stable";
  byPlatform: Array<{
    platform: string;
    count: number;
    change: number;
  }>;
  bySentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  timeSeries: TimeSeriesDataPoint[];
}

export interface AuditAnalytics {
  total: number;
  averageScore: number;
  scoreChange: number;
  scoreTimeSeries: TimeSeriesDataPoint[];
  byCategory: Array<{
    category: string;
    avgScore: number;
    issuesCount: number;
  }>;
  criticalIssues: number;
  issuesTrend: TimeSeriesDataPoint[];
}

export interface ContentAnalytics {
  total: number;
  published: number;
  draft: number;
  byType: Array<{
    type: string;
    count: number;
  }>;
  aiGenerated: number;
  timeSeries: TimeSeriesDataPoint[];
  topPerforming: Array<{
    id: string;
    title: string;
    seoScore: number;
    views?: number;
  }>;
}

export interface CompetitorAnalytics {
  competitors: Array<{
    name: string;
    geoScore: number;
    scoreChange: number;
    mentions: number;
    sentiment: number;
  }>;
  comparison: {
    geoScore: { you: number; avgCompetitor: number };
    mentions: { you: number; avgCompetitor: number };
    sentiment: { you: number; avgCompetitor: number };
  };
  timeSeries: Array<{
    date: string;
    you: number;
    competitors: Record<string, number>;
  }>;
}

export interface PlatformAnalytics {
  platforms: Array<{
    name: string;
    slug: string;
    mentions: number;
    sentiment: number;
    change: number;
    trend: "up" | "down" | "stable";
  }>;
  timeSeries: Array<{
    date: string;
    data: Record<string, number>;
  }>;
}

export interface GEOScoreBreakdown {
  overall: number;
  components: Array<{
    name: string;
    score: number;
    weight: number;
    items: Array<{
      name: string;
      score: number;
      status: "good" | "warning" | "error";
      recommendation?: string;
    }>;
  }>;
  history: TimeSeriesDataPoint[];
  benchmarks: {
    industry: number;
    top10: number;
  };
}

export interface RecommendationAnalytics {
  total: number;
  completed: number;
  completionRate: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  impactScore: number;
  estimatedImpact: {
    geoScoreGain: number;
    issuesResolved: number;
  };
  completionTrend: TimeSeriesDataPoint[];
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchMentionAnalytics(
  brandId: string,
  range: TimeRange
): Promise<MentionAnalytics> {
  const response = await fetch(
    `/api/analytics/mentions?brandId=${brandId}&range=${range}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch mention analytics");
  }
  return response.json();
}

async function fetchAuditAnalytics(
  brandId: string,
  range: TimeRange
): Promise<AuditAnalytics> {
  const response = await fetch(
    `/api/analytics/audits?brandId=${brandId}&range=${range}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch audit analytics");
  }
  return response.json();
}

async function fetchContentAnalytics(
  brandId: string,
  range: TimeRange
): Promise<ContentAnalytics> {
  const response = await fetch(
    `/api/analytics/content?brandId=${brandId}&range=${range}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch content analytics");
  }
  return response.json();
}

async function fetchCompetitorAnalytics(
  brandId: string,
  range: TimeRange
): Promise<CompetitorAnalytics> {
  const response = await fetch(
    `/api/analytics/competitors?brandId=${brandId}&range=${range}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch competitor analytics");
  }
  return response.json();
}

async function fetchPlatformAnalytics(
  brandId: string,
  range: TimeRange
): Promise<PlatformAnalytics> {
  const response = await fetch(
    `/api/analytics/platforms?brandId=${brandId}&range=${range}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch platform analytics");
  }
  return response.json();
}

async function fetchGEOScoreBreakdown(brandId: string): Promise<GEOScoreBreakdown> {
  const response = await fetch(`/api/analytics/geo-score?brandId=${brandId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch GEO score breakdown");
  }
  return response.json();
}

async function fetchRecommendationAnalytics(
  brandId: string,
  range: TimeRange
): Promise<RecommendationAnalytics> {
  const response = await fetch(
    `/api/analytics/recommendations?brandId=${brandId}&range=${range}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch recommendation analytics");
  }
  return response.json();
}

// =============================================================================
// Analytics Hooks
// =============================================================================

/**
 * Hook to fetch mention analytics
 */
export function useMentionAnalytics(
  brandId: string,
  range: TimeRange = "30d",
  options?: Omit<UseQueryOptions<MentionAnalytics>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.mentions.analytics(brandId, range),
    queryFn: () => fetchMentionAnalytics(brandId, range),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch audit analytics
 */
export function useAuditAnalytics(
  brandId: string,
  range: TimeRange = "30d",
  options?: Omit<UseQueryOptions<AuditAnalytics>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["analytics", "audits", brandId, range],
    queryFn: () => fetchAuditAnalytics(brandId, range),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook to fetch content analytics
 */
export function useContentAnalytics(
  brandId: string,
  range: TimeRange = "30d",
  options?: Omit<UseQueryOptions<ContentAnalytics>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["analytics", "content", brandId, range],
    queryFn: () => fetchContentAnalytics(brandId, range),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook to fetch competitor analytics
 */
export function useCompetitorAnalytics(
  brandId: string,
  range: TimeRange = "30d",
  options?: Omit<UseQueryOptions<CompetitorAnalytics>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["analytics", "competitors", brandId, range],
    queryFn: () => fetchCompetitorAnalytics(brandId, range),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

/**
 * Hook to fetch platform analytics
 */
export function usePlatformAnalytics(
  brandId: string,
  range: TimeRange = "30d",
  options?: Omit<UseQueryOptions<PlatformAnalytics>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.analytics.platforms(brandId),
    queryFn: () => fetchPlatformAnalytics(brandId, range),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook to fetch GEO score breakdown
 */
export function useGEOScoreBreakdown(
  brandId: string,
  options?: Omit<UseQueryOptions<GEOScoreBreakdown>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.analytics.geoScore(brandId),
    queryFn: () => fetchGEOScoreBreakdown(brandId),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

/**
 * Hook to fetch recommendation analytics
 */
export function useRecommendationAnalytics(
  brandId: string,
  range: TimeRange = "30d",
  options?: Omit<UseQueryOptions<RecommendationAnalytics>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["analytics", "recommendations", brandId, range],
    queryFn: () => fetchRecommendationAnalytics(brandId, range),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

// =============================================================================
// Aggregated Analytics Hooks
// =============================================================================

/**
 * Hook to fetch all analytics for a brand (dashboard overview)
 */
export function useAllAnalytics(brandId: string, range: TimeRange = "30d") {
  const mentions = useMentionAnalytics(brandId, range);
  const audits = useAuditAnalytics(brandId, range);
  const content = useContentAnalytics(brandId, range);
  const competitors = useCompetitorAnalytics(brandId, range);
  const platforms = usePlatformAnalytics(brandId, range);
  const geoScore = useGEOScoreBreakdown(brandId);
  const recommendations = useRecommendationAnalytics(brandId, range);

  const isLoading =
    mentions.isLoading ||
    audits.isLoading ||
    content.isLoading ||
    competitors.isLoading ||
    platforms.isLoading ||
    geoScore.isLoading ||
    recommendations.isLoading;

  const error =
    mentions.error ||
    audits.error ||
    content.error ||
    competitors.error ||
    platforms.error ||
    geoScore.error ||
    recommendations.error;

  return {
    mentions: mentions.data,
    audits: audits.data,
    content: content.data,
    competitors: competitors.data,
    platforms: platforms.data,
    geoScore: geoScore.data,
    recommendations: recommendations.data,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch organization-wide analytics
 */
export function useOrganizationAnalytics(range: TimeRange = "30d") {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["analytics", "organization", orgId, range],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/organization?range=${range}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch organization analytics");
      }
      return response.json();
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10,
  });
}

// =============================================================================
// Export & Report Hooks
// =============================================================================

/**
 * Hook to export analytics data
 */
export function useExportAnalytics() {
  return useQuery({
    queryKey: ["analytics", "export"],
    queryFn: async () => {
      // This is just a placeholder - actual export happens via mutations
      return { available: true };
    },
    enabled: false, // Manual trigger only
  });
}

/**
 * Hook to fetch scheduled reports
 */
export function useScheduledReports() {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["analytics", "reports", "scheduled", orgId],
    queryFn: async () => {
      const response = await fetch("/api/analytics/reports/scheduled");
      if (!response.ok) {
        throw new Error("Failed to fetch scheduled reports");
      }
      return response.json();
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10,
  });
}

// =============================================================================
// Chart Data Transformation Helpers
// =============================================================================

/**
 * Transform time series data for Recharts
 */
export function transformTimeSeriesForChart(
  data: TimeSeriesDataPoint[],
  valueKey = "value"
) {
  return data.map((point) => ({
    date: point.date,
    [valueKey]: point.value,
    label: point.label || point.date,
  }));
}

/**
 * Combine multiple time series for comparison charts
 */
export function combineTimeSeriesData(
  series: Array<{
    name: string;
    data: TimeSeriesDataPoint[];
  }>
) {
  // Get all unique dates
  const allDates = new Set<string>();
  series.forEach((s) => s.data.forEach((d) => allDates.add(d.date)));

  // Create combined data points
  const sortedDates = Array.from(allDates).sort();
  return sortedDates.map((date) => {
    const point: Record<string, unknown> = { date };
    series.forEach((s) => {
      const dataPoint = s.data.find((d) => d.date === date);
      point[s.name] = dataPoint?.value ?? null;
    });
    return point;
  });
}

/**
 * Calculate percentage change
 */
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Determine trend direction
 */
export function getTrend(change: number): "up" | "down" | "stable" {
  if (change > 2) return "up";
  if (change < -2) return "down";
  return "stable";
}
