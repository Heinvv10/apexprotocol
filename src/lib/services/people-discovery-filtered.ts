/**
 * Filtered People Discovery for Brand Creation
 *
 * Wraps the core people discovery with management-level filtering
 * to prevent database bloat when discovering people from large companies.
 */

import { discoverPeopleFromWebsite, convertToDbPeople, type DiscoveredPerson } from "@/lib/people";
import { db } from "@/lib/db";
import { brandPeople } from "@/lib/db/schema";

/**
 * Discover and save only management-level people from a brand's website
 *
 * FILTERING RULES:
 * - C-suite executives (CEO, CFO, CTO, COO, CMO, CIO, etc.)
 * - Founders and co-founders
 * - Board members
 * - Directors (any director title)
 * - Presidents and vice presidents
 *
 * @param brandId - ID of the brand to associate people with
 * @param domain - Website domain to crawl
 * @returns Number of management-level people discovered and saved
 */
export async function discoverManagementPeople(
  brandId: string,
  domain: string
): Promise<{
  saved: number;
  totalFound: number;
  filtered: number;
}> {
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;

  console.log(`[People Discovery] Crawling ${baseUrl} for management...`);

  // Discover all people from website
  const result = await discoverPeopleFromWebsite({
    baseUrl,
    brandId,
    maxPages: 5,
  });

  const totalFound = result.people.length;

  if (totalFound === 0) {
    console.log(`[People Discovery] No people found on ${domain}`);
    return { saved: 0, totalFound: 0, filtered: 0 };
  }

  // Filter to management-level only
  const managementPeople = filterManagementOnly(result.people);
  const filtered = totalFound - managementPeople.length;

  console.log(
    `[People Discovery] Found ${totalFound} people, keeping ${managementPeople.length} management (filtered ${filtered})`
  );

  // Save to database
  if (managementPeople.length > 0) {
    const peopleToInsert = convertToDbPeople(managementPeople, brandId);
    await db.insert(brandPeople).values(peopleToInsert);
    console.log(`[People Discovery] ✅ Saved ${managementPeople.length} management people`);
  }

  return {
    saved: managementPeople.length,
    totalFound,
    filtered,
  };
}

/**
 * Filter discovered people to only include management-level roles
 */
function filterManagementOnly(people: DiscoveredPerson[]): DiscoveredPerson[] {
  return people.filter((person) => {
    // Include if explicitly classified as management
    if (
      person.roleCategory === "c_suite" ||
      person.roleCategory === "founder" ||
      person.roleCategory === "board"
    ) {
      return true;
    }

    // Also check title for management keywords (catches edge cases)
    const title = (person.title || "").toLowerCase();

    const managementKeywords = [
      "director",
      "executive",
      "chief",
      "president",
      "ceo",
      "cfo",
      "cto",
      "coo",
      "cmo",
      "cio",
      "founder",
      "co-founder",
      "chairman",
      "chairwoman",
      "managing director",
      "board member",
    ];

    return managementKeywords.some((keyword) => title.includes(keyword));
  });
}
