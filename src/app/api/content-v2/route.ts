/**
 * Content API Route v2 - Fresh implementation
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    const whereConditions = brandId ? [eq(content.brandId, brandId)] : [];

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(content)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined);

    const total = totalResult[0]?.count || 0;

    // Get content
    const contentList = await db
      .select()
      .from(content)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
      .orderBy(desc(content.createdAt))
      .limit(limit);

    return NextResponse.json({
      content: contentList,
      total,
      page: 1,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[Content API v2] Error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
