/**
 * Team Member Suggestions Engine
 * Phase 5.1: LinkedIn integration for team member suggestions
 *
 * Analyzes team completeness and suggests missing roles,
 * high-influence individuals, and LinkedIn-discovered candidates.
 */

import { db } from "@/lib/db";
import { brandPeople, brands } from "@/lib/db/schema";
import { eq, and, isNull, isNotNull, sql, desc } from "drizzle-orm";
import type { BrandPerson } from "@/lib/db/schema/people";

// ============================================================================
// Types
// ============================================================================

export interface TeamSuggestion {
  type: "missing_role" | "incomplete_profile" | "linkedin_candidate" | "high_influence";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionLabel: string;
  actionType: "add_role" | "enrich_profile" | "import_linkedin" | "discover";
  metadata?: {
    roleCategory?: string;
    personId?: string;
    linkedinUrl?: string;
    missingFields?: string[];
    influenceScore?: number;
  };
}

export interface TeamCompletenessReport {
  score: number; // 0-100
  totalRoles: number;
  filledRoles: number;
  missingRoles: string[];
  incompleteProfiles: number;
  suggestedActions: TeamSuggestion[];
}

export interface LinkedInCandidate {
  name: string;
  title: string;
  linkedinUrl: string;
  confidence: number;
  source: string;
  matchedRole?: string;
}

// ============================================================================
// Constants
// ============================================================================

// Expected leadership roles by company type/size
const EXPECTED_ROLES = {
  c_suite: [
    { role: "CEO", title: "Chief Executive Officer", priority: "high" as const },
    { role: "CTO", title: "Chief Technology Officer", priority: "high" as const },
    { role: "CFO", title: "Chief Financial Officer", priority: "medium" as const },
    { role: "CMO", title: "Chief Marketing Officer", priority: "medium" as const },
    { role: "COO", title: "Chief Operating Officer", priority: "medium" as const },
    { role: "CPO", title: "Chief Product Officer", priority: "low" as const },
    { role: "CHRO", title: "Chief Human Resources Officer", priority: "low" as const },
    { role: "CRO", title: "Chief Revenue Officer", priority: "low" as const },
  ],
  founder: [
    { role: "Founder", title: "Founder", priority: "high" as const },
    { role: "Co-Founder", title: "Co-Founder", priority: "high" as const },
  ],
  board: [
    { role: "Chairman", title: "Board Chairman", priority: "medium" as const },
    { role: "Board Member", title: "Board Member", priority: "low" as const },
  ],
};

