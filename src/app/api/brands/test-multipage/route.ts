/**
 * Test endpoint for multi-page brand scraping
 * POST /api/brands/test-multipage?url=https://example.com
 */

import { NextRequest, NextResponse } from "next/server";
import { scrapeMultiPageBrand } from "@/lib/services/brand-scraper-multipage";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Missing 'url' parameter" },
        { status: 400 }
      );
    }

    console.log(`\n🔍 Testing multi-page scraper for: ${url}\n`);

    const result = await scrapeMultiPageBrand(
      url,
      (progress, message) => {
        console.log(`  [${progress}%] ${message}`);
      }
    );

    console.log(`\n✅ Scraping complete!\n`);
    console.log(`Pages scraped:`, (result as unknown as Record<string, unknown>).pagesScraped);
    console.log(`Locations found: ${result.locations?.length || 0}`);
    console.log(`Personnel found: ${result.personnel?.length || 0}`);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Multi-page scraping error:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape brand",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
