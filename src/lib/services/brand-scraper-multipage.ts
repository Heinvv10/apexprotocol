/**
 * Multi-Page Brand Scraper Service
 * Crawls multiple pages (homepage, about, contact, history) to build comprehensive brand knowledge
 */

import * as cheerio from "cheerio";
import { crawlUrl } from "@/lib/audit/crawler";
import { analyzeBrandFromWebsite, type BrandAnalysisInput, type BrandLocationInfo } from "@/lib/ai/prompts/brand-analysis";
import { extractBestLogo, type LogoCandidate } from "@/lib/services/logo-extractor";
import { extractSocialPatterns, type SocialLink } from "@/lib/crawling/social-discovery";
import type { ScrapedBrandData } from "@/app/api/brands/scrape/route";
import { logger } from "@/lib/logger";

// Progress callback type
type ProgressCallback = (progress: number, message: string) => void;

interface PageData {
  url: string;
  title: string;
  content: string;
  h1Tags: string[];
  h2Tags: string[];
  links: Array<{ href: string; text: string }>;
  images: Array<{ src: string; alt: string }>;
  rawHtml?: string;
  socialLinks?: SocialLink[];
}

/**
 * Find relevant page URLs to scrape (about, contact, history)
 */
async function findRelevantPages(baseUrl: string, homepageLinks: Array<{ href: string; text: string }>): Promise<{
  aboutUrl: string | null;
  contactUrl: string | null;
  historyUrl: string | null;
}> {
  const domain = new URL(baseUrl).origin;

  // Common URL patterns for each page type
  const patterns = {
    about: [
      /\/about\/?$/i,
      /\/about-us\/?$/i,
      /\/who-we-are\/?$/i,
      /\/company\/?$/i,
      /\/our-story\/?$/i,
    ],
    contact: [
      /\/contact\/?$/i,
      /\/contact-us\/?$/i,
      /\/get-in-touch\/?$/i,
      /\/reach-us\/?$/i,
    ],
    history: [
      /\/history\/?$/i,
      /\/our-history\/?$/i,
      /\/story\/?$/i,
      /\/timeline\/?$/i,
    ],
  };

  const result = {
    aboutUrl: null as string | null,
    contactUrl: null as string | null,
    historyUrl: null as string | null,
  };

  // Search through homepage links
  for (const link of homepageLinks) {
    const url = link.href.startsWith('http') ? link.href : `${domain}${link.href}`;
    const text = link.text.toLowerCase();

    // Match by URL pattern or link text
    if (!result.aboutUrl && (
      patterns.about.some(p => p.test(url)) ||
      ['about', 'about us', 'who we are', 'company'].some(t => text.includes(t))
    )) {
      result.aboutUrl = url;
    }

    if (!result.contactUrl && (
      patterns.contact.some(p => p.test(url)) ||
      ['contact', 'contact us', 'get in touch', 'reach us'].some(t => text.includes(t))
    )) {
      result.contactUrl = url;
    }

    if (!result.historyUrl && (
      patterns.history.some(p => p.test(url)) ||
      ['history', 'our history', 'story', 'our story', 'timeline'].some(t => text.includes(t))
    )) {
      result.historyUrl = url;
    }
  }

  // Fallback: construct common URLs if not found in links
  if (!result.aboutUrl) {
    result.aboutUrl = `${domain}/about`;
  }
  if (!result.contactUrl) {
    result.contactUrl = `${domain}/contact`;
  }

  return result;
}

/**
 * Crawl a single page using Playwright for JS-rendered content.
 * Falls back to static HTML crawl if Playwright fails.
 */
