/**
 * Analytics Data Hooks
 * React hooks for fetching Analytics data with SWR
 */

import useSWR, { type SWRConfiguration } from "swr";
import {
  getAnalyticsDashboard,
  getUnifiedScore,
  getAnalyticsSummary,
  getSalesMetrics,
  getMarketingMetrics,
  getReports,
  type AnalyticsDashboard,
  type UnifiedScore,
  type AnalyticsSummary,
  type SalesMetrics,
  type MarketingMetrics,
  type ReportsList,
} from "@/lib/api/analytics";

/**
 * Hook to fetch analytics dashboard data
 */
export function useAnalyticsDashboard(
  brandId: string | null,
  config?: SWRConfiguration<AnalyticsDashboard>
) {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsDashboard>(
    brandId ? `/api/analytics/dashboard?brandId=${brandId}` : null,
    () => (brandId ? getAnalyticsDashboard(brandId) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    dashboard: data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch unified score
 */
export function useUnifiedScore(
  brandId: string | null,
  config?: SWRConfiguration<UnifiedScore>
) {
  const { data, error, isLoading, mutate } = useSWR<UnifiedScore>(
    brandId ? `/api/analytics/unified-score?brandId=${brandId}` : null,
    () => (brandId ? getUnifiedScore(brandId) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    score: data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch analytics summary
 */
export function useAnalyticsSummary(config?: SWRConfiguration<AnalyticsSummary>) {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsSummary>(
    "/api/analytics/summary",
    getAnalyticsSummary,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    summary: data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch sales metrics
 */
export function useSalesMetrics(config?: SWRConfiguration<SalesMetrics>) {
  const { data, error, isLoading, mutate } = useSWR<SalesMetrics>(
    "/api/analytics/sales",
    getSalesMetrics,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    metrics: data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch marketing metrics
 */
export function useMarketingMetrics(config?: SWRConfiguration<MarketingMetrics>) {
  const { data, error, isLoading, mutate } = useSWR<MarketingMetrics>(
    "/api/analytics/marketing",
    getMarketingMetrics,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    metrics: data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch reports list
 */
export function useReports(config?: SWRConfiguration<ReportsList>) {
  const { data, error, isLoading, mutate } = useSWR<ReportsList>(
    "/api/analytics/reports",
    getReports,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    reports: data?.reports ?? [],
    totalReports: data?.totalReports ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
