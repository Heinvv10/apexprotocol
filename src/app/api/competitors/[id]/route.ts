import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Individual Competitor Snapshot Management - Dynamic ID Routes
 * GET /api/competitors/:id - Get competitor snapshot details
 * PUT /api/competitors/:id - Update competitor snapshot
 * DELETE /api/competitors/:id - Delete competitor snapshot
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { competitorSnapshots, brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get competitor snapshot details
    const [snapshot] = await db
      .select()
      .from(competitorSnapshots)
      .where(eq(competitorSnapshots.id, id))
      .limit(1);

    if (!snapshot) {
      return NextResponse.json(
        { error: "Competitor snapshot not found" },
        { status: 404 }
      );
    }

    // Verify brand access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, snapshot.brandId),
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch competitor snapshot",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Get current snapshot for validation
    const [currentSnapshot] = await db
      .select()
      .from(competitorSnapshots)
      .where(eq(competitorSnapshots.id, id))
      .limit(1);

    if (!currentSnapshot) {
      return NextResponse.json(
        { error: "Competitor snapshot not found" },
        { status: 404 }
      );
    }

    // Verify brand access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, currentSnapshot.brandId),
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Prepare update object - allow updating metrics only
    const updateData: Record<string, unknown> = {};

    if (body.geoScore !== undefined) {
      updateData.geoScore = body.geoScore;
    }
    if (body.aiMentionCount !== undefined) {
      updateData.aiMentionCount = body.aiMentionCount;
    }
    if (body.avgMentionPosition !== undefined) {
      updateData.avgMentionPosition = body.avgMentionPosition;
    }
    if (body.sentimentScore !== undefined) {
      updateData.sentimentScore = body.sentimentScore;
    }
    if (body.socialFollowers !== undefined) {
      updateData.socialFollowers = body.socialFollowers;
    }
    if (body.socialEngagementRate !== undefined) {
      updateData.socialEngagementRate = body.socialEngagementRate;
    }
    if (body.contentPageCount !== undefined) {
      updateData.contentPageCount = body.contentPageCount;
    }
    if (body.blogPostCount !== undefined) {
      updateData.blogPostCount = body.blogPostCount;
    }
    if (body.lastContentPublished !== undefined) {
      updateData.lastContentPublished = body.lastContentPublished;
    }
    if (body.schemaTypes !== undefined) {
      updateData.schemaTypes = body.schemaTypes;
    }
    if (body.structuredDataScore !== undefined) {
      updateData.structuredDataScore = body.structuredDataScore;
    }
    if (body.platformBreakdown !== undefined) {
      updateData.platformBreakdown = body.platformBreakdown;
    }
    if (body.metadata !== undefined) {
      updateData.metadata = body.metadata;
    }

    // Update snapshot
    const [updated] = await db
      .update(competitorSnapshots)
      .set(updateData)
      .where(eq(competitorSnapshots.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Competitor snapshot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      snapshot: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update competitor snapshot",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get snapshot before deletion for verification
    const [snapshot] = await db
      .select()
      .from(competitorSnapshots)
      .where(eq(competitorSnapshots.id, id))
      .limit(1);

    if (!snapshot) {
      return NextResponse.json(
        { error: "Competitor snapshot not found" },
        { status: 404 }
      );
    }

    // Verify brand access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, snapshot.brandId),
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Delete snapshot
    const [deleted] = await db
      .delete(competitorSnapshots)
      .where(eq(competitorSnapshots.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Competitor snapshot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Competitor snapshot deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete competitor snapshot",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
