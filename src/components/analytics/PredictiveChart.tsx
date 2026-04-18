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
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { TrendingUp, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Export interface for API integration
export interface PredictiveDataPoint {
  month: string;
  actual?: number;
  predicted?: number;
  confidenceLower?: number;
  confidenceUpper?: number;
  isPrediction?: boolean;
}

interface PredictiveChartProps {
  data?: PredictiveDataPoint[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  height?: number;
  className?: string;
  showConfidenceBands?: boolean;
  showLegend?: boolean;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload: PredictiveDataPoint }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isPrediction = data.isPrediction;

  return (
    <div className="glass-tooltip">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <div className="space-y-2">
        {data.actual !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Actual:</span>
            <span className="text-lg font-bold text-primary">{data.actual.toFixed(1)}</span>
          </div>
        )}
        {data.predicted !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Predicted:</span>
            <span className="text-lg font-bold text-warning">{data.predicted.toFixed(1)}</span>
          </div>
        )}
        {data.confidenceLower !== undefined && data.confidenceUpper !== undefined && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3 w-3 text-warning" />
              <span className="text-xs text-muted-foreground">Confidence Range</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {data.confidenceLower.toFixed(1)} - {data.confidenceUpper.toFixed(1)}
            </div>
          </div>
        )}
      </div>
      {isPrediction && (
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-xs text-warning italic">Forecast</span>
        </div>
      )}
    </div>
  );
}

// Custom legend
function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-6 pt-4 border-t border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-primary" />
        <span className="text-xs text-muted-foreground">Historical Data</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-warning border-t-2 border-dashed border-warning" />
        <span className="text-xs text-muted-foreground">Predicted Data</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-3 bg-warning/20 rounded" />
        <span className="text-xs text-muted-foreground">Confidence Band</span>
      </div>
    </div>
  );
}

export function PredictiveChart({
  data = [],
  title = "Predictive Analytics",
  description = "Historical data and future predictions",
  isLoading = false,
  isError = false,
  error = null,
  height = 400,
  className,
  showConfidenceBands = true,
  showLegend = true,
}: PredictiveChartProps) {
  const hasData = data.length > 0;

  // Calculate stats
  const stats = React.useMemo(() => {
    const historicalPoints = data.filter((d) => d.actual !== undefined);
    const predictedPoints = data.filter((d) => d.predicted !== undefined);

    if (historicalPoints.length === 0 && predictedPoints.length === 0) {
      return { lastActual: 0, lastPredicted: 0, changePercent: 0 };
    }

    const lastActual =
      historicalPoints.length > 0
        ? historicalPoints[historicalPoints.length - 1].actual || 0
        : 0;

    const lastPredicted =
      predictedPoints.length > 0
        ? predictedPoints[predictedPoints.length - 1].predicted || 0
        : lastActual;

    const changePercent =
      lastActual > 0 ? ((lastPredicted - lastActual) / lastActual) * 100 : 0;

    return { lastActual, lastPredicted, changePercent };
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <div style={{ height }} className="w-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading predictive data...</p>
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
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <div style={{ height }} className="w-full flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-error mb-3" />
            <p className="text-sm text-error font-medium">Failed to load predictive data</p>
            <p className="text-xs text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Please try again later"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <div style={{ height }} className="w-full flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-foreground font-medium">No data available yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Predictive data will appear here once available
            </p>
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
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        {/* Prediction change badge */}
        {stats.changePercent !== 0 && (
          <div
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium",
              stats.changePercent >= 0
                ? "bg-success/20 text-success"
                : "bg-error/20 text-error"
            )}
          >
            {stats.changePercent >= 0 ? "+" : ""}
            {stats.changePercent.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
            <defs>
              {/* Gradient for historical line */}
              <linearGradient id="historicalGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--color-accent-purple))" />
                <stop offset="100%" stopColor="hsl(var(--color-primary))" />
              </linearGradient>

              {/* Gradient for predicted line */}
              <linearGradient id="predictedGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFB020" />
                <stop offset="100%" stopColor="hsl(var(--color-error))" />
              </linearGradient>

              {/* Gradient for confidence band */}
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFB020" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FFB020" stopOpacity={0.05} />
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
              stroke="hsl(220, 15%, 50%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Confidence band area */}
            {showConfidenceBands && (
              <Area
                type="monotone"
                dataKey="confidenceUpper"
                stroke="none"
                fill="url(#confidenceGradient)"
                fillOpacity={1}
                isAnimationActive={true}
                animationDuration={800}
              />
            )}

            {showConfidenceBands && (
              <Area
                type="monotone"
                dataKey="confidenceLower"
                stroke="none"
                fill="#0A0D1A"
                fillOpacity={1}
                isAnimationActive={true}
                animationDuration={800}
              />
            )}

            {/* Historical data line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="url(#historicalGradient)"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "hsl(var(--color-primary))",
                stroke: "#0A0D1A",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 8,
                fill: "hsl(var(--color-primary))",
                stroke: "#0A0D1A",
                strokeWidth: 2,
              }}
              connectNulls={false}
              animationDuration={800}
            />

            {/* Predicted data line (dashed) */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#FFB020"
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={{
                r: 4,
                fill: "#FFB020",
                stroke: "#0A0D1A",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 8,
                fill: "#FFB020",
                stroke: "#0A0D1A",
                strokeWidth: 2,
              }}
              connectNulls={false}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {showLegend && <CustomLegend />}
    </div>
  );
}
