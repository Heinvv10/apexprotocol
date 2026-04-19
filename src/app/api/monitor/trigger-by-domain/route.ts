import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import { eq } from "drizzle-orm";
import { runGEOMonitoringForBrand } from "@/lib/services/geo-monitor";
import { logger } from "@/lib/logger";

/**
 * POST /api/monitor/trigger-by-domain
 *
 * Trigger GEO monitoring for a brand by domain (for external integrations like Telegram).
 * No Clerk auth required - uses optional API key for security.
 *
 * Body: { domain: string, apiKey?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, apiKey } = body;

    if (!domain) {
      return NextResponse.json(
        { success: false, error: "domain is required" },
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

    // Run monitoring
    logger.info(`[API] Running GEO monitoring for brand: ${brand.name}`);
    const result = await runGEOMonitoringForBrand(brand.id);

    return NextResponse.json({
      success: true,
      brandId: brand.id,
      brandName: brand.name,
      domain: brand.domain,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Error running GEO monitoring:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
