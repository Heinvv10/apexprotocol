import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  portfolios,
  portfolioBrands,
  brands,
  brandMentions,
  recommendations,
  type PortfolioMetrics,
} from "@/lib/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";

// Validation schemas
const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
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
  isActive: z.boolean().optional(),
});

// GET /api/portfolios/[id] - Get single portfolio with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get portfolio
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(
        and(eq(portfolios.id, id), eq(portfolios.organizationId, orgId))
      );

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Get brands in portfolio with details
    const portfolioBrandsList = await db
      .select({
        id: portfolioBrands.id,
        brandId: portfolioBrands.brandId,
        displayOrder: portfolioBrands.displayOrder,
        isHighlighted: portfolioBrands.isHighlighted,
        customLabel: portfolioBrands.customLabel,
        addedAt: portfolioBrands.addedAt,
        brand: {
          id: brands.id,
          name: brands.name,
          domain: brands.domain,
          logoUrl: brands.logoUrl,
          industry: brands.industry,
          isActive: brands.isActive,
        },
      })
      .from(portfolioBrands)
      .innerJoin(brands, eq(portfolioBrands.brandId, brands.id))
      .where(eq(portfolioBrands.portfolioId, id))
      .orderBy(portfolioBrands.displayOrder);

    // Calculate live metrics
    const metrics = await calculatePortfolioMetrics(id);

    return NextResponse.json({
      portfolio: {
        ...portfolio,
        brands: portfolioBrandsList,
        liveMetrics: metrics,
      },
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}

// PUT /api/portfolios/[id] - Update portfolio
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updatePortfolioSchema.parse(body);

    // Verify portfolio exists and belongs to organization
    const [existing] = await db
      .select({ id: portfolios.id, settings: portfolios.settings })
      .from(portfolios)
      .where(
        and(eq(portfolios.id, id), eq(portfolios.organizationId, orgId))
      );

    if (!existing) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Merge settings if provided
    let mergedSettings = existing.settings;
    if (data.settings) {
      const defaultSettings = {
        defaultView: "grid" as const,
        alertThresholds: {
          scoreDropPercent: 10,
          mentionDropPercent: 20,
          competitorGainPercent: 15,
        },
        reportRecipients: [] as string[],
        reportFrequency: "monthly" as const,
        compareMetrics: [] as string[],
      };
      mergedSettings = {
        ...defaultSettings,
        ...existing.settings,
        ...data.settings,
        alertThresholds: {
          ...defaultSettings.alertThresholds,
          ...existing.settings?.alertThresholds,
          ...data.settings.alertThresholds,
        },
      };
    }

    // Update portfolio
    const [updatedPortfolio] = await db
      .update(portfolios)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.settings && { settings: mergedSettings }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(portfolios.id, id))
      .returning();

    return NextResponse.json({ portfolio: updatedPortfolio });
  } catch (error) {
    console.error("Error updating portfolio:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update portfolio" },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolios/[id] - Delete portfolio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify portfolio exists and belongs to organization
    const [existing] = await db
      .select({ id: portfolios.id })
      .from(portfolios)
      .where(
        and(eq(portfolios.id, id), eq(portfolios.organizationId, orgId))
      );

    if (!existing) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Delete portfolio (cascades to portfolio_brands)
    await db.delete(portfolios).where(eq(portfolios.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting portfolio:", error);
    return NextResponse.json(
      { error: "Failed to delete portfolio" },
      { status: 500 }
    );
  }
}

// Helper: Calculate portfolio metrics
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

  // Placeholder scores - in production, query from unified_scores table
  const avgScores = {
    unified: 50,
    geo: 45,
    seo: 55,
    aeo: 48,
  };

  // Determine health status
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
    unifiedScore: 50,
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
