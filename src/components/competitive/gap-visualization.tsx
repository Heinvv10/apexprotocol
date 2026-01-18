"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Target, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GapItem {
  category: string;
  brandScore: number;
  competitorAverage: number;
  gap: number;
  status: "leading" | "competitive" | "lagging";
  priority: "high" | "medium" | "low";
  recommendation?: string;
}

interface GapVisualizationProps {
  brandName: string;
  gaps: GapItem[];
  className?: string;
}

// Status config
const STATUS_CONFIG = {
  leading: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    label: "Leading",
  },
  competitive: {
    icon: Target,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    label: "Competitive",
  },
  lagging: {
    icon: AlertTriangle,
    color: "text-error",
    bg: "bg-error/10",
    border: "border-error/30",
    label: "Lagging",
  },
};

// Priority badge
function PriorityBadge({ priority }: { priority: GapItem["priority"] }) {
  const config = {
    high: { bg: "bg-error/20", text: "text-error", label: "High Priority" },
    medium: { bg: "bg-warning/20", text: "text-warning", label: "Medium" },
    low: { bg: "bg-muted/30", text: "text-muted-foreground", label: "Low" },
  };

  const { bg, text, label } = config[priority];

  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", bg, text)}>
      {label}
    </span>
  );
}

// Individual gap row
function GapRow({ gap }: { gap: GapItem }) {
  const { icon: Icon, color, bg, border, label } = STATUS_CONFIG[gap.status];
  const absGap = Math.abs(gap.gap);
  const isPositive = gap.gap > 0;

  // Calculate bar widths
  const maxScore = Math.max(gap.brandScore, gap.competitorAverage, 100);
  const brandWidth = (gap.brandScore / maxScore) * 100;
  const competitorWidth = (gap.competitorAverage / maxScore) * 100;

  return (
    <div className={cn("p-4 rounded-lg border", bg, border)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", color)} />
          <span className="font-medium text-foreground">{gap.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={gap.priority} />
          <span className={cn("text-xs font-medium", color)}>{label}</span>
        </div>
      </div>

      {/* Score comparison bars */}
      <div className="space-y-2 mb-3">
        {/* Brand bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">You</span>
          <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${brandWidth}%` }}
            />
          </div>
          <span className="text-xs font-medium text-primary w-8 text-right">
            {gap.brandScore}
          </span>
        </div>

        {/* Competitor average bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">Avg</span>
          <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500/70 rounded-full transition-all"
              style={{ width: `${competitorWidth}%` }}
            />
          </div>
          <span className="text-xs font-medium text-purple-400 w-8 text-right">
            {gap.competitorAverage}
          </span>
        </div>
      </div>

      {/* Gap indicator */}
      <div className="flex items-center justify-between text-xs">
        <div className={cn("font-medium", isPositive ? "text-success" : "text-error")}>
          Gap: {isPositive ? "+" : "-"}{absGap} points
        </div>
        {gap.recommendation && (
          <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
            <span className="truncate max-w-[200px]">{gap.recommendation}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
}

export function GapVisualization({
  brandName,
  gaps,
  className,
}: GapVisualizationProps) {
  // Sort gaps by priority and status
  const sortedGaps = React.useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const statusOrder = { lagging: 0, competitive: 1, leading: 2 };

    return [...gaps].sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by status
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [gaps]);

  // Calculate summary stats
  const summary = React.useMemo(() => {
    const leading = gaps.filter((g) => g.status === "leading").length;
    const competitive = gaps.filter((g) => g.status === "competitive").length;
    const lagging = gaps.filter((g) => g.status === "lagging").length;
    const avgGap = gaps.reduce((sum, g) => sum + g.gap, 0) / gaps.length;

    return { leading, competitive, lagging, avgGap };
  }, [gaps]);

  return (
    <div className={cn("card-secondary", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <h3 className="text-lg font-semibold text-foreground">Gap Analysis</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {brandName} vs competitor average
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-border/30">
        <div className="text-center">
          <div className="text-2xl font-bold text-success">{summary.leading}</div>
          <div className="text-xs text-muted-foreground">Leading</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning">{summary.competitive}</div>
          <div className="text-xs text-muted-foreground">Competitive</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-error">{summary.lagging}</div>
          <div className="text-xs text-muted-foreground">Lagging</div>
        </div>
        <div className="text-center">
          <div className={cn(
            "text-2xl font-bold",
            summary.avgGap >= 0 ? "text-success" : "text-error"
          )}>
            {summary.avgGap >= 0 ? "+" : ""}{Math.round(summary.avgGap)}
          </div>
          <div className="text-xs text-muted-foreground">Avg Gap</div>
        </div>
      </div>

      {/* Gap list */}
      <div className="p-4 space-y-3">
        {sortedGaps.map((gap) => (
          <GapRow key={gap.category} gap={gap} />
        ))}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-border/30 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Your Score</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-500/70" />
          <span>Competitor Average</span>
        </div>
      </div>
    </div>
  );
}
