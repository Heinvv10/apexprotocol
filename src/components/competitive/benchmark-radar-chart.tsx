"use client";

import * as React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Types from benchmarking service
interface RadarChartData {
  labels: string[];
  brandData: number[];
  averageData: number[];
  competitorData: { name: string; data: number[] }[];
}

interface BenchmarkRadarChartProps {
  brandId: string;
  brandName: string;
  className?: string;
}

// Color palette for competitors
const COMPETITOR_COLORS = [
  "hsl(var(--color-accent-purple))", // Purple
  "hsl(var(--color-warning))", // Amber
  "hsl(var(--color-accent-pink))", // Pink
  "#06B6D4", // Cyan
  "#10B981", // Emerald
];

// Custom tooltip component
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="bg-card-secondary border border-border/30 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-xs">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Delta badge
function DeltaBadge({ delta }: { delta: number }) {
  const getConfig = () => {
    if (delta > 5) return { icon: TrendingUp, color: "text-success", label: `+${delta}` };
    if (delta < -5) return { icon: TrendingDown, color: "text-error", label: `${delta}` };
    return { icon: Minus, color: "text-muted-foreground", label: `${delta >= 0 ? "+" : ""}${delta}` };
  };

  const { icon: Icon, color, label } = getConfig();

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export function BenchmarkRadarChart({ brandId, brandName, className }: BenchmarkRadarChartProps) {
  const [data, setData] = React.useState<RadarChartData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showCompetitors, setShowCompetitors] = React.useState(true);

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
      setData(result.benchmark?.radarData || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Transform data for Recharts
  const chartData = React.useMemo(() => {
    if (!data) return [];

    return data.labels.map((label, index) => {
      const item: Record<string, string | number> = {
        metric: label,
        [brandName]: data.brandData[index],
        "Avg Competitor": data.averageData[index],
      };

      // Add individual competitors if enabled
      if (showCompetitors) {
        data.competitorData.forEach((comp) => {
          item[comp.name] = comp.data[index];
        });
      }

      return item;
    });
  }, [data, brandName, showCompetitors]);

  // Calculate overall deltas
  const deltas = React.useMemo(() => {
    if (!data) return null;

    const brandAvg = data.brandData.reduce((a, b) => a + b, 0) / data.brandData.length;
    const compAvg = data.averageData.reduce((a, b) => a + b, 0) / data.averageData.length;

    return {
      overall: Math.round(brandAvg - compAvg),
      byMetric: data.labels.map((label, i) => ({
        label,
        delta: Math.round(data.brandData[i] - data.averageData[i]),
      })),
    };
  }, [data]);

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

  return (
    <div className={cn("card-secondary overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Competitive Benchmark
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {brandName} vs competitors
          </p>
        </div>
        {deltas && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Overall:</span>
            <DeltaBadge delta={deltas.overall} />
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "#6B7280", fontSize: 10 }}
                tickCount={5}
                stroke="rgba(255,255,255,0.1)"
              />

              {/* Brand radar */}
              <Radar
                name={brandName}
                dataKey={brandName}
                stroke="hsl(var(--color-primary))"
                fill="hsl(var(--color-primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />

              {/* Average competitor radar */}
              <Radar
                name="Avg Competitor"
                dataKey="Avg Competitor"
                stroke="#6B7280"
                fill="#6B7280"
                fillOpacity={0.1}
                strokeWidth={2}
                strokeDasharray="5 5"
              />

              {/* Individual competitors */}
              {showCompetitors &&
                data.competitorData.map((comp, i) => (
                  <Radar
                    key={comp.name}
                    name={comp.name}
                    dataKey={comp.name}
                    stroke={COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]}
                    fill={COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]}
                    fillOpacity={0.05}
                    strokeWidth={1}
                  />
                ))}

              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                iconType="line"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center mt-2">
          <button
            onClick={() => setShowCompetitors(!showCompetitors)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCompetitors ? "Hide individual competitors" : "Show individual competitors"}
          </button>
        </div>
      </div>

      {/* Metric deltas footer */}
      {deltas && (
        <div className="border-t border-border/30 p-3">
          <div className="grid grid-cols-5 gap-2">
            {deltas.byMetric.map(({ label, delta }) => (
              <div key={label} className="text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {label}
                </div>
                <DeltaBadge delta={delta} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
