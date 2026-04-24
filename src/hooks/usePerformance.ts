import { useMemo } from "react";
import { Audit } from "./useAudit";

export interface PerformanceMetrics {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  status: "excellent" | "good" | "fair" | "poor" | "failing";
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  speedIndex: number;
  loadPhases: Array<{
    name: string;
    duration: number;
    color: string;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    effort: "low" | "medium" | "high";
    category: "image-optimization" | "caching" | "code-splitting" | "compression" | "lazy-loading" | "scripts";
    estimatedImprovement: number;
    implementation?: string;
  }>;
}

/**
 * Extract performance metrics from audit data
 */
export function usePerformanceMetrics(audit: Audit | null): PerformanceMetrics | null {
  return useMemo((): PerformanceMetrics | null => {
    if (!audit) return null;

    // Only compute perf metrics if the audit engine actually captured them.
    // Prior behaviour was to default to {fcp:3000, lcp:4000, tbt:200, cls:0.1}
    // when missing — which rendered as real-looking numbers on every audit
    // that didn't run a real Lighthouse pass. That's slop. Return null so
    // the caller can show an honest "Performance metrics not captured" card.
    const metadata = (audit.metadata as Record<string, unknown> | undefined) ?? {};
    const performance = (metadata.performance as Record<string, unknown> | undefined) ?? null;
    if (
      !performance ||
      typeof performance.firstContentfulPaint !== "number" ||
      typeof performance.largestContentfulPaint !== "number"
    ) {
      return null;
    }

    const fcp = performance.firstContentfulPaint as number;
    const lcp = performance.largestContentfulPaint as number;
    const tbt = (performance.totalBlockingTime as number | undefined) ?? 0;
    const cls = (performance.cumulativeLayoutShift as number | undefined) ?? 0;

    // Score calculation (simplified Google Lighthouse approach)
    let score = 100;

    // FCP: 1800ms = 100, 3000ms = 75, 5000ms = 0
    score -= Math.min(50, Math.max(0, (fcp - 1800) / 64));

    // LCP: 2500ms = 100, 4000ms = 75, 5000ms = 0
    score -= Math.min(30, Math.max(0, (lcp - 2500) / 50));

    // TBT: 100ms = 100, 200ms = 75, 350ms = 0
    score -= Math.min(20, Math.max(0, (tbt - 100) / 10));

    score = Math.max(0, Math.min(100, score));

    // Determine grade and status
    const grade: "A" | "B" | "C" | "D" | "F" =
      score >= 90
        ? "A"
        : score >= 80
        ? "B"
        : score >= 70
        ? "C"
        : score >= 60
        ? "D"
        : "F";

    const status: "excellent" | "good" | "fair" | "poor" | "failing" =
      score >= 90
        ? "excellent"
        : score >= 75
        ? "good"
        : score >= 50
        ? "fair"
        : score >= 25
        ? "poor"
        : "failing";

    // Load phases — only include phases we actually measured. The old code
    // zero-filled missing phases, which produced a "DNS 0ms, TCP 0ms, DOM 0ms"
    // readout that looked like real data but was entirely synthetic. Now we
    // only list phases present in metadata.performance.
    type PhaseKey = "dnsLookup" | "tcpConnection" | "requestTime" | "responseTime" | "domProcessing" | "resourcesDownload";
    const phaseDefs: Array<{ key: PhaseKey; name: string; color: string }> = [
      { key: "dnsLookup", name: "DNS Lookup", color: "hsl(var(--primary))" },
      { key: "tcpConnection", name: "TCP Connection", color: "hsl(var(--warning))" },
      { key: "requestTime", name: "Request Time", color: "hsl(var(--error))" },
      { key: "responseTime", name: "Response Time", color: "hsl(var(--success))" },
      { key: "domProcessing", name: "DOM Processing", color: "hsl(var(--muted-foreground))" },
      { key: "resourcesDownload", name: "Resources Download", color: "hsl(var(--primary) / 0.5)" },
    ];
    const perfRecord = performance as Record<string, unknown>;
    const loadPhases = phaseDefs
      .filter((p) => typeof perfRecord[p.key] === "number")
      .map((p) => ({ name: p.name, duration: perfRecord[p.key] as number, color: p.color }));

    // totalLoadTime was previously computed here but only used by a consumer
    // that later derived it itself (PerformanceDeepDive via loadPhases.reduce).
    // Removed to silence a TS6133 noUnusedLocals warning.

    // Generate recommendations based on issues
    const recommendations = generatePerformanceRecommendations(audit, {
      fcp,
      lcp,
      tbt,
      cls,
      score,
    });

    return {
      score: Math.round(score),
      grade,
      status,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      totalBlockingTime: tbt,
      cumulativeLayoutShift: cls,
      speedIndex: typeof performance.speedIndex === "number" ? (performance.speedIndex as number) : 0,
      loadPhases,
      recommendations,
    };
  }, [audit]);
}

/**
 * Generate performance recommendations based on audit data
 */
