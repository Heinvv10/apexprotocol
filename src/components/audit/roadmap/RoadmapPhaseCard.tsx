"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Zap, Target, Calendar } from "lucide-react";
import { MilestoneCard } from "./MilestoneCard";
import type { RoadmapPhase } from "@/hooks/useRoadmapGenerator";

interface RoadmapPhaseCardProps {
  phase: RoadmapPhase;
  isExpanded: boolean;
  onToggle: () => void;
}

export function RoadmapPhaseCard({
  phase,
  isExpanded,
  onToggle,
}: RoadmapPhaseCardProps) {
  const completedMilestones = phase.milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const phaseProgress = Math.round(
    (completedMilestones / phase.milestones.length) * 100
  );

  const phaseIcons = {
    1: "⚡",
    2: "🎯",
    3: "🚀",
  };

  return (
    <div className="card-secondary border rounded-lg overflow-hidden">
      {/* Phase Header */}
      <button
        onClick={onToggle}
        className="w-full p-6 hover:bg-card-tertiary/50 transition-colors text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{phaseIcons[phase.phase]}</span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Phase {phase.phase}: {phase.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {phase.description}
                </p>
              </div>
            </div>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Phase Summary */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-warning" />
            <div>
              <div className="text-xs text-muted-foreground">Expected Impact</div>
              <div className="font-semibold text-foreground">
                +{phase.totalExpectedImpact} pts
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="font-semibold text-foreground">{phase.duration}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-success" />
            <div>
              <div className="text-xs text-muted-foreground">Progress</div>
              <div className="font-semibold text-foreground">
                {completedMilestones}/{phase.milestones.length}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Phase Progress
            </span>
            <span className="text-xs font-semibold text-foreground">
              {phaseProgress}%
            </span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-success h-full rounded-full transition-all"
              style={{ width: `${phaseProgress}%` }}
            />
          </div>
        </div>
      </button>

      {/* Milestones List */}
      {isExpanded && (
        <div className="border-t border-border p-6 space-y-4 bg-card-tertiary/30">
          {phase.milestones.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </div>
      )}
    </div>
  );
}
