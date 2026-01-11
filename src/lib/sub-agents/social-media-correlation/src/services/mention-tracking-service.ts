/**
 * MentionTrackingService
 * Multi-platform mention tracking across social media and AI platforms
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Platform types
export type Platform =
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'reddit'
  | 'youtube'
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'grok'
  | 'deepseek';

export const SOCIAL_PLATFORMS: Platform[] = ['twitter', 'linkedin', 'facebook', 'instagram', 'reddit', 'youtube'];
export const AI_PLATFORMS: Platform[] = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek'];
export const ALL_PLATFORMS: Platform[] = [...SOCIAL_PLATFORMS, ...AI_PLATFORMS];

// Configuration schema
const mentionTrackingConfigSchema = z.object({
  enabledPlatforms: z.array(z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'reddit', 'youtube', 'chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek'])).default(ALL_PLATFORMS as [Platform, ...Platform[]]),
  pollIntervalMs: z.number().min(1000).default(30000),
  maxMentionsPerBatch: z.number().min(1).default(100),
  contextWindowSize: z.number().min(10).default(50),
  deduplicationWindowMs: z.number().min(0).default(3600000), // 1 hour
});

export type MentionTrackingConfig = z.infer<typeof mentionTrackingConfigSchema>;

// Brand configuration
export interface BrandConfig {
  id: string;
  name: string;
  keywords: string[];
  excludeKeywords?: string[];
}

// Mention context
export interface MentionContext {
  before: string;
  after: string;
  full: string;
}

// Core Mention type
export interface Mention {
  id: string;
  brandId: string;
  platform: Platform;
  content: string;
  author: string;
  timestamp: Date;
  url?: string;
  matchedKeyword: string;
  context: MentionContext;
  metadata?: Record<string, unknown>;
  mentionType?: 'organic' | 'ai-response' | 'advertisement' | 'news';
}

// Filter for querying mentions
export interface MentionFilter {
  brandIds?: string[];
  platforms?: Platform[];
  dateFrom?: Date;
  dateTo?: Date;
  keywords?: string[];
  authors?: string[];
}

// Platform status
export interface PlatformStatus {
  platform: Platform;
  enabled: boolean;
  lastChecked: Date | null;
  mentionCount: number;
  errorCount: number;
}

// Tracking status
export interface TrackingStatus {
  brandId: string;
  isActive: boolean;
  lastCheck: Date | null;
  mentionsFound: number;
  startedAt: Date | null;
}

// Tracking result
export interface TrackingResult {
  processed: number;
  mentionsFound: number;
  errors: number;
  batches: number;
}

// Statistics
export interface MentionStatistics {
  totalMentions: number;
  byPlatform: Record<string, number>;
  byKeyword: Record<string, number>;
  dateRange: { start: Date; end: Date } | null;
}

// Velocity data
export interface VelocityData {
  mentionsPerHour: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  percentChange: number;
}

// Peak time data
export interface PeakTime {
  hour: number;
  count: number;
}

// Raw mention data from various sources
export interface RawMentionData {
  platform: Platform;
  content: string | null;
  author: string;
  timestamp?: Date;
  url?: string;
  metadata?: Record<string, unknown>;
}

// Platform-specific data types
export interface TwitterMentionData {
  id: string;
  text: string;
  user: { screen_name: string };
  created_at: string;
}

export interface LinkedInMentionData {
  id: string;
  text: string;
  author: string;
  created: { time: number };
}

export interface RedditMentionData {
  id: string;
  body: string;
  author: string;
  created_utc: number;
  subreddit: string;
}

export interface AIPlatformMentionData {
  query: string;
  response: string;
  platform: Platform;
  timestamp: Date;
}

/**
 * MentionTrackingService
 * Handles multi-platform mention tracking for brands
 */
export class MentionTrackingService extends EventEmitter {
  private config: MentionTrackingConfig;
  private brands: Map<string, BrandConfig> = new Map();
  private mentions: Map<string, Mention> = new Map();
  private platformStatus: Map<Platform, PlatformStatus> = new Map();
  private trackingStatus: Map<string, TrackingStatus> = new Map();
  private trackingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isShutdown: boolean = false;

  constructor(config: Partial<MentionTrackingConfig> = {}) {
    super();
    this.config = mentionTrackingConfigSchema.parse(config);
    this.initializePlatformStatus();
  }

