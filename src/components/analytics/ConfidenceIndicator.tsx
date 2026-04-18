"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ConfidenceIndicatorProps {
  /**
   * Confidence value (0-1 or 0-100)
   * Will be normalized to 0-100 percentage
   */
  confidence: number;
  /**
   * Optional explanation text shown in tooltip
   */
  explanation?: string;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Show the percentage label
   */
  showLabel?: boolean;
  /**
   * Show info icon for tooltip
   */
  showIcon?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get color theme based on confidence percentage
 * >80% = green, 70-80% = yellow, <70% = red
 */
function getConfidenceTheme(percentage: number): {
  color: string;
  bgColor: string;
  label: string;
} {
  if (percentage > 80) {
    return {
      color: "#17CA29", // Green
      bgColor: "rgba(23, 202, 41, 0.1)",
      label: "High Confidence",
    };
  }
  if (percentage >= 70) {
    return {
      color: "#FFB020", // Yellow
      bgColor: "rgba(255, 176, 32, 0.1)",
      label: "Medium Confidence",
    };
  }
  return {
    color: "hsl(var(--color-error))", // Red
    bgColor: "rgba(239, 68, 68, 0.1)",
    label: "Low Confidence",
  };
}

const sizeConfig = {
  sm: {
    width: 60,
    height: 60,
    strokeWidth: 4,
    fontSize: "text-sm",
    iconSize: "h-3 w-3",
  },
  md: {
    width: 80,
    height: 80,
    strokeWidth: 6,
    fontSize: "text-base",
    iconSize: "h-4 w-4",
  },
  lg: {
    width: 120,
    height: 120,
    strokeWidth: 8,
    fontSize: "text-xl",
    iconSize: "h-5 w-5",
  },
};

export function ConfidenceIndicator({
  confidence,
  explanation,
  size = "md",
  showLabel = true,
  showIcon = true,
  className,
}: ConfidenceIndicatorProps) {
  // Normalize confidence to 0-100 percentage
  const percentage = confidence > 1 ? confidence : confidence * 100;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const theme = getConfidenceTheme(clampedPercentage);
  const config = sizeConfig[size];

  // SVG calculations for circular progress
  const centerX = config.width / 2;
  const centerY = config.height / 2;
  const radius = (config.width - config.strokeWidth) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  const indicatorContent = (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      {/* Circular Progress SVG */}
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <svg
          width={config.width}
          height={config.height}
          viewBox={`0 0 ${config.width} ${config.height}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
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
            stroke={theme.color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", config.fontSize)} style={{ color: theme.color }}>
            {clampedPercentage.toFixed(0)}%
          </span>
          {showIcon && explanation && (
            <Info className={cn("text-muted-foreground mt-0.5", config.iconSize)} />
          )}
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <span className="text-xs text-muted-foreground mt-1 text-center">
          {theme.label}
        </span>
      )}
    </div>
  );

  // Wrap with tooltip if explanation provided
  if (explanation) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            {indicatorContent}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return indicatorContent;
}
