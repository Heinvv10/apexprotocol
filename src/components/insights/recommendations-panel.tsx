"use client";

import * as React from "react";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Target,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentAnalysis } from "@/stores/insights-store";
import type { AIPlatform, Recommendation } from "@/lib/ai/types";

// ============================================================================
// Types
// ============================================================================

interface RecommendationsPanelProps {
  /** Additional CSS classes */
  className?: string;
}

interface PlatformConfig {
  key: AIPlatform;
  name: string;
  color: string;
  icon: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  platformColor: string;
}

interface PlatformRecommendationsProps {
  platformConfig: PlatformConfig;
  recommendations: Recommendation[];
}

// ============================================================================
// Constants
// ============================================================================

const PLATFORMS: PlatformConfig[] = [
  { key: "chatgpt", name: "ChatGPT", color: "#10A37F", icon: "🤖" },
  { key: "claude", name: "Claude", color: "#D97757", icon: "🧠" },
  { key: "gemini", name: "Gemini", color: "#4285F4", icon: "✨" },
  { key: "perplexity", name: "Perplexity", color: "#20B8CD", icon: "🔍" },
];

const PRIORITY_CONFIG: Record<
  1 | 2 | 3 | 4 | 5,
  { label: string; color: string; textColor: string }
> = {
  1: {
    label: "Critical",
    color: "#EF4444",
    textColor: "text-red-500",
  },
  2: {
    label: "High",
    color: "#F59E0B",
    textColor: "text-amber-500",
  },
  3: {
    label: "Medium",
    color: "#3B82F6",
    textColor: "text-blue-500",
  },
  4: {
    label: "Low",
    color: "#10B981",
    textColor: "text-green-500",
  },
  5: {
    label: "Optional",
    color: "#6B7280",
    textColor: "text-gray-500",
  },
};

const IMPACT_CONFIG: Record<
  "high" | "medium" | "low",
  { label: string; color: string; icon: React.ReactNode }
