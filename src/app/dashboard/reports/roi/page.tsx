/**
 * Citation ROI Calculator Page
 * Phase 15: AI Citation ROI Calculator
 *
 * Dashboard for tracking and calculating ROI from AI platform citations
 */

"use client";

import { Suspense } from "react";
import { Calculator, Sparkles } from "lucide-react";
import { CitationROIDashboard } from "@/components/citation-roi";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandHeader } from "@/components/layout/brand-header";

// Decorative star component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientRoi)"
        />
        <defs>
          <linearGradient
            id="starGradientRoi"
            x1="0"
            y1="0"
            x2="48"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00E5CC" stopOpacity="0.6" />
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card/50 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-card/50 border border-white/10 rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60 mb-6" />
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CitationROIPage() {
  return (
    <div className="space-y-6 relative">
      {/* APEX Header */}
      <BrandHeader pageName="Citation ROI" />

      {/* Page Title */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            AI Citation ROI Calculator
          </h1>
          <p className="text-muted-foreground">
            Measure the business impact of your AI visibility and track
            conversions from AI platform citations
          </p>
        </div>
      </div>

      {/* Feature Badge */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">
          <Sparkles className="h-3 w-3" />
          <span>Premium Feature</span>
        </div>
        <span className="text-muted-foreground">
          Track ROI across ChatGPT, Claude, Gemini, Perplexity, and more
        </span>
      </div>

      {/* Citation ROI Dashboard */}
      <Suspense fallback={<DashboardSkeleton />}>
        <CitationROIDashboard />
      </Suspense>

      {/* Decorative Star */}
      <DecorativeStar />
    </div>
  );
}
