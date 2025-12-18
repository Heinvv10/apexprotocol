"use client";

import * as React from "react";
import {
  Zap,
  Scan,
  Users,
  FileText,
  Database,
  TrendingUp,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Loader2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsageSummary, useUsageBreakdown, type UsageMetricType } from "@/hooks/useUsage";

interface UsageMetricDisplay {
  id: string;
  name: string;
  icon: React.ElementType;
  used: number;
  limit: number;
  unit: string;
  trend?: number;
  resetDate?: string;
}

// Map metric types to icons
const metricIcons: Record<UsageMetricType, React.ElementType> = {
  ai_tokens: Zap,
  api_calls: RefreshCw,
  scans: Scan,
  audits: RefreshCw,
  content_generations: FileText,
  mentions_tracked: Scan,
  storage_mb: Database,
  team_members: Users,
};

// Map metric types to display units
const metricUnits: Record<UsageMetricType, string> = {
  ai_tokens: "tokens",
  api_calls: "calls/month",
  scans: "scans/month",
  audits: "audits/month",
  content_generations: "pieces/month",
  mentions_tracked: "mentions",
  storage_mb: "MB",
  team_members: "users",
};

interface UsageDashboardProps {
  className?: string;
}

export function UsageDashboard({ className }: UsageDashboardProps) {
  const { data: summary, isLoading, error, refetch } = useUsageSummary();

  // Transform API data to display format
  const metrics: UsageMetricDisplay[] = React.useMemo(() => {
    if (!summary?.metrics) return [];

    return summary.metrics
      .filter((m) => ["ai_tokens", "scans", "team_members", "content_generations", "storage_mb", "audits"].includes(m.type))
      .map((metric) => ({
        id: metric.type,
        name: metric.label,
        icon: metricIcons[metric.type] || Zap,
        used: metric.current,
        limit: metric.limit,
        unit: metricUnits[metric.type] || "units",
        trend: metric.trend,
        resetDate: summary.period?.end
          ? new Date(summary.period.end).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : undefined,
      }));
  }, [summary]);

  // Format current period
  const currentPeriod = summary?.period?.start
    ? new Date(summary.period.start).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Current Period";

  // Calculate days until reset
  const daysUntilReset = React.useMemo(() => {
    if (!summary?.period?.end) return 0;
    const endDate = new Date(summary.period.end);
    const now = new Date();
    return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }, [summary]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading usage data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("card-secondary p-6 text-center", className)}>
        <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Failed to load usage data</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Usage Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Current billing period: {currentPeriod}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Resets in {daysUntilReset} days</span>
        </div>
      </div>

      {/* Usage cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metrics.map((metric) => (
          <UsageCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Usage breakdown chart placeholder */}
      <UsageBreakdown />
    </div>
  );
}

function UsageCard({ metric }: { metric: UsageMetricDisplay }) {
  const Icon = metric.icon;
  const percentage = Math.round((metric.used / metric.limit) * 100);
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  return (
    <div
      className={cn(
        "card-secondary p-4",
        isOverLimit && "border-error/50",
        isNearLimit && !isOverLimit && "border-warning/50"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isOverLimit
                ? "bg-error/20 text-error"
                : isNearLimit
                ? "bg-warning/20 text-warning"
                : "bg-primary/10 text-primary"
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {metric.name}
          </span>
        </div>

        {metric.trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              metric.trend > 0 ? "text-success" : "text-error"
            )}
          >
            <TrendingUp
              className={cn(
                "w-3 h-3",
                metric.trend < 0 && "rotate-180"
              )}
            />
            {metric.trend > 0 ? "+" : ""}
            {metric.trend}%
          </div>
        )}
      </div>

      {/* Usage bar */}
      <div className="mb-2">
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isOverLimit
                ? "bg-error"
                : isNearLimit
                ? "bg-warning"
                : "bg-primary"
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-foreground">
          {typeof metric.used === "number" && metric.used > 1000
            ? `${(metric.used / 1000).toFixed(1)}k`
            : metric.used}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {typeof metric.limit === "number" && metric.limit > 1000
              ? `${(metric.limit / 1000).toFixed(0)}k`
              : metric.limit}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">{metric.unit}</span>
      </div>

      {/* Warning */}
      {isNearLimit && (
        <div
          className={cn(
            "flex items-center gap-1.5 mt-3 text-xs",
            isOverLimit ? "text-error" : "text-warning"
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {isOverLimit
            ? "Limit exceeded"
            : `${100 - percentage}% remaining`}
        </div>
      )}

      {/* Reset date */}
      {metric.resetDate && (
        <p className="text-[10px] text-muted-foreground mt-2">
          Resets on {metric.resetDate}
        </p>
      )}
    </div>
  );
}

function UsageBreakdown() {
  const { data: breakdownData, isLoading } = useUsageBreakdown();

  // Calculate breakdown percentages from feature data
  const breakdown = React.useMemo(() => {
    // Return empty array when no data available
    if (!breakdownData?.byFeature) {
      return [];
    }

    const featureColors: Record<string, string> = {
      "Brand Monitoring": "#4926FA",
      "Content Generation": "#10A37F",
      "Site Audits": "#D97757",
      "API Access": "#4285F4",
    };

    const total = breakdownData.byFeature.reduce(
      (sum, f) => sum + (f.metrics.ai_tokens || 0),
      0
    );

    // Return empty array when total is zero
    if (total === 0) {
      return [];
    }

    return breakdownData.byFeature.map((f) => ({
      name: f.feature,
      percentage: Math.round(((f.metrics.ai_tokens || 0) / total) * 100),
      color: featureColors[f.feature] || "#6B7280",
    }));
  }, [breakdownData]);

  if (isLoading) {
    return (
      <div className="card-secondary p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state when no usage data
  if (breakdown.length === 0) {
    return (
      <div className="card-secondary p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Usage Breakdown by Feature
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
            <BarChart3 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No usage data available</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Usage breakdown will appear once you start using features
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-secondary p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Usage Breakdown by Feature
      </h3>

      {/* Stacked bar */}
      <div className="h-4 rounded-full overflow-hidden flex mb-4">
        {breakdown.map((item, index) => (
          <div
            key={item.name}
            className="h-full"
            style={{
              width: `${item.percentage}%`,
              backgroundColor: item.color,
              marginLeft: index > 0 ? 2 : 0,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {breakdown.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="text-xs text-foreground">{item.name}</p>
              <p className="text-sm font-semibold text-foreground">
                {item.percentage}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact usage widget for sidebar
export function UsageWidget({ className }: { className?: string }) {
  const { data: summary, isLoading } = useUsageSummary();

  // Get top 3 metrics for the widget
  const primaryMetrics = React.useMemo(() => {
    if (!summary?.metrics) return [];
    return summary.metrics
      .filter((m) => ["ai_tokens", "content_generations", "audits"].includes(m.type))
      .slice(0, 3)
      .map((m) => ({
        id: m.type,
        name: m.label,
        used: m.current,
        limit: m.limit,
      }));
  }, [summary]);

  if (isLoading) {
    return (
      <div className={cn("card-tertiary p-3 flex items-center justify-center", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("card-tertiary p-3", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-foreground">Usage</span>
        <span className="text-[10px] text-muted-foreground">This month</span>
      </div>

      <div className="space-y-2">
        {primaryMetrics.map((metric) => {
          const percentage = Math.round((metric.used / metric.limit) * 100);
          return (
            <div key={metric.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{metric.name}</span>
                <span className="text-foreground">{percentage}%</span>
              </div>
              <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
