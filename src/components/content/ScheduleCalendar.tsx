"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  Calendar,
  Clock,
  Send,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContentWorkflowStore } from "@/stores/content-workflow";
import { format, addDays, setHours, setMinutes, isBefore, startOfMinute } from "date-fns";

interface ScheduleCalendarProps {
  contentId: string;
  className?: string;
  onScheduleSuccess?: () => void;
}

// Platform options
const PLATFORMS = [
  { id: "wordpress", label: "WordPress" },
  { id: "medium", label: "Medium" },
] as const;

export function ScheduleCalendar({
  contentId,
  className,
  onScheduleSuccess,
}: ScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    addDays(new Date(), 1)
  );
  const [hours, setHours] = React.useState("09");
  const [minutes, setMinutes] = React.useState("00");
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>([
    "wordpress",
  ]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const addSchedule = useContentWorkflowStore((state) => state.addSchedule);
  const updateContentItem = useContentWorkflowStore(
    (state) => state.updateContentItem
  );

  // Handle platform checkbox toggle
  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  // Validate and format the scheduled datetime
  const getScheduledDateTime = (): Date | null => {
    if (!selectedDate) return null;

    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);

    if (isNaN(hoursNum) || isNaN(minutesNum)) return null;
    if (hoursNum < 0 || hoursNum > 23) return null;
    if (minutesNum < 0 || minutesNum > 59) return null;

    let scheduledDate = setHours(selectedDate, hoursNum);
    scheduledDate = setMinutes(scheduledDate, minutesNum);
    scheduledDate = startOfMinute(scheduledDate);

    return scheduledDate;
  };

  // Handle schedule submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!selectedDate) {
      setError("Please select a date");
      return;
    }

    const scheduledDateTime = getScheduledDateTime();
    if (!scheduledDateTime) {
      setError("Invalid time format. Please use 24-hour format (00-23).");
      return;
    }

    // Check if date is in the past
    if (isBefore(scheduledDateTime, new Date())) {
      setError("Scheduled time must be in the future");
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError("Please select at least one platform");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/content/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          scheduledAt: scheduledDateTime.toISOString(),
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create schedule");
      }

      // Update local state
      if (data.data.schedule) {
        addSchedule(data.data.schedule);
      }

      // Update content status to scheduled
      updateContentItem(contentId, {
        status: "scheduled",
        updatedAt: new Date().toISOString(),
      });

      setSuccess(true);

      // Call success callback if provided
      if (onScheduleSuccess) {
        setTimeout(() => {
          onScheduleSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create schedule"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle hour input change
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value === "" || (parseInt(value, 10) >= 0 && parseInt(value, 10) <= 23)) {
      setHours(value.padStart(2, "0"));
    }
  };

  // Handle minute input change
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value === "" || (parseInt(value, 10) >= 0 && parseInt(value, 10) <= 59)) {
      setMinutes(value.padStart(2, "0"));
    }
  };

  const scheduledDateTime = getScheduledDateTime();

  return (
    <div className={cn("card-secondary space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{
            backgroundColor: "hsl(var(--primary) / 0.1)",
            color: "hsl(var(--primary))",
          }}
        >
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Schedule Publication</h3>
          <p className="text-sm text-muted-foreground">
            Choose a date and time to publish your content
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Calendar Picker */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Date</Label>
          <div className="flex justify-center p-4 border rounded-lg bg-background/50">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={{ before: new Date() }}
              className="rdp-custom"
            />
          </div>
        </div>

        {/* Time Inputs */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Time</Label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={hours}
                onChange={handleHoursChange}
                placeholder="HH"
                maxLength={2}
                className="text-center font-mono text-lg"
                aria-label="Hours"
              />
              <span className="text-lg font-semibold text-muted-foreground">
                :
              </span>
              <Input
                type="text"
                value={minutes}
                onChange={handleMinutesChange}
                placeholder="MM"
                maxLength={2}
                className="text-center font-mono text-lg"
                aria-label="Minutes"
              />
            </div>
            {scheduledDateTime && (
              <div className="text-sm text-muted-foreground">
                {format(scheduledDateTime, "h:mm a")}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Use 24-hour format (00-23). All times are in your local timezone.
          </p>
        </div>

        {/* Platform Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Publish To</Label>
          <div className="grid grid-cols-2 gap-3">
            {PLATFORMS.map((platform) => (
              <label
                key={platform.id}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                  selectedPlatforms.includes(platform.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform.id)}
                  onChange={() => handlePlatformToggle(platform.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 focus:ring-2"
                />
                <span className="text-sm font-medium capitalize">
                  {platform.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Scheduled DateTime Preview */}
        {scheduledDateTime && selectedPlatforms.length > 0 && (
          <div
            className="flex items-start gap-3 p-3 rounded-lg border"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.05)",
              borderColor: "hsl(var(--primary) / 0.3)",
            }}
          >
            <Clock className="h-4 w-4 text-primary mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Schedule Summary</p>
              <p className="text-sm text-muted-foreground mt-1">
                {format(
                  scheduledDateTime,
                  "EEEE, MMMM d, yyyy 'at' h:mm a"
                )}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedPlatforms.map((platform) => (
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
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
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
                Scheduling Failed
              </p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg border"
            style={{
              backgroundColor: "hsl(var(--success) / 0.05)",
              borderColor: "hsl(var(--success) / 0.3)",
            }}
          >
            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-success">
                Schedule Created
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your content has been scheduled for publication
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={
            isSubmitting ||
            !selectedDate ||
            !scheduledDateTime ||
            selectedPlatforms.length === 0
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Schedule...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Schedule Publication
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
