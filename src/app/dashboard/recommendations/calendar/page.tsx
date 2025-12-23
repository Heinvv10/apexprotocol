"use client";

import * as React from "react";
import Link from "next/link";
import {
  Lightbulb,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Sparkles,
  BarChart3,
  Zap,
  Target,
  Calendar,
  Settings,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useSelectedBrand } from "@/stores";

// Types (exported for API integration)
export type Priority = "critical" | "high" | "medium" | "low";
export type RecommendationType = "schema" | "content" | "technical" | "ai-visibility";
export type Status = "pending" | "in_progress" | "completed" | "dismissed";

export interface CalendarRecommendation {
  id: string;
  title: string;
  priority: Priority;
  type: RecommendationType;
  status: Status;
  dueDate: Date;
}

// Loading state component
function CalendarLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading recommendations...</p>
      </div>
    </div>
  );
}

// Error state component
function CalendarErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">Failed to Load Recommendations</h3>
          <p className="text-muted-foreground text-sm">
            There was an error loading your recommendations. Please try again.
          </p>
        </div>

        <Button onClick={onRetry} variant="outline">
          <AlertCircle className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

// Empty state component
function CalendarEmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Calendar View</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">No Scheduled Recommendations</h3>
          <p className="text-muted-foreground text-sm">
            Run a site audit to generate AI-powered recommendations with due dates for improving your GEO score.
          </p>
        </div>

        <Link
          href="/dashboard/audit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
        >
          <Settings className="w-4 h-4" />
          Run Site Audit
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Helper to get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get the starting day of the month (0 = Sunday)
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Priority colors
const priorityColors: Record<Priority, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

// Type icons
const typeConfig: Record<RecommendationType, { icon: React.ElementType }> = {
  schema: { icon: Sparkles },
  content: { icon: BarChart3 },
  technical: { icon: Zap },
  "ai-visibility": { icon: Target },
};

// Month names
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Day names
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Map category to type
const categoryToType: Record<string, RecommendationType> = {
  technical: "technical",
  content: "content",
  authority: "schema",
  ai_readiness: "ai-visibility",
};

// Transform API recommendation to calendar format using real dueDate field
function transformCalendarRecommendation(
  apiRec: {
    id: string;
    title: string;
    priority: string;
    category: string;
    status: string;
    dueDate: string;
  }
): CalendarRecommendation {
  return {
    id: apiRec.id,
    title: apiRec.title,
    priority: apiRec.priority as Priority,
    type: categoryToType[apiRec.category] || "technical",
    status: apiRec.status as Status,
    dueDate: new Date(apiRec.dueDate),
  };
}

