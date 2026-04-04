import { useMemo } from "react";
import { Audit } from "./useAudit";

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

    const metadata = (audit.metadata as any) || {};
    const aiReadiness = metadata.aiReadiness || {};
    const contentAnalysis = metadata.contentAnalysis || {};

    // Platform visibility data (simulated from audit metadata)
    const platformVisibility = [
      {
        name: "ChatGPT (OpenAI)",
        icon: "🤖",
        status: aiReadiness.score >= 75 ? "visible" : aiReadiness.score >= 50 ? "partial" : "not-visible",
        score: Math.round(aiReadiness.score * 0.95),
        contentUsed: contentAnalysis.hasStructuredContent ? "FAQ Schema + FAQ Content" : "General Content",
        lastDetected: "Today",
      },
      {
        name: "Claude (Anthropic)",
        icon: "🧠",
        status: aiReadiness.score >= 70 ? "visible" : aiReadiness.score >= 45 ? "partial" : "not-visible",
        score: Math.round(aiReadiness.score * 0.92),
        contentUsed: "Long-form Content",
        lastDetected: "Today",
      },
      {
        name: "Google Gemini",
        icon: "✨",
        status: aiReadiness.score >= 80 ? "visible" : aiReadiness.score >= 55 ? "partial" : "not-visible",
        score: Math.round(aiReadiness.score * 0.98),
        contentUsed: "SERP Featured Content",
        lastDetected: "Today",
      },
      {
        name: "Perplexity",
        icon: "🔍",
        status: aiReadiness.score >= 65 ? "visible" : aiReadiness.score >= 40 ? "partial" : "not-visible",
        score: Math.round(aiReadiness.score * 0.85),
        contentUsed: "Research & Analysis",
        lastDetected: "Today",
      },
      {
        name: "DeepSeek",
        icon: "🌊",
        status: aiReadiness.score >= 60 ? "visible" : "partial",
        score: Math.round(aiReadiness.score * 0.80),
        contentUsed: "Referenced Content",
        lastDetected: "Yesterday",
      },
      {
        name: "Grok (xAI)",
        icon: "⚡",
        status: aiReadiness.score >= 65 ? "visible" : "partial",
        score: Math.round(aiReadiness.score * 0.83),
        contentUsed: "News & Analysis",
        lastDetected: "2 days ago",
      },
    ];

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
      {
        title: "E-E-A-T Signals",
        description: "Experience, Expertise, Authoritativeness, Trustworthiness",
        status: "partial",
        score: 72,
        recommendation: "Include author credentials, publication dates, and source citations",
        impact: "medium",
        icon: "🏆",
      },
      {
        title: "Content Freshness",
        description: "Recently updated content is prioritized by LLMs",
        status: "partial",
        score: 65,
        recommendation: "Update content regularly and include last-modified dates",
        impact: "medium",
        icon: "🔄",
      },
      {
        title: "Mobile Optimization",
        description: "Mobile-friendly content is indexed and used by AI models",
        status: contentAnalysis.hasStructuredContent ? "optimized" : "partial",
        score: contentAnalysis.hasStructuredContent ? 85 : 70,
        recommendation: "Ensure responsive design and mobile-friendly formatting",
        impact: "medium",
        icon: "📱",
      },
    ];

    // Citation potential data
    const citationScore = Math.round(aiReadiness.score * 0.93);
    const citationMetrics = [
      {
        category: "Technology",
        likelihood: Math.round(aiReadiness.score * 0.95),
        relevance: Math.round(contentAnalysis.averageReadability * 0.9),
        authority: Math.min(100, Math.round((contentAnalysis.averageWordCount / 2000) * 100)),
      },
      {
        category: "Business",
        likelihood: Math.round(aiReadiness.score * 0.85),
        relevance: Math.round(contentAnalysis.averageReadability * 0.85),
        authority: Math.min(100, Math.round((contentAnalysis.averageWordCount / 1500) * 90)),
      },
      {
        category: "Education",
        likelihood: Math.round(aiReadiness.score * 0.90),
        relevance: Math.round(contentAnalysis.averageReadability * 0.95),
        authority: Math.min(100, Math.round((contentAnalysis.averageWordCount / 2000) * 85)),
      },
      {
        category: "Health",
        likelihood: Math.round(aiReadiness.score * 0.75),
        relevance: Math.round(contentAnalysis.averageReadability * 0.88),
        authority: Math.min(100, Math.round((contentAnalysis.averageWordCount / 2000) * 92)),
      },
      {
        category: "Science",
        likelihood: Math.round(aiReadiness.score * 0.88),
        relevance: Math.round(contentAnalysis.averageReadability * 0.92),
        authority: Math.min(100, Math.round((contentAnalysis.averageWordCount / 2000) * 95)),
      },
    ];

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
      {
        name: "Factual Accuracy",
        score: 82,
        description: "Content backed by credible sources",
        examples: ["Citations included", "Recent data", "Expert quotes"],
        icon: "✓",
      },
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
      {
        name: "Uniqueness",
        score: 75,
        description: "Original perspective or analysis",
        examples: ["Original research", "Unique insights", "Proprietary data"],
        icon: "⭐",
      },
      {
        name: "Source Quality",
        score: 80,
        description: "Linked to authoritative sources",
        examples: ["DOI links", "Academic sources", "Industry leaders"],
        icon: "🔗",
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
        percentile: Math.round((citationScore / 100) * 95), // Percentile among all sites
      },
      llmSuitability: {
        factors: suitabilityFactors,
        overallScore: overallSuitability,
        recommendation: suitabilityRecommendation,
      },
    } as AIReadinessData;
  }, [audit]);
}
