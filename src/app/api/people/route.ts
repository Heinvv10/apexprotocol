/**
 * People API Routes (Phase 7.2 + 7.5)
 *
 * GET /api/people - List people for a brand
 * GET /api/people?type=summary - Get PPO score and summary
 * GET /api/people?type=list - Get people list
 * GET /api/people?type=ai-mentions - Get AI mentions for people
 * POST /api/people - Add a new person
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId, getUserId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brandPeople, peopleAiMentions, peopleScores, brands } from "@/lib/db/schema";
import { eq, and, desc, asc, sql, gte } from "drizzle-orm";
import { z } from "zod";
import { calculatePPOScore, type PPOScoreInput } from "@/lib/scoring/people-score";

// ============================================================================
// Validation Schemas
// ============================================================================

const querySchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  type: z.enum(["summary", "list", "ai-mentions"]).optional(),
  roleCategory: z.enum([
    "c_suite", "founder", "board", "key_employee", "ambassador", "advisor", "investor"
  ]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["name", "title", "displayOrder", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

const createPersonSchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  name: z.string().min(1, "name is required"),
  title: z.string().optional(),
  roleCategory: z.enum([
    "c_suite", "founder", "board", "key_employee", "ambassador", "advisor", "investor"
  ]).optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  shortBio: z.string().optional(),
  photoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().optional(),
  linkedinUrl: z.union([z.string().url(), z.literal("")]).optional(),
  twitterUrl: z.union([z.string().url(), z.literal("")]).optional(),
  personalWebsite: z.union([z.string().url(), z.literal("")]).optional(),
  socialProfiles: z.record(z.string(), z.unknown()).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

// ============================================================================
// GET /api/people
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = querySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      brandId,
      type,
      roleCategory,
      isActive,
      sortBy = "displayOrder",
      sortOrder = "asc",
      limit = 50,
      offset = 0,
    } = validation.data;

    // Verify brand belongs to user's organization
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (orgId && brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Handle different query types for dashboard
    if (type === "summary") {
      return await getPeopleSummary(brandId);
    }

    if (type === "list") {
      return await getPeopleList(brandId);
    }

    if (type === "ai-mentions") {
      return await getPeopleAiMentionsHandler(brandId);
    }

    // Default: return paginated list (original behavior)
    const conditions = [eq(brandPeople.brandId, brandId)];

    if (roleCategory) {
      conditions.push(eq(brandPeople.roleCategory, roleCategory));
    }

    if (isActive !== undefined) {
      conditions.push(eq(brandPeople.isActive, isActive === "true"));
    }

    const sortColumn = {
      name: brandPeople.name,
      title: brandPeople.title,
      displayOrder: brandPeople.displayOrder,
      createdAt: brandPeople.createdAt,
    }[sortBy];

    const people = await db
      .select()
      .from(brandPeople)
      .where(and(...conditions))
      .orderBy(sortOrder === "asc" ? asc(sortColumn!) : desc(sortColumn!))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(brandPeople)
      .where(and(...conditions));

    return NextResponse.json({
      data: people,
      meta: {
        total: Number(countResult?.count || 0),
        limit,
        offset,
        hasMore: offset + people.length < Number(countResult?.count || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Dashboard Query Handlers
// ============================================================================

async function getPeopleSummary(brandId: string) {
  // Get all people for the brand
  const people = await db
    .select()
    .from(brandPeople)
    .where(and(eq(brandPeople.brandId, brandId), eq(brandPeople.isActive, true)));

  // Get latest PPO score
  const latestScore = await db
    .select()
    .from(peopleScores)
    .where(eq(peopleScores.brandId, brandId))
    .orderBy(desc(peopleScores.date))
    .limit(1);

  // Calculate aggregates
  const totalPeople = people.length;
  const totalAiMentions = people.reduce((sum, p) => sum + (p.aiMentionCount || 0), 0);
  const totalSocialFollowers = people.reduce((sum, p) => sum + (p.totalSocialFollowers || 0), 0);
  const avgThoughtLeadership =
    totalPeople > 0
      ? people.reduce((sum, p) => sum + (p.thoughtLeadershipScore || 0), 0) / totalPeople
      : 0;

  const executiveCount = people.filter((p) => p.roleCategory === "c_suite").length;
  const founderCount = people.filter((p) => p.roleCategory === "founder").length;

  // Calculate PPO score if no stored score
  let ppoScore = latestScore[0]?.overallScore || 0;
  let breakdown = {
    executiveVisibility: latestScore[0]?.executiveVisibilityScore || 0,
    thoughtLeadership: latestScore[0]?.thoughtLeadershipScore || 0,
    aiMentions: latestScore[0]?.aiMentionScore || 0,
    socialEngagement: latestScore[0]?.socialEngagementScore || 0,
  };

  // If no stored score, calculate it
  if (!latestScore[0] && people.length > 0) {
    const input: PPOScoreInput = {
      totalPeopleTracked: totalPeople,
      executiveCount: executiveCount + founderCount, // Combined executive + founder count
      totalAiMentions,
      totalSocialFollowers,
      avgThoughtLeadershipScore: avgThoughtLeadership,
      personBreakdown: people.map((p) => ({
        personId: p.id,
        personName: p.name,
        title: p.title || undefined,
        overallScore: 0, // Will be calculated by the scoring module
        socialScore: 0, // Will be calculated by the scoring module
        aiVisibilityScore: p.aiVisibilityScore || 0,
        thoughtLeadershipScore: p.thoughtLeadershipScore || 0,
        totalFollowers: (p.linkedinFollowers || 0) + (p.twitterFollowers || 0),
        aiMentionCount: p.aiMentionCount || 0,
      })),
    };
    const result = calculatePPOScore(input);
    ppoScore = result.score;
    breakdown = result.breakdown;
  }

  const ppoTrend: "up" | "down" | "stable" = "stable";

  return NextResponse.json({
    brandId,
    brandName: "",
    summary: {
      ppoScore,
      ppoTrend,
      totalPeople,
      totalAiMentions,
      totalSocialFollowers,
      avgThoughtLeadership,
      executiveCount,
      founderCount,
    },
    breakdown,
    lastUpdated: new Date().toISOString(),
  });
}

async function getPeopleList(brandId: string) {
  const people = await db
    .select()
    .from(brandPeople)
    .where(eq(brandPeople.brandId, brandId))
    .orderBy(desc(brandPeople.isPrimary), desc(brandPeople.aiMentionCount));

  return NextResponse.json({
    people: people.map((p) => ({
      id: p.id,
      name: p.name,
      title: p.title || "",
      roleCategory: p.roleCategory || "key_employee",
      photoUrl: p.photoUrl,
      bio: p.bio,
      shortBio: p.shortBio,
      linkedinUrl: p.linkedinUrl,
      twitterUrl: p.twitterUrl,
      personalWebsite: p.personalWebsite,
      linkedinFollowers: p.linkedinFollowers || 0,
      twitterFollowers: p.twitterFollowers || 0,
      totalSocialFollowers: p.totalSocialFollowers || 0,
      aiMentionCount: p.aiMentionCount || 0,
      aiVisibilityScore: p.aiVisibilityScore || 0,
      thoughtLeadershipScore: p.thoughtLeadershipScore || 0,
      publicationsCount: p.publicationsCount || 0,
      speakingEngagementsCount: p.speakingEngagementsCount || 0,
      isVerified: p.isVerified || false,
      isPrimary: p.isPrimary || false,
      isActive: p.isActive,
    })),
    total: people.length,
  });
}

async function getPeopleAiMentionsHandler(brandId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const mentions = await db
    .select({
      mention: peopleAiMentions,
      person: brandPeople,
    })
    .from(peopleAiMentions)
    .leftJoin(brandPeople, eq(peopleAiMentions.personId, brandPeople.id))
    .where(
      and(
        eq(peopleAiMentions.brandId, brandId),
        gte(peopleAiMentions.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(peopleAiMentions.queryTimestamp))
    .limit(50);

  return NextResponse.json({
    mentions: mentions.map((m) => ({
      id: m.mention.id,
      personId: m.mention.personId,
      personName: m.person?.name || "Unknown",
      platform: m.mention.platform,
      query: m.mention.query || "",
      responseSnippet: m.mention.responseSnippet || "",
      fullResponse: m.mention.fullResponse,
      sentiment: m.mention.sentiment || "neutral",
      sentimentScore: m.mention.sentimentScore,
      mentionedWithBrand: m.mention.mentionedWithBrand || false,
      mentionedWithCompetitor: m.mention.mentionedWithCompetitor || false,
      competitorName: m.mention.competitorName,
      queryTimestamp: m.mention.queryTimestamp?.toISOString() || m.mention.createdAt.toISOString(),
    })),
    total: mentions.length,
  });
}

// ============================================================================
// POST /api/people
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createPersonSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify brand belongs to user's organization
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, data.brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (orgId && brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get next display order if not specified
    let displayOrder = data.displayOrder;
    if (displayOrder === undefined) {
      const [maxOrder] = await db
        .select({ max: sql<number>`COALESCE(MAX(display_order), -1)` })
        .from(brandPeople)
        .where(eq(brandPeople.brandId, data.brandId));
      displayOrder = (maxOrder?.max || 0) + 1;
    }

    // Create person
    const [person] = await db
      .insert(brandPeople)
      .values({
        brandId: data.brandId,
        name: data.name,
        title: data.title || null,
        roleCategory: data.roleCategory || null,
        department: data.department || null,
        bio: data.bio || null,
        shortBio: data.shortBio || null,
        photoUrl: data.photoUrl || null,
        email: data.email || null,
        phone: data.phone || null,
        linkedinUrl: data.linkedinUrl || null,
        twitterUrl: data.twitterUrl || null,
        personalWebsite: data.personalWebsite || null,
        socialProfiles: data.socialProfiles || {},
        isVerified: data.isVerified ?? false,
        isActive: data.isActive ?? true,
        isPrimary: data.isPrimary ?? false,
        displayOrder,
        discoveredFrom: "manual",
      })
      .returning();

    // 🟢 AUTO-ENRICHMENT: Trigger background LinkedIn enrichment if LinkedIn URL provided
    if (person.linkedinUrl) {
      triggerBackgroundEnrichment(person.id, person.linkedinUrl).catch((error) => {
        console.error("[Auto-Enrichment] Failed to trigger enrichment:", error);
        // Don't fail the person creation if enrichment fails
      });
    }

    return NextResponse.json({ data: person }, { status: 201 });
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      { error: "Failed to create person" },
      { status: 500 }
    );
  }
}

/**
 * Trigger background LinkedIn enrichment for a person
 * This is a fire-and-forget operation that won't block the response
 */
async function triggerBackgroundEnrichment(personId: string, linkedinUrl: string) {
  try {
    // Call the enrichment endpoint internally
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/people/${personId}/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "linkedin_public",
        linkedinUrl,
      }),
    });

    if (!response.ok) {
      console.error("[Auto-Enrichment] Enrichment request failed:", response.status);
    } else {
      console.log("[Auto-Enrichment] Successfully triggered enrichment for person:", personId);
    }
  } catch (error) {
    console.error("[Auto-Enrichment] Error triggering enrichment:", error);
    throw error;
  }
}

