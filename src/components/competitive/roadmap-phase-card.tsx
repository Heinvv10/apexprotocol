"use client";

import * as React from "react";
import { Zap, Clock, Target, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { MilestoneCard } from "./milestone-card";

interface ActionItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface Milestone {
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
}

interface RoadmapPhaseCardProps {
  phase: number;
  title: string;
  description: string;
  milestones: Milestone[];
  isExpanded?: boolean;
  onMilestoneStart?: (milestoneId: string) => void;
  onMilestoneComplete?: (milestoneId: string, actualScoreImpact: number) => void;
  onMilestoneSkip?: (milestoneId: string) => void;
  onMilestoneReset?: (milestoneId: string) => void;
  onActionItemToggle?: (milestoneId: string, actionItemId: string, isCompleted: boolean) => void;
  className?: string;
}

// Phase config
const PHASE_CONFIG: Record<number, { color: string; bg: string; icon: typeof Zap }> = {
  1: { color: "text-success", bg: "bg-success/10", icon: Zap },
  2: { color: "text-warning", bg: "bg-warning/10", icon: Target },
  3: { color: "text-purple-400", bg: "bg-purple-400/10", icon: Clock },
};

export function RoadmapPhaseCard({
  phase,
  title,
  description,
  milestones,
  isExpanded: initialExpanded = phase === 1,
  onMilestoneStart,
  onMilestoneComplete,
  onMilestoneSkip,
  onMilestoneReset,
  onActionItemToggle,
  className,
}: RoadmapPhaseCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded);

  const config = PHASE_CONFIG[phase] || PHASE_CONFIG[1];
  const PhaseIcon = config.icon;

  // Calculate phase stats
  const stats = React.useMemo(() => {
    const completed = milestones.filter((m) => m.status === "completed").length;
    const inProgress = milestones.filter((m) => m.status === "in_progress").length;
    const total = milestones.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const totalExpectedImpact = milestones.reduce(
      (sum, m) => sum + m.expectedScoreImpact,
      0
    );
    const totalActualImpact = milestones
      .filter((m) => m.status === "completed")
      .reduce((sum, m) => sum + (m.actualScoreImpact || m.expectedScoreImpact), 0);

    const totalDays = milestones.reduce(
      (sum, m) => sum + m.expectedDaysToComplete,
      0
    );

    return {
      completed,
      inProgress,
      total,
      progress,
      totalExpectedImpact,
      totalActualImpact,
      totalDays,
    };
  }, [milestones]);

  // Determine phase status
  const phaseStatus = React.useMemo(() => {
    if (stats.completed === stats.total) return "completed";
    if (stats.inProgress > 0 || stats.completed > 0) return "in_progress";
    return "pending";
  }, [stats]);

  return (
    <div
      className={cn(
        "border rounded-xl overflow-hidden",
        phaseStatus === "completed"
          ? "border-success/30"
          : phaseStatus === "in_progress"
          ? "border-warning/30"
          : "border-border/30",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "p-4 cursor-pointer transition-colors",
          phaseStatus === "completed"
            ? "bg-success/5 hover:bg-success/10"
            : phaseStatus === "in_progress"
            ? "bg-warning/5 hover:bg-warning/10"
            : "bg-card/50 hover:bg-white/5"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                config.bg
              )}
            >
              <PhaseIcon className={cn("w-5 h-5", config.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-medium", config.color)}>
                  Phase {phase}
                </span>
                {phaseStatus === "completed" && (
                  <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded">
                    Complete
                  </span>
                )}
                {phaseStatus === "in_progress" && (
                  <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                    In Progress
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <div className="font-semibold text-foreground">
                  {stats.completed}/{stats.total}
                </div>
                <div className="text-[10px] text-muted-foreground">milestones</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-success">
                  +{stats.totalExpectedImpact}
                </div>
                <div className="text-[10px] text-muted-foreground">points</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-muted-foreground">
                  ~{stats.totalDays}d
                </div>
                <div className="text-[10px] text-muted-foreground">estimate</div>
              </div>
            </div>

            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 ml-13">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Phase progress</span>
            <span className={cn("font-medium", config.color)}>{stats.progress}%</span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                phaseStatus === "completed"
                  ? "bg-success"
                  : phaseStatus === "in_progress"
                  ? "bg-warning"
                  : "bg-muted"
              )}
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestones */}
      {isExpanded && (
        <div className="p-4 space-y-3 border-t border-border/30">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              {...milestone}
              onStart={() => onMilestoneStart?.(milestone.id)}
              onComplete={(score) => onMilestoneComplete?.(milestone.id, score)}
              onSkip={() => onMilestoneSkip?.(milestone.id)}
              onReset={() => onMilestoneReset?.(milestone.id)}
              onActionItemToggle={(actionItemId, isCompleted) =>
                onActionItemToggle?.(milestone.id, actionItemId, isCompleted)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
