"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeoScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showGrade?: boolean;
  animated?: boolean;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

function getScoreCategory(score: number): {
  label: string;
  grade: string;
  colorClass: string;
  gradientId: string;
} {
  if (score >= 90) {
    return {
      label: "Excellent",
      grade: "A+",
      colorClass: "geo-score-excellent",
      gradientId: "gauge-gradient-excellent",
    };
  }
  if (score >= 80) {
    return {
      label: "Excellent",
      grade: "A",
      colorClass: "geo-score-excellent",
      gradientId: "gauge-gradient-excellent",
    };
  }
  if (score >= 70) {
    return {
      label: "Good",
      grade: "B+",
      colorClass: "geo-score-good",
      gradientId: "gauge-gradient-good",
    };
  }
  if (score >= 60) {
    return {
      label: "Good",
      grade: "B",
      colorClass: "geo-score-good",
      gradientId: "gauge-gradient-good",
    };
  }
  if (score >= 50) {
    return {
      label: "Average",
      grade: "C",
      colorClass: "geo-score-average",
      gradientId: "gauge-gradient-average",
    };
  }
  if (score >= 40) {
    return {
      label: "Below Average",
      grade: "D",
      colorClass: "geo-score-average",
      gradientId: "gauge-gradient-average",
    };
  }
  return {
    label: "Needs Work",
    grade: "F",
    colorClass: "geo-score-poor",
    gradientId: "gauge-gradient-poor",
  };
}

const sizeConfig = {
  sm: {
    width: 120,
    height: 120,
    strokeWidth: 8,
    fontSize: "text-2xl",
    gradeSize: "text-lg",
    labelSize: "text-xs",
    trendSize: "text-xs",
  },
  md: {
    width: 180,
    height: 180,
    strokeWidth: 12,
    fontSize: "text-5xl",
    gradeSize: "text-xl",
    labelSize: "text-sm",
    trendSize: "text-sm",
  },
  lg: {
    width: 240,
    height: 240,
    strokeWidth: 16,
    fontSize: "text-6xl",
    gradeSize: "text-2xl",
    labelSize: "text-base",
    trendSize: "text-base",
  },
};

export function GeoScoreGauge({
  score,
  maxScore = 100,
  size = "md",
  showLabel = true,
  showGrade = true,
  animated = true,
  trend,
  className,
}: GeoScoreGaugeProps) {
  const [displayScore, setDisplayScore] = React.useState(animated ? 0 : score);
  const { label, grade, colorClass, gradientId } = getScoreCategory(score);
  const config = sizeConfig[size];

  // Animate score on mount
  React.useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
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
      const currentScore = Math.round(startScore + (score - startScore) * eased);

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated]);

  // SVG calculations
  const centerX = config.width / 2;
  const centerY = config.height / 2;
  const radius = (config.width - config.strokeWidth) / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / maxScore) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Trend icon
  const TrendIcon = trend?.direction === "up"
    ? TrendingUp
    : trend?.direction === "down"
    ? TrendingDown
    : Minus;

  const trendColor = {
    up: "text-success",
    down: "text-error",
    neutral: "text-muted-foreground",
  }[trend?.direction || "neutral"];

  return (
    <div className={cn("geo-score-gauge", className)}>
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="transform -rotate-90"
      >
        {/* Gradient definitions */}
        <defs>
          {/* Excellent - Green gradient */}
          <linearGradient id="gauge-gradient-excellent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--success))" />
            <stop offset="100%" stopColor="hsl(128, 80%, 35%)" />
          </linearGradient>

          {/* Good - Primary purple gradient */}
          <linearGradient id="gauge-gradient-good" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent-blue))" />
          </linearGradient>

          {/* Average - Warning yellow gradient */}
          <linearGradient id="gauge-gradient-average" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--warning))" />
            <stop offset="100%" stopColor="hsl(30, 100%, 45%)" />
          </linearGradient>

          {/* Poor - Error red gradient */}
          <linearGradient id="gauge-gradient-poor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--error))" />
            <stop offset="100%" stopColor="hsl(0, 70%, 40%)" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
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
          opacity={0.3}
        />

        {/* Progress circle with gradient */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter="url(#glow)"
          className={animated ? "transition-gauge" : ""}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Score */}
        <span className={cn("geo-score-value font-bold", config.fontSize, colorClass)}>
          {displayScore}
        </span>

        {/* Letter Grade */}
        {showGrade && (
          <span className={cn("font-semibold -mt-1", config.gradeSize, colorClass)}>
            {grade}
          </span>
        )}

        {/* Label */}
        {showLabel && (
          <span className={cn("geo-score-label mt-1", config.labelSize)}>
            {label}
          </span>
        )}

        {/* Trend indicator */}
        {trend && (
          <div className={cn("flex items-center gap-1 mt-2", config.trendSize, trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="font-medium">
              {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
              {Math.abs(trend.value)} pts
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
