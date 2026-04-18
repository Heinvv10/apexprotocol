"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type VelocityTrend = "up" | "stable" | "down";

export interface CitationVelocityCardProps {
  platform: string;
  emoji: string;
  scores: number[]; // Last 3 data points for sparkline
  trend: VelocityTrend;
  className?: string;
}

/**
 * Generate SVG sparkline path from score points
 */
function generateSparklinePath(
  scores: number[],
  width: number,
  height: number,
  padding: number = 4
): string {
  if (scores.length === 0) return "";

  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  // Normalize scores to fit within height
  const maxScore = Math.max(...scores, 100);
  const minScore = Math.min(...scores, 0);
  const range = maxScore - minScore || 1;

  const points = scores.map((score, index) => {
    const x = padding + (index / (scores.length - 1 || 1)) * effectiveWidth;
    const y = padding + effectiveHeight - ((score - minScore) / range) * effectiveHeight;
    return `${x},${y}`;
  });

  return `M ${points.join(" L ")}`;
}

/**
 * Get trend color classes
 */
function getTrendColor(trend: VelocityTrend): {
  text: string;
  stroke: string;
  bg: string;
} {
  switch (trend) {
    case "up":
      return {
        text: "text-success",
        stroke: "hsl(var(--color-success))",
        bg: "bg-success/10",
      };
    case "down":
      return {
        text: "text-error",
        stroke: "hsl(var(--color-error))",
        bg: "bg-error/10",
      };
    default:
      return {
        text: "text-muted-foreground",
        stroke: "#6B7280",
        bg: "bg-muted/10",
      };
  }
}

/**
 * Trend icon component
 */
function TrendIcon({ trend, className }: { trend: VelocityTrend; className?: string }) {
  const colors = getTrendColor(trend);

  switch (trend) {
    case "up":
      return <TrendingUp className={cn("w-4 h-4", colors.text, className)} />;
    case "down":
      return <TrendingDown className={cn("w-4 h-4", colors.text, className)} />;
    default:
      return <Minus className={cn("w-4 h-4", colors.text, className)} />;
  }
}

/**
 * Citation Velocity Card
 * Shows citation trend for a single platform with mini sparkline
 */
export function CitationVelocityCard({
  platform,
  emoji,
  scores,
  trend,
  className,
}: CitationVelocityCardProps) {
  const colors = getTrendColor(trend);
  const latestScore = scores.length > 0 ? scores[scores.length - 1] : 0;

  // Sparkline dimensions
  const sparklineWidth = 48;
  const sparklineHeight = 24;

  // Generate sparkline path
  const sparklinePath =
    scores.length >= 2
      ? generateSparklinePath(scores, sparklineWidth, sparklineHeight)
      : "";

  return (
    <Card
      className={cn(
        "card-tertiary p-4 hover:border-primary/30 transition-colors",
        className
      )}
    >
      {/* Header: Platform name and emoji */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{emoji}</span>
        <span className="text-sm font-medium text-muted-foreground truncate">
          {platform}
        </span>
      </div>

      {/* Score and trend row */}
      <div className="flex items-center justify-between">
        {/* Latest score */}
        <div className="flex items-baseline gap-1">
          <span
            className={cn("text-2xl font-bold", colors.text)}
            style={trend === "stable" ? { color: "var(--foreground)" } : undefined}
          >
            {latestScore}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>

        {/* Sparkline + trend indicator */}
        <div className="flex items-center gap-2">
          {/* Mini sparkline SVG */}
          {scores.length >= 2 && (
            <svg
              width={sparklineWidth}
              height={sparklineHeight}
              className="overflow-visible"
              aria-hidden="true"
            >
              {/* Sparkline path */}
              <path
                d={sparklinePath}
                fill="none"
                stroke={colors.stroke}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Latest point dot */}
              {scores.length > 0 && (
                <circle
                  cx={sparklineWidth - 4}
                  cy={
                    4 +
                    (sparklineHeight - 8) -
                    ((latestScore - Math.min(...scores, 0)) /
                      (Math.max(...scores, 100) - Math.min(...scores, 0) || 1)) *
                      (sparklineHeight - 8)
                  }
                  r={3}
                  fill={colors.stroke}
                />
              )}
            </svg>
          )}

          {/* Trend icon */}
          <TrendIcon trend={trend} />
        </div>
      </div>

      {/* Trend label */}
      <div className="mt-2 pt-2 border-t border-border/30">
        <span className={cn("text-xs", colors.text)}>
          {trend === "up" && "Trending up"}
          {trend === "down" && "Trending down"}
          {trend === "stable" && "Stable"}
        </span>
      </div>
    </Card>
  );
}

export default CitationVelocityCard;
