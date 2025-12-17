"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Plan,
  FeatureId,
  ResourceType,
  canAccessFeature,
  isResourceLimitReached,
  checkFeatureAccess,
  checkResourceLimit,
  FeatureGateResult,
  ResourceGateResult,
} from "@/lib/permissions/feature-gates";
import { UpgradePrompt } from "./upgrade-prompt";
import { UsageMeter } from "./usage-meter";

// ============================================================================
// Feature Gate Component
// ============================================================================

interface FeatureGateProps {
  /** The feature to check access for */
  feature: FeatureId;
  /** Current user's plan */
  plan: Plan;
  /** Content to render when access is allowed */
  children: React.ReactNode;
  /** Fallback content when access is denied (defaults to UpgradePrompt) */
  fallback?: React.ReactNode;
  /** How to display when access is denied */
  mode?: "replace" | "overlay" | "blur" | "hide";
  /** Custom upgrade handler */
  onUpgrade?: (targetPlan: Plan) => void;
  /** Additional class names */
  className?: string;
}

export function FeatureGate({
  feature,
  plan,
  children,
  fallback,
  mode = "replace",
  onUpgrade,
  className,
}: FeatureGateProps) {
  const hasAccess = canAccessFeature(feature, plan);

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Determine what to show when access is denied
  const defaultFallback = (
    <UpgradePrompt
      feature={feature}
      currentPlan={plan}
      onUpgrade={onUpgrade}
      variant="card"
    />
  );

  const fallbackContent = fallback ?? defaultFallback;

  // Handle different display modes
  switch (mode) {
    case "hide":
      return null;

    case "blur":
      return (
        <div className={cn("relative", className)}>
          {/* Blurred content */}
          <div className="filter blur-sm pointer-events-none select-none opacity-50">
            {children}
          </div>
          {/* Overlay with upgrade prompt */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
            <div className="max-w-md w-full p-4">
              {fallbackContent}
            </div>
          </div>
        </div>
      );

    case "overlay":
      return (
        <div className={cn("relative", className)}>
          {/* Semi-visible content */}
          <div className="pointer-events-none select-none opacity-30">
            {children}
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            {fallbackContent}
          </div>
        </div>
      );

    case "replace":
    default:
      return <div className={className}>{fallbackContent}</div>;
  }
}

// ============================================================================
// Resource Gate Component
// ============================================================================

interface ResourceGateProps {
  /** The resource type to check */
  resource: ResourceType;
  /** Current user's plan */
  plan: Plan;
  /** Current usage count */
  currentUsage: number;
  /** Content to render when within limits */
  children: React.ReactNode;
  /** Fallback when limit is reached */
  fallback?: React.ReactNode;
  /** Show usage meter alongside content */
  showUsage?: boolean;
  /** Custom upgrade handler */
  onUpgrade?: () => void;
  /** Additional class names */
  className?: string;
}

export function ResourceGate({
  resource,
  plan,
  currentUsage,
  children,
  fallback,
  showUsage = false,
  onUpgrade,
  className,
}: ResourceGateProps) {
  const atLimit = isResourceLimitReached(resource, plan, currentUsage);

  // If limit not reached, show content (optionally with usage meter)
  if (!atLimit) {
    if (showUsage) {
      return (
        <div className={cn("space-y-4", className)}>
          <UsageMeter
            resource={resource}
            plan={plan}
            currentUsage={currentUsage}
            variant="compact"
            onUpgrade={onUpgrade}
          />
          {children}
        </div>
      );
    }
    return <>{children}</>;
  }

  // Limit reached - show fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback: limit reached message with upgrade option
  return (
    <div className={cn("space-y-4", className)}>
      <UsageMeter
        resource={resource}
        plan={plan}
        currentUsage={currentUsage}
        variant="detailed"
        showUpgradeHint={true}
        onUpgrade={onUpgrade}
      />
    </div>
  );
}

// ============================================================================
// Premium Badge Component
// ============================================================================

interface PremiumBadgeProps {
  /** Minimum plan required */
  requiredPlan: Plan;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class names */
  className?: string;
}

export function PremiumBadge({
  requiredPlan,
  size = "sm",
  className,
}: PremiumBadgeProps) {
  const labels: Record<Plan, string> = {
    starter: "Starter",
    professional: "Pro",
    enterprise: "Enterprise",
  };

  const colors: Record<Plan, string> = {
    starter: "bg-muted text-muted-foreground",
    professional: "bg-primary/20 text-primary",
    enterprise: "bg-purple-500/20 text-purple-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        colors[requiredPlan],
        className
      )}
    >
      {labels[requiredPlan]}
    </span>
  );
}

// ============================================================================
// Hook for Feature Access
// ============================================================================

interface UseFeatureGateOptions {
  feature: FeatureId;
  plan: Plan;
}

export function useFeatureGate({ feature, plan }: UseFeatureGateOptions): FeatureGateResult {
  return React.useMemo(
    () => checkFeatureAccess(feature, plan),
    [feature, plan]
  );
}

// ============================================================================
// Hook for Resource Limits
// ============================================================================

interface UseResourceGateOptions {
  resource: ResourceType;
  plan: Plan;
  currentUsage: number;
}

export function useResourceGate({
  resource,
  plan,
  currentUsage,
}: UseResourceGateOptions): ResourceGateResult {
  return React.useMemo(
    () => checkResourceLimit(resource, plan, currentUsage),
    [resource, plan, currentUsage]
  );
}

// ============================================================================
// Exports
// ============================================================================

export default FeatureGate;
