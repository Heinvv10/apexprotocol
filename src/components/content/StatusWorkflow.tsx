"use client";

import * as React from "react";
import {
  FileEdit,
  Eye,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useContentWorkflowStore,
  useContentSchedules,
  type ContentItem,
} from "@/stores/content-workflow";
import { format, parseISO } from "date-fns";

interface StatusWorkflowProps {
  contentId: string;
  className?: string;
  onScheduleClick?: () => void;
}

// Status configuration with colors, icons, and labels
const statusConfig = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    variant: "secondary" as const,
    color: "hsl(var(--muted-foreground))",
    bgColor: "hsl(var(--muted) / 0.3)",
  },
  review: {
    label: "In Review",
    icon: Eye,
    variant: "default" as const,
    color: "hsl(var(--primary))",
    bgColor: "hsl(var(--primary) / 0.1)",
  },
  scheduled: {
    label: "Scheduled",
    icon: Calendar,
    variant: "warning" as const,
    color: "hsl(var(--warning))",
    bgColor: "hsl(var(--warning) / 0.1)",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    variant: "success" as const,
    color: "hsl(var(--success))",
    bgColor: "hsl(var(--success) / 0.1)",
  },
};

// Workflow transitions: what statuses can transition to what
const allowedTransitions: Record<
  ContentItem["status"],
  Array<ContentItem["status"]>
> = {
  draft: ["review", "scheduled"],
  review: ["draft", "scheduled"],
  scheduled: ["draft", "published"],
  published: [], // Terminal state
};

// Transition button labels
const transitionLabels: Record<string, string> = {
  "draft-review": "Submit for Review",
  "draft-scheduled": "Schedule",
  "review-draft": "Return to Draft",
  "review-scheduled": "Approve & Schedule",
  "scheduled-draft": "Cancel Schedule",
  "scheduled-published": "Publish Now",
};

export function StatusWorkflow({
  contentId,
  className,
  onScheduleClick,
}: StatusWorkflowProps) {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [transitionError, setTransitionError] = React.useState<string | null>(
    null
  );

  // Get content and schedules from store
  const content = useContentWorkflowStore(
    (state) => state.contentItems.find((item) => item.id === contentId) ?? null
  );
  const schedules = useContentSchedules(contentId);
  const transitionStatus = useContentWorkflowStore(
    (state) => state.transitionStatus
  );

  if (!content) {
    return (
      <div className={cn("card-tertiary", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Content not found</span>
        </div>
      </div>
    );
  }

  const currentStatus = content.status;
  const statusInfo = statusConfig[currentStatus];
  const StatusIcon = statusInfo.icon;

  // Get active schedule if status is scheduled
  const activeSchedule = schedules.find(
    (s) => s.status === "pending" && s.contentId === contentId
  );

  // Handle status transition
  const handleTransition = async (newStatus: ContentItem["status"]) => {
    // If transitioning to scheduled, call the onScheduleClick handler instead
    if (newStatus === "scheduled" && onScheduleClick) {
      onScheduleClick();
      return;
    }

    setIsTransitioning(true);
    setTransitionError(null);

    try {
      await transitionStatus(contentId, newStatus);
    } catch (error) {
      setTransitionError(
        error instanceof Error ? error.message : "Failed to transition status"
      );
    } finally {
      setIsTransitioning(false);
    }
  };

  // Get available transitions for current status
  const availableTransitions = allowedTransitions[currentStatus] || [];

  return (
    <div className={cn("card-secondary space-y-4", className)}>
      {/* Current Status Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{
              backgroundColor: statusInfo.bgColor,
              color: statusInfo.color,
            }}
          >
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Current Status
            </p>
            <Badge variant={statusInfo.variant} className="mt-1">
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Last Updated</p>
          <p className="text-sm font-medium">
            {format(parseISO(content.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      {/* Schedule Information (if scheduled) */}
      {currentStatus === "scheduled" && activeSchedule && (
        <div
          className="flex items-start gap-3 p-3 rounded-lg border"
          style={{
            backgroundColor: "hsl(var(--warning) / 0.05)",
            borderColor: "hsl(var(--warning) / 0.3)",
          }}
        >
          <Clock className="h-4 w-4 text-warning mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Scheduled for Publishing</p>
            <p className="text-sm text-muted-foreground mt-1">
              {format(parseISO(activeSchedule.scheduledAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
            {activeSchedule.platforms && activeSchedule.platforms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activeSchedule.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize"
                    style={{
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {platform}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transition Error */}
      {transitionError && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg border"
          style={{
            backgroundColor: "hsl(var(--destructive) / 0.05)",
            borderColor: "hsl(var(--destructive) / 0.3)",
          }}
        >
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              Transition Failed
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {transitionError}
            </p>
          </div>
        </div>
      )}

      {/* Available Transitions */}
      {availableTransitions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Available Actions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableTransitions.map((nextStatus) => {
              const nextStatusInfo = statusConfig[nextStatus];
              const NextIcon = nextStatusInfo.icon;
              const transitionKey = `${currentStatus}-${nextStatus}` as const;
              const label =
                transitionLabels[transitionKey] || `Move to ${nextStatusInfo.label}`;

              return (
                <Button
                  key={nextStatus}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => handleTransition(nextStatus)}
                  disabled={isTransitioning}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{
                        backgroundColor: nextStatusInfo.bgColor,
                        color: nextStatusInfo.color,
                      }}
                    >
                      <NextIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {nextStatusInfo.label}
                      </p>
                    </div>
                    {isTransitioning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* No transitions available (published state) */}
      {availableTransitions.length === 0 && currentStatus === "published" && (
        <div className="text-center py-6">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
          <p className="text-sm font-medium">Content Published</p>
          <p className="text-xs text-muted-foreground mt-1">
            This content has been successfully published and cannot be modified
            through the workflow.
          </p>
        </div>
      )}
    </div>
  );
}