async function crawlSinglePagePlaywright(url: string, timeout = 15000): Promise<PageData | null> {
  let browser;
  try {
    // Dynamic import so a missing browser binary doesn't crash at module load
    const { chromium } = await import("playwright");
    // In Docker we install system chromium (alpine's `chromium` apk package)
    // and point Playwright at it via PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
    // Falling back to Playwright's bundled browser when the env var is unset.
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
    browser = await chromium.launch({
      headless: true,
      executablePath,
      // Alpine's system chromium needs these flags to launch in a container.
      args: executablePath
        ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        : undefined,
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });

    const html = await page.content();
    const text = await page.evaluate(() => (document.body as HTMLBodyElement).innerText);
    const title = await page.title();
    const h1Tags = await page.$$eval("h1", (els) =>
      els.map((el) => el.textContent?.trim() || "").filter(Boolean)
    );
    const h2Tags = await page.$$eval("h2", (els) =>
      els.map((el) => el.textContent?.trim() || "").filter(Boolean)
    );
    const links = await page.$$eval("a[href]", (els) =>
      els.map((el) => ({ href: el.getAttribute("href") || "", text: el.textContent?.trim() || "" }))
    );
    const images = await page.$$eval("img", (els) =>
      els.map((el) => ({ src: el.getAttribute("src") || "", alt: el.getAttribute("alt") || "" }))
    );

    // Extract social links from rendered HTML
    const $ = cheerio.load(html);
    const socialResult = extractSocialPatterns($);

    return {
      url,
      title,
      content: text,
      h1Tags,
      h2Tags,
      links,
      images,
      rawHtml: html,
      socialLinks: socialResult.links,
    };
  } catch (e) {
    // Playwright failure is expected in environments without a browser binary;
    // the caller will fall back to crawlSinglePageStatic. Log at warn so it
    // surfaces in telemetry without firing as an error.
    logger.warn("[brand-scraper] playwright crawl failed — falling back to static", {
      url,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  } finally {
    await browser?.close();
  }
}

/**
 * Static HTML fallback crawler using the existing crawlUrl utility.
 */
async function crawlSinglePageStatic(url: string, timeout = 15000): Promise<PageData | null> {
  try {
    const crawlResult = await crawlUrl(url, {
      depth: "single",
      timeout,
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
      return null;
    }

    const page = crawlResult.pages[0];

    // Extract social links from raw HTML if available
    let socialLinks: SocialLink[] = [];
    if (page.rawHtml) {
      try {
        const $ = cheerio.load(page.rawHtml);
        const socialResult = extractSocialPatterns($);
        socialLinks = socialResult.links;
      } catch (e) {
        logger.warn("[brand-scraper] social-links extraction failed", {
          url,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return {
      url,
      title: page.title || "",
      content: page.content?.text || "",
      h1Tags: page.h1Tags || [],
      h2Tags: page.h2Tags || [],
      links: page.links?.map((l) => ({ href: l.href, text: l.text || "" })) || [],
      images: page.images?.map((i) => ({ src: i.src, alt: i.alt || "" })) || [],
      rawHtml: page.rawHtml,
      socialLinks,
    };
  } catch (error) {
    // Static crawl is the last-resort path; if it fails we have no data at
    // all. Route to Sentry so operators see a persistent pattern rather than
    // the audit silently returning incomplete brand info.
    logger.error("[brand-scraper] static crawl failed", {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    const Sentry = await import("@sentry/nextjs").catch(() => null);
    Sentry?.captureException(error, {
      tags: { module: "brand-scraper", phase: "static-crawl" },
      extra: { url },
    });
    return null;
  }
}

/**
 * Crawl a single page and extract structured data including social links.
 * Attempts JS-rendered crawl via Playwright first; falls back to static HTML.
 */
async function crawlSinglePage(url: string, timeout = 15000): Promise<PageData | null> {
  const playwrightResult = await crawlSinglePagePlaywright(url, timeout);
  if (playwrightResult) {
    return playwrightResult;
  }
  logger.info("[brand-scraper] falling back to static HTML crawl", { url });
  return crawlSinglePageStatic(url, timeout);
}

/**
 * Enhanced multi-page brand scraper
 * Crawls homepage, about, contact, and history pages
 */

// Known cities mapped to their country
const KNOWN_CITIES: Record<string, { country: string; countryCode?: string }> = {
  // South Africa
  "cape town": { country: "South Africa" },
  "johannesburg": { country: "South Africa" },
  "joburg": { country: "South Africa" },
  "jozi": { country: "South Africa" },
  "pretoria": { country: "South Africa" },
  "tshwane": { country: "South Africa" },
  "durban": { country: "South Africa" },
  "port elizabeth": { country: "South Africa" },
  "gqeberha": { country: "South Africa" },
  "bloemfontein": { country: "South Africa" },
  "east london": { country: "South Africa" },
  "centurion": { country: "South Africa" },
  "sandton": { country: "South Africa" },
  "stellenbosch": { country: "South Africa" },
  // Common global cities
  "london": { country: "United Kingdom" },
  "new york": { country: "United States" },
  "san francisco": { country: "United States" },
  "los angeles": { country: "United States" },
  "chicago": { country: "United States" },
  "toronto": { country: "Canada" },
  "sydney": { country: "Australia" },
  "melbourne": { country: "Australia" },
  "amsterdam": { country: "Netherlands" },
  "berlin": { country: "Germany" },
  "paris": { country: "France" },
  "dubai": { country: "United Arab Emirates" },
  "singapore": { country: "Singapore" },
  "mumbai": { country: "India" },
  "bangalore": { country: "India" },
  "nairobi": { country: "Kenya" },
  "lagos": { country: "Nigeria" },
};

function extractLocationsFromText(bodyText: string): BrandLocationInfo[] {
  const lower = bodyText.toLowerCase();
  const found: BrandLocationInfo[] = [];
  const seen = new Set<string>();

  for (const [city, meta] of Object.entries(KNOWN_CITIES)) {
    // Match city as a word boundary (not part of another word)
    const regex = new RegExp(`\b${city.replace(/\s+/g, '\\s+')}\b`, 'i');
    if (regex.test(lower) && !seen.has(city)) {
      seen.add(city);
      // Capitalise city name properly
      const cityName = city.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
      found.push({
        type: 'headquarters',
        city: cityName,
        country: meta.country,
      });
    }
  }

  return found.slice(0, 3); // Max 3 auto-detected locations
}

export async function scrapeMultiPageBrand(
  url: string,
  onProgress?: ProgressCallback
): Promise<ScrapedBrandData> {
  const baseUrl = url.replace(/\/$/, ''); // Remove trailing slash

  // Step 1: Crawl homepage (0-20%)
  onProgress?.(5, "Crawling homepage...");
  const homepage = await crawlSinglePage(baseUrl, 30000);

  if (!homepage) {
    throw new Error("Failed to fetch homepage");
  }

  onProgress?.(20, "Finding relevant pages...");

  // Step 2: Find and crawl additional pages (20-60%)
  const relevantUrls = await findRelevantPages(baseUrl, homepage.links);

  let aboutPage: PageData | null = null;
  let contactPage: PageData | null = null;
  let historyPage: PageData | null = null;

  // Crawl about page (20-35%)
  if (relevantUrls.aboutUrl) {
    onProgress?.(25, "Crawling about page...");
    aboutPage = await crawlSinglePage(relevantUrls.aboutUrl);
    onProgress?.(35, aboutPage ? "About page loaded" : "About page not found");
  }

  // Crawl contact page (35-50%)
  if (relevantUrls.contactUrl) {
    onProgress?.(40, "Crawling contact page...");
    contactPage = await crawlSinglePage(relevantUrls.contactUrl);
    onProgress?.(50, contactPage ? "Contact page loaded" : "Contact page not found");
  }

  // Crawl history page (50-60%)
  if (relevantUrls.historyUrl) {
    onProgress?.(55, "Crawling history page...");
    historyPage = await crawlSinglePage(relevantUrls.historyUrl);
    onProgress?.(60, historyPage ? "History page loaded" : "History page not found");
  }

  onProgress?.(65, "Merging page content...");

  // Step 3: Merge all page data for AI analysis
  const mergedData: BrandAnalysisInput = {
    url: baseUrl,

    // Homepage metadata
    title: homepage.title,
    metaDescription: "", // TODO: Extract from homepage crawl result
    ogData: {
      title: "",
      description: "",
      image: "",
      siteName: "",
    },

    // Merge headings from all pages
    h1Tags: [
      ...homepage.h1Tags,
      ...(aboutPage?.h1Tags || []),
      ...(contactPage?.h1Tags || []),
      ...(historyPage?.h1Tags || []),
    ],
    h2Tags: [
      ...homepage.h2Tags,
      ...(aboutPage?.h2Tags || []),
      ...(contactPage?.h2Tags || []),
      ...(historyPage?.h2Tags || []),
    ],

    // Merge content from all pages with labels
    bodyText: [
      `=== HOMEPAGE ===\n${homepage.content.slice(0, 3000)}`,
      aboutPage ? `\n\n=== ABOUT PAGE ===\n${aboutPage.content.slice(0, 3000)}` : '',
      contactPage ? `\n\n=== CONTACT PAGE ===\n${contactPage.content.slice(0, 2000)}` : '',
      historyPage ? `\n\n=== HISTORY PAGE ===\n${historyPage.content.slice(0, 2000)}` : '',
    ].join('').slice(0, 10000), // Limit to 10K chars total

    // Merge images
    images: [
      ...homepage.images,
      ...(aboutPage?.images || []),
    ].slice(0, 50),

    // External links from homepage
    links: homepage.links.filter(l => {
      try {
        const linkUrl = new URL(l.href, baseUrl);
        const baseHostname = new URL(baseUrl).hostname;
        return linkUrl.hostname !== baseHostname;
      } catch {
        return false;
      }
    }).slice(0, 20),

    schemaTypes: [], // TODO: Extract schema types
  };

  onProgress?.(70, "Analyzing brand with AI...");

  // Step 4: AI Analysis with enhanced multi-page context (70-85%)
  const aiAnalysis = await analyzeBrandFromWebsite(mergedData);

  // Fallback: if AI didn't extract locations, try text-based extraction
  if (!aiAnalysis.locations || aiAnalysis.locations.length === 0) {
    const textLocations = extractLocationsFromText(mergedData.bodyText || '');
    if (textLocations.length > 0) {
      logger.info("brand-scraper: fell back to text-based location extraction", {
        count: textLocations.length,
      });
      aiAnalysis.locations = textLocations;
    }
  }

  onProgress?.(85, "Extracting logo...");

  // Step 5: Extract logo from homepage images (85-95%)
  // Convert images to LogoCandidate format with proper priority scoring
  const logoCandidates: LogoCandidate[] = [];
  
  for (const img of homepage.images) {
    const srcLower = img.src.toLowerCase();
    const altLower = (img.alt || "").toLowerCase();
    
    // Highest priority: explicit logo files
    if (srcLower.includes("logo")) {
      // SVG logos are best
      if (srcLower.endsWith(".svg")) {
        logoCandidates.push({ src: img.src, type: "logo-named", priority: 0 });
      } else {
        logoCandidates.push({ src: img.src, type: "logo-named", priority: 1 });
      }
    }
    // Second: alt text contains "logo"  
    else if (altLower.includes("logo")) {
      logoCandidates.push({ src: img.src, type: "logo-named", priority: 2 });
    }
    // Third: brand/header images (often contain logos)
    else if (srcLower.includes("brand") || srcLower.includes("header") || srcLower.includes("nav")) {
      logoCandidates.push({ src: img.src, type: "logo-named", priority: 3 });
    }
    // Fourth: images in header area with company name as alt (like "Aberdeens")
    // These are often the main logo without "logo" in the name
    else if (altLower && !altLower.includes(" ") && altLower.length < 30 && 
             (srcLower.includes("images") || srcLower.includes("assets"))) {
      logoCandidates.push({ src: img.src, type: "logo-named", priority: 4 });
    }
  }
  
  // Also add AI-suggested logo if present
  if (aiAnalysis.logoUrl) {
    logoCandidates.push({ src: aiAnalysis.logoUrl, type: "ai-suggested", priority: 1 });
  }
  
  const logoUrl = logoCandidates.length > 0 
    ? await extractBestLogo(logoCandidates, baseUrl) 
    : null;

  onProgress?.(90, "Extracting social links...");

  // Step 6: Merge social links from all pages (90-95%)
  const allSocialLinks: SocialLink[] = [
    ...(homepage.socialLinks || []),
    ...(aboutPage?.socialLinks || []),
    ...(contactPage?.socialLinks || []),
    ...(historyPage?.socialLinks || []),
  ];

  // Deduplicate social links by platform (keep highest confidence)
  const socialLinksMap = new Map<string, SocialLink>();
  for (const link of allSocialLinks) {
    const existing = socialLinksMap.get(link.platform);
    if (!existing || link.confidence > existing.confidence) {
      socialLinksMap.set(link.platform, link);
    }
  }

  // Convert to Record<string, string> for API compatibility
  const socialLinks: Record<string, string> = {};
  for (const [platform, link] of socialLinksMap) {
    socialLinks[platform] = link.url;
  }

  onProgress?.(95, "Finalizing brand data...");

  // Step 7: Return comprehensive brand data (95-100%)
  // Ensure output matches ScrapedBrandData interface
  const result: ScrapedBrandData = {
    scrapedUrl: baseUrl,
    brandName: aiAnalysis.brandName || new URL(baseUrl).hostname,
    description: aiAnalysis.description || "",
    tagline: aiAnalysis.tagline || null,
    industry: aiAnalysis.industry || "Other",
    
    // Colors - map from AI analysis
    primaryColor: aiAnalysis.primaryColor || "#4926FA",
    secondaryColor: aiAnalysis.secondaryColor || null,
    accentColor: aiAnalysis.accentColor || null,
    colorPalette: aiAnalysis.colorPalette || [],
    
    logoUrl: logoUrl || null,
    
    // Keywords
    keywords: aiAnalysis.keywords || [],
    seoKeywords: aiAnalysis.seoKeywords || [],
    geoKeywords: aiAnalysis.geoKeywords || [],
    
    // Business info
    competitors: aiAnalysis.competitors || [],
    targetAudience: aiAnalysis.targetAudience || "",
    valuePropositions: aiAnalysis.valuePropositions || [],
    
    // Social links from all pages
    socialLinks,
    
    // Confidence scores
    confidence: aiAnalysis.confidence || { overall: 50, perField: {} },

    // Enhanced multi-page data
    locations: aiAnalysis.locations || [],
    personnel: aiAnalysis.personnel || [],
  };

  onProgress?.(100, "Complete!");

  return result;
}
