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
  Legend,
} from "recharts";
import { TrendingUp, Target, Calendar, Search, Bot, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ScoreTrendDataPoint {
  date: string;
  label: string;
  unified: number;
  seo?: number;
  geo?: number;
  aeo?: number;
  event?: {
    type: "recommendation" | "milestone" | "improvement" | "audit";
    label: string;
  };
}

interface ScoreTrendProps {
  data?: ScoreTrendDataPoint[];
  targetScore?: number;
  showComponents?: boolean;
  period?: "7d" | "30d" | "90d" | "1y";
  onPeriodChange?: (period: "7d" | "30d" | "90d" | "1y") => void;
  height?: number;
  className?: string;
}

// Component colors
const SCORE_COLORS = {
  unified: "#00E5CC",
  seo: "#3B82F6",
  geo: "#00E5CC",
  aeo: "#8B5CF6",
};

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
  showComponents,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string; payload?: ScoreTrendDataPoint }>;
  label?: string;
  showComponents?: boolean;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload as ScoreTrendDataPoint;

  return (
    <div className="glass-tooltip">
      <p className="font-semibold text-foreground mb-2">{label}</p>

      {/* Unified Score */}
      <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-border">
        <span className="text-sm text-muted-foreground">Digital Presence</span>
        <span className="text-xl font-bold text-primary">{data.unified}</span>
      </div>

      {/* Component breakdown */}
      {showComponents && (data.seo !== undefined || data.geo !== undefined || data.aeo !== undefined) && (
        <div className="space-y-1.5">
          {data.seo !== undefined && (
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3" style={{ color: SCORE_COLORS.seo }} />
                <span className="text-muted-foreground">SEO</span>
              </div>
              <span className="font-medium">{data.seo}</span>
            </div>
          )}
          {data.geo !== undefined && (
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Bot className="h-3 w-3" style={{ color: SCORE_COLORS.geo }} />
                <span className="text-muted-foreground">GEO</span>
              </div>
              <span className="font-medium">{data.geo}</span>
            </div>
          )}
          {data.aeo !== undefined && (
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3" style={{ color: SCORE_COLORS.aeo }} />
                <span className="text-muted-foreground">AEO</span>
              </div>
              <span className="font-medium">{data.aeo}</span>
            </div>
          )}
        </div>
      )}

      {/* Event annotation */}
      {data.event && (
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">{data.event.label}</span>
        </div>
      )}
    </div>
  );
}

export function ScoreTrend({
  data,
  targetScore,
  showComponents = true,
  period = "30d",
  onPeriodChange,
  height = 350,
  className,
}: ScoreTrendProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState(period);
  const [showBreakdown, setShowBreakdown] = React.useState(showComponents);

  const trendData = data || [];
  const hasData = trendData.length > 0;

  // Calculate stats
  const stats = React.useMemo(() => {
    if (trendData.length < 2)
      return { improvement: 0, startScore: 0, currentScore: 0 };
    const startScore = trendData[0].unified;
    const currentScore = trendData[trendData.length - 1].unified;
    const improvement = currentScore - startScore;
    return { improvement, startScore, currentScore };
  }, [trendData]);

  const handlePeriodChange = (newPeriod: "7d" | "30d" | "90d" | "1y") => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  // Period buttons
  const periods = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
    { value: "1y", label: "1Y" },
  ] as const;

  // Empty state
  if (!hasData) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Digital Presence Trend
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Unified score over time
            </p>
          </div>
        </div>
        <div style={{ height }} className="w-full flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No trend data available</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Score history will appear as data is collected
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-secondary", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Digital Presence Trend
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            SEO + GEO + AEO unified score over time
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Improvement badge */}
          {stats.improvement !== 0 && (
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
          )}

          {/* Target indicator */}
          {targetScore && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Target className="h-4 w-4 text-warning" />
              <span>Target: {targetScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Period selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={selectedPeriod === p.value ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => handlePeriodChange(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Component toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowBreakdown(!showBreakdown)}
        >
          {showBreakdown ? "Hide" : "Show"} Components
        </Button>
      </div>

      {/* Chart */}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
          >
            <defs>
              {/* Gradients for each line */}
              <linearGradient id="unifiedGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#00E5CC" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(240, 25%, 20%)"
              vertical={false}
            />

            <XAxis
              dataKey="label"
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

            <Tooltip
              content={<CustomTooltip showComponents={showBreakdown} />}
            />

            {/* Target score reference line */}
            {targetScore && (
              <ReferenceLine
                y={targetScore}
                stroke="#F59E0B"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            )}

            {/* Component lines (optional) */}
            {showBreakdown && (
              <>
                <Line
                  type="monotone"
                  dataKey="seo"
                  stroke={SCORE_COLORS.seo}
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  dot={false}
                  activeDot={{ r: 4, fill: SCORE_COLORS.seo }}
                />
                <Line
                  type="monotone"
                  dataKey="geo"
                  stroke={SCORE_COLORS.geo}
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  dot={false}
                  activeDot={{ r: 4, fill: SCORE_COLORS.geo }}
                />
                <Line
                  type="monotone"
                  dataKey="aeo"
                  stroke={SCORE_COLORS.aeo}
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  dot={false}
                  activeDot={{ r: 4, fill: SCORE_COLORS.aeo }}
                />
              </>
            )}

            {/* Main unified score line */}
            <Line
              type="monotone"
              dataKey="unified"
              stroke="url(#unifiedGradient)"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "#00E5CC",
                stroke: "#0A0D1A",
                strokeWidth: 2,
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

      {/* Legend */}
      {showBreakdown && (
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-green-500" />
            <span className="text-xs text-muted-foreground">Unified</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: SCORE_COLORS.seo }}
            />
            <span className="text-xs text-muted-foreground">SEO</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: SCORE_COLORS.geo }}
            />
            <span className="text-xs text-muted-foreground">GEO</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: SCORE_COLORS.aeo }}
            />
            <span className="text-xs text-muted-foreground">AEO</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact score spark line for cards
 */
export function ScoreSparkline({
  data,
  width = 100,
  height = 30,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const lastValue = data[data.length - 1];
  const firstValue = data[0];
  const trend = lastValue >= firstValue ? "#22C55E" : "#EF4444";

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        stroke={trend}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
