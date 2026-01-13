import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Entity Extraction API (F108)
 * POST /api/recommendations/entities - Extract entities from content
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  extractEntities,
  analyzeEntities,
  identifyCoverageGaps,
} from "@/lib/recommendations";

// Request schema
const extractEntitiesSchema = z.object({
  content: z.string().min(1, "Content is required"),
  brandName: z.string().optional(),
  competitors: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  minConfidence: z.number().min(0).max(1).default(0.5),
  maxEntities: z.number().min(1).max(200).default(100),
  analyzeGaps: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const {
      content,
      brandName,
      competitors,
      platforms,
      minConfidence,
      maxEntities,
      analyzeGaps,
    } = extractEntitiesSchema.parse(body);

    // Extract entities
    const entities = extractEntities(content, {
      brandName,
      knownCompetitors: competitors,
      minConfidence,
      maxEntities,
    });

    // Analyze entities if requested
    let analysis = null;
    let coverageGaps: string[] = [];

    if (analyzeGaps) {
      const fullAnalysis = analyzeEntities(content, {
        brandName,
        knownCompetitors: competitors,
        platforms,
      });

      analysis = {
        brandMentions: fullAnalysis.brandMentions,
        competitorMentions: Object.fromEntries(fullAnalysis.competitorMentions),
        entityTypeBreakdown: getEntityTypeBreakdown(entities),
      };

      coverageGaps = fullAnalysis.coverageGaps;
    }

    // Group entities by type
    const groupedEntities = groupEntitiesByType(entities);

    return NextResponse.json({
      success: true,
      summary: {
        totalEntities: entities.length,
        uniqueTypes: Object.keys(groupedEntities).length,
        brandMentions: analysis?.brandMentions ?? 0,
        coverageGaps: coverageGaps.length,
      },
      entities: entities.map((e) => ({
        name: e.name,
        type: e.type,
        confidence: Math.round(e.confidence * 100) / 100,
        occurrences: e.occurrences,
        platforms: e.platforms,
        context: e.context.slice(0, 2), // Limit context snippets
      })),
      groupedByType: groupedEntities,
      analysis,
      coverageGaps,
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
        error: "Entity extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper functions
function groupEntitiesByType(entities: ReturnType<typeof extractEntities>) {
  const grouped: Record<string, typeof entities> = {};

  for (const entity of entities) {
    if (!grouped[entity.type]) {
      grouped[entity.type] = [];
    }
    grouped[entity.type].push(entity);
  }

  return grouped;
}

function getEntityTypeBreakdown(entities: ReturnType<typeof extractEntities>) {
  const breakdown: Record<string, number> = {};

  for (const entity of entities) {
    breakdown[entity.type] = (breakdown[entity.type] || 0) + 1;
  }

  return breakdown;
}
