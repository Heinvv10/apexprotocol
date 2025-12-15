"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Startup",
    description: "Perfect for small brands getting started with AI visibility",
    monthlyPrice: "$10",
    yearlyPrice: "$8",
    features: [
      "1 Brand",
      "3 AI Platforms",
      "Weekly Monitoring",
      "Basic Recommendations",
      "Email Support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    description: "For growing businesses serious about AI visibility",
    monthlyPrice: "$50",
    yearlyPrice: "$40",
    features: [
      "5 Brands",
      "All 7+ AI Platforms",
      "Daily Monitoring",
      "Smart Recommendations",
      "Content Generator",
      "Slack & WhatsApp Alerts",
      "Priority Support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For agencies and large organizations",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    features: [
      "Unlimited Brands",
      "All AI Platforms",
      "Real-time Monitoring",
      "API Access",
      "White-label Reports",
      "Custom Integrations",
      "Dedicated Account Manager",
      "SLA Guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Simple,{" "}
            <span className="bg-gradient-to-r from-primary via-accent-blue to-accent-purple bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isAnnual ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  isAnnual ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative group ${plan.popular ? "" : ""}`}
            >
              {/* Gradient border for popular plan */}
              {plan.popular && (
                <div className="absolute -inset-[1px] bg-gradient-to-r from-primary via-accent-blue to-accent-purple rounded-2xl opacity-70" />
              )}

              <div
                className={`relative h-full rounded-2xl p-6 ${
                  plan.popular
                    ? "bg-card border-0"
                    : "bg-card/50 border border-border/50"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {isAnnual ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    {plan.monthlyPrice !== "Custom" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  {plan.monthlyPrice !== "Custom" && isAnnual && (
                    <p className="text-xs text-muted-foreground mt-1">
                      billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  asChild
                  className={`w-full ${plan.popular ? "" : "bg-card hover:bg-card/80"}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link href={plan.name === "Enterprise" ? "/contact" : "/sign-up"}>
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            14-day free trial
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            No credit card required
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
}
