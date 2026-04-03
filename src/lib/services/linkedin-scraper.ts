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
 * Priority order:
 * 1. Check if brand already has LinkedIn URL in socialLinks (from website scraping)
 * 2. Construct probable URL from domain
 */
async function findLinkedInCompanyPage(
  brand: typeof brands.$inferSelect
): Promise<string | null> {
  console.log(`[LinkedIn] Finding company page for: ${brand.name}`);

  // 1. First check if brand already has LinkedIn URL from website scraping
  if (brand.socialLinks && typeof brand.socialLinks === "object") {
    const linkedinUrl = (brand.socialLinks as Record<string, unknown>).linkedin;
    if (linkedinUrl && typeof linkedinUrl === "string") {
      console.log(`  ✅ Found LinkedIn URL from brand data: ${linkedinUrl}`);
      // Ensure it points to /people page for employee extraction
      if (!linkedinUrl.includes("/people")) {
        const baseUrl = linkedinUrl.replace(/\/$/, "");
        return `${baseUrl}/people`;
      }
      return linkedinUrl;
    }
  }

  // 2. Construct probable LinkedIn company URL from domain
  if (!brand.domain) {
    console.log("  ⚠️ No domain found for brand");
    return null;
  }

  // Extract company name from domain (e.g., "takealot.com" -> "takealot")
  const companyName = brand.domain.replace(/\.(com|co\.za|co|org|net|io|ai).*$/, "").toLowerCase();

  if (companyName) {
    const probableUrl = `https://www.linkedin.com/company/${companyName}/people`;
    console.log(`  📌 Using constructed URL: ${probableUrl}`);
    return probableUrl;
  }

  console.log("  ⚠️ Could not construct LinkedIn URL from domain");
  return null;
}

/**
 * Scrape employees from LinkedIn company page using Playwright
 *
 * Scrapes only publicly visible data (no login required).
 * Extracts visible people cards: name, title, LinkedIn profile URL
 */