  private initializePlatformStatus(): void {
    for (const platform of ALL_PLATFORMS) {
      this.platformStatus.set(platform, {
        platform,
        enabled: this.config.enabledPlatforms.includes(platform),
        lastChecked: null,
        mentionCount: 0,
        errorCount: 0,
      });
    }
  }

  // Configuration methods
  getConfig(): MentionTrackingConfig {
    return { ...this.config };
  }

  // Platform methods
  getSupportedPlatforms(): Platform[] {
    return [...ALL_PLATFORMS];
  }

  getPlatformCategories(): { social: Platform[]; ai: Platform[] } {
    return {
      social: [...SOCIAL_PLATFORMS],
      ai: [...AI_PLATFORMS],
    };
  }

  enablePlatform(platform: Platform): void {
    const status = this.platformStatus.get(platform);
    if (status) {
      status.enabled = true;
      if (!this.config.enabledPlatforms.includes(platform)) {
        this.config.enabledPlatforms.push(platform);
      }
    }
  }

  disablePlatform(platform: Platform): void {
    const status = this.platformStatus.get(platform);
    if (status) {
      status.enabled = false;
      this.config.enabledPlatforms = this.config.enabledPlatforms.filter(p => p !== platform);
    }
  }

  isPlatformEnabled(platform: Platform): boolean {
    return this.platformStatus.get(platform)?.enabled ?? false;
  }

  getPlatformStatus(platform: Platform): PlatformStatus {
    return this.platformStatus.get(platform) ?? {
      platform,
      enabled: false,
      lastChecked: null,
      mentionCount: 0,
      errorCount: 0,
    };
  }

  // Brand management
  addBrand(brand: BrandConfig): void {
    if (!brand.id || brand.id.trim() === '') {
      throw new Error('Brand ID is required');
    }
    if (!brand.name || brand.name.trim() === '') {
      throw new Error('Brand name is required');
    }
    if (!brand.keywords || brand.keywords.length === 0) {
      throw new Error('At least one keyword is required');
    }

    this.brands.set(brand.id, {
      ...brand,
      excludeKeywords: brand.excludeKeywords ?? [],
    });

    this.trackingStatus.set(brand.id, {
      brandId: brand.id,
      isActive: false,
      lastCheck: null,
      mentionsFound: 0,
      startedAt: null,
    });
  }

  removeBrand(brandId: string): void {
    this.brands.delete(brandId);
    this.trackingStatus.delete(brandId);
    this.stopTracking(brandId);
  }

  updateBrandKeywords(brandId: string, keywords: string[]): void {
    const brand = this.brands.get(brandId);
    if (brand) {
      brand.keywords = keywords;
    }
  }

  getBrand(brandId: string): BrandConfig | undefined {
    return this.brands.get(brandId);
  }

  getTrackedBrands(): BrandConfig[] {
    return Array.from(this.brands.values());
  }

  // Mention detection
  detectMentions(
    text: string,
    source: { platform: Platform; source: string; url?: string; metadata?: Record<string, unknown> }
  ): Mention[] {
    const detectedMentions: Mention[] = [];
    const lowerText = text.toLowerCase();

    for (const brand of Array.from(this.brands.values())) {
      // Check exclude keywords first
      const isExcluded = brand.excludeKeywords?.some(excludeKw =>
        lowerText.includes(excludeKw.toLowerCase())
      );

      if (isExcluded) {
        continue;
      }

      // Sort keywords by length (longest first) to match more specific phrases first
      const sortedKeywords = [...brand.keywords].sort((a, b) => b.length - a.length);

      // Check for keyword matches
      for (const keyword of sortedKeywords) {
        const lowerKeyword = keyword.toLowerCase();
        const index = lowerText.indexOf(lowerKeyword);

        if (index !== -1) {
          const contextStart = Math.max(0, index - this.config.contextWindowSize);
          const contextEnd = Math.min(text.length, index + keyword.length + this.config.contextWindowSize);

          const mention: Mention = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            brandId: brand.id,
            platform: source.platform,
            content: text,
            author: source.source,
            timestamp: new Date(),
            url: source.url,
            matchedKeyword: keyword.toLowerCase(),
            context: {
              before: text.substring(contextStart, index).trim(),
              after: text.substring(index + keyword.length, contextEnd).trim(),
              full: text.substring(contextStart, contextEnd),
            },
            metadata: source.metadata,
          };

          detectedMentions.push(mention);
          break; // Only count one match per brand per text
        }
      }
    }

