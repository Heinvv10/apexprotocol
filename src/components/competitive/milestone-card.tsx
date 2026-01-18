"use client";

import * as React from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ActionItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface MilestoneCardProps {
  id: string;
  title: string;
  description: string;
  category: "geo" | "seo" | "aeo" | "smo" | "ppo";
  status: "pending" | "in_progress" | "completed" | "skipped";
  expectedScoreImpact: number;
  expectedDaysToComplete: number;
  difficulty: "easy" | "medium" | "hard";
  actionItems: ActionItem[];
  actualScoreImpact?: number;
  onStart?: () => void;
  onComplete?: (actualScoreImpact: number) => void;
  onSkip?: () => void;
  onReset?: () => void;
  onActionItemToggle?: (actionItemId: string, isCompleted: boolean) => void;
  className?: string;
}

// Category config
const CATEGORY_CONFIG = {
  geo: { color: "text-primary", bg: "bg-primary/10", label: "GEO" },
  seo: { color: "text-blue-400", bg: "bg-blue-400/10", label: "SEO" },
  aeo: { color: "text-purple-400", bg: "bg-purple-400/10", label: "AEO" },
  smo: { color: "text-pink-400", bg: "bg-pink-400/10", label: "SMO" },
  ppo: { color: "text-amber-400", bg: "bg-amber-400/10", label: "PPO" },
};

// Status config
const STATUS_CONFIG = {
  pending: { icon: Circle, color: "text-muted-foreground", label: "Pending" },
  in_progress: { icon: Clock, color: "text-warning", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-success", label: "Completed" },
  skipped: { icon: XCircle, color: "text-muted-foreground", label: "Skipped" },
};

// Difficulty config
const DIFFICULTY_CONFIG = {
  easy: { color: "text-success", bg: "bg-success/10", label: "Easy" },
  medium: { color: "text-warning", bg: "bg-warning/10", label: "Medium" },
  hard: { color: "text-error", bg: "bg-error/10", label: "Hard" },
};

export function MilestoneCard({
  id,
  title,
  description,
  category,
  status,
  expectedScoreImpact,
  expectedDaysToComplete,
  difficulty,
  actionItems,
  actualScoreImpact,
  onStart,
  onComplete,
  onSkip,
  onReset,
  onActionItemToggle,
  className,
}: MilestoneCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(status === "in_progress");
  const [completionScore, setCompletionScore] = React.useState(expectedScoreImpact);

  const categoryConfig = CATEGORY_CONFIG[category];
  const statusConfig = STATUS_CONFIG[status];
  const difficultyConfig = DIFFICULTY_CONFIG[difficulty];
  const StatusIcon = statusConfig.icon;

  // Calculate action item progress
  const completedActions = actionItems.filter((item) => item.isCompleted).length;
  const actionProgress = actionItems.length > 0
    ? Math.round((completedActions / actionItems.length) * 100)
    : 0;

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        status === "completed"
          ? "border-success/30 bg-success/5"
          : status === "in_progress"
          ? "border-warning/30 bg-warning/5"
          : status === "skipped"
          ? "border-muted/30 bg-muted/5 opacity-60"
          : "border-border/30 bg-card/50",
        className
      )}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <StatusIcon className={cn("w-5 h-5 mt-0.5", statusConfig.color)} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded",
                    categoryConfig.bg,
                    categoryConfig.color
                  )}
                >
                  {categoryConfig.label}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded",
                    difficultyConfig.bg,
                    difficultyConfig.color
                  )}
                >
                  {difficultyConfig.label}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Expected impact */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-success">
                <Zap className="w-3 h-3" />
                <span className="text-sm font-semibold">
                  +{status === "completed" && actualScoreImpact ? actualScoreImpact : expectedScoreImpact}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">points</div>
            </div>

            {/* Days estimate */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span className="text-sm">{expectedDaysToComplete}d</span>
              </div>
            </div>

            {/* Expand icon */}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Progress bar (for in_progress status) */}
        {status === "in_progress" && actionItems.length > 0 && (
          <div className="mt-3 ml-8">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                {completedActions} of {actionItems.length} actions completed
              </span>
              <span className="text-warning font-medium">{actionProgress}%</span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-warning rounded-full transition-all"
                style={{ width: `${actionProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border/30 p-4 space-y-4">
          {/* Action items checklist */}
          {actionItems.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Action Items
              </h5>
              <div className="space-y-2">
                {actionItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={(e) =>
                        onActionItemToggle?.(item.id, e.target.checked)
                      }
                      disabled={status === "completed" || status === "skipped"}
                      className="mt-0.5 w-4 h-4 rounded border-border bg-muted/30 text-primary focus:ring-primary/50"
                    />
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        item.isCompleted
                          ? "text-muted-foreground line-through"
                          : "text-foreground group-hover:text-primary"
                      )}
                    >
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            {status === "pending" && (
              <>
                <Button size="sm" onClick={onStart}>
                  Start Milestone
                </Button>
                <Button size="sm" variant="ghost" onClick={onSkip}>
                  Skip
                </Button>
              </>
            )}

            {status === "in_progress" && (
              <>
                <div className="flex-1 flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">
                    Actual score impact:
                  </label>
                  <input
                    type="number"
                    value={completionScore}
                    onChange={(e) => setCompletionScore(Number(e.target.value))}
                    className="w-16 h-7 px-2 text-sm rounded border border-border/30 bg-muted/30"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => onComplete?.(completionScore)}
                >
                  Mark Complete
                </Button>
                <Button size="sm" variant="ghost" onClick={onSkip}>
                  Skip
                </Button>
              </>
            )}

            {(status === "completed" || status === "skipped") && (
              <Button size="sm" variant="ghost" onClick={onReset}>
                Reset to Pending
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
