import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * People Social Profile API Routes (Phase 7.2)
 *
 * GET /api/people/[id]/social - Get social profile metrics for a person
 * POST /api/people/[id]/social - Trigger social profile enrichment
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brandPeople, type PersonSocialProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  enrichPersonSocialProfiles,
  calculateSocialReachScore,
  calculatePlatformDiversityScore,
  profilesNeedRefresh,
} from "@/lib/people/social-tracker";

// ============================================================================
// GET /api/people/[id]/social
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

    // Calculate scores
    const socialProfiles = person.socialProfiles || {};
    const reachScore = calculateSocialReachScore(person);
    const diversityScore = calculatePlatformDiversityScore(socialProfiles);
    const needsRefresh = profilesNeedRefresh(socialProfiles);

    // Get platform breakdown
    const platforms = [];

    if (person.linkedinUrl || socialProfiles.linkedin?.url) {
      platforms.push({
        platform: "linkedin",
        url: person.linkedinUrl || socialProfiles.linkedin?.url,
        handle: socialProfiles.linkedin?.handle || null,
        followers: socialProfiles.linkedin?.followers || 0,
        lastUpdated: socialProfiles.linkedin?.lastUpdated || null,
        connected: !!socialProfiles.linkedin?.lastUpdated,
      });
    }

    if (person.twitterUrl || socialProfiles.twitter?.url) {
      platforms.push({
        platform: "twitter",
        url: person.twitterUrl || socialProfiles.twitter?.url,
        handle: socialProfiles.twitter?.handle || null,
        followers: socialProfiles.twitter?.followers || 0,
        lastUpdated: socialProfiles.twitter?.lastUpdated || null,
        connected: !!socialProfiles.twitter?.lastUpdated,
      });
    }

    if (socialProfiles.instagram?.url) {
      platforms.push({
        platform: "instagram",
        url: socialProfiles.instagram.url,
        handle: socialProfiles.instagram.handle || null,
        followers: socialProfiles.instagram.followers || 0,
        lastUpdated: socialProfiles.instagram.lastUpdated || null,
        connected: !!socialProfiles.instagram.lastUpdated,
      });
    }

    if (socialProfiles.github?.url) {
      platforms.push({
        platform: "github",
        url: socialProfiles.github.url,
        handle: socialProfiles.github.handle || null,
        followers: socialProfiles.github.followers || 0,
        lastUpdated: socialProfiles.github.lastUpdated || null,
        connected: !!socialProfiles.github.lastUpdated,
      });
    }

    if (socialProfiles.youtube?.url) {
      platforms.push({
        platform: "youtube",
        url: socialProfiles.youtube.url,
        handle: socialProfiles.youtube.handle || null,
        followers: socialProfiles.youtube.subscribers || 0,
        lastUpdated: socialProfiles.youtube.lastUpdated || null,
        connected: !!socialProfiles.youtube.lastUpdated,
      });
    }

    return NextResponse.json({
      data: {
        personId: id,
        personName: person.name,
        totalFollowers: person.totalSocialFollowers || 0,
        reachScore,
        diversityScore,
        needsRefresh,
        platforms,
        lastEnrichedAt: getLatestUpdateTime(socialProfiles),
      },
    });
  } catch (error) {
    console.error("Error fetching social profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch social profile data" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/people/[id]/social - Trigger enrichment
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
    const body = await request.json().catch(() => ({}));
    const { force = false } = body;

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

    // Check if refresh is needed (unless forced)
    const socialProfiles = person.socialProfiles || {};
    if (!force && !profilesNeedRefresh(socialProfiles)) {
      return NextResponse.json({
        data: {
          personId: id,
          status: "skipped",
          message: "Social profiles are up to date. Use force=true to refresh anyway.",
          lastEnrichedAt: getLatestUpdateTime(socialProfiles),
        },
      });
    }

    // Perform enrichment
    const enrichmentResult = await enrichPersonSocialProfiles(person);

    // Update person in database
    const [updatedPerson] = await db
      .update(brandPeople)
      .set({
        socialProfiles: enrichmentResult.updatedProfiles,
        totalSocialFollowers: enrichmentResult.totalFollowers,
        updatedAt: new Date(),
      })
      .where(eq(brandPeople.id, id))
      .returning();

    // Calculate updated scores
    const reachScore = calculateSocialReachScore(updatedPerson);
    const diversityScore = calculatePlatformDiversityScore(enrichmentResult.updatedProfiles);

    return NextResponse.json({
      data: {
        personId: id,
        status: "enriched",
        totalFollowers: enrichmentResult.totalFollowers,
        linkedinFollowers: enrichmentResult.linkedinFollowers || 0,
        twitterFollowers: enrichmentResult.twitterFollowers || 0,
        reachScore,
        diversityScore,
        errors: enrichmentResult.errors.length > 0 ? enrichmentResult.errors : undefined,
        enrichedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error enriching social profiles:", error);
    return NextResponse.json(
      { error: "Failed to enrich social profiles" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getLatestUpdateTime(profiles: PersonSocialProfiles): string | null {
  const timestamps: Date[] = [];

  const addTimestamp = (profile: { lastUpdated?: string } | undefined) => {
    if (profile?.lastUpdated) {
      timestamps.push(new Date(profile.lastUpdated));
    }
  };

  addTimestamp(profiles.linkedin);
  addTimestamp(profiles.twitter);
  addTimestamp(profiles.instagram);
  addTimestamp(profiles.youtube);
  addTimestamp(profiles.tiktok);
  addTimestamp(profiles.github);
  addTimestamp(profiles.medium);
  addTimestamp(profiles.personalWebsite);

  if (timestamps.length === 0) {
    return null;
  }

  const latest = timestamps.reduce((a, b) => (a > b ? a : b));
  return latest.toISOString();
}
