"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus, Search, Bot, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UnifiedScoreGaugeProps {
  overall: number;
  seoScore: number;
  geoScore: number;
  aeoScore: number;
  grade?: string;
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
  animated?: boolean;
  trend?: {
    value: number;
    direction: "up" | "down" | "stable";
  };
  className?: string;
}

const sizeConfig = {
  sm: {
    width: 140,
    height: 140,
    strokeWidth: 10,
    fontSize: "text-3xl",
    gradeSize: "text-sm",
    labelSize: "text-xs",
    breakdownSize: "text-xs",
  },
  md: {
    width: 200,
    height: 200,
    strokeWidth: 14,
    fontSize: "text-5xl",
    gradeSize: "text-lg",
    labelSize: "text-sm",
    breakdownSize: "text-sm",
  },
  lg: {
    width: 260,
    height: 260,
    strokeWidth: 18,
    fontSize: "text-6xl",
    gradeSize: "text-xl",
    labelSize: "text-base",
    breakdownSize: "text-base",
  },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "#22C55E"; // Green
  if (score >= 60) return "#00E5CC"; // Cyan
  if (score >= 40) return "#F59E0B"; // Amber
  return "#EF4444"; // Red
}

function getGradeFromScore(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 75) return "B+";
  if (score >= 65) return "B";
  if (score >= 55) return "C";
  if (score >= 45) return "D";
  return "F";
}

function getStatusText(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Moderate";
  if (score >= 50) return "Fair";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

export function UnifiedScoreGauge({
  overall,
  seoScore,
  geoScore,
  aeoScore,
  grade,
  size = "md",
  showBreakdown = true,
  animated = true,
  trend,
  className,
}: UnifiedScoreGaugeProps) {
  const [displayScore, setDisplayScore] = React.useState(animated ? 0 : overall);
  const config = sizeConfig[size];
  const scoreColor = getScoreColor(overall);
  const displayGrade = grade || getGradeFromScore(overall);
  const statusText = getStatusText(overall);

  // Animate score on mount
  React.useEffect(() => {
    if (!animated) {
      setDisplayScore(overall);
      return;
    }

    const duration = 800;
    const startTime = Date.now();
    const startScore = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-quart)
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentScore = Math.round(startScore + (overall - startScore) * eased);

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [overall, animated]);

  // SVG calculations
  const centerX = config.width / 2;
  const centerY = config.height / 2;
  const radius = (config.width - config.strokeWidth) / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Trend icon
  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
      ? TrendingDown
      : Minus;

  const trendColor = {
    up: "text-success",
    down: "text-error",
    stable: "text-muted-foreground",
  }[trend?.direction || "stable"];

  // Score breakdown components
  const components = [
    { label: "SEO", score: seoScore, icon: Search, color: "#3B82F6", weight: "40%" },
    { label: "GEO", score: geoScore, icon: Bot, color: "#00E5CC", weight: "35%" },
    { label: "AEO", score: aeoScore, icon: MessageSquare, color: "#8B5CF6", weight: "25%" },
  ];

  return (
    <div className={cn("unified-score-gauge flex flex-col items-center gap-4", className)}>
      {/* Main Gauge */}
      <div className="relative">
        <svg
          width={config.width}
          height={config.height}
          viewBox={`0 0 ${config.width} ${config.height}`}
          className="transform -rotate-90"
        >
          <defs>
            {/* Dynamic gradient based on score */}
            <linearGradient id="unified-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={scoreColor} />
              <stop offset="100%" stopColor={scoreColor} stopOpacity={0.6} />
            </linearGradient>

            {/* Glow filter */}
            <filter id="unified-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle (track) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            opacity={0.2}
          />

          {/* Progress circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="url(#unified-gauge-gradient)"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#unified-glow)"
            className={animated ? "transition-all duration-700 ease-out" : ""}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Score */}
          <span
            className={cn("font-bold", config.fontSize)}
            style={{ color: scoreColor }}
          >
            {displayScore}
          </span>

          {/* Grade */}
          <span
            className={cn("font-semibold -mt-1", config.gradeSize)}
            style={{ color: scoreColor }}
          >
            {displayGrade}
          </span>

          {/* Status Label */}
          <span className={cn("text-muted-foreground mt-1", config.labelSize)}>
            {statusText}
          </span>

          {/* Trend indicator */}
          {trend && (
            <div className={cn("flex items-center gap-1 mt-1", config.labelSize, trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span className="font-medium">
                {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
                {Math.abs(trend.value)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      {showBreakdown && (
        <TooltipProvider>
          <div className="flex items-center gap-4">
            {components.map((comp) => (
              <Tooltip key={comp.label}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 cursor-help">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${comp.color}20` }}
                    >
                      <comp.icon className="w-4 h-4" style={{ color: comp.color }} />
                    </div>
                    <span className={cn("font-semibold", config.breakdownSize)}>
                      {comp.score}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{comp.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{comp.label} Score</p>
                  <p className="text-xs text-muted-foreground">
                    Weight: {comp.weight} of total
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * Compact version for cards
 */
export function UnifiedScoreBadge({
  overall,
  className,
}: {
  overall: number;
  className?: string;
}) {
  const grade = getGradeFromScore(overall);
  const color = getScoreColor(overall);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        className
      )}
      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
    >
      <span className="font-bold" style={{ color }}>
        {overall}
      </span>
      <span className="text-xs font-medium text-muted-foreground">
        Grade {grade}
      </span>
    </div>
  );
}

/**
 * Mini inline score indicator
 */
export function UnifiedScoreInline({
  overall,
  showTrend,
  trend,
  className,
}: {
  overall: number;
  showTrend?: boolean;
  trend?: { value: number; direction: "up" | "down" | "stable" };
  className?: string;
}) {
  const color = getScoreColor(overall);

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <span className="font-bold text-lg" style={{ color }}>
        {overall}
      </span>
      {showTrend && trend && (
        <span
          className={cn(
            "text-xs",
            trend.direction === "up"
              ? "text-success"
              : trend.direction === "down"
              ? "text-error"
              : "text-muted-foreground"
          )}
        >
          {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}
          {Math.abs(trend.value)}
        </span>
      )}
    </div>
  );
}
