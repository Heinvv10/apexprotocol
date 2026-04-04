/**
 * Platform Monitoring API Client
 *
 * Handles API calls for platform mention tracking across AI platforms
 * (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Janus)
 */

// Types
export interface PlatformMention {
  id: string;
  platform: string;
  timestamp: string;
  query: string;
  ourPage: string;
  context: string;
  sentiment: "positive" | "neutral" | "negative" | "unrecognized";
  position: number;
  visibility: number;
}

export interface PlatformStats {
  platform: string;
  mentions: number;
  avgPosition: number;
  avgVisibility: number;
  trend: number;
}

export interface TopCitedPage {
  page: string;
  citations: number;
  avgPosition: number;
  platforms: string[];
}

export interface CompetitorMention {
  id: string;
  platform: string;
  timestamp: string;
  query: string;
  competitor: string;
  competitorPage: string;
  context: string;
  position: number;
  visibility: number;
}

export interface ContentPerformance {
  contentType: string;
  type?: string;
  citations: number;
  avgPosition: number;
  avgVisibility: number;
  topPlatforms: string[];
  trend: number;
  schemaImpact?: string;
}

/**
 * Fetch our platform mentions
 */
export async function getPlatformMentions(brandId?: string | null): Promise<{
  mentions: PlatformMention[];
  platformStats: PlatformStats[];
  topCitedPages: TopCitedPage[];
  totalMentions: number;
  avgVisibility: number;
}> {
  const url = brandId
    ? `/api/platform-monitoring/our-visibility?brandId=${brandId}`
    : '/api/platform-monitoring/our-visibility';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch platform mentions');
  }
  return response.json();
}

/**
 * Fetch competitor platform mentions
 */
export async function getCompetitorMentions(brandId?: string | null): Promise<{
  mentions: CompetitorMention[];
  competitors: Array<{
    id?: string;
    name: string;
    mentions: number;
    avgPosition: number;
    avgVisibility: number;
    shareOfVoice?: number;
    trend: number;
    topPlatforms?: string[];
    topQueries?: string[];
  }>;
  shareOfVoice: number;
}> {
  const url = brandId
    ? `/api/platform-monitoring/competitor-visibility?brandId=${brandId}`
    : '/api/platform-monitoring/competitor-visibility';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch competitor mentions');
  }
  return response.json();
}

/**
 * Fetch content performance by type
 */
export async function getContentPerformance(brandId?: string | null): Promise<{
  performanceByType: ContentPerformance[];
  schemaImpact: {
    withSchema: number;
    withoutSchema: number;
    improvement: number;
  };
  freshnessImpact: {
    under30Days: number;
    under90Days: number;
    over90Days: number;
  };
}> {
  const url = brandId
    ? `/api/platform-monitoring/content-performance?brandId=${brandId}`
    : '/api/platform-monitoring/content-performance';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch content performance');
  }
  return response.json();
}
