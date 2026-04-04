"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { platformConfig, PlatformId } from "./platform-card";

export type SentimentType = "positive" | "neutral" | "negative" | "unrecognized";

interface MentionCardProps {
  platformId: PlatformId;
  text: string;
  sentiment: SentimentType;
  timestamp: string;
  source?: string;
  sourceUrl?: string;
  className?: string;
}

const sentimentConfig: Record<
  SentimentType,
  { label: string; color: string; bgColor: string }
> = {
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
  unrecognized: {
    label: "Not on AI Radar",
    color: "hsl(var(--warning))",
    bgColor: "hsl(var(--warning) / 0.1)",
  },
};

export function MentionCard({
  platformId,
  text,
  sentiment,
  timestamp,
  source,
  sourceUrl,
  className,
}: MentionCardProps) {
  const platform = platformConfig[platformId];
  const sentimentStyles = sentimentConfig[sentiment];

  return (
    <div className={cn("card-tertiary", className)}>
      <div className="flex items-start gap-4">
        {/* Platform Icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ backgroundColor: platform.bgColor, color: platform.color }}
        >
          {platform.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{platform.name}</span>
              {/* Sentiment Badge */}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  color: sentimentStyles.color,
                  backgroundColor: sentimentStyles.bgColor,
                }}
              >
                {sentimentStyles.label}
              </span>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {timestamp}
            </span>
          </div>

          {/* Mention Text */}
          <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
            {text}
          </p>

          {/* Source Link */}
          {source && (
            <div className="mt-2 flex items-center gap-1">
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  {source}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">{source}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
