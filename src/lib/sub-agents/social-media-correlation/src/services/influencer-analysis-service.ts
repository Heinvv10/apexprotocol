/**
 * InfluencerAnalysisService
 * Identifies, scores, and tracks influencers across social and AI platforms
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Configuration schema
const influencerAnalysisConfigSchema = z.object({
  minFollowersThreshold: z.number().positive().default(1000),
  minEngagementRate: z.number().min(0).max(1).default(0.01),
  scoreWeights: z
    .object({
      reach: z.number().min(0).max(1).default(0.25),
      engagement: z.number().min(0).max(1).default(0.3),
      relevance: z.number().min(0).max(1).default(0.2),
      sentiment: z.number().min(0).max(1).default(0.15),
      consistency: z.number().min(0).max(1).default(0.1),
    })
    .default({
      reach: 0.25,
      engagement: 0.3,
      relevance: 0.2,
      sentiment: 0.15,
      consistency: 0.1,
    }),
  tierThresholds: z
    .object({
      mega: z.number().positive().default(1000000),
      macro: z.number().positive().default(100000),
      micro: z.number().positive().default(10000),
      nano: z.number().positive().default(1000),
    })
    .default({
      mega: 1000000,
      macro: 100000,
      micro: 10000,
      nano: 1000,
    }),
  trackingEnabled: z.boolean().default(true),
  batchSize: z.number().positive().int().default(100),
});

export type InfluencerAnalysisConfig = z.infer<typeof influencerAnalysisConfigSchema>;

export interface Mention {
  id: string;
  platform: string;
  brandId: string;
  content: string;
  author: string;
  timestamp: Date;
  sentiment?: number;
  reach?: number;
  engagement?: {
    likes: number;
    shares: number;
    comments: number;
  };
}

export interface Influencer {
  id: string;
  username: string;
  displayName: string;
  platform: string;
  followers: number;
  following: number;
  engagementRate: number;
  tier: 'mega' | 'macro' | 'micro' | 'nano';
  score: number;
  topics: string[];
  verified: boolean;
  profileUrl: string;
  bio?: string;
  location?: string;
  lastActive: Date;
}

export interface InfluencerMention {
  influencer: Influencer;
  mention: Mention;
  impact: {
    estimatedReach: number;
    engagementPotential: number;
    sentimentImpact: number;
  };
}

export interface InfluencerRelationship {
  influencerId: string;
  brandId: string;
  mentionCount: number;
  averageSentiment: number;
  relationship: 'advocate' | 'neutral' | 'critic';
  firstMention: Date;
  lastMention: Date;
  engagementHistory: number[];
}

export interface InfluencerComparison {
  influencers: Influencer[];
  rankings: {
    byReach: string[];
    byEngagement: string[];
    byRelevance: string[];
    bySentiment: string[];
  };
  recommendations: string[];
}

export interface InfluencerStats {
  totalInfluencersTracked: number;
  influencersByTier: {
    mega: number;
    macro: number;
    micro: number;
    nano: number;
  };
  averageEngagementRate: number;
  topInfluencerScore: number;
  processingTimeMs: number;
}

/**
 * InfluencerAnalysisService
 * Identifies, scores, and tracks influencers across social and AI platforms
 */
export class InfluencerAnalysisService extends EventEmitter {
  private config: InfluencerAnalysisConfig;
  private influencers: Map<string, Influencer> = new Map();
  private relationships: Map<string, InfluencerRelationship> = new Map();
  private stats: InfluencerStats = {
    totalInfluencersTracked: 0,
    influencersByTier: { mega: 0, macro: 0, micro: 0, nano: 0 },
    averageEngagementRate: 0,
    topInfluencerScore: 0,
    processingTimeMs: 0,
  };
  private isInitialized: boolean = false;

  constructor(config: Partial<InfluencerAnalysisConfig> = {}) {
    super();
    this.config = influencerAnalysisConfigSchema.parse(config);
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
    this.influencers.clear();
    this.relationships.clear();
    this.emit('shutdown');
  }

