import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Opportunity Matching API Routes (Phase 9.3)
 *
 * POST /api/opportunities/match - Match opportunities to a person
 * GET /api/opportunities/match?personId=X - Get matches for a person
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  speakingOpportunities,
  opportunityMatches,
  brandPeople,
  peopleEnrichment,
} from "@/lib/db/schema";
import { eq, and, gte, isNull, or, inArray } from "drizzle-orm";
import { z } from "zod";

// ============================================================================
// Validation Schemas
// ============================================================================

const matchRequestSchema = z.object({
  personId: z.string().min(1, "personId is required"),
  opportunityId: z.string().optional(),
  autoMatch: z.boolean().optional(), // Auto-match to all open opportunities
});

const updateMatchSchema = z.object({
  status: z.enum(["open", "applied", "accepted", "declined", "expired"]).optional(),
  userNotes: z.string().optional().nullable(),
  appliedAt: z.string().datetime().optional().nullable(),
  responseReceivedAt: z.string().datetime().optional().nullable(),
});

// ============================================================================
// Matching Algorithm
// ============================================================================

interface MatchResult {
  opportunityId: string;
  matchScore: number;
  matchReasons: string[];
  matchedTopics: string[];
  matchedSkills: string[];
}

function calculateMatch(
  opportunity: typeof speakingOpportunities.$inferSelect,
  person: typeof brandPeople.$inferSelect,
  enrichment: typeof peopleEnrichment.$inferSelect | null
): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const matchedTopics: string[] = [];
  const matchedSkills: string[] = [];

  const oppTopics = opportunity.topics || [];
  const personSkills = enrichment?.skills || [];
  const personTopSkills = enrichment?.topSkills || [];
  const personTitle = person.title?.toLowerCase() || "";
  const personBio = person.bio?.toLowerCase() || "";

  // Topic matching (0-40 points)
  for (const topic of oppTopics) {
    const topicLower = topic.toLowerCase();

    // Check skills
    for (const skill of [...personSkills, ...personTopSkills]) {
      if (skill.toLowerCase().includes(topicLower) || topicLower.includes(skill.toLowerCase())) {
        matchedTopics.push(topic);
        matchedSkills.push(skill);
        score += 10;
        break;
      }
    }

    // Check title/bio
    if (personTitle.includes(topicLower) || personBio.includes(topicLower)) {
      if (!matchedTopics.includes(topic)) {
        matchedTopics.push(topic);
        score += 5;
      }
    }
  }

  // Cap topic score at 40
  score = Math.min(score, 40);
  if (matchedTopics.length > 0) {
    reasons.push(`Expertise matches ${matchedTopics.length} topic(s)`);
  }

  // Speaking experience (0-25 points)
  const conferenceCount = enrichment?.conferenceAppearances?.length || 0;
  const podcastCount = enrichment?.podcastAppearances?.length || 0;
  const speakingExperience = conferenceCount + podcastCount;

  if (speakingExperience > 0) {
    const expScore = Math.min(25, speakingExperience * 5);
    score += expScore;
    reasons.push(`${speakingExperience} prior speaking engagement(s)`);
  }

  // Role category bonus (0-15 points)
  if (person.roleCategory === "c_suite" || person.roleCategory === "founder") {
    score += 15;
    reasons.push("Executive-level speaker");
  } else if (person.roleCategory === "board" || person.roleCategory === "advisor") {
    score += 10;
    reasons.push("Board/Advisor level speaker");
  }

  // Thought leadership score (0-10 points)
  if (person.thoughtLeadershipScore && person.thoughtLeadershipScore >= 70) {
    score += 10;
    reasons.push("High thought leadership score");
  } else if (person.thoughtLeadershipScore && person.thoughtLeadershipScore >= 40) {
    score += 5;
    reasons.push("Moderate thought leadership score");
  }

  // AI visibility bonus (0-10 points)
  if (person.aiMentionCount && person.aiMentionCount >= 10) {
    score += 10;
    reasons.push("Strong AI visibility");
  } else if (person.aiMentionCount && person.aiMentionCount >= 3) {
    score += 5;
    reasons.push("Moderate AI visibility");
  }

  // Publications bonus (0-10 points for relevant publications)
  const publications = enrichment?.publications || [];
  if (publications.length > 0) {
    score += Math.min(10, publications.length * 2);
    reasons.push(`${publications.length} publication(s)`);
  }

  return {
    opportunityId: opportunity.id,
    matchScore: Math.min(100, score),
    matchReasons: reasons,
    matchedTopics: [...new Set(matchedTopics)],
    matchedSkills: [...new Set(matchedSkills)],
  };
}

