"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2,
  Globe,
  FileText,
  Zap,
  ArrowRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Export interface for API integration
export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  icon: React.ElementType;
  timeEstimate: string;
}

interface OnboardingChecklistProps {
  className?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
  checklistItems?: ChecklistItem[];
}

export function OnboardingChecklist({
  className,
  onDismiss,
  showDismiss = true,
  checklistItems,
}: OnboardingChecklistProps) {
  // TODO: Fetch checklist items from API endpoint
  // const { data: checklistData } = useQuery(['onboardingChecklist'], fetchOnboardingChecklist);
  const [items, setItems] = React.useState<ChecklistItem[]>(checklistItems || []); // Empty array - no mock data
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isDismissed, setIsDismissed] = React.useState(false);

  const completedCount = items.filter((item) => item.completed).length;
  const progress = (completedCount / items.length) * 100;
  const isComplete = completedCount === items.length;

  const handleComplete = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className={cn("card-secondary overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {isComplete ? "Setup Complete!" : "Getting Started"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {completedCount} of {items.length} tasks completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showDismiss && (
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss checklist"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              isComplete
                ? "bg-success"
                : "bg-gradient-to-r from-cyan-500 to-purple-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      {isExpanded && (
        <div className="divide-y divide-border/20">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-4 transition-colors",
                  item.completed ? "opacity-60" : "hover:bg-white/5"
                )}
              >
                <button
                  onClick={() => handleComplete(item.id)}
                  className="flex-shrink-0"
                  aria-label={
                    item.completed
                      ? `Mark "${item.title}" as incomplete`
                      : `Mark "${item.title}" as complete`
                  }
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {item.timeEstimate}
                  </span>
                  {!item.completed && (
                    <Link
                      href={item.href}
                      className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer - show when complete */}
      {isComplete && isExpanded && (
        <div className="p-4 bg-success/5 border-t border-success/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <div className="flex-1">
              <p className="text-sm font-medium text-success">
                Great job! You&apos;ve completed all setup tasks.
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You can dismiss this checklist now.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface OnboardingChecklistCompactProps {
  className?: string;
  checklistItems?: ChecklistItem[];
}

// Compact version for sidebar
export function OnboardingChecklistCompact({
  className,
  checklistItems,
}: OnboardingChecklistCompactProps) {
  // TODO: Fetch checklist items from API endpoint
  // const { data: checklistData } = useQuery(['onboardingChecklist'], fetchOnboardingChecklist);
  const items = checklistItems || []; // Empty array - no mock data

  if (items.length === 0) {
    return null;
  }

  const completedCount = items.filter((i) => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  if (completedCount === items.length) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className={cn(
        "block card-tertiary p-3 hover:bg-white/5 transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-foreground">Setup Progress</span>
      </div>
      <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        {completedCount}/{items.length} complete
      </p>
    </Link>
  );
}