  getConfig(): InfluencerAnalysisConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<InfluencerAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  // Classify influencer tier based on follower count
  classifyTier(followers: number): Influencer['tier'] {
    const { mega, macro, micro } = this.config.tierThresholds;
    if (followers >= mega) return 'mega';
    if (followers >= macro) return 'macro';
    if (followers >= micro) return 'micro';
    return 'nano';
  }

  // Calculate influencer score based on configured weights
  calculateInfluencerScore(influencer: Influencer): number {
    const { reach, engagement, relevance, sentiment, consistency } = this.config.scoreWeights;

    // Normalize reach (0-100)
    const reachScore = Math.min(100, (influencer.followers / 1000000) * 100);

    // Engagement rate score (0-100)
    const engagementScore = Math.min(100, influencer.engagementRate * 1000);

    // Mock relevance and sentiment scores (in production, these would come from analysis)
    const relevanceScore = 70 + Math.random() * 30;
    const sentimentScore = 50 + Math.random() * 50;
    const consistencyScore = 60 + Math.random() * 40;

    return (
      reachScore * reach +
      engagementScore * engagement +
      relevanceScore * relevance +
      sentimentScore * sentiment +
      consistencyScore * consistency
    );
  }

  // Identify influencers from a list of mentions
  async identifyInfluencers(mentions: Mention[]): Promise<Influencer[]> {
    const startTime = Date.now();
    const authorMap = new Map<string, Mention[]>();

    // Group mentions by author
    mentions.forEach((m) => {
      if (!authorMap.has(m.author)) {
        authorMap.set(m.author, []);
      }
      authorMap.get(m.author)!.push(m);
    });

    const identified: Influencer[] = [];

    for (const [author, authorMentions] of Array.from(authorMap)) {
      const totalReach = authorMentions.reduce((sum, m) => sum + (m.reach || 0), 0);
      const avgReach = totalReach / authorMentions.length;

      if (avgReach >= this.config.minFollowersThreshold) {
        const followers = Math.round(avgReach * (1 + Math.random()));
        const tier = this.classifyTier(followers);

        const influencer: Influencer = {
          id: `inf-${author}-${Date.now()}`,
          username: author,
          displayName: author.charAt(0).toUpperCase() + author.slice(1),
          platform: authorMentions[0].platform,
          followers,
          following: Math.round(followers * 0.1),
          engagementRate: 0.02 + Math.random() * 0.08,
          tier,
          score: 0,
          topics: [],
          verified: followers > 100000,
          profileUrl: `https://${authorMentions[0].platform}.com/${author}`,
          lastActive: new Date(),
        };

        influencer.score = this.calculateInfluencerScore(influencer);
        this.influencers.set(influencer.id, influencer);
        identified.push(influencer);

        this.stats.influencersByTier[tier]++;
      }
    }

    // Update stats
    this.stats.totalInfluencersTracked += identified.length;
    if (identified.length > 0) {
      this.stats.averageEngagementRate =
        identified.reduce((sum, i) => sum + i.engagementRate, 0) / identified.length;
      this.stats.topInfluencerScore = Math.max(...identified.map((i) => i.score));
    }
    this.stats.processingTimeMs += Date.now() - startTime;

    this.emit('influencersIdentified', identified);
    return identified;
  }

  // Get influencer by ID
  async getInfluencer(id: string): Promise<Influencer | null> {
    return this.influencers.get(id) || null;
  }

  // Search influencers by various criteria
  async searchInfluencers(query: {
    platform?: string;
    tier?: Influencer['tier'];
    minFollowers?: number;
    topics?: string[];
  }): Promise<Influencer[]> {
    let results = Array.from(this.influencers.values());

    if (query.platform) {
      results = results.filter((i) => i.platform === query.platform);
    }
    if (query.tier) {
      results = results.filter((i) => i.tier === query.tier);
    }
    if (query.minFollowers) {
      results = results.filter((i) => i.followers >= query.minFollowers!);
    }
    if (query.topics && query.topics.length > 0) {
      results = results.filter((i) => i.topics.some((t) => query.topics!.includes(t)));
    }

    return results;
  }

