/**
 * Brand Scrape API Endpoint
 * POST - Start scraping a brand's website to extract information
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId, getUserId } from "@/lib/auth/supabase-server";
import { z } from "zod";
import { getRedisClient, cacheSet } from "@/lib/redis";
import { createId } from "@paralleldrive/cuid2";

// Request validation schema
const scrapeRequestSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

// Job status types
export type ScrapeJobStatus = "pending" | "processing" | "completed" | "failed";

// Scraped brand data interface
export interface ScrapedBrandData {
  brandName: string;
  description: string;
  tagline: string | null;
  industry: string;
  primaryColor: string;
  secondaryColor: string | null;
  accentColor: string | null;
  colorPalette: string[];
  logoUrl: string | null;
  keywords: string[];
  scrapedUrl?: string; // The URL that was scraped
  seoKeywords: string[];
  geoKeywords: string[];
  competitors: Array<{
    name: string;
    url: string;
    reason: string;
  }>;
  targetAudience: string;
  valuePropositions: string[];
  socialLinks: Record<string, string>;
  confidence: {
    overall: number;
    perField: Record<string, number>;
  };
  // New fields from orchestrator
  locations?: Array<{
    type: "headquarters" | "office" | "regional";
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
  }>;
  personnel?: Array<{
    name: string;
    title: string;
    department?: string;
    bio?: string;
    email?: string;
    linkedinUrl?: string;
  }>;
  rawData?: {
    title: string;
    metaDescription: string;
    ogData: Record<string, string>;
    images: Array<{ src: string; alt: string }>;
  };
}

// Job data stored in Redis
export interface ScrapeJob {
  id: string;
  url: string;
  status: ScrapeJobStatus;
  progress: number;
  progressMessage: string;
  data?: ScrapedBrandData;
  error?: string;
  createdAt: string;
  completedAt?: string;
  userId: string;
  orgId?: string;
}

// Redis key for scrape jobs
const SCRAPE_JOB_KEY = (jobId: string) => `brand:scrape:${jobId}`;

// Check if real Redis is configured
const hasRedis = () => {
  return !!(process.env.REDIS_URL);
};

/**
 * POST /api/brands/scrape
 * Start a brand scraping job
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = scrapeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { url } = validation.data;

    // Normalize URL
    let normalizedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      normalizedUrl = `https://${url}`;
    }

    // Create job ID
    const jobId = `scrape_${createId()}`;

    // Create job record
    const job: ScrapeJob = {
      id: jobId,
      url: normalizedUrl,
      status: "pending",
      progress: 0,
      progressMessage: "Starting website analysis...",
      createdAt: new Date().toISOString(),
      userId,
      orgId: orgId ?? undefined,
    };

    // If no Redis configured, run synchronously and return result directly
    // This avoids polling issues with in-memory storage in serverless environments
    if (!hasRedis()) {
      try {
        const { scrapeBrandWithFallbacks } = await import("@/lib/services/brand-scraper-orchestrator");

        // Use orchestrator with progress callback
        let currentProgress = 0;
        const orchestratorResult = await scrapeBrandWithFallbacks(normalizedUrl, {
          onProgress: async (progress, message) => {
            currentProgress = progress;
            console.log(`[Scrape ${jobId}] ${progress}% - ${message}`);
          },
        });

        // Convert orchestrator result to ScrapedBrandData format
        const result: ScrapedBrandData = {
          brandName: orchestratorResult.brand.brandName || "",
          description: orchestratorResult.brand.description || "",
          tagline: orchestratorResult.brand.tagline || null,
          industry: orchestratorResult.brand.industry || "",
          primaryColor: orchestratorResult.brand.primaryColor || "",
          secondaryColor: orchestratorResult.brand.secondaryColor || null,
          accentColor: orchestratorResult.brand.accentColor || null,
          colorPalette: orchestratorResult.brand.colorPalette || [],
          logoUrl: orchestratorResult.brand.logoUrl || null,
          keywords: orchestratorResult.brand.keywords || [],
          scrapedUrl: orchestratorResult.brand.scrapedUrl || normalizedUrl,
          seoKeywords: orchestratorResult.brand.seoKeywords || [],
          geoKeywords: orchestratorResult.brand.geoKeywords || [],
          competitors: orchestratorResult.brand.competitors || [],
          targetAudience: orchestratorResult.brand.targetAudience || "",
          valuePropositions: orchestratorResult.brand.valuePropositions || [],
          socialLinks: orchestratorResult.brand.socialLinks || {},
          confidence: orchestratorResult.brand.confidence || { overall: 0, perField: {} },
          // Add locations and personnel from orchestrator
          locations: orchestratorResult.locations || [],
          personnel: orchestratorResult.personnel || [],
        } as ScrapedBrandData & { locations?: any[]; personnel?: any[] };

        return NextResponse.json({
          success: true,
          jobId,
          message: "Scraping completed",
          // Return completed job directly for immediate use
          job: {
            id: jobId,
            url: normalizedUrl,
            status: "completed" as const,
            progress: 100,
            progressMessage: "Analysis complete!",
            data: result,
            createdAt: job.createdAt,
            completedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          jobId,
          message: "Scraping failed",
          job: {
            id: jobId,
            url: normalizedUrl,
            status: "failed" as const,
            progress: 0,
            progressMessage: "Analysis failed",
            error: error instanceof Error ? error.message : "Unknown error",
            createdAt: job.createdAt,
            completedAt: new Date().toISOString(),
          },
        });
      }
    }

    // Store job in Redis (expires in 1 hour)
    await cacheSet(SCRAPE_JOB_KEY(jobId), job, 3600);

    // Start the scraping process in the background
    // We use a dynamic import to avoid blocking the response
    processScrapeJob(jobId, normalizedUrl, userId, orgId ?? undefined).catch(
      (error) => {
        console.error(`[BrandScrape] Job ${jobId} failed:`, error);
      }
    );

    return NextResponse.json({
      success: true,
      jobId,
      message: "Scraping job started",
    });
  } catch (error) {
    console.error("[BrandScrape] Error starting scrape job:", error);
    return NextResponse.json(
      { error: "Failed to start scraping job" },
      { status: 500 }
    );
  }
}

/**
 * Process the scrape job in the background
 */
