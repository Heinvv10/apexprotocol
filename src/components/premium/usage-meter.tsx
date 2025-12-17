"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Infinity, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Plan,
  ResourceType,
  RESOURCE_NAMES,
  getResourceLimit,
  getRemainingCapacity,
  getUsagePercentage,
  formatLimit,
  getNextPlan,
  PLAN_DETAILS,
} from "@/lib/permissions/feature-gates";

interface UsageMeterProps {
  /** Resource type being measured */
  resource: ResourceType;
  /** Current user's plan */
  plan: Plan;
  /** Current usage count */
  currentUsage: number;
  /** Visual variant */
  variant?: "default" | "compact" | "detailed";
  /** Show upgrade prompt when near limit */
  showUpgradeHint?: boolean;
  /** Callback when upgrade is clicked */
  onUpgrade?: () => void;
  /** Additional class names */
  className?: string;
}

export function UsageMeter({
  resource,
  plan,
  currentUsage,
  variant = "default",
  showUpgradeHint = true,
  onUpgrade,
  className,
}: UsageMeterProps) {
  const limit = getResourceLimit(resource, plan);
  const remaining = getRemainingCapacity(resource, plan, currentUsage);
  const percentage = getUsagePercentage(resource, plan, currentUsage);
  const resourceName = RESOURCE_NAMES[resource];
  const isUnlimited = limit === -1;
  const isAtLimit = remaining === 0 && !isUnlimited;
  const isNearLimit = percentage >= 80 && !isUnlimited;
  const nextPlan = getNextPlan(plan);

  // Determine color based on usage
  const getColorClass = () => {
    if (isUnlimited) return "text-primary";
    if (isAtLimit) return "text-error";
    if (isNearLimit) return "text-warning";
    return "text-primary";
  };

  const getProgressColor = () => {
    if (isUnlimited) return "bg-primary";
    if (isAtLimit) return "bg-error";
    if (isNearLimit) return "bg-warning";
    return "bg-primary";
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {isUnlimited ? (
          <>
            <Infinity className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              Unlimited {resourceName.toLowerCase()}
            </span>
          </>
        ) : (
          <>
            <span className={cn("text-sm font-medium", getColorClass())}>
              {currentUsage}/{limit}
            </span>
            <span className="text-sm text-muted-foreground">
              {resourceName.toLowerCase()}
            </span>
            {isAtLimit && (
              <AlertTriangle className="w-4 h-4 text-error" />
            )}
          </>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "rounded-xl border p-4",
          "bg-[#141930]/50 border-white/5",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {resourceName}
            </span>
            {isAtLimit && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-error/20 text-error">
                Limit reached
              </span>
            )}
            {isNearLimit && !isAtLimit && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-warning/20 text-warning">
                Near limit
              </span>
            )}
          </div>
          {!isUnlimited && (
            <span className={cn("text-sm font-medium", getColorClass())}>
              {percentage}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        {!isUnlimited && (
          <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                getProgressColor()
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        )}

        {/* Usage details */}
        <div className="flex items-center justify-between text-sm">
          {isUnlimited ? (
            <div className="flex items-center gap-2 text-primary">
              <Infinity className="w-4 h-4" />
              <span>Unlimited usage</span>
            </div>
          ) : (
            <>
              <span className="text-muted-foreground">
                {currentUsage} of {formatLimit(limit)} used
              </span>
              <span className={cn("font-medium", getColorClass())}>
                {remaining} remaining
              </span>
            </>
          )}
        </div>

        {/* Upgrade hint */}
        {showUpgradeHint && isNearLimit && nextPlan && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Upgrade to {PLAN_DETAILS[nextPlan].name} for{" "}
                  {getResourceLimit(resource, nextPlan) === -1
                    ? "unlimited"
                    : getResourceLimit(resource, nextPlan)}{" "}
                  {resourceName.toLowerCase()}
                </span>
              </div>
              <button
                onClick={onUpgrade}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{resourceName}</span>
        <div className="flex items-center gap-2">
          {isUnlimited ? (
            <div className="flex items-center gap-1 text-primary">
              <Infinity className="w-4 h-4" />
              <span className="text-sm font-medium">Unlimited</span>
            </div>
          ) : (
            <span className={cn("text-sm font-medium", getColorClass())}>
              {currentUsage} / {formatLimit(limit)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!isUnlimited && (
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              getProgressColor()
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}

      {/* Status indicator */}
      {!isUnlimited && (
        <div className="flex items-center gap-1.5 text-xs">
          {isAtLimit ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-error" />
              <span className="text-error">
                Limit reached.{" "}
                {nextPlan && onUpgrade && (
                  <button
                    onClick={onUpgrade}
                    className="underline hover:no-underline"
                  >
                    Upgrade to add more
                  </button>
                )}
              </span>
            </>
          ) : isNearLimit ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              <span className="text-warning">
                {remaining} remaining
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span className="text-muted-foreground">
                {remaining} remaining
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Combined usage meters for multiple resources
 */
interface UsageSummaryProps {
  plan: Plan;
  usage: Partial<Record<ResourceType, number>>;
  onUpgrade?: () => void;
  className?: string;
}

export function UsageSummary({
  plan,
  usage,
  onUpgrade,
  className,
}: UsageSummaryProps) {
  const resources = Object.entries(usage) as [ResourceType, number][];

  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="text-sm font-medium text-foreground">Usage Overview</h4>
      <div className="space-y-4">
        {resources.map(([resource, currentUsage]) => (
          <UsageMeter
            key={resource}
            resource={resource}
            plan={plan}
            currentUsage={currentUsage}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>
    </div>
  );
}

export default UsageMeter;
