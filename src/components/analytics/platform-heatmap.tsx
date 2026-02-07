"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PLATFORM_CONFIG } from "@/lib/monitoring/integrations";

// Derive display platforms from PLATFORM_CONFIG (single source of truth)
const PLATFORMS = [
  { id: "chatgpt" as const, name: PLATFORM_CONFIG.chatgpt.name, color: PLATFORM_CONFIG.chatgpt.color },
  { id: "claude" as const, name: PLATFORM_CONFIG.claude.name, color: PLATFORM_CONFIG.claude.color },
  { id: "gemini" as const, name: PLATFORM_CONFIG.gemini.name, color: PLATFORM_CONFIG.gemini.color },
  { id: "perplexity" as const, name: PLATFORM_CONFIG.perplexity.name, color: PLATFORM_CONFIG.perplexity.color },
  { id: "grok" as const, name: PLATFORM_CONFIG.grok.name, color: PLATFORM_CONFIG.grok.color },
  { id: "deepseek" as const, name: PLATFORM_CONFIG.deepseek.name, color: PLATFORM_CONFIG.deepseek.color },
  { id: "copilot" as const, name: PLATFORM_CONFIG.copilot.name, color: PLATFORM_CONFIG.copilot.color },
];

// Query categories
const QUERY_TYPES = [
  { id: "comparison", name: "Comparisons", description: "Best X vs Y" },
  { id: "recommendation", name: "Recommendations", description: "What's the best X?" },
  { id: "howto", name: "How-to", description: "How do I..." },
  { id: "review", name: "Reviews", description: "Is X good?" },
  { id: "pricing", name: "Pricing", description: "How much does X cost?" },
  { id: "features", name: "Features", description: "What features does X have?" },
] as const;

export interface HeatmapCell {
  platform: string;
  queryType: string;
  mentions: number;
  totalQueries: number;
  avgPosition: number;
  sentiment: "positive" | "neutral" | "negative";
}

interface PlatformHeatmapProps {
  data: HeatmapCell[];
  brandName?: string;
  className?: string;
}

function getCellColor(mentions: number, totalQueries: number): string {
  if (totalQueries === 0) return "bg-slate-800/50";
  const ratio = mentions / totalQueries;
  if (ratio >= 0.8) return "bg-green-500";
  if (ratio >= 0.6) return "bg-green-600/80";
  if (ratio >= 0.4) return "bg-yellow-500/80";
  if (ratio >= 0.2) return "bg-orange-500/70";
  if (ratio > 0) return "bg-red-500/60";
  return "bg-slate-800/50";
}

function getCellOpacity(mentions: number, totalQueries: number): number {
  if (totalQueries === 0) return 0.3;
  return 0.5 + (mentions / totalQueries) * 0.5;
}

function getSentimentIcon(sentiment: "positive" | "neutral" | "negative"): string {
  switch (sentiment) {
    case "positive": return "😊";
    case "negative": return "😟";
    default: return "😐";
  }
}

