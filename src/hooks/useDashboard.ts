/**
 * Dashboard Hooks (F155)
 * Wire Dashboard Home to real metrics APIs
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/client";
import { useOrganizationId } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export interface DashboardMetrics {
  geoScore: {
    current: number;
    change: number;
    trend: "up" | "down" | "stable";
    history: Array<{ date: string; score: number }>;
  };
  mentions: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    change: number;
    trend: "up" | "down" | "stable";
  };
  audits: {
    total: number;
    completed: number;
    inProgress: number;
    lastScore: number;
    averageScore: number;
  };
  recommendations: {
    total: number;
    completed: number;
    pending: number;
    highPriority: number;
    completionRate: number;
  };
  content: {
    total: number;
    published: number;
    draft: number;
    thisWeek: number;
  };
  platforms: Array<{
    name: string;
    mentions: number;
    sentiment: number;
    change: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    icon: string;
  }>;
  topRecommendations: Array<{
    id: string;
    title: string;
    priority: "critical" | "high" | "medium" | "low";
    impact: number;
    category: string;
  }>;
}

export interface GEOScoreDetails {
  overall: number;
  technical: number;
  content: number;
  authority: number;
  aiReadiness: number;
  breakdown: Array<{
    category: string;
    score: number;
    weight: number;
    items: Array<{
      name: string;
      score: number;
      status: "good" | "warning" | "error";
    }>;
  }>;
  competitors: Array<{
    name: string;
    score: number;
    change: number;
  }>;
  history: Array<{
    date: string;
    score: number;
    change: number;
  }>;
}

export interface UnifiedScoreResponse {
  score: {
    overall: number;
    grade: "A+" | "A" | "B" | "C" | "D" | "F";
    trend: "up" | "down" | "stable";
    change: number;
    components: {
      seo: {
        score: number;
        breakdown: Record<string, number>;
        recommendations: string[];
      };
      geo: {
        score: number;
        breakdown: Record<string, number>;
        recommendations: string[];
      };
      aeo: {
        score: number;
        breakdown: Record<string, number>;
        recommendations: string[];
      };
    };
    weights: {
      seo: number;
      geo: number;
      aeo: number;
    };
    insights: string[];
    priorityActions: string[];
  };
  history: Array<{
    date: string;
    label: string;
    unified: number;
    seo: number;
    geo: number;
    aeo: number;
  }>;
  lastUpdated: string;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchDashboardMetrics(brandId?: string): Promise<DashboardMetrics> {
  const url = brandId
    ? `/api/analytics/dashboard?brandId=${brandId}`
    : "/api/analytics/dashboard";

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard metrics");
  }
  return response.json();
}

async function fetchGEOScore(brandId: string): Promise<GEOScoreDetails> {
  const response = await fetch(`/api/analytics/geo-score?brandId=${brandId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch GEO score");
  }
  return response.json();
}

async function fetchUnifiedScore(brandId: string): Promise<UnifiedScoreResponse> {
  const response = await fetch(`/api/analytics/unified-score?brandId=${brandId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch unified score");
  }
  return response.json();
}

async function fetchRecentActivity(brandId?: string, limit = 10) {
  const url = brandId
    ? `/api/activity?brandId=${brandId}&limit=${limit}`
    : `/api/activity?limit=${limit}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch activity");
  }
  return response.json();
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch dashboard metrics
 */
export function useDashboardMetrics(
  brandId?: string,
  options?: Omit<UseQueryOptions<DashboardMetrics>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: queryKeys.analytics.dashboard(brandId || orgId || undefined),
    queryFn: () => fetchDashboardMetrics(brandId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    enabled: !!orgId || !!brandId,
    ...options,
  });
}

/**
 * Hook to fetch GEO score details
 */
export function useGEOScore(
  brandId: string,
  options?: Omit<UseQueryOptions<GEOScoreDetails>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.analytics.geoScore(brandId),
    queryFn: () => fetchGEOScore(brandId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!brandId,
    ...options,
  });
}

/**
 * Hook to fetch unified score (SEO + GEO + AEO combined)
 */
export function useUnifiedScore(
  brandId: string,
  options?: Omit<UseQueryOptions<UnifiedScoreResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["unified-score", brandId],
    queryFn: () => fetchUnifiedScore(brandId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
    enabled: !!brandId,
    ...options,
  });
}

/**
 * Hook to fetch recent activity
 */
export function useRecentActivity(brandId?: string, limit = 10) {
  return useQuery({
    queryKey: ["activity", brandId, limit],
    queryFn: () => fetchRecentActivity(brandId, limit),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Hook to fetch platform breakdown
 */
export function usePlatformAnalytics(brandId: string) {
  return useQuery({
    queryKey: queryKeys.analytics.platforms(brandId),
    queryFn: async () => {
      const response = await fetch(`/api/analytics/platforms?brandId=${brandId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch platform analytics");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!brandId,
  });
}

/**
 * Hook to fetch trends over time
 */
export function useTrends(brandId: string, range: "7d" | "30d" | "90d" = "30d") {
  return useQuery({
    queryKey: queryKeys.analytics.trends(brandId, range),
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/trends?brandId=${brandId}&range=${range}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch trends");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!brandId,
  });
}

/**
 * Hook to fetch health status
 */
export function useHealthStatus() {
  return useQuery({
    queryKey: queryKeys.health.status(),
    queryFn: async () => {
      const response = await fetch("/api/health");
      if (!response.ok) {
        throw new Error("Health check failed");
      }
      return response.json();
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

/**
 * Hook to fetch gamification progress
 */
export function useGamificationProgress() {
  return useQuery({
    queryKey: queryKeys.gamification.progress(),
    queryFn: async () => {
      const response = await fetch("/api/gamification?action=progress");
      if (!response.ok) {
        throw new Error("Failed to fetch gamification progress");
      }
      return response.json();
    },
    staleTime: 1000 * 60,
  });
}

/**
 * Hook to fetch achievements
 */
export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.gamification.achievements(),
    queryFn: async () => {
      const response = await fetch("/api/gamification?action=achievements");
      if (!response.ok) {
        throw new Error("Failed to fetch achievements");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
