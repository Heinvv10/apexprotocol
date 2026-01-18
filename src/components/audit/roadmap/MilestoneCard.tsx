"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Milestone } from "@/hooks/useRoadmapGenerator";

interface MilestoneCardProps {
  milestone: Milestone;
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const completedItems = milestone.actionItems.filter(
    (item) => item.completed
  ).length;
  const totalItems = milestone.actionItems.length;
  const progress = Math.round((completedItems / totalItems) * 100);

  const categoryColors = {
    geo: "text-blue-400",
    seo: "text-purple-400",
    aeo: "text-cyan-400",
    smo: "text-pink-400",
    ppo: "text-green-400",
  };

  const categoryBgColors = {
    geo: "bg-blue-400/10 border-blue-400/20",
    seo: "bg-purple-400/10 border-purple-400/20",
    aeo: "bg-cyan-400/10 border-cyan-400/20",
    smo: "bg-pink-400/10 border-pink-400/20",
    ppo: "bg-green-400/10 border-green-400/20",
  };

  const difficultyColors = {
    easy: { text: "text-success", bg: "bg-success/5 border-success/20" },
    medium: { text: "text-warning", bg: "bg-warning/5 border-warning/20" },
    hard: { text: "text-error", bg: "bg-error/5 border-error/20" },
  };

  const statusIcons = {
    pending: <Circle className="h-4 w-4 text-muted-foreground" />,
    in_progress: <Clock className="h-4 w-4 text-warning animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  };

  return (
    <div className={`border rounded-lg p-4 ${categoryBgColors[milestone.category]}`}>
      {/* Milestone Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {statusIcons[milestone.status]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">
                {milestone.title}
              </h4>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${categoryColors[milestone.category]}`}
              >
                {milestone.category.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {milestone.description}
            </p>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Milestone Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/50">
          <div>
            <div className="text-xs text-muted-foreground">Score Impact</div>
            <div className="font-semibold text-primary">
              +{milestone.expectedScoreImpact}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="font-semibold text-foreground">
              {milestone.expectedDaysToComplete}d
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Difficulty</div>
            <div
              className={`font-semibold text-xs capitalize ${difficultyColors[milestone.difficulty].text}`}
            >
              {milestone.difficulty}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tasks</div>
            <div className="font-semibold text-foreground">
              {completedItems}/{totalItems}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Completion</span>
            <span className="text-xs font-semibold text-foreground">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-primary to-success h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>

      {/* Action Items */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
          <h5 className="text-sm font-medium text-foreground mb-3">
            Action Items
          </h5>
          {milestone.actionItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-2 rounded hover:bg-muted/20 transition-colors"
            >
              <Checkbox
                checked={item.completed}
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {item.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="capitalize">
                    {item.effort} effort
                  </span>
                  <span>•</span>
                  <span>{item.estimatedDays}d est.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
