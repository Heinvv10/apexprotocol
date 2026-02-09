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

    const [sim] = await db
      .select({
        id: simulations.id,
        status: simulations.status,
        progress: simulations.progress,
        platforms: simulations.platforms,
      })
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

    // Get per-platform status
    const results = await db
      .select({
        platform: simulationResults.platform,
        status: simulationResults.status,
      })
      .from(simulationResults)
      .where(eq(simulationResults.simulationId, id));

    const completedPlatforms = results.filter((r) => r.status === "success").map((r) => r.platform);
    const failedPlatforms = results.filter((r) => r.status === "failed").map((r) => r.platform);
    const allPlatforms = (sim.platforms as string[]) || [];
    const pendingPlatforms = allPlatforms.filter(
      (p) => !completedPlatforms.includes(p) && !failedPlatforms.includes(p)
    );

    return NextResponse.json({
      success: true,
      data: {
        id: sim.id,
        status: sim.status,
        progress: sim.progress,
        platforms: {
          completed: completedPlatforms,
          failed: failedPlatforms,
          pending: pendingPlatforms,
        },
      },
    });
  } catch (error) {
    console.error("[Simulations] Status failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get simulation status" },
      { status: 500 }
    );
  }
}
