"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ScoreKind = "audit" | "unified" | "geo" | "seo" | "aeo" | "smo" | "ppo";

const EXPLAINERS: Record<ScoreKind, { title: string; body: string }> = {
  audit: {
    title: "On-Page Audit Score",
    body: "Signal-grounded score from crawling this specific URL: content structure, schema markup, clarity, metadata, and accessibility. 0-100, grade A-F.",
  },
  unified: {
    title: "Digital Presence Score",
    body: "Composite of 5 dimensions: SEO 25% · GEO 25% · AEO 15% · SMO 20% · PPO 15%. Measures brand strength across search, AI, answer engines, social, and people presence.",
  },
  geo: {
    title: "GEO Score",
    body: "Generative Engine Optimization: how often and how favorably your brand appears in AI-generated answers (ChatGPT, Claude, Gemini, Perplexity, etc.).",
  },
  seo: {
    title: "SEO Score",
    body: "Search visibility: search engine rankings, organic traffic, and crawlability — derived from the latest on-page audit.",
  },
  aeo: {
    title: "AEO Score",
    body: "Answer Engine Optimization: featured snippets, zero-click results, and citation rate across AI platforms.",
  },
  smo: {
    title: "SMO Score",
    body: "Social Media Optimization: reach, engagement, and sentiment across the channels your brand is active on.",
  },
  ppo: {
    title: "PPO Score",
    body: "People Presence Optimization: thought leadership and visibility of named individuals associated with the brand.",
  },
};

interface ScoreTooltipProps {
  kind: ScoreKind;
  className?: string;
  /** Optional override — if provided, replaces the default body for that kind */
  body?: string;
}

/**
 * Info-icon tooltip that explains what a score means. Place next to any
 * score label where "Score" alone is ambiguous — we have two (audit vs
 * unified) plus the four sub-components.
 */
export function ScoreTooltip({ kind, className, body }: ScoreTooltipProps) {
  const copy = EXPLAINERS[kind];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`About ${copy.title}`}
          className={cn(
            "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
            className,
          )}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-normal leading-relaxed">
        <div className="font-semibold mb-1">{copy.title}</div>
        <div className="text-xs opacity-90">{body ?? copy.body}</div>
      </TooltipContent>
    </Tooltip>
  );
}
