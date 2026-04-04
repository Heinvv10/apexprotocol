/**
 * Core Web Vitals Analyzer (Phase 3)
 * Measures and grades LCP, FID/INP, CLS based on Google's thresholds
 * Provides performance recommendations for AI visibility
 */

import type { CrawledPage, PageTiming } from "./types";

// =============================================================================
// Types
// =============================================================================

export interface CoreWebVitalsResult {
  lcp: MetricResult;
  fid: MetricResult;
  cls: MetricResult;
  overall: OverallResult;
  recommendations: string[];
  aiImpact: AIPerformanceImpact;
}

export interface MetricResult {
  value: number;
  unit: string;
  rating: "good" | "needs-improvement" | "poor";
  score: number; // 0-100
  threshold: {
    good: number;
    poor: number;
  };
  description: string;
}

export interface OverallResult {
  score: number; // 0-100
  rating: "good" | "needs-improvement" | "poor";
  passesAllMetrics: boolean;
  summary: string;
}

export interface AIPerformanceImpact {
  crawlability: "excellent" | "good" | "moderate" | "poor";
  indexPriority: "high" | "medium" | "low";
  userExperienceSignal: "positive" | "neutral" | "negative" | "unrecognized";
  recommendations: string[];
}

// =============================================================================
// Google's Core Web Vitals Thresholds
// =============================================================================

const THRESHOLDS = {
  // Largest Contentful Paint (milliseconds)
  LCP: {
    good: 2500,
    poor: 4000,
  },
  // First Input Delay / Interaction to Next Paint (milliseconds)
  FID: {
    good: 100,
    poor: 300,
  },
  // Cumulative Layout Shift (unitless)
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
};

// Scoring weights
const METRIC_WEIGHTS = {
  lcp: 0.4,
  fid: 0.3,
  cls: 0.3,
};

// =============================================================================
// Main Analysis Function
// =============================================================================

/**
 * Analyze Core Web Vitals for a crawled page
 */
export function analyzeCoreWebVitals(page: CrawledPage): CoreWebVitalsResult {
  const lcp = analyzeLCP(page.timing);
  const fid = analyzeFID(page.timing);
  const cls = analyzeCLS(page);

  const overall = calculateOverallScore(lcp, fid, cls);
  const recommendations = generateRecommendations(lcp, fid, cls, page);
  const aiImpact = assessAIImpact(overall, page);

  return {
    lcp,
    fid,
    cls,
    overall,
    recommendations,
    aiImpact,
  };
}

/**
 * Analyze Largest Contentful Paint
 */
function analyzeLCP(timing: PageTiming): MetricResult {
  // Estimate LCP from page timing data
  // In a real implementation, this would come from browser APIs
  const lcpValue = estimateLCP(timing);

  return {
    value: lcpValue,
    unit: "ms",
    rating: getRating(lcpValue, THRESHOLDS.LCP),
    score: calculateMetricScore(lcpValue, THRESHOLDS.LCP),
    threshold: THRESHOLDS.LCP,
    description: getMetricDescription("LCP", lcpValue, THRESHOLDS.LCP),
  };
}

/**
 * Analyze First Input Delay / Interaction to Next Paint
 */
function analyzeFID(timing: PageTiming): MetricResult {
  // Estimate FID from page timing data
  const fidValue = estimateFID(timing);

  return {
    value: fidValue,
    unit: "ms",
    rating: getRating(fidValue, THRESHOLDS.FID),
    score: calculateMetricScore(fidValue, THRESHOLDS.FID),
    threshold: THRESHOLDS.FID,
    description: getMetricDescription("FID", fidValue, THRESHOLDS.FID),
  };
}

/**
 * Analyze Cumulative Layout Shift
 */
function analyzeCLS(page: CrawledPage): MetricResult {
  // Estimate CLS based on page structure
  const clsValue = estimateCLS(page);

  return {
    value: clsValue,
    unit: "",
    rating: getRating(clsValue, THRESHOLDS.CLS),
    score: calculateMetricScore(clsValue, THRESHOLDS.CLS),
    threshold: THRESHOLDS.CLS,
    description: getMetricDescription("CLS", clsValue, THRESHOLDS.CLS),
  };
}

