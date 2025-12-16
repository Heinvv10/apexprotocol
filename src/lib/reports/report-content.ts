/**
 * Report Content Utilities
 *
 * This file contains non-React report content helpers that can be
 * safely used in Next.js API routes. For PDF generation with React
 * components, use pdf-generator.tsx instead.
 */

import type { ReportContent } from "@/lib/db/schema/portfolios";

/**
 * Create sample report content for demonstration/testing
 * This function is safe to use in API routes (no React dependencies)
 */
export function createSampleReportContent(): ReportContent {
  return {
    summary: {
      headline:
        "Strong growth in AI visibility with 23% increase in positive mentions across all platforms.",
      keyMetrics: [
        { label: "Unified Score", value: 72, change: 8, changeDirection: "up" },
        { label: "AI Mentions", value: 1247, change: 23, changeDirection: "up" },
        { label: "Share of Voice", value: 34, change: 5, changeDirection: "up" },
        { label: "Sentiment", value: "78%", change: -2, changeDirection: "down" },
      ],
      highlights: [
        "ChatGPT mentions increased by 45% following schema optimization",
        "Perplexity citations now consistently include brand recommendations",
        "Competitor gap analysis reveals 3 high-opportunity keywords",
      ],
    },
    scores: {
      unified: { current: 72, previous: 64, trend: [60, 62, 64, 68, 72] },
      seo: { current: 78, previous: 75, trend: [72, 73, 75, 76, 78] },
      geo: { current: 68, previous: 58, trend: [52, 55, 58, 63, 68] },
      aeo: { current: 65, previous: 62, trend: [58, 60, 62, 63, 65] },
    },
    mentions: {
      total: 1247,
      byPlatform: [
        { platform: "chatgpt", count: 423, sentiment: "positive" },
        { platform: "claude", count: 312, sentiment: "positive" },
        { platform: "gemini", count: 198, sentiment: "neutral" },
        { platform: "perplexity", count: 187, sentiment: "positive" },
        { platform: "copilot", count: 127, sentiment: "neutral" },
      ],
      topQueries: [
        { query: "Best [industry] companies in [region]", count: 156 },
        { query: "Top rated [product] providers", count: 134 },
        { query: "[Brand] vs competitors comparison", count: 98 },
        { query: "Recommended [service] solutions", count: 87 },
        { query: "[Brand] reviews and ratings", count: 72 },
      ],
    },
    recommendations: {
      completed: 12,
      inProgress: 5,
      pending: 8,
      topPriority: [
        { title: "Add FAQ Schema to product pages", category: "Schema", impact: "High" },
        { title: "Optimize meta descriptions for AI extraction", category: "Content", impact: "High" },
        { title: "Create authoritative comparison content", category: "Content", impact: "Medium" },
      ],
    },
    competitive: {
      shareOfVoice: 34,
      competitorComparison: [
        { name: "Competitor A", sov: 28 },
        { name: "Competitor B", sov: 22 },
        { name: "Competitor C", sov: 16 },
      ],
      gaps: [
        { keyword: "best enterprise solutions", opportunity: "Not appearing in top 3 AI responses" },
        { keyword: "industry benchmarks", opportunity: "Competitor A dominates this query" },
        { keyword: "pricing comparison", opportunity: "Missing structured pricing content" },
      ],
    },
    insights: [
      "Your brand is consistently mentioned in positive contexts when users ask for recommendations.",
      "Schema markup improvements have directly correlated with increased AI citations.",
      "Consider creating more comparison content to capture competitor-related queries.",
    ],
  };
}