  // Score influencer for a specific brand
  async scoreInfluencerForBrand(
    influencerId: string,
    brandId: string
  ): Promise<{
    score: number;
    relevance: number;
    sentiment: number;
    components: Record<string, number>;
  }> {
    const influencer = await this.getInfluencer(influencerId);
    if (!influencer) {
      throw new Error(`Influencer ${influencerId} not found`);
    }

    const baseScore = this.calculateInfluencerScore(influencer);
    const relevance = 0.5 + Math.random() * 0.5;
    const sentiment = 0.3 + Math.random() * 0.7;

    return {
      score: baseScore * relevance,
      relevance,
      sentiment,
      components: {
        reach: (influencer.followers / 1000000) * 100,
        engagement: influencer.engagementRate * 1000,
        brandAffinity: relevance * 100,
        sentimentAlignment: sentiment * 100,
      },
    };
  }

  // Rank influencers by score
  rankInfluencers(influencerList: Influencer[]): Influencer[] {
    return [...influencerList].sort((a, b) => b.score - a.score);
  }

  // Get influencers by tier
  async getInfluencersByTier(tier: Influencer['tier']): Promise<Influencer[]> {
    return Array.from(this.influencers.values()).filter((i) => i.tier === tier);
  }

  // Analyze a mention for influencer impact
  async analyzeInfluencerMention(mention: Mention): Promise<InfluencerMention | null> {
    // Find influencer by author
    const influencer = Array.from(this.influencers.values()).find((i) => i.username === mention.author);

    if (!influencer) return null;

    const impact = await this.calculateMentionImpact(influencer, mention);

    return {
      influencer,
      mention,
      impact,
    };
  }

  // Calculate the impact of a mention from an influencer
  async calculateMentionImpact(
    influencer: Influencer,
    mention: Mention
  ): Promise<{
    estimatedReach: number;
    engagementPotential: number;
    sentimentImpact: number;
  }> {
    const estimatedReach = influencer.followers * influencer.engagementRate;
    const engagementPotential = estimatedReach * 0.1;
    const sentimentImpact = ((mention.sentiment || 0) * influencer.score) / 100;

    return {
      estimatedReach: Math.round(estimatedReach),
      engagementPotential: Math.round(engagementPotential),
      sentimentImpact: Math.round(sentimentImpact * 100) / 100,
    };
  }

  // Track relationship between influencer and brand
  async trackRelationship(
    influencerId: string,
    brandId: string,
    mentions: Mention[]
  ): Promise<InfluencerRelationship> {
    const key = `${influencerId}-${brandId}`;
    const existing = this.relationships.get(key);

    const sentiments = mentions.map((m) => m.sentiment || 0);
    const avgSentiment =
      sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0;

    let relationshipType: 'advocate' | 'neutral' | 'critic' = 'neutral';
    if (avgSentiment > 0.3) relationshipType = 'advocate';
    else if (avgSentiment < -0.3) relationshipType = 'critic';

    const timestamps = mentions.map((m) => m.timestamp.getTime()).sort((a, b) => a - b);

    const relationship: InfluencerRelationship = {
      influencerId,
      brandId,
      mentionCount: mentions.length + (existing?.mentionCount || 0),
      averageSentiment: avgSentiment,
      relationship: relationshipType,
      firstMention: existing?.firstMention || new Date(timestamps[0] || Date.now()),
      lastMention: new Date(timestamps[timestamps.length - 1] || Date.now()),
      engagementHistory: mentions.map((m) => {
        const eng = m.engagement || { likes: 0, shares: 0, comments: 0 };
        return eng.likes + eng.shares + eng.comments;
      }),
    };

    this.relationships.set(key, relationship);
    this.emit('relationshipTracked', relationship);
    return relationship;
  }

  // Get relationship between influencer and brand
  async getRelationship(
    influencerId: string,
    brandId: string
  ): Promise<InfluencerRelationship | null> {
    return this.relationships.get(`${influencerId}-${brandId}`) || null;
  }

  // Identify brand advocates (positive sentiment influencers)
  async identifyAdvocates(brandId: string): Promise<Influencer[]> {
    const advocates: Influencer[] = [];

    for (const [, rel] of Array.from(this.relationships)) {
      if (rel.brandId === brandId && rel.relationship === 'advocate') {
        const influencer = await this.getInfluencer(rel.influencerId);
        if (influencer) advocates.push(influencer);
      }
    }

    return advocates;
  }