// =============================================================================
// Estimation Functions
// =============================================================================

/**
 * Estimate LCP from timing data
 * In production, use actual browser metrics from Chrome UX Report or Lighthouse
 */
function estimateLCP(timing: PageTiming): number {
  // LCP is typically between DOM content loaded and fully loaded
  // Use a weighted estimate based on available timing data
  const baseTime = timing.domContentLoaded || timing.loadTime;
  const fullyLoaded = timing.fullyLoaded || timing.loadTime;

  // LCP is usually 70-90% of fully loaded time for most pages
  const estimated = baseTime * 0.7 + (fullyLoaded - baseTime) * 0.3;

  // Add TTFB as a baseline
  return Math.round(timing.ttfb + estimated);
}

/**
 * Estimate FID from timing data
 * In production, use actual browser metrics
 */
function estimateFID(timing: PageTiming): number {
  // FID is related to JavaScript execution blocking
  // Estimate based on time between TTFB and DOM content loaded
  const processingTime = timing.domContentLoaded - timing.ttfb;

  // Assume FID is roughly 5-15% of processing time for typical pages
  const estimated = processingTime * 0.1;

  // Cap at reasonable values
  return Math.round(Math.min(Math.max(estimated, 10), 500));
}

/**
 * Estimate CLS based on page structure
 * In production, use actual layout shift measurements
 */
function estimateCLS(page: CrawledPage): number {
  let clsScore = 0;

  // Images without dimensions cause layout shifts
  const imagesWithoutDimensions = page.images.filter(
    (img) => !img.width || !img.height
  );
  clsScore += imagesWithoutDimensions.length * 0.02;

  // Lazy-loaded images above the fold can cause shifts
  const lazyAboveFold = page.images.filter((img) => img.lazyLoaded).length;
  clsScore += lazyAboveFold * 0.01;

  // Dynamic content (ads, embeds) can cause shifts
  // Estimate based on external links
  const dynamicContent = page.links.filter((l) => !l.isInternal).length;
  clsScore += Math.min(dynamicContent * 0.005, 0.1);

  // Cap at 1.0 (worst possible)
  return Math.min(Math.round(clsScore * 100) / 100, 1.0);
}

// =============================================================================
// Scoring Functions
// =============================================================================

/**
 * Get rating based on value and thresholds
 */
