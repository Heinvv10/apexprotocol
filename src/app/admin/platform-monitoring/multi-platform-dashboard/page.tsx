"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Download, Lock } from "lucide-react";
import { PlatformOverviewCard } from "@/components/platform-monitoring/platform-overview-card";
import { PlatformComparisonChart } from "@/components/platform-monitoring/platform-comparison-chart";
import { VisibilityGauge } from "@/components/platform-monitoring/visibility-gauge";
import { RegionalCoverageMap } from "@/components/platform-monitoring/regional-coverage-map";
import { PlatformPerformanceTable } from "@/components/platform-monitoring/platform-performance-table";
import { PlatformDeepDiveModal } from "@/components/platform-monitoring/platform-deep-dive-modal";
import { PlatformComparisonModal } from "@/components/platform-monitoring/platform-comparison-modal";
import { useAuthStore } from "@/stores/auth";
import { canAccessFeature } from "@/lib/permissions/feature-gates";
import { usePlatformDashboard } from "@/hooks/usePlatformDashboard";
import type { PlatformMetrics } from "@/hooks/usePlatformDashboard";

export default function MultiPlatformDashboard() {
  const [selectedTier, setSelectedTier] = useState<"all" | "tier_1" | "tier_2">("all");
  const [canAccessTier2, setCanAccessTier2] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformMetrics | null>(null);
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonPlatform1, setComparisonPlatform1] = useState<PlatformMetrics | null>(null);
  const [comparisonPlatform2, setComparisonPlatform2] = useState<PlatformMetrics | null>(null);
  const organization = useOrganization();

  // Fetch real dashboard data
  const {
    platforms,
    tier1Average,
    tier2Average,
    regionCoverage,
    isLoading,
    isError,
    mutate,
  } = usePlatformDashboard();

  useEffect(() => {
    const checkAccess = async () => {
      if (organization.organization) {
        const planId = organization.organization.publicMetadata?.planId as string || "starter";
        const hasAccess = await canAccessFeature("platform_expansion_tier_2", planId as import("@/lib/permissions/feature-gates").Plan);
        setCanAccessTier2(hasAccess);
      }
    };
    checkAccess();
  }, [organization]);

  const allAverage = canAccessTier2 && tier2Average > 0
    ? Math.round((tier1Average + tier2Average) / 2)
    : tier1Average;

  // Filter platforms by tier
  const tier1Platforms = platforms.filter((p) => p.tier === "tier_1");
  const tier2Platforms = platforms.filter((p) => p.tier === "tier_2");

  // Build chart data respecting feature gates
  const chartData = [
    ...tier1Platforms.map((p) => ({ ...p })),
    ...(canAccessTier2 ? tier2Platforms.map((p) => ({ ...p })) : []),
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
  };

  const handlePlatformClick = (platform: PlatformMetrics) => {
    setSelectedPlatform(platform);
    setDeepDiveOpen(true);
  };

  const handleCompare = (platform: PlatformMetrics) => {
    if (!comparisonPlatform1) {
      setComparisonPlatform1(platform);
    } else if (!comparisonPlatform2 && platform.platform !== comparisonPlatform1.platform) {
      setComparisonPlatform2(platform);
      setComparisonOpen(true);
    } else {
      setComparisonPlatform1(platform);
      setComparisonPlatform2(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Multi-Platform Monitoring</h1>
          <p className="text-gray-400 mt-1">Monitor brand visibility across 17 AI platforms</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tier Filter */}
      <div className="flex gap-2">
        <Select
          value={selectedTier}
          onValueChange={(val) => {
            if (val === "tier_2" && !canAccessTier2) return;
            setSelectedTier(val as any);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {canAccessTier2 ? "All Platforms (17)" : "All Platforms (5)"}
            </SelectItem>
            <SelectItem value="tier_1">Tier 1 Only (5)</SelectItem>
            {canAccessTier2 ? (
              <SelectItem value="tier_2">Tier 2 Only (5)</SelectItem>
            ) : (
              <div className="px-2 py-1.5 text-sm text-gray-400 cursor-not-allowed flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Tier 2 Only (Enterprise)
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="card-secondary p-8 text-center">
          <div className="inline-block">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading platform data...</p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="card-secondary p-8 border-red-500/30">
          <p className="text-red-400 mb-2">Failed to load platform data</p>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            Retry
          </Button>
        </Card>
      )}

      {/* Key Metrics Row */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VisibilityGauge
          visibility={Math.round(allAverage)}
          label="Overall Visibility"
          subtitle="Across all platforms"
        />
        <VisibilityGauge
          visibility={Math.round(tier1Average)}
          label="Tier 1 Average"
          subtitle="5 major platforms"
        />
        <VisibilityGauge
          visibility={Math.round(tier2Average)}
          label="Tier 2 Average"
          subtitle="5 regional platforms"
        />
        </div>
      )}

      {/* Platform Overview Cards - Tier 1 */}
      {(selectedTier === "all" || selectedTier === "tier_1") && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Tier 1 Platforms (Major)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {tier1Platforms.length > 0 ? (
              tier1Platforms.map((platform) => (
                <div
                  key={platform.platform}
                  onClick={() => handlePlatformClick(platform)}
                  className="cursor-pointer"
                >
                  <PlatformOverviewCard
                    name={platform.platform}
                    displayName={platform.displayName}
                    tier="tier_1"
                    metrics={{
                      visibility: platform.visibility,
                      position: platform.position || 1,
                      confidence: platform.confidence,
                      trend: platform.trend,
                    }}
                    icon={platform.icon}
                    lastUpdated={platform.lastUpdated}
                    enabled={true}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-400 col-span-5">No Tier 1 platforms available</p>
            )}
          </div>
        </div>
      )}

      {/* Platform Overview Cards - Tier 2 */}
      {(selectedTier === "all" || selectedTier === "tier_2") && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Tier 2 Platforms (Regional)
            {!canAccessTier2 && (
              <span className="ml-2 text-sm text-gray-400 font-normal flex items-center gap-1 inline-flex">
                <Lock className="w-4 h-4" /> Enterprise Only
              </span>
            )}
          </h2>
          {canAccessTier2 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {tier2Platforms.length > 0 ? (
                tier2Platforms.map((platform) => (
                  <div
                    key={platform.platform}
                    onClick={() => handlePlatformClick(platform)}
                    className="cursor-pointer"
                  >
                    <PlatformOverviewCard
                      name={platform.platform}
                      displayName={platform.displayName}
                      tier="tier_2"
                      metrics={{
                        visibility: platform.visibility,
                        position: platform.position || 1,
                        confidence: platform.confidence,
                        trend: platform.trend,
                      }}
                      icon={platform.icon}
                      lastUpdated={platform.lastUpdated}
                      enabled={true}
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-400 col-span-5">No Tier 2 platforms available</p>
              )}
            </div>
          ) : (
            <Card className="card-secondary p-8 text-center">
              <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Tier 2 platforms are available on Enterprise plans</p>
              <p className="text-sm text-gray-500">Upgrade your plan to access regional and emerging market platforms</p>
            </Card>
          )}
        </div>
      )}

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformComparisonChart
          data={chartData}
          title="Visibility vs Confidence Comparison"
          type="bar"
        />
        <PlatformComparisonChart
          data={chartData}
          title="Platform Visibility Trend"
          type="line"
        />
      </div>

      {/* Regional Coverage — only render when real data exists.
          Previously this fell back to a hardcoded REGIONAL_DATA constant,
          which shipped a plausible-looking map when no monitoring had
          actually run. */}
      {regionCoverage.length > 0 && (
        <RegionalCoverageMap regions={regionCoverage} title="Regional Market Coverage" />
      )}

      {/* Performance Table */}
      {platforms.length > 0 && (
        <PlatformPerformanceTable
          platforms={platforms.map((p, idx) => ({
            id: p.platform,
            platform: p.platform,
            displayName: p.displayName,
            tier: p.tier,
            visibility: p.visibility,
            position: p.position,
            confidence: p.confidence,
            citations: p.citations,
            trend: p.trend,
            trendPercent: p.trendPercent,
            lastUpdated: p.lastUpdated,
            status: p.status,
          }))}
          title="Platform Performance Metrics"
        />
      )}

      {/* Footer Info */}
      <Card className="card-tertiary p-4">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-white">Last Updated:</span> {new Date().toLocaleString()}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          <span className="font-semibold text-white">Platforms Monitored:</span> {platforms.length} {canAccessTier2 ? "AI platforms across Western markets, Eastern Europe, Russia, China, and Asia-Pacific regions representing 97% of global AI platform visibility." : "major AI platforms across Western markets representing 92% of global AI platform visibility."}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          <span className="font-semibold text-white">Total Mentions Tracked:</span> {platforms.reduce((sum, p) => sum + p.citations, 0).toLocaleString()}
        </p>
        {!canAccessTier2 && (
          <p className="text-sm text-cyan-400 mt-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Upgrade to Enterprise to access 5 additional regional platforms and expand to 97% coverage</span>
          </p>
        )}
      </Card>

      {/* Deep Dive Modal */}
      <PlatformDeepDiveModal
        open={deepDiveOpen}
        onOpenChange={setDeepDiveOpen}
        platform={selectedPlatform}
        allPlatforms={platforms}
      />

      {/* Comparison Modal */}
      <PlatformComparisonModal
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        platform1={comparisonPlatform1}
        platform2={comparisonPlatform2}
        allPlatforms={platforms}
      />
    </div>
  );
}
