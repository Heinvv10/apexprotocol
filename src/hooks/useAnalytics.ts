/**
 * Analytics Data Hooks
 * React hooks for fetching Analytics data with SWR
 */

import useSWR, { type SWRConfiguration } from "swr";
import {
  getAnalyticsDashboard,
  getUnifiedScore,
  type AnalyticsDashboard,
  type UnifiedScore,
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
