/**
 * Platform Monitoring - Competitor Visibility API Route
 * Tracks competitor mentions across AI platforms
 * GET /api/platform-monitoring/competitor-visibility - Get competitor platform mentions
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";

/**
 * GET /api/platform-monitoring/competitor-visibility
 * Returns competitor mentions across AI platforms
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

    // Return mock data for now - this would be populated from actual platform monitoring data
    const competitors = [
      {
        name: "SearchableAI",
        mentions: 45,
        avgPosition: 2.3,
        avgVisibility: 82,
        shareOfVoice: 32.5,
        trend: 5,
        topPlatforms: ["chatgpt", "claude", "perplexity"],
        topQueries: ["best seo tools", "ai optimization", "search ranking"],
      },
      {
        name: "AIVisibility Pro",
        mentions: 32,
        avgPosition: 3.1,
        avgVisibility: 71,
        shareOfVoice: 21.8,
        trend: -2,
        topPlatforms: ["gemini", "chatgpt", "claude"],
        topQueries: ["visibility platform", "ai search", "content optimization"],
      },
      {
        name: "GEO Masters",
        mentions: 28,
        avgPosition: 2.8,
        avgVisibility: 68,
        shareOfVoice: 18.3,
        trend: 8,
        topPlatforms: ["perplexity", "claude", "chatgpt"],
        topQueries: ["geo optimization", "search visibility", "ai ranking"],
      },
      {
        name: "AnswerEngine Insights",
        mentions: 22,
        avgPosition: 3.5,
        avgVisibility: 62,
        shareOfVoice: 14.2,
        trend: 1,
        topPlatforms: ["chatgpt", "gemini", "grok"],
        topQueries: ["answer engine", "ai presence", "search optimization"],
      },
    ];

    const mentions = [
      {
        id: "comp-1",
        platform: "chatgpt",
        timestamp: new Date().toISOString(),
        query: "best seo tools 2024",
        competitor: "SearchableAI",
        competitorPage: "https://searchable.ai/features",
        context: "SearchableAI offers comprehensive SEO tracking...",
        position: 2,
        visibility: 85,
      },
      {
        id: "comp-2",
        platform: "claude",
        timestamp: new Date().toISOString(),
        query: "ai visibility platform comparison",
        competitor: "AIVisibility Pro",
        competitorPage: "https://aivisibility.pro",
        context: "For enterprise AI visibility, AIVisibility Pro...",
        position: 3,
        visibility: 72,
      },
    ];

    return NextResponse.json({
      mentions,
      competitors,
      shareOfVoice: 13.2, // Our share of voice
    });
  } catch (error) {
    console.error(
      "[Platform Monitoring - Competitor Visibility API] Error:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch competitor mentions" },
      { status: 500 }
    );
  }
}
