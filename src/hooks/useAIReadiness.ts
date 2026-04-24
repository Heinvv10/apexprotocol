import { useEffect, useMemo, useState } from "react";
import { Audit } from "./useAudit";

/**
 * Real platform visibility for an audit: counts mentions per AI platform
 * from the `brand_mentions` table for the audit's brand within the 30 days
 * leading up to the audit. Replaces the old fabricated multipliers in
 * useAIReadiness.
 */
export interface RealPlatformVisibility {
  name: string;
  slug: string;
  icon: string;
  status: "visible" | "partial" | "not-visible" | "not-tracked";
  score: number;
  totalMentions: number;
  mentioned: number;
  positive: number;
  citations: number;
  lastDetected: string | null;
}

export interface RealPlatformVisibilityData {
  platforms: RealPlatformVisibility[];
  summary: {
    tracked: number;
    visible: number;
    totalMentions: number;
    averageScore: number;
  };
  window: { start: string; end: string };
  lastMentionAt: string | null;
}

export function usePlatformVisibility(auditId: string | null | undefined) {
  const [data, setData] = useState<RealPlatformVisibilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auditId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/audit/${auditId}/platform-visibility`, { credentials: "include" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || !body?.success) {
          throw new Error(body?.error || `HTTP ${r.status}`);
        }
        setData(body.data as RealPlatformVisibilityData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [auditId]);

  return { data, loading, error };
}

export interface AIReadinessData {
  platformVisibility: Array<{
    name: string;
    icon: string;
    status: "visible" | "partial" | "not-visible";
    score: number;
    contentUsed: string;
    lastDetected?: string;
  }>;
  contentOptimization: Array<{
    title: string;
    description: string;
    status: "optimized" | "partial" | "needs-improvement";
    score: number;
    recommendation: string;
    impact: "high" | "medium" | "low";
    icon: string;
  }>;
  citationPotential: {
    metrics: Array<{
      category: string;
      likelihood: number;
      relevance: number;
      authority: number;
    }>;
    overallScore: number;
    percentile: number;
  };
  llmSuitability: {
    factors: Array<{
      name: string;
      score: number;
      description: string;
      examples?: string[];
      icon: string;
    }>;
    overallScore: number;
    recommendation: string;
  };
}

/**
 * Extract and generate AI Readiness data from audit
 */
export function useAIReadiness(audit: Audit | null): AIReadinessData | null {
  return useMemo((): AIReadinessData | null => {
    if (!audit) return null;

    // The AI Readiness module (platform visibility, citation potential,
    // LLM suitability) needs metadata.aiReadiness.score to be populated by
    // the audit engine. When it isn't, every derived number below becomes
    // NaN and the UI shows "NaN / NaN / NaN / NaN" tiles. Return null so
    // the caller can render an honest empty state.
    const metadata = (audit.metadata as Record<string, unknown> | undefined) ?? {};
    const aiReadiness = metadata.aiReadiness as { score?: number } | undefined;
    if (!aiReadiness || typeof aiReadiness.score !== "number") {
      return null;
    }

    // contentAnalysis drives the Optimization/Suitability tiles. When the
    // worker doesn't persist it (older audits), default every field to 0 /
    // false so `Math.round(undefined * x)` doesn't cascade to NaN tiles.
    const ca = (metadata.contentAnalysis as {
      averageWordCount?: number;
      averageReadability?: number;
      headingHierarchyValid?: boolean;
      faqSchemaFound?: boolean;
      hasStructuredContent?: boolean;
    } | undefined) ?? {};
    const contentAnalysis = {
      averageWordCount: ca.averageWordCount ?? 0,
      averageReadability: ca.averageReadability ?? 0,
      headingHierarchyValid: ca.headingHierarchyValid ?? false,
      faqSchemaFound: ca.faqSchemaFound ?? false,
      hasStructuredContent: ca.hasStructuredContent ?? false,
    };

    // Platform visibility is now fetched separately from
    // /api/audit/[id]/platform-visibility, which joins the audit's brand
    // with real brand_mentions. The old code here manufactured 6 platform
    // rows using deterministic multipliers (0.95 for ChatGPT, 0.92 for
    // Claude, etc.) against aiReadiness.score — identical numbers for every
    // brand with the same readiness score, and zero relation to what
    // platforms actually returned when we queried them. Return an empty
    // array so the UI can render the live-data component instead.
    const platformVisibility: Array<{
      name: string;
      icon: string;
      status: string;
      score: number;
      contentUsed: string;
      lastDetected: string;
    }> = [];

    // Content optimization data
    const contentOptimization = [
      {
        title: "FAQ Schema Implementation",
        description: "Structured FAQ data helps AI models extract Q&A pairs for responses",
        status: contentAnalysis.faqSchemaFound ? "optimized" : contentAnalysis.hasStructuredContent ? "partial" : "needs-improvement",
        score: contentAnalysis.faqSchemaFound ? 95 : contentAnalysis.hasStructuredContent ? 60 : 25,
        recommendation: contentAnalysis.faqSchemaFound
          ? "Excellent! Your FAQ schema is properly implemented."
          : "Add FAQ schema markup to your frequently asked questions section",
        impact: "high",
        icon: "❓",
      },
      {
        title: "Heading Hierarchy",
        description: "Clear heading structure (H1 → H2 → H3) improves content readability",
        status: contentAnalysis.headingHierarchyValid ? "optimized" : "partial",
        score: contentAnalysis.headingHierarchyValid ? 90 : 65,
        recommendation: contentAnalysis.headingHierarchyValid
          ? "Your heading hierarchy is well-structured."
          : "Ensure H1 tags are used for titles, H2 for main sections, H3 for subsections",
        impact: "high",
        icon: "📑",
      },
      {
        title: "Content Length & Depth",
        description: "Comprehensive content (1500+ words) is more likely to be cited",
        status: contentAnalysis.averageWordCount >= 1500 ? "optimized" : contentAnalysis.averageWordCount >= 800 ? "partial" : "needs-improvement",
        score: Math.min(100, Math.round((contentAnalysis.averageWordCount / 2000) * 100)),
        recommendation:
          contentAnalysis.averageWordCount >= 1500
            ? "Your content is comprehensively detailed."
            : `Expand content to at least 1500 words. Current average: ${contentAnalysis.averageWordCount} words`,
        impact: "high",
        icon: "📝",
      },
      // E-E-A-T, Content Freshness, and Mobile Optimization tiles used to
      // live here with hardcoded scores (72 / 65 / 85 for every audit). We
      // don't currently measure any of those signals — the audit crawler
      // doesn't check for author bylines, last-modified headers, or mobile
      // rendering — so fabricating scores misled users. Removed entirely.
      // Future: wire checkEntityAuthority + schema analysis to populate
      // real E-E-A-T, parse <time> / og:updated_time for freshness, run a
      // mobile viewport audit for the mobile tile.
    ];

    // Citation potential: the old code broadcast a fabricated 5-category
    // breakdown (Technology / Business / Education / Health / Science) where
    // every brand got the same deterministic multiplier on aiReadiness.score.
    // A brand selling fibre and a brand selling vitamins saw identical
    // "Health" scores. Without a real topic-classification step we have no
    // basis for those categories — removed entirely.
    //
    // The headline citation score is still derived from aiReadiness.score,
    // but we publish a single number instead of pretending we know per-
    // industry likelihoods.
    const citationScore = Math.round(aiReadiness.score * 0.93);
    const citationMetrics: Array<{
      category: string;
      likelihood: number;
      relevance: number;
      authority: number;
    }> = [];

    // LLM Suitability data
    const suitabilityFactors = [
      {
        name: "Content Structure",
        score: contentAnalysis.hasStructuredContent ? 90 : 60,
        description: "Clear organization with logical flow",
        examples: contentAnalysis.hasStructuredContent
          ? ["Numbered lists", "FAQ sections", "Definitions"]
          : undefined,
        icon: "📐",
      },
      // Factual Accuracy (was 82), Uniqueness (was 75), and Source Quality
      // (was 80) were hardcoded across every audit. The crawler doesn't
      // currently verify any of those signals — no citation-link detection,
      // no duplicate-content analysis, no domain-authority lookup — so
      // pretending to score them was misleading. Removed until we have real
      // signals. Readability + Comprehensiveness remain because they come
      // from the actual content analysis the worker persists.
      {
        name: "Readability",
        score: Math.round(contentAnalysis.averageReadability),
        description: "Easy for both humans and AI to understand",
        examples: ["Simple language", "Short paragraphs", "Clear headings"],
        icon: "👁️",
      },
      {
        name: "Comprehensiveness",
        score: Math.min(100, Math.round((contentAnalysis.averageWordCount / 2000) * 100)),
        description: "Thorough coverage of the topic",
        examples: [`${contentAnalysis.averageWordCount} avg words`, "Multiple angles", "Examples provided"],
        icon: "📚",
      },
    ];

    const overallSuitability = Math.round(
      suitabilityFactors.reduce((sum, f) => sum + f.score, 0) / suitabilityFactors.length
    );

    const suitabilityRecommendation =
      overallSuitability >= 85
        ? "✅ Your content is highly suitable for LLM citation. Focus on maintaining quality standards."
        : overallSuitability >= 70
        ? "🟡 Your content is reasonably suitable. Consider the recommendations below to improve further."
        : "⚠️ Your content needs improvement for better LLM suitability. Start with high-impact recommendations.";

    return {
      platformVisibility,
      contentOptimization,
      citationPotential: {
        metrics: citationMetrics,
        overallScore: citationScore,
        // The old code derived `percentile` from citationScore alone, labelled
        // it "Percentile among all sites", and presented that to users. We
        // have no cross-site comparison data — there's no percentile to
        // report — so this now reflects an honest 0 until we build a real
        // benchmarking pipeline. The UI treats 0 as "unavailable".
        percentile: 0,
      },
      llmSuitability: {
        factors: suitabilityFactors,
        overallScore: overallSuitability,
        recommendation: suitabilityRecommendation,
      },
    } as AIReadinessData;
  }, [audit]);
}
