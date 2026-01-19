"use client";

import * as React from "react";
import { Loader2, Trash2, Edit2, Clock, CheckCircle2, AlertCircle, ToggleRight, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchedules, useDeleteSchedule, useToggleSchedule, ScheduleConfig } from "@/hooks/useSchedules";
import { formatDistanceToNow } from "date-fns";

interface ScheduledAuditsListProps {
  onEditClick?: (schedule: ScheduleConfig) => void;
}

const jobTypeLabels: Record<string, string> = {
  "audit:scan": "Site Audit",
  "report:weekly": "Weekly Report",
  "report:monthly": "Monthly Report",
};

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  once: "One-time",
};

export function ScheduledAuditsList({ onEditClick }: ScheduledAuditsListProps) {
  const { data: schedules, isLoading, error } = useSchedules();
  const deleteMutation = useDeleteSchedule();
  const toggleMutation = useToggleSchedule();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-tertiary p-6 text-center">
        <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
        <p className="text-muted-foreground">Error loading schedules</p>
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="card-tertiary p-6 text-center">
        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No schedules created yet</p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggle = (id: string, currentEnabled: boolean) => {
    toggleMutation.mutate({ scheduleId: id, enabled: !currentEnabled });
  };

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <div
          key={schedule.id}
          className={`card-secondary p-4 border transition-all ${
            schedule.enabled ? "border-primary/30" : "border-border/50 opacity-75"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm">{schedule.name}</h3>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                    {frequencyLabels[schedule.type]}
                  </span>
                  <span className="text-xs px-2 py-1 bg-muted/50 text-muted-foreground rounded">
                    {jobTypeLabels[schedule.jobType]}
                  </span>
                </div>
              </div>

              {/* Next Run */}
              {schedule.nextRun && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Next run:</span>{" "}
                    {new Date(schedule.nextRun).toLocaleString()}
                  </p>
                  {schedule.lastRun && (
                    <p>
                      <span className="font-medium">Last run:</span>{" "}
                      {formatDistanceToNow(new Date(schedule.lastRun), { addSuffix: true })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Status Indicator */}
              {schedule.enabled ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}

              {/* Toggle Button */}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => handleToggle(schedule.id, schedule.enabled)}
                disabled={toggleMutation.isPending}
                title={schedule.enabled ? "Disable schedule" : "Enable schedule"}
              >
                {schedule.enabled ? (
                  <ToggleRight className="h-4 w-4 text-primary" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>

              {/* Edit Button */}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onEditClick?.(schedule)}
                disabled={toggleMutation.isPending || deleteMutation.isPending}
                title="Edit schedule"
              >
                <Edit2 className="h-4 w-4" />
              </Button>

              {/* Delete Button */}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-error hover:text-error hover:bg-error/10"
                onClick={() => handleDelete(schedule.id)}
                disabled={toggleMutation.isPending || deleteMutation.isPending}
                title="Delete schedule"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
