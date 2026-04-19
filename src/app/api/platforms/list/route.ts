import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import {
  getPlatformsByTier,
  getEnabledPlatforms,
} from "@/lib/monitoring/platform-registry";

/**
 * List platforms
 *
 * GET /api/platforms/list?tier=tier_1&enabled=true
 *
 * Query params:
 * - tier: Optional tier filter (tier_1, tier_2, tier_3, tier_4)
 * - enabled: Optional boolean to show only enabled platforms
 */
export async function GET(request: NextRequest) {
  try {
    const __session = await getSession();
  const { userId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const tier = searchParams.get("tier") as any;
    const enabled = searchParams.get("enabled") === "true";

    let platforms;

    if (tier) {
      platforms = await getPlatformsByTier(tier);
    } else if (enabled) {
      platforms = await getEnabledPlatforms();
    } else {
      // All platforms
      const tier1 = await getPlatformsByTier("tier_1");
      const tier2 = await getPlatformsByTier("tier_2");
      const tier3 = await getPlatformsByTier("tier_3");
      const tier4 = await getPlatformsByTier("tier_4");
      platforms = [...tier1, ...tier2, ...tier3, ...tier4];
    }

    return NextResponse.json({
      success: true,
      data: platforms,
      count: platforms.length,
      filter: {
        tier: tier || "all",
        enabled: enabled || false,
      },
    });
  } catch (error) {
    console.error("List platforms error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list platforms",
      },
      { status: 500 }
    );
  }
}
