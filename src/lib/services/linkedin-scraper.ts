/**
 * LinkedIn People Extraction Service
 *
 * Extracts company leadership and employees from LinkedIn.
 *
 * IMPLEMENTATION OPTIONS:
 * 1. LinkedIn API (requires LinkedIn Developer account + OAuth)
 * 2. Third-party services (Clearbit, FullContact, ZoomInfo, etc.)
 * 3. Web scraping (legal gray area, rate-limited, requires proxies)
 *
 * For now, this is a STUB implementation that provides the interface.
 * In Phase 3, this will be replaced with actual LinkedIn integration.
 */

import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import { brandPeople } from "@/lib/db/schema/people";
import { eq } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

interface LinkedInPerson {
  fullName: string;
  title: string;
  linkedinUrl: string;
  profileImageUrl?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  connections?: number;
}

interface PeopleExtractionResult {
  success: boolean;
  brandId: string;
  brandName: string;
  peopleExtracted: number;
  errors: string[];
}

// ============================================================================
// LinkedIn Scraping Functions (Stubs)
// ============================================================================

/**
 * Extract company domain from brand
 */
function extractCompanyDomain(brand: typeof brands.$inferSelect): string | null {
  if (brand.domain) {
    return brand.domain;
  }

  // Try to extract from social links
  if (brand.socialLinks && typeof brand.socialLinks === "object") {
    const linkedinUrl = brand.socialLinks.linkedin;
    if (linkedinUrl && typeof linkedinUrl === "string") {
      // Extract company page from LinkedIn URL
      // e.g., https://linkedin.com/company/takealot -> takealot
      const match = linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/);
      if (match) {
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Search LinkedIn for company page
 *
 * Uses RapidAPI LinkedIn Scraper when RAPIDAPI_KEY is set,
 * otherwise falls back to constructing a probable LinkedIn URL.
 */
async function findLinkedInCompanyPage(domain: string): Promise<string | null> {
  console.log(`[LinkedIn] Searching for company: ${domain}`);

  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (rapidApiKey) {
    try {
      // Use RapidAPI LinkedIn Scraper to find company
      const response = await fetch(
        `https://linkedin-data-scraper.p.rapidapi.com/search_companies?query=${encodeURIComponent(domain)}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "linkedin-data-scraper.p.rapidapi.com",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const companyUrl = data.results[0].linkedin_url;
          if (companyUrl) {
            console.log(`  ✅ Found company via RapidAPI: ${companyUrl}`);
            return companyUrl;
          }
        }
      }
    } catch (error) {
      console.error("  RapidAPI LinkedIn search error:", error);
    }
  }

  // Fallback: Construct probable LinkedIn company URL from domain
  // Extract company name from domain (e.g., "takealot.com" -> "takealot")
  const companyName = domain.replace(/\.(com|co\.za|co|org|net|io|ai).*$/, "").toLowerCase();

  if (companyName) {
    const probableUrl = `https://www.linkedin.com/company/${companyName}`;
    console.log(`  📌 Using constructed URL: ${probableUrl}`);
    return probableUrl;
  }

  return null;
}

/**
 * Scrape employees from LinkedIn company page
 *
 * Uses RapidAPI LinkedIn Scraper when RAPIDAPI_KEY is set,
 * otherwise returns empty array (API required for employee data).
 */
async function scrapeLinkedInCompanyEmployees(
  companyPageUrl: string,
  limit: number = 50
): Promise<LinkedInPerson[]> {
  console.log(`[LinkedIn] Scraping employees from: ${companyPageUrl}`);
  console.log(`  Limit: ${limit} people`);

  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    console.log("  ⚠️ RAPIDAPI_KEY not set - cannot scrape LinkedIn employees");
    return [];
  }

  try {
    // Extract company identifier from URL
    const companyMatch = companyPageUrl.match(/linkedin\.com\/company\/([^\/\?]+)/);
    if (!companyMatch) {
      console.log("  ⚠️ Could not extract company ID from URL");
      return [];
    }

    const companyId = companyMatch[1];

    // Use RapidAPI LinkedIn Scraper to get employees
    const response = await fetch(
      `https://linkedin-data-scraper.p.rapidapi.com/company_employees?company_url=${encodeURIComponent(companyPageUrl)}&count=${limit}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "linkedin-data-scraper.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  RapidAPI error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();

    if (!data.employees || !Array.isArray(data.employees)) {
      console.log("  ⚠️ No employees found in API response");
      return [];
    }

    // Map API response to our LinkedInPerson type
    const employees: LinkedInPerson[] = data.employees.map((emp: {
      full_name?: string;
      name?: string;
      title?: string;
      headline?: string;
      linkedin_url?: string;
      profile_url?: string;
      profile_image_url?: string;
      photo_url?: string;
      summary?: string;
      location?: string;
      skills?: string[];
      connection_count?: number;
    }) => ({
      fullName: emp.full_name || emp.name || "Unknown",
      title: emp.title || emp.headline || "Unknown Position",
      linkedinUrl: emp.linkedin_url || emp.profile_url || "",
      profileImageUrl: emp.profile_image_url || emp.photo_url,
      bio: emp.summary,
      location: emp.location,
      skills: emp.skills,
      connections: emp.connection_count,
    }));

    console.log(`  ✅ Found ${employees.length} employee(s) via RapidAPI`);
    return employees.slice(0, limit);
  } catch (error) {
    console.error("  RapidAPI LinkedIn scraping error:", error);
    return [];
  }
}

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extract LinkedIn people for a brand
 *
 * This function:
 * 1. Finds the company's LinkedIn page
 * 2. Scrapes employee profiles
 * 3. Saves people to the database
 *
 * NOTE: This is a STUB. In production, implement one of:
 * - LinkedIn API integration
 * - Third-party service (Clearbit, FullContact)
 * - Web scraping service
 */
export async function extractLinkedInPeople(
  brandId: string
): Promise<PeopleExtractionResult> {
  const result: PeopleExtractionResult = {
    success: false,
    brandId,
    brandName: "",
    peopleExtracted: 0,
    errors: [],
  };

  try {
    // Fetch brand
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      result.errors.push(`Brand ${brandId} not found`);
      return result;
    }

    result.brandName = brand.name;

    console.log(`[LinkedIn] Starting people extraction for ${brand.name}`);

    // Extract company domain
    const domain = extractCompanyDomain(brand);
    if (!domain) {
      result.errors.push("Could not extract company domain from brand");
      console.log("  ⚠️ No domain found");
      return result;
    }

    console.log(`  Domain: ${domain}`);

    // Find LinkedIn company page
    const companyPageUrl = await findLinkedInCompanyPage(domain);
    if (!companyPageUrl) {
      result.errors.push("Could not find LinkedIn company page");
      console.log("  ⚠️ No LinkedIn company page found");
      return result;
    }

    console.log(`  Company page: ${companyPageUrl}`);

    // Scrape employees
    const employees = await scrapeLinkedInCompanyEmployees(companyPageUrl, 50);

    console.log(`  Found ${employees.length} employee(s)`);

    // Save to database
    for (const employee of employees) {
      try {
        // Check if person already exists
        const existing = await db.query.brandPeople.findFirst({
          where: eq(brandPeople.linkedinUrl, employee.linkedinUrl),
        });

        if (existing) {
          console.log(`  Skipping ${employee.fullName} (already exists)`);
          continue;
        }

        // Insert person
        await db.insert(brandPeople).values({
          brandId,
          name: employee.fullName,
          title: employee.title,
          linkedinUrl: employee.linkedinUrl,
          photoUrl: employee.profileImageUrl || null,
          bio: employee.bio || null,
        });

        result.peopleExtracted++;
        console.log(`  ✅ Added ${employee.fullName}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to save ${employee.fullName}: ${errorMessage}`);
        console.error(`  ❌ Error saving ${employee.fullName}:`, error);
      }
    }

    result.success = true;
    console.log(`[LinkedIn] Extraction completed for ${brand.name}`);
    console.log(`  People extracted: ${result.peopleExtracted}`);
    console.log(`  Errors: ${result.errors.length}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Unexpected error: ${errorMessage}`);
    console.error("Error in extractLinkedInPeople:", error);
  }

  return result;
}

/**
 * Enrich person profile with additional data from LinkedIn
 *
 * Uses RapidAPI LinkedIn Scraper when RAPIDAPI_KEY is set.
 */
export async function enrichPersonProfile(personId: string): Promise<{
  success: boolean;
  updatedFields: string[];
  error?: string;
}> {
  console.log(`[LinkedIn] Enriching person profile: ${personId}`);

  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    return {
      success: false,
      updatedFields: [],
      error: "RAPIDAPI_KEY not configured",
    };
  }

  try {
    // Fetch person from database
    const person = await db.query.brandPeople.findFirst({
      where: eq(brandPeople.id, personId),
    });

    if (!person) {
      return {
        success: false,
        updatedFields: [],
        error: "Person not found",
      };
    }

    if (!person.linkedinUrl) {
      return {
        success: false,
        updatedFields: [],
        error: "No LinkedIn URL for this person",
      };
    }

    // Call RapidAPI to get profile details
    const response = await fetch(
      `https://linkedin-data-scraper.p.rapidapi.com/profile?linkedin_url=${encodeURIComponent(person.linkedinUrl)}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "linkedin-data-scraper.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        updatedFields: [],
        error: `RapidAPI error: ${response.status}`,
      };
    }

    const profileData = await response.json();
    const updatedFields: string[] = [];

    // Build update object with enriched data
    const updates: Partial<typeof brandPeople.$inferInsert> = {};

    if (profileData.full_name && !person.name) {
      updates.name = profileData.full_name;
      updatedFields.push("name");
    }

    if (profileData.headline && !person.title) {
      updates.title = profileData.headline;
      updatedFields.push("title");
    }

    if (profileData.profile_image && !person.photoUrl) {
      updates.photoUrl = profileData.profile_image;
      updatedFields.push("photoUrl");
    }

    if (profileData.summary && !person.bio) {
      updates.bio = profileData.summary;
      updatedFields.push("bio");
    }

    // Update social profiles if available (uses socialProfiles JSONB field)
    if (profileData.twitter || profileData.email) {
      const existingSocial = (person.socialProfiles as Record<string, unknown>) || {};
      let hasUpdates = false;

      // Twitter profile
      if (profileData.twitter && !existingSocial.twitter) {
        existingSocial.twitter = {
          url: profileData.twitter,
          handle: profileData.twitter.replace(/.*twitter\.com\//, "").replace(/\?.*/, ""),
          lastUpdated: new Date().toISOString(),
        };
        updatedFields.push("socialProfiles.twitter");
        hasUpdates = true;
      }

      // Email (store in personalWebsite or as contact - schema doesn't have email field in socialProfiles)
      // Note: Email and phone are better stored in the dedicated email/phone columns
      if (profileData.email && !person.email) {
        updates.email = profileData.email;
        updatedFields.push("email");
      }

      if (hasUpdates) {
        updates.socialProfiles = existingSocial;
      }
    }

    // Only update if we have new data
    if (Object.keys(updates).length > 0) {
      await db
        .update(brandPeople)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(brandPeople.id, personId));

      console.log(`  ✅ Updated ${updatedFields.length} field(s) for ${person.name}`);
    } else {
      console.log(`  📌 No new data to update for ${person.name}`);
    }

    return {
      success: true,
      updatedFields,
    };
  } catch (error) {
    console.error("  Error enriching profile:", error);
    return {
      success: false,
      updatedFields: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