export function PlatformHeatmap({ data, brandName = "Your Brand", className }: PlatformHeatmapProps) {
  // Build lookup map
  const cellMap = React.useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    data.forEach(cell => {
      map.set(`${cell.platform}-${cell.queryType}`, cell);
    });
    return map;
  }, [data]);

  return (
    <TooltipProvider>
      <div className={cn("w-full overflow-x-auto", className)}>
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              AI Platform Coverage
            </h3>
            <span className="ml-2 text-sm text-slate-400">
              Where {brandName} appears across AI platforms
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>High visibility (80%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/80" />
              <span>Medium (40-60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/60" />
              <span>Low (&lt;20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-800/50" />
              <span>No data</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            {/* Column Headers (Platforms) */}
            <div className="grid grid-cols-8 bg-slate-800/50">
              <div className="p-3 text-xs font-medium text-slate-400 border-r border-slate-700">
                Query Type
              </div>
              {PLATFORMS.map(platform => (
                <div
                  key={platform.id}
                  className="p-3 text-xs font-medium text-center border-r border-slate-700 last:border-r-0"
                  style={{ color: platform.color }}
                >
                  {platform.name}
                </div>
              ))}
            </div>

            {/* Rows (Query Types) */}
            {QUERY_TYPES.map((queryType, rowIdx) => (
              <div
                key={queryType.id}
                className={cn(
                  "grid grid-cols-8",
                  rowIdx % 2 === 0 ? "bg-slate-900/30" : "bg-slate-900/10"
                )}
              >
                {/* Row Header */}
                <div className="p-3 text-xs text-slate-300 border-r border-slate-700 flex items-center">
                  <span>{queryType.name}</span>
                </div>

                {/* Cells */}
                {PLATFORMS.map(platform => {
                  const cell = cellMap.get(`${platform.id}-${queryType.id}`);
                  const mentions = cell?.mentions ?? 0;
                  const total = cell?.totalQueries ?? 0;
                  const percentage = total > 0 ? Math.round((mentions / total) * 100) : 0;

                  return (
                    <Tooltip key={`${platform.id}-${queryType.id}`}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "p-3 text-center border-r border-slate-700 last:border-r-0 cursor-pointer transition-all hover:scale-105",
                            getCellColor(mentions, total)
                          )}
                          style={{ opacity: getCellOpacity(mentions, total) }}
                        >
                          {total > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-bold text-white">
                                {percentage}%
                              </span>
                              {cell?.sentiment && (
                                <span className="text-xs mt-0.5">
                                  {getSentimentIcon(cell.sentiment)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">
                            {platform.name} × {queryType.name}
                          </div>
                          {total > 0 ? (
                            <>
                              <div>Mentioned in {mentions}/{total} queries ({percentage}%)</div>
                              {cell?.avgPosition && (
                                <div>Avg. position: #{cell.avgPosition.toFixed(1)}</div>
                              )}
                              {cell?.sentiment && (
                                <div>Sentiment: {cell.sentiment}</div>
                              )}
                            </>
                          ) : (
                            <div className="text-slate-400">No data yet</div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <SummaryCard
              label="Best Platform"
              value={getBestPlatform(data)}
              subtext="Highest mention rate"
            />
            <SummaryCard
              label="Weakest Platform"
              value={getWeakestPlatform(data)}
              subtext="Needs improvement"
            />
            <SummaryCard
              label="Top Query Type"
              value={getTopQueryType(data)}
              subtext="Most visibility"
            />
            <SummaryCard
              label="Overall Coverage"
              value={`${getOverallCoverage(data)}%`}
              subtext="Across all platforms"
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function SummaryCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-white mt-1">{value}</div>
      <div className="text-xs text-slate-500">{subtext}</div>
    </div>
  );
}

// Helper functions
function getBestPlatform(data: HeatmapCell[]): string {
  const platformStats = new Map<string, { mentions: number; total: number }>();
  
  data.forEach(cell => {
    const existing = platformStats.get(cell.platform) || { mentions: 0, total: 0 };
    platformStats.set(cell.platform, {
      mentions: existing.mentions + cell.mentions,
      total: existing.total + cell.totalQueries,
    });
  });

  let best = { platform: "N/A", ratio: 0 };
  platformStats.forEach((stats, platform) => {
    const ratio = stats.total > 0 ? stats.mentions / stats.total : 0;
    if (ratio > best.ratio) {
      best = { platform, ratio };
    }
  });

  return PLATFORMS.find(p => p.id === best.platform)?.name || "N/A";
}

function getWeakestPlatform(data: HeatmapCell[]): string {
  const platformStats = new Map<string, { mentions: number; total: number }>();
  
  data.forEach(cell => {
    const existing = platformStats.get(cell.platform) || { mentions: 0, total: 0 };
    platformStats.set(cell.platform, {
      mentions: existing.mentions + cell.mentions,
      total: existing.total + cell.totalQueries,
    });
  });

  let worst = { platform: "N/A", ratio: 1 };
  platformStats.forEach((stats, platform) => {
    if (stats.total > 0) {
      const ratio = stats.mentions / stats.total;
      if (ratio < worst.ratio) {
        worst = { platform, ratio };
      }
    }
  });

  return PLATFORMS.find(p => p.id === worst.platform)?.name || "N/A";
}

function getTopQueryType(data: HeatmapCell[]): string {
  const queryStats = new Map<string, { mentions: number; total: number }>();
  
  data.forEach(cell => {
    const existing = queryStats.get(cell.queryType) || { mentions: 0, total: 0 };
    queryStats.set(cell.queryType, {
      mentions: existing.mentions + cell.mentions,
      total: existing.total + cell.totalQueries,
    });
  });

  let best = { queryType: "N/A", ratio: 0 };
  queryStats.forEach((stats, queryType) => {
    const ratio = stats.total > 0 ? stats.mentions / stats.total : 0;
    if (ratio > best.ratio) {
      best = { queryType, ratio };
    }
  });

  return QUERY_TYPES.find(q => q.id === best.queryType)?.name || "N/A";
}

function getOverallCoverage(data: HeatmapCell[]): number {
  const totalMentions = data.reduce((sum, cell) => sum + cell.mentions, 0);
  const totalQueries = data.reduce((sum, cell) => sum + cell.totalQueries, 0);
  return totalQueries > 0 ? Math.round((totalMentions / totalQueries) * 100) : 0;
}

// Demo data generator for testing
export function generateDemoHeatmapData(): HeatmapCell[] {
  const data: HeatmapCell[] = [];
  
  PLATFORMS.forEach(platform => {
    QUERY_TYPES.forEach(queryType => {
      const totalQueries = Math.floor(Math.random() * 50) + 10;
      const mentionRate = Math.random();
      const mentions = Math.floor(totalQueries * mentionRate);
      
      data.push({
        platform: platform.id,
        queryType: queryType.id,
        mentions,
        totalQueries,
        avgPosition: mentions > 0 ? Math.random() * 5 + 1 : 0,
        sentiment: mentionRate > 0.6 ? "positive" : mentionRate > 0.3 ? "neutral" : "negative",
      });
    });
  });
  
  return data;
}
