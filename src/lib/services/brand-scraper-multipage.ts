/**
 * Multi-Page Brand Scraper Service
 * Crawls multiple pages (homepage, about, contact, history) to build comprehensive brand knowledge
 */

import { crawlUrl } from "@/lib/audit/crawler";
import { analyzeBrandFromWebsite, type BrandAnalysisInput } from "@/lib/ai/prompts/brand-analysis";
import { extractBestLogo } from "@/lib/services/logo-extractor";
import type { ScrapedBrandData } from "@/app/api/brands/scrape/route";

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
 * Crawl a single page and extract structured data
 */
async function crawlSinglePage(url: string, timeout = 15000): Promise<PageData | null> {
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

    return {
      url,
      title: page.title || "",
      content: page.content?.text || "",
      h1Tags: page.h1Tags || [],
      h2Tags: page.h2Tags || [],
      links: page.links?.map(l => ({ href: l.href, text: l.text || "" })) || [],
      images: page.images?.map(i => ({ src: i.src, alt: i.alt || "" })) || [],
    };
  } catch (error) {
    console.error(`Failed to crawl ${url}:`, error);
    return null;
  }
}

/**
 * Enhanced multi-page brand scraper
 * Crawls homepage, about, contact, and history pages
 */
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

  onProgress?.(85, "Extracting logo...");

  // Step 5: Extract logo from homepage images (85-95%)
  const logoUrl = await extractBestLogo(homepage.images, baseUrl);

  onProgress?.(95, "Finalizing brand data...");

  // Step 6: Return comprehensive brand data (95-100%)
  const result: ScrapedBrandData = {
    scrapedUrl: baseUrl,
    brandName: aiAnalysis.brandName || new URL(baseUrl).hostname,
    domain: new URL(baseUrl).hostname.replace(/^www\./, ''),
    description: aiAnalysis.description || "",
    industry: aiAnalysis.industry || "",
    logoUrl: logoUrl || null,
    tagline: aiAnalysis.tagline || null,
    foundedYear: aiAnalysis.foundedYear || null,
    headquarters: aiAnalysis.headquarters || null,
    brandColors: aiAnalysis.brandColors || [],
    keywords: aiAnalysis.keywords || [],
    geoKeywords: aiAnalysis.geoKeywords || [],
    valuePropositions: aiAnalysis.valuePropositions || [],
    targetAudience: aiAnalysis.targetAudience || null,

    // Enhanced multi-page data
    locations: aiAnalysis.locations || [],
    personnel: aiAnalysis.personnel || [],

    // Additional context
    pagesScraped: {
      homepage: true,
      about: !!aboutPage,
      contact: !!contactPage,
      history: !!historyPage,
    },
  };

  onProgress?.(100, "Complete!");

  return result;
}
