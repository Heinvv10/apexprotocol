"use client"

import { Info, HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Metric definitions with explanations
export const METRIC_DEFINITIONS = {
  // Core competitive metrics
  GEO: {
    name: "GEO Score",
    shortName: "GEO",
    fullName: "Generative Engine Optimization",
    description: "Measures how well your brand appears in AI-generated responses. Higher scores mean AI assistants recommend your brand more often.",
    formula: "Based on mention frequency, position in responses, and citation quality across AI platforms.",
    tips: [
      "Optimize content for AI comprehension",
      "Use structured data and clear formatting",
      "Build authoritative backlinks"
    ]
  },
  SEO: {
    name: "SEO Score",
    shortName: "SEO",
    fullName: "Search Engine Optimization",
    description: "Traditional search engine visibility score. Indicates how well your content ranks on Google, Bing, and other search engines.",
    formula: "Combines domain authority, keyword rankings, and organic traffic metrics.",
    tips: [
      "Focus on high-quality backlinks",
      "Optimize meta descriptions and titles",
      "Improve page load speed"
    ]
  },
  AEO: {
    name: "AEO Score",
    shortName: "AEO",
    fullName: "Answer Engine Optimization",
    description: "Measures visibility in direct answer formats like featured snippets, knowledge panels, and voice search results.",
    formula: "Based on featured snippet appearances, FAQ schema implementation, and direct answer citations.",
    tips: [
      "Add FAQ schema to pages",
      "Structure content as Q&A",
      "Target 'how to' and 'what is' queries"
    ]
  },
  SMO: {
    name: "SMO Score",
    shortName: "SMO",
    fullName: "Social Media Optimization",
    description: "Social presence strength across platforms. Higher scores indicate better engagement, reach, and brand mentions on social media.",
    formula: "Aggregates engagement rates, follower growth, share of voice on social platforms.",
    tips: [
      "Post consistently across platforms",
      "Engage with your audience",
      "Create shareable content"
    ]
  },
  PPO: {
    name: "PPO Score",
    shortName: "PPO",
    fullName: "Paid Performance Optimization",
    description: "Effectiveness of paid advertising campaigns. Measures ROI, click-through rates, and conversion efficiency.",
    formula: "Combines ad spend efficiency, conversion rates, and competitive bidding performance.",
    tips: [
      "Optimize ad copy and creatives",
      "Target high-intent keywords",
      "A/B test landing pages"
    ]
  },
  SOV: {
    name: "Share of Voice",
    shortName: "SOV",
    fullName: "Share of Voice",
    description: "Percentage of AI platform conversations where your brand is mentioned compared to competitors. 100% means you dominate the conversation.",
    formula: "(Your brand mentions / Total industry mentions) × 100",
    tips: [
      "Create comprehensive content",
      "Build thought leadership",
      "Monitor competitor mentions"
    ]
  },
  // Additional metrics
  UNIFIED: {
    name: "Unified Score",
    shortName: "Score",
    fullName: "Unified Competitive Score",
    description: "Overall competitive strength combining all metrics. Higher scores indicate stronger market position across all channels.",
    formula: "Weighted average of GEO, SEO, AEO, SMO, and PPO scores.",
    tips: [
      "Improve your weakest metric first",
      "Maintain balance across all areas",
      "Track progress over time"
    ]
  },
  SENTIMENT: {
    name: "Sentiment",
    shortName: "Sentiment",
    fullName: "Brand Sentiment Analysis",
    description: "How positively or negatively AI platforms describe your brand. Based on tone analysis of mentions.",
    formula: "AI-powered analysis of positive, neutral, and negative language patterns.",
    tips: [
      "Address negative reviews promptly",
      "Encourage positive testimonials",
      "Monitor brand perception"
    ]
  },
  CONFIDENCE: {
    name: "Confidence",
    shortName: "Conf",
    fullName: "Data Confidence Level",
    description: "How reliable the data is based on sample size and data freshness. Higher confidence means more accurate insights.",
    formula: "Based on data recency, sample size, and source diversity.",
    tips: [
      "Run monitoring more frequently",
      "Track more keywords",
      "Enable all AI platforms"
    ]
  }
} as const

export type MetricKey = keyof typeof METRIC_DEFINITIONS

interface MetricTooltipProps {
  metric: MetricKey
  children?: React.ReactNode
  variant?: "icon" | "inline" | "badge"
  size?: "sm" | "md" | "lg"
  showName?: boolean
  className?: string
  side?: "top" | "bottom" | "left" | "right"
}

export function MetricTooltip({
  metric,
  children,
  variant = "icon",
  size = "sm",
  showName = false,
  className,
  side = "top"
}: MetricTooltipProps) {
  const definition = METRIC_DEFINITIONS[metric]

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  }

  const Icon = variant === "badge" ? HelpCircle : Info

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 cursor-help group",
            className
          )}
        >
          {showName && (
            <span className="text-muted-foreground">{definition.shortName}</span>
          )}
          {children}
          <Icon
            className={cn(
              iconSizes[size],
              "text-muted-foreground/60 transition-all duration-200",
              "group-hover:text-primary group-hover:scale-110",
              variant === "badge" && "ml-1"
            )}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-sm p-4 bg-card border border-border/50 shadow-xl"
        sideOffset={8}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">
              {definition.name}
            </span>
            <span className="text-xs text-muted-foreground">
              ({definition.fullName})
            </span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {definition.description}
          </p>
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground italic">
              {definition.formula}
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

// Compact version for inline metric display
interface MetricLabelProps {
  metric: MetricKey
  value?: number | string
  className?: string
  showTooltip?: boolean
}

export function MetricLabel({
  metric,
  value,
  className,
  showTooltip = true
}: MetricLabelProps) {
  const definition = METRIC_DEFINITIONS[metric]

  const content = (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="font-medium">{definition.shortName}</span>
      {value !== undefined && (
        <span className="text-foreground">{value}</span>
      )}
    </span>
  )

  if (!showTooltip) return content

  return (
    <MetricTooltip metric={metric} variant="inline">
      {content}
    </MetricTooltip>
  )
}

// Full metric explanation card for Help/FAQ
interface MetricExplanationCardProps {
  metric: MetricKey
  className?: string
}

export function MetricExplanationCard({ metric, className }: MetricExplanationCardProps) {
  const definition = METRIC_DEFINITIONS[metric]

  return (
    <div className={cn(
      "rounded-lg border border-border/50 bg-card/50 p-4 space-y-3",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-foreground">
            {definition.name}
          </h4>
          <p className="text-xs text-muted-foreground">
            {definition.fullName}
          </p>
        </div>
        <span className="text-2xl font-bold text-primary">
          {definition.shortName}
        </span>
      </div>

      <p className="text-sm text-foreground/80">
        {definition.description}
      </p>

      <div className="bg-muted/30 rounded-md p-3">
        <p className="text-xs text-muted-foreground font-medium mb-1">
          How it&apos;s calculated:
        </p>
        <p className="text-xs text-foreground/70">
          {definition.formula}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">
          Tips to improve:
        </p>
        <ul className="space-y-1">
          {definition.tips.map((tip, i) => (
            <li key={i} className="text-xs text-foreground/70 flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
