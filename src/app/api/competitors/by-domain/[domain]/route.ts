/**
 * Delete Competitor By Domain
 * DELETE /api/competitors/by-domain/:domain - Delete all snapshots for a competitor domain
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { competitorSnapshots, brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Delete all snapshots for this competitor domain
    const deleted = await db
      .delete(competitorSnapshots)
      .where(
        and(
          eq(competitorSnapshots.brandId, brandId),
          eq(competitorSnapshots.competitorDomain, decodeURIComponent(domain))
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        {
          error: "Competitor not found",
          details: `No snapshots found for domain: ${decodeURIComponent(domain)}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.length} snapshot(s) for competitor`,
      deletedCount: deleted.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete competitor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
