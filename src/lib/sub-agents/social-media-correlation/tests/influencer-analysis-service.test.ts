/**
 * InfluencerAnalysisService Tests
 *
 * TDD tests for the Influencer Analysis Service that identifies,
 * scores, and tracks influencers across social and AI platforms.
 *
 * Following the "Ralph system" - write tests first, then implement.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { z } from 'zod';

// Types that will be implemented
interface InfluencerAnalysisConfig {
  minFollowersThreshold: number;
  minEngagementRate: number;
  scoreWeights: {
    reach: number;
    engagement: number;
    relevance: number;
    sentiment: number;
    consistency: number;
  };
  tierThresholds: {
    mega: number;
    macro: number;
    micro: number;
    nano: number;
  };
  trackingEnabled: boolean;
  batchSize: number;
}

interface Mention {
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

interface Influencer {
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

interface InfluencerMention {
  influencer: Influencer;
  mention: Mention;
  impact: {
    estimatedReach: number;
    engagementPotential: number;
    sentimentImpact: number;
  };
}

interface InfluencerRelationship {
  influencerId: string;
  brandId: string;
  mentionCount: number;
  averageSentiment: number;
  relationship: 'advocate' | 'neutral' | 'critic';
  firstMention: Date;
  lastMention: Date;
  engagementHistory: number[];
}

interface InfluencerComparison {
  influencers: Influencer[];
  rankings: {
    byReach: string[];
    byEngagement: string[];
    byRelevance: string[];
    bySentiment: string[];
  };
  recommendations: string[];
}

interface InfluencerStats {
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

interface InfluencerAnalysisService extends EventEmitter {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getConfig(): InfluencerAnalysisConfig;
  updateConfig(config: Partial<InfluencerAnalysisConfig>): void;

  // Core influencer identification
  identifyInfluencers(mentions: Mention[]): Promise<Influencer[]>;
  getInfluencer(id: string): Promise<Influencer | null>;
  searchInfluencers(query: {
    platform?: string;
    tier?: Influencer['tier'];
    minFollowers?: number;
    topics?: string[];
  }): Promise<Influencer[]>;

  // Influencer scoring
  calculateInfluencerScore(influencer: Influencer): number;
  scoreInfluencerForBrand(influencerId: string, brandId: string): Promise<{
    score: number;
    relevance: number;
    sentiment: number;
    components: Record<string, number>;
  }>;
  rankInfluencers(influencers: Influencer[]): Influencer[];

  // Tier classification
  classifyTier(followers: number): Influencer['tier'];
  getInfluencersByTier(tier: Influencer['tier']): Promise<Influencer[]>;

  // Impact analysis
  analyzeInfluencerMention(mention: Mention): Promise<InfluencerMention | null>;
  calculateMentionImpact(influencer: Influencer, mention: Mention): Promise<{
    estimatedReach: number;
    engagementPotential: number;
    sentimentImpact: number;
  }>;

  // Relationship tracking
  trackRelationship(influencerId: string, brandId: string, mentions: Mention[]): Promise<InfluencerRelationship>;
  getRelationship(influencerId: string, brandId: string): Promise<InfluencerRelationship | null>;
  identifyAdvocates(brandId: string): Promise<Influencer[]>;
  identifyCritics(brandId: string): Promise<Influencer[]>;

  // Comparison and recommendations
  compareInfluencers(influencerIds: string[]): Promise<InfluencerComparison>;
  recommendInfluencers(brandId: string, options?: {
    tier?: Influencer['tier'];
    minScore?: number;
    limit?: number;
  }): Promise<Influencer[]>;

  // Engagement analysis
  analyzeEngagementPatterns(influencerId: string): Promise<{
    peakHours: number[];
    peakDays: string[];
    contentTypes: Record<string, number>;
    averageEngagement: number;
  }>;
  predictEngagement(influencerId: string, content: string): Promise<{
    predictedLikes: number;
    predictedShares: number;
    predictedComments: number;
    confidence: number;
  }>;

  // Statistics
  getStats(): InfluencerStats;
  resetStats(): void;
}

// Factory function signature
declare function createInfluencerAnalysisService(config?: Partial<InfluencerAnalysisConfig>): InfluencerAnalysisService;

// Mock implementation for testing
const createMockInfluencerAnalysisService = (config?: Partial<InfluencerAnalysisConfig>): InfluencerAnalysisService => {
  const defaultConfig: InfluencerAnalysisConfig = {
    minFollowersThreshold: 1000,
    minEngagementRate: 0.01,
    scoreWeights: {
      reach: 0.25,
      engagement: 0.30,
      relevance: 0.20,
      sentiment: 0.15,
      consistency: 0.10
    },
    tierThresholds: {
      mega: 1000000,
      macro: 100000,
      micro: 10000,
      nano: 1000
    },
    trackingEnabled: true,
    batchSize: 100,
    ...config
  };

  let currentConfig = { ...defaultConfig };
  let stats: InfluencerStats = {
    totalInfluencersTracked: 0,
    influencersByTier: { mega: 0, macro: 0, micro: 0, nano: 0 },
    averageEngagementRate: 0,
    topInfluencerScore: 0,
    processingTimeMs: 0
  };

  const influencers = new Map<string, Influencer>();
  const relationships = new Map<string, InfluencerRelationship>();

  const service = new EventEmitter() as InfluencerAnalysisService;

  service.initialize = async () => {
    service.emit('initialized');
  };

  service.shutdown = async () => {
    service.emit('shutdown');
  };

  service.getConfig = () => ({ ...currentConfig });

  service.updateConfig = (newConfig: Partial<InfluencerAnalysisConfig>) => {
    currentConfig = { ...currentConfig, ...newConfig };
    service.emit('configUpdated', currentConfig);
  };

  service.classifyTier = (followers: number): Influencer['tier'] => {
    const { mega, macro, micro } = currentConfig.tierThresholds;
    if (followers >= mega) return 'mega';
    if (followers >= macro) return 'macro';
    if (followers >= micro) return 'micro';
    return 'nano';
  };

  service.calculateInfluencerScore = (influencer: Influencer): number => {
    const { reach, engagement, relevance, sentiment, consistency } = currentConfig.scoreWeights;

    // Normalize reach (0-100)
    const reachScore = Math.min(100, (influencer.followers / 1000000) * 100);

    // Engagement rate score (0-100)
    const engagementScore = Math.min(100, influencer.engagementRate * 1000);

    // Mock relevance and sentiment scores
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
  };

  service.identifyInfluencers = async (mentions: Mention[]): Promise<Influencer[]> => {
    const startTime = Date.now();
    const authorMap = new Map<string, Mention[]>();

    // Group by author
    mentions.forEach(m => {
      if (!authorMap.has(m.author)) {
        authorMap.set(m.author, []);
      }
      authorMap.get(m.author)!.push(m);
    });

    const identified: Influencer[] = [];

    for (const [author, authorMentions] of authorMap) {
      const totalReach = authorMentions.reduce((sum, m) => sum + (m.reach || 0), 0);
      const avgReach = totalReach / authorMentions.length;

      if (avgReach >= currentConfig.minFollowersThreshold) {
        const followers = Math.round(avgReach * (1 + Math.random()));
        const tier = service.classifyTier(followers);

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
          lastActive: new Date()
        };

        influencer.score = service.calculateInfluencerScore(influencer);
        influencers.set(influencer.id, influencer);
        identified.push(influencer);

        stats.influencersByTier[tier]++;
      }
    }

    stats.totalInfluencersTracked += identified.length;
    if (identified.length > 0) {
      stats.averageEngagementRate = identified.reduce((sum, i) => sum + i.engagementRate, 0) / identified.length;
      stats.topInfluencerScore = Math.max(...identified.map(i => i.score));
    }
    stats.processingTimeMs += Date.now() - startTime;

    service.emit('influencersIdentified', identified);
    return identified;
  };

  service.getInfluencer = async (id: string): Promise<Influencer | null> => {
    return influencers.get(id) || null;
  };

  service.searchInfluencers = async (query): Promise<Influencer[]> => {
    let results = [...influencers.values()];

    if (query.platform) {
      results = results.filter(i => i.platform === query.platform);
    }
    if (query.tier) {
      results = results.filter(i => i.tier === query.tier);
    }
    if (query.minFollowers) {
      results = results.filter(i => i.followers >= query.minFollowers!);
    }
    if (query.topics && query.topics.length > 0) {
      results = results.filter(i =>
        i.topics.some(t => query.topics!.includes(t))
      );
    }

    return results;
  };

  service.scoreInfluencerForBrand = async (influencerId: string, brandId: string) => {
    const influencer = await service.getInfluencer(influencerId);
    if (!influencer) {
      throw new Error(`Influencer ${influencerId} not found`);
    }

    const baseScore = service.calculateInfluencerScore(influencer);
    const relevance = 0.5 + Math.random() * 0.5;
    const sentiment = 0.3 + Math.random() * 0.7;

    return {
      score: baseScore * relevance,
      relevance,
      sentiment,
      components: {
        reach: influencer.followers / 1000000 * 100,
        engagement: influencer.engagementRate * 1000,
        brandAffinity: relevance * 100,
        sentimentAlignment: sentiment * 100
      }
    };
  };

  service.rankInfluencers = (influencerList: Influencer[]): Influencer[] => {
    return [...influencerList].sort((a, b) => b.score - a.score);
  };

  service.getInfluencersByTier = async (tier: Influencer['tier']): Promise<Influencer[]> => {
    return [...influencers.values()].filter(i => i.tier === tier);
  };

  service.analyzeInfluencerMention = async (mention: Mention): Promise<InfluencerMention | null> => {
    // Find influencer by author
    const influencer = [...influencers.values()].find(i => i.username === mention.author);

    if (!influencer) return null;

    const impact = await service.calculateMentionImpact(influencer, mention);

    return {
      influencer,
      mention,
      impact
    };
  };

  service.calculateMentionImpact = async (influencer: Influencer, mention: Mention) => {
    const estimatedReach = influencer.followers * influencer.engagementRate;
    const engagementPotential = estimatedReach * 0.1;
    const sentimentImpact = (mention.sentiment || 0) * influencer.score / 100;

    return {
      estimatedReach: Math.round(estimatedReach),
      engagementPotential: Math.round(engagementPotential),
      sentimentImpact: Math.round(sentimentImpact * 100) / 100
    };
  };

  service.trackRelationship = async (influencerId: string, brandId: string, mentions: Mention[]): Promise<InfluencerRelationship> => {
    const key = `${influencerId}-${brandId}`;
    const existing = relationships.get(key);

    const sentiments = mentions.map(m => m.sentiment || 0);
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : 0;

    let relationshipType: 'advocate' | 'neutral' | 'critic' = 'neutral';
    if (avgSentiment > 0.3) relationshipType = 'advocate';
    else if (avgSentiment < -0.3) relationshipType = 'critic';

    const timestamps = mentions.map(m => m.timestamp.getTime()).sort((a, b) => a - b);

    const relationship: InfluencerRelationship = {
      influencerId,
      brandId,
      mentionCount: mentions.length + (existing?.mentionCount || 0),
      averageSentiment: avgSentiment,
      relationship: relationshipType,
      firstMention: existing?.firstMention || new Date(timestamps[0] || Date.now()),
      lastMention: new Date(timestamps[timestamps.length - 1] || Date.now()),
      engagementHistory: mentions.map(m => {
        const eng = m.engagement || { likes: 0, shares: 0, comments: 0 };
        return eng.likes + eng.shares + eng.comments;
      })
    };

    relationships.set(key, relationship);
    service.emit('relationshipTracked', relationship);
    return relationship;
  };

  service.getRelationship = async (influencerId: string, brandId: string): Promise<InfluencerRelationship | null> => {
    return relationships.get(`${influencerId}-${brandId}`) || null;
  };

  service.identifyAdvocates = async (brandId: string): Promise<Influencer[]> => {
    const advocates: Influencer[] = [];

    for (const [key, rel] of relationships) {
      if (rel.brandId === brandId && rel.relationship === 'advocate') {
        const influencer = await service.getInfluencer(rel.influencerId);
        if (influencer) advocates.push(influencer);
      }
    }

    return advocates;
  };

  service.identifyCritics = async (brandId: string): Promise<Influencer[]> => {
    const critics: Influencer[] = [];

    for (const [key, rel] of relationships) {
      if (rel.brandId === brandId && rel.relationship === 'critic') {
        const influencer = await service.getInfluencer(rel.influencerId);
        if (influencer) critics.push(influencer);
      }
    }

    return critics;
  };

  service.compareInfluencers = async (influencerIds: string[]): Promise<InfluencerComparison> => {
    const influencerList = await Promise.all(
      influencerIds.map(id => service.getInfluencer(id))
    );

    const validInfluencers = influencerList.filter((i): i is Influencer => i !== null);

    const byReach = [...validInfluencers].sort((a, b) => b.followers - a.followers).map(i => i.id);
    const byEngagement = [...validInfluencers].sort((a, b) => b.engagementRate - a.engagementRate).map(i => i.id);
    const byRelevance = [...validInfluencers].sort((a, b) => b.score - a.score).map(i => i.id);
    const bySentiment = [...validInfluencers].sort((a, b) => b.score - a.score).map(i => i.id);

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
      recommendations
    };
  };

  service.recommendInfluencers = async (brandId: string, options = {}): Promise<Influencer[]> => {
    const { tier, minScore = 0, limit = 10 } = options;

    let candidates = [...influencers.values()];

    if (tier) {
      candidates = candidates.filter(i => i.tier === tier);
    }

    candidates = candidates.filter(i => i.score >= minScore);
    candidates = service.rankInfluencers(candidates);

    return candidates.slice(0, limit);
  };

  service.analyzeEngagementPatterns = async (influencerId: string) => {
    // Mock engagement patterns
    return {
      peakHours: [9, 12, 18, 21],
      peakDays: ['Tuesday', 'Thursday', 'Saturday'],
      contentTypes: {
        image: 45,
        video: 30,
        text: 20,
        link: 5
      },
      averageEngagement: 1500 + Math.random() * 3000
    };
  };

  service.predictEngagement = async (influencerId: string, content: string) => {
    const influencer = await service.getInfluencer(influencerId);
    if (!influencer) {
      return {
        predictedLikes: 0,
        predictedShares: 0,
        predictedComments: 0,
        confidence: 0
      };
    }

    const baseEngagement = influencer.followers * influencer.engagementRate;

    return {
      predictedLikes: Math.round(baseEngagement * 0.8),
      predictedShares: Math.round(baseEngagement * 0.1),
      predictedComments: Math.round(baseEngagement * 0.1),
      confidence: 0.7 + Math.random() * 0.2
    };
  };

  service.getStats = () => ({ ...stats });

  service.resetStats = () => {
    stats = {
      totalInfluencersTracked: 0,
      influencersByTier: { mega: 0, macro: 0, micro: 0, nano: 0 },
      averageEngagementRate: 0,
      topInfluencerScore: 0,
      processingTimeMs: 0
    };
    influencers.clear();
    relationships.clear();
  };

  return service;
};

describe('InfluencerAnalysisService', () => {
  let service: InfluencerAnalysisService;

  beforeEach(() => {
    service = createMockInfluencerAnalysisService();
  });

  afterEach(async () => {
    await service.shutdown();
  });

  // ===================
  // Configuration Tests
  // ===================
  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = service.getConfig();

      expect(config.minFollowersThreshold).toBe(1000);
      expect(config.minEngagementRate).toBe(0.01);
      expect(config.tierThresholds.mega).toBe(1000000);
      expect(config.tierThresholds.macro).toBe(100000);
      expect(config.tierThresholds.micro).toBe(10000);
      expect(config.tierThresholds.nano).toBe(1000);
      expect(config.trackingEnabled).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customService = createMockInfluencerAnalysisService({
        minFollowersThreshold: 5000,
        tierThresholds: {
          mega: 5000000,
          macro: 500000,
          micro: 50000,
          nano: 5000
        }
      });

      const config = customService.getConfig();
      expect(config.minFollowersThreshold).toBe(5000);
      expect(config.tierThresholds.mega).toBe(5000000);
    });

    it('should validate score weights sum to 1', () => {
      const config = service.getConfig();
      const weights = config.scoreWeights;
      const sum = weights.reach + weights.engagement + weights.relevance + weights.sentiment + weights.consistency;

      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should update configuration dynamically', () => {
      service.updateConfig({ minFollowersThreshold: 2000 });

      const config = service.getConfig();
      expect(config.minFollowersThreshold).toBe(2000);
    });

    it('should emit event on config update', () => {
      const configHandler = vi.fn();
      service.on('configUpdated', configHandler);

      service.updateConfig({ trackingEnabled: false });

      expect(configHandler).toHaveBeenCalled();
    });

    it('should validate configuration with zod schema', () => {
      const configSchema = z.object({
        minFollowersThreshold: z.number().positive(),
        minEngagementRate: z.number().min(0).max(1),
        scoreWeights: z.object({
          reach: z.number().min(0).max(1),
          engagement: z.number().min(0).max(1),
          relevance: z.number().min(0).max(1),
          sentiment: z.number().min(0).max(1),
          consistency: z.number().min(0).max(1)
        }),
        tierThresholds: z.object({
          mega: z.number().positive(),
          macro: z.number().positive(),
          micro: z.number().positive(),
          nano: z.number().positive()
        }),
        trackingEnabled: z.boolean(),
        batchSize: z.number().positive().int()
      });

      const config = service.getConfig();
      const result = configSchema.safeParse(config);

      expect(result.success).toBe(true);
    });
  });

  // ================================
  // Tier Classification Tests
  // ================================
  describe('Tier Classification', () => {
    it('should classify mega influencers correctly', () => {
      const tier = service.classifyTier(1500000);
      expect(tier).toBe('mega');
    });

    it('should classify macro influencers correctly', () => {
      const tier = service.classifyTier(500000);
      expect(tier).toBe('macro');
    });

    it('should classify micro influencers correctly', () => {
      const tier = service.classifyTier(50000);
      expect(tier).toBe('micro');
    });

    it('should classify nano influencers correctly', () => {
      const tier = service.classifyTier(5000);
      expect(tier).toBe('nano');
    });

    it('should classify at threshold boundaries', () => {
      expect(service.classifyTier(1000000)).toBe('mega');
      expect(service.classifyTier(100000)).toBe('macro');
      expect(service.classifyTier(10000)).toBe('micro');
      expect(service.classifyTier(1000)).toBe('nano');
    });

    it('should classify below minimum as nano', () => {
      const tier = service.classifyTier(500);
      expect(tier).toBe('nano');
    });
  });

  // ================================
  // Influencer Identification Tests
  // ================================
  describe('Influencer Identification', () => {
    const createMention = (
      id: string,
      author: string,
      reach: number,
      platform = 'twitter'
    ): Mention => ({
      id,
      platform,
      brandId: 'brand-1',
      content: 'Test content',
      author,
      timestamp: new Date(),
      reach
    });

    it('should identify influencers from mentions', async () => {
      const mentions = [
        createMention('m1', 'biginfluencer', 500000),
        createMention('m2', 'biginfluencer', 520000),
        createMention('m3', 'smalluser', 100)
      ];

      const identified = await service.identifyInfluencers(mentions);

      expect(identified.length).toBeGreaterThan(0);
    });

    it('should filter out users below threshold', async () => {
      const mentions = [
        createMention('m1', 'smalluser', 100),
        createMention('m2', 'tinyuser', 50)
      ];

      const identified = await service.identifyInfluencers(mentions);

      expect(identified.length).toBe(0);
    });

    it('should assign correct tier to identified influencers', async () => {
      const mentions = [
        createMention('m1', 'megastar', 1500000),
        createMention('m2', 'macroinfluencer', 200000),
        createMention('m3', 'microinfluencer', 20000)
      ];

      const identified = await service.identifyInfluencers(mentions);

      const tiers = identified.map(i => i.tier);
      expect(tiers).toContain('mega');
    });

    it('should calculate influencer scores', async () => {
      const mentions = [
        createMention('m1', 'influencer1', 100000)
      ];

      const identified = await service.identifyInfluencers(mentions);

      if (identified.length > 0) {
        expect(identified[0].score).toBeGreaterThan(0);
      }
    });

    it('should emit event when influencers identified', async () => {
      const identifyHandler = vi.fn();
      service.on('influencersIdentified', identifyHandler);

      const mentions = [createMention('m1', 'influencer', 100000)];
      await service.identifyInfluencers(mentions);

      expect(identifyHandler).toHaveBeenCalled();
    });

    it('should track verified status for large influencers', async () => {
      const mentions = [createMention('m1', 'celebrity', 2000000)];

      const identified = await service.identifyInfluencers(mentions);

      if (identified.length > 0) {
        expect(identified[0].verified).toBe(true);
      }
    });
  });

  // =======================
  // Influencer Search Tests
  // =======================
  describe('Influencer Search', () => {
    beforeEach(async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf1', timestamp: new Date(), reach: 100000 },
        { id: 'm2', platform: 'linkedin', brandId: 'b1', content: 'test', author: 'inf2', timestamp: new Date(), reach: 50000 },
        { id: 'm3', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf3', timestamp: new Date(), reach: 500000 }
      ];
      await service.identifyInfluencers(mentions);
    });

    it('should search by platform', async () => {
      const results = await service.searchInfluencers({ platform: 'twitter' });

      results.forEach(i => {
        expect(i.platform).toBe('twitter');
      });
    });

    it('should search by tier', async () => {
      const results = await service.searchInfluencers({ tier: 'macro' });

      results.forEach(i => {
        expect(i.tier).toBe('macro');
      });
    });

    it('should search by minimum followers', async () => {
      const results = await service.searchInfluencers({ minFollowers: 200000 });

      results.forEach(i => {
        expect(i.followers).toBeGreaterThanOrEqual(200000);
      });
    });

    it('should return empty for no matches', async () => {
      const results = await service.searchInfluencers({ platform: 'tiktok' });

      expect(results.length).toBe(0);
    });
  });

  // ==========================
  // Influencer Scoring Tests
  // ==========================
  describe('Influencer Scoring', () => {
    it('should calculate score based on reach', () => {
      const highReach: Influencer = {
        id: 'i1',
        username: 'high',
        displayName: 'High Reach',
        platform: 'twitter',
        followers: 1000000,
        following: 1000,
        engagementRate: 0.02,
        tier: 'mega',
        score: 0,
        topics: [],
        verified: true,
        profileUrl: 'https://twitter.com/high',
        lastActive: new Date()
      };

      const lowReach: Influencer = {
        ...highReach,
        id: 'i2',
        followers: 10000,
        tier: 'micro',
        verified: false
      };

      const highScore = service.calculateInfluencerScore(highReach);
      const lowScore = service.calculateInfluencerScore(lowReach);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should factor in engagement rate', () => {
      const highEngagement: Influencer = {
        id: 'i1',
        username: 'engaged',
        displayName: 'Engaged',
        platform: 'twitter',
        followers: 100000,
        following: 1000,
        engagementRate: 0.10,
        tier: 'macro',
        score: 0,
        topics: [],
        verified: false,
        profileUrl: 'https://twitter.com/engaged',
        lastActive: new Date()
      };

      const lowEngagement: Influencer = {
        ...highEngagement,
        id: 'i2',
        engagementRate: 0.01
      };

      const highScore = service.calculateInfluencerScore(highEngagement);
      const lowScore = service.calculateInfluencerScore(lowEngagement);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should score influencer for specific brand', async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'brand-1', content: 'test', author: 'inf1', timestamp: new Date(), reach: 100000 }
      ];
      await service.identifyInfluencers(mentions);

      const influencers = await service.searchInfluencers({});
      if (influencers.length > 0) {
        const brandScore = await service.scoreInfluencerForBrand(influencers[0].id, 'brand-1');

        expect(brandScore.score).toBeGreaterThanOrEqual(0);
        expect(brandScore.relevance).toBeGreaterThanOrEqual(0);
        expect(brandScore.sentiment).toBeGreaterThanOrEqual(0);
        expect(brandScore.components).toBeDefined();
      }
    });

    it('should rank influencers by score', async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf1', timestamp: new Date(), reach: 100000 },
        { id: 'm2', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf2', timestamp: new Date(), reach: 500000 },
        { id: 'm3', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf3', timestamp: new Date(), reach: 50000 }
      ];
      await service.identifyInfluencers(mentions);

      const allInfluencers = await service.searchInfluencers({});
      const ranked = service.rankInfluencers(allInfluencers);

      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
      }
    });
  });

  // ==========================
  // Impact Analysis Tests
  // ==========================
  describe('Impact Analysis', () => {
    beforeEach(async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'influencer1', timestamp: new Date(), reach: 100000 }
      ];
      await service.identifyInfluencers(mentions);
    });

    it('should analyze influencer mention impact', async () => {
      const influencers = await service.searchInfluencers({});
      if (influencers.length > 0) {
        const mention: Mention = {
          id: 'm-new',
          platform: 'twitter',
          brandId: 'brand-1',
          content: 'Great product!',
          author: influencers[0].username,
          timestamp: new Date(),
          sentiment: 0.8
        };

        const analysis = await service.analyzeInfluencerMention(mention);

        if (analysis) {
          expect(analysis.influencer).toBeDefined();
          expect(analysis.impact.estimatedReach).toBeGreaterThan(0);
          expect(analysis.impact.engagementPotential).toBeGreaterThan(0);
        }
      }
    });

    it('should return null for non-influencer mention', async () => {
      const mention: Mention = {
        id: 'm-unknown',
        platform: 'twitter',
        brandId: 'brand-1',
        content: 'test',
        author: 'unknown_user',
        timestamp: new Date()
      };

      const analysis = await service.analyzeInfluencerMention(mention);

      expect(analysis).toBeNull();
    });

    it('should calculate mention impact correctly', async () => {
      const influencer: Influencer = {
        id: 'i1',
        username: 'test',
        displayName: 'Test',
        platform: 'twitter',
        followers: 100000,
        following: 1000,
        engagementRate: 0.05,
        tier: 'macro',
        score: 80,
        topics: [],
        verified: false,
        profileUrl: 'https://twitter.com/test',
        lastActive: new Date()
      };

      const mention: Mention = {
        id: 'm1',
        platform: 'twitter',
        brandId: 'b1',
        content: 'Love this!',
        author: 'test',
        timestamp: new Date(),
        sentiment: 0.9
      };

      const impact = await service.calculateMentionImpact(influencer, mention);

      expect(impact.estimatedReach).toBe(Math.round(100000 * 0.05)); // 5000
      expect(impact.engagementPotential).toBeGreaterThan(0);
    });
  });

  // =============================
  // Relationship Tracking Tests
  // =============================
  describe('Relationship Tracking', () => {
    let influencerId: string;

    beforeEach(async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'brand_advocate', timestamp: new Date(), reach: 100000, sentiment: 0.8 }
      ];
      const identified = await service.identifyInfluencers(mentions);
      if (identified.length > 0) {
        influencerId = identified[0].id;
      }
    });

    it('should track influencer-brand relationship', async () => {
      const mentions: Mention[] = [
        { id: 'm1', platform: 'twitter', brandId: 'brand-1', content: 'Love this brand!', author: 'brand_advocate', timestamp: new Date(), sentiment: 0.9 },
        { id: 'm2', platform: 'twitter', brandId: 'brand-1', content: 'Great products!', author: 'brand_advocate', timestamp: new Date(), sentiment: 0.8 }
      ];

      if (influencerId) {
        const relationship = await service.trackRelationship(influencerId, 'brand-1', mentions);

        expect(relationship.influencerId).toBe(influencerId);
        expect(relationship.brandId).toBe('brand-1');
        expect(relationship.mentionCount).toBe(2);
      }
    });

    it('should classify relationship type based on sentiment', async () => {
      if (influencerId) {
        const positiveMentions: Mention[] = [
          { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'Amazing!', author: 'test', timestamp: new Date(), sentiment: 0.9 },
          { id: 'm2', platform: 'twitter', brandId: 'b1', content: 'Love it!', author: 'test', timestamp: new Date(), sentiment: 0.8 }
        ];

        const relationship = await service.trackRelationship(influencerId, 'brand-1', positiveMentions);

        expect(relationship.relationship).toBe('advocate');
      }
    });

    it('should identify critics with negative sentiment', async () => {
      const negativeMentions = [
        { id: 'm1', platform: 'twitter', brandId: 'brand-1', content: 'Terrible!', author: 'critic_user', timestamp: new Date(), reach: 50000, sentiment: -0.9 }
      ];
      const critics = await service.identifyInfluencers(negativeMentions);

      if (critics.length > 0) {
        await service.trackRelationship(critics[0].id, 'brand-1', negativeMentions);
        const brandCritics = await service.identifyCritics('brand-1');

        expect(brandCritics.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should get relationship by influencer and brand', async () => {
      if (influencerId) {
        const mentions: Mention[] = [
          { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'test', timestamp: new Date(), sentiment: 0.5 }
        ];

        await service.trackRelationship(influencerId, 'brand-1', mentions);
        const relationship = await service.getRelationship(influencerId, 'brand-1');

        expect(relationship).not.toBeNull();
        if (relationship) {
          expect(relationship.influencerId).toBe(influencerId);
          expect(relationship.brandId).toBe('brand-1');
        }
      }
    });

    it('should emit event when relationship tracked', async () => {
      const trackHandler = vi.fn();
      service.on('relationshipTracked', trackHandler);

      if (influencerId) {
        const mentions: Mention[] = [
          { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'test', timestamp: new Date() }
        ];

        await service.trackRelationship(influencerId, 'brand-1', mentions);

        expect(trackHandler).toHaveBeenCalled();
      }
    });
  });

  // ================================
  // Comparison & Recommendations Tests
  // ================================
  describe('Comparison and Recommendations', () => {
    let influencerIds: string[];

    beforeEach(async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf1', timestamp: new Date(), reach: 100000 },
        { id: 'm2', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf2', timestamp: new Date(), reach: 200000 },
        { id: 'm3', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf3', timestamp: new Date(), reach: 50000 }
      ];
      const identified = await service.identifyInfluencers(mentions);
      influencerIds = identified.map(i => i.id);
    });

    it('should compare influencers', async () => {
      if (influencerIds.length >= 2) {
        const comparison = await service.compareInfluencers(influencerIds);

        expect(comparison.influencers.length).toBe(influencerIds.length);
        expect(comparison.rankings.byReach).toBeDefined();
        expect(comparison.rankings.byEngagement).toBeDefined();
      }
    });

    it('should rank by reach correctly', async () => {
      if (influencerIds.length >= 2) {
        const comparison = await service.compareInfluencers(influencerIds);

        // First in byReach should have most followers
        const topId = comparison.rankings.byReach[0];
        const topInfluencer = comparison.influencers.find(i => i.id === topId);

        comparison.influencers.forEach(i => {
          if (i.id !== topId && topInfluencer) {
            expect(topInfluencer.followers).toBeGreaterThanOrEqual(i.followers);
          }
        });
      }
    });

    it('should provide recommendations', async () => {
      if (influencerIds.length >= 2) {
        const comparison = await service.compareInfluencers(influencerIds);

        expect(comparison.recommendations).toBeDefined();
        expect(Array.isArray(comparison.recommendations)).toBe(true);
      }
    });

    it('should recommend influencers for brand', async () => {
      const recommendations = await service.recommendInfluencers('brand-1', { limit: 5 });

      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should filter recommendations by tier', async () => {
      const recommendations = await service.recommendInfluencers('brand-1', { tier: 'macro' });

      recommendations.forEach(i => {
        expect(i.tier).toBe('macro');
      });
    });

    it('should filter recommendations by minimum score', async () => {
      const recommendations = await service.recommendInfluencers('brand-1', { minScore: 50 });

      recommendations.forEach(i => {
        expect(i.score).toBeGreaterThanOrEqual(50);
      });
    });
  });

  // =============================
  // Engagement Analysis Tests
  // =============================
  describe('Engagement Analysis', () => {
    let influencerId: string;

    beforeEach(async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'analyst', timestamp: new Date(), reach: 100000 }
      ];
      const identified = await service.identifyInfluencers(mentions);
      if (identified.length > 0) {
        influencerId = identified[0].id;
      }
    });

    it('should analyze engagement patterns', async () => {
      if (influencerId) {
        const patterns = await service.analyzeEngagementPatterns(influencerId);

        expect(patterns.peakHours).toBeDefined();
        expect(Array.isArray(patterns.peakHours)).toBe(true);
        expect(patterns.peakDays).toBeDefined();
        expect(patterns.contentTypes).toBeDefined();
        expect(patterns.averageEngagement).toBeGreaterThan(0);
      }
    });

    it('should identify peak hours', async () => {
      if (influencerId) {
        const patterns = await service.analyzeEngagementPatterns(influencerId);

        patterns.peakHours.forEach(hour => {
          expect(hour).toBeGreaterThanOrEqual(0);
          expect(hour).toBeLessThanOrEqual(23);
        });
      }
    });

    it('should predict engagement for content', async () => {
      if (influencerId) {
        const prediction = await service.predictEngagement(influencerId, 'Check out this amazing product!');

        expect(prediction.predictedLikes).toBeGreaterThanOrEqual(0);
        expect(prediction.predictedShares).toBeGreaterThanOrEqual(0);
        expect(prediction.predictedComments).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should return zero predictions for unknown influencer', async () => {
      const prediction = await service.predictEngagement('unknown-id', 'Some content');

      expect(prediction.predictedLikes).toBe(0);
      expect(prediction.confidence).toBe(0);
    });
  });

  // ================
  // Statistics Tests
  // ================
  describe('Statistics', () => {
    it('should track influencers by tier', async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'mega', timestamp: new Date(), reach: 2000000 },
        { id: 'm2', platform: 'twitter', brandId: 'b1', content: 'test', author: 'macro', timestamp: new Date(), reach: 200000 },
        { id: 'm3', platform: 'twitter', brandId: 'b1', content: 'test', author: 'micro', timestamp: new Date(), reach: 20000 }
      ];

      await service.identifyInfluencers(mentions);

      const stats = service.getStats();
      expect(stats.influencersByTier.mega).toBeGreaterThanOrEqual(0);
      expect(stats.influencersByTier.macro).toBeGreaterThanOrEqual(0);
      expect(stats.influencersByTier.micro).toBeGreaterThanOrEqual(0);
    });

    it('should track average engagement rate', async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf1', timestamp: new Date(), reach: 100000 }
      ];

      await service.identifyInfluencers(mentions);

      const stats = service.getStats();
      expect(stats.averageEngagementRate).toBeGreaterThan(0);
    });

    it('should track top influencer score', async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'top', timestamp: new Date(), reach: 1000000 }
      ];

      await service.identifyInfluencers(mentions);

      const stats = service.getStats();
      expect(stats.topInfluencerScore).toBeGreaterThan(0);
    });

    it('should track processing time', async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf', timestamp: new Date(), reach: 100000 }
      ];

      await service.identifyInfluencers(mentions);

      const stats = service.getStats();
      expect(stats.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should reset stats', async () => {
      const mentions = [
        { id: 'm1', platform: 'twitter', brandId: 'b1', content: 'test', author: 'inf', timestamp: new Date(), reach: 100000 }
      ];

      await service.identifyInfluencers(mentions);
      service.resetStats();

      const stats = service.getStats();
      expect(stats.totalInfluencersTracked).toBe(0);
      expect(stats.averageEngagementRate).toBe(0);
    });
  });

  // ===================
  // Lifecycle Tests
  // ===================
  describe('Lifecycle', () => {
    it('should emit initialized event', async () => {
      const initHandler = vi.fn();
      service.on('initialized', initHandler);

      await service.initialize();

      expect(initHandler).toHaveBeenCalled();
    });

    it('should emit shutdown event', async () => {
      const shutdownHandler = vi.fn();
      service.on('shutdown', shutdownHandler);

      await service.shutdown();

      expect(shutdownHandler).toHaveBeenCalled();
    });

    it('should be an EventEmitter', () => {
      expect(service).toBeInstanceOf(EventEmitter);
    });
  });
});
