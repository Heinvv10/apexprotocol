"use client";

import * as React from "react";
import { ChevronRight, Zap, Clock, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

// Export interface for API integration
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  impact: number;
  effort: "quick" | "medium" | "long";
  category: string;
  status?: "pending" | "in_progress" | "completed";
}

interface PrioritizedRecommendationsProps {
  recommendations?: Recommendation[];
  className?: string;
  onViewAll?: () => void;
}

const priorityConfig = {
  critical: {
    icon: AlertTriangle,
    label: "Critical",
    className: "bg-error/10 text-error border-error/20",
  },
  high: {
    icon: Zap,
    label: "High",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  medium: {
    icon: Clock,
    label: "Medium",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  low: {
    icon: CheckCircle2,
    label: "Low",
    className: "bg-success/10 text-success border-success/20",
  },
};

const effortLabels = {
  quick: "Quick Win",
  medium: "Medium Effort",
  long: "Long Term",
};

export function PrioritizedRecommendations({
  recommendations,
  className,
  onViewAll,
}: PrioritizedRecommendationsProps) {
  // TODO: Fetch recommendations from API endpoint
  // const { data: recommendations } = useQuery(['prioritizedRecommendations'], fetchPrioritizedRecommendations);
  const items = recommendations || []; // Empty array - no mock data
  const hasData = items.length > 0;

  // Empty state
  if (!hasData) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Prioritized Recommendations
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No recommendations yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Run a site audit to generate recommendations</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-secondary", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Prioritized Recommendations
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            View All
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {items.slice(0, 4).map((rec) => {
          const PriorityIcon = priorityConfig[rec.priority].icon;

          return (
            <div
              key={rec.id}
              className="group p-3 rounded-lg bg-muted/5 hover:bg-muted/10 border border-border/50 hover:border-border transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {/* Priority Badge */}
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                    priorityConfig[rec.priority].className
                  )}
                >
                  <PriorityIcon className="w-3 h-3" />
                  {priorityConfig[rec.priority].label}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {rec.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Impact: <span className="text-foreground font-medium">{rec.impact}%</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {effortLabels[rec.effort]}
                    </span>
                    <span className="badge-default text-xs">
                      {rec.category}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
