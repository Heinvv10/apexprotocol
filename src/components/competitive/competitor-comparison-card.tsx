"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
  AlertCircle,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types from benchmarking service
interface BenchmarkMetric {
  name: string;
  brandValue: number;
  competitorAverage: number;
  competitorValues: { name: string; value: number }[];
  delta: number;
  percentile: number;
  status: "leading" | "competitive" | "lagging";
}

interface BenchmarkResult {
  brandId: string;
  brandName: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    geoScore: BenchmarkMetric;
    smoScore: BenchmarkMetric;
    ppoScore: BenchmarkMetric;
    contentVolume: BenchmarkMetric;
    technicalScore: BenchmarkMetric;
  };
  overallPosition: number;
  competitorCount: number;
  insights: string[];
}

interface CompetitorComparisonCardProps {
  brandId: string;
  className?: string;
}

// Status badge
function StatusBadge({ status }: { status: BenchmarkMetric["status"] }) {
  const config = {
    leading: {
      icon: Trophy,
      label: "Leading",
      color: "text-success",
      bg: "bg-success/10",
    },
    competitive: {
      icon: Target,
      label: "Competitive",
      color: "text-warning",
      bg: "bg-warning/10",
    },
    lagging: {
      icon: AlertCircle,
      label: "Lagging",
      color: "text-error",
      bg: "bg-error/10",
    },
  };

  const { icon: Icon, label, color, bg } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", bg, color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// Delta indicator
function DeltaIndicator({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center text-success text-sm font-medium">
        <TrendingUp className="w-4 h-4 mr-1" />
        +{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center text-error text-sm font-medium">
        <TrendingDown className="w-4 h-4 mr-1" />
        {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-muted-foreground text-sm font-medium">
      <Minus className="w-4 h-4 mr-1" />
      0
    </span>
  );
}

// Metric row component
function MetricRow({ metric, brandName }: { metric: BenchmarkMetric; brandName: string }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="border-b border-border/20 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-20 text-left">
            <span className="text-sm font-medium text-foreground">{metric.name}</span>
          </div>
          <StatusBadge status={metric.status} />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <span className="text-primary font-semibold">{metric.brandValue}</span>
              <span className="text-muted-foreground text-xs ml-1">you</span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">{metric.competitorAverage}</span>
              <span className="text-muted-foreground text-xs ml-1">avg</span>
            </div>
            <DeltaIndicator delta={metric.delta} />
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{brandName}</span>
              <span>{metric.percentile}th percentile</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${metric.brandValue}%` }}
              />
            </div>
          </div>

          {/* Competitor values */}
          <div className="mt-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
              Competitor Breakdown
            </div>
            <div className="space-y-1.5">
              {metric.competitorValues.map((comp) => (
                <div key={comp.name} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {comp.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500/50 rounded-full"
                        style={{ width: `${comp.value}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground w-8 text-right">
                      {comp.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Position badge
function PositionBadge({ position, total }: { position: number; total: number }) {
  const getColor = () => {
    if (position === 1) return "from-amber-500 to-amber-600";
    if (position === 2) return "from-gray-400 to-gray-500";
    if (position === 3) return "from-amber-700 to-amber-800";
    return "from-muted to-muted";
  };

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl font-bold text-white shadow-lg",
        getColor()
      )}>
        #{position}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {position === 1 ? "Market Leader" : position <= 3 ? "Top Tier" : `Position ${position}`}
        </p>
        <p className="text-xs text-muted-foreground">
          of {total} competitors
        </p>
      </div>
    </div>
  );
}

export function CompetitorComparisonCard({ brandId, className }: CompetitorComparisonCardProps) {
  const [data, setData] = React.useState<BenchmarkResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchBenchmarkData();
  }, [brandId]);

  const fetchBenchmarkData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/competitive/benchmark/${brandId}`);
      if (!response.ok) throw new Error("Failed to fetch benchmark data");
      const result = await response.json();
      setData(result.benchmark || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex items-center justify-center h-[300px] text-error">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <p className="text-sm">No benchmark data available</p>
          <p className="text-xs mt-1">Add competitors to enable benchmarking</p>
        </div>
      </div>
    );
  }

  const metrics = [
    data.metrics.geoScore,
    data.metrics.smoScore,
    data.metrics.ppoScore,
    data.metrics.contentVolume,
    data.metrics.technicalScore,
  ];

  return (
    <div className={cn("card-secondary overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Competitive Position
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.brandName} vs {data.competitorCount} competitors
            </p>
          </div>
          <PositionBadge
            position={data.overallPosition}
            total={data.competitorCount + 1}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="divide-y divide-border/20">
        {metrics.map((metric) => (
          <MetricRow
            key={metric.name}
            metric={metric}
            brandName={data.brandName}
          />
        ))}
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="p-4 bg-primary/5 border-t border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">AI Insights</span>
          </div>
          <ul className="space-y-1.5">
            {data.insights.map((insight, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Period info */}
      <div className="px-4 py-2 border-t border-border/30 text-[10px] text-muted-foreground">
        Data period: {new Date(data.period.start).toLocaleDateString()} -{" "}
        {new Date(data.period.end).toLocaleDateString()}
      </div>
    </div>
  );
}
