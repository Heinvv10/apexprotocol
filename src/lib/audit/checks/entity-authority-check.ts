/**
 * Entity Authority Check
 * Checks Wikipedia and Wikidata presence for brand entity authority
 */

import { createId } from "@paralleldrive/cuid2";
import type { AuditIssue } from "@/lib/db/schema/audits";

interface WikidataSearchResult {
  search: Array<{
    id: string;
    label: string;
    description?: string;
    url?: string;
  }>;
  success?: number;
}

interface WikipediaSummary {
  title: string;
  extract?: string;
  description?: string;
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
}

/**
 * Search Wikidata for a brand entity
 */
async function searchWikidata(
  brandName: string
): Promise<{ found: boolean; entityId?: string; description?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const encodedName = encodeURIComponent(brandName);
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodedName}&language=en&format=json&origin=*`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ApexGEO-Auditor/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { found: false };
    }

    const data = (await response.json()) as WikidataSearchResult;

    if (data.search && data.search.length > 0) {
      // Check if any result closely matches the brand name
      const exactMatch = data.search.find(
        (item) => item.label.toLowerCase() === brandName.toLowerCase()
      );
      const bestMatch = exactMatch || data.search[0];

      return {
        found: true,
        entityId: bestMatch.id,
        description: bestMatch.description,
      };
    }

    return { found: false };
  } catch {
    // Gracefully handle errors
    return { found: false };
  }
}

/**
 * Check Wikipedia for a brand page
 */
async function checkWikipedia(
  brandName: string
): Promise<{ found: boolean; title?: string; extract?: string; url?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Format brand name for Wikipedia URL (replace spaces with underscores)
    const formattedName = brandName.replace(/\s+/g, "_");
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedName)}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ApexGEO-Auditor/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      return { found: false };
    }

    if (!response.ok) {
      return { found: false };
    }

    const data = (await response.json()) as WikipediaSummary;

    // Check if we got a valid page (not a disambiguation or missing page)
    if (data.title && data.extract) {
      return {
        found: true,
        title: data.title,
        extract: data.extract,
        url: data.content_urls?.desktop?.page,
      };
    }

    return { found: false };
  } catch {
    // Gracefully handle errors
    return { found: false };
  }
}

/**
 * Check entity authority across Wikipedia and Wikidata
 * @param brandName - The brand name to check
 * @param domain - The brand's domain (for context, optional)
 * @returns Array of AuditIssue for missing entity presence
 */
export async function checkEntityAuthority(
  brandName: string,
  domain?: string
): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];

  // Run both checks in parallel
  const [wikidataResult, wikipediaResult] = await Promise.all([
    searchWikidata(brandName),
    checkWikipedia(brandName),
  ]);

  // Check Wikidata presence
  if (!wikidataResult.found) {
    issues.push({
      id: createId(),
      category: "ai_crawlability",
      severity: "high",
      title: "No Wikidata entity found for brand",
      description: `No Wikidata entity was found for "${brandName}". Wikidata is a key knowledge source that AI models like ChatGPT, Claude, and Gemini use to understand entities and their relationships. Without a Wikidata entry, AI platforms may have limited or no structured knowledge about your brand.`,
      recommendation:
        "Create a Wikidata entry for your brand with accurate information including founding date, industry, website, and key facts. Ensure the entry follows Wikidata's notability guidelines and is properly sourced.",
      impact:
        "AI platforms may not recognize your brand as a notable entity, reducing citation likelihood and accuracy in AI-generated responses.",
    });
  }

  // Check Wikipedia presence
  if (!wikipediaResult.found) {
    issues.push({
      id: createId(),
      category: "ai_crawlability",
      severity: "medium",
      title: "No Wikipedia presence detected",
      description: `No Wikipedia article was found for "${brandName}". Wikipedia is heavily weighted in AI training data and serves as a primary source for entity knowledge. Brands with Wikipedia pages receive significantly more accurate and frequent mentions in AI responses.`,
      recommendation:
        "If your brand meets Wikipedia's notability guidelines, consider creating or improving a Wikipedia article. Focus on establishing third-party reliable sources that cover your brand. Note: Wikipedia articles must be neutral and well-sourced - do not create promotional content.",
      impact:
        "Without Wikipedia presence, AI models have less authoritative information about your brand, potentially leading to fewer citations or inaccurate information in AI responses.",
    });
  }

  // If both are found, no issues needed
  // This function returns empty array if brand has good entity authority

  return issues;
}
