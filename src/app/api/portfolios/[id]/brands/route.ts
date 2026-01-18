import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios, portfolioBrands, brands } from "@/lib/db/schema";
import { eq, and, sql, max } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/clerk";

// Validation schemas
const addBrandsSchema = z.object({
  brandIds: z.array(z.string()).min(1, "At least one brand ID required"),
});

const updateBrandSchema = z.object({
  displayOrder: z.number().min(0).optional(),
  isHighlighted: z.boolean().optional(),
  customLabel: z.string().max(50).optional().nullable(),
});

const removeBrandsSchema = z.object({
  brandIds: z.array(z.string()).min(1, "At least one brand ID required"),
});

// GET /api/portfolios/[id]/brands - List brands in portfolio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: portfolioId } = await params;

    // Verify portfolio exists and belongs to organization
    const [portfolio] = await db
      .select({ id: portfolios.id })
      .from(portfolios)
      .where(
        and(
          eq(portfolios.id, portfolioId),
          eq(portfolios.organizationId, orgId)
        )
      );

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Get brands in portfolio with full details
    const portfolioBrandsList = await db
      .select({
        id: portfolioBrands.id,
        portfolioId: portfolioBrands.portfolioId,
        brandId: portfolioBrands.brandId,
        displayOrder: portfolioBrands.displayOrder,
        isHighlighted: portfolioBrands.isHighlighted,
        customLabel: portfolioBrands.customLabel,
        addedAt: portfolioBrands.addedAt,
        brand: {
          id: brands.id,
          name: brands.name,
          domain: brands.domain,
          description: brands.description,
          industry: brands.industry,
          logoUrl: brands.logoUrl,
          isActive: brands.isActive,
          createdAt: brands.createdAt,
        },
      })
      .from(portfolioBrands)
      .innerJoin(brands, eq(portfolioBrands.brandId, brands.id))
      .where(eq(portfolioBrands.portfolioId, portfolioId))
      .orderBy(portfolioBrands.displayOrder);

    return NextResponse.json({
      brands: portfolioBrandsList,
      total: portfolioBrandsList.length,
    });
  } catch (error) {
    console.error("Error fetching portfolio brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio brands" },
      { status: 500 }
    );
  }
}

// POST /api/portfolios/[id]/brands - Add brands to portfolio
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: portfolioId } = await params;
    const body = await request.json();
    const { brandIds } = addBrandsSchema.parse(body);

    // Verify portfolio exists and belongs to organization
    const [portfolio] = await db
      .select({ id: portfolios.id })
      .from(portfolios)
      .where(
        and(
          eq(portfolios.id, portfolioId),
          eq(portfolios.organizationId, orgId)
        )
      );

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Verify brands exist and belong to organization
    const validBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .where(
        and(
          eq(brands.organizationId, orgId),
          sql`${brands.id} IN ${brandIds}`
        )
      );

    const validBrandIds = validBrands.map((b) => b.id);

    if (validBrandIds.length === 0) {
      return NextResponse.json(
        { error: "No valid brands found" },
        { status: 400 }
      );
    }

    // Get existing brands in portfolio to avoid duplicates
    const existingBrands = await db
      .select({ brandId: portfolioBrands.brandId })
      .from(portfolioBrands)
      .where(eq(portfolioBrands.portfolioId, portfolioId));

    const existingBrandIds = new Set(existingBrands.map((b) => b.brandId));
    const newBrandIds = validBrandIds.filter((id) => !existingBrandIds.has(id));

    if (newBrandIds.length === 0) {
      return NextResponse.json(
        { error: "All brands are already in portfolio" },
        { status: 400 }
      );
    }

    // Get max display order
    const [{ maxOrder }] = await db
      .select({ maxOrder: max(portfolioBrands.displayOrder) })
      .from(portfolioBrands)
      .where(eq(portfolioBrands.portfolioId, portfolioId));

    const startOrder = (maxOrder ?? -1) + 1;

    // Add brands to portfolio
    const addedBrands = await db
      .insert(portfolioBrands)
      .values(
        newBrandIds.map((brandId, index) => ({
          portfolioId,
          brandId,
          displayOrder: startOrder + index,
        }))
      )
      .returning();

    return NextResponse.json(
      {
        added: addedBrands.length,
        skipped: validBrandIds.length - newBrandIds.length,
        portfolioBrands: addedBrands,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding brands to portfolio:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add brands to portfolio" },
      { status: 500 }
    );
  }
}

// PATCH /api/portfolios/[id]/brands - Update brand in portfolio (order, highlight, label)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: portfolioId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId query parameter required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = updateBrandSchema.parse(body);

    // Verify portfolio exists and belongs to organization
    const [portfolio] = await db
      .select({ id: portfolios.id })
      .from(portfolios)
      .where(
        and(
          eq(portfolios.id, portfolioId),
          eq(portfolios.organizationId, orgId)
        )
      );

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Update portfolio brand entry
    const [updated] = await db
      .update(portfolioBrands)
      .set({
        ...(data.displayOrder !== undefined && {
          displayOrder: data.displayOrder,
        }),
        ...(data.isHighlighted !== undefined && {
          isHighlighted: data.isHighlighted,
        }),
        ...(data.customLabel !== undefined && { customLabel: data.customLabel }),
      })
      .where(
        and(
          eq(portfolioBrands.portfolioId, portfolioId),
          eq(portfolioBrands.brandId, brandId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Brand not found in portfolio" },
        { status: 404 }
      );
    }

    return NextResponse.json({ portfolioBrand: updated });
  } catch (error) {
    console.error("Error updating portfolio brand:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update portfolio brand" },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolios/[id]/brands - Remove brands from portfolio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: portfolioId } = await params;

    // Check for single brandId in query params or body
    const searchParams = request.nextUrl.searchParams;
    const singleBrandId = searchParams.get("brandId");

    let brandIds: string[];

    if (singleBrandId) {
      brandIds = [singleBrandId];
    } else {
      const body = await request.json();
      const data = removeBrandsSchema.parse(body);
      brandIds = data.brandIds;
    }

    // Verify portfolio exists and belongs to organization
    const [portfolio] = await db
      .select({ id: portfolios.id })
      .from(portfolios)
      .where(
        and(
          eq(portfolios.id, portfolioId),
          eq(portfolios.organizationId, orgId)
        )
      );

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Remove brands from portfolio
    const deleted = await db
      .delete(portfolioBrands)
      .where(
        and(
          eq(portfolioBrands.portfolioId, portfolioId),
          sql`${portfolioBrands.brandId} IN ${brandIds}`
        )
      )
      .returning();

    return NextResponse.json({
      removed: deleted.length,
      brandIds: deleted.map((d) => d.brandId),
    });
  } catch (error) {
    console.error("Error removing brands from portfolio:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to remove brands from portfolio" },
      { status: 500 }
    );
  }
}
