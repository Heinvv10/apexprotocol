/**
 * LinkedIn Enrichment Service
 * Fetches LinkedIn profile data using global OAuth connection
 */

import { getGlobalLinkedInTokens } from "@/app/api/settings/oauth/linkedin/route";

// ============================================================================
// Types
// ============================================================================

export interface LinkedInEnrichmentResult {
  success: boolean;
  data?: LinkedInProfileData;
  error?: string;
  confidence?: number;
}

export interface LinkedInProfileData {
  // Profile basics
  linkedinHeadline?: string;
  linkedinAbout?: string;
  linkedinProfileUrl?: string;
  linkedinPublicId?: string;

  // Current position
  currentPosition?: string;
  currentCompany?: string;
  currentCompanyLinkedinUrl?: string;

  // Career history
  pastPositions?: Array<{
    title: string;
    company: string;
    companyLinkedinUrl?: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }>;
  totalYearsExperience?: number;

  // Education
  education?: Array<{
    school: string;
    schoolLinkedinUrl?: string;
    degree?: string;
    fieldOfStudy?: string;
    startYear?: string;
    endYear?: string;
    description?: string;
  }>;

  // Skills & endorsements
  skills?: string[];
  topSkills?: string[];

  // Certifications
  certifications?: Array<{
    name: string;
    issuingOrganization: string;
    issueDate?: string;
    expirationDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }>;

  // Languages
  languages?: string[];

  // LinkedIn metrics
  linkedinConnectionCount?: number;
  linkedinPostCount?: number;
  linkedinEngagementRate?: number;
  linkedinArticleCount?: number;

  // Publications & appearances
  publications?: Array<{
    title: string;
    publisher: string;
    publicationDate?: string;
    url?: string;
    description?: string;
    coAuthors?: string[];
  }>;

  conferenceAppearances?: Array<{
    name: string;
    eventDate: string;
    topic?: string;
    role?: "speaker" | "panelist" | "moderator" | "keynote";
    url?: string;
    audienceSize?: number;
    location?: string;
  }>;

  podcastAppearances?: Array<{
    podcastName: string;
    episodeTitle?: string;
    episodeDate: string;
    url?: string;
    downloads?: number;
  }>;

  awards?: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;

  volunteerExperience?: Array<{
    role: string;
    organization: string;
    description?: string;
  }>;

  enrichmentSource: "linkedin_public";
  enrichmentConfidence: number;
}

// ============================================================================
// Main Enrichment Function
// ============================================================================

/**
 * Enrich a person's profile using LinkedIn OAuth
 * @param linkedinUrl - The person's LinkedIn profile URL
 * @returns Enrichment result with profile data
 */
export async function enrichFromLinkedIn(
  linkedinUrl: string
): Promise<LinkedInEnrichmentResult> {
  try {
    // Get global LinkedIn OAuth tokens
    const tokens = await getGlobalLinkedInTokens();

    if (!tokens) {
      return {
        success: false,
        error: "LinkedIn OAuth not connected. Please connect LinkedIn in Settings > Integrations.",
      };
    }

    // Extract LinkedIn public ID from URL
    const publicId = extractLinkedInPublicId(linkedinUrl);

    if (!publicId) {
      return {
        success: false,
        error: "Invalid LinkedIn URL format",
      };
    }

    // Fetch profile data from LinkedIn API
    const profileData = await fetchLinkedInProfile(tokens.accessToken, publicId);

    if (!profileData) {
      return {
        success: false,
        error: "Failed to fetch LinkedIn profile data",
      };
    }

    return {
      success: true,
      data: profileData,
      confidence: profileData.enrichmentConfidence,
    };
  } catch (error) {
    console.error("[LinkedIn Enrichment] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if LinkedIn enrichment is available
 */
export async function isLinkedInEnrichmentAvailable(): Promise<boolean> {
  const tokens = await getGlobalLinkedInTokens();
  return !!tokens;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract LinkedIn public ID from profile URL
 * Examples:
 * - https://www.linkedin.com/in/johnsmith/ -> johnsmith
 * - https://linkedin.com/in/jane-doe-123 -> jane-doe-123
 */
function extractLinkedInPublicId(url: string): string | null {
  try {
    const patterns = [
      /linkedin\.com\/in\/([^\/\?]+)/i,
      /linkedin\.com\/pub\/([^\/\?]+)/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/\/$/, ""); // Remove trailing slash
      }
    }

    return null;
  } catch (error) {
    console.error("[LinkedIn Enrichment] Error extracting public ID:", error);
    return null;
  }
}

/**
 * Fetch LinkedIn profile data using LinkedIn API
 */
async function fetchLinkedInProfile(
  accessToken: string,
  publicId: string
): Promise<LinkedInProfileData | null> {
  try {
    // 🟡 PARTIAL: Basic profile fetch implemented
    // 🔴 MISSING: Full LinkedIn API v2 implementation with all fields
    // LinkedIn API v2 requires specific endpoints for different data:
    // - /v2/me - Basic profile
    // - /v2/positions - Work experience
    // - /v2/educations - Education
    // - /v2/skills - Skills
    // etc.

    // For now, we'll fetch the basic profile
    // In production, you'd need to make multiple API calls to get all data

    const profileResponse = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": "202401",
      },
    });

    if (!profileResponse.ok) {
      console.error("[LinkedIn Enrichment] Profile fetch failed:", profileResponse.status);
      return null;
    }

    const profile = await profileResponse.json();

    // 🔴 LIMITATION: LinkedIn API v2 has limited public profile access
    // Most detailed information requires LinkedIn Partnership or Recruiter licenses
    // This implementation provides basic profile data only

    const enrichmentData: LinkedInProfileData = {
      linkedinHeadline: profile.localizedHeadline || undefined,
      linkedinPublicId: publicId,
      linkedinProfileUrl: `https://www.linkedin.com/in/${publicId}`,
      enrichmentSource: "linkedin_public",
      enrichmentConfidence: 0.7, // Medium confidence - basic profile only
    };

    return enrichmentData;
  } catch (error) {
    console.error("[LinkedIn Enrichment] API error:", error);
    return null;
  }
}

/**
 * Calculate years of experience from position history
 */
function calculateYearsOfExperience(
  positions: Array<{ startDate: string; endDate?: string; isCurrent?: boolean }>
): number {
  let totalMonths = 0;

  for (const position of positions) {
    const start = new Date(position.startDate);
    const end = position.endDate ? new Date(position.endDate) : new Date();

    const months = (end.getFullYear() - start.getFullYear()) * 12 +
                   (end.getMonth() - start.getMonth());

    totalMonths += months;
  }

  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
}
