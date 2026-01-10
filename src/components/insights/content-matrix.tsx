"use client";

import * as React from "react";
import {
  FileText,
  BookOpen,
  Briefcase,
  Newspaper,
  Video,
  Mic,
  FileCheck,
  HelpCircle,
  Package,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentAnalysis } from "@/stores/insights-store";
import type { AIPlatform, ContentType } from "@/lib/ai/types";

// ============================================================================
// Types
// ============================================================================

interface ContentMatrixProps {
  /** Additional CSS classes */
  className?: string;
}

interface ContentTypeConfig {
  type: ContentType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface PlatformConfig {
  key: AIPlatform;
  name: string;
  color: string;
}

interface MatrixCell {
  platform: AIPlatform;
  contentType: ContentType;
  citationCount: number;
}

// ============================================================================
// Constants
// ============================================================================

const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    type: "blog_post",
    label: "Blog Posts",
    icon: <FileText className="w-4 h-4" />,
    description: "Articles and blog content",
  },
  {
    type: "documentation",
    label: "Documentation",
    icon: <BookOpen className="w-4 h-4" />,
    description: "Technical docs and guides",
  },
  {
    type: "case_study",
    label: "Case Studies",
    icon: <Briefcase className="w-4 h-4" />,
    description: "Success stories and examples",
  },
  {
    type: "tutorial",
    label: "Tutorials",
    icon: <FileCheck className="w-4 h-4" />,
    description: "Step-by-step tutorials",
  },
  {
    type: "whitepaper",
    label: "Whitepapers",
    icon: <Newspaper className="w-4 h-4" />,
    description: "Research and insights",
  },
  {
    type: "video",
    label: "Videos",
    icon: <Video className="w-4 h-4" />,
    description: "Video content",
  },
  {
    type: "podcast",
    label: "Podcasts",
    icon: <Mic className="w-4 h-4" />,
    description: "Audio content",
  },
  {
    type: "faq",
    label: "FAQs",
    icon: <HelpCircle className="w-4 h-4" />,
    description: "Common questions",
  },
  {
    type: "product_page",
    label: "Product Pages",
    icon: <Package className="w-4 h-4" />,
    description: "Product information",
  },
];

