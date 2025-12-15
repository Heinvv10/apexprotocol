"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIVisibilityPulseProps {
  score: number;
  trend?: {
    value: number;
    period: string;
  };
  className?: string;
}

export function AIVisibilityPulse({
  score,
  trend,
  className,
}: AIVisibilityPulseProps) {
  const [displayScore, setDisplayScore] = React.useState(0);

  // Animate score on mount
  React.useEffect(() => {
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentScore = Math.round(score * eased);

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // SVG calculations for semi-circle gauge
  const width = 200;
  const height = 120;
  const strokeWidth = 12;
  const centerX = width / 2;
  const centerY = height;
  const radius = 80;

  // Calculate arc parameters (semi-circle)
  const circumference = Math.PI * radius;
  const progress = (displayScore / 100) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isPositive = trend && trend.value >= 0;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Gauge */}
      <div className="relative" style={{ width, height: height + 20 }}>
        <svg width={width} height={height + 20} viewBox={`0 0 ${width} ${height + 20}`}>
          {/* Gradient definition */}
          <defs>
            <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent-purple))" />
            </linearGradient>
            <filter id="pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke="hsl(var(--border-subtle))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke="url(#pulse-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#pulse-glow)"
            className="transition-all duration-[800ms] ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="metric-large">{displayScore}%</span>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium mt-1",
              isPositive ? "trend-up" : "trend-down"
            )}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{isPositive ? "+" : ""}{trend.value}% {trend.period}</span>
            </div>
          )}
        </div>
      </div>

      {/* Label */}
      <p className="text-sm font-medium text-muted-foreground mt-2">
        AI Visibility Pulse
      </p>
    </div>
  );
}
