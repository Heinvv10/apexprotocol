"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, MessageCircle, Globe2 } from "lucide-react";
import Link from "next/link";

type Region = "global" | "za" | "ke" | "ng";

type RegionConfig = {
  code: Region;
  label: string;
  flag: string;
  currency: string;
  startup: { monthly: string; annual: string };
  growth: { monthly: string; annual: string };
};

const REGIONS: RegionConfig[] = [
  {
    code: "global",
    label: "Global",
    flag: "🌐",
    currency: "USD",
    startup: { monthly: "$10", annual: "$8" },
    growth: { monthly: "$50", annual: "$40" },
  },
  {
    code: "za",
    label: "South Africa",
    flag: "🇿🇦",
    currency: "ZAR",
    startup: { monthly: "R129", annual: "R99" },
    growth: { monthly: "R649", annual: "R519" },
  },
  {
    code: "ke",
    label: "Kenya",
    flag: "🇰🇪",
    currency: "KES",
    startup: { monthly: "KSh 699", annual: "KSh 549" },
    growth: { monthly: "KSh 3,499", annual: "KSh 2,799" },
  },
  {
    code: "ng",
    label: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    startup: { monthly: "₦5,999", annual: "₦4,699" },
    growth: { monthly: "₦29,999", annual: "₦23,999" },
  },
];

type Plan = {
  key: "startup" | "growth" | "enterprise";
  name: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
};

const PLANS: Plan[] = [
  {
    key: "startup",
    name: "Startup",
    description: "Small brands getting started with AI visibility.",
    features: [
      "1 Brand",
      "3 AI Platforms",
      "Weekly Monitoring",
      "Basic Recommendations",
      "Email Support",
    ],
    cta: "Start Free Trial",
    href: "/sign-up?plan=startup",
    popular: false,
  },
  {
    key: "growth",
    name: "Growth",
    description: "Growing businesses serious about AI visibility.",
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
    href: "/sign-up?plan=growth",
    popular: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "Agencies and large organizations.",
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
    href: "/contact",
    popular: false,
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [region, setRegion] = useState<Region>("global");

  const current = REGIONS.find((r) => r.code === region) ?? REGIONS[0];

  const priceFor = (plan: Plan): { display: string; unit: string | null } => {
    if (plan.key === "enterprise") {
      return { display: "Custom", unit: null };
    }
    const tier = plan.key === "startup" ? current.startup : current.growth;
    return {
      display: isAnnual ? tier.annual : tier.monthly,
      unit: "/month",
    };
  };

  return (
    <section id="pricing" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wider uppercase mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
            Simple, <span className="text-primary">Transparent Pricing</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            14-day free trial on every plan. PPP-adjusted pricing for African
            markets.
          </p>
        </div>

        {/* Controls: Region selector + Billing toggle */}
        <div className="flex flex-col items-center gap-4 mb-12">
          {/* Region pills */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm">
            <Globe2 className="w-3.5 h-3.5 text-muted-foreground ml-2 mr-1" />
            {REGIONS.map((r) => {
              const active = r.code === region;
              return (
                <button
                  key={r.code}
                  onClick={() => setRegion(r.code)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={active}
                >
                  <span className="mr-1.5">{r.flag}</span>
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Billing toggle — segmented */}
          <div className="inline-flex items-center gap-2">
            <div className="inline-flex items-center p-1 rounded-full border border-border/50 bg-card/50">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !isAnnual
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={!isAnnual}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isAnnual
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={isAnnual}
              >
                Annual
              </button>
            </div>
            {isAnnual && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/15 text-success text-xs font-semibold">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const { display, unit } = priceFor(plan);
            const isPopular = plan.popular;
            return (
              <motion.div
                key={plan.name}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                {/* Gradient border for popular plan */}
                {isPopular && (
                  <div className="absolute -inset-[1px] bg-gradient-to-br from-primary via-accent-blue to-accent-purple rounded-2xl" />
                )}

                <div
                  className={`relative h-full rounded-2xl p-6 flex flex-col ${
                    isPopular
                      ? "bg-card border-0"
                      : "bg-card/50 border border-border/50"
                  }`}
                >
                  {/* Recommended tab — anchored to top edge */}
                  {isPopular && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent-blue text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/20">
                        <Sparkles className="w-3 h-3" />
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-5 min-h-[2.5rem]">
                    {plan.description}
                  </p>

                  {/* Price — consistent scale whether number or "Custom" */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1 h-12 relative">
                      <AnimatePresence mode="wait">
                        {plan.key === "enterprise" ? (
                          <motion.span
                            key="custom"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{
                              duration: 0.3,
                              ease: [0.21, 1.02, 0.73, 1],
                            }}
                            className="text-4xl font-bold tracking-tight absolute"
                          >
                            Custom
                          </motion.span>
                        ) : (
                          <motion.div
                            key={`price-${display}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{
                              duration: 0.3,
                              ease: [0.21, 1.02, 0.73, 1],
                            }}
                            className="flex items-baseline gap-1"
                          >
                            <span className="text-4xl font-bold tabular-nums tracking-tight">
                              {display}
                            </span>
                            {unit && (
                              <span className="text-muted-foreground text-sm">
                                {unit}
                              </span>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 min-h-[1rem]">
                      {plan.key === "enterprise"
                        ? "Volume-based pricing · annual contract"
                        : isAnnual
                          ? `Billed annually in ${current.currency}`
                          : `Billed monthly in ${current.currency}`}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isPopular
                              ? "text-primary"
                              : "text-success"
                          }`}
                        />
                        <span className="text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA — Growth is solid primary, Startup + Enterprise are outline */}
                  <Button
                    asChild
                    size="lg"
                    variant={isPopular ? "default" : "outline"}
                    className={`w-full gap-2 ${
                      isPopular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        : ""
                    }`}
                  >
                    <Link href={plan.href}>
                      {plan.key === "enterprise" && (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      {plan.cta}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
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
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            PPP-adjusted for African markets
          </span>
        </div>
      </div>
    </section>
  );
}
