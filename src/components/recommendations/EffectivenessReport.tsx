"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Target,
  Award,
  Loader2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useSelectedBrand } from "@/stores";

// =============================================================================
// Types
// =============================================================================

interface AggregateMetrics {
  totalCompleted: number;
  averageEffectiveness: number;
  averageScoreImprovement: number;
  totalPositiveImprovements: number;
  totalNegativeImprovements: number;
}

interface TopPerformer {
  id: string;
  title: string;
  category: string;
  effectivenessScore: number;
  scoreImprovement: number;
  effectivenessLevel: "excellent" | "good" | "moderate" | "poor" | "ineffective";
  completedAt: string | null;
}

interface EffectivenessResponse {
  success: boolean;
  data: {
    metrics: AggregateMetrics;
    topPerformers: TopPerformer[];
  };
  meta: {
    brandId?: string;
    timestamp: string;
  };
}

interface EffectivenessReportProps {
  brandId?: string;
  className?: string;
  limit?: number;
}

// =============================================================================
// API Function
// =============================================================================

async function fetchEffectivenessMetrics(
  brandId?: string,
  limit?: number
): Promise<EffectivenessResponse> {
  const params = new URLSearchParams();
  if (brandId) {
    params.append("brandId", brandId);
  }
  if (limit) {
    params.append("limit", String(limit));
  }

  const url = `/api/recommendations/effectiveness${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch effectiveness metrics");
  }

  return response.json();
}

// =============================================================================
// Hook for Effectiveness Metrics
// =============================================================================

function useEffectivenessMetrics(brandId?: string, limit: number = 5) {
  return useQuery({
    queryKey: ["recommendations", "effectiveness", brandId, limit],
    queryFn: () => fetchEffectivenessMetrics(brandId, limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: true,
  });
}

// =============================================================================
// Effectiveness Level Configuration
// =============================================================================

const effectivenessLevelConfig: Record<
  TopPerformer["effectivenessLevel"],
  { label: string; className: string }
> = {
  excellent: {
    label: "Excellent",
    className: "bg-success/10 text-success border-success/20",
  },
  good: {
    label: "Good",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  moderate: {
    label: "Moderate",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  poor: {
    label: "Poor",
    className: "bg-muted text-muted-foreground border-border",
  },
  ineffective: {
    label: "Ineffective",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

// =============================================================================
// Metric Card Component
// =============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconClassName?: string;
  suffix?: string;
  prefix?: string;
  trend?: "positive" | "negative" | "neutral";
}

function MetricCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  suffix,
  prefix,
  trend,
}: MetricCardProps) {
  const displayValue = value === undefined || value === null || (typeof value === "number" && isNaN(value))
    ? "0"
    : String(value);

  return (
    <div className="p-4 rounded-lg bg-muted/5 border border-border/50">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className={cn(
            "text-2xl font-semibold text-foreground",
            trend === "positive" && "text-success",
            trend === "negative" && "text-destructive"
          )}>
            {prefix}
            {displayValue}
            {suffix}
          </p>
        </div>
        <div className={cn(
          "p-2 rounded-lg bg-muted/10",
          iconClassName
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Top Performer Item Component
// =============================================================================

interface TopPerformerItemProps {
  performer: TopPerformer;
  rank: number;
}

function TopPerformerItem({ performer, rank }: TopPerformerItemProps) {
  const levelConfig = effectivenessLevelConfig[performer.effectivenessLevel];
  const improvementSign = performer.scoreImprovement > 0 ? "+" : "";

  // Safe format of effectiveness score - ensure no NaN
  const effectivenessDisplay = performer.effectivenessScore !== null &&
    performer.effectivenessScore !== undefined &&
    !isNaN(performer.effectivenessScore)
      ? performer.effectivenessScore
      : 0;

  // Safe format of score improvement - ensure no NaN
  const improvementDisplay = performer.scoreImprovement !== null &&
    performer.scoreImprovement !== undefined &&
    !isNaN(performer.scoreImprovement)
      ? performer.scoreImprovement
      : 0;

  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg bg-muted/5 hover:bg-muted/10 border border-border/50 hover:border-border transition-all">
      {/* Rank */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
        {rank}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">
          {performer.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="badge-default text-xs">{performer.category}</span>
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border",
              levelConfig.className
            )}
          >
            {levelConfig.label}
          </span>
        </div>
      </div>

      {/* Scores */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-foreground">
          {effectivenessDisplay}%
        </p>
        <p className={cn(
          "text-xs flex items-center justify-end gap-0.5",
          improvementDisplay > 0 ? "text-success" : improvementDisplay < 0 ? "text-destructive" : "text-muted-foreground"
        )}>
          {improvementDisplay > 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : improvementDisplay < 0 ? (
            <TrendingDown className="h-3 w-3" />
          ) : null}
          {improvementSign}{improvementDisplay} pts
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function EffectivenessReport({
  brandId,
  className,
  limit = 5,
}: EffectivenessReportProps) {
  // Get brand from store if not provided via props
  const selectedBrand = useSelectedBrand();
  const effectiveBrandId = brandId || selectedBrand?.id;

  // Fetch effectiveness metrics
  const { data, isLoading, isError, error } = useEffectivenessMetrics(
    effectiveBrandId,
    limit
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Recommendation Effectiveness
          </h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">
              Loading effectiveness metrics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Recommendation Effectiveness
          </h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-destructive/50 mb-2" />
            <p className="text-sm text-destructive">Failed to load metrics</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {error instanceof Error ? error.message : "Please try again later"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const metrics = data?.data?.metrics;
  const topPerformers = data?.data?.topPerformers || [];

  // Empty state - no completed recommendations
  if (!metrics || metrics.totalCompleted === 0) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Recommendation Effectiveness
          </h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Target className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No completed recommendations yet
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Complete recommendations to see effectiveness metrics
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Safe formatting helper - prevents NaN and undefined display
  const safeNumber = (value: number | null | undefined, decimals: number = 1): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0";
    }
    return decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
  };

  // Format improvement with sign
  const formatImprovement = (value: number | null | undefined): string => {
    const numValue = value ?? 0;
    if (isNaN(numValue)) return "0";
    const prefix = numValue > 0 ? "+" : "";
    return `${prefix}${safeNumber(numValue)}`;
  };

  return (
    <div className={cn("card-secondary", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-muted-foreground">
          Recommendation Effectiveness
        </h3>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Total Completed"
          value={safeNumber(metrics.totalCompleted, 0)}
          icon={CheckCircle2}
          iconClassName="bg-success/10 text-success"
        />
        <MetricCard
          title="Average Effectiveness"
          value={safeNumber(metrics.averageEffectiveness)}
          suffix="%"
          icon={Target}
          iconClassName="bg-primary/10 text-primary"
        />
        <MetricCard
          title="Average Improvement"
          value={formatImprovement(metrics.averageScoreImprovement)}
          suffix=" pts"
          icon={TrendingUp}
          iconClassName="bg-success/10 text-success"
          trend={
            metrics.averageScoreImprovement > 0
              ? "positive"
              : metrics.averageScoreImprovement < 0
              ? "negative"
              : "neutral"
          }
        />
      </div>

      {/* Additional Stats Row */}
      <div className="flex items-center gap-4 mb-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-success" />
          <span className="font-medium text-foreground">
            {safeNumber(metrics.totalPositiveImprovements, 0)}
          </span>{" "}
          positive improvements
        </span>
        {metrics.totalNegativeImprovements > 0 && (
          <span className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-destructive" />
            <span className="font-medium text-foreground">
              {safeNumber(metrics.totalNegativeImprovements, 0)}
            </span>{" "}
            negative improvements
          </span>
        )}
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-warning" />
            Top Performers
          </h4>
          <div className="space-y-2">
            {topPerformers.slice(0, 5).map((performer, index) => (
              <TopPerformerItem
                key={performer.id}
                performer={performer}
                rank={index + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EffectivenessReport;
