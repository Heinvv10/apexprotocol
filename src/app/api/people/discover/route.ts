/**
 * People Discovery API Route (Phase 7.2)
 *
 * POST /api/people/discover - Auto-discover people from brand website
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brands, brandPeople } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import {
  discoverPeopleFromWebsite,
  convertToDbPeople,
  type DiscoveryResult,
} from "@/lib/people";

// ============================================================================
// Validation
// ============================================================================

const discoverSchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  url: z.string().url().optional(), // Optional override URL
  maxPages: z.number().min(1).max(20).optional(),
  customPaths: z.array(z.string()).optional(),
  replaceExisting: z.boolean().optional(), // If true, replace discovered people
});

// ============================================================================
// POST /api/people/discover
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = discoverSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      brandId,
      url: overrideUrl,
      maxPages = 5,
      customPaths = [],
      replaceExisting = false,
    } = validation.data;

    // Verify brand exists and belongs to user's org
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (orgId && brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the URL to crawl
    const baseUrl = overrideUrl || (brand.domain ? `https://${brand.domain}` : null);

    if (!baseUrl) {
      return NextResponse.json(
        { error: "No URL available. Please provide a URL or set the brand domain." },
        { status: 400 }
      );
    }

    // Discover people from website
    let result: DiscoveryResult;
    try {
      result = await discoverPeopleFromWebsite({
        baseUrl,
        brandId,
        maxPages,
        customPaths,
      });
    } catch (error) {
      console.error("Discovery error:", error);
      return NextResponse.json(
        {
          error: "Failed to discover people from website",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // If no people found, return result with empty array
    if (result.people.length === 0) {
      return NextResponse.json({
        data: {
          discovered: 0,
          saved: 0,
          skipped: 0,
          people: [],
        },
        meta: {
          crawledUrls: result.crawledUrls,
          pagesWithTeam: result.pagesWithTeam,
          confidence: result.confidence,
          errors: result.errors,
        },
      });
    }

    // Get existing people to avoid duplicates
    const existingPeople = await db
      .select({ name: brandPeople.name })
      .from(brandPeople)
      .where(
        and(
          eq(brandPeople.brandId, brandId),
          eq(brandPeople.discoveredFrom, "website_scrape")
        )
      );

    const existingNames = new Set(
      existingPeople.map((p) => p.name.toLowerCase().trim())
    );

    // If replaceExisting, delete existing discovered people
    if (replaceExisting) {
      await db
        .delete(brandPeople)
        .where(
          and(
            eq(brandPeople.brandId, brandId),
            eq(brandPeople.discoveredFrom, "website_scrape")
          )
        );
      existingNames.clear();
    }

    // Convert to DB format and filter out duplicates
    const peopleToInsert = convertToDbPeople(result.people, brandId);
    const newPeople = peopleToInsert.filter(
      (p) => !existingNames.has(p.name.toLowerCase().trim())
    );

    // Insert new people
    let savedPeople: typeof brandPeople.$inferSelect[] = [];
    if (newPeople.length > 0) {
      savedPeople = await db
        .insert(brandPeople)
        .values(newPeople)
        .returning();
    }

    return NextResponse.json({
      data: {
        discovered: result.people.length,
        saved: savedPeople.length,
        skipped: peopleToInsert.length - newPeople.length,
        people: savedPeople,
      },
      meta: {
        crawledUrls: result.crawledUrls,
        pagesWithTeam: result.pagesWithTeam,
        confidence: result.confidence,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("Error in people discovery:", error);
    return NextResponse.json(
      { error: "Failed to discover people" },
      { status: 500 }
    );
  }
}
