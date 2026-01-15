/**
 * Platform Monitoring React Hooks
 *
 * SWR-based hooks for platform mention tracking
 */

import useSWR from 'swr';
import {
  getPlatformMentions,
  getCompetitorMentions,
  getContentPerformance,
  type PlatformMention,
  type PlatformStats,
  type TopCitedPage,
  type CompetitorMention,
  type ContentPerformance,
} from '@/lib/api/platform-monitoring';

/**
 * Hook to fetch our platform mentions
 */
export function usePlatformMentions() {
  const { data, error, isLoading } = useSWR(
    '/api/platform-monitoring/our-visibility',
    getPlatformMentions,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return {
    mentions: (data?.mentions || []) as PlatformMention[],
    platformStats: (data?.platformStats || []) as PlatformStats[],
    topCitedPages: (data?.topCitedPages || []) as TopCitedPage[],
    totalMentions: data?.totalMentions || 0,
    avgVisibility: data?.avgVisibility || 0,
    isLoading,
    isError: !!error,
    error,
  };
}

/**
 * Hook to fetch competitor platform mentions
 */
export function useCompetitorMentions() {
  const { data, error, isLoading } = useSWR(
    '/api/platform-monitoring/competitor-visibility',
    getCompetitorMentions,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000,
    }
  );

  return {
    mentions: (data?.mentions || []) as CompetitorMention[],
    competitors: data?.competitors || [],
    shareOfVoice: data?.shareOfVoice || 0,
    isLoading,
    isError: !!error,
    error,
  };
}

/**
 * Hook to fetch content performance by type
 */
export function useContentPerformance() {
  const { data, error, isLoading } = useSWR(
    '/api/platform-monitoring/content-performance',
    getContentPerformance,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000,
    }
  );

  return {
    performanceByType: (data?.performanceByType || []) as ContentPerformance[],
    schemaImpact: data?.schemaImpact || { withSchema: 0, withoutSchema: 0, improvement: 0 },
    freshnessImpact: data?.freshnessImpact || { under30Days: 0, under90Days: 0, over90Days: 0 },
    isLoading,
    isError: !!error,
    error,
  };
}