    return detectedMentions;
  }

  // Mention storage
  storeMention(mention: Mention): void {
    this.mentions.set(mention.id, mention);

    // Update platform status
    const platformStatus = this.platformStatus.get(mention.platform);
    if (platformStatus) {
      platformStatus.mentionCount++;
      platformStatus.lastChecked = new Date();
    }

    // Update tracking status
    const trackingStatus = this.trackingStatus.get(mention.brandId);
    if (trackingStatus) {
      trackingStatus.mentionsFound++;
      trackingStatus.lastCheck = new Date();
    }

    this.emit('mention:new', mention);
  }

  getMention(mentionId: string): Mention | undefined {
    return this.mentions.get(mentionId);
  }

  getMentionsByBrand(brandId: string): Mention[] {
    return Array.from(this.mentions.values()).filter(m => m.brandId === brandId);
  }

  getMentionsByPlatform(platform: Platform): Mention[] {
    return Array.from(this.mentions.values()).filter(m => m.platform === platform);
  }

  getMentionsByDateRange(start: Date, end: Date): Mention[] {
    return Array.from(this.mentions.values()).filter(m =>
      m.timestamp >= start && m.timestamp <= end
    );
  }

  filterMentions(filter: MentionFilter): Mention[] {
    return Array.from(this.mentions.values()).filter(m => {
      if (filter.brandIds && !filter.brandIds.includes(m.brandId)) return false;
      if (filter.platforms && !filter.platforms.includes(m.platform)) return false;
      if (filter.dateFrom && m.timestamp < filter.dateFrom) return false;
      if (filter.dateTo && m.timestamp > filter.dateTo) return false;
      if (filter.keywords && !filter.keywords.some(kw => m.content.toLowerCase().includes(kw.toLowerCase()))) return false;
      if (filter.authors && !filter.authors.includes(m.author)) return false;
      return true;
    });
  }

  // Real-time tracking
  async startTracking(brandId: string): Promise<string> {
    const brand = this.brands.get(brandId);
    if (!brand) {
      throw new Error(`Brand not found: ${brandId}`);
    }

    const trackingId = `tracking-${brandId}-${Date.now()}`;

    const status = this.trackingStatus.get(brandId);
    if (status) {
      status.isActive = true;
      status.startedAt = new Date();
    }

    this.emit('tracking:started', { brandId, trackingId });

    return trackingId;
  }

  async stopTracking(brandId: string): Promise<void> {
    const interval = this.trackingIntervals.get(brandId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(brandId);
    }

    const status = this.trackingStatus.get(brandId);
    if (status) {
      status.isActive = false;
    }

    this.emit('tracking:stopped', { brandId });
  }

  isTracking(brandId: string): boolean {
    return this.trackingStatus.get(brandId)?.isActive ?? false;
  }

  getTrackingStatus(brandId: string): TrackingStatus {
    return this.trackingStatus.get(brandId) ?? {
      brandId,
      isActive: false,
      lastCheck: null,
      mentionsFound: 0,
      startedAt: null,
    };
  }

  // Process raw mention data and emit events
  processMentionData(data: RawMentionData): void {
    if (!data.content) return;

    const mentions = this.detectMentions(data.content, {
      platform: data.platform,
      source: data.author,
      url: data.url,
      metadata: data.metadata,
    });

    for (const mention of mentions) {
      if (data.timestamp) {
        mention.timestamp = data.timestamp;
      }
      this.storeMention(mention);
      this.emit('mention:found', mention);
    }
  }

  // Batch processing
  async processBatch(mentionData: RawMentionData[]): Promise<TrackingResult> {
    let processed = 0;
    let mentionsFound = 0;
    let errors = 0;
    const batchSize = this.config.maxMentionsPerBatch;
    const batches = Math.ceil(mentionData.length / batchSize);

    for (let i = 0; i < mentionData.length; i += batchSize) {
      const batch = mentionData.slice(i, i + batchSize);

      for (const data of batch) {
        processed++;
        try {
          if (!data.content) {
            errors++;
            continue;
          }

          const mentions = this.detectMentions(data.content, {
            platform: data.platform,
            source: data.author,
            url: data.url,
            metadata: data.metadata,
          });

          for (const mention of mentions) {
            if (data.timestamp) {
              mention.timestamp = data.timestamp;
            }
            this.storeMention(mention);
            mentionsFound++;
          }
        } catch (error) {
          errors++;
        }
      }
    }

    this.emit('batch:completed', { processed, mentionsFound, errors, batches });

    return { processed, mentionsFound, errors, batches };
  }

  // Platform-specific parsing
  parseTwitterMention(data: TwitterMentionData): Partial<Mention> {
    return {
      platform: 'twitter',
      content: data.text,
      author: data.user.screen_name,
      timestamp: new Date(data.created_at),
      url: `https://twitter.com/${data.user.screen_name}/status/${data.id}`,
    };
  }

  parseLinkedInMention(data: LinkedInMentionData): Partial<Mention> {
    return {
      platform: 'linkedin',
      content: data.text,
      author: data.author,
      timestamp: new Date(data.created.time),
      url: `https://linkedin.com/feed/update/${data.id}`,
    };
  }

  parseRedditMention(data: RedditMentionData): Partial<Mention> {
    return {
      platform: 'reddit',
      content: data.body,
      author: data.author,
      timestamp: new Date(data.created_utc * 1000),
      metadata: { subreddit: data.subreddit },
    };
  }

  parseAIPlatformMention(data: AIPlatformMentionData): Partial<Mention> & { mentionType: string } {
    return {
      platform: data.platform,
      content: `${data.query}\n\n${data.response}`,
      author: 'ai-system',
      timestamp: data.timestamp,
      mentionType: 'ai-response',
    };
  }

  // Statistics
  getMentionStatistics(brandId: string): MentionStatistics {
    const brandMentions = this.getMentionsByBrand(brandId);

    const byPlatform: Record<string, number> = {};
    const byKeyword: Record<string, number> = {};
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const mention of brandMentions) {
      // Count by platform
      byPlatform[mention.platform] = (byPlatform[mention.platform] || 0) + 1;

      // Count by keyword
      byKeyword[mention.matchedKeyword] = (byKeyword[mention.matchedKeyword] || 0) + 1;

      // Track date range
      if (!minDate || mention.timestamp < minDate) {
        minDate = mention.timestamp;
      }
      if (!maxDate || mention.timestamp > maxDate) {
        maxDate = mention.timestamp;
      }
    }

    return {
      totalMentions: brandMentions.length,
      byPlatform,
      byKeyword,
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null,
    };
  }

  calculateMentionVelocity(brandId: string, hours: number): VelocityData {
    const now = new Date();
    const cutoff = new Date(now.getTime() - hours * 3600000);
    const halfwayCutoff = new Date(now.getTime() - (hours / 2) * 3600000);

    const brandMentions = this.getMentionsByBrand(brandId);
    const recentMentions = brandMentions.filter(m => m.timestamp >= cutoff);

    const firstHalfMentions = recentMentions.filter(m => m.timestamp < halfwayCutoff);
    const secondHalfMentions = recentMentions.filter(m => m.timestamp >= halfwayCutoff);

    const mentionsPerHour = recentMentions.length / hours;

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    let percentChange = 0;

    if (firstHalfMentions.length > 0) {
      percentChange = ((secondHalfMentions.length - firstHalfMentions.length) / firstHalfMentions.length) * 100;

      if (percentChange > 10) {
        trend = 'increasing';
      } else if (percentChange < -10) {
        trend = 'decreasing';
      }
    }

    return { mentionsPerHour, trend, percentChange };
  }

  getPeakMentionTimes(brandId: string): PeakTime[] {
    const brandMentions = this.getMentionsByBrand(brandId);
    const hourCounts: Record<number, number> = {};

    for (const mention of brandMentions) {
      const hour = mention.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    const peakTimes = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);

    return peakTimes;
  }

  // Lifecycle
  shutdown(): void {
    this.isShutdown = true;

    // Stop all tracking
    for (const brandId of Array.from(this.trackingIntervals.keys())) {
      this.stopTracking(brandId);
    }

    // Clear all data
    this.brands.clear();
    this.mentions.clear();
    this.trackingStatus.clear();

    // Reset platform status
    for (const status of Array.from(this.platformStatus.values())) {
      status.enabled = false;
      status.mentionCount = 0;
      status.lastChecked = null;
    }

    this.emit('shutdown');
  }
}

/**
 * Factory function to create MentionTrackingService
 */
export function createMentionTrackingService(
  config: Partial<MentionTrackingConfig> = {}
): MentionTrackingService {
  return new MentionTrackingService(config);
}
