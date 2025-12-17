/**
 * Recommendations Generate API (F106-F107)
 * POST /api/recommendations/generate - Generate recommendations for a brand
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brands, audits, brandMentions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import {
  generateRecommendations,
  type MonitorData,
  type AuditData,
} from "@/lib/recommendations";

// Request schema
const generateRequestSchema = z.object({
  brandId: z.string().min(1, "Brand ID is required"),
  includeMonitor: z.boolean().default(true),
  includeAudit: z.boolean().default(true),
  maxRecommendations: z.number().min(1).max(100).default(50),
  minConfidence: z.number().min(0).max(100).default(30),
});

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const {
      brandId,
      includeMonitor,
      includeAudit,
      maxRecommendations,
      minConfidence,
    } = generateRequestSchema.parse(body);

    // Verify brand belongs to user's org
    const brand = await db.query.brands.findFirst({
      where: and(
        eq(brands.id, brandId),
        orgId ? eq(brands.organizationId, orgId) : undefined
      ),
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
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

    // Generate recommendations
    const recommendations = await generateRecommendations(
      brandId,
      monitorDataArray,
      auditData,
      {
        maxRecommendations,
        minConfidence,
      }
    );

    // Group by priority
    const grouped = {
      critical: recommendations.filter((r) => r.priority === "critical"),
      high: recommendations.filter((r) => r.priority === "high"),
      medium: recommendations.filter((r) => r.priority === "medium"),
      low: recommendations.filter((r) => r.priority === "low"),
    };

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
