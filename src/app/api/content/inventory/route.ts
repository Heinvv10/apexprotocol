import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Content Inventory API (F116)
 * GET /api/content/inventory - List content assets
 * POST /api/content/inventory - Add/update content assets
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  contentInventory,
  calculateGEOScore,
  formatAssetResponse,
  type ContentType,
  type ContentStatus,
} from "@/lib/content";

// Request schemas
const upsertAssetSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  type: z.enum(["page", "blog_post", "product", "category", "landing", "faq", "resource", "documentation"]).default("page"),
  status: z.enum(["active", "draft", "archived", "redirected", "error", "pending_review"]).default("active"),
  tags: z.array(z.string()).optional(),
  metadata: z.object({
    wordCount: z.number().optional(),
    readingTime: z.number().optional(),
    language: z.string().optional(),
    author: z.string().optional(),
    hasSchema: z.boolean().optional(),
    schemaTypes: z.array(z.string()).optional(),
  }).optional(),
});

const bulkImportSchema = z.object({
  pages: z.array(z.object({
    url: z.string().url(),
    title: z.string(),
    type: z.enum(["page", "blog_post", "product", "category", "landing", "faq", "resource", "documentation"]).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })),
});

const updateScoreSchema = z.object({
  assetId: z.string().min(1),
  scores: z.object({
    hasSchema: z.boolean(),
    schemaCount: z.number().default(0),
    readabilityScore: z.number().min(0).max(100),
    wordCount: z.number().min(0),
    entityCount: z.number().min(0),
    pageSpeed: z.number().min(0).max(100),
    mobileScore: z.number().min(0).max(100),
    aiMentions: z.number().min(0),
    citations: z.number().min(0),
  }),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const action = searchParams.get("action") || "list";

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "list":
        return handleListAssets(brandId, searchParams);

      case "stats":
        return handleGetStats(brandId);

      case "needsAttention":
        return handleNeedsAttention(brandId, searchParams);

      case "recent":
        return handleRecentlyUpdated(brandId, searchParams);

      case "search":
        return handleSearch(brandId, searchParams);

      case "export":
        return handleExport(brandId);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: list, stats, needsAttention, recent, search, or export" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch inventory",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const brandId = body.brandId;

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    const action = body.action || "upsert";

    switch (action) {
      case "upsert":
        return handleUpsertAsset(brandId, body);

      case "bulkImport":
        return handleBulkImport(brandId, body);

      case "updateScore":
        return handleUpdateScore(body);

      case "updateOptimization":
        return handleUpdateOptimization(body);

      case "delete":
        return handleDelete(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: upsert, bulkImport, updateScore, updateOptimization, or delete" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Inventory operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleListAssets(brandId: string, searchParams: URLSearchParams) {
  const type = searchParams.get("type") as ContentType | null;
  const status = searchParams.get("status") as ContentStatus | null;
  const minScore = searchParams.get("minScore")
    ? parseInt(searchParams.get("minScore")!)
    : undefined;
  const maxScore = searchParams.get("maxScore")
    ? parseInt(searchParams.get("maxScore")!)
    : undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 50;
  const offset = searchParams.get("offset")
    ? parseInt(searchParams.get("offset")!)
    : 0;
  const sortBy = (searchParams.get("sortBy") as "score" | "date" | "title") || "score";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const assets = contentInventory.getBrandAssets(brandId, {
    type: type || undefined,
    status: status || undefined,
    minScore,
    maxScore,
    limit,
    offset,
    sortBy,
    sortOrder,
  });

  const stats = contentInventory.getStats(brandId);

  return NextResponse.json({
    success: true,
    summary: {
      total: stats.totalAssets,
      returned: assets.length,
      averageScore: Math.round(stats.averageGEOScore),
    },
    assets: assets.map(formatAssetResponse),
    pagination: {
      offset,
      limit,
      hasMore: offset + assets.length < stats.totalAssets,
    },
  });
}

function handleGetStats(brandId: string) {
  const stats = contentInventory.getStats(brandId);

  return NextResponse.json({
    success: true,
    stats: {
      totalAssets: stats.totalAssets,
      averageGEOScore: Math.round(stats.averageGEOScore),
      byType: stats.byType,
      byStatus: stats.byStatus,
      scoreDistribution: stats.scoreDistribution,
      optimization: stats.optimizationSummary,
    },
    health: {
      status: getHealthStatus(stats),
      recommendations: getHealthRecommendations(stats),
    },
  });
}

function handleNeedsAttention(brandId: string, searchParams: URLSearchParams) {
  const maxScore = searchParams.get("maxScore")
    ? parseInt(searchParams.get("maxScore")!)
    : 60;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 10;

  const assets = contentInventory.getNeedsAttention(brandId, { maxScore, limit });

  return NextResponse.json({
    success: true,
    count: assets.length,
    threshold: maxScore,
    assets: assets.map(formatAssetResponse),
  });
}

function handleRecentlyUpdated(brandId: string, searchParams: URLSearchParams) {
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 10;

  const assets = contentInventory.getRecentlyUpdated(brandId, limit);

  return NextResponse.json({
    success: true,
    count: assets.length,
    assets: assets.map(formatAssetResponse),
  });
}

function handleSearch(brandId: string, searchParams: URLSearchParams) {
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Search query 'q' is required" },
      { status: 400 }
    );
  }

  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 20;

  const assets = contentInventory.searchAssets(brandId, query, { limit });

  return NextResponse.json({
    success: true,
    query,
    count: assets.length,
    assets: assets.map(formatAssetResponse),
  });
}

function handleExport(brandId: string) {
  const exported = contentInventory.exportInventory(brandId);

  return NextResponse.json({
    success: true,
    export: {
      brandId,
      exportedAt: exported.exportedAt.toISOString(),
      totalAssets: exported.assets.length,
      stats: exported.stats,
      assets: exported.assets.map(formatAssetResponse),
    },
  });
}

// POST handlers
async function handleUpsertAsset(brandId: string, body: unknown) {
  const assetData = upsertAssetSchema.parse(body);

  const asset = contentInventory.upsertAsset({
    brandId,
    url: assetData.url,
    title: assetData.title,
    type: assetData.type,
    status: assetData.status,
    geoScore: {
      overall: 0,
      breakdown: {
        schemaMarkup: 0,
        voiceReadability: 0,
        contentQuality: 0,
        entityCoverage: 0,
        technicalHealth: 0,
        aiOptimization: 0,
      },
      grade: "F",
      lastCalculated: new Date(),
    },
    optimizationStatus: {
      level: "not_analyzed",
      recommendations: 0,
      highPriority: 0,
      completedRecommendations: 0,
    },
    tags: assetData.tags || [],
    metadata: assetData.metadata || {},
  });

  return NextResponse.json({
    success: true,
    message: "Asset upserted",
    asset: formatAssetResponse(asset),
  });
}

async function handleBulkImport(brandId: string, body: unknown) {
  const { pages } = bulkImportSchema.parse(body);

  const imported = contentInventory.bulkImport(brandId, pages);

  return NextResponse.json({
    success: true,
    message: `Imported ${imported.length} assets`,
    imported: imported.length,
    assets: imported.map(formatAssetResponse),
  });
}

async function handleUpdateScore(body: unknown) {
  const { assetId, scores } = updateScoreSchema.parse(body);

  const breakdown = calculateGEOScore(scores);
  const updated = contentInventory.updateGEOScore(assetId, breakdown);

  if (!updated) {
    return NextResponse.json(
      { error: "Asset not found", assetId },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "GEO score updated",
    asset: formatAssetResponse(updated),
  });
}

async function handleUpdateOptimization(body: unknown) {
  const schema = z.object({
    assetId: z.string().min(1),
    optimization: z.object({
      level: z.enum(["optimized", "needs_work", "critical", "not_analyzed"]).optional(),
      recommendations: z.number().optional(),
      highPriority: z.number().optional(),
      completedRecommendations: z.number().optional(),
    }),
  });

  const { assetId, optimization } = schema.parse(body);

  const updated = contentInventory.updateOptimizationStatus(assetId, optimization);

  if (!updated) {
    return NextResponse.json(
      { error: "Asset not found", assetId },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Optimization status updated",
    asset: formatAssetResponse(updated),
  });
}

async function handleDelete(body: unknown) {
  const schema = z.object({
    assetId: z.string().min(1),
  });

  const { assetId } = schema.parse(body);

  const deleted = contentInventory.deleteAsset(assetId);

  if (!deleted) {
    return NextResponse.json(
      { error: "Asset not found", assetId },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Asset deleted",
    assetId,
  });
}

// Helper functions
function getHealthStatus(stats: ReturnType<typeof contentInventory.getStats>): string {
  const avgScore = stats.averageGEOScore;
  const criticalPercent = (stats.scoreDistribution.critical + stats.scoreDistribution.poor) / stats.totalAssets * 100;

  if (avgScore >= 80 && criticalPercent < 10) return "excellent";
  if (avgScore >= 60 && criticalPercent < 25) return "good";
  if (avgScore >= 40 && criticalPercent < 50) return "fair";
  return "needs_attention";
}

function getHealthRecommendations(stats: ReturnType<typeof contentInventory.getStats>): string[] {
  const recommendations: string[] = [];

  if (stats.optimizationSummary.notAnalyzed > 0) {
    recommendations.push(`${stats.optimizationSummary.notAnalyzed} assets need initial analysis`);
  }

  if (stats.scoreDistribution.critical > 0) {
    recommendations.push(`${stats.scoreDistribution.critical} assets with critical scores need immediate attention`);
  }

  if (stats.optimizationSummary.critical > 0) {
    recommendations.push(`${stats.optimizationSummary.critical} assets have critical optimization issues`);
  }

  if (stats.averageGEOScore < 60) {
    recommendations.push("Overall GEO health is below target - prioritize content optimization");
  }

  return recommendations;
}
