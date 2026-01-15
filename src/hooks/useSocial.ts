/**
 * Social Media Data Hooks
 * React hooks for fetching Social Media data with SWR
 */

import useSWR, { type SWRConfiguration } from "swr";
import {
  getSocialAccounts,
  getSocialMentions,
  getSocialMetrics,
  getSocialSummary,
  type SocialAccountsResponse,
  type SocialMentionsResponse,
  type SocialMetricsResponse,
  type SocialSummary,
} from "@/lib/api/social";

/**
 * Hook to fetch social accounts for a brand
 */
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

/**
 * Hook to fetch social mentions for a brand
 */
export function useSocialMentions(
  brandId: string | null,
  config?: SWRConfiguration<SocialMentionsResponse>
) {
  const { data, error, isLoading, mutate } = useSWR<SocialMentionsResponse>(
    brandId ? `/api/social/mentions?brandId=${brandId}` : null,
    () => (brandId ? getSocialMentions(brandId) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    mentions: data?.mentions ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch social metrics for a brand
 */
export function useSocialMetrics(
  brandId: string | null,
  config?: SWRConfiguration<SocialMetricsResponse>
) {
  const { data, error, isLoading, mutate } = useSWR<SocialMetricsResponse>(
    brandId ? `/api/social/metrics?brandId=${brandId}` : null,
    () => (brandId ? getSocialMetrics(brandId) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...config,
    }
  );

  return {
    metrics: data?.metrics ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch social summary for a brand
 */
export function useSocialSummary(
  brandId: string | null,
  config?: SWRConfiguration<SocialSummary>
) {
  const { data, error, isLoading, mutate } = useSWR<SocialSummary>(
    brandId ? `/api/social/summary?brandId=${brandId}` : null,
    () => (brandId ? getSocialSummary(brandId) : null),
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