const PLATFORMS: PlatformConfig[] = [
  { key: "chatgpt", name: "ChatGPT", color: "#10A37F" },
  { key: "claude", name: "Claude", color: "#D97757" },
  { key: "gemini", name: "Gemini", color: "#4285F4" },
  { key: "perplexity", name: "Perplexity", color: "#20B8CD" },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get heatmap color based on citation count
 * Higher counts get more intense colors
 */
function getHeatmapColor(count: number, maxCount: number, platformColor: string): string {
  if (count === 0) return "rgba(255, 255, 255, 0.05)";

  // Calculate intensity (0-1) based on count relative to max
  const intensity = maxCount > 0 ? count / maxCount : 0;

  // Convert hex color to RGB for alpha blending
  const hex = platformColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Apply intensity with minimum visibility at 0.1 and max at 0.8
  const alpha = 0.1 + intensity * 0.7;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get text color based on background intensity
 */
function getTextColor(count: number, maxCount: number): string {
  if (count === 0) return "text-muted-foreground/50";

  const intensity = maxCount > 0 ? count / maxCount : 0;

  // Higher intensity = lighter text for better contrast
  if (intensity > 0.5) return "text-white font-semibold";
  if (intensity > 0.2) return "text-foreground font-medium";
  return "text-muted-foreground";
}

/**
 * Calculate max citation count across all cells for normalization
 */
function getMaxCitationCount(cells: MatrixCell[]): number {
  return Math.max(...cells.map((cell) => cell.citationCount), 1);
}

/**
 * Get best performing platform for a content type
 */
function getBestPlatform(
  contentType: ContentType,
  cells: MatrixCell[]
): AIPlatform | null {
  const typeCells = cells.filter((cell) => cell.contentType === contentType);
  if (typeCells.length === 0) return null;

  const best = typeCells.reduce((prev, current) =>
    current.citationCount > prev.citationCount ? current : prev
  );

  return best.citationCount > 0 ? best.platform : null;
}

/**
 * Get best performing content type for a platform
 */
function getBestContentType(
  platform: AIPlatform,
  cells: MatrixCell[]
): ContentType | null {
  const platformCells = cells.filter((cell) => cell.platform === platform);
  if (platformCells.length === 0) return null;

  const best = platformCells.reduce((prev, current) =>
    current.citationCount > prev.citationCount ? current : prev
  );

  return best.citationCount > 0 ? best.contentType : null;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ContentMatrix displays a heatmap showing content type performance across platforms.
 *
 * Features:
 * - Table/matrix layout with content types as rows and platforms as columns
 * - Heatmap coloring based on citation counts (darker = better performance)
 * - Highlights best performing platform for each content type
 * - Shows best performing content type for each platform
 * - Empty state when no analysis data is available
 * - Responsive design with horizontal scroll on mobile
 *
 * @example
 * ```tsx
 * <ContentMatrix />
 * ```
 */
export function ContentMatrix({ className }: ContentMatrixProps) {
  const currentAnalysis = useCurrentAnalysis();

  // Build matrix cells from analysis data
  const matrixCells = React.useMemo(() => {
    if (!currentAnalysis) return [];

    const cells: MatrixCell[] = [];

    PLATFORMS.forEach((platform) => {
      const platformResult = currentAnalysis.platforms[platform.key];

      // Only include successful platform analyses
      if (platformResult?.status === "success" && platformResult.analysis) {
        const contentPerformance = platformResult.analysis.contentTypePerformance;

        CONTENT_TYPES.forEach((contentType) => {
          const citationCount = contentPerformance[contentType.type] ?? 0;

          cells.push({
            platform: platform.key,
            contentType: contentType.type,
            citationCount,
          });
        });
      }
    });

    return cells;
  }, [currentAnalysis]);

  const maxCitationCount = getMaxCitationCount(matrixCells);
  const hasData = matrixCells.length > 0 && matrixCells.some((cell) => cell.citationCount > 0);

  // Empty state
  if (!hasData) {
    return (
      <div className={cn("card-primary p-6", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Content Performance Matrix
            </h3>
            <p className="text-sm text-muted-foreground">
              See which content types work best on each platform
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            No content performance data available
          </p>
          <p className="text-xs text-muted-foreground/70">
            Run an analysis to see which content types perform best on each platform
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
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Content Performance Matrix
          </h3>
          <p className="text-sm text-muted-foreground">
            Citation counts by content type across platforms
          </p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3 pr-4">
                Content Type
              </th>
              {PLATFORMS.map((platform) => (
                <th
                  key={platform.key}
                  className="text-center text-xs font-semibold uppercase tracking-wider pb-3 px-2"
                  style={{ color: platform.color }}
                >
                  {platform.name}
                </th>
              ))}
              <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3 pl-4">
                Best Platform
              </th>
            </tr>
          </thead>
          <tbody className="space-y-1">
            {CONTENT_TYPES.map((contentType, rowIndex) => {
              const bestPlatform = getBestPlatform(contentType.type, matrixCells);
              const hasAnyCitations = matrixCells
                .filter((cell) => cell.contentType === contentType.type)
                .some((cell) => cell.citationCount > 0);

              return (
                <tr
                  key={contentType.type}
                  className={cn(
                    "group transition-colors",
                    rowIndex > 0 && "border-t border-border/30"
                  )}
                >
                  {/* Content Type Label */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground">
                        {contentType.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {contentType.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contentType.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Platform Citation Counts */}
                  {PLATFORMS.map((platform) => {
                    const cell = matrixCells.find(
                      (c) => c.platform === platform.key && c.contentType === contentType.type
                    );
                    const count = cell?.citationCount ?? 0;
                    const isBest = count > 0 && platform.key === bestPlatform;

                    return (
                      <td
                        key={platform.key}
                        className="py-3 px-2"
                      >
                        <div
                          className={cn(
                            "relative rounded-lg py-2 px-3 text-center transition-all duration-200",
                            isBest && "ring-2 ring-offset-2 ring-offset-background",
                            count > 0 && "hover:scale-105"
                          )}
                          style={{
                            backgroundColor: getHeatmapColor(count, maxCitationCount, platform.color),
                            ...(isBest && { '--tw-ring-color': platform.color } as React.CSSProperties),
                          }}
                        >
                          <div className={cn("text-lg font-bold", getTextColor(count, maxCitationCount))}>
                            {count}
                          </div>
                          {isBest && (
                            <div className="absolute -top-1 -right-1">
                              <TrendingUp
                                className="w-3.5 h-3.5"
                                style={{ color: platform.color }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Best Platform Column */}
                  <td className="py-3 pl-4">
                    {hasAnyCitations && bestPlatform ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: PLATFORMS.find((p) => p.key === bestPlatform)?.color,
                          }}
                        />
                        <span className="text-xs font-medium text-foreground">
                          {PLATFORMS.find((p) => p.key === bestPlatform)?.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Platform Best Performers */}
      <div className="mt-6 pt-6 border-t border-border/30">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Top Content Type per Platform
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PLATFORMS.map((platform) => {
            const bestContentType = getBestContentType(platform.key, matrixCells);
            const contentTypeConfig = CONTENT_TYPES.find((ct) => ct.type === bestContentType);

            return (
              <div
                key={platform.key}
                className="card-secondary p-3 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {platform.name}
                  </span>
                </div>
                {contentTypeConfig ? (
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">
                      {contentTypeConfig.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {contentTypeConfig.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {matrixCells.find(
                          (c) => c.platform === platform.key && c.contentType === bestContentType
                        )?.citationCount ?? 0}{" "}
                        citations
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/50">No data</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-border/30">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/5" />
            <span>No citations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/20" />
            <span>Low performance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/50" />
            <span>Medium performance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/80" />
            <span>High performance</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Best platform for content type</span>
          </div>
        </div>
      </div>
    </div>
  );
}
