"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
} from "recharts";
import { TrendingUp, Target, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnifiedScore } from "@/hooks/useDashboard";
import { useSelectedBrand } from "@/stores";

// Export interface for API integration
export interface TrendDataPoint {
  month: string;
  score: number;
  annotation?: {
    label: string;
    type: "recommendation" | "milestone" | "improvement";
  };
}

interface GeoScoreTrendProps {
  data?: TrendDataPoint[];
  brandId?: string;
  targetScore?: number;
  showAnnotations?: boolean;
  height?: number;
  className?: string;
}

// Custom annotation dot component
function AnnotationDot({
  cx,
  cy,
  payload,
}: {
  cx?: number;
  cy?: number;
  payload?: TrendDataPoint;
}) {
  if (!cx || !cy || !payload?.annotation) return null;

  const iconColor = {
    recommendation: "#00E5CC",
    milestone: "#FFB020",
    improvement: "#8B5CF6",
  }[payload.annotation.type];

  return (
    <g>
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={12} fill={iconColor} fillOpacity={0.2} />
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r={6} fill={iconColor} stroke="#0A0D1A" strokeWidth={2} />
    </g>
  );
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: TrendDataPoint }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="glass-tooltip">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-primary">{data.score}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
      {data.annotation && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-warning" />
            <span className="text-xs text-muted-foreground">{data.annotation.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function GeoScoreTrend({
  data,
  brandId,
  targetScore,
  showAnnotations = true,
  height = 300,
  className,
}: GeoScoreTrendProps) {
  // Get brand from store if not provided via props
  const selectedBrand = useSelectedBrand();
  const effectiveBrandId = brandId || selectedBrand?.id;

  // Fetch unified score data when no data prop is provided
  const { data: scoreData, isLoading, isError, error } = useUnifiedScore(effectiveBrandId || "", {
    enabled: !data && !!effectiveBrandId,
  });

  // Transform API data to TrendDataPoint format
  const trendData = React.useMemo(() => {
    if (data) return data;
    if (!scoreData?.history) return [];

    return scoreData.history.map((h) => ({
      month: h.label,
      score: h.unified,
    }));
  }, [data, scoreData?.history]);

  const hasData = trendData.length > 0;

  // Calculate improvement stats
  const stats = React.useMemo(() => {
    if (trendData.length < 2) return { improvement: 0, startScore: 0, currentScore: 0 };
    const startScore = trendData[0].score;
    const currentScore = trendData[trendData.length - 1].score;
    const improvement = currentScore - startScore;
    return { improvement, startScore, currentScore };
  }, [trendData]);

  // Get score color based on value
  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#17CA29"; // Excellent - green
    if (score >= 60) return "#00E5CC"; // Good - cyan
    if (score >= 40) return "#FFB020"; // Average - yellow
    return "#EF4444"; // Poor - red
  };

  const lineColor = getScoreColor(stats.currentScore);

  // Loading state
  if (isLoading && !data) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              GEO Score Trend
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              3-month score progression
            </p>
          </div>
        </div>
        <div style={{ height }} className="w-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading trend data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError && !data) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              GEO Score Trend
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              3-month score progression
            </p>
          </div>
        </div>
        <div style={{ height }} className="w-full flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-error mb-3" />
            <p className="text-sm text-error font-medium">Failed to load trend data</p>
            <p className="text-xs text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Please try again later"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - No historical data available yet
  if (!hasData) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              GEO Score Trend
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              3-month score progression
            </p>
          </div>
        </div>
        <div style={{ height }} className="w-full flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-foreground font-medium">No data available yet</p>
            <p className="text-xs text-muted-foreground mt-1">Score history will appear here as data is collected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-secondary", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            GEO Score Trend
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            3-month score progression
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Improvement badge */}
          <div
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium",
              stats.improvement >= 0
                ? "bg-success/20 text-success"
                : "bg-error/20 text-error"
            )}
          >
            {stats.improvement >= 0 ? "+" : ""}
            {stats.improvement} pts
          </div>
          {/* Target indicator */}
          {targetScore && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Target className="h-4 w-4 text-warning" />
              <span>Target: {targetScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
          >
            <defs>
              {/* Gradient for line */}
              <linearGradient id="scoreLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#00E5CC" />
              </linearGradient>
              {/* Gradient for area under line */}
              <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(240, 25%, 20%)"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              stroke="hsl(220, 15%, 50%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />

            <YAxis
              domain={[0, 100]}
              stroke="hsl(220, 15%, 50%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={-10}
              ticks={[0, 25, 50, 75, 100]}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Target score reference line */}
            {targetScore && (
              <ReferenceLine
                y={targetScore}
                stroke="#FFB020"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Target: ${targetScore}`,
                  position: "right",
                  fill: "#FFB020",
                  fontSize: 11,
                }}
              />
            )}

            {/* Main score line */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#scoreLineGradient)"
              strokeWidth={3}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.annotation && showAnnotations) {
                  return <AnnotationDot cx={cx} cy={cy} payload={payload} />;
                }
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#00E5CC"
                    stroke="#0A0D1A"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{
                r: 8,
                fill: "#00E5CC",
                stroke: "#0A0D1A",
                strokeWidth: 2,
              }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Annotations legend */}
      {showAnnotations && (
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00E5CC]" />
            <span className="text-xs text-muted-foreground">Recommendation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
            <span className="text-xs text-muted-foreground">Improvement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FFB020]" />
            <span className="text-xs text-muted-foreground">Milestone</span>
          </div>
        </div>
      )}
    </div>
  );
}
