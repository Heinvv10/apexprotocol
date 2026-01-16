/**
 * Platform Monitoring - Content Performance API Route
 * Analyzes which content types perform best across AI platforms
 * GET /api/platform-monitoring/content-performance - Get content performance analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";

/**
 * GET /api/platform-monitoring/content-performance
 * Returns analysis of content performance across AI platforms
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get brandId from query params
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Return mock data for content performance analysis
    const performanceByType = [
      {
        contentType: "faq",
        citations: 45,
        avgPosition: 1.8,
        avgVisibility: 88,
        topPlatforms: ["chatgpt", "claude", "perplexity"],
        trend: 12,
        citationRate: 34.8,
      },
      {
        contentType: "tutorial",
        citations: 38,
        avgPosition: 2.1,
        avgVisibility: 82,
        topPlatforms: ["gemini", "chatgpt", "claude"],
        trend: 8,
        citationRate: 29.2,
      },
      {
        contentType: "how-to",
        citations: 24,
        avgPosition: 2.5,
        avgVisibility: 75,
        topPlatforms: ["perplexity", "chatgpt", "grok"],
        trend: 5,
        citationRate: 18.5,
      },
      {
        contentType: "comparison",
        citations: 15,
        avgPosition: 3.2,
        avgVisibility: 68,
        topPlatforms: ["claude", "gemini", "chatgpt"],
        trend: -2,
        citationRate: 11.5,
      },
      {
        contentType: "news",
        citations: 8,
        avgPosition: 4.1,
        avgVisibility: 55,
        topPlatforms: ["perplexity", "grok", "chatgpt"],
        trend: 3,
        citationRate: 6.0,
      },
    ];

    // Schema impact analysis
    const schemaImpact = {
      withSchema: 85,
      withoutSchema: 45,
      improvement: 42, // 42% more citations with schema
      bySchemaType: [
        { type: "FAQPage", citations: 32, improvement: 58 },
        { type: "HowTo", citations: 28, improvement: 45 },
        { type: "Article", citations: 15, improvement: 32 },
        { type: "Organization", citations: 10, improvement: 28 },
      ],
    };

    // Content freshness impact
    const freshnessImpact = {
      under30Days: 45,
      under90Days: 41,
      over90Days: 44,
      recommendation: "Content under 90 days old receives 66% of citations",
      breakdown: [
        { range: "0-30 days", citations: 45, percentage: 34.6 },
        { range: "30-90 days", citations: 41, percentage: 31.5 },
        { range: "90-180 days", citations: 28, percentage: 21.5 },
        { range: "180+ days", citations: 16, percentage: 12.4 },
      ],
    };

    // Platform preferences
    const platformPreferences = {
      chatgpt: {
        preferredTypes: ["faq", "how-to", "tutorial"],
        avgPosition: 2.1,
        citationRate: 28,
      },
      claude: {
        preferredTypes: ["tutorial", "comparison", "technical"],
        avgPosition: 1.9,
        citationRate: 24,
      },
      gemini: {
        preferredTypes: ["video", "tutorial", "news"],
        avgPosition: 2.4,
        citationRate: 18,
      },
      perplexity: {
        preferredTypes: ["faq", "comparison", "how-to"],
        avgPosition: 1.7,
        citationRate: 22,
      },
      grok: {
        preferredTypes: ["news", "opinion", "how-to"],
        avgPosition: 3.1,
        citationRate: 8,
      },
    };

    return NextResponse.json({
      performanceByType,
      schemaImpact,
      freshnessImpact,
      platformPreferences,
    });
  } catch (error) {
    console.error(
      "[Platform Monitoring - Content Performance API] Error:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch content performance" },
      { status: 500 }
    );
  }
}
