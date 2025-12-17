"use client";

/**
 * ServiceScanResults Component
 *
 * Container component that fetches and displays scan results for a brand.
 * Includes the "Scan All" button and platform metrics cards.
 */

import { useState, useEffect, useCallback } from "react";
import { ScanBrandButton } from "./scan-brand-button";
import { PlatformMetricsCard, PlatformMetricsGrid } from "./platform-metrics-card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceScanResultsProps {
  brandId: string;
  handles: {
    twitter?: string;
    youtube?: string;
    facebook?: string;
  };
  className?: string;
}

interface ScanResultData {
  id: string;
  platform: "twitter" | "youtube" | "facebook";
  handle: string;
  metrics: {
    followerCount: number;
    followingCount: number;
    postCount: number;
    engagementRate: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    avgViews: number;
    postFrequency: number;
    mentionsCount: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  profileData?: {
    displayName: string;
    bio: string;
    avatarUrl: string;
    isVerified: boolean;
    profileUrl: string;
  };
  scanStatus: "pending" | "scanning" | "success" | "partial" | "failed";
  scannedAt: string | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    brandId: string;
    summary: {
      totalPlatforms: number;
      totalFollowers: number;
      avgEngagementRate: number;
      lastScanAt: string | null;
    };
    results: ScanResultData[];
  };
}

export function ServiceScanResults({
  brandId,
  handles,
  className,
}: ServiceScanResultsProps) {
  const [results, setResults] = useState<ScanResultData[]>([]);
  const [summary, setSummary] = useState<ApiResponse["data"]["summary"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanningPlatform, setScanningPlatform] = useState<string | null>(null);

  // Configured platforms
  const configuredPlatforms = Object.entries(handles)
    .filter(([, value]) => value && value.trim().length > 0)
    .map(([platform]) => platform as "twitter" | "youtube" | "facebook");

  // Fetch cached results from API
  const fetchResults = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/social/scan/results?brandId=${brandId}`);
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.success === false ? "Failed to fetch results" : "Unknown error");
      }

      setResults(data.data.results);
      setSummary(data.data.summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load scan results";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  // Initial fetch
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Handle scan complete
  const handleScanComplete = () => {
    // Refresh results after scan completes
    setTimeout(() => {
      fetchResults();
    }, 1000);
  };

  // Handle single platform rescan
  const handlePlatformRescan = async (platform: "twitter" | "youtube" | "facebook") => {
    const handle = handles[platform];
    if (!handle) return;

    setScanningPlatform(platform);

    try {
      const response = await fetch("/api/social/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          handles: { [platform]: handle },
          platforms: [platform],
          options: {
            includeProfile: true,
            includePosts: true,
            includeMentions: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Scan failed");
      }

      // Wait a bit then refresh
      setTimeout(() => {
        fetchResults();
        setScanningPlatform(null);
      }, 1000);
    } catch {
      setScanningPlatform(null);
    }
  };

  // Get result for a specific platform
  const getResultForPlatform = (platform: "twitter" | "youtube" | "facebook") => {
    return results.find((r) => r.platform === platform);
  };

  if (configuredPlatforms.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No social handles configured for this brand.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add social handles in brand settings to enable scanning.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Scan All button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Social Media Presence</h3>
          {summary && summary.lastScanAt && (
            <p className="text-xs text-muted-foreground">
              Last scan: {new Date(summary.lastScanAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchResults}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            <span className="ml-1">Refresh</span>
          </Button>
          <ScanBrandButton
            brandId={brandId}
            handles={handles}
            onScanComplete={handleScanComplete}
            variant="default"
            size="sm"
          />
        </div>
      </div>

      {/* Summary Stats */}
      {summary && results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-tertiary p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">{summary.totalPlatforms}</p>
            <p className="text-xs text-muted-foreground">Platforms</p>
          </div>
          <div className="card-tertiary p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">
              {summary.totalFollowers >= 1000000
                ? `${(summary.totalFollowers / 1000000).toFixed(1)}M`
                : summary.totalFollowers >= 1000
                  ? `${(summary.totalFollowers / 1000).toFixed(1)}K`
                  : summary.totalFollowers}
            </p>
            <p className="text-xs text-muted-foreground">Total Followers</p>
          </div>
          <div className="card-tertiary p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">
              {summary.avgEngagementRate.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Engagement</p>
          </div>
          <div className="card-tertiary p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">
              {results.reduce((sum, r) => sum + (r.metrics.mentionsCount || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Mentions</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-500">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchResults}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Platform Cards Grid */}
      <PlatformMetricsGrid>
        {configuredPlatforms.map((platform) => {
          const result = getResultForPlatform(platform);
          const handle = handles[platform];

          return (
            <PlatformMetricsCard
              key={platform}
              platform={platform}
              handle={handle || ""}
              data={
                result
                  ? {
                      followerCount: result.metrics.followerCount,
                      followingCount: result.metrics.followingCount,
                      engagementRate: result.metrics.engagementRate,
                      avgLikes: result.metrics.avgLikes,
                      avgComments: result.metrics.avgComments,
                      avgShares: result.metrics.avgShares,
                      postCount: result.metrics.postCount,
                      postFrequency: result.metrics.postFrequency,
                      mentionsCount: result.metrics.mentionsCount,
                      sentiment: result.sentiment,
                      profileUrl: result.profileData?.profileUrl,
                      avatarUrl: result.profileData?.avatarUrl,
                      displayName: result.profileData?.displayName,
                      isVerified: result.profileData?.isVerified,
                    }
                  : undefined
              }
              scanStatus={
                scanningPlatform === platform
                  ? "scanning"
                  : result?.scanStatus || "pending"
              }
              lastScanned={result?.scannedAt}
              onRescan={() => handlePlatformRescan(platform)}
              isLoading={isLoading || scanningPlatform === platform}
            />
          );
        })}
      </PlatformMetricsGrid>
    </div>
  );
}