async function scrapeLinkedInCompanyEmployees(
  companyPageUrl: string,
  limit: number = 50
): Promise<LinkedInPerson[]> {
  console.log(`[LinkedIn] Scraping employees from: ${companyPageUrl}`);
  console.log(`  Limit: ${limit} people`);

  let browser: any = null;

  try {
    const { chromium } = await import("playwright");

    // Launch headless browser with realistic settings
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
    });

    const page = await context.newPage();

    try {
      // Navigate to company people page with longer timeout
      console.log(`  Navigating to ${companyPageUrl}...`);
      const response = await page.goto(companyPageUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      if (!response || !response.ok()) {
        console.log(`  ⚠️ Page returned status: ${response?.status() || 'unknown'}`);
        await browser.close();
        return [];
      }

      // Random delay to appear human (1-3s)
      const delay = 1000 + Math.random() * 2000;
      console.log(`  Waiting ${Math.round(delay)}ms before extraction...`);
      await page.waitForTimeout(delay);

      // Check if we hit a login wall or CAPTCHA
      const bodyText = await page.textContent('body').catch(() => '');
      if (bodyText.toLowerCase().includes('sign in') && bodyText.toLowerCase().includes('join now')) {
        console.log(`  ⚠️ Hit LinkedIn login wall - cannot access public people data`);
        await browser.close();
        return [];
      }

      // Extract people cards from the page
      console.log(`  Extracting employee data...`);
      const employees = await page.evaluate(() => {
        const people: Array<{
          fullName: string;
          title: string;
          linkedinUrl: string;
          profileImageUrl?: string;
        }> = [];

        // Find all person card elements
        // LinkedIn uses various selectors for people cards
        const cardSelectors = [
          '.org-people-profile-card',
          '.org-people__profile-card',
          '[data-control-name="people_profile_card"]',
          '.artdeco-entity-lockup',
          '.scaffold-finite-scroll__content > li',
          '.org-people-profiles-module__profile-item',
          '.org-people__profile-card-spacing',
        ];

        let cards: Element[] = [];
        for (const selector of cardSelectors) {
          const found = Array.from(document.querySelectorAll(selector));
          if (found.length > 0) {
            cards = found;
            break;
          }
        }

        if (cards.length === 0) {
          // Fallback: try to find any list items that might contain people
          const fallbackCards = Array.from(document.querySelectorAll('[data-test-app-aware-link]'));
          if (fallbackCards.length > 0) {
            cards = fallbackCards;
          }
        }

        for (const card of cards) {
          try {
            // Extract name
            let name = "";
            const nameSelectors = [
              'h3 a',
              '.org-people-profile-card__profile-title',
              '[data-anonymize="person-name"]',
              '.artdeco-entity-lockup__title a',
              'a[data-control-name*="people"]',
              '.org-people__profile-card-name',
              'span[aria-hidden="true"]',
            ];

            for (const sel of nameSelectors) {
              const nameEl = card.querySelector(sel);
              if (nameEl && nameEl.textContent) {
                const text = nameEl.textContent.trim();
                // Validate it looks like a name (not empty, not too long)
                if (text && text.length > 1 && text.length < 100 && !text.toLowerCase().includes('view profile')) {
                  name = text;
                  break;
                }
              }
            }

            if (!name) continue;

            // Extract title/position
            let title = "";
            const titleSelectors = [
              '.artdeco-entity-lockup__subtitle',
              '.org-people-profile-card__profile-info .lt-line-clamp',
              '[data-anonymize="job-title"]',
              '.artdeco-entity-lockup__caption',
              '.org-people__profile-card-subtitle',
              '.t-14',
            ];

            for (const sel of titleSelectors) {
              const titleEl = card.querySelector(sel);
              if (titleEl && titleEl.textContent) {
                const text = titleEl.textContent.trim();
                if (text && text !== name && text.length > 1 && text.length < 200) {
                  title = text;
                  break;
                }
              }
            }

            // Extract LinkedIn profile URL
            let linkedinUrl = "";
            const linkEl = card.querySelector('a[href*="/in/"]');
            if (linkEl instanceof HTMLAnchorElement && linkEl.href) {
              linkedinUrl = linkEl.href.split("?")[0]; // Remove query params
            }

            // If no direct link, try to construct from name
            if (!linkedinUrl) {
              const allLinks = card.querySelectorAll('a[href*="linkedin.com"]');
              for (let i = 0; i < allLinks.length; i++) {
                const link = allLinks[i] as HTMLAnchorElement;
                if (link.href.includes('/in/')) {
                  linkedinUrl = link.href.split("?")[0];
                  break;
                }
              }
            }

            // Extract profile image
            let profileImageUrl: string | undefined;
            const imgEl = card.querySelector('img[data-ghost-classes*="person"]') ||
                         card.querySelector('img.presence-entity__image') ||
                         card.querySelector('img.artdeco-entity-image') ||
                         card.querySelector('img[alt*="Photo"]');
            if (imgEl instanceof HTMLImageElement && imgEl.src && !imgEl.src.includes('data:image')) {
              profileImageUrl = imgEl.src;
            }

            if (name && linkedinUrl) {
              people.push({
                fullName: name,
                title: title || "Unknown Position",
                linkedinUrl,
                profileImageUrl,
              });
            }
          } catch (err) {
            // Skip this card if extraction fails
            continue;
          }
        }

        return people;
      });

      console.log(`  ✅ Found ${employees.length} employee(s) via Playwright scraping`);

      // Close browser
      await browser.close();

      // Return limited results
      return employees.slice(0, limit).map((emp: typeof employees[number]): LinkedInPerson => ({
        ...emp,
        bio: undefined,
        location: undefined,
        skills: undefined,
        connections: undefined,
      }));

    } catch (error) {
      console.error("  ❌ Error during page scraping:", error);
      if (browser) await browser.close();
      return [];
    }

  } catch (error) {
    console.error("  ❌ Playwright LinkedIn scraping error:", error);
    if (browser) await browser.close();
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
    const companyPageUrl = await findLinkedInCompanyPage(brand);
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