// ============================================================================
// GET /api/opportunities/match
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId");

    if (!personId) {
      return NextResponse.json(
        { error: "personId is required" },
        { status: 400 }
      );
    }

    // Verify person exists and user has access
    const person = await db.query.brandPeople.findFirst({
      where: eq(brandPeople.id, personId),
      with: {
        brand: true,
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    if (orgId && person.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get matches for this person
    const matches = await db.query.opportunityMatches.findMany({
      where: eq(opportunityMatches.personId, personId),
      with: {
        opportunity: true,
      },
      orderBy: (matches, { desc }) => [desc(matches.matchScore)],
    });

    return NextResponse.json({
      data: matches,
      total: matches.length,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/opportunities/match
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validation = matchRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { personId, opportunityId, autoMatch } = validation.data;

    // Verify person exists and user has access
    const person = await db.query.brandPeople.findFirst({
      where: eq(brandPeople.id, personId),
      with: {
        brand: true,
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    if (orgId && person.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get enrichment data
    const enrichment = await db.query.peopleEnrichment.findFirst({
      where: eq(peopleEnrichment.personId, personId),
    });

    const results: MatchResult[] = [];

    if (autoMatch) {
      // Match to all open opportunities
      const openOpportunities = await db
        .select()
        .from(speakingOpportunities)
        .where(
          and(
            eq(speakingOpportunities.isActive, true),
            or(
              gte(speakingOpportunities.cfpDeadline, new Date()),
              isNull(speakingOpportunities.cfpDeadline)
            )
          )
        );

      // Get existing matches
      const existingMatches = await db
        .select({ opportunityId: opportunityMatches.opportunityId })
        .from(opportunityMatches)
        .where(eq(opportunityMatches.personId, personId));

      const existingOpportunityIds = new Set(
        existingMatches.map((m) => m.opportunityId)
      );

      // Calculate and store matches
      for (const opp of openOpportunities) {
        if (existingOpportunityIds.has(opp.id)) continue;

        const matchResult = calculateMatch(opp, person, enrichment ?? null);

        // Only store if match score is above threshold
        if (matchResult.matchScore >= 20) {
          await db.insert(opportunityMatches).values({
            personId,
            opportunityId: opp.id,
            matchScore: matchResult.matchScore,
            matchReasons: matchResult.matchReasons,
            matchedTopics: matchResult.matchedTopics,
            matchedSkills: matchResult.matchedSkills,
            status: "open",
          });

          results.push(matchResult);
        }
      }
    } else if (opportunityId) {
      // Match to specific opportunity
      const opportunity = await db.query.speakingOpportunities.findFirst({
        where: eq(speakingOpportunities.id, opportunityId),
      });

      if (!opportunity) {
        return NextResponse.json(
          { error: "Opportunity not found" },
          { status: 404 }
        );
      }

      // Check if match already exists
      const existingMatch = await db.query.opportunityMatches.findFirst({
        where: and(
          eq(opportunityMatches.personId, personId),
          eq(opportunityMatches.opportunityId, opportunityId)
        ),
      });

      if (existingMatch) {
        return NextResponse.json(
          { error: "Match already exists", existingMatch },
          { status: 409 }
        );
      }

      const matchResult = calculateMatch(opportunity, person, enrichment ?? null);

      await db.insert(opportunityMatches).values({
        personId,
        opportunityId,
        matchScore: matchResult.matchScore,
        matchReasons: matchResult.matchReasons,
        matchedTopics: matchResult.matchedTopics,
        matchedSkills: matchResult.matchedSkills,
        status: "open",
      });

      results.push(matchResult);
    } else {
      return NextResponse.json(
        { error: "Either opportunityId or autoMatch=true is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: results,
      matched: results.length,
      message: `Created ${results.length} match(es)`,
    });
  } catch (error) {
    console.error("Error creating matches:", error);
    return NextResponse.json(
      { error: "Failed to create matches" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/opportunities/match - Update match status
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId query parameter is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validation = updateMatchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    // Get match with person
    const match = await db.query.opportunityMatches.findFirst({
      where: eq(opportunityMatches.id, matchId),
      with: {
        person: {
          with: {
            brand: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (orgId && match.person.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = validation.data;
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.userNotes !== undefined) {
      updateData.userNotes = data.userNotes;
    }
    if (data.appliedAt !== undefined) {
      updateData.appliedAt = data.appliedAt ? new Date(data.appliedAt) : null;
    }
    if (data.responseReceivedAt !== undefined) {
      updateData.responseReceivedAt = data.responseReceivedAt
        ? new Date(data.responseReceivedAt)
        : null;
    }

    const [updatedMatch] = await db
      .update(opportunityMatches)
      .set(updateData)
      .where(eq(opportunityMatches.id, matchId))
      .returning();

    return NextResponse.json({ data: updatedMatch });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/opportunities/match - Delete a match
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId query parameter is required" },
        { status: 400 }
      );
    }

    // Get match with person
    const match = await db.query.opportunityMatches.findFirst({
      where: eq(opportunityMatches.id, matchId),
      with: {
        person: {
          with: {
            brand: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (orgId && match.person.brand.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await db.delete(opportunityMatches).where(eq(opportunityMatches.id, matchId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Failed to delete match" },
      { status: 500 }
    );
  }
}
