"use client";

import * as React from "react";
import { X, Loader2, Clock, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateSchedule, useUpdateSchedule, ScheduleConfig } from "@/hooks/useSchedules";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: ScheduleConfig | null;
  onSuccess?: () => void;
}

type ScheduleType = "daily" | "weekly" | "monthly" | "once";
type JobType = "audit:scan" | "report:weekly" | "report:monthly";

export function ScheduleModal({ isOpen, onClose, schedule, onSuccess }: ScheduleModalProps) {
  const [name, setName] = React.useState(schedule?.name || "");
  const [type, setType] = React.useState<ScheduleType>(
    (schedule?.type as ScheduleType) || "daily"
  );
  const [jobType, setJobType] = React.useState<JobType>(
    (schedule?.jobType as JobType) || "audit:scan"
  );
  const [enabled, setEnabled] = React.useState(schedule?.enabled ?? true);

  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a schedule name");
      return;
    }

    try {
      if (schedule) {
        // Update existing
        await updateMutation.mutateAsync({
          id: schedule.id,
          name,
          type,
          jobType,
          enabled,
        });
      } else {
        // Create new
        await createMutation.mutateAsync({
          name,
          type,
          jobType,
          enabled,
        });
      }

      setName("");
      setType("daily");
      setJobType("audit:scan");
      setEnabled(true);
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  if (!isOpen) return null;

  const scheduleDescriptions: Record<ScheduleType, string> = {
    daily: "Run every day at 6 AM",
    weekly: "Run every Monday at 6 AM",
    monthly: "Run on the 1st of each month at 6 AM",
    once: "Run once and then stop",
  };

  const jobTypeLabels: Record<JobType, string> = {
    "audit:scan": "Site Audit Scan",
    "report:weekly": "Weekly Report",
    "report:monthly": "Monthly Report",
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-full mx-4">
        <div className="card-primary rounded-lg p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {schedule ? "Edit Schedule" : "Create Schedule"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded transition-colors"
              disabled={isLoading}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Schedule Name */}
            <div>
              <label className="text-sm font-medium block mb-1">Schedule Name</label>
              <Input
                placeholder="e.g., Daily Site Health Check"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Job Type */}
            <div>
              <label className="text-sm font-medium block mb-2">What to run</label>
              <div className="space-y-2">
                {(["audit:scan", "report:weekly", "report:monthly"] as const).map((jt) => (
                  <label key={jt} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent/30">
                    <input
                      type="radio"
                      name="jobType"
                      value={jt}
                      checked={jobType === jt}
                      onChange={(e) => setJobType(e.target.value as JobType)}
                      disabled={isLoading}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{jobTypeLabels[jt]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule Frequency */}
            <div>
              <label className="text-sm font-medium block mb-2 flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Frequency
              </label>
              <div className="space-y-2">
                {(["daily", "weekly", "monthly", "once"] as const).map((freq) => (
                  <label key={freq} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent/30">
                    <input
                      type="radio"
                      name="frequency"
                      value={freq}
                      checked={type === freq}
                      onChange={(e) => setType(e.target.value as ScheduleType)}
                      disabled={isLoading}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="text-sm capitalize font-medium">{freq}</div>
                      <div className="text-xs text-muted-foreground">{scheduleDescriptions[freq]}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="enabled" className="text-sm cursor-pointer flex-1">
                Enable this schedule
              </label>
            </div>

            {/* Next Run Preview */}
            {schedule && schedule.nextRun && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Next run:</p>
                  <p className="text-muted-foreground">
                    {new Date(schedule.nextRun).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {schedule ? "Update Schedule" : "Create Schedule"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
