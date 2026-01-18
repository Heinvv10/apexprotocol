"use client";

import * as React from "react";
import {
  Loader2,
  Play,
  Pause,
  CheckCircle2,
  RefreshCw,
  Target,
  Calendar,
  Zap,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RoadmapPhaseCard } from "./roadmap-phase-card";
import { ProgressTimeline } from "./progress-timeline";
import { RoadmapGenerator } from "./roadmap-generator";
import { ScoreBadge } from "./score-badge";

interface ActionItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  category: "geo" | "seo" | "aeo" | "smo" | "ppo";
  phase: number;
  orderInPhase: number;
  status: "pending" | "in_progress" | "completed" | "skipped";
  expectedScoreImpact: number;
  expectedDaysToComplete: number;
  difficulty: "easy" | "medium" | "hard";
  actionItems: ActionItem[];
  actualScoreImpact?: number;
}

interface Roadmap {
  id: string;
  brandId: string;
  title: string;
  description: string;
  targetPosition: "leader" | "top3" | "competitive";
  targetCompetitor?: string;
  currentUnifiedScore: number;
  targetUnifiedScore: number;
  currentGrade: string;
  targetGrade: string;
  estimatedWeeks: number;
  status: "draft" | "active" | "paused" | "completed";
  progressPercentage: number;
  milestones: Milestone[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface ProgressSnapshot {
  snapshotDate: string;
  geoScore: number;
  seoScore: number;
  aeoScore: number;
  smoScore: number;
  ppoScore: number;
  unifiedScore: number;
  milestonesCompleted: number;
}

interface ImprovementRoadmapProps {
  brandId: string;
  brandName: string;
  currentScore: number;
  competitors?: Array<{ name: string; unifiedScore: number }>;
  className?: string;
}

// Phase titles
const PHASE_TITLES: Record<number, { title: string; description: string }> = {
  1: { title: "Quick Wins", description: "High-impact, easy-to-implement improvements" },
  2: { title: "Month 1 Focus", description: "Core improvements for significant gains" },
  3: { title: "Ongoing Optimization", description: "Continuous improvement for sustained growth" },
};

export function ImprovementRoadmap({
  brandId,
  brandName,
  currentScore,
  competitors = [],
  className,
}: ImprovementRoadmapProps) {
  const [roadmap, setRoadmap] = React.useState<Roadmap | null>(null);
  const [snapshots, setSnapshots] = React.useState<ProgressSnapshot[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showGenerator, setShowGenerator] = React.useState(false);

  // Fetch roadmap
  const fetchRoadmap = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/competitive/roadmap`, window.location.origin);
      url.searchParams.set("brandId", brandId);
      url.searchParams.set("includeSnapshots", "true");

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch roadmap");

      const data = await response.json();
      setRoadmap(data.activeRoadmap || null);
      setSnapshots(data.snapshots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  React.useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  // Update roadmap status
  const updateRoadmapStatus = async (action: "start" | "pause" | "resume" | "complete") => {
    if (!roadmap) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/competitive/roadmap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          brandId,
          action,
        }),
      });

      if (!response.ok) throw new Error("Failed to update roadmap");
      await fetchRoadmap();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  // Update milestone status
  const updateMilestoneStatus = async (
    milestoneId: string,
    action: "start" | "complete" | "skip" | "reset",
    actualScoreImpact?: number
  ) => {
    if (!roadmap) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/competitive/roadmap/${roadmap.id}/milestone`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId,
          action,
          actualScoreImpact,
        }),
      });

      if (!response.ok) throw new Error("Failed to update milestone");
      await fetchRoadmap();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  // Update action item
  const updateActionItem = async (
    milestoneId: string,
    actionItemId: string,
    isCompleted: boolean
  ) => {
    if (!roadmap) return;

    try {
      const response = await fetch(`/api/competitive/roadmap/${roadmap.id}/milestone`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId,
          action: "updateActionItem",
          actionItemId,
          isCompleted,
        }),
      });

      if (!response.ok) throw new Error("Failed to update action item");
      await fetchRoadmap();
    } catch (err) {
      console.error("Failed to update action item:", err);
    }
  };

  // Group milestones by phase
  const phaseGroups = React.useMemo(() => {
    if (!roadmap) return [];

    const groups: Record<number, Milestone[]> = {};
    roadmap.milestones.forEach((milestone) => {
      if (!groups[milestone.phase]) {
        groups[milestone.phase] = [];
      }
      groups[milestone.phase].push(milestone);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([phase, milestones]) => ({
        phase: Number(phase),
        ...PHASE_TITLES[Number(phase)],
        milestones: milestones.sort((a, b) => a.orderInPhase - b.orderInPhase),
      }));
  }, [roadmap]);

  if (isLoading) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("card-secondary p-6", className)}>
        <div className="flex flex-col items-center justify-center h-[400px] text-error">
          <p>{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={fetchRoadmap}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No roadmap - show generator prompt
  if (!roadmap) {
    return (
      <>
        <div className={cn("card-secondary p-8", className)}>
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Start Your Improvement Journey
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Generate a personalized roadmap with actionable milestones to improve
              your competitive position and beat your competitors.
            </p>
            <Button size="lg" onClick={() => setShowGenerator(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Roadmap
            </Button>
          </div>
        </div>

        <RoadmapGenerator
          brandId={brandId}
          competitors={competitors}
          currentScore={currentScore}
          open={showGenerator}
          onOpenChange={setShowGenerator}
          onGenerated={fetchRoadmap}
        />
      </>
    );
  }

  return (
    <>
      <div className={cn("space-y-6", className)}>
        {/* Header card */}
        <div className="card-secondary overflow-hidden">
          <div className="p-6 border-b border-border/30">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      roadmap.status === "active"
                        ? "bg-success/20 text-success"
                        : roadmap.status === "paused"
                        ? "bg-warning/20 text-warning"
                        : roadmap.status === "completed"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/20 text-muted-foreground"
                    )}
                  >
                    {roadmap.status.charAt(0).toUpperCase() + roadmap.status.slice(1)}
                  </span>
                  {roadmap.targetCompetitor && (
                    <span className="text-xs text-muted-foreground">
                      Target: {roadmap.targetCompetitor}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground">{roadmap.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {roadmap.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {roadmap.status === "draft" && (
                  <Button
                    onClick={() => updateRoadmapStatus("start")}
                    disabled={isUpdating}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Roadmap
                  </Button>
                )}
                {roadmap.status === "active" && (
                  <Button
                    variant="outline"
                    onClick={() => updateRoadmapStatus("pause")}
                    disabled={isUpdating}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                {roadmap.status === "paused" && (
                  <Button
                    onClick={() => updateRoadmapStatus("resume")}
                    disabled={isUpdating}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                )}
                {roadmap.progressPercentage === 100 && roadmap.status === "active" && (
                  <Button
                    onClick={() => updateRoadmapStatus("complete")}
                    disabled={isUpdating}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchRoadmap}
                  disabled={isUpdating}
                >
                  <RefreshCw className={cn("w-4 h-4", isUpdating && "animate-spin")} />
                </Button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t border-border/30">
              <div className="flex items-center gap-3">
                <ScoreBadge score={roadmap.currentUnifiedScore} size="md" />
                <div>
                  <div className="text-xs text-muted-foreground">Current</div>
                  <div className="text-sm font-medium text-foreground">
                    {roadmap.currentGrade}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl">→</div>
                <ScoreBadge score={roadmap.targetUnifiedScore} size="md" />
                <div>
                  <div className="text-xs text-muted-foreground">Target</div>
                  <div className="text-sm font-medium text-foreground">
                    {roadmap.targetGrade}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {roadmap.progressPercentage}%
                </div>
                <div className="text-xs text-muted-foreground">Progress</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-lg font-semibold text-foreground">
                    ~{roadmap.estimatedWeeks} weeks
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Estimated</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary via-cyan-500 to-success rounded-full transition-all"
                  style={{ width: `${roadmap.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Progress timeline */}
        {snapshots.length > 0 && (
          <ProgressTimeline
            snapshots={snapshots.map((s) => ({
              ...s,
              date: s.snapshotDate,
            }))}
            targetScore={roadmap.targetUnifiedScore}
          />
        )}

        {/* Phase cards */}
        <div className="space-y-4">
          {phaseGroups.map(({ phase, title, description, milestones }) => (
            <RoadmapPhaseCard
              key={phase}
              phase={phase}
              title={title}
              description={description}
              milestones={milestones}
              isExpanded={phase === 1}
              onMilestoneStart={(id) => updateMilestoneStatus(id, "start")}
              onMilestoneComplete={(id, score) =>
                updateMilestoneStatus(id, "complete", score)
              }
              onMilestoneSkip={(id) => updateMilestoneStatus(id, "skip")}
              onMilestoneReset={(id) => updateMilestoneStatus(id, "reset")}
              onActionItemToggle={(milestoneId, actionItemId, isCompleted) =>
                updateActionItem(milestoneId, actionItemId, isCompleted)
              }
            />
          ))}
        </div>
      </div>

      <RoadmapGenerator
        brandId={brandId}
        competitors={competitors}
        currentScore={currentScore}
        open={showGenerator}
        onOpenChange={setShowGenerator}
        onGenerated={fetchRoadmap}
      />
    </>
  );
}
