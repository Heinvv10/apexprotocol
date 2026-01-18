"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Loader2,
  RefreshCw,
  Bot,
  ArrowRight,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  PieChart,
  Eye,
  Rocket,
  Map,
  Trophy,
  HelpCircle,
} from "lucide-react";
import { useSelectedBrand } from "@/stores";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

// Phase 9.1 Components
import {
  CompetitorDiscoveryCard,
  BenchmarkRadarChart,
  CompetitorComparisonCard,
} from "@/components/competitive";

// Phase 9.2 Components
import {
  CompetitorScorecard,
  RoadmapGenerator,
} from "@/components/competitive";

// Metric tooltips for explaining competitive metrics
import { MetricTooltip, METRIC_DEFINITIONS, type MetricKey } from "@/components/competitive/MetricTooltip";

// Phase 9.4 - Premium Gating
import { FeatureGate, UsageMeter } from "@/components/premium";
import { useCurrentPlan } from "@/hooks/use-subscription";

// Types
interface CompetitiveSummary {
  brandId: string;
  brandName: string;
  summary: {
    shareOfVoice: number;
    sovTrend: "up" | "down" | "stable";
    competitorCount: number;
    alertCount: number;
    gapCount: number;
  };
  lastUpdated: string;
}

interface GapItem {
  id?: string;
  type: string;
  keyword?: string;
  topic?: string;
  description: string;
  competitor: string;
  opportunity: number;
  isResolved: boolean;
}

interface AlertItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  competitor?: string;
  platform?: string;
  triggeredAt: string;
  isRead: boolean;
}

