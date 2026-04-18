"use client";

import * as React from "react";
import { Bot, Loader2, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIPlatform, VisibilityScore } from "@/lib/ai/types";

// ============================================================================
// Types
// ============================================================================

interface PlatformCardProps {
  /** AI platform identifier */
  platform: AIPlatform;

  /** Visibility score data (0-100) */
  visibilityScore?: VisibilityScore;

  /** Loading state */
  isLoading?: boolean;

  /** Error message if analysis failed */
  error?: string | null;

  /** Click handler */
  onClick?: () => void;

  /** Additional CSS classes */
  className?: string;
}

interface PlatformConfig {
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  gradient: string;
}

// ============================================================================
// Constants
// ============================================================================

const PLATFORM_CONFIG: Record<AIPlatform, PlatformConfig> = {
  chatgpt: {
    name: "ChatGPT",
    color: "#10A37F",
    bgColor: "rgba(16, 163, 127, 0.1)",
    icon: "🤖",
    gradient: "linear-gradient(135deg, rgba(16, 163, 127, 0.2) 0%, rgba(16, 163, 127, 0.05) 100%)",
  },
  claude: {
    name: "Claude",
    color: "#D97757",
    bgColor: "rgba(217, 119, 87, 0.1)",
    icon: "🧠",
    gradient: "linear-gradient(135deg, rgba(217, 119, 87, 0.2) 0%, rgba(217, 119, 87, 0.05) 100%)",
  },
  gemini: {
    name: "Gemini",
    color: "#4285F4",
    bgColor: "rgba(66, 133, 244, 0.1)",
    icon: "✨",
    gradient: "linear-gradient(135deg, rgba(66, 133, 244, 0.2) 0%, rgba(66, 133, 244, 0.05) 100%)",
  },
  perplexity: {
    name: "Perplexity",
    color: "#20B8CD",
    bgColor: "rgba(32, 184, 205, 0.1)",
    icon: "🔍",
    gradient: "linear-gradient(135deg, rgba(32, 184, 205, 0.2) 0%, rgba(32, 184, 205, 0.05) 100%)",
  },
  grok: {
    name: "Grok",
    color: "#000000",
    bgColor: "rgba(0, 0, 0, 0.1)",
    icon: "𝕏",
    gradient: "linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.05) 100%)",
  },
  deepseek: {
    name: "DeepSeek",
    color: "#0066FF",
    bgColor: "rgba(0, 102, 255, 0.1)",
    icon: "🔬",
    gradient: "linear-gradient(135deg, rgba(0, 102, 255, 0.2) 0%, rgba(0, 102, 255, 0.05) 100%)",
  },
  copilot: {
    name: "Copilot",
    color: "#0078D4",
    bgColor: "rgba(0, 120, 212, 0.1)",
    icon: "🪁",
    gradient: "linear-gradient(135deg, rgba(0, 120, 212, 0.2) 0%, rgba(0, 120, 212, 0.05) 100%)",
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get score tier and corresponding color
 */
function getScoreTier(score: number): {
  tier: string;
  color: string;
  textColor: string;
} {
  if (score >= 80) {
    return {
      tier: "Excellent",
      color: "#10B981", // green
      textColor: "text-green-500",
    };
  } else if (score >= 60) {
    return {
      tier: "Good",
      color: "hsl(var(--color-info))", // blue
      textColor: "text-blue-500",
    };
  } else if (score >= 40) {
    return {
      tier: "Fair",
      color: "hsl(var(--color-warning))", // amber
      textColor: "text-amber-500",
    };
  } else if (score >= 20) {
    return {
      tier: "Poor",
      color: "hsl(var(--color-error))", // red
      textColor: "text-red-500",
    };
  } else {
    return {
      tier: "Very Low",
      color: "#6B7280", // gray
      textColor: "text-gray-500",
    };
  }
}

/**
 * Circular progress component for score visualization
 */
function CircularProgress({
  score,
  size = 100,
  strokeWidth = 8,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const { color } = getScoreTier(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 1s ease-out",
            filter: `drop-shadow(0 0 4px ${color}40)`,
          }}
        />
      </svg>
      {/* Center score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">
          {Math.round(progress)}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">
          /100
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function PlatformCard({
  platform,
  visibilityScore,
  isLoading = false,
  error = null,
  onClick,
  className,
}: PlatformCardProps) {
  const config = PLATFORM_CONFIG[platform];
  const score = visibilityScore?.total ?? 0;
  const { tier, textColor } = getScoreTier(score);
  const hasData = visibilityScore !== undefined;

  return (
    <div
      onClick={onClick}
      className={cn(
        "card-primary p-6 relative overflow-hidden",
        "transition-all duration-300",
        onClick && "cursor-pointer hover:scale-[1.02] hover:shadow-lg",
        className
      )}
      style={{
        background: `${config.gradient}, var(--card-primary)`,
      }}
    >
      {/* Platform Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: config.bgColor }}
          >
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {config.name}
            </h3>
            {hasData && !isLoading && !error && (
              <p className={cn("text-xs font-medium", textColor)}>
                {tier}
              </p>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        {!isLoading && !error && hasData && (
          <div className="flex items-center gap-1">
            {score >= 60 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-500" />
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col items-center justify-center py-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Analyzing...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-12 h-12 text-error" />
            <div>
              <p className="text-sm font-medium text-error mb-1">
                Analysis Failed
              </p>
              <p className="text-xs text-muted-foreground">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Success State with Score */}
        {!isLoading && !error && hasData && (
          <div className="flex flex-col items-center gap-4">
            {/* Circular Progress */}
            <CircularProgress score={score} size={100} strokeWidth={8} />

            {/* Score Breakdown */}
            {visibilityScore && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Mentions</span>
                  <span className="font-medium text-foreground">
                    {visibilityScore.breakdown.mentionCount}/40
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Citations</span>
                  <span className="font-medium text-foreground">
                    {visibilityScore.breakdown.citationQuality}/30
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Prominence</span>
                  <span className="font-medium text-foreground">
                    {visibilityScore.breakdown.prominence}/30
                  </span>
                </div>
              </div>
            )}

            {/* Metrics Summary */}
            {visibilityScore && (
              <div className="w-full pt-3 border-t border-border/50">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Mentions
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {visibilityScore.metrics.totalMentions}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Citations
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {visibilityScore.metrics.totalCitations}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && !hasData && (
          <div className="flex flex-col items-center gap-3 text-center py-6">
            <Bot className="w-12 h-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No data available
            </p>
          </div>
        )}
      </div>

      {/* Platform Color Accent Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: config.color }}
      />
    </div>
  );
}