async function processScrapeJob(
  jobId: string,
  url: string,
  userId: string,
  orgId?: string
) {
  const redis = getRedisClient();
  const jobKey = SCRAPE_JOB_KEY(jobId);

  try {
    // Update status to processing
    await updateJobProgress(jobKey, "processing", 10, "Starting multi-stage analysis...");

    // Import orchestrator dynamically to avoid loading at module init
    const { scrapeBrandWithFallbacks } = await import("@/lib/services/brand-scraper-orchestrator");

    // Run the orchestrator with progress callbacks
    const orchestratorResult = await scrapeBrandWithFallbacks(url, {
      onProgress: async (progress, message) => {
        await updateJobProgress(jobKey, "processing", progress, message);
      },
    });

    // Convert orchestrator result to ScrapedBrandData format
    const result: ScrapedBrandData = {
      brandName: orchestratorResult.brand.brandName || "",
      description: orchestratorResult.brand.description || "",
      tagline: orchestratorResult.brand.tagline || null,
      industry: orchestratorResult.brand.industry || "",
      primaryColor: orchestratorResult.brand.primaryColor || "",
      secondaryColor: orchestratorResult.brand.secondaryColor || null,
      accentColor: orchestratorResult.brand.accentColor || null,
      colorPalette: orchestratorResult.brand.colorPalette || [],
      logoUrl: orchestratorResult.brand.logoUrl || null,
      keywords: orchestratorResult.brand.keywords || [],
      scrapedUrl: orchestratorResult.brand.scrapedUrl || url,
      seoKeywords: orchestratorResult.brand.seoKeywords || [],
      geoKeywords: orchestratorResult.brand.geoKeywords || [],
      competitors: orchestratorResult.brand.competitors || [],
      targetAudience: orchestratorResult.brand.targetAudience || "",
      valuePropositions: orchestratorResult.brand.valuePropositions || [],
      socialLinks: orchestratorResult.brand.socialLinks || {},
      confidence: orchestratorResult.brand.confidence || { overall: 0, perField: {} },
      locations: orchestratorResult.locations || [],
      personnel: orchestratorResult.personnel || [],
    };

    // Update job with results
    const job = await getJob(jobKey);
    if (job) {
      job.status = "completed";
      job.progress = 100;
      job.progressMessage = "Analysis complete!";
      job.data = result;
      job.completedAt = new Date().toISOString();
      await redis.setex(jobKey, 3600, JSON.stringify(job));
    }
  } catch (error) {
    console.error(`[BrandScrape] Job ${jobId} error:`, error);

    // Update job with error
    const job = await getJob(jobKey);
    if (job) {
      job.status = "failed";
      job.progress = 0;
      job.progressMessage = "Analysis failed";
      job.error = error instanceof Error ? error.message : "Unknown error occurred";
      job.completedAt = new Date().toISOString();
      await redis.setex(jobKey, 3600, JSON.stringify(job));
    }
  }
}

/**
 * Update job progress in Redis
 */
async function updateJobProgress(
  jobKey: string,
  status: ScrapeJobStatus,
  progress: number,
  progressMessage: string
) {
  const redis = getRedisClient();
  const job = await getJob(jobKey);
  if (job) {
    job.status = status;
    job.progress = progress;
    job.progressMessage = progressMessage;
    await redis.setex(jobKey, 3600, JSON.stringify(job));
  }
}

/**
 * Get job from Redis
 */
async function getJob(jobKey: string): Promise<ScrapeJob | null> {
  const redis = getRedisClient();
  const data = await redis.get(jobKey);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : (data as ScrapeJob);
}