function generatePerformanceRecommendations(
  audit: Audit,
  metrics: {
    fcp: number;
    lcp: number;
    tbt: number;
    cls: number;
    score: number;
  }
) {
  const recommendations: Array<{
    id: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    effort: "low" | "medium" | "high";
    category: "image-optimization" | "caching" | "code-splitting" | "compression" | "lazy-loading" | "scripts";
    estimatedImprovement: number;
    implementation?: string;
  }> = [];

  // Check for large images
  if (audit.issues?.some((i) => i.category === "image_optimization")) {
    recommendations.push({
      id: "img-optimization",
      title: "Optimize Images",
      description:
        "Convert images to modern formats (WebP) and serve responsive sizes based on device",
      impact: "high",
      effort: "medium",
      category: "image-optimization",
      estimatedImprovement: 800,
      implementation: "Use next/image component with proper sizing and formats",
    });
  }

  // FCP issues
  if (metrics.fcp > 3000) {
    recommendations.push({
      id: "fcp-optimization",
      title: "Improve First Contentful Paint",
      description: "Reduce render-blocking resources and optimize critical CSS",
      impact: "high",
      effort: "medium",
      category: "compression",
      estimatedImprovement: 1200,
    });
  }

  // LCP issues
  if (metrics.lcp > 4000) {
    recommendations.push({
      id: "lcp-optimization",
      title: "Speed Up Largest Contentful Paint",
      description: "Optimize server response time and preload critical resources",
      impact: "high",
      effort: "high",
      category: "caching",
      estimatedImprovement: 1500,
    });
  }

  // TBT issues
  if (metrics.tbt > 200) {
    recommendations.push({
      id: "tbt-optimization",
      title: "Reduce Total Blocking Time",
      description: "Break up long tasks and defer non-critical JavaScript execution",
      impact: "medium",
      effort: "medium",
      category: "code-splitting",
      estimatedImprovement: 300,
    });
  }

  // CLS issues
  if (metrics.cls > 0.1) {
    recommendations.push({
      id: "cls-optimization",
      title: "Minimize Layout Shifts",
      description:
        "Reserve space for dynamic content and optimize font-display strategy",
      impact: "medium",
      effort: "low",
      category: "lazy-loading",
      estimatedImprovement: 100,
    });
  }

  // Check for unminified resources
  if (audit.issues?.some((i) => i.category === "unminified_js")) {
    recommendations.push({
      id: "minify-js",
      title: "Minify JavaScript",
      description: "Reduce JS file sizes by removing unnecessary characters",
      impact: "medium",
      effort: "low",
      category: "compression",
      estimatedImprovement: 200,
    });
  }

  // Check for unused CSS
  if (audit.issues?.some((i) => i.category === "unused_css")) {
    recommendations.push({
      id: "remove-unused-css",
      title: "Remove Unused CSS",
      description: "Eliminate unused CSS rules to reduce stylesheet size",
      impact: "medium",
      effort: "medium",
      category: "compression",
      estimatedImprovement: 150,
    });
  }

  // Historically this function pushed three unconditional recommendations
  // (Lazy Loading +400ms, Browser Caching +500ms, Code Splitting +250ms)
  // regardless of whether the audit actually detected the problem. The
  // "estimated improvement" numbers were hardcoded, so every brand saw the
  // same three identical tiles. Removed — recommendations now only fire
  // when a real issue is detected above.

  return recommendations;
}

/**
 * Generate Core Web Vitals data
 */
export function generateCoreWebVitals(audit: Audit | null) {
  if (!audit) return null;

  const metadata = (audit.metadata as any) || {};
  const performance = metadata.performance || {};

  // Only emit metrics we actually measured. PSI returns LCP + CLS; FID is a
  // real-user metric we don't capture synthetically (the old code defaulted
  // to 50ms, which rendered the same FID for every audit). Returning null
  // for a metric tells the UI to drop that card instead of faking it.
  const lcpRaw = performance.largestContentfulPaint;
  const fidRaw = performance.firstInputDelay;
  const clsRaw = performance.cumulativeLayoutShift;

  type Vital = {
    metric: "lcp" | "fid" | "cls";
    label: string;
    value: number;
    unit: string;
    good: number;
    needsImprovement: number;
    rating: "good" | "needsImprovement" | "poor";
    icon: string;
    description: string;
  };
  const out: Vital[] = [];

  if (typeof lcpRaw === "number") {
    out.push({
      metric: "lcp" as const,
      label: "Largest Contentful Paint",
      value: lcpRaw,
      unit: "ms",
      good: 2500,
      needsImprovement: 4000,
      rating: (lcpRaw <= 2500 ? "good" : lcpRaw <= 4000 ? "needsImprovement" : "poor") as "good" | "needsImprovement" | "poor",
      icon: "📦",
      description: "Time for the largest visible element to appear",
    });
  }

  if (typeof fidRaw === "number") {
    out.push({
      metric: "fid" as const,
      label: "First Input Delay",
      value: fidRaw,
      unit: "ms",
      good: 100,
      needsImprovement: 300,
      rating: (fidRaw <= 100 ? "good" : fidRaw <= 300 ? "needsImprovement" : "poor") as "good" | "needsImprovement" | "poor",
      icon: "⚡",
      description: "Time from user input to browser response (real-user metric)",
    });
  }

  if (typeof clsRaw === "number") {
    out.push({
      metric: "cls" as const,
      label: "Cumulative Layout Shift",
      value: Number((clsRaw * 100).toFixed(2)),
      unit: "%",
      good: 10,
      needsImprovement: 25,
      rating: (clsRaw <= 0.1 ? "good" : clsRaw <= 0.25 ? "needsImprovement" : "poor") as "good" | "needsImprovement" | "poor",
      icon: "🎯",
      description: "Unexpected layout changes during page load",
    });
  }

  return out.length > 0 ? out : null;
}
