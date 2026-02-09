import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { simulations, simulationResults } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get simulation
    const [sim] = await db
      .select()
      .from(simulations)
      .where(
        and(
          eq(simulations.id, id),
          eq(simulations.organizationId, orgId)
        )
      )
      .limit(1);

    if (!sim) {
      return NextResponse.json(
        { success: false, error: "Simulation not found" },
        { status: 404 }
      );
    }

    // Get results
    const results = await db
      .select()
      .from(simulationResults)
      .where(eq(simulationResults.simulationId, id));

    // Compute summary
    const successful = results.filter((r) => r.status === "success");
    const avgScoreDelta =
      successful.length > 0
        ? successful.reduce((sum, r) => sum + r.scoreDelta, 0) / successful.length
        : 0;
    const avgConfidence =
      successful.length > 0
        ? successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length
        : 0;

    // A/B winner
    let abWinner: "a" | "b" | "tie" | null = null;
    if (sim.type === "ab_test" && successful.length > 0) {
      const avgADelta = avgScoreDelta;
      const avgBDelta =
        successful.reduce((sum, r) => sum + (r.variantBScoreDelta ?? 0), 0) /
        successful.length;
      if (Math.abs(avgADelta - avgBDelta) < 2) {
        abWinner = "tie";
      } else {
        abWinner = avgADelta >= avgBDelta ? "a" : "b";
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        simulation: sim,
        results,
        summary: {
          avgScoreDelta: Math.round(avgScoreDelta * 10) / 10,
          avgConfidence: Math.round(avgConfidence * 100) / 100,
          totalPlatforms: results.length,
          successfulPlatforms: successful.length,
          failedPlatforms: results.filter((r) => r.status === "failed").length,
          abWinner,
        },
      },
    });
  } catch (error) {
    console.error("[Simulations] Get failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get simulation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const [sim] = await db
      .select({ id: simulations.id })
      .from(simulations)
      .where(
        and(
          eq(simulations.id, id),
          eq(simulations.organizationId, orgId)
        )
      )
      .limit(1);

    if (!sim) {
      return NextResponse.json(
        { success: false, error: "Simulation not found" },
        { status: 404 }
      );
    }

    // Cascade delete handles results
    await db.delete(simulations).where(eq(simulations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Simulations] Delete failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete simulation" },
      { status: 500 }
    );
  }
}