> = {
  high: {
    label: "High Impact",
    color: "#10B981",
    icon: <TrendingUp className="w-3 h-3" />,
  },
  medium: {
    label: "Medium Impact",
    color: "#3B82F6",
    icon: <Target className="w-3 h-3" />,
  },
  low: {
    label: "Low Impact",
    color: "#6B7280",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

const DIFFICULTY_CONFIG: Record<
  "easy" | "moderate" | "hard",
  { label: string; color: string; icon: React.ReactNode }
> = {
  easy: {
    label: "Easy",
    color: "#10B981",
    icon: <Zap className="w-3 h-3" />,
  },
  moderate: {
    label: "Moderate",
    color: "#F59E0B",
    icon: <Target className="w-3 h-3" />,
  },
  hard: {
    label: "Hard",
    color: "#EF4444",
    icon: <Clock className="w-3 h-3" />,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sort recommendations by priority
 */
function sortRecommendationsByPriority(
  recommendations: Recommendation[]
): Recommendation[] {
  return [...recommendations].sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Individual recommendation card
 */
function RecommendationCard({
  recommendation,
  platformColor,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const priorityConfig = PRIORITY_CONFIG[recommendation.priority];
  const impactConfig = IMPACT_CONFIG[recommendation.impact];
  const difficultyConfig = DIFFICULTY_CONFIG[recommendation.difficulty];

  return (
    <div className="card-secondary rounded-lg overflow-hidden border border-border/30 hover:border-border/60 transition-colors">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h5 className="font-semibold text-foreground mb-2 flex items-start gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${platformColor}20` }}
              >
                <Lightbulb
                  className="w-3.5 h-3.5"
                  style={{ color: platformColor }}
                />
              </div>
              <span className="flex-1">{recommendation.title}</span>
            </h5>

            {/* Description */}
            <p className="text-sm text-foreground/80 mb-3 pl-8">
              {recommendation.description}
            </p>

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2 pl-8">
              {/* Priority */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: priorityConfig.color }}
                />
                <span className="text-xs font-medium text-foreground">
                  {priorityConfig.label}
                </span>
              </div>

              {/* Impact */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <div style={{ color: impactConfig.color }}>
                  {impactConfig.icon}
                </div>
                <span className="text-xs text-foreground">
                  {impactConfig.label}
                </span>
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <div style={{ color: difficultyConfig.color }}>
                  {difficultyConfig.icon}
                </div>
                <span className="text-xs text-foreground">
                  {difficultyConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          {(recommendation.actionItems?.length ||
            recommendation.examples?.length) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
            >
              {expanded ? (
                <>
                  <span>Less</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>More</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
          {/* Action Items */}
          {recommendation.actionItems && recommendation.actionItems.length > 0 && (
            <div>
              <h6 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                Action Items
              </h6>
              <ul className="space-y-1.5 pl-5">
                {recommendation.actionItems.map((item, index) => (
                  <li
                    key={index}
                    className="text-sm text-foreground/80 list-disc"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Examples */}
          {recommendation.examples && recommendation.examples.length > 0 && (
            <div>
              <h6 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                Examples
              </h6>
              <ul className="space-y-1.5 pl-5">
                {recommendation.examples.map((example, index) => (
                  <li
                    key={index}
                    className="text-sm text-foreground/80 list-disc"
                  >
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Platform-specific recommendations section
 */
function PlatformRecommendations({
  platformConfig,
  recommendations,
}: PlatformRecommendationsProps) {
  const [expanded, setExpanded] = React.useState(true);
  const sortedRecommendations = React.useMemo(
    () => sortRecommendationsByPriority(recommendations),
    [recommendations]
  );

  return (
    <div className="card-secondary rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{
                backgroundColor: `${platformConfig.color}20`,
              }}
            >
              {platformConfig.icon}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">
                {platformConfig.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {sortedRecommendations.length} recommendation
                {sortedRecommendations.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? (
              <>
                <span>Collapse</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Expand</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recommendations List */}
      {expanded && (
        <div className="p-4 space-y-3">
          {sortedRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              platformColor={platformConfig.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * RecommendationsPanel displays platform-specific optimization recommendations.
 *
 * Features:
 * - Shows 3-5 actionable recommendations per platform
 * - Expandable sections for each platform
 * - Priority-based sorting (critical → high → medium → low → optional)
 * - Impact and difficulty indicators
 * - Detailed action items and examples
 * - Empty state when no recommendations are available
 *
 * @example
 * ```tsx
 * <RecommendationsPanel />
 * ```
 */
export function RecommendationsPanel({ className }: RecommendationsPanelProps) {
  const currentAnalysis = useCurrentAnalysis();

  // Build recommendations for each platform
  const platformRecommendations = React.useMemo(() => {
    if (!currentAnalysis) return [];

    const recommendations: Array<{
      platform: PlatformConfig;
      recommendations: Recommendation[];
    }> = [];

    PLATFORMS.forEach((platform) => {
      const platformResult = currentAnalysis.platforms[platform.key];

      // Only include successful platform analyses with recommendations
      if (
        platformResult?.status === "success" &&
        platformResult.analysis?.recommendations
      ) {
        const recs = platformResult.analysis.recommendations;
        if (recs.length > 0) {
          recommendations.push({
            platform,
            recommendations: recs,
          });
        }
      }
    });

    return recommendations;
  }, [currentAnalysis]);

  const totalRecommendations = platformRecommendations.reduce(
    (sum, pr) => sum + pr.recommendations.length,
    0
  );
  const hasData = totalRecommendations > 0;

  // Empty state
  if (!hasData) {
    return (
      <div className={cn("card-primary p-6", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Optimization Recommendations
            </h3>
            <p className="text-sm text-muted-foreground">
              Platform-specific actionable insights to boost visibility
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            No recommendations available
          </p>
          <p className="text-xs text-muted-foreground/70">
            Run an analysis to receive platform-specific optimization
            recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-primary p-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Optimization Recommendations
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalRecommendations} recommendation
            {totalRecommendations !== 1 ? "s" : ""} across{" "}
            {platformRecommendations.length} platform
            {platformRecommendations.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="mb-6 p-4 rounded-lg bg-muted/20">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Priority Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {([1, 2, 3, 4, 5] as const).map((priority) => {
            const count = platformRecommendations.reduce(
              (sum, pr) =>
                sum +
                pr.recommendations.filter((r) => r.priority === priority).length,
              0
            );
            const config = PRIORITY_CONFIG[priority];

            return (
              <div
                key={priority}
                className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {config.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Platform Recommendations */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">
          Recommendations by Platform
        </h4>
        {platformRecommendations.map((pr) => (
          <PlatformRecommendations
            key={pr.platform.key}
            platformConfig={pr.platform}
            recommendations={pr.recommendations}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-border/30">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Understanding Recommendations
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Priority */}
          <div className="p-3 rounded-lg bg-muted/20">
            <h5 className="text-xs font-semibold text-foreground mb-2">
              Priority
            </h5>
            <p className="text-xs text-muted-foreground">
              Recommendations are ordered by priority, with critical items at
              the top. Focus on high-priority items first for maximum impact.
            </p>
          </div>

          {/* Impact */}
          <div className="p-3 rounded-lg bg-muted/20">
            <h5 className="text-xs font-semibold text-foreground mb-2">
              Impact
            </h5>
            <p className="text-xs text-muted-foreground">
              Impact indicates the expected improvement to your visibility
              score. High impact changes can significantly boost your rankings.
            </p>
          </div>

          {/* Difficulty */}
          <div className="p-3 rounded-lg bg-muted/20">
            <h5 className="text-xs font-semibold text-foreground mb-2">
              Difficulty
            </h5>
            <p className="text-xs text-muted-foreground">
              Difficulty reflects the effort required to implement. Look for
              quick wins: high impact, easy difficulty recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
