/**
 * GEO Knowledge Base Seed API
 *
 * POST /api/geo/seed - Seed the knowledge base with initial data (admin only)
 * GET /api/geo/seed - Check if seeding is needed
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  seedKnowledgeBase,
  needsSeeding,
} from "@/lib/geo/seed-knowledge-base";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const needs = await needsSeeding();
    return NextResponse.json({
      success: true,
      data: {
        needsSeeding: needs,
      },
    });
  } catch (error) {
    console.error("Seed check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check seed status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can seed
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { force } = body;

    // Check if seeding is needed
    if (!force) {
      const needs = await needsSeeding();
      if (!needs) {
        return NextResponse.json({
          success: true,
          data: {
            message: "Knowledge base already seeded",
            seeded: false,
          },
        });
      }
    }

    // Run seeding
    const result = await seedKnowledgeBase();

    return NextResponse.json({
      success: true,
      data: {
        message: "Knowledge base seeded successfully",
        seeded: true,
        results: result,
      },
    });
  } catch (error) {
    console.error("Seed API error:", error);
    return NextResponse.json(
      {
        error: "Failed to seed knowledge base",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
