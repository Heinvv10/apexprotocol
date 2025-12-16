/**
 * Brand Scraper Service
 * Orchestrates website scraping and AI analysis to extract brand information
 */

import { crawlUrl } from "@/lib/audit/crawler";
import { analyzeBrandFromWebsite, type BrandAnalysisInput } from "@/lib/ai/prompts/brand-analysis";
import { extractBestLogo, type LogoCandidate } from "@/lib/services/logo-extractor";
import type { ScrapedBrandData } from "@/app/api/brands/scrape/route";

// Progress callback type
type ProgressCallback = (progress: number, message: string) => Promise<void>;

/**
 * Scrape brand information from a website URL
 */
export async function scrapeBrandFromUrl(
  url: string,
  onProgress?: ProgressCallback
): Promise<ScrapedBrandData> {
  // Step 1: Fetch and crawl the website (10-30%)
  await onProgress?.(15, "Fetching website content...");

  const crawlResult = await crawlUrl(url, {
    depth: "single",
    timeout: 30000,
    options: {
      checkSchema: true,
      checkMeta: true,
      checkContent: true,
      checkLinks: true,
      checkPerformance: false,
      checkAccessibility: false,
      checkSecurity: false,
    },
  });

  if (!crawlResult.success || crawlResult.pages.length === 0) {
    throw new Error(
      `Failed to fetch website: ${crawlResult.errors?.[0]?.error || "Unknown error"}`
    );
  }

  const page = crawlResult.pages[0];
  await onProgress?.(30, "Extracting page data...");

  // Step 2: Extract raw data for AI analysis (30-40%)
  const rawData: BrandAnalysisInput = {
    url,
    title: page.title || "",
    metaDescription: page.metaDescription || "",
    ogData: {
      title: page.openGraph?.title || "",
      description: page.openGraph?.description || "",
      image: page.openGraph?.image || "",
      siteName: page.openGraph?.siteName || "",
    },
    h1Tags: page.h1Tags || [],
    h2Tags: page.h2Tags || [],
    bodyText: page.content?.text?.slice(0, 5000) || "",
    images: page.images?.map((img) => ({
      src: img.src,
      alt: img.alt || "",
    })) || [],
    links: page.links?.filter((link) => link.isInternal === false).map((link) => ({
      href: link.href,
      text: link.text || "",
    })).slice(0, 20) || [],
    schemaTypes: page.schemaMarkup?.map((s) => s.type).filter(Boolean) || [],
  };

  await onProgress?.(40, "Analyzing brand information with AI...");

  // Step 3: Analyze with Claude AI (40-70%)
  const aiAnalysis = await analyzeBrandFromWebsite(rawData);

  await onProgress?.(70, "Processing brand logo...");

  // Step 4: Extract and process logo (70-85%)
  let logoUrl: string | null = null;

  // Collect logo candidates with priority scoring
  const logoCandidates: LogoCandidate[] = [];

  // Add images with "logo" in filename or alt (highest priority for explicit logos)
  page.images?.forEach((img) => {
    const srcLower = img.src.toLowerCase();
    const altLower = (img.alt || "").toLowerCase();

    // SVG logos are best quality
    if (srcLower.includes("logo") && srcLower.endsWith(".svg")) {
      logoCandidates.push({
        src: img.src,
        type: "logo-named",
        priority: 0, // Highest priority
      });
    } else if (srcLower.includes("logo") || altLower.includes("logo")) {
      logoCandidates.push({
        src: img.src,
        type: "logo-named",
        priority: 1,
      });
    }

    // Also check for brand/header images which often contain logos
    if (srcLower.includes("brand") || srcLower.includes("header") || srcLower.includes("nav-logo")) {
      logoCandidates.push({
        src: img.src,
        type: "logo-named",
        priority: 2,
      });
    }
  });

  // Add AI-suggested logo if present
  if (aiAnalysis.logoUrl) {
    logoCandidates.push({
      src: aiAnalysis.logoUrl,
      type: "ai-suggested",
      priority: 1,
    });
  }

  // Add apple-touch-icon (usually high quality)
  if (page.appleTouchIcon) {
    logoCandidates.push({
      src: page.appleTouchIcon,
      type: "apple-touch-icon",
      priority: 3,
    });
  }

  // Add OG image as fallback candidate (often generic, lower priority)
  if (page.openGraph?.image) {
    logoCandidates.push({
      src: page.openGraph.image,
      type: "og-image",
      priority: 5,
    });
  }

  // Try to extract the best logo
  if (logoCandidates.length > 0) {
    try {
      logoUrl = await extractBestLogo(logoCandidates, url);
    } catch (error) {
      console.warn("[BrandScraper] Logo extraction failed:", error);
      // Continue without logo
    }
  }

  await onProgress?.(85, "Finalizing brand data...");

  // Step 5: Assemble final result (85-95%)
  const result: ScrapedBrandData = {
    scrapedUrl: url, // Store the scraped URL for domain extraction
    brandName: aiAnalysis.brandName || extractFallbackName(page.title, url),
    description: aiAnalysis.description || page.metaDescription || "",
    tagline: aiAnalysis.tagline || null,
    industry: aiAnalysis.industry || "Technology",
    primaryColor: aiAnalysis.primaryColor || "#4926FA",
    secondaryColor: aiAnalysis.secondaryColor || null,
    accentColor: aiAnalysis.accentColor || null,
    colorPalette: aiAnalysis.colorPalette || [],
    logoUrl,
    keywords: aiAnalysis.keywords || [],
    seoKeywords: aiAnalysis.seoKeywords || [],
    geoKeywords: aiAnalysis.geoKeywords || [],
    competitors: aiAnalysis.competitors || [],
    targetAudience: aiAnalysis.targetAudience || "",
    valuePropositions: aiAnalysis.valuePropositions || [],
    socialLinks: aiAnalysis.socialLinks || {},
    confidence: aiAnalysis.confidence || {
      overall: 50,
      perField: {},
    },
    rawData: {
      title: page.title || "",
      metaDescription: page.metaDescription || "",
      ogData: rawData.ogData,
      images: rawData.images.slice(0, 10),
    },
  };

  await onProgress?.(95, "Analysis complete!");

  return result;
}

/**
 * Extract a fallback brand name from page title or URL
 */
function extractFallbackName(title: string, url: string): string {
  // Try to extract from title
  if (title) {
    // Remove common suffixes
    const cleanTitle = title
      .split(/\s*[-|•]\s*/)[0]
      .trim();
    if (cleanTitle.length > 0 && cleanTitle.length < 50) {
      return cleanTitle;
    }
  }

  // Fallback to domain name
  try {
    const hostname = new URL(url).hostname;
    const domain = hostname.replace(/^www\./, "").split(".")[0];
    // Capitalize first letter
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return "Unknown Brand";
  }
}

/**
 * Extract primary color from CSS or theme-color meta tag
 * This is a simplified version - could be enhanced with CSS parsing
 */
export function extractThemeColor(html: string): string | null {
  // Try theme-color meta tag
  const themeColorMatch = html.match(
    /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i
  ) || html.match(
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i
  );

  if (themeColorMatch) {
    return themeColorMatch[1];
  }

  // Try msapplication-TileColor
  const tileColorMatch = html.match(
    /<meta[^>]*name=["']msapplication-TileColor["'][^>]*content=["']([^"']+)["']/i
  );

  if (tileColorMatch) {
    return tileColorMatch[1];
  }

  return null;
}