  // Identify brand critics (negative sentiment influencers)
  async identifyCritics(brandId: string): Promise<Influencer[]> {
    const critics: Influencer[] = [];

    for (const [, rel] of Array.from(this.relationships)) {
      if (rel.brandId === brandId && rel.relationship === 'critic') {
        const influencer = await this.getInfluencer(rel.influencerId);
        if (influencer) critics.push(influencer);
      }
    }

    return critics;
  }

  // Compare multiple influencers
  async compareInfluencers(influencerIds: string[]): Promise<InfluencerComparison> {
    const influencerList = await Promise.all(influencerIds.map((id) => this.getInfluencer(id)));

    const validInfluencers = influencerList.filter((i): i is Influencer => i !== null);

    const byReach = [...validInfluencers]
      .sort((a, b) => b.followers - a.followers)
      .map((i) => i.id);
    const byEngagement = [...validInfluencers]
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .map((i) => i.id);
    const byRelevance = [...validInfluencers].sort((a, b) => b.score - a.score).map((i) => i.id);
    const bySentiment = [...validInfluencers].sort((a, b) => b.score - a.score).map((i) => i.id);

    const recommendations: string[] = [];
    if (validInfluencers.length > 0) {
      const topByEngagement = validInfluencers.reduce((prev, curr) =>
        curr.engagementRate > prev.engagementRate ? curr : prev
      );
      recommendations.push(`Consider ${topByEngagement.displayName} for best engagement`);
    }

    return {
      influencers: validInfluencers,
      rankings: { byReach, byEngagement, byRelevance, bySentiment },
      recommendations,
    };
  }

  // Recommend influencers for a brand
  async recommendInfluencers(
    brandId: string,
    options: {
      tier?: Influencer['tier'];
      minScore?: number;
      limit?: number;
    } = {}
  ): Promise<Influencer[]> {
    const { tier, minScore = 0, limit = 10 } = options;

    let candidates = Array.from(this.influencers.values());

    if (tier) {
      candidates = candidates.filter((i) => i.tier === tier);
    }

    candidates = candidates.filter((i) => i.score >= minScore);
    candidates = this.rankInfluencers(candidates);

    return candidates.slice(0, limit);
  }

  // Analyze engagement patterns for an influencer
  async analyzeEngagementPatterns(influencerId: string): Promise<{
    peakHours: number[];
    peakDays: string[];
    contentTypes: Record<string, number>;
    averageEngagement: number;
  }> {
    // In production, this would analyze actual engagement data
    // For now, return mock patterns
    return {
      peakHours: [9, 12, 18, 21],
      peakDays: ['Tuesday', 'Thursday', 'Saturday'],
      contentTypes: {
        image: 45,
        video: 30,
        text: 20,
        link: 5,
      },
      averageEngagement: 1500 + Math.random() * 3000,
    };
  }

  // Predict engagement for content from an influencer
  async predictEngagement(
    influencerId: string,
    content: string
  ): Promise<{
    predictedLikes: number;
    predictedShares: number;
    predictedComments: number;
    confidence: number;
  }> {
    const influencer = await this.getInfluencer(influencerId);
    if (!influencer) {
      return {
        predictedLikes: 0,
        predictedShares: 0,
        predictedComments: 0,
        confidence: 0,
      };
    }

    const baseEngagement = influencer.followers * influencer.engagementRate;

    return {
      predictedLikes: Math.round(baseEngagement * 0.8),
      predictedShares: Math.round(baseEngagement * 0.1),
      predictedComments: Math.round(baseEngagement * 0.1),
      confidence: 0.7 + Math.random() * 0.2,
    };
  }

  // Get statistics
  getStats(): InfluencerStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      totalInfluencersTracked: 0,
      influencersByTier: { mega: 0, macro: 0, micro: 0, nano: 0 },
      averageEngagementRate: 0,
      topInfluencerScore: 0,
      processingTimeMs: 0,
    };
    this.influencers.clear();
    this.relationships.clear();
  }
}

/**
 * Factory function to create InfluencerAnalysisService
 */
export function createInfluencerAnalysisService(
  config: Partial<InfluencerAnalysisConfig> = {}
): InfluencerAnalysisService {
  return new InfluencerAnalysisService(config);
}
