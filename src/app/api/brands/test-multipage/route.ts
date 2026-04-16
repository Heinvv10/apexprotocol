/**
 * Test endpoint for multi-page brand scraping
 * POST /api/brands/test-multipage?url=https://example.com
 */

import { NextRequest, NextResponse } from "next/server";
import { scrapeMultiPageBrand } from "@/lib/services/brand-scraper-multipage";
import { getOrganizationId } from "@/lib/auth/clerk";

function isSafePublicUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0") return false;
  if (host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^127\./.test(host)) return false;
  if (/^10\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  if (/^169\.254\./.test(host)) return false;
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd")) return false;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Missing 'url' parameter" },
        { status: 400 }
      );
    }

    if (!isSafePublicUrl(url)) {
      return NextResponse.json(
        { error: "URL rejected: must be a public http(s) address" },
        { status: 400 }
      );
    }

    const result = await scrapeMultiPageBrand(url);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to scrape brand",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
