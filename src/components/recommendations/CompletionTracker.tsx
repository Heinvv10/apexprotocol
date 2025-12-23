"use client";

import * as React from "react";
import { Play, CheckCircle2, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateQueries } from "@/lib/query/client";

// =============================================================================
// Types
// =============================================================================

export type RecommendationStatus = "pending" | "in_progress" | "completed" | "dismissed";

export interface CompletionTrackerRecommendation {
  id: string;
  status: RecommendationStatus;
  baselineScore?: number | null;
  postImplementationScore?: number | null;
  scoreImprovement?: number | null;
  effectivenessScore?: number | null;
  priority?: "critical" | "high" | "medium" | "low";
}

interface CompletionTrackerProps {
  recommendation: CompletionTrackerRecommendation;
  className?: string;
  onStatusChange?: (newStatus: RecommendationStatus) => void;
}

// =============================================================================
// Status Configuration
// =============================================================================

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground border-border",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
  },
  dismissed: {
    label: "Dismissed",
    className: "bg-muted text-muted-foreground border-border",
  },
};

// =============================================================================
// API Function
// =============================================================================

interface UpdateStatusPayload {
  id: string;
  status: RecommendationStatus;
  baselineScore?: number;
  postImplementationScore?: number;
}

async function updateRecommendationStatus(payload: UpdateStatusPayload) {
  const { id, status, baselineScore, postImplementationScore } = payload;

  const body: Record<string, unknown> = { status };
  if (baselineScore !== undefined) {
    body.baselineScore = baselineScore;
  }
  if (postImplementationScore !== undefined) {
    body.postImplementationScore = postImplementationScore;
  }

  const response = await fetch(`/api/recommendations/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update recommendation status");
  }

  return response.json();
}

// =============================================================================
// Hook for Status Updates with Scores
// =============================================================================

function useUpdateRecommendationStatusWithScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRecommendationStatus,
    onSuccess: () => {
      invalidateQueries.recommendations(queryClient);
    },
  });
}

// =============================================================================
// Score Input Dialog Component
// =============================================================================

interface ScoreInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder: string;
  onSubmit: (score: number) => void;
  isLoading?: boolean;
}

function ScoreInputDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  onSubmit,
  isLoading,
}: ScoreInputDialogProps) {
  const [score, setScore] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numScore = parseInt(score, 10);

    if (isNaN(numScore)) {
      setError("Please enter a valid number");
      return;
    }

    if (numScore < 0 || numScore > 100) {
      setError("Score must be between 0 and 100");
      return;
    }

    setError(null);
    onSubmit(numScore);
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScore(e.target.value);
    setError(null);
  };

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setScore("");
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <label htmlFor="score-input" className="text-sm font-medium text-foreground">
                GEO Score (0-100)
              </label>
              <Input
                id="score-input"
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={handleScoreChange}
                placeholder={placeholder}
                className={cn(error && "border-destructive")}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !score}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Score Display Component
// =============================================================================

interface ScoreDisplayProps {
  baselineScore?: number | null;
  postImplementationScore?: number | null;
  scoreImprovement?: number | null;
  effectivenessScore?: number | null;
}

function ScoreDisplay({
  baselineScore,
  postImplementationScore,
  scoreImprovement,
  effectivenessScore,
}: ScoreDisplayProps) {
  const hasScores = baselineScore != null || postImplementationScore != null;

  if (!hasScores) return null;

  const getImprovementIcon = () => {
    if (scoreImprovement == null) return null;
    if (scoreImprovement > 0) return <TrendingUp className="h-3 w-3 text-success" />;
    if (scoreImprovement < 0) return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getImprovementColor = () => {
    if (scoreImprovement == null) return "text-muted-foreground";
    if (scoreImprovement > 0) return "text-success";
    if (scoreImprovement < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {baselineScore != null && (
        <span className="text-muted-foreground">
          Baseline: <span className="text-foreground font-medium">{baselineScore}</span>
        </span>
      )}
      {postImplementationScore != null && (
        <span className="text-muted-foreground">
          Final: <span className="text-foreground font-medium">{postImplementationScore}</span>
        </span>
      )}
      {scoreImprovement != null && (
        <span className={cn("flex items-center gap-1", getImprovementColor())}>
          {getImprovementIcon()}
          <span className="font-medium">
            {scoreImprovement > 0 ? "+" : ""}{scoreImprovement} pts
          </span>
        </span>
      )}
      {effectivenessScore != null && (
        <span className="text-muted-foreground">
          Effectiveness: <span className="text-foreground font-medium">{effectivenessScore}%</span>
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CompletionTracker({
  recommendation,
  className,
  onStatusChange,
}: CompletionTrackerProps) {
  const [showStartDialog, setShowStartDialog] = React.useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = React.useState(false);

  const updateStatus = useUpdateRecommendationStatusWithScore();

  const handleStartImplementation = async (baselineScore: number) => {
    try {
      await updateStatus.mutateAsync({
        id: recommendation.id,
        status: "in_progress",
        baselineScore,
      });
      setShowStartDialog(false);
      onStatusChange?.("in_progress");
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleMarkCompleted = async (postImplementationScore: number) => {
    try {
      await updateStatus.mutateAsync({
        id: recommendation.id,
        status: "completed",
        postImplementationScore,
      });
      setShowCompleteDialog(false);
      onStatusChange?.("completed");
    } catch {
      // Error is handled by the mutation
    }
  };

  const status = recommendation.status;
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
            config.className
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Status-specific UI */}
      {status === "pending" && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowStartDialog(true)}
            disabled={updateStatus.isPending}
            className="gap-1"
          >
            <Play className="h-3 w-3" />
            Start Implementation
          </Button>

          <ScoreInputDialog
            open={showStartDialog}
            onOpenChange={setShowStartDialog}
            title="Start Implementation"
            description="Enter the current GEO score before implementing this recommendation. This baseline will be used to measure improvement."
            placeholder="e.g., 65"
            onSubmit={handleStartImplementation}
            isLoading={updateStatus.isPending}
          />
        </>
      )}

      {status === "in_progress" && (
        <>
          <ScoreDisplay
            baselineScore={recommendation.baselineScore}
          />

          <Button
            size="sm"
            variant="default"
            onClick={() => setShowCompleteDialog(true)}
            disabled={updateStatus.isPending}
            className="gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Mark Completed
          </Button>

          <ScoreInputDialog
            open={showCompleteDialog}
            onOpenChange={setShowCompleteDialog}
            title="Mark as Completed"
            description="Enter the GEO score after implementing this recommendation. The improvement will be calculated automatically."
            placeholder="e.g., 78"
            onSubmit={handleMarkCompleted}
            isLoading={updateStatus.isPending}
          />
        </>
      )}

      {status === "completed" && (
        <ScoreDisplay
          baselineScore={recommendation.baselineScore}
          postImplementationScore={recommendation.postImplementationScore}
          scoreImprovement={recommendation.scoreImprovement}
          effectivenessScore={recommendation.effectivenessScore}
        />
      )}

      {/* Error display */}
      {updateStatus.isError && (
        <p className="text-xs text-destructive">
          {updateStatus.error instanceof Error
            ? updateStatus.error.message
            : "Failed to update status"}
        </p>
      )}
    </div>
  );
}

export default CompletionTracker;
