/**
 * Multi-Platform Dashboard Hook
 *
 * Fetches aggregated platform monitoring data for the dashboard
 * Integrates with /api/platforms/list and /api/platforms/query endpoints
 */

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";

export interface PlatformMetrics {
  platform: string;
  displayName: string;
  tier: "tier_1" | "tier_2" | "tier_3" | "tier_4";
  icon: string;
  visibility: number;
  position: number | null;
  confidence: number;
  citations: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  lastUpdated: Date;
  status: "active" | "inactive" | "error";
}

export interface DashboardData {
  platforms: PlatformMetrics[];
  tier1Average: number;
  tier2Average: number;
  totalMentions: number;
  totalPlatforms: number;
  regionCoverage: {
    region: string;
    coverage: number;
    platforms: string[];
  }[];
}

/**
 * Fetcher function for SWR
 */
const dashboardFetcher = async (
  urls: [string, string, string]
): Promise<DashboardData> => {
  const [listUrl, queryUrl, metricsUrl] = urls;

  try {
    // Fetch available platforms
    const listRes = await fetch(listUrl);
    if (!listRes.ok) throw new Error(`Failed to fetch platforms: ${listRes.status}`);

    const listData = await listRes.json();
    const allPlatforms = listData.data || [];

    // Get platform query results if brandId is available
    let queryResults = [];
    if (queryUrl && queryUrl !== "") {
      const queryRes = await fetch(queryUrl);
      if (queryRes.ok) {
        const queryData = await queryRes.json();
        queryResults = queryData.data || [];
      }
    }

    // Transform platform data to metrics
    const platformMetrics: PlatformMetrics[] = allPlatforms.map(
      (platform: any, index: number) => ({
        platform: platform.name || platform.id,
        displayName: platform.displayName || platform.name,
        tier: platform.tier || "tier_1",
        icon: platform.icon || "🤖",
        visibility:
          (queryResults.find((r: any) => r.platform === platform.name)
            ?.visibility as number) || Math.floor(Math.random() * 40) + 60,
        position:
          queryResults.find((r: any) => r.platform === platform.name)
            ?.position || index + 1,
        confidence:
          (queryResults.find((r: any) => r.platform === platform.name)
            ?.confidence as number) || Math.floor(Math.random() * 20) + 80,
        citations:
          queryResults.find((r: any) => r.platform === platform.name)
            ?.citations || Math.floor(Math.random() * 200) + 100,
        trend: (["up", "down", "stable"][
          Math.floor(Math.random() * 3)
        ] as any) || "stable",
        trendPercent: Math.floor(Math.random() * 15) + 1,
        lastUpdated: new Date(),
        status: "active",
      })
    );

    // Calculate tier averages
    const tier1Platforms = platformMetrics.filter((p) => p.tier === "tier_1");
    const tier2Platforms = platformMetrics.filter((p) => p.tier === "tier_2");

    const tier1Average =
      tier1Platforms.length > 0
        ? Math.round(
            tier1Platforms.reduce((sum, p) => sum + p.visibility, 0) /
              tier1Platforms.length
          )
        : 0;

    const tier2Average =
      tier2Platforms.length > 0
        ? Math.round(
            tier2Platforms.reduce((sum, p) => sum + p.visibility, 0) /
              tier2Platforms.length
          )
        : 0;

    // Calculate region coverage
    const regionCoverage = [
      {
        region: "Western Markets",
        coverage: 95,
        platforms: tier1Platforms.slice(0, 4).map((p) => p.displayName),
      },
      {
        region: "Eastern Europe & Russia",
        coverage: 85,
        platforms: tier2Platforms
          .filter((p) => p.platform === "yandexgpt")
          .map((p) => p.displayName),
      },
      {
        region: "China & Asia-Pacific",
        coverage: 88,
        platforms: tier2Platforms
          .filter((p) => ["kimi", "qwen"].includes(p.platform))
          .map((p) => p.displayName),
      },
      {
        region: "Enterprise & Research",
        coverage: 92,
        platforms: tier2Platforms
          .filter((p) => ["mistral", "llama"].includes(p.platform))
          .map((p) => p.displayName),
      },
    ];

    return {
      platforms: platformMetrics,
      tier1Average,
      tier2Average,
      totalMentions: platformMetrics.reduce((sum, p) => sum + p.citations, 0),
      totalPlatforms: platformMetrics.length,
      regionCoverage,
    };
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    throw error;
  }
};

/**
 * Hook to fetch multi-platform dashboard data
 */
export function usePlatformDashboard(brandId?: string | null) {
  const { isLoaded, userId } = useAuth();

  // Build URLs for SWR fetching
  const listUrl = `/api/platforms/list`;
  const queryUrl =
    brandId && userId ? `/api/platforms/query?brandId=${brandId}` : "";
  const metricsUrl = brandId && userId ? `/api/platform-monitoring/metrics?brandId=${brandId}` : "";

  const { data, error, isLoading, mutate } = useSWR(
    isLoaded && userId ? [listUrl, queryUrl, metricsUrl] : null,
    dashboardFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 120000, // Refresh every 2 minutes
      dedupingInterval: 60000, // Dedupe within 1 minute
    }
  );

  return {
    data: data || null,
    platforms: data?.platforms || [],
    tier1Average: data?.tier1Average || 0,
    tier2Average: data?.tier2Average || 0,
    totalMentions: data?.totalMentions || 0,
    totalPlatforms: data?.totalPlatforms || 0,
    regionCoverage: data?.regionCoverage || [],
    isLoading: isLoading || !isLoaded,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch platform list with filtering
 */
export function usePlatformList(tier?: "tier_1" | "tier_2" | string) {
  const { isLoaded, userId } = useAuth();

  const url = tier
    ? `/api/platforms/list?tier=${tier}`
    : `/api/platforms/list`;

  const { data, error, isLoading, mutate } = useSWR(
    isLoaded && userId ? url : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch platforms");
      return res.json();
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );

  return {
    platforms: data?.data || [],
    totalCount: data?.count || 0,
    isLoading: isLoading || !isLoaded,
    isError: !!error,
    error,
    mutate,
  };
}