function getRating(
  value: number,
  threshold: { good: number; poor: number }
): "good" | "needs-improvement" | "poor" {
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

/**
 * Calculate metric score (0-100)
 */
function calculateMetricScore(
  value: number,
  threshold: { good: number; poor: number }
): number {
  if (value <= threshold.good) {
    // Good range: 75-100
    return Math.round(75 + (25 * (1 - value / threshold.good)));
  }
  if (value <= threshold.poor) {
    // Needs improvement range: 50-75
    const range = threshold.poor - threshold.good;
    const position = value - threshold.good;
    return Math.round(75 - (25 * (position / range)));
  }
  // Poor range: 0-50
  const overage = value - threshold.poor;
  const poorRange = threshold.poor * 2; // Double threshold as worst case
  return Math.round(Math.max(0, 50 - (50 * Math.min(overage / poorRange, 1))));
}

/**
 * Calculate overall Core Web Vitals score
 */
function calculateOverallScore(
  lcp: MetricResult,
  fid: MetricResult,
  cls: MetricResult
): OverallResult {
  const weightedScore = Math.round(
    lcp.score * METRIC_WEIGHTS.lcp +
    fid.score * METRIC_WEIGHTS.fid +
    cls.score * METRIC_WEIGHTS.cls
  );

  const passesAllMetrics =
    lcp.rating === "good" &&
    fid.rating === "good" &&
    cls.rating === "good";

  const rating = getRating(100 - weightedScore, { good: 25, poor: 50 });

  let summary: string;
  if (passesAllMetrics) {
    summary = "Excellent performance - all Core Web Vitals pass Google's thresholds";
  } else if (weightedScore >= 75) {
    summary = "Good performance with minor improvements possible";
  } else if (weightedScore >= 50) {
    summary = "Performance needs improvement - may affect search rankings";
  } else {
    summary = "Poor performance - likely impacting user experience and SEO";
  }

  return {
    score: weightedScore,
    rating,
    passesAllMetrics,
    summary,
  };
}

// =============================================================================
// Recommendations
// =============================================================================

/**
 * Generate performance recommendations
 */
function generateRecommendations(
  lcp: MetricResult,
  fid: MetricResult,
  cls: MetricResult,
  page: CrawledPage
): string[] {
  const recommendations: string[] = [];

  // LCP recommendations
  if (lcp.rating !== "good") {
    if (lcp.value > 4000) {
      recommendations.push("Critical: LCP is very slow. Consider server-side rendering or CDN.");
    }
    recommendations.push("Optimize largest content element (hero image, video, or text block)");
    recommendations.push("Implement lazy loading for below-the-fold images");
    recommendations.push("Reduce server response time (TTFB)");
    recommendations.push("Preload critical resources like fonts and hero images");
  }

  // FID recommendations
  if (fid.rating !== "good") {
    recommendations.push("Reduce JavaScript execution time");
    recommendations.push("Break up long tasks into smaller, async chunks");
    recommendations.push("Use web workers for heavy computations");
    recommendations.push("Minimize main thread work during page load");
  }

  // CLS recommendations
  if (cls.rating !== "good") {
    const imagesWithoutDimensions = page.images.filter(
      (img) => !img.width || !img.height
    );
    if (imagesWithoutDimensions.length > 0) {
      recommendations.push(
        `Add width/height attributes to ${imagesWithoutDimensions.length} images to prevent layout shifts`
      );
    }
    recommendations.push("Reserve space for dynamic content (ads, embeds)");
    recommendations.push("Avoid inserting content above existing content");
    recommendations.push("Use CSS transform for animations instead of layout properties");
  }

  // General recommendations
  if (page.timing.ttfb > 600) {
    recommendations.push("Improve server response time (TTFB > 600ms)");
  }

  return recommendations.slice(0, 8); // Limit to top 8
}

/**
 * Assess AI visibility impact of performance
 */
function assessAIImpact(overall: OverallResult, page: CrawledPage): AIPerformanceImpact {
  const recommendations: string[] = [];

  // Crawlability assessment
  let crawlability: AIPerformanceImpact["crawlability"];
  if (overall.score >= 90) {
    crawlability = "excellent";
  } else if (overall.score >= 75) {
    crawlability = "good";
  } else if (overall.score >= 50) {
    crawlability = "moderate";
    recommendations.push("Slow pages may be de-prioritized by AI crawlers");
  } else {
    crawlability = "poor";
    recommendations.push("Poor performance may significantly impact AI indexing");
  }

  // Index priority assessment
  let indexPriority: AIPerformanceImpact["indexPriority"];
  if (overall.passesAllMetrics) {
    indexPriority = "high";
  } else if (overall.score >= 60) {
    indexPriority = "medium";
  } else {
    indexPriority = "low";
    recommendations.push("Improve Core Web Vitals to increase AI visibility priority");
  }

  // User experience signal
  let userExperienceSignal: AIPerformanceImpact["userExperienceSignal"];
  if (overall.score >= 75) {
    userExperienceSignal = "positive";
  } else if (overall.score >= 50) {
    userExperienceSignal = "neutral";
  } else {
    userExperienceSignal = "negative";
    recommendations.push("Poor UX signals may reduce AI recommendation likelihood");
  }

  // AI-specific recommendations
  if (page.timing.fullyLoaded > 5000) {
    recommendations.push("AI crawlers may timeout on slow pages (>5s load time)");
  }

  return {
    crawlability,
    indexPriority,
    userExperienceSignal,
    recommendations,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get human-readable metric description
 */
function getMetricDescription(
  metric: string,
  value: number,
  threshold: { good: number; poor: number }
): string {
  const rating = getRating(value, threshold);
  const unit = metric === "CLS" ? "" : "ms";

  switch (metric) {
    case "LCP":
      if (rating === "good") {
        return `Largest Contentful Paint: ${value}${unit} - Main content loads quickly`;
      } else if (rating === "needs-improvement") {
        return `Largest Contentful Paint: ${value}${unit} - Content loading could be faster`;
      }
      return `Largest Contentful Paint: ${value}${unit} - Content loads too slowly`;

    case "FID":
      if (rating === "good") {
        return `First Input Delay: ${value}${unit} - Page responds quickly to interactions`;
      } else if (rating === "needs-improvement") {
        return `First Input Delay: ${value}${unit} - Page responsiveness could improve`;
      }
      return `First Input Delay: ${value}${unit} - Page is slow to respond`;

    case "CLS":
      if (rating === "good") {
        return `Cumulative Layout Shift: ${value} - Page layout is stable`;
      } else if (rating === "needs-improvement") {
        return `Cumulative Layout Shift: ${value} - Some layout instability detected`;
      }
      return `Cumulative Layout Shift: ${value} - Significant layout shifts occur`;

    default:
      return `${metric}: ${value}${unit}`;
  }
}

/**
 * Analyze multiple pages and aggregate results
 */
export function analyzeMultiplePagesVitals(
  pages: CrawledPage[]
): CoreWebVitalsResult | null {
  if (pages.length === 0) return null;

  // Analyze all pages
  const results = pages.map(analyzeCoreWebVitals);

  // Average the metrics
  const avgLCP = Math.round(
    results.reduce((sum, r) => sum + r.lcp.value, 0) / results.length
  );
  const avgFID = Math.round(
    results.reduce((sum, r) => sum + r.fid.value, 0) / results.length
  );
  const avgCLS =
    Math.round(
      (results.reduce((sum, r) => sum + r.cls.value, 0) / results.length) * 100
    ) / 100;

  // Create averaged result
  const lcp: MetricResult = {
    value: avgLCP,
    unit: "ms",
    rating: getRating(avgLCP, THRESHOLDS.LCP),
    score: calculateMetricScore(avgLCP, THRESHOLDS.LCP),
    threshold: THRESHOLDS.LCP,
    description: getMetricDescription("LCP", avgLCP, THRESHOLDS.LCP),
  };

  const fid: MetricResult = {
    value: avgFID,
    unit: "ms",
    rating: getRating(avgFID, THRESHOLDS.FID),
    score: calculateMetricScore(avgFID, THRESHOLDS.FID),
    threshold: THRESHOLDS.FID,
    description: getMetricDescription("FID", avgFID, THRESHOLDS.FID),
  };

  const cls: MetricResult = {
    value: avgCLS,
    unit: "",
    rating: getRating(avgCLS, THRESHOLDS.CLS),
    score: calculateMetricScore(avgCLS, THRESHOLDS.CLS),
    threshold: THRESHOLDS.CLS,
    description: getMetricDescription("CLS", avgCLS, THRESHOLDS.CLS),
  };

  const overall = calculateOverallScore(lcp, fid, cls);

  // Collect all recommendations and dedupe
  const allRecommendations = results.flatMap((r) => r.recommendations);
  const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 10);

  // Create combined AI impact
  const worstCrawlability = results.reduce(
    (worst, r) => {
      const order = { excellent: 0, good: 1, moderate: 2, poor: 3 };
      return order[r.aiImpact.crawlability] > order[worst]
        ? r.aiImpact.crawlability
        : worst;
    },
    "excellent" as AIPerformanceImpact["crawlability"]
  );

  return {
    lcp,
    fid,
    cls,
    overall,
    recommendations: uniqueRecommendations,
    aiImpact: {
      crawlability: worstCrawlability,
      indexPriority: overall.score >= 75 ? "high" : overall.score >= 50 ? "medium" : "low",
      userExperienceSignal:
        overall.score >= 75 ? "positive" : overall.score >= 50 ? "neutral" : "negative",
      recommendations: results.flatMap((r) => r.aiImpact.recommendations).slice(0, 5),
    },
  };
}

/**
 * Get Core Web Vitals thresholds
 */
export function getThresholds() {
  return THRESHOLDS;
}

/**
 * Get metric weights
 */
export function getMetricWeights() {
  return METRIC_WEIGHTS;
}