// Profile completeness weights
const PROFILE_FIELDS = {
  linkedinUrl: { weight: 25, label: "LinkedIn Profile" },
  bio: { weight: 15, label: "Biography" },
  photoUrl: { weight: 10, label: "Profile Photo" },
  title: { weight: 15, label: "Job Title" },
  roleCategory: { weight: 10, label: "Role Category" },
  twitterUrl: { weight: 10, label: "Twitter/X Profile" },
  linkedinFollowers: { weight: 15, label: "LinkedIn Followers" },
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate team member suggestions for a brand
 */
export async function generateTeamSuggestions(
  brandId: string,
  options?: {
    includeMissingRoles?: boolean;
    includeIncompleteProfiles?: boolean;
    includeLinkedInCandidates?: boolean;
    maxSuggestions?: number;
  }
): Promise<TeamSuggestion[]> {
  const {
    includeMissingRoles = true,
    includeIncompleteProfiles = true,
    includeLinkedInCandidates = true,
    maxSuggestions = 10,
  } = options || {};

  const suggestions: TeamSuggestion[] = [];

  // Get existing team members
  const existingPeople = await db.query.brandPeople.findMany({
    where: and(eq(brandPeople.brandId, brandId), eq(brandPeople.isActive, true)),
  });

  // 1. Missing roles suggestions
  if (includeMissingRoles) {
    const missingRoleSuggestions = getMissingRoleSuggestions(existingPeople);
    suggestions.push(...missingRoleSuggestions);
  }

  // 2. Incomplete profile suggestions
  if (includeIncompleteProfiles) {
    const incompleteProfileSuggestions = getIncompleteProfileSuggestions(existingPeople);
    suggestions.push(...incompleteProfileSuggestions);
  }

  // 3. LinkedIn discovery suggestions (if brand has website)
  if (includeLinkedInCandidates) {
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (brand?.domain) {
      const linkedinSuggestions = await getLinkedInDiscoverySuggestions(brandId, brand.domain, existingPeople);
      suggestions.push(...linkedinSuggestions);
    }
  }

  // Sort by priority and limit
  return sortAndLimitSuggestions(suggestions, maxSuggestions);
}

/**
 * Analyze team completeness
 */
export async function analyzeTeamCompleteness(brandId: string): Promise<TeamCompletenessReport> {
  const existingPeople = await db.query.brandPeople.findMany({
    where: and(eq(brandPeople.brandId, brandId), eq(brandPeople.isActive, true)),
  });

  // Calculate role coverage
  const filledRoles = new Set<string>();
  const existingTitles = existingPeople.map((p) => p.title?.toLowerCase() || "");

  // Check for expected roles
  const allExpectedRoles = [
    ...EXPECTED_ROLES.c_suite,
    ...EXPECTED_ROLES.founder,
    ...EXPECTED_ROLES.board,
  ];

  const missingRoles: string[] = [];
  allExpectedRoles.forEach((expected) => {
    const hasRole = existingTitles.some((title) =>
      title.includes(expected.role.toLowerCase()) ||
      title.includes(expected.title.toLowerCase())
    );
    if (hasRole) {
      filledRoles.add(expected.role);
    } else if (expected.priority === "high") {
      missingRoles.push(expected.title);
    }
  });

  // Count incomplete profiles
  const incompleteProfiles = existingPeople.filter((person) => {
    const completeness = calculateProfileCompleteness(person);
    return completeness < 70;
  }).length;

  // Calculate score
  const roleCoverage = (filledRoles.size / Math.min(allExpectedRoles.length, 6)) * 50;
  const profileCompleteness = existingPeople.length > 0
    ? ((existingPeople.length - incompleteProfiles) / existingPeople.length) * 30
    : 0;
  const teamSize = Math.min(existingPeople.length * 5, 20); // Up to 20 points for 4+ members

  const score = Math.round(roleCoverage + profileCompleteness + teamSize);

  // Generate suggestions
  const suggestions = await generateTeamSuggestions(brandId, {
    includeMissingRoles: true,
    includeIncompleteProfiles: true,
    includeLinkedInCandidates: true,
    maxSuggestions: 5,
  });

  return {
    score: Math.min(score, 100),
    totalRoles: allExpectedRoles.filter((r) => r.priority !== "low").length,
    filledRoles: filledRoles.size,
    missingRoles,
    incompleteProfiles,
    suggestedActions: suggestions,
  };
}

/**
 * Calculate profile completeness for a person
 */
export function calculateProfileCompleteness(person: BrandPerson): number {
  let score = 0;
  let maxScore = 0;

  for (const [field, config] of Object.entries(PROFILE_FIELDS)) {
    maxScore += config.weight;
    const value = person[field as keyof BrandPerson];
    if (value !== null && value !== undefined && value !== "") {
      score += config.weight;
    }
  }

  return Math.round((score / maxScore) * 100);
}

/**
 * Get missing fields for a person
 */
export function getMissingProfileFields(person: BrandPerson): string[] {
  const missing: string[] = [];

  for (const [field, config] of Object.entries(PROFILE_FIELDS)) {
    const value = person[field as keyof BrandPerson];
    if (value === null || value === undefined || value === "") {
      missing.push(config.label);
    }
  }

  return missing;
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

function getMissingRoleSuggestions(existingPeople: BrandPerson[]): TeamSuggestion[] {
  const suggestions: TeamSuggestion[] = [];
  const existingTitles = existingPeople.map((p) => p.title?.toLowerCase() || "");

  // Check high-priority C-suite roles
  for (const expected of EXPECTED_ROLES.c_suite) {
    if (expected.priority !== "high") continue;

    const hasRole = existingTitles.some((title) =>
      title.includes(expected.role.toLowerCase()) ||
      title.includes(expected.title.toLowerCase())
    );

    if (!hasRole) {
      suggestions.push({
        type: "missing_role",
        priority: expected.priority,
        title: `Add ${expected.title}`,
        description: `Your team is missing a ${expected.title}. Adding this role will improve your executive visibility and PPO score.`,
        actionLabel: "Add Role",
        actionType: "add_role",
        metadata: {
          roleCategory: "c_suite",
        },
      });
    }
  }

  // Check founder roles
  const hasFounder = existingPeople.some((p) =>
    p.roleCategory === "founder" ||
    p.title?.toLowerCase().includes("founder")
  );

  if (!hasFounder) {
    suggestions.push({
      type: "missing_role",
      priority: "high",
      title: "Add Founder/Co-Founder",
      description: "Founder profiles significantly boost brand authority and AI visibility. Add your founders to improve recognition.",
      actionLabel: "Add Founder",
      actionType: "add_role",
      metadata: {
        roleCategory: "founder",
      },
    });
  }

  return suggestions;
}

function getIncompleteProfileSuggestions(existingPeople: BrandPerson[]): TeamSuggestion[] {
  const suggestions: TeamSuggestion[] = [];

  // Find profiles with missing LinkedIn
  const missingLinkedIn = existingPeople.filter((p) => !p.linkedinUrl);
  if (missingLinkedIn.length > 0) {
    const person = missingLinkedIn[0]; // Prioritize first one
    suggestions.push({
      type: "incomplete_profile",
      priority: missingLinkedIn.length > 2 ? "high" : "medium",
      title: `Add LinkedIn for ${person.name}`,
      description: `${missingLinkedIn.length} team member${missingLinkedIn.length > 1 ? "s" : ""} missing LinkedIn profiles. LinkedIn is critical for AI visibility and executive presence.`,
      actionLabel: "Add LinkedIn",
      actionType: "enrich_profile",
      metadata: {
        personId: person.id,
        missingFields: ["LinkedIn Profile"],
      },
    });
  }

  // Find profiles with missing photos
  const missingPhotos = existingPeople.filter((p) => !p.photoUrl);
  if (missingPhotos.length > 0) {
    const person = missingPhotos[0];
    suggestions.push({
      type: "incomplete_profile",
      priority: "low",
      title: `Add photo for ${person.name}`,
      description: `${missingPhotos.length} team member${missingPhotos.length > 1 ? "s" : ""} missing profile photos. Photos improve trust and recognition.`,
      actionLabel: "Add Photo",
      actionType: "enrich_profile",
      metadata: {
        personId: person.id,
        missingFields: ["Profile Photo"],
      },
    });
  }

  // Find profiles with low completeness
  const lowCompleteness = existingPeople.filter((p) => {
    const completeness = calculateProfileCompleteness(p);
    return completeness < 50;
  });

  if (lowCompleteness.length > 0) {
    const person = lowCompleteness[0];
    const missingFields = getMissingProfileFields(person);
    suggestions.push({
      type: "incomplete_profile",
      priority: lowCompleteness.length > 1 ? "medium" : "low",
      title: `Complete profile for ${person.name}`,
      description: `Profile is only ${calculateProfileCompleteness(person)}% complete. Missing: ${missingFields.slice(0, 3).join(", ")}${missingFields.length > 3 ? ` and ${missingFields.length - 3} more` : ""}.`,
      actionLabel: "Complete Profile",
      actionType: "enrich_profile",
      metadata: {
        personId: person.id,
        missingFields,
      },
    });
  }

  return suggestions;
}

async function getLinkedInDiscoverySuggestions(
  brandId: string,
  domain: string,
  existingPeople: BrandPerson[]
): Promise<TeamSuggestion[]> {
  const suggestions: TeamSuggestion[] = [];

  // Check if team discovery has been run
  const discoveredCount = existingPeople.filter((p) =>
    p.discoveredFrom === "website_scrape" || p.discoveredFrom === "linkedin"
  ).length;

  // Extract hostname from domain (handle both "example.com" and "https://example.com")
  const hostname = domain.includes("://")
    ? new URL(domain).hostname
    : domain.replace(/^www\./, "");

  if (discoveredCount === 0 && existingPeople.length < 3) {
    suggestions.push({
      type: "linkedin_candidate",
      priority: "high",
      title: "Discover team from website",
      description: `Automatically discover key team members from ${hostname}. Our AI will extract names, titles, and social profiles.`,
      actionLabel: "Discover Team",
      actionType: "discover",
    });
  }

  // Check if enrichment is needed
  const notEnriched = existingPeople.filter((p) =>
    !p.lastEnrichedAt && p.linkedinUrl
  );

  if (notEnriched.length > 0) {
    suggestions.push({
      type: "linkedin_candidate",
      priority: "medium",
      title: "Enrich profiles with LinkedIn data",
      description: `${notEnriched.length} profile${notEnriched.length > 1 ? "s have" : " has"} LinkedIn URLs but haven't been enriched. Enrichment adds followers, career history, and influence data.`,
      actionLabel: "Enrich Profiles",
      actionType: "import_linkedin",
    });
  }

  return suggestions;
}

function sortAndLimitSuggestions(
  suggestions: TeamSuggestion[],
  maxSuggestions: number
): TeamSuggestion[] {
  const priorityOrder: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return suggestions
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, maxSuggestions);
}

// ============================================================================
// Export for API use
// ============================================================================

export type { BrandPerson };
