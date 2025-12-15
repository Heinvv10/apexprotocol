"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlatformId, platformConfig } from "./platform-card";
import { SentimentType } from "./mention-card";

export interface SearchPrompt {
  id: string;
  promptText: string;
  platforms: PlatformId[];
  frequency: number;
  trend: "up" | "down" | "stable";
  trendValue: number;
  sentiment: SentimentType;
  lastSeen: string;
}

type SortField = "promptText" | "frequency" | "sentiment" | "lastSeen";
type SortDirection = "asc" | "desc";

interface PromptPerformanceTableProps {
  prompts: SearchPrompt[];
  onExport?: () => void;
  className?: string;
}

const sentimentConfig: Record<SentimentType, { label: string; color: string; bgColor: string }> = {
  positive: {
    label: "Positive",
    color: "hsl(var(--success))",
    bgColor: "hsl(var(--success) / 0.1)",
  },
  neutral: {
    label: "Neutral",
    color: "hsl(var(--muted-foreground))",
    bgColor: "hsl(var(--muted) / 0.3)",
  },
  negative: {
    label: "Negative",
    color: "hsl(var(--error))",
    bgColor: "hsl(var(--error) / 0.1)",
  },
};

export function PromptPerformanceTable({
  prompts,
  onExport,
  className,
}: PromptPerformanceTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortField, setSortField] = React.useState<SortField>("frequency");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

  // Filter and sort prompts
  const filteredPrompts = React.useMemo(() => {
    let result = prompts.filter((prompt) =>
      prompt.promptText.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "promptText":
          comparison = a.promptText.localeCompare(b.promptText);
          break;
        case "frequency":
          comparison = a.frequency - b.frequency;
          break;
        case "sentiment":
          const sentimentOrder = { positive: 3, neutral: 2, negative: 1 };
          comparison = sentimentOrder[a.sentiment] - sentimentOrder[b.sentiment];
          break;
        case "lastSeen":
          comparison = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [prompts, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary" />
    );
  };

  const TrendIcon = ({ trend, value }: { trend: "up" | "down" | "stable"; value: number }) => {
    if (trend === "up") {
      return (
        <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
          <TrendingUp className="h-3 w-3" />+{value}%
        </span>
      );
    }
    if (trend === "down") {
      return (
        <span className="inline-flex items-center gap-1 text-error text-xs font-medium">
          <TrendingDown className="h-3 w-3" />-{value}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium">
        <Minus className="h-3 w-3" />0%
      </span>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Export */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 font-medium">
                <button
                  onClick={() => handleSort("promptText")}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  Search Prompt
                  <SortIcon field="promptText" />
                </button>
              </th>
              <th className="text-left p-4 font-medium">Platforms</th>
              <th className="text-left p-4 font-medium">
                <button
                  onClick={() => handleSort("frequency")}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  Frequency
                  <SortIcon field="frequency" />
                </button>
              </th>
              <th className="text-left p-4 font-medium">Trend</th>
              <th className="text-left p-4 font-medium">
                <button
                  onClick={() => handleSort("sentiment")}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  Sentiment
                  <SortIcon field="sentiment" />
                </button>
              </th>
              <th className="text-left p-4 font-medium">
                <button
                  onClick={() => handleSort("lastSeen")}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  Last Seen
                  <SortIcon field="lastSeen" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPrompts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No prompts match your search.</p>
                </td>
              </tr>
            ) : (
              filteredPrompts.map((prompt) => {
                const sentimentStyle = sentimentConfig[prompt.sentiment];
                return (
                  <tr
                    key={prompt.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    {/* Prompt Text */}
                    <td className="p-4">
                      <p className="font-medium text-sm max-w-md truncate" title={prompt.promptText}>
                        &ldquo;{prompt.promptText}&rdquo;
                      </p>
                    </td>

                    {/* Platforms */}
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {prompt.platforms.map((platformId) => {
                          const platform = platformConfig[platformId];
                          return (
                            <div
                              key={platformId}
                              className="w-6 h-6 rounded flex items-center justify-center"
                              style={{ backgroundColor: platform.bgColor, color: platform.color }}
                              title={platform.name}
                            >
                              <span className="scale-50">{platform.icon}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* Frequency */}
                    <td className="p-4">
                      <span className="text-lg font-bold text-primary">
                        {prompt.frequency.toLocaleString()}
                      </span>
                    </td>

                    {/* Trend */}
                    <td className="p-4">
                      <TrendIcon trend={prompt.trend} value={prompt.trendValue} />
                    </td>

                    {/* Sentiment */}
                    <td className="p-4">
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          color: sentimentStyle.color,
                          backgroundColor: sentimentStyle.bgColor,
                        }}
                      >
                        {sentimentStyle.label}
                      </span>
                    </td>

                    {/* Last Seen */}
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{prompt.lastSeen}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredPrompts.length} of {prompts.length} prompts
      </div>
    </div>
  );
}
