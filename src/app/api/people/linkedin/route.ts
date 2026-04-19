/**
 * LinkedIn People Enrichment API Route (Phase 9.4)
 *
 * POST /api/people/linkedin - Extract and enrich team members from LinkedIn
 * GET /api/people/linkedin?brandId=X - Get LinkedIn enrichment status for brand
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brands, brandPeople, peopleEnrichment } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { extractLinkedInPeople, enrichPersonProfile } from "@/lib/services/linkedin-scraper";

// ============================================================================
// Validation
// ============================================================================

const linkedinActionSchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  action: z.enum(["extract", "enrich-all", "enrich-one"]).default("extract"),
  personId: z.string().optional(), // For enrich-one
});

// ============================================================================
// GET /api/people/linkedin
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandId = request.nextUrl.searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId query parameter is required" },
        { status: 400 }
      );
    }

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

    // Get people from LinkedIn discovery
    const linkedInPeople = await db
      .select({
        id: brandPeople.id,
        name: brandPeople.name,
        title: brandPeople.title,
        linkedinUrl: brandPeople.linkedinUrl,
        linkedinFollowers: brandPeople.linkedinFollowers,
        discoveredFrom: brandPeople.discoveredFrom,
        isVerified: brandPeople.isVerified,
      })
      .from(brandPeople)
      .where(
        and(
          eq(brandPeople.brandId, brandId),
          eq(brandPeople.discoveredFrom, "linkedin")
        )
      );

    return NextResponse.json({
      data: {
        brandId,
        brandName: brand.name,
        linkedInPeopleCount: linkedInPeople.length,
        people: linkedInPeople,
      },
    });
  } catch (error) {
    console.error("Error fetching LinkedIn people:", error);
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn people" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/people/linkedin
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = linkedinActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { brandId, action, personId } = validation.data;

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

    // ========================================================================
    // Action: Extract LinkedIn people for the brand
    // ========================================================================
    if (action === "extract") {
      console.log(`[LinkedIn] Extracting people for brand: ${brand.name}`);

      const result = await extractLinkedInPeople(brandId);

      if (!result.success) {
        return NextResponse.json(
          {
            error: "Failed to extract LinkedIn people",
            details: result.errors,
          },
          { status: 400 }
        );
      }

      // Get newly added people
      const newPeople = await db
        .select()
        .from(brandPeople)
        .where(
          and(
            eq(brandPeople.brandId, brandId),
            eq(brandPeople.discoveredFrom, "linkedin")
          )
        );

      return NextResponse.json({
        data: {
          brandId,
          brandName: result.brandName,
          peopleExtracted: result.peopleExtracted,
          totalPeople: newPeople.length,
          people: newPeople,
        },
        meta: {
          success: true,
          errors: result.errors,
        },
      });
    }

    // ========================================================================
    // Action: Enrich all LinkedIn people
    // ========================================================================
    if (action === "enrich-all") {
      console.log(`[LinkedIn] Enriching all people for brand: ${brand.name}`);

      // Get all LinkedIn-discovered people for this brand
      const peopleToEnrich = await db
        .select()
        .from(brandPeople)
        .where(
          and(
            eq(brandPeople.brandId, brandId),
            eq(brandPeople.discoveredFrom, "linkedin")
          )
        );

      if (peopleToEnrich.length === 0) {
        return NextResponse.json({
          data: {
            brandId,
            enrichedCount: 0,
            totalAttempted: 0,
            people: [],
          },
          message: "No LinkedIn people found to enrich",
        });
      }

      const enrichmentResults = [];
      let enrichedCount = 0;

      for (const person of peopleToEnrich) {
        try {
          const enrichResult = await enrichPersonProfile(person.id);

          if (enrichResult.success) {
            enrichedCount++;
            enrichmentResults.push({
              personId: person.id,
              name: person.name,
              updatedFields: enrichResult.updatedFields,
              success: true,
            });
          } else {
            enrichmentResults.push({
              personId: person.id,
              name: person.name,
              error: enrichResult.error,
              success: false,
            });
          }
        } catch (error) {
          enrichmentResults.push({
            personId: person.id,
            name: person.name,
            error: error instanceof Error ? error.message : String(error),
            success: false,
          });
        }
      }

      return NextResponse.json({
        data: {
          brandId,
          enrichedCount,
          totalAttempted: peopleToEnrich.length,
          results: enrichmentResults,
        },
      });
    }

    // ========================================================================
    // Action: Enrich one person
    // ========================================================================
    if (action === "enrich-one") {
      if (!personId) {
        return NextResponse.json(
          { error: "personId is required for enrich-one action" },
          { status: 400 }
        );
      }

      console.log(`[LinkedIn] Enriching person: ${personId}`);

      // Verify person exists and belongs to this brand
      const person = await db.query.brandPeople.findFirst({
        where: eq(brandPeople.id, personId),
        with: {
          brand: true,
        },
      });

      if (!person) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }

      if (person.brand.id !== brandId) {
        return NextResponse.json(
          { error: "Person does not belong to this brand" },
          { status: 403 }
        );
      }

      const enrichResult = await enrichPersonProfile(personId);

      if (!enrichResult.success) {
        return NextResponse.json(
          {
            error: "Failed to enrich person",
            details: enrichResult.error,
          },
          { status: 400 }
        );
      }

      // Get updated person data
      const updatedPerson = await db.query.brandPeople.findFirst({
        where: eq(brandPeople.id, personId),
      });

      return NextResponse.json({
        data: {
          personId,
          name: person.name,
          updatedFields: enrichResult.updatedFields,
          person: updatedPerson,
        },
        meta: {
          success: true,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in LinkedIn people API:", error);
    return NextResponse.json(
      { error: "Failed to process LinkedIn request" },
      { status: 500 }
    );
  }
}
