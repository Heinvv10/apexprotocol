"use client";

import { EffectivenessReport } from "@/components/recommendations/EffectivenessReport";
import { BrandHeader } from "@/components/layout/brand-header";

// Decorative star component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientEffectiveness)"
        />
        <defs>
          <linearGradient id="starGradientEffectiveness" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function EffectivenessReportPage() {
  return (
    <div className="space-y-6 relative">
      {/* APEX Header */}
      <BrandHeader pageName="Effectiveness Report" />

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recommendation Effectiveness</h1>
        <p className="text-muted-foreground">
          Track the impact and ROI of your implemented recommendations
        </p>
      </div>

      {/* Effectiveness Report Component */}
      <EffectivenessReport />

      {/* Decorative Star */}
      <DecorativeStar />
    </div>
  );
}
