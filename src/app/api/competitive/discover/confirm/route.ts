/**
 * Competitor Discovery Confirmation API
 * Phase 9.1: Confirm or reject discovered competitors
 *
 * POST /api/competitive/discover/confirm - Confirm or reject a discovered competitor
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brands, discoveredCompetitors } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  confirmDiscoveredCompetitor,
  rejectDiscoveredCompetitor,
} from "@/lib/competitive";

// Request types
interface ConfirmRequest {
  brandId: string;
  discoveryId: string;
  action: "confirm" | "reject";
  rejectionReason?: string;
}

/**
 * POST /api/competitive/discover/confirm
 * Confirm or reject a discovered competitor
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ConfirmRequest = await request.json();
    const { brandId, discoveryId, action, rejectionReason } = body;

    // Validate required fields
    if (!brandId || !discoveryId || !action) {
      return NextResponse.json(
        { error: "brandId, discoveryId, and action are required" },
        { status: 400 }
      );
    }

    if (action !== "confirm" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be 'confirm' or 'reject'" },
        { status: 400 }
      );
    }

    // Verify brand exists
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Verify discovery exists
    const discovery = await db.query.discoveredCompetitors.findFirst({
      where: and(
        eq(discoveredCompetitors.id, discoveryId),
        eq(discoveredCompetitors.brandId, brandId)
      ),
    });

    if (!discovery) {
      return NextResponse.json(
        { error: "Discovered competitor not found" },
        { status: 404 }
      );
    }

    // Check if already processed
    if (discovery.status !== "pending") {
      return NextResponse.json(
        { error: `Competitor already ${discovery.status}` },
        { status: 400 }
      );
    }

    // Process the action
    if (action === "confirm") {
      await confirmDiscoveredCompetitor(discoveryId, brandId);
      return NextResponse.json({
        success: true,
        message: `${discovery.competitorName} has been added to your competitors`,
        action: "confirmed",
      });
    } else {
      await rejectDiscoveredCompetitor(discoveryId, brandId, rejectionReason);
      return NextResponse.json({
        success: true,
        message: `${discovery.competitorName} has been rejected`,
        action: "rejected",
      });
    }
  } catch (error) {
    console.error("Error confirming/rejecting competitor:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/competitive/discover/confirm
 * Bulk confirm or reject discovered competitors
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, items } = body as {
      brandId: string;
      items: Array<{
        discoveryId: string;
        action: "confirm" | "reject";
        rejectionReason?: string;
      }>;
    };

    if (!brandId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "brandId and items array are required" },
        { status: 400 }
      );
    }

    // Verify brand exists
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Process each item
    const results: Array<{
      discoveryId: string;
      success: boolean;
      action?: string;
      error?: string;
    }> = [];

    for (const item of items) {
      try {
        if (item.action === "confirm") {
          await confirmDiscoveredCompetitor(item.discoveryId, brandId);
          results.push({
            discoveryId: item.discoveryId,
            success: true,
            action: "confirmed",
          });
        } else if (item.action === "reject") {
          await rejectDiscoveredCompetitor(
            item.discoveryId,
            brandId,
            item.rejectionReason
          );
          results.push({
            discoveryId: item.discoveryId,
            success: true,
            action: "rejected",
          });
        } else {
          results.push({
            discoveryId: item.discoveryId,
            success: false,
            error: "Invalid action",
          });
        }
      } catch (err) {
        results.push({
          discoveryId: item.discoveryId,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const confirmed = results.filter(
      (r) => r.success && r.action === "confirmed"
    ).length;
    const rejected = results.filter(
      (r) => r.success && r.action === "rejected"
    ).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: { confirmed, rejected, failed },
      results,
    });
  } catch (error) {
    console.error("Error bulk processing competitors:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
