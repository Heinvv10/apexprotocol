import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { simulations, brands } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { buildBrandContext } from "@/lib/simulation/context-builder";
import { runSimulation } from "@/lib/simulation/simulation-service";

const createSimulationSchema = z.object({
  brandId: z.string().min(1),
  query: z.string().min(1).max(500),
  contentTitle: z.string().max(200).optional(),
  contentBody: z.string().min(1).max(10000),
  contentType: z.string().optional(),
  variantBTitle: z.string().max(200).optional(),
  variantBBody: z.string().max(10000).optional(),
  platforms: z.array(z.string()).min(1).max(7),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization context required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createSimulationSchema.parse(body);

    // Verify brand exists and belongs to org
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, data.brandId), eq(brands.organizationId, orgId)))
      .limit(1);

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    const isABTest = !!data.variantBBody;
    const brandContext = buildBrandContext({
      name: brand.name,
      domain: brand.domain,
      description: brand.description,
      keywords: brand.keywords ?? undefined,
      industry: brand.industry,
    });

    // Create simulation record
    const [simulation] = await db
      .insert(simulations)
      .values({
        organizationId: orgId,
        brandId: data.brandId,
        userId,
        type: isABTest ? "ab_test" : "single",
        query: data.query,
        contentTitle: data.contentTitle,
        contentBody: data.contentBody,
        contentType: data.contentType,
        variantBTitle: data.variantBTitle,
        variantBBody: data.variantBBody,
        platforms: data.platforms,
        brandContextSnapshot: brandContext,
        status: "pending",
        progress: 0,
      })
      .returning();

    // Start simulation asynchronously (fire-and-forget, progress polled via status endpoint)
    runSimulation(simulation.id).catch((err) => {
      console.error(`[Simulation] ${simulation.id} failed:`, err);
    });

    return NextResponse.json({
      success: true,
      data: {
        id: simulation.id,
        status: "pending",
        type: simulation.type,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[Simulations] Create failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create simulation" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization context required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: "brandId is required" },
        { status: 400 }
      );
    }

    const sims = await db
      .select({
        id: simulations.id,
        type: simulations.type,
        query: simulations.query,
        contentTitle: simulations.contentTitle,
        contentType: simulations.contentType,
        status: simulations.status,
        progress: simulations.progress,
        platforms: simulations.platforms,
        createdAt: simulations.createdAt,
        completedAt: simulations.completedAt,
      })
      .from(simulations)
      .where(
        and(
          eq(simulations.brandId, brandId),
          eq(simulations.organizationId, orgId)
        )
      )
      .orderBy(desc(simulations.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      data: sims,
    });
  } catch (error) {
    console.error("[Simulations] List failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list simulations" },
      { status: 500 }
    );
  }
}
