/**
 * People Enrichment API Routes (Phase 9.3)
 *
 * GET /api/people/[id]/enrich - Get enrichment data for a person
 * POST /api/people/[id]/enrich - Trigger enrichment for a person
 * PATCH /api/people/[id]/enrich - Update enrichment data
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brandPeople, peopleEnrichment } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  calculateInfluenceScore,
  analyzeInfluenceProfile,
  getInfluenceTierDisplay,
} from "@/lib/osint/influence-calculator";

// ============================================================================
// Validation Schemas
// ============================================================================

const careerPositionSchema = z.object({
  title: z.string(),
  company: z.string(),
  companyLinkedinUrl: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  school: z.string(),
  schoolLinkedinUrl: z.string().optional(),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startYear: z.string().optional(),
  endYear: z.string().optional(),
  description: z.string().optional(),
});

const certificationSchema = z.object({
  name: z.string(),
  issuingOrganization: z.string(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().optional(),
});

const publicationSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  publicationDate: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  coAuthors: z.array(z.string()).optional(),
});

const conferenceAppearanceSchema = z.object({
  name: z.string(),
  eventDate: z.string(),
  topic: z.string().optional(),
  role: z.enum(["speaker", "panelist", "moderator", "keynote"]).optional(),
  url: z.string().optional(),
  audienceSize: z.number().optional(),
  location: z.string().optional(),
});

const podcastAppearanceSchema = z.object({
  podcastName: z.string(),
  episodeTitle: z.string().optional(),
  episodeDate: z.string(),
  url: z.string().optional(),
  downloads: z.number().optional(),
});

const enrichmentUpdateSchema = z.object({
  linkedinHeadline: z.string().optional().nullable(),
  linkedinAbout: z.string().optional().nullable(),
  linkedinProfileUrl: z.string().url().optional().nullable(),
  linkedinPublicId: z.string().optional().nullable(),
  currentPosition: z.string().optional().nullable(),
  currentCompany: z.string().optional().nullable(),
  currentCompanyLinkedinUrl: z.string().url().optional().nullable(),
  pastPositions: z.array(careerPositionSchema).optional(),
  totalYearsExperience: z.number().optional().nullable(),
  education: z.array(educationSchema).optional(),
  skills: z.array(z.string()).optional(),
  topSkills: z.array(z.string()).optional(),
  certifications: z.array(certificationSchema).optional(),
  languages: z.array(z.string()).optional(),
  linkedinConnectionCount: z.number().optional().nullable(),
  linkedinPostCount: z.number().optional().nullable(),
  linkedinEngagementRate: z.number().optional().nullable(),
  linkedinArticleCount: z.number().optional().nullable(),
  conferenceAppearances: z.array(conferenceAppearanceSchema).optional(),
  publications: z.array(publicationSchema).optional(),
  podcastAppearances: z.array(podcastAppearanceSchema).optional(),
  awards: z.array(z.object({
    name: z.string(),
    issuer: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  volunteerExperience: z.array(z.object({
    role: z.string(),
    organization: z.string(),
    description: z.string().optional(),
  })).optional(),
  enrichmentSource: z.enum([
    "linkedin_public",
    "clearbit",
    "apollo",
    "manual",
    "website_scrape",
  ]).optional(),
  enrichmentConfidence: z.number().min(0).max(1).optional(),
});

// ============================================================================
// GET /api/people/[id]/enrich
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get person with brand and enrichment
    const person = await db.query.brandPeople.findFirst({
      where: eq(brandPeople.id, id),
      with: {
        brand: true,
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Verify authorization
    if (orgId && person.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get enrichment data
    const enrichment = await db.query.peopleEnrichment.findFirst({
      where: eq(peopleEnrichment.personId, id),
    });

    // Calculate influence metrics
    const influenceMetrics = calculateInfluenceScore(person, enrichment);
    const influenceAnalysis = analyzeInfluenceProfile(influenceMetrics);
    const tierDisplay = getInfluenceTierDisplay(influenceMetrics.overallScore);

    return NextResponse.json({
      data: {
        personId: id,
        enrichment: enrichment || null,
        influence: {
          metrics: influenceMetrics,
          analysis: influenceAnalysis,
          tier: tierDisplay,
        },
        hasEnrichment: !!enrichment,
        lastEnrichedAt: enrichment?.lastEnrichedAt || null,
      },
    });
  } catch (error) {
    console.error("Error fetching enrichment:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrichment data" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/people/[id]/enrich - Trigger/Create enrichment
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = enrichmentUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    // Get person with brand
    const person = await db.query.brandPeople.findFirst({
      where: eq(brandPeople.id, id),
      with: {
        brand: true,
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Verify authorization
    if (orgId && person.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if enrichment already exists
    const existingEnrichment = await db.query.peopleEnrichment.findFirst({
      where: eq(peopleEnrichment.personId, id),
    });

    const enrichmentData = {
      ...validation.data,
      lastEnrichedAt: new Date(),
      updatedAt: new Date(),
    };

    let enrichment;

    if (existingEnrichment) {
      // Update existing enrichment
      const [updated] = await db
        .update(peopleEnrichment)
        .set(enrichmentData)
        .where(eq(peopleEnrichment.personId, id))
        .returning();
      enrichment = updated;
    } else {
      // Create new enrichment
      const [created] = await db
        .insert(peopleEnrichment)
        .values({
          personId: id,
          ...enrichmentData,
        })
        .returning();
      enrichment = created;
    }

    // Recalculate influence score
    const influenceMetrics = calculateInfluenceScore(person, enrichment);
    const influenceAnalysis = analyzeInfluenceProfile(influenceMetrics);

    // Update influence score in enrichment
    await db
      .update(peopleEnrichment)
      .set({ influenceScore: influenceMetrics.overallScore })
      .where(eq(peopleEnrichment.personId, id));

    return NextResponse.json({
      data: {
        enrichment,
        influence: {
          metrics: influenceMetrics,
          analysis: influenceAnalysis,
        },
      },
      created: !existingEnrichment,
    });
  } catch (error) {
    console.error("Error creating enrichment:", error);
    return NextResponse.json(
      { error: "Failed to create enrichment" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/people/[id]/enrich - Update enrichment
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = enrichmentUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    // Get person with brand
    const person = await db.query.brandPeople.findFirst({
      where: eq(brandPeople.id, id),
      with: {
        brand: true,
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Verify authorization
    if (orgId && person.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if enrichment exists
    const existingEnrichment = await db.query.peopleEnrichment.findFirst({
      where: eq(peopleEnrichment.personId, id),
    });

    if (!existingEnrichment) {
      return NextResponse.json(
        { error: "Enrichment record not found. Use POST to create one." },
        { status: 404 }
      );
    }

    // Update enrichment
    const [enrichment] = await db
      .update(peopleEnrichment)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(peopleEnrichment.personId, id))
      .returning();

    // Recalculate influence score
    const influenceMetrics = calculateInfluenceScore(person, enrichment);

    // Update influence score
    await db
      .update(peopleEnrichment)
      .set({ influenceScore: influenceMetrics.overallScore })
      .where(eq(peopleEnrichment.personId, id));

    return NextResponse.json({
      data: {
        enrichment: { ...enrichment, influenceScore: influenceMetrics.overallScore },
        influence: {
          metrics: influenceMetrics,
          analysis: analyzeInfluenceProfile(influenceMetrics),
        },
      },
    });
  } catch (error) {
    console.error("Error updating enrichment:", error);
    return NextResponse.json(
      { error: "Failed to update enrichment" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/people/[id]/enrich - Delete enrichment
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get person with brand
    const person = await db.query.brandPeople.findFirst({
      where: eq(brandPeople.id, id),
      with: {
        brand: true,
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Verify authorization
    if (orgId && person.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete enrichment
    await db
      .delete(peopleEnrichment)
      .where(eq(peopleEnrichment.personId, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting enrichment:", error);
    return NextResponse.json(
      { error: "Failed to delete enrichment" },
      { status: 500 }
    );
  }
}
