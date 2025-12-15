"use client";

import * as React from "react";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
  tooltip?: string;
}

const features: PlanFeature[] = [
  {
    name: "Brand Monitoring",
    free: "1 brand",
    pro: "5 brands",
    enterprise: "Unlimited",
  },
  {
    name: "AI Platforms Tracked",
    free: "3 platforms",
    pro: "All 7+ platforms",
    enterprise: "All 7+ platforms",
  },
  {
    name: "Daily Scans",
    free: "1 scan/day",
    pro: "12 scans/day",
    enterprise: "Real-time",
  },
  {
    name: "AI Content Generation",
    free: "5 pieces/month",
    pro: "100 pieces/month",
    enterprise: "Unlimited",
  },
  {
    name: "Competitor Tracking",
    free: false,
    pro: "3 competitors",
    enterprise: "Unlimited",
  },
  {
    name: "Site Audits",
    free: "1/month",
    pro: "10/month",
    enterprise: "Unlimited",
  },
  {
    name: "Custom Recommendations",
    free: true,
    pro: true,
    enterprise: true,
  },
  {
    name: "API Access",
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    name: "Team Members",
    free: "1 user",
    pro: "5 users",
    enterprise: "Unlimited",
  },
  {
    name: "White-label Reports",
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    name: "Dedicated Support",
    free: false,
    pro: "Email support",
    enterprise: "24/7 priority",
  },
  {
    name: "SSO/SAML",
    free: false,
    pro: false,
    enterprise: true,
  },
];

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number | null;
  priceLabel?: string;
  period: string;
  icon: React.ElementType;
  popular?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out Apex",
    price: 0,
    period: "forever",
    icon: Sparkles,
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    price: 49,
    period: "per month",
    icon: Zap,
    popular: true,
    cta: "Start Pro Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: null,
    priceLabel: "Custom",
    period: "contact us",
    icon: Building2,
    cta: "Contact Sales",
  },
];

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSelectPlan?: (planId: string) => void;
  className?: string;
}

export function SubscriptionPlans({
  currentPlan = "free",
  onSelectPlan,
  className,
}: SubscriptionPlansProps) {
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "annual">(
    "monthly"
  );

  const getPrice = (plan: Plan) => {
    if (plan.price === null) return plan.priceLabel;
    if (plan.price === 0) return "$0";
    const price =
      billingPeriod === "annual" ? Math.round(plan.price * 0.8) : plan.price;
    return `$${price}`;
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground mb-6">
          Start free and scale as you grow
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 p-1 bg-muted/20 rounded-lg">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              billingPeriod === "monthly"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              billingPeriod === "annual"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annual
            <span className="ml-1.5 text-xs text-success font-normal">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl border overflow-hidden transition-all",
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/20"
                  : "border-border/50",
                isCurrentPlan && "ring-2 ring-primary"
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                {/* Plan header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      plan.popular
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/30 text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {getPrice(plan)}
                    </span>
                    {plan.price !== null && plan.price > 0 && (
                      <span className="text-sm text-muted-foreground">
                        /{billingPeriod === "annual" ? "mo" : "month"}
                      </span>
                    )}
                  </div>
                  {billingPeriod === "annual" && plan.price !== null && plan.price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed annually (${Math.round(plan.price * 0.8 * 12)}/year)
                    </p>
                  )}
                  {plan.price === null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.period}
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => onSelectPlan?.(plan.id)}
                  disabled={isCurrentPlan}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-white/5 text-foreground hover:bg-white/10 border border-border/50",
                    isCurrentPlan && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isCurrentPlan ? "Current Plan" : plan.cta}
                  {!isCurrentPlan && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Key features */}
              <div className="px-6 pb-6 pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-3">
                  Key features:
                </p>
                <ul className="space-y-2">
                  {features.slice(0, 5).map((feature) => {
                    const value = feature[plan.id as keyof typeof feature];
                    const hasFeature = value !== false;

                    return (
                      <li
                        key={feature.name}
                        className="flex items-center gap-2 text-sm"
                      >
                        {hasFeature ? (
                          <Check className="w-4 h-4 text-success flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                        )}
                        <span
                          className={cn(
                            hasFeature
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                          )}
                        >
                          {typeof value === "string" ? value : feature.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full feature comparison */}
      <FeatureComparison />
    </div>
  );
}

function FeatureComparison() {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="card-secondary overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <h3 className="text-sm font-medium text-foreground">
          Full Feature Comparison
        </h3>
        <span className="text-sm text-muted-foreground">
          {isExpanded ? "Hide" : "Show"} details
        </span>
      </button>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-b border-border/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Feature
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Free
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-primary/5">
                  Pro
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {features.map((feature) => (
                <tr key={feature.name}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">
                        {feature.name}
                      </span>
                      {feature.tooltip && (
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <FeatureCell value={feature.free} />
                  <FeatureCell value={feature.pro} highlighted />
                  <FeatureCell value={feature.enterprise} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FeatureCell({
  value,
  highlighted,
}: {
  value: boolean | string;
  highlighted?: boolean;
}) {
  return (
    <td
      className={cn(
        "py-3 px-4 text-center",
        highlighted && "bg-primary/5"
      )}
    >
      {value === true ? (
        <Check className="w-4 h-4 text-success mx-auto" />
      ) : value === false ? (
        <X className="w-4 h-4 text-muted-foreground/50 mx-auto" />
      ) : (
        <span className="text-sm text-foreground">{value}</span>
      )}
    </td>
  );
}
