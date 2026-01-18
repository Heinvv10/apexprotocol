"use client";

import * as React from "react";
import { Audit } from "@/hooks/useAudit";
import { usePerformanceMetrics, generateCoreWebVitals } from "@/hooks/usePerformance";
import { PerformanceOverview } from "../performance/PerformanceOverview";
import { CoreWebVitalsCard } from "../performance/CoreWebVitalsCard";
import { PerformanceWaterfall } from "../performance/PerformanceWaterfall";
import { PerformanceRecommendations } from "../performance/PerformanceRecommendations";
import { AlertCircle, Loader2 } from "lucide-react";

interface PerformanceDeepDiveProps {
  audit: Audit;
}

export function PerformanceDeepDive({ audit }: PerformanceDeepDiveProps) {
  const metrics = usePerformanceMetrics(audit);
  const coreWebVitals = generateCoreWebVitals(audit);

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading performance analysis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <PerformanceOverview
        score={{
          score: metrics.score,
          grade: metrics.grade,
          status: metrics.status,
        }}
        firstContentfulPaint={metrics.firstContentfulPaint}
        largestContentfulPaint={metrics.largestContentfulPaint}
        totalBlockingTime={metrics.totalBlockingTime}
        cumulativeLayoutShift={metrics.cumulativeLayoutShift}
        speedIndex={metrics.speedIndex}
      />

      {/* Core Web Vitals */}
      {coreWebVitals && (
        <CoreWebVitalsCard vitals={coreWebVitals} />
      )}

      {/* Load Phase Breakdown */}
      <PerformanceWaterfall
        phases={metrics.loadPhases}
        totalLoadTime={metrics.loadPhases.reduce((sum, p) => sum + p.duration, 0)}
      />

      {/* Performance Recommendations */}
      <PerformanceRecommendations
        recommendations={metrics.recommendations}
      />

      {/* Performance Tips */}
      <div className="card-secondary p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-3">
            <h3 className="font-semibold">Performance Best Practices</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Optimize images:</strong> Use modern formats like WebP
                  and serve responsive sizes
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Minimize JavaScript:</strong> Only load what you need,
                  defer non-critical scripts
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Use a CDN:</strong> Serve static assets from edge
                  locations near users
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Enable compression:</strong> Gzip or Brotli compress
                  text-based resources
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Lazy load content:</strong> Defer loading of below-fold
                  images and components
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Monitor performance:</strong> Use tools like Lighthouse,
                  Web Vitals, and PageSpeed Insights
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
