import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  portfolios,
  portfolioBrands,
  brands,
  brandMentions,
  recommendations,
  type NewPortfolio,
  type PortfolioMetrics,
} from "@/lib/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId, getUserId } from "@/lib/auth";

// Validation schemas
const createPortfolioSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  settings: z
    .object({
      defaultView: z.enum(["grid", "list", "comparison"]).optional(),
      alertThresholds: z
        .object({
          scoreDropPercent: z.number().min(0).max(100).optional(),
          mentionDropPercent: z.number().min(0).max(100).optional(),
          competitorGainPercent: z.number().min(0).max(100).optional(),
        })
        .optional(),
      reportRecipients: z.array(z.string().email()).optional(),
      reportFrequency: z
        .enum(["daily", "weekly", "biweekly", "monthly", "quarterly"])
        .optional(),
      compareMetrics: z.array(z.string()).optional(),
    })
    .optional(),
  brandIds: z.array(z.string()).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  includeMetrics: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
});

// GET /api/portfolios - List portfolios for organization
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
      includeMetrics: searchParams.get("includeMetrics") || "false",
    });

    const offset = (params.page - 1) * params.limit;

    // Get portfolios with brand count
    const portfoliosWithCount = await db
      .select({
        id: portfolios.id,
        organizationId: portfolios.organizationId,
        name: portfolios.name,
        description: portfolios.description,
        settings: portfolios.settings,
        aggregatedMetrics: portfolios.aggregatedMetrics,
        isActive: portfolios.isActive,
        createdAt: portfolios.createdAt,
        updatedAt: portfolios.updatedAt,
        metricsUpdatedAt: portfolios.metricsUpdatedAt,
        brandCount: sql<number>`(
          SELECT COUNT(*) FROM portfolio_brands pb
          WHERE pb.portfolio_id = ${portfolios.id}
        )::int`,
      })
      .from(portfolios)
      .where(eq(portfolios.organizationId, orgId))
      .orderBy(desc(portfolios.createdAt))
      .limit(params.limit)
      .offset(offset);

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(portfolios)
      .where(eq(portfolios.organizationId, orgId));

    // If metrics requested, enrich with live calculations
    let enrichedPortfolios = portfoliosWithCount;
    if (params.includeMetrics) {
      enrichedPortfolios = await Promise.all(
        portfoliosWithCount.map(async (portfolio) => {
          const metrics = await calculatePortfolioMetrics(portfolio.id);
          return { ...portfolio, liveMetrics: metrics };
        })
      );
    }

    return NextResponse.json({
      portfolios: enrichedPortfolios,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    });
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch portfolios" },
      { status: 500 }
    );
  }
}

// POST /api/portfolios - Create new portfolio
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createPortfolioSchema.parse(body);

    // Create portfolio
    const [newPortfolio] = await db
      .insert(portfolios)
      .values({
        organizationId: orgId,
        name: data.name,
        description: data.description,
        settings: data.settings ? {
          defaultView: data.settings.defaultView || "grid",
          alertThresholds: {
            scoreDropPercent: data.settings.alertThresholds?.scoreDropPercent ?? 10,
            mentionDropPercent: data.settings.alertThresholds?.mentionDropPercent ?? 20,
            competitorGainPercent: data.settings.alertThresholds?.competitorGainPercent ?? 15,
          },
          reportRecipients: data.settings.reportRecipients || [],
          reportFrequency: data.settings.reportFrequency || "weekly",
          compareMetrics: data.settings.compareMetrics || [
            "unified_score",
            "geo_score",
            "mentions_count",
          ],
        } : undefined,
      } as NewPortfolio)
      .returning();

    // Add brands to portfolio if provided
    if (data.brandIds && data.brandIds.length > 0) {
      // Verify brands belong to organization
      const validBrands = await db
        .select({ id: brands.id })
        .from(brands)
        .where(
          and(
            eq(brands.organizationId, orgId),
            sql`${brands.id} IN ${data.brandIds}`
          )
        );

      const validBrandIds = validBrands.map((b) => b.id);

      if (validBrandIds.length > 0) {
        await db.insert(portfolioBrands).values(
          validBrandIds.map((brandId, index) => ({
            portfolioId: newPortfolio.id,
            brandId,
            displayOrder: index,
          }))
        );
      }
    }

    // Calculate initial metrics
    const metrics = await calculatePortfolioMetrics(newPortfolio.id);

    // Update with calculated metrics
    const [updatedPortfolio] = await db
      .update(portfolios)
      .set({
        aggregatedMetrics: metrics,
        metricsUpdatedAt: new Date(),
      })
      .where(eq(portfolios.id, newPortfolio.id))
      .returning();

    return NextResponse.json(
      { portfolio: updatedPortfolio, metrics },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating portfolio:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create portfolio" },
      { status: 500 }
    );
  }
}

