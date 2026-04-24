"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

// Plan shape as returned by /api/settings/subscription.
// PLAN_LIMITS lives in src/app/api/settings/subscription/route.ts — keep this
// matcher in sync with that source of truth.
type PlanKey = "starter" | "professional" | "enterprise";
interface PlanLimits {
  brandLimit: number;
  userLimit: number;
  features: string[] | readonly string[];
  price: number;
  name: string;
}

interface SubscriptionPayload {
  success: boolean;
  data?: {
    currentPlan: PlanKey;
    limits: PlanLimits;
    allPlans: Record<PlanKey, PlanLimits>;
  };
  error?: string;
}

const PLAN_ORDER: PlanKey[] = ["starter", "professional", "enterprise"];

const PLAN_HIGHLIGHTS: Record<PlanKey, { tagline: string; cta: string; badge?: string }> = {
  starter: {
    tagline: "Everything you need to see if GEO works for your brand.",
    cta: "Start on Starter",
  },
  professional: {
    tagline: "For agencies and teams running active GEO programmes.",
    cta: "Upgrade to Professional",
    badge: "Most popular",
  },
  enterprise: {
    tagline: "White-label, API access, and dedicated support.",
    cta: "Talk to sales",
  },
};

function formatPrice(p: number): string {
  if (p === 0) return "Free";
  return `$${p}`;
}

function humaniseFeature(f: string): string {
  return f
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UpgradePage() {
  const router = useRouter();
  const [payload, setPayload] = useState<SubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<PlanKey | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/subscription");
        const data: SubscriptionPayload = await res.json();
        setPayload(data);
      } catch (err) {
        toast.error("Couldn't load plans", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectPlan = async (plan: PlanKey) => {
    if (plan === "enterprise") {
      // No self-serve for enterprise — route to contact.
      window.location.href =
        "mailto:hein@brighttech.co.za?subject=Apex%20Enterprise%20enquiry";
      return;
    }
    setPendingPlan(plan);
    try {
      const res = await fetch("/api/settings/subscription", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Upgrade failed");
      }
      toast.success(`Plan changed to ${plan}`, {
        description: "Your limits have been updated.",
      });
      router.push("/dashboard/settings?tab=billing");
    } catch (err) {
      toast.error("Upgrade failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setPendingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!payload?.success || !payload.data) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-semibold mb-2">Couldn&apos;t load plans</h1>
        <p className="text-muted-foreground mb-6">
          {payload?.error || "Please try again in a moment."}
        </p>
        <Link
          href="/dashboard/settings?tab=billing"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to billing
        </Link>
      </div>
    );
  }

  const { currentPlan, allPlans } = payload.data;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <Link
          href="/dashboard/settings?tab=billing"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to billing
        </Link>
        <h1 className="text-3xl font-bold">Upgrade your plan</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          You&apos;re currently on the{" "}
          <strong className="text-foreground capitalize">
            {allPlans[currentPlan]?.name || currentPlan}
          </strong>{" "}
          plan. Pick a new tier below — the change takes effect immediately and
          your usage limits update in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLAN_ORDER.map((plan) => {
          const p = allPlans[plan];
          if (!p) return null;
          const highlight = PLAN_HIGHLIGHTS[plan];
          const isCurrent = currentPlan === plan;
          const isPending = pendingPlan === plan;
          return (
            <div
              key={plan}
              className={`relative card-primary rounded-2xl p-6 flex flex-col ${
                plan === "professional"
                  ? "border-primary/40 shadow-lg shadow-primary/10"
                  : ""
              }`}
            >
              {highlight.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                  {highlight.badge}
                </span>
              )}
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{p.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 min-h-[2.5rem]">
                  {highlight.tagline}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{formatPrice(p.price)}</span>
                {p.price > 0 && (
                  <span className="text-muted-foreground ml-1">/month</span>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-grow text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>
                    <strong>{p.brandLimit >= 999 ? "Unlimited" : p.brandLimit}</strong>{" "}
                    {p.brandLimit === 1 ? "brand" : "brands"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>
                    <strong>{p.userLimit >= 999 ? "Unlimited" : p.userLimit}</strong>{" "}
                    {p.userLimit === 1 ? "user" : "team members"}
                  </span>
                </li>
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{humaniseFeature(f)}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => void selectPlan(plan)}
                disabled={isCurrent || isPending}
                className={`w-full py-2.5 rounded-lg font-semibold transition-colors ${
                  isCurrent
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : plan === "professional"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-white/10 text-foreground hover:bg-white/20"
                } disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2`}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCurrent ? "Current plan" : highlight.cta}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-8 max-w-2xl mx-auto">
        Prices shown in USD. SA VAT added at checkout where applicable. Payments
        processed via PayFast (ZAR) or Stripe (USD) once configured. For
        enterprise plans and custom requirements, email{" "}
        <a href="mailto:hein@brighttech.co.za" className="text-primary hover:underline">
          hein@brighttech.co.za
        </a>
        .
      </p>
    </div>
  );
}
