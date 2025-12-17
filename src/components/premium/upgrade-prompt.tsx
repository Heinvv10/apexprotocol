"use client";

import * as React from "react";
import { ArrowRight, Lock, Sparkles, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Plan,
  FeatureId,
  FEATURE_NAMES,
  PLAN_DETAILS,
  getMinimumPlanForFeature,
  getUnlockedFeaturesByUpgrade,
} from "@/lib/permissions/feature-gates";

interface UpgradePromptProps {
  /** The feature that requires upgrade */
  feature: FeatureId;
  /** Current user's plan */
  currentPlan: Plan;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string;
  /** Callback when upgrade button is clicked */
  onUpgrade?: (targetPlan: Plan) => void;
  /** Visual variant */
  variant?: "card" | "inline" | "modal" | "banner";
  /** Additional class names */
  className?: string;
}

const planIcons: Record<Plan, React.ElementType> = {
  starter: Sparkles,
  professional: Zap,
  enterprise: Crown,
};

export function UpgradePrompt({
  feature,
  currentPlan,
  title,
  description,
  onUpgrade,
  variant = "card",
  className,
}: UpgradePromptProps) {
  const requiredPlan = getMinimumPlanForFeature(feature);
  if (!requiredPlan) return null;

  const featureName = FEATURE_NAMES[feature];
  const planDetails = PLAN_DETAILS[requiredPlan];
  const unlockedFeatures = getUnlockedFeaturesByUpgrade(currentPlan, requiredPlan);
  const PlanIcon = planIcons[requiredPlan];

  const defaultTitle = `Unlock ${featureName}`;
  const defaultDescription = `Upgrade to ${planDetails.name} to access ${featureName.toLowerCase()} and more powerful features.`;

  const handleUpgradeClick = () => {
    onUpgrade?.(requiredPlan);
  };

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg",
          "bg-gradient-to-r from-primary/10 to-purple-500/10",
          "border border-primary/20",
          className
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Lock className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium truncate">
            {title || defaultTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            Requires {planDetails.name} plan
          </p>
        </div>
        <button
          onClick={handleUpgradeClick}
          className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Upgrade
        </button>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg",
          "bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20",
          "border border-primary/30",
          "p-4",
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <PlanIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {title || defaultTitle}
              </h4>
              <p className="text-xs text-muted-foreground">
                {description || `Upgrade to ${planDetails.name} to unlock this feature`}
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgradeClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Upgrade to {planDetails.name}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-[#141930] to-[#0d1224]",
        "border border-primary/20",
        "p-6",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Lock icon */}
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-primary" />
        </div>

        {/* Title & description */}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title || defaultTitle}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {description || defaultDescription}
        </p>

        {/* What you'll unlock */}
        {unlockedFeatures.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              What you&apos;ll unlock:
            </p>
            <ul className="space-y-1.5">
              {unlockedFeatures.slice(0, 4).map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  {FEATURE_NAMES[f]}
                </li>
              ))}
              {unlockedFeatures.length > 4 && (
                <li className="text-xs text-muted-foreground pl-5">
                  +{unlockedFeatures.length - 4} more features
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Pricing info */}
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-2xl font-bold text-foreground">
            ${planDetails.monthlyPrice}
          </span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>

        {/* CTA button */}
        <button
          onClick={handleUpgradeClick}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "px-4 py-2.5 rounded-lg",
            "text-sm font-medium",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-colors",
            "shadow-lg shadow-primary/25"
          )}
        >
          Upgrade to {planDetails.name}
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Annual savings hint */}
        <p className="text-xs text-center text-muted-foreground mt-3">
          Save 20% with annual billing (${planDetails.yearlyPrice}/year)
        </p>
      </div>
    </div>
  );
}

export default UpgradePrompt;
