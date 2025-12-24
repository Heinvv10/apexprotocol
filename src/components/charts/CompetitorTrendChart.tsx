"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { Loader2, TrendingUp, AlertCircle, LineChart as LineChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Types matching the snapshots API response
export interface CompetitorSnapshot {
  date: string;
  competitorName: string;
  competitorDomain: string;
  geoScore: number;
  aiMentionCount: number;
  sentimentScore: number;
  socialFollowers: number;
  contentPageCount: number;
}

export interface SnapshotResponse {
  brandId: string;
  competitorName?: string;
  timeRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
  snapshots: CompetitorSnapshot[];
  summary: {
    totalSnapshots: number;
    competitorsTracked: number;
    avgGeoScore: number;
    avgMentionCount: number;
  };
}

export type MetricType = "geoScore" | "aiMentionCount" | "sentimentScore" | "socialFollowers" | "contentPageCount";

export interface CompetitorTrendChartProps {
  brandId: string;
  metric?: MetricType;
  days?: number;
  competitorFilter?: string; // Filter to specific competitor
  className?: string;
}

// Color palette for competitor lines
const COMPETITOR_COLORS = [
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#EF4444", // Red
  "#8B5CF6", // Purple (repeat for >9 competitors)
];

// Metric display configuration
const METRIC_CONFIG: Record<MetricType, { label: string; color: string; formatter?: (value: number) => string }> = {
  geoScore: {
    label: "GEO Score",
    color: "#8B5CF6",
    formatter: (value) => Math.round(value).toString(),
  },
  aiMentionCount: {
    label: "AI Mentions",
    color: "#06B6D4",
    formatter: (value) => Math.round(value).toString(),
  },
  sentimentScore: {
    label: "Sentiment Score",
    color: "#10B981",
    formatter: (value) => value.toFixed(2),
  },
  socialFollowers: {
    label: "Social Followers",
    color: "#F59E0B",
    formatter: (value) => {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return Math.round(value).toString();
    },
  },
  contentPageCount: {
    label: "Content Pages",
    color: "#EC4899",
    formatter: (value) => Math.round(value).toString(),
  },
};

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  metric: MetricType;
}) {
  if (!active || !payload) return null;

  const config = METRIC_CONFIG[metric];

  return (
    <div className="bg-card-secondary border border-border/30 rounded-lg p-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="text-xs" style={{ color: entry.color }}>
              {entry.name}
            </span>
            <span className="text-xs font-medium text-foreground">
              {config.formatter ? config.formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompetitorTrendChart({
  brandId,
  metric = "geoScore",
  days = 30,
  competitorFilter,
  className,
}: CompetitorTrendChartProps) {
  const [data, setData] = React.useState<SnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [visibleCompetitors, setVisibleCompetitors] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetchSnapshotData();
  }, [brandId, days, competitorFilter]);

  const fetchSnapshotData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        brandId,
        days: days.toString(),
      });

      if (competitorFilter) {
        params.append("competitorName", competitorFilter);
      }

      const response = await fetch(`/api/competitive/snapshots?${params}`);
      if (!response.ok) throw new Error("Failed to fetch competitor snapshots");

      const result: SnapshotResponse = await response.json();
      setData(result);

      // Initialize all competitors as visible
      const competitors = new Set(result.snapshots.map((s) => s.competitorName));
      setVisibleCompetitors(competitors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Transform snapshots data for Recharts
  const chartData = React.useMemo(() => {
    if (!data || !data.snapshots) return [];

    // Group snapshots by date
    const dateMap = new Map<string, Record<string, number>>();

    data.snapshots.forEach((snapshot) => {
      if (!dateMap.has(snapshot.date)) {
        dateMap.set(snapshot.date, { date: snapshot.date });
      }

      const dateEntry = dateMap.get(snapshot.date)!;
      dateEntry[snapshot.competitorName] = snapshot[metric];
    });

    // Convert to array and sort by date
    return Array.from(dateMap.values()).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [data, metric]);

  // Get unique competitor names
  const competitors = React.useMemo(() => {
    if (!data || !data.snapshots) return [];

    const uniqueCompetitors = new Map<string, string>();
    data.snapshots.forEach((s) => {
      uniqueCompetitors.set(s.competitorName, s.competitorDomain);
    });

    return Array.from(uniqueCompetitors.entries()).map(([name, domain]) => ({
      name,
      domain,
    }));
  }, [data]);

  // Toggle competitor visibility
  const toggleCompetitor = (competitorName: string) => {
    setVisibleCompetitors((prev) => {
      const next = new Set(prev);
      if (next.has(competitorName)) {
        next.delete(competitorName);
      } else {
        next.add(competitorName);
      }
      return next;
    });
  };

  const metricConfig = METRIC_CONFIG[metric];

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading trend data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-error mb-2" />
            <p className="text-sm text-error font-medium">Failed to load trend data</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - No data available
  if (!data || chartData.length === 0) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <LineChartIcon className="w-8 h-8 mb-2" />
          <p className="text-sm font-medium">No trend data available</p>
          <p className="text-xs mt-1">Competitor data will appear once snapshots are recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-secondary overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Competitor Trends - {metricConfig.label}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data.timeRange.startDate} to {data.timeRange.endDate} ({days} days)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Tracked Competitors</p>
            <p className="text-sm font-semibold text-foreground">{data.summary.competitorsTracked}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={metricConfig.formatter}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "12px",
                }}
                onClick={(e) => toggleCompetitor(e.value)}
                iconType="line"
              />
              {competitors.map((comp, idx) => (
                <Line
                  key={comp.name}
                  type="monotone"
                  dataKey={comp.name}
                  stroke={COMPETITOR_COLORS[idx % COMPETITOR_COLORS.length]}
                  strokeWidth={2}
                  name={comp.name}
                  dot={false}
                  hide={!visibleCompetitors.has(comp.name)}
                  isAnimationActive={false} // Performance optimization for large datasets
                />
              ))}
              {chartData.length > 10 && (
                <Brush
                  dataKey="date"
                  height={30}
                  stroke={metricConfig.color}
                  fill="hsl(var(--card-secondary))"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        {metric === "geoScore" && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Avg GEO Score</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.round(data.summary.avgGeoScore)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Snapshots</p>
                <p className="text-lg font-semibold text-foreground">
                  {data.summary.totalSnapshots}
                </p>
              </div>
            </div>
          </div>
        )}

        {metric === "aiMentionCount" && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Avg AI Mentions</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.round(data.summary.avgMentionCount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Snapshots</p>
                <p className="text-lg font-semibold text-foreground">
                  {data.summary.totalSnapshots}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
