"use client";

import * as React from "react";
import {
  Quote,
  Link as LinkIcon,
  MessageSquare,
  FileText,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentAnalysis } from "@/stores/insights-store";
import type { AIPlatform, Citation, CitationType } from "@/lib/ai/types";

// ============================================================================
// Types
// ============================================================================

interface CitationAnalysisProps {
  /** Additional CSS classes */
  className?: string;
}

interface PlatformConfig {
  key: AIPlatform;
  name: string;
  color: string;
  icon: string;
}

interface CitationTypeConfig {
  type: CitationType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface CitationStats {
  platform: AIPlatform;
  totalCitations: number;
  byType: {
    [K in CitationType]: number;
  };
  examples: Citation[];
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

const CITATION_TYPES: CitationTypeConfig[] = [
  {
    type: "direct_quote",
    label: "Direct Quote",
    icon: <Quote className="w-4 h-4" />,
    description: "Platform directly quoted brand content",
    color: "#10B981", // green
  },
  {
    type: "paraphrase",
    label: "Paraphrase",
    icon: <MessageSquare className="w-4 h-4" />,
    description: "Platform paraphrased brand content",
    color: "hsl(var(--color-info))", // blue
  },
  {
    type: "link",
    label: "Link",
    icon: <LinkIcon className="w-4 h-4" />,
    description: "Platform provided a link to brand content",
    color: "hsl(var(--color-warning))", // amber
  },
  {
    type: "reference",
    label: "Reference",
    icon: <FileText className="w-4 h-4" />,
    description: "Platform mentioned brand without specific citation",
    color: "hsl(var(--color-accent-purple))", // purple
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract citation statistics for a platform
 */
function getPlatformCitationStats(
  platform: AIPlatform,
  citations: Citation[]
): CitationStats {
  const platformCitations = citations.filter((c) => c);

  const stats: CitationStats = {
    platform,
    totalCitations: platformCitations.length,
    byType: {
      direct_quote: 0,
      paraphrase: 0,
      link: 0,
      reference: 0,
    },
    examples: [],
  };

  platformCitations.forEach((citation) => {
    stats.byType[citation.type] = (stats.byType[citation.type] || 0) + 1;
  });

  // Get top 3 examples (highest relevance scores)
  stats.examples = platformCitations
    .filter((c) => c.text || c.sourceUrl)
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 3);

  return stats;
}

/**
 * Get color for citation type
 */
function getCitationTypeColor(type: CitationType): string {
  return CITATION_TYPES.find((ct) => ct.type === type)?.color || "#6B7280";
}

/**
 * Calculate percentage for a citation type
 */
function getCitationTypePercentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Citation type breakdown bar chart
 */
function CitationTypeBar({ stats }: { stats: CitationStats }) {
  const { totalCitations, byType } = stats;

  if (totalCitations === 0) {
    return (
      <div className="h-8 rounded-lg bg-muted/20 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">No citations</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="h-8 rounded-lg overflow-hidden flex">
        {CITATION_TYPES.map((typeConfig) => {
          const count = byType[typeConfig.type] || 0;
          const percentage = getCitationTypePercentage(count, totalCitations);

          if (percentage === 0) return null;

          return (
            <div
              key={typeConfig.type}
              className="flex items-center justify-center text-xs font-semibold text-white transition-all hover:brightness-110"
              style={{
                width: `${percentage}%`,
                backgroundColor: typeConfig.color,
              }}
              title={`${typeConfig.label}: ${count} (${percentage}%)`}
            >
              {percentage >= 15 && `${percentage}%`}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {CITATION_TYPES.map((typeConfig) => {
          const count = byType[typeConfig.type] || 0;
          const percentage = getCitationTypePercentage(count, totalCitations);

          return (
            <div key={typeConfig.type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: typeConfig.color }}
              />
              <span className="text-xs text-muted-foreground">
                {typeConfig.label}: {count} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Example citation card
 */
function CitationExample({ citation }: { citation: Citation }) {
  const typeConfig = CITATION_TYPES.find((ct) => ct.type === citation.type);

  return (
    <div className="card-secondary p-3 rounded-lg space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: `${typeConfig?.color}20` }}
          >
            <div style={{ color: typeConfig?.color }}>{typeConfig?.icon}</div>
          </div>
          <span className="text-xs font-medium text-foreground">
            {typeConfig?.label}
          </span>
        </div>
        {citation.relevanceScore !== undefined && (
          <span className="text-xs text-muted-foreground">
            {citation.relevanceScore}/100
          </span>
        )}
      </div>

      {/* Citation text */}
      {citation.text && (
        <p className="text-sm text-foreground/90 italic line-clamp-2">
          &ldquo;{citation.text}&rdquo;
        </p>
      )}

      {/* Source link */}
      {citation.sourceUrl && (
        <a
          href={citation.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          <span className="truncate">
            {citation.sourceTitle || citation.sourceUrl}
          </span>
        </a>
      )}

      {/* Content type */}
      {citation.contentType && citation.contentType !== "unknown" && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="w-3 h-3" />
          <span className="capitalize">{citation.contentType.replace(/_/g, " ")}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Platform citation section
 */
function PlatformCitationSection({
  platformConfig,
  stats,
}: {
  platformConfig: PlatformConfig;
  stats: CitationStats;
}) {
  const [expanded, setExpanded] = React.useState(false);

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
                {stats.totalCitations} citation{stats.totalCitations !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          {stats.examples.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {expanded ? (
                <>
                  <span>Hide Examples</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Show Examples</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Citation Type Breakdown */}
      <div className="p-4">
        <CitationTypeBar stats={stats} />
      </div>

      {/* Examples */}
      {expanded && stats.examples.length > 0 && (
        <div className="p-4 pt-0 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Top Citations
            </span>
          </div>
          {stats.examples.map((citation, index) => (
            <CitationExample key={index} citation={citation} />
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
 * CitationAnalysis displays citation patterns and examples across all platforms.
 *
 * Features:
 * - Shows citation type distribution (direct quote, paraphrase, link, reference) per platform
 * - Visual breakdown with stacked bar charts
 * - Expandable sections showing example citations from each platform
 * - Citation relevance scores and source links
 * - Empty state when no analysis data is available
 *
 * @example
 * ```tsx
 * <CitationAnalysis />
 * ```
 */
export function CitationAnalysis({ className }: CitationAnalysisProps) {
  const currentAnalysis = useCurrentAnalysis();

  // Build citation statistics for each platform
  const platformStats = React.useMemo(() => {
    if (!currentAnalysis) return [];

    const stats: CitationStats[] = [];

    PLATFORMS.forEach((platform) => {
      const platformResult = currentAnalysis.platforms[platform.key];

      // Only include successful platform analyses
      if (platformResult?.status === "success" && platformResult.analysis) {
        const citations = platformResult.analysis.citations || [];
        stats.push(getPlatformCitationStats(platform.key, citations));
      }
    });

    return stats;
  }, [currentAnalysis]);

  const totalCitations = platformStats.reduce(
    (sum, stat) => sum + stat.totalCitations,
    0
  );
  const hasData = totalCitations > 0;

  // Empty state
  if (!hasData) {
    return (
      <div className={cn("card-primary p-6", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Quote className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Citation Pattern Analysis
            </h3>
            <p className="text-sm text-muted-foreground">
              See how each platform cites and references your brand
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            No citation data available
          </p>
          <p className="text-xs text-muted-foreground/70">
            Run an analysis to see how platforms cite your brand content
          </p>
        </div>
      </div>
    );
  }

  // Calculate overall citation type distribution
  const overallStats = React.useMemo(() => {
    const combined: { [K in CitationType]: number } = {
      direct_quote: 0,
      paraphrase: 0,
      link: 0,
      reference: 0,
    };

    platformStats.forEach((stat) => {
      Object.entries(stat.byType).forEach(([type, count]) => {
        combined[type as CitationType] += count;
      });
    });

    return combined;
  }, [platformStats]);

  return (
    <div className={cn("card-primary p-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Quote className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Citation Pattern Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalCitations} total citation{totalCitations !== 1 ? "s" : ""} across{" "}
            {platformStats.length} platform{platformStats.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Overall Citation Type Distribution */}
      <div className="mb-6 p-4 rounded-lg bg-muted/20">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Overall Citation Types
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CITATION_TYPES.map((typeConfig) => {
            const count = overallStats[typeConfig.type] || 0;
            const percentage = getCitationTypePercentage(count, totalCitations);

            return (
              <div
                key={typeConfig.type}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${typeConfig.color}20` }}
                >
                  <div style={{ color: typeConfig.color }}>{typeConfig.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {typeConfig.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {count} ({percentage}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Platform Citation Breakdown */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">
          Citations by Platform
        </h4>
        {platformStats.map((stats) => {
          const platformConfig = PLATFORMS.find((p) => p.key === stats.platform);
          if (!platformConfig) return null;

          return (
            <PlatformCitationSection
              key={stats.platform}
              platformConfig={platformConfig}
              stats={stats}
            />
          );
        })}
      </div>

      {/* Citation Type Legend */}
      <div className="mt-6 pt-6 border-t border-border/30">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Understanding Citation Types
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CITATION_TYPES.map((typeConfig) => (
            <div key={typeConfig.type} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${typeConfig.color}20` }}
              >
                <div style={{ color: typeConfig.color }}>{typeConfig.icon}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {typeConfig.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {typeConfig.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
