import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Recommendations Generate API (F106-F107)
 * POST /api/recommendations/generate - Generate recommendations for a brand
 *
 * Supports both AI-powered generation (default) and rule-based generation.
 * AI-powered generation uses Claude to analyze visibility data and generate
 * prioritized, actionable recommendations with impact scores.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brands, audits, brandMentions, type NewRecommendation } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import {
  generateRecommendations,
  type MonitorData,
  type AuditData,
} from "@/lib/recommendations";
import {
  generateAIRecommendations,
  type VisibilityData,
  type PlatformVisibility,
  type ContentGap,
  type CompetitorMetrics,
  type GeneratedRecommendation,
} from "@/lib/ai/recommendations";
import {
  createRecommendationsWithDuplicateDetection,
} from "@/lib/db/queries/recommendations";

// Logging prefix for observability
const LOG_PREFIX = "[API:Recommendations/Generate]";

// Request schema
const generateRequestSchema = z.object({
  brandId: z.string().min(1, "Brand ID is required"),
  includeMonitor: z.boolean().default(true),
  includeAudit: z.boolean().default(true),
  maxRecommendations: z.number().min(1).max(100).default(50),
  minConfidence: z.number().min(0).max(100).default(30),
  useAI: z.boolean().default(true), // Flag to use AI vs rule-based generation
});

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();

  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      console.warn(`${LOG_PREFIX} Unauthorized request attempt`);
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body with error handling for empty/invalid JSON
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: [{ message: "Request body must be valid JSON" }],
        },
        { status: 400 }
      );
    }

    // Validate request schema
    const {
      brandId,
      includeMonitor,
      includeAudit,
      maxRecommendations,
      minConfidence,
      useAI,
    } = generateRequestSchema.parse(body);

    // Log incoming request
    console.info(
      `${LOG_PREFIX} Request received`,
      {
        brandId,
        userId,
        orgId,
        includeMonitor,
        includeAudit,
        maxRecommendations,
        minConfidence,
        useAI,
      }
    );

    // Verify brand belongs to user's org
    const brand = await db.query.brands.findFirst({
      where: and(
        eq(brands.id, brandId),
        orgId ? eq(brands.organizationId, orgId) : undefined
      ),
    });

    if (!brand) {
      console.warn(`${LOG_PREFIX} Brand not found`, { brandId, orgId });
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    // Gather monitor data if requested
    const monitorDataArray: MonitorData[] = [];
    if (includeMonitor) {
      const recentMentions = await db.query.brandMentions.findMany({
        where: eq(brandMentions.brandId, brandId),
        orderBy: [desc(brandMentions.timestamp)],
        limit: 100,
      });

      // Group by platform
      const platformGroups = new Map<string, typeof recentMentions>();
      for (const result of recentMentions) {
        const platform = result.platform;
        if (!platformGroups.has(platform)) {
          platformGroups.set(platform, []);
        }
        platformGroups.get(platform)!.push(result);
      }

      // Convert to MonitorData format
      for (const [platform, results] of platformGroups) {
        const mentions = results.map((r) => ({
          id: r.id,
          platform: r.platform,
          query: r.query,
          mentioned: r.position !== null, // Brand is mentioned if position is set
          position: r.position ?? undefined,
          context: r.response ?? undefined,
          sentiment: r.sentiment as "positive" | "neutral" | "negative" | undefined,
          timestamp: r.timestamp,
        }));

        // Calculate sentiment
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
        for (const m of mentions) {
          if (m.sentiment) {
            sentimentCounts[m.sentiment]++;
          } else {
            sentimentCounts.neutral++;
          }
        }
        const total = mentions.length || 1;
        const sentimentScore =
          (sentimentCounts.positive - sentimentCounts.negative) / total;

        monitorDataArray.push({
          brandId,
          platform,
          mentions,
          sentiment: {
            overall:
              sentimentScore > 0.2
                ? "positive"
                : sentimentScore < -0.2
                ? "negative"
                : "neutral",
            score: sentimentScore,
            breakdown: {
              positive: sentimentCounts.positive / total,
              neutral: sentimentCounts.neutral / total,
              negative: sentimentCounts.negative / total,
            },
          },
          competitors: [], // Would need competitor data from monitor
          timestamp: new Date(),
        });
      }
    }

    // Gather audit data if requested
    let auditData: AuditData | null = null;
    if (includeAudit) {
      const latestAudit = await db.query.audits.findFirst({
        where: and(
          eq(audits.brandId, brandId),
          eq(audits.status, "completed")
        ),
        orderBy: [desc(audits.completedAt)],
      });

      if (latestAudit) {
        auditData = {
          brandId,
          url: latestAudit.url,
          overallScore: latestAudit.overallScore ?? 0,
          categoryScores: (latestAudit.categoryScores ?? []).map((cs) => ({
            category: cs.category,
            score: cs.score,
            maxScore: cs.maxScore,
            issues: cs.issues,
          })),
          issues: (latestAudit.issues ?? []).map((issue) => ({
            id: issue.id,
            category: issue.category,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            recommendation: issue.recommendation,
            impact: issue.impact,
          })),
          timestamp: latestAudit.completedAt ?? new Date(),
        };
      }
    }

    // Branch: AI-powered vs rule-based generation
    if (useAI) {
      const aiGenerationStartTime = Date.now();

      // Transform monitor and audit data into VisibilityData format for AI
      const visibilityData = transformToVisibilityData(
        brandId,
        brand.name,
        monitorDataArray,
        auditData
      );

      console.info(
        `${LOG_PREFIX} Starting AI generation`,
        {
          brandId,
          platformCount: visibilityData.platforms.length,
          contentGapsCount: visibilityData.contentGaps.length,
          competitorCount: visibilityData.competitorData.length,
        }
      );

      // Generate AI-powered recommendations
      const aiResult = await generateAIRecommendations(visibilityData, {
        maxRecommendations,
        minImpactThreshold: minConfidence,
      });

      const aiGenerationTime = Date.now() - aiGenerationStartTime;

      if (!aiResult.success) {
        // If AI generation failed but we have a warning (e.g., insufficient data), return empty with 200
        if (aiResult.error?.includes("Insufficient")) {
          const totalTime = Date.now() - requestStartTime;
          console.info(
            `${LOG_PREFIX} Insufficient data - returning empty result`,
            {
              brandId,
              totalTimeMs: totalTime,
              aiGenerationTimeMs: aiGenerationTime,
              warning: aiResult.error,
            }
          );
          return NextResponse.json({
            success: true,
            brandId,
            generatedAt: new Date().toISOString(),
            warning: aiResult.error,
            summary: {
              total: 0,
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
              persisted: 0,
              duplicatesSkipped: 0,
            },
            sources: {
              monitorPlatforms: monitorDataArray.length,
              auditIncluded: auditData !== null,
            },
            recommendations: [],
          });
        }

        // Otherwise, return error
        const totalTime = Date.now() - requestStartTime;
        console.error(
          `${LOG_PREFIX} AI generation failed`,
          {
            brandId,
            totalTimeMs: totalTime,
            aiGenerationTimeMs: aiGenerationTime,
            error: aiResult.error,
          }
        );
        return NextResponse.json(
          {
            success: false,
            error: "Failed to generate AI recommendations",
            details: aiResult.error,
          },
          { status: 500 }
        );
      }

      // Persist AI-generated recommendations to database
      const recommendationsToInsert: NewRecommendation[] = aiResult.recommendations.map(
        (rec) => ({
          brandId,
          title: rec.title,
          description: rec.description,
          category: rec.category,
          priority: rec.priority,
          impact: rec.impact,
          effort: rec.effort,
          status: "pending" as const,
          source: "monitoring" as const, // AI recommendations from visibility data
          steps: (rec.steps || []).map((step, idx) => ({
            stepNumber: idx + 1,
            instruction: typeof step === 'string' ? step : (step as any).instruction || String(step),
          })),
          estimatedTime: rec.estimatedTimeframe,
          notes: `AI-generated recommendation. Expected outcome: ${rec.expectedOutcome}. Impact score: ${rec.impactScore}`,
        })
      );

      const persistResult = await createRecommendationsWithDuplicateDetection(
        recommendationsToInsert
      );

      // Group by priority
      const grouped = {
        critical: aiResult.recommendations.filter((r) => r.priority === "critical"),
        high: aiResult.recommendations.filter((r) => r.priority === "high"),
        medium: aiResult.recommendations.filter((r) => r.priority === "medium"),
        low: aiResult.recommendations.filter((r) => r.priority === "low"),
      };

      const totalTime = Date.now() - requestStartTime;

      // Log successful AI generation completion
      console.info(
        `${LOG_PREFIX} AI generation completed successfully`,
        {
          brandId,
          totalTimeMs: totalTime,
          aiGenerationTimeMs: aiGenerationTime,
          recommendationsGenerated: aiResult.recommendations.length,
          recommendationsPersisted: persistResult.createdCount,
          duplicatesSkipped: persistResult.skippedCount,
          inputTokens: aiResult.tokenUsage?.input,
          outputTokens: aiResult.tokenUsage?.output,
          priorityBreakdown: {
            critical: grouped.critical.length,
            high: grouped.high.length,
            medium: grouped.medium.length,
            low: grouped.low.length,
          },
        }
      );

      return NextResponse.json({
        success: true,
        brandId,
        generatedAt: new Date().toISOString(),
        summary: {
          total: aiResult.recommendations.length,
          critical: grouped.critical.length,
          high: grouped.high.length,
          medium: grouped.medium.length,
          low: grouped.low.length,
          persisted: persistResult.createdCount,
          duplicatesSkipped: persistResult.skippedCount,
        },
        sources: {
          monitorPlatforms: monitorDataArray.length,
          auditIncluded: auditData !== null,
        },
        tokenUsage: aiResult.tokenUsage,
        recommendations: aiResult.recommendations.map((rec, index) => ({
          id: persistResult.created[index]?.id,
          source: "monitoring",
          category: rec.category,
          priority: rec.priority,
          impactScore: rec.impactScore,
          title: rec.title,
          description: rec.description,
          impact: rec.impact,
          effort: rec.effort,
          steps: rec.steps,
          aiPlatforms: rec.aiPlatforms,
          expectedOutcome: rec.expectedOutcome,
          estimatedTimeframe: rec.estimatedTimeframe,
        })),
        grouped: {
          critical: grouped.critical.map(mapAIRecToResponse),
          high: grouped.high.map(mapAIRecToResponse),
          medium: grouped.medium.map(mapAIRecToResponse),
          low: grouped.low.map(mapAIRecToResponse),
        },
      });
    }

    // Fallback: Rule-based generation
    console.info(
      `${LOG_PREFIX} Using rule-based generation`,
      { brandId, monitorPlatforms: monitorDataArray.length, hasAudit: auditData !== null }
    );

    const ruleBasedStartTime = Date.now();
    const recommendations = await generateRecommendations(
      brandId,
      monitorDataArray,
      auditData,
      {
        maxRecommendations,
        minConfidence,
      }
    );
    const ruleBasedTime = Date.now() - ruleBasedStartTime;

    // Group by priority
    const grouped = {
      critical: recommendations.filter((r) => r.priority === "critical"),
      high: recommendations.filter((r) => r.priority === "high"),
      medium: recommendations.filter((r) => r.priority === "medium"),
      low: recommendations.filter((r) => r.priority === "low"),
    };

    const totalTime = Date.now() - requestStartTime;

    console.info(
      `${LOG_PREFIX} Rule-based generation completed`,
      {
        brandId,
        totalTimeMs: totalTime,
        ruleBasedTimeMs: ruleBasedTime,
        recommendationsGenerated: recommendations.length,
        priorityBreakdown: {
          critical: grouped.critical.length,
          high: grouped.high.length,
          medium: grouped.medium.length,
          low: grouped.low.length,
        },
      }
    );

    return NextResponse.json({
      success: true,
      brandId,
      generatedAt: new Date().toISOString(),
      summary: {
        total: recommendations.length,
        critical: grouped.critical.length,
        high: grouped.high.length,
        medium: grouped.medium.length,
        low: grouped.low.length,
      },
      sources: {
        monitorPlatforms: monitorDataArray.length,
        auditIncluded: auditData !== null,
      },
      recommendations: recommendations.map((r) => ({
        id: r.id,
        source: r.source,
        category: r.category,
        priority: r.priority,
        priorityScore: r.priorityScore,
        title: r.title,
        description: r.description,
        impact: r.impact,
        effort: r.effort,
        urgency: r.urgency,
        confidence: r.confidence,
        actionItems: r.actionItems,
        aiPlatforms: r.aiPlatforms,
      })),
      grouped,
    });
  } catch (error) {
    const totalTime = Date.now() - requestStartTime;

    if (error instanceof z.ZodError) {
      console.warn(
        `${LOG_PREFIX} Validation error`,
        { totalTimeMs: totalTime, issues: error.issues.length }
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `${LOG_PREFIX} Unexpected error`,
      { totalTimeMs: totalTime, error: message }
    );
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform MonitorData and AuditData into VisibilityData format for AI analysis
 */
function transformToVisibilityData(
  brandId: string,
  brandName: string,
  monitorDataArray: MonitorData[],
  auditData: AuditData | null
): VisibilityData {
  // Transform monitor data into platform visibility metrics
  const platforms: PlatformVisibility[] = monitorDataArray.map((monitor) => {
    // Calculate average position from mentions
    const mentionsWithPosition = monitor.mentions.filter((m) => m.position !== undefined);
    const avgPosition = mentionsWithPosition.length > 0
      ? mentionsWithPosition.reduce((sum, m) => sum + (m.position ?? 0), 0) / mentionsWithPosition.length
      : null;

    // Calculate mention rate (percentage of mentions where brand was found)
    const totalMentions = monitor.mentions.length;
    const brandMentioned = monitor.mentions.filter((m) => m.mentioned).length;
    const mentionRate = totalMentions > 0 ? (brandMentioned / totalMentions) * 100 : 0;

    // Get citation frequency from sentiment data
    const citationFrequency = monitor.mentions.filter((m) => m.mentioned).length;

    return {
      name: normalizePlatformName(monitor.platform),
      mentionRate: Math.round(mentionRate),
      averagePosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
      sentiment: monitor.sentiment.overall,
      citationFrequency,
    };
  });

  // Extract content gaps from audit data
  const contentGaps: ContentGap[] = [];
  if (auditData) {
    // Convert audit issues to content gaps
    for (const issue of auditData.issues) {
      contentGaps.push({
        type: issue.category,
        description: `${issue.title}: ${issue.description}`,
        severity: mapIssueSeverityToGapSeverity(issue.severity),
        affectedPlatforms: getPlatformsAffectedByCategory(issue.category, platforms),
      });
    }

    // Add gaps based on low category scores
    for (const categoryScore of auditData.categoryScores) {
      const scorePercent = (categoryScore.score / categoryScore.maxScore) * 100;
      if (scorePercent < 60) {
        contentGaps.push({
          type: `low_${categoryScore.category}_score`,
          description: `${categoryScore.category} score is ${Math.round(scorePercent)}% (${categoryScore.score}/${categoryScore.maxScore})`,
          severity: scorePercent < 30 ? "critical" : scorePercent < 50 ? "high" : "medium",
          affectedPlatforms: platforms.map((p) => p.name),
        });
      }
    }
  }

  // Extract competitor data from monitor data
  const competitorData: CompetitorMetrics[] = [];
  for (const monitor of monitorDataArray) {
    for (const competitor of monitor.competitors) {
      // Check if we already have this competitor
      const existing = competitorData.find((c) => c.name === competitor.name);
      if (existing) {
        // Add platform if not already included
        if (!existing.platforms.includes(monitor.platform)) {
          existing.platforms.push(monitor.platform);
        }
      } else {
        // Calculate approximate mention rate from mentions count
        // If a competitor has more mentions, they likely have higher visibility
        const mentionRate = Math.min(competitor.mentions * 10, 100); // Rough estimate
        competitorData.push({
          name: competitor.name,
          mentionRate: mentionRate,
          platforms: [monitor.platform],
          advantageAreas: competitor.avgPosition < 3 ? ["High visibility ranking"] : undefined,
        });
      }
    }
  }

  return {
    brandId,
    brandName,
    platforms,
    contentGaps,
    competitorData,
  };
}

/**
 * Normalize platform names to standard format
 */
function normalizePlatformName(platform: string): string {
  const normalized = platform.toLowerCase();
  if (normalized.includes("chatgpt") || normalized.includes("openai")) {
    return "ChatGPT";
  }
  if (normalized.includes("claude") || normalized.includes("anthropic")) {
    return "Claude";
  }
  if (normalized.includes("perplexity")) {
    return "Perplexity";
  }
  if (normalized.includes("gemini") || normalized.includes("google")) {
    return "Gemini";
  }
  return platform;
}

/**
 * Map audit issue severity to content gap severity
 */
function mapIssueSeverityToGapSeverity(
  severity: string
): "critical" | "high" | "medium" | "low" {
  switch (severity.toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
    case "error":
      return "high";
    case "medium":
    case "warning":
      return "medium";
    default:
      return "low";
  }
}

/**
 * Determine which platforms are likely affected by a category issue
 */
function getPlatformsAffectedByCategory(
  category: string,
  platforms: PlatformVisibility[]
): string[] {
  // For schema markup issues, all platforms are affected
  if (category.toLowerCase().includes("schema")) {
    return platforms.map((p) => p.name);
  }
  // For technical SEO, prioritize platforms with low mention rates
  if (category.toLowerCase().includes("seo") || category.toLowerCase().includes("technical")) {
    return platforms.filter((p) => p.mentionRate < 50).map((p) => p.name);
  }
  // Default: all platforms
  return platforms.map((p) => p.name);
}

/**
 * Map AI recommendation to response format
 */
function mapAIRecToResponse(rec: GeneratedRecommendation) {
  return {
    category: rec.category,
    priority: rec.priority,
    impactScore: rec.impactScore,
    title: rec.title,
    description: rec.description,
    impact: rec.impact,
    effort: rec.effort,
    steps: rec.steps,
    aiPlatforms: rec.aiPlatforms,
    expectedOutcome: rec.expectedOutcome,
    estimatedTimeframe: rec.estimatedTimeframe,
  };
}
