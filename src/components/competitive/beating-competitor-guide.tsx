"use client";

import * as React from "react";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BeatingCompetitorGuideProps {
  competitorName: string;
  actionPlan: string[];
  onGenerateRoadmap?: () => void;
  className?: string;
}

// Priority indicators
const PRIORITY_CONFIG: Record<number, { color: string; label: string }> = {
  0: { color: "text-error", label: "Critical" },
  1: { color: "text-warning", label: "High" },
  2: { color: "text-primary", label: "Medium" },
  3: { color: "text-muted-foreground", label: "Normal" },
  4: { color: "text-muted-foreground", label: "Normal" },
};

// Action item with animation
function ActionItem({
  action,
  index,
  isChecked,
  onToggle,
}: {
  action: string;
  index: number;
  isChecked: boolean;
  onToggle: () => void;
}) {
  const priority = PRIORITY_CONFIG[index] || PRIORITY_CONFIG[4];

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        isChecked
          ? "border-success/30 bg-success/5"
          : "border-border/30 hover:border-border hover:bg-white/5"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0"
        >
          {isChecked ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              Step {index + 1}
            </span>
            <span className={cn("text-[10px] font-medium", priority.color)}>
              {priority.label}
            </span>
          </div>
          <p
            className={cn(
              "text-sm transition-colors",
              isChecked ? "text-muted-foreground line-through" : "text-foreground"
            )}
          >
            {action}
          </p>
        </div>
        <ArrowRight
          className={cn(
            "w-4 h-4 flex-shrink-0 transition-colors",
            isChecked ? "text-success" : "text-muted-foreground"
          )}
        />
      </div>
    </div>
  );
}

export function BeatingCompetitorGuide({
  competitorName,
  actionPlan,
  onGenerateRoadmap,
  className,
}: BeatingCompetitorGuideProps) {
  const [checkedItems, setCheckedItems] = React.useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  // Calculate progress
  const progress = actionPlan.length > 0
    ? Math.round((checkedItems.size / actionPlan.length) * 100)
    : 0;

  return (
    <div className={cn("card-secondary", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                How to Beat {competitorName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Prioritized action plan to outperform
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{progress}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action plan list */}
      <div className="p-4 space-y-3">
        {actionPlan.map((action, index) => (
          <ActionItem
            key={index}
            action={action}
            index={index}
            isChecked={checkedItems.has(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>

      {/* Footer with CTA */}
      <div className="p-4 border-t border-border/30 bg-muted/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>
              {checkedItems.size} of {actionPlan.length} actions tracked
            </span>
          </div>

          {onGenerateRoadmap && (
            <Button onClick={onGenerateRoadmap}>
              <Zap className="w-4 h-4 mr-2" />
              Generate Full Roadmap
            </Button>
          )}
        </div>

        {/* Success message when all complete */}
        {progress === 100 && (
          <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-sm text-success font-medium">
              All actions completed! Generate a full roadmap to continue improving.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
