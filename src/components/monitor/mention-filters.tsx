"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformId, platformConfig } from "./platform-card";
import { SentimentType } from "./mention-card";

interface MentionFiltersProps {
  selectedPlatforms: PlatformId[];
  selectedSentiments: SentimentType[];
  dateRange: "24h" | "7d" | "30d" | "all";
  onPlatformChange: (platforms: PlatformId[]) => void;
  onSentimentChange: (sentiments: SentimentType[]) => void;
  onDateRangeChange: (range: "24h" | "7d" | "30d" | "all") => void;
  onClearAll: () => void;
  className?: string;
}

const sentimentOptions: { value: SentimentType; label: string; color: string }[] = [
  { value: "positive", label: "Positive", color: "hsl(var(--success))" },
  { value: "neutral", label: "Neutral", color: "hsl(var(--muted-foreground))" },
  { value: "negative", label: "Negative", color: "hsl(var(--error))" },
];

const dateRangeOptions: { value: "24h" | "7d" | "30d" | "all"; label: string }[] = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

export function MentionFilters({
  selectedPlatforms,
  selectedSentiments,
  dateRange,
  onPlatformChange,
  onSentimentChange,
  onDateRangeChange,
  onClearAll,
  className,
}: MentionFiltersProps) {
  const hasFilters =
    selectedPlatforms.length > 0 ||
    selectedSentiments.length > 0 ||
    dateRange !== "all";

  const togglePlatform = (platform: PlatformId) => {
    if (selectedPlatforms.includes(platform)) {
      onPlatformChange(selectedPlatforms.filter((p) => p !== platform));
    } else {
      onPlatformChange([...selectedPlatforms, platform]);
    }
  };

  const toggleSentiment = (sentiment: SentimentType) => {
    if (selectedSentiments.includes(sentiment)) {
      onSentimentChange(selectedSentiments.filter((s) => s !== sentiment));
    } else {
      onSentimentChange([...selectedSentiments, sentiment]);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>Filters</span>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">
          Date Range
        </label>
        <div className="flex flex-wrap gap-2">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onDateRangeChange(option.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
                dateRange === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sentiment */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">
          Sentiment
        </label>
        <div className="flex flex-wrap gap-2">
          {sentimentOptions.map((option) => {
            const isSelected = selectedSentiments.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleSentiment(option.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
                  "border",
                  isSelected
                    ? "border-current"
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
                style={{
                  color: isSelected ? option.color : undefined,
                  backgroundColor: isSelected
                    ? `color-mix(in srgb, ${option.color} 15%, transparent)`
                    : undefined,
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Platforms */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">
          Platforms
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(platformConfig) as PlatformId[]).map((platformId) => {
            const platform = platformConfig[platformId];
            const isSelected = selectedPlatforms.includes(platformId);
            return (
              <button
                key={platformId}
                onClick={() => togglePlatform(platformId)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
                  "border",
                  isSelected
                    ? "border-current"
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
                style={{
                  color: isSelected ? platform.color : undefined,
                  backgroundColor: isSelected ? platform.bgColor : undefined,
                }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
                {platform.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
