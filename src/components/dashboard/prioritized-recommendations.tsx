"use client";

import * as React from "react";
import { ChevronRight, Zap, Clock, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useSelectedBrand } from "@/stores";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

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
  brandId?: string;
  limit?: number;
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

// Map API effort to component effort
const effortMap: Record<string, "quick" | "medium" | "long"> = {
  low: "quick",
  medium: "medium",
  high: "long",
};

export function PrioritizedRecommendations({
  recommendations,
  brandId,
  limit = 4,
  className,
  onViewAll,
}: PrioritizedRecommendationsProps) {
  // Get brand from store if not provided via props
  const selectedBrand = useSelectedBrand();
  const effectiveBrandId = brandId || selectedBrand?.id;

  // Fetch recommendations from API when no data prop is provided
  const { data: recData, isLoading, isError, error } = useRecommendations(
    { brandId: effectiveBrandId, limit: limit + 2, status: "pending" as const },
    { enabled: !recommendations && !!effectiveBrandId }
  );

  // Transform API data to component format
  const items: Recommendation[] = React.useMemo(() => {
    if (recommendations) return recommendations;
    if (!recData?.recommendations) return [];

    return recData.recommendations.map((rec) => ({
      id: rec.id,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      impact: rec.impact * 10, // Convert 1-10 to percentage
      effort: effortMap[rec.effort] || "medium",
      category: rec.category,
      status: rec.status === "dismissed" ? "pending" : rec.status,
    }));
  }, [recommendations, recData?.recommendations]);

  const hasData = items.length > 0;

  // ðŸŸ¢ WORKING: Loading state with SkeletonCard showing before/after improvement over LoadingState
  if (isLoading && !recommendations) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Prioritized Recommendations
          </h3>
        </div>

        {/* Skeleton loading state */}
        <div className="space-y-3">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="p-3 rounded-lg bg-white/5 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
              <div className="h-3 bg-white/10 rounded w-full mb-1" />
              <div className="h-3 bg-white/10 rounded w-5/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError && !recommendations) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Prioritized Recommendations
          </h3>
        </div>
        <ErrorState
          title="Failed to load recommendations"
          error={error}
          size="sm"
          variant="compact"
        />
      </div>
    );
  }

  // Empty state - Show positive message when all recommendations are completed
  if (!hasData) {
    return (
      <div className={cn("card-secondary", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Prioritized Recommendations
          </h3>
        </div>
        <EmptyState
          icon={CheckCircle2}
          theme="success"
          title="All caught up!"
          description="No pending recommendations. Great job!"
          size="sm"
          variant="compact"
        />
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