// API hooks
function useCompetitiveSummary(brandId: string) {
  return useQuery({
    queryKey: ["competitive", "summary", brandId],
    queryFn: async (): Promise<CompetitiveSummary> => {
      const res = await fetch(`/api/competitive?brandId=${brandId}&type=summary`);
      if (!res.ok) throw new Error("Failed to fetch competitive summary");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}

function useCompetitiveGaps(brandId: string) {
  return useQuery({
    queryKey: ["competitive", "gaps", brandId],
    queryFn: async () => {
      const res = await fetch(`/api/competitive?brandId=${brandId}&type=gaps`);
      if (!res.ok) throw new Error("Failed to fetch gaps");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}

function useCompetitiveAlerts(brandId: string) {
  return useQuery({
    queryKey: ["competitive", "alerts", brandId],
    queryFn: async () => {
      const res = await fetch(`/api/competitive?brandId=${brandId}&type=alerts`);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}

// Select brand prompt
function SelectBrandPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-lg space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Target className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Select a Brand to View Competitive Intel</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to analyze competitive landscape.
          </p>
        </div>
        <Link href="/dashboard/brands">
          <Button variant="outline" size="lg" className="gap-2">
            Manage Brands
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Analyzing competitive landscape...</p>
      </div>
    </div>
  );
}

// Error state
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 border border-error/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Failed to Load Competitive Data</h3>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}

// SOV Gauge Component
function SOVGauge({ value, trend }: { value: number; trend: "up" | "down" | "stable" }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-error" : "text-muted-foreground";
  const trendBg = trend === "up" ? "bg-success/10" : trend === "down" ? "bg-error/10" : "bg-muted/20";

  return (
    <div className="card-primary p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <PieChart className="w-full h-full text-primary" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <MetricTooltip metric="SOV" size="sm" side="bottom">
            <h3 className="text-sm font-medium text-muted-foreground">Share of Voice</h3>
          </MetricTooltip>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${trendBg}`}>
            <TrendIcon className={`w-3 h-3 ${trendColor}`} />
            <span className={`text-xs font-medium ${trendColor}`}>
              {trend === "up" ? "Rising" : trend === "down" ? "Falling" : "Stable"}
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground">{value.toFixed(1)}</span>
          <span className="text-xl text-muted-foreground">%</span>
        </div>
        <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent-purple rounded-full transition-all duration-500"
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  description,
  trend,
  color = "primary",
  href,
  metricKey,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  description?: string;
  trend?: "up" | "down" | "stable";
  color?: "primary" | "warning" | "error" | "success";
  href?: string;
  metricKey?: MetricKey;
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary border-primary/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    error: "bg-error/10 text-error border-error/30",
    success: "bg-success/10 text-success border-success/30",
  };

  const labelContent = metricKey ? (
    <MetricTooltip metric={metricKey} size="sm" side="top">
      <span className="text-sm text-muted-foreground">{label}</span>
    </MetricTooltip>
  ) : (
    <div className="text-sm text-muted-foreground">{label}</div>
  );

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className="text-xs text-muted-foreground">
            {trend === "up" && <TrendingUp className="w-4 h-4 text-success" />}
            {trend === "down" && <TrendingDown className="w-4 h-4 text-error" />}
            {trend === "stable" && <Minus className="w-4 h-4" />}
          </div>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {labelContent}
        {description && <div className="text-xs text-muted-foreground/70">{description}</div>}
      </div>
      {href && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <span>View Details</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="card-secondary p-5 block hover:bg-white/5 transition-colors group">
        {content}
      </Link>
    );
  }

  return (
    <div className="card-secondary p-5">
      {content}
    </div>
  );
}

// Gap Card Component
function GapCard({ gap }: { gap: GapItem }) {
  const opportunityColor =
    gap.opportunity >= 70
      ? "text-success bg-success/10"
      : gap.opportunity >= 40
      ? "text-warning bg-warning/10"
      : "text-muted-foreground bg-muted/20";

  return (
    <div className="card-tertiary p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground capitalize">
              {gap.type}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${opportunityColor}`}>
              {gap.opportunity}% opportunity
            </span>
          </div>
          <p className="text-sm text-foreground line-clamp-2">{gap.description}</p>
          <p className="text-xs text-muted-foreground mt-1">vs {gap.competitor}</p>
        </div>
        {!gap.isResolved && (
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            Mark Resolved
          </button>
        )}
      </div>
    </div>
  );
}

// Alert Card Component
function AlertCard({ alert }: { alert: AlertItem }) {
  const severityColor = {
    critical: "text-error bg-error/10 border-error/30",
    high: "text-warning bg-warning/10 border-warning/30",
    medium: "text-muted-foreground bg-muted/10 border-muted/30",
    low: "text-muted-foreground/70 bg-muted/5 border-muted/20",
  };

  return (
    <div className={`card-tertiary p-4 border-l-2 ${alert.isRead ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${severityColor[alert.severity as keyof typeof severityColor] || severityColor.medium}`}>
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{alert.title}</span>
            {!alert.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/70">
            {alert.competitor && <span>Competitor: {alert.competitor}</span>}
            {alert.platform && <span>Platform: {alert.platform}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function CompetitivePage() {
  const router = useRouter();
  const selectedBrand = useSelectedBrand();
  const brandId = selectedBrand?.id || "";
  const currentPlan = useCurrentPlan();

  // State for roadmap generator modal
  const [showRoadmapGenerator, setShowRoadmapGenerator] = React.useState(false);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useCompetitiveSummary(brandId);

  const { data: gapsData } = useCompetitiveGaps(brandId);
  const { data: alertsData } = useCompetitiveAlerts(brandId);

  // Handle upgrade navigation
  const handleUpgrade = () => {
    router.push("/dashboard/settings?tab=billing");
  };

  // Navigate to competitor deep dive
  const handleCompetitorClick = (competitorName: string) => {
    router.push(`/dashboard/competitive/${encodeURIComponent(competitorName)}`);
  };

  // Handle states
  if (!selectedBrand) {
    return (
      <div className="space-y-6 relative">
        <PageHeader brandId={brandId} />
        <SelectBrandPrompt />
        <DecorativeStar />
      </div>
    );
  }

  if (summaryLoading) {
    return (
      <div className="space-y-6 relative">
        <PageHeader brandId={brandId} />
        <LoadingState />
        <DecorativeStar />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="space-y-6 relative">
        <PageHeader brandId={brandId} />
        <ErrorState error={summaryError as Error} onRetry={() => refetchSummary()} />
        <DecorativeStar />
      </div>
    );
  }

  const gaps: GapItem[] = gapsData?.gaps || [];
  const alerts: AlertItem[] = alertsData?.alerts || [];
  const summaryData = summary?.summary || {
    shareOfVoice: 0,
    sovTrend: "stable" as const,
    competitorCount: 0,
    alertCount: 0,
    gapCount: 0,
  };

  return (
    <div className="space-y-6 relative">
      <PageHeader brandId={brandId} />

      <div className="space-y-6">
        {/* Top Row - SOV and Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SOVGauge value={summaryData.shareOfVoice} trend={summaryData.sovTrend} />

          <StatCard
            icon={Users}
            label="Competitors Tracked"
            value={summaryData.competitorCount}
            description="Active in your space"
            color="primary"
            href={`/dashboard/${brandId}/competitors`}
          />

          <StatCard
            icon={Eye}
            label="Competitive Gaps"
            value={summaryData.gapCount}
            description="Opportunities to capture"
            color={summaryData.gapCount > 10 ? "warning" : "success"}
          />

          <StatCard
            icon={AlertTriangle}
            label="Active Alerts"
            value={summaryData.alertCount}
            description="Require attention"
            color={summaryData.alertCount > 5 ? "error" : summaryData.alertCount > 0 ? "warning" : "success"}
          />
        </div>

        {/* Competitor Dashboard CTA */}
        <div className="card-primary p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
            <Target className="w-full h-full text-primary" />
          </div>
          <div className="relative z-10 flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Detailed Competitor Analysis</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                View in-depth competitor tracking, manage your competitor list, and analyze trends over time with interactive charts.
              </p>
            </div>
            <Link href={`/dashboard/${brandId}/competitors`}>
              <Button size="lg" className="gap-2">
                View Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Phase 9.1: Benchmark Section - Gated to Professional+ */}
        <FeatureGate
          feature="competitive_benchmarking"
          plan={currentPlan}
          mode="blur"
          onUpgrade={handleUpgrade}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BenchmarkRadarChart
              brandId={brandId}
              brandName={selectedBrand?.name || "Your Brand"}
            />
            <CompetitorComparisonCard
              brandId={brandId}
            />
          </div>
        </FeatureGate>

        {/* Phase 9.1: Discovery Section - Gated to Professional+ */}
        <FeatureGate
          feature="competitive_discovery"
          plan={currentPlan}
          mode="replace"
          onUpgrade={handleUpgrade}
        >
          <CompetitorDiscoveryCard brandId={brandId} />
        </FeatureGate>

        {/* Phase 9.2: Competitor Scorecard - Gated to Professional+ */}
        <FeatureGate
          feature="competitor_scorecard"
          plan={currentPlan}
          mode="blur"
          onUpgrade={handleUpgrade}
        >
          <CompetitorScorecard
            brandId={brandId}
            onCompetitorClick={handleCompetitorClick}
          />
        </FeatureGate>

        {/* Phase 9.2: Improvement Roadmap CTA */}
        <div className="card-primary p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
            <Rocket className="w-full h-full text-accent-purple" />
          </div>
          <div className="relative z-10 flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Map className="w-5 h-5 text-accent-purple" />
                <h3 className="text-lg font-semibold text-foreground">Improvement Roadmap</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Get a personalized step-by-step plan to improve your scores and beat competitors. Our AI analyzes gaps and creates prioritized milestones.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowRoadmapGenerator(true)}
                className="gap-2"
              >
                <Trophy className="w-4 h-4" />
                Quick Generate
              </Button>
              <Link href="/dashboard/competitive/roadmap">
                <Button size="lg" className="gap-2">
                  View Roadmap
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Competitor Usage Meter for Professional Plan */}
        {currentPlan === "professional" && (
          <div className="card-secondary p-4">
            <UsageMeter
              resource="competitors"
              plan={currentPlan}
              currentUsage={summaryData.competitorCount}
              variant="detailed"
              onUpgrade={handleUpgrade}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Competitive Gaps Section */}
          <div className="card-secondary p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Competitive Gaps</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {gaps.length} opportunities
              </span>
            </div>

            {gaps.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-success/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No competitive gaps found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Your brand has strong coverage
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {gaps.slice(0, 10).map((gap, i) => (
                  <GapCard key={gap.id || i} gap={gap} />
                ))}
                {gaps.length > 10 && (
                  <button className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors">
                    View all {gaps.length} gaps
                  </button>
                )}
              </div>
            )}

            {/* Recommendations */}
            {gapsData?.recommendations?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {gapsData.recommendations.slice(0, 3).map((rec: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground/80 flex items-start gap-2">
                      <span className="text-primary">â€¢</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Alerts Section */}
          <div className="card-secondary p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h2 className="text-lg font-semibold text-foreground">Competitive Alerts</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {alertsData?.unreadCount || 0} unread
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-success/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No active alerts</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Your competitive landscape is stable
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {alerts.slice(0, 10).map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
                {alerts.length > 10 && (
                  <button className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors">
                    View all {alerts.length} alerts
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Insights Row */}
        {summary && (
          <div className="card-secondary p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-accent-purple" />
              <h2 className="text-lg font-semibold text-foreground">AI Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-tertiary p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Share of Voice Analysis</h4>
                <p className="text-xs text-muted-foreground">
                  {summaryData.shareOfVoice < 20
                    ? "Your share of voice is below average. Focus on increasing brand mentions across AI platforms."
                    : summaryData.shareOfVoice < 50
                    ? "Your share of voice is moderate. Look for opportunities to expand visibility."
                    : "Strong share of voice! Maintain your position while monitoring competitors."}
                </p>
              </div>
              <div className="card-tertiary p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Competitive Landscape</h4>
                <p className="text-xs text-muted-foreground">
                  {summaryData.competitorCount === 0
                    ? "No competitors tracked. Add competitors to your brand profile for analysis."
                    : `Tracking ${summaryData.competitorCount} competitor${summaryData.competitorCount !== 1 ? "s" : ""} in your space.`}
                </p>
              </div>
              <div className="card-tertiary p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Action Items</h4>
                <p className="text-xs text-muted-foreground">
                  {summaryData.gapCount > 0
                    ? `${summaryData.gapCount} competitive gap${summaryData.gapCount !== 1 ? "s" : ""} identified. Review and address high-priority opportunities.`
                    : "No gaps identified. Your brand has comprehensive coverage."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Roadmap Generator Modal */}
      <RoadmapGenerator
        brandId={brandId}
        competitors={[]}
        currentScore={50}
        open={showRoadmapGenerator}
        onOpenChange={setShowRoadmapGenerator}
      />

      <DecorativeStar />
    </div>
  );
}

// Decorative Star Component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientCompetitive)"
        />
        <defs>
          <linearGradient id="starGradientCompetitive" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Page Header Component
function PageHeader({ brandId }: { brandId?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradCompetitive)" />
            <defs>
              <linearGradient id="apexGradCompetitive" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-foreground ml-1">Competitive</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Competitor Dashboard Link */}
        {brandId && (
          <Link href={`/dashboard/${brandId}/competitors`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Users className="w-4 h-4" />
              Manage Competitors
            </Button>
          </Link>
        )}

        {/* AI Status */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">AI Status:</span>
          <span className="text-xs text-primary font-medium">Active</span>
        </div>
      </div>
    </div>
  );
}
