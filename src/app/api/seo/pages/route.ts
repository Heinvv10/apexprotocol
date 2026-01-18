/**
 * SEO Pages API Route
 * Provides list of pages with SEO metrics
 * GET /api/seo/pages - Get all pages with SEO data
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { content, keywords as keywordsTable } from "@/lib/db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";

/**
 * GET /api/seo/pages
 * Returns list of all pages with SEO metrics
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all content pages
    const pages = await db
      .select()
      .from(content)
      .where(eq(content.organizationId, organizationId))
      .orderBy(desc(content.lastModified))
      .limit(100);

    // Get keyword count for each page
    const keywordCounts = await db
      .select({
        url: keywordsTable.url,
        count: count(),
      })
      .from(keywordsTable)
      .where(eq(keywordsTable.organizationId, organizationId))
      .groupBy(keywordsTable.url);

    const keywordMap = new Map(keywordCounts.map(k => [k.url, k.count]));

    // Transform to SEOPage format
    const seoPages = pages.map((page) => {
      // Determine indexing status
      let status: "indexed" | "not-indexed" | "error" = "not-indexed";
      if (page.indexed) status = "indexed";
      if (page.indexingErrors && page.indexingErrors.length > 0) status = "error";

      // Extract issues from page data
      const issues: string[] = [];
      if (!page.metaDescription || page.metaDescription.length < 50) {
        issues.push("Missing or short meta description");
      }
      if (!page.title || page.title.length < 30) {
        issues.push("Short or missing title");
      }
      if (page.indexingErrors) {
        issues.push(...page.indexingErrors);
      }

      return {
        id: page.id,
        url: page.url,
        title: page.title || "Untitled",
        metaDescription: page.metaDescription || "",
        status: status,
        traffic: page.visits || 0,
        keywords: keywordMap.get(page.url) || 0,
        lastCrawled: page.lastModified || page.createdAt,
        issues: issues,
      };
    });

    return NextResponse.json(seoPages);
  } catch (error) {
    console.error("[SEO Pages API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SEO pages" },
      { status: 500 }
    );
  }
}
