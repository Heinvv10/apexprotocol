"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Target,
} from "lucide-react";
import { BrandHeader } from "@/components/layout/brand-header";
import { useSelectedBrand } from "@/stores";
import { Button } from "@/components/ui/button";

// Phase 9.2 Component
import { CompetitorDeepDive } from "@/components/competitive";

// Premium Gating
import { FeatureGate } from "@/components/premium";
import { useCurrentPlan } from "@/hooks/use-subscription";

// Select brand prompt
function SelectBrandPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-lg space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Target className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Select a Brand First</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to analyze competitors.
          </p>
        </div>
        <Link href="/dashboard/brands">
          <Button variant="outline" size="lg" className="gap-2">
            Manage Brands
            <Target className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Main Page Component
export default function CompetitorDeepDivePage() {
  const params = useParams();
  const router = useRouter();
  const selectedBrand = useSelectedBrand();
  const brandId = selectedBrand?.id || "";
  const currentPlan = useCurrentPlan();

  // Decode competitor name from URL
  const competitorName = decodeURIComponent(params.competitorName as string);

  // Handle upgrade navigation
  const handleUpgrade = () => {
    router.push("/dashboard/settings?tab=billing");
  };

  // Handle back navigation
  const handleBack = () => {
    router.push("/dashboard/competitive");
  };

  // Handle states
  if (!selectedBrand) {
    return (
      <div className="space-y-6 relative">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/competitive">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <BrandHeader pageName={`Competitor Analysis: ${competitorName}`} className="flex-1" />
        </div>
        <SelectBrandPrompt />
        <DecorativeStar />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/competitive">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <BrandHeader pageName={`Competitor Analysis: ${competitorName}`} className="flex-1" />
      </div>

      {/* Feature Gate for Deep Dive */}
      <FeatureGate
        feature="competitor_deep_dive"
        plan={currentPlan}
        mode="replace"
        onUpgrade={handleUpgrade}
      >
        <CompetitorDeepDive
          brandId={brandId}
          competitorName={competitorName}
          onBack={handleBack}
        />
      </FeatureGate>

      <DecorativeStar />
    </div>
  );
}

// Decorative Star Component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientDeepDive)"
        />
        <defs>
          <linearGradient id="starGradientDeepDive" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