// Helper: Calculate portfolio metrics from brand data
async function calculatePortfolioMetrics(
  portfolioId: string
): Promise<PortfolioMetrics> {
  // Get brands in portfolio
  const portfolioBrandsList = await db
    .select({
      brandId: portfolioBrands.brandId,
      brandName: brands.name,
    })
    .from(portfolioBrands)
    .innerJoin(brands, eq(portfolioBrands.brandId, brands.id))
    .where(eq(portfolioBrands.portfolioId, portfolioId));

  if (portfolioBrandsList.length === 0) {
    return {
      totalBrands: 0,
      avgUnifiedScore: 0,
      avgGeoScore: 0,
      avgSeoScore: 0,
      avgAeoScore: 0,
      totalMentions: 0,
      totalRecommendations: 0,
      healthStatus: "healthy",
      brandBreakdown: [],
    };
  }

  const brandIds = portfolioBrandsList.map((b) => b.brandId);

  // Get mention counts per brand
  const mentionCounts = await db
    .select({
      brandId: brandMentions.brandId,
      count: count(),
    })
    .from(brandMentions)
    .where(sql`${brandMentions.brandId} IN ${brandIds}`)
    .groupBy(brandMentions.brandId);

  const mentionMap = new Map(mentionCounts.map((m) => [m.brandId, m.count]));

  // Get recommendation counts per brand
  const recCounts = await db
    .select({
      brandId: recommendations.brandId,
      count: count(),
    })
    .from(recommendations)
    .where(
      and(
        sql`${recommendations.brandId} IN ${brandIds}`,
        eq(recommendations.status, "pending")
      )
    )
    .groupBy(recommendations.brandId);

  const recMap = new Map(recCounts.map((r) => [r.brandId, r.count]));

  // Calculate totals
  const totalMentions = Array.from(mentionMap.values()).reduce(
    (sum, c) => sum + c,
    0
  );
  const totalRecommendations = Array.from(recMap.values()).reduce(
    (sum, c) => sum + c,
    0
  );

  // For now, use placeholder scores (would come from unified_scores table)
  // In production, query the actual score tables
  const avgScores = {
    unified: 50,
    geo: 45,
    seo: 55,
    aeo: 48,
  };

  // Determine health status based on scores
  let healthStatus: "healthy" | "warning" | "critical" = "healthy";
  if (avgScores.unified < 30) {
    healthStatus = "critical";
  } else if (avgScores.unified < 50) {
    healthStatus = "warning";
  }

  // Build brand breakdown
  const brandBreakdown = portfolioBrandsList.map((brand) => ({
    brandId: brand.brandId,
    brandName: brand.brandName,
    unifiedScore: 50, // Placeholder
    trend: "stable" as const,
  }));

  return {
    totalBrands: portfolioBrandsList.length,
    avgUnifiedScore: avgScores.unified,
    avgGeoScore: avgScores.geo,
    avgSeoScore: avgScores.seo,
    avgAeoScore: avgScores.aeo,
    totalMentions,
    totalRecommendations,
    healthStatus,
    brandBreakdown,
  };
}