// Calendar Day Component
function CalendarDay({
  day,
  month,
  year,
  isCurrentMonth,
  isToday,
  recommendations,
  onDragStart,
  onDragOver,
  onDrop,
  draggingId,
}: {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  recommendations: CalendarRecommendation[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, date: Date) => void;
  draggingId: string | null;
}) {
  const [isOver, setIsOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    onDrop(e, new Date(year, month, day));
  };

  return (
    <div
      className={cn(
        "min-h-[100px] p-2 border-r border-b border-[#27272A]",
        "transition-all duration-150",
        !isCurrentMonth && "bg-[#0A0A0B]",
        isToday && "bg-primary/5",
        isOver && "border-primary/50 bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          "text-sm font-medium mb-1",
          !isCurrentMonth && "text-muted-foreground/50",
          isToday && "text-primary"
        )}
      >
        {day}
        {isToday && (
          <span className="ml-1 text-[10px] text-primary">(Today)</span>
        )}
      </div>
      <div className="space-y-1">
        {recommendations.slice(0, 3).map((rec) => {
          const TypeIcon = typeConfig[rec.type].icon;
          const isDragging = draggingId === rec.id;
          return (
            <div
              key={rec.id}
              draggable
              onDragStart={(e) => onDragStart(e, rec.id)}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate",
                "bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46]",
                "cursor-grab active:cursor-grabbing transition-all duration-150",
                rec.status === "completed" && "opacity-50 line-through",
                rec.status === "dismissed" && "opacity-30",
                isDragging && "opacity-50 ring-2 ring-primary/50"
              )}
            >
              <GripVertical className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  priorityColors[rec.priority]
                )}
              />
              <TypeIcon className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <span className="truncate">{rec.title}</span>
            </div>
          );
        })}
        {recommendations.length > 3 && (
          <div className="text-[10px] text-muted-foreground pl-1">
            +{recommendations.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const selectedBrand = useSelectedBrand();

  // Fetch recommendations from API
  const { data: apiData, isLoading, isError, refetch } = useRecommendations(
    selectedBrand?.id ? { brandId: selectedBrand.id, limit: 100 } : { limit: 100 }
  );

  // Transform API data to calendar format - only include recommendations with dueDate
  const recommendations: CalendarRecommendation[] = React.useMemo(() => {
    if (!apiData?.recommendations) return [];
    return apiData.recommendations
      .filter((rec) => rec.dueDate) // Only include recommendations with a dueDate
      .map((rec) => transformCalendarRecommendation(rec as { id: string; title: string; priority: string; category: string; status: string; dueDate: string }));
  }, [apiData]);

  const hasData = recommendations.length > 0;

  // Navigate months
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);

  // Get recommendations for a specific day
  const getRecommendationsForDay = (year: number, month: number, day: number) => {
    return recommendations.filter((rec) => {
      const d = rec.dueDate;
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  // Build calendar days array
  const calendarDays: {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
  }[] = [];

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const month = currentMonth === 0 ? 11 : currentMonth - 1;
    const year = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarDays.push({ day, month, year, isCurrentMonth: false });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }

  // Next month days (fill to complete 6 rows = 42 cells)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const month = currentMonth === 11 ? 0 : currentMonth + 1;
    const year = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarDays.push({ day, month, year, isCurrentMonth: false });
  }

  // Stats
  const stats = {
    thisMonth: recommendations.filter(
      (r) => r.dueDate.getMonth() === currentMonth && r.dueDate.getFullYear() === currentYear
    ).length,
    pending: recommendations.filter((r) => r.status === "pending").length,
    overdue: recommendations.filter(
      (r) => r.status === "pending" && r.dueDate < today
    ).length,
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, _date: Date) => {
    e.preventDefault();
    // Get the dragged recommendation ID (will be used in subsequent subtask for API call)
    e.dataTransfer.getData("text/plain");
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/recommendations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                Calendar View
              </h2>
              <p className="text-muted-foreground text-sm">
                View recommendations by due date
              </p>
            </div>
          </div>
        </div>
        <CalendarLoadingState />
      </div>
    );
  }

  // Show error state if API call failed
  if (isError) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/recommendations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                Calendar View
              </h2>
              <p className="text-muted-foreground text-sm">
                View recommendations by due date
              </p>
            </div>
          </div>
        </div>
        <CalendarErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  // Show empty state if no data
  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/recommendations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                Calendar View
              </h2>
              <p className="text-muted-foreground text-sm">
                View recommendations by due date
              </p>
            </div>
          </div>
        </div>
        <CalendarEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6" onDragEnd={handleDragEnd}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/recommendations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              Calendar View
            </h2>
            <p className="text-muted-foreground text-sm">
              View recommendations by due date
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-tertiary">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">This Month</div>
          <div className="text-2xl font-bold mt-1">{stats.thisMonth}</div>
        </div>
        <div className="card-tertiary">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Pending</div>
          <div className="text-2xl font-bold text-warning mt-1">{stats.pending}</div>
        </div>
        <div className="card-tertiary">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Overdue</div>
          <div className="text-2xl font-bold text-error mt-1">{stats.overdue}</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card-secondary overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#27272A]">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold min-w-[180px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Day Names Header */}
        <div className="grid grid-cols-7 border-b border-[#27272A]">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-xs font-medium text-muted-foreground text-center border-r border-[#27272A] last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((calDay, index) => {
            const isToday =
              calDay.day === today.getDate() &&
              calDay.month === today.getMonth() &&
              calDay.year === today.getFullYear();
            const recommendations = getRecommendationsForDay(
              calDay.year,
              calDay.month,
              calDay.day
            );

            return (
              <CalendarDay
                key={index}
                day={calDay.day}
                month={calDay.month}
                year={calDay.year}
                isCurrentMonth={calDay.isCurrentMonth}
                isToday={isToday}
                recommendations={recommendations}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                draggingId={draggingId}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Low</span>
        </div>
      </div>
    </div>
  );
}
