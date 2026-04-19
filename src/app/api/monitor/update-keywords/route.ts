import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * POST /api/monitor/update-keywords
 *
 * Update GEO keywords for a brand by domain (for external integrations like Telegram).
 * No Clerk auth required - uses optional API key for security.
 *
 * Body: { domain: string, keywords: string[], apiKey?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, keywords, apiKey } = body;

    if (!domain) {
      return NextResponse.json(
        { success: false, error: "domain is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: "keywords array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Optional: Check API key if configured
    const expectedApiKey = process.env.APEXGEO_EXTERNAL_API_KEY;
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401 }
      );
    }

    // Find brand by domain (case-insensitive)
    const domainLower = domain.toLowerCase().trim();

    // Fetch all brands and filter in JS for case-insensitive match
    const allBrands = await db.query.brands.findMany();
    const brand = allBrands.find(
      b => b.domain && b.domain.toLowerCase() === domainLower
    );

    if (!brand) {
      return NextResponse.json(
        { success: false, error: `Brand with domain "${domain}" not found` },
        { status: 404 }
      );
    }

    if (!brand.isActive) {
      return NextResponse.json(
        { success: false, error: `Brand "${brand.name}" is inactive` },
        { status: 400 }
      );
    }

    // Update GEO keywords
    logger.info(`[API] Updating GEO keywords for ${brand.name}: ${keywords.length} keywords`);
    await db
      .update(brands)
      .set({
        geoKeywords: keywords,
        updatedAt: new Date(),
      })
      .where(eq(brands.id, brand.id));

    return NextResponse.json({
      success: true,
      brandId: brand.id,
      brandName: brand.name,
      domain: brand.domain,
      keywords: keywords,
      message: `Updated ${keywords.length} keywords for ${brand.name}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Error updating keywords:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
