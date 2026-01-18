"use client";

import * as React from "react";
import { TrendingUp, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Roadmap } from "@/hooks/useRoadmapGenerator";

interface ProgressTimelineProps {
  roadmap: Roadmap;
}

export function ProgressTimeline({ roadmap }: ProgressTimelineProps) {
  // Calculate projected scores for each phase
  const phaseProjections = roadmap.phases.map((phase, index) => {
    const cumulativeImpact = roadmap.phases
      .slice(0, index + 1)
      .reduce((sum, p) => sum + p.totalExpectedImpact, 0);
    return {
      phase: phase.phase,
      title: phase.title,
      projectedScore: Math.min(100, roadmap.currentUnifiedScore + cumulativeImpact),
      expectedImpact: phase.totalExpectedImpact,
    };
  });

  const currentPhase = roadmap.phases.findIndex(
    (p) => p.milestones.some((m) => m.status !== "completed")
  );

  return (
    <div className="card-secondary p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Projected Score Growth</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Expected unified score progression as you complete milestones
        </p>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-tertiary p-4 border rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Current Score</div>
          <div className="text-3xl font-bold text-primary">
            {roadmap.currentUnifiedScore}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Grade: {roadmap.currentGrade}</div>
        </div>

        <div className="card-tertiary p-4 border rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Total Impact</div>
          <div className="text-3xl font-bold text-success">
            +{roadmap.phases.reduce((sum, p) => sum + p.totalExpectedImpact, 0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Across all phases</div>
        </div>

        <div className="card-tertiary p-4 border rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Target Score</div>
          <div className="text-3xl font-bold text-warning">
            {roadmap.targetUnifiedScore}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Grade: {roadmap.targetGrade}
          </div>
        </div>

        <div className="card-tertiary p-4 border rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Estimated Timeline</div>
          <div className="text-3xl font-bold text-cyan-400">
            {roadmap.estimatedWeeks}w
          </div>
          <div className="text-xs text-muted-foreground mt-1">To complete roadmap</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Phase Progression</h4>

        {phaseProjections.map((phase, index) => (
          <div key={phase.phase} className="relative">
            {/* Connection Line */}
            {index < phaseProjections.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-primary to-transparent" />
            )}

            {/* Phase Card */}
            <div className="relative card-tertiary p-4 border rounded-lg">
              <div className="flex items-start gap-4">
                {/* Timeline Dot */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                      index <= currentPhase
                        ? "bg-primary text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {phase.phase}
                  </div>
                </div>

                {/* Phase Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-foreground mb-1">
                    {phase.title}
                  </h5>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Expected Impact
                      </div>
                      <div className="font-semibold text-success">
                        +{phase.expectedImpact}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Projected Score
                      </div>
                      <div className="font-semibold text-primary">
                        {phase.projectedScore}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Percentile Rank
                      </div>
                      <div className="font-semibold text-warning">
                        {Math.round((phase.projectedScore / 100) * 100)}th
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Progress to Target
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {Math.round(
                          ((phase.projectedScore - roadmap.currentUnifiedScore) /
                            (roadmap.targetUnifiedScore - roadmap.currentUnifiedScore)) *
                            100
                        )}%
                      </span>
                    </div>
                    <Progress
                      value={
                        ((phase.projectedScore - roadmap.currentUnifiedScore) /
                          (roadmap.targetUnifiedScore - roadmap.currentUnifiedScore)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </div>

                {/* Status Badge */}
                {phase.projectedScore >= roadmap.targetUnifiedScore && (
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-success/10 border border-success/20">
                      <Target className="h-3 w-3 text-success" />
                      <span className="text-xs font-medium text-success">
                        Target
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Timeline */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-foreground">Achievement Milestones</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>Phase 1: +12 points in 1-2 weeks (momentum builder)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span>Phase 2: +18 points in 2-4 weeks (authority building)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Phase 3: +8 points ongoing (maintenance)</span>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <strong>Total: +38 points over {roadmap.estimatedWeeks} weeks</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
