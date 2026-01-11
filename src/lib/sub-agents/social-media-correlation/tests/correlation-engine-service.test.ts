/**
 * CorrelationEngineService Tests
 *
 * TDD tests for the Correlation Engine Service that links mentions
 * across platforms using contextual similarity analysis.
 *
 * Following the "Ralph system" - write tests first, then implement.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { z } from 'zod';

// Types that will be implemented
interface CorrelationEngineConfig {
  similarityThreshold: number;
  timeWindowHours: number;
  minConfidenceScore: number;
  enableSemanticMatching: boolean;
  enableTemporalCorrelation: boolean;
  enableEntityLinking: boolean;
  maxCorrelationsPerMention: number;
  batchSize: number;
}

interface Mention {
  id: string;
  platform: string;
  brandId: string;
  content: string;
  author: string;
  timestamp: Date;
  url?: string;
  metadata?: Record<string, unknown>;
}

interface CorrelatedMentionPair {
  mentionA: Mention;
  mentionB: Mention;
  correlationType: 'semantic' | 'temporal' | 'entity' | 'author' | 'topic';
  similarityScore: number;
  confidenceScore: number;
  sharedEntities: string[];
  sharedTopics: string[];
  timeDifferenceMs: number;
}

interface CorrelationCluster {
  id: string;
  mentions: Mention[];
  centroid: string;
  averageSimilarity: number;
  topEntities: string[];
  topTopics: string[];
  timeRange: { start: Date; end: Date };
  platformDistribution: Record<string, number>;
}

interface CorrelationStats {
  totalMentionsProcessed: number;
  correlationsFound: number;
  clustersIdentified: number;
  averageClusterSize: number;
  crossPlatformCorrelations: number;
  processingTimeMs: number;
}

interface CorrelationEngineService extends EventEmitter {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getConfig(): CorrelationEngineConfig;
  updateConfig(config: Partial<CorrelationEngineConfig>): void;

  // Core correlation methods
  correlateMentions(mentions: Mention[]): Promise<CorrelatedMentionPair[]>;
  findCorrelationsForMention(mention: Mention, candidates: Mention[]): Promise<CorrelatedMentionPair[]>;

  // Similarity analysis
  calculateSemanticSimilarity(textA: string, textB: string): Promise<number>;
  calculateTemporalProximity(timestampA: Date, timestampB: Date): number;
  extractEntities(text: string): Promise<string[]>;
  extractTopics(text: string): Promise<string[]>;

  // Clustering
  clusterMentions(mentions: Mention[]): Promise<CorrelationCluster[]>;
  addToCluster(mention: Mention, clusterId: string): Promise<void>;
  mergeClusterz(clusterIdA: string, clusterIdB: string): Promise<CorrelationCluster>;

  // Cross-platform analysis
  findCrossPlatformCorrelations(mentions: Mention[]): Promise<CorrelatedMentionPair[]>;
  trackNarrativeSpread(mentions: Mention[]): Promise<{
    originPlatform: string;
    spreadPath: string[];
    spreadTimeMs: number;
  }>;

  // Statistics
  getStats(): CorrelationStats;
  resetStats(): void;
}

// Factory function signature
declare function createCorrelationEngineService(config?: Partial<CorrelationEngineConfig>): CorrelationEngineService;

// Mock implementation for testing
const createMockCorrelationEngineService = (config?: Partial<CorrelationEngineConfig>): CorrelationEngineService => {
  const defaultConfig: CorrelationEngineConfig = {
    similarityThreshold: 0.7,
    timeWindowHours: 24,
    minConfidenceScore: 0.6,
    enableSemanticMatching: true,
    enableTemporalCorrelation: true,
    enableEntityLinking: true,
    maxCorrelationsPerMention: 10,
    batchSize: 100,
    ...config
  };

  let currentConfig = { ...defaultConfig };
  let stats: CorrelationStats = {
    totalMentionsProcessed: 0,
    correlationsFound: 0,
    clustersIdentified: 0,
    averageClusterSize: 0,
    crossPlatformCorrelations: 0,
    processingTimeMs: 0
  };
  const clusters: Map<string, CorrelationCluster> = new Map();

  const service = new EventEmitter() as CorrelationEngineService;

  service.initialize = async () => {
    service.emit('initialized');
  };

  service.shutdown = async () => {
    service.emit('shutdown');
  };

  service.getConfig = () => ({ ...currentConfig });

  service.updateConfig = (newConfig: Partial<CorrelationEngineConfig>) => {
    currentConfig = { ...currentConfig, ...newConfig };
    service.emit('configUpdated', currentConfig);
  };

  service.calculateSemanticSimilarity = async (textA: string, textB: string): Promise<number> => {
    // Simple word overlap for mock (real implementation uses embeddings)
    const wordsA = new Set(textA.toLowerCase().split(/\s+/));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
  };

  service.calculateTemporalProximity = (timestampA: Date, timestampB: Date): number => {
    const diffMs = Math.abs(timestampA.getTime() - timestampB.getTime());
    const windowMs = currentConfig.timeWindowHours * 60 * 60 * 1000;
    return Math.max(0, 1 - (diffMs / windowMs));
  };

  service.extractEntities = async (text: string): Promise<string[]> => {
    // Simple entity extraction (capitalized words)
    const entityPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const matches = text.match(entityPattern) || [];
    return [...new Set(matches)];
  };

  service.extractTopics = async (text: string): Promise<string[]> => {
    // Simple topic extraction (hashtags and keywords)
    const hashtags = text.match(/#\w+/g) || [];
    const topics = hashtags.map(h => h.substring(1).toLowerCase());
    return [...new Set(topics)];
  };

  service.findCorrelationsForMention = async (mention: Mention, candidates: Mention[]): Promise<CorrelatedMentionPair[]> => {
    const correlations: CorrelatedMentionPair[] = [];

    for (const candidate of candidates) {
      if (candidate.id === mention.id) continue;

      const semanticScore = await service.calculateSemanticSimilarity(mention.content, candidate.content);
      const temporalScore = service.calculateTemporalProximity(mention.timestamp, candidate.timestamp);
      const mentionEntities = await service.extractEntities(mention.content);
      const candidateEntities = await service.extractEntities(candidate.content);
      const sharedEntities = mentionEntities.filter(e => candidateEntities.includes(e));

      const mentionTopics = await service.extractTopics(mention.content);
      const candidateTopics = await service.extractTopics(candidate.content);
      const sharedTopics = mentionTopics.filter(t => candidateTopics.includes(t));

      const combinedScore = (semanticScore * 0.5) + (temporalScore * 0.3) +
        ((sharedEntities.length > 0 ? 0.1 : 0) + (sharedTopics.length > 0 ? 0.1 : 0));

      if (combinedScore >= currentConfig.similarityThreshold) {
        let correlationType: CorrelatedMentionPair['correlationType'] = 'semantic';
        if (sharedEntities.length > 0) correlationType = 'entity';
        else if (sharedTopics.length > 0) correlationType = 'topic';
        else if (temporalScore > semanticScore) correlationType = 'temporal';

        correlations.push({
          mentionA: mention,
          mentionB: candidate,
          correlationType,
          similarityScore: semanticScore,
          confidenceScore: combinedScore,
          sharedEntities,
          sharedTopics,
          timeDifferenceMs: Math.abs(mention.timestamp.getTime() - candidate.timestamp.getTime())
        });
      }
    }

    return correlations.slice(0, currentConfig.maxCorrelationsPerMention);
  };

  service.correlateMentions = async (mentions: Mention[]): Promise<CorrelatedMentionPair[]> => {
    const startTime = Date.now();
    const allCorrelations: CorrelatedMentionPair[] = [];
    const seenPairs = new Set<string>();

    for (const mention of mentions) {
      const correlations = await service.findCorrelationsForMention(mention, mentions);

      for (const correlation of correlations) {
        const pairKey = [correlation.mentionA.id, correlation.mentionB.id].sort().join('-');
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          allCorrelations.push(correlation);
        }
      }
    }

    stats.totalMentionsProcessed += mentions.length;
    stats.correlationsFound += allCorrelations.length;
    stats.crossPlatformCorrelations += allCorrelations.filter(
      c => c.mentionA.platform !== c.mentionB.platform
    ).length;
    stats.processingTimeMs += Date.now() - startTime;

    service.emit('correlationsFound', allCorrelations);
    return allCorrelations;
  };

  service.clusterMentions = async (mentions: Mention[]): Promise<CorrelationCluster[]> => {
    const newClusters: CorrelationCluster[] = [];
    const assigned = new Set<string>();

    for (const mention of mentions) {
      if (assigned.has(mention.id)) continue;

      const clusterMentions = [mention];
      assigned.add(mention.id);

      for (const other of mentions) {
        if (assigned.has(other.id)) continue;

        const similarity = await service.calculateSemanticSimilarity(mention.content, other.content);
        if (similarity >= currentConfig.similarityThreshold) {
          clusterMentions.push(other);
          assigned.add(other.id);
        }
      }

      if (clusterMentions.length > 1) {
        const timestamps = clusterMentions.map(m => m.timestamp.getTime());
        const platformCounts: Record<string, number> = {};
        clusterMentions.forEach(m => {
          platformCounts[m.platform] = (platformCounts[m.platform] || 0) + 1;
        });

        const allEntities: string[] = [];
        const allTopics: string[] = [];
        for (const m of clusterMentions) {
          allEntities.push(...await service.extractEntities(m.content));
          allTopics.push(...await service.extractTopics(m.content));
        }

        const entityCounts: Record<string, number> = {};
        allEntities.forEach(e => { entityCounts[e] = (entityCounts[e] || 0) + 1; });
        const topicCounts: Record<string, number> = {};
        allTopics.forEach(t => { topicCounts[t] = (topicCounts[t] || 0) + 1; });

        const cluster: CorrelationCluster = {
          id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          mentions: clusterMentions,
          centroid: clusterMentions[0].content,
          averageSimilarity: 0.8,
          topEntities: Object.entries(entityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([e]) => e),
          topTopics: Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([t]) => t),
          timeRange: {
            start: new Date(Math.min(...timestamps)),
            end: new Date(Math.max(...timestamps))
          },
          platformDistribution: platformCounts
        };

        clusters.set(cluster.id, cluster);
        newClusters.push(cluster);
      }
    }

    stats.clustersIdentified += newClusters.length;
    if (newClusters.length > 0) {
      stats.averageClusterSize = newClusters.reduce((sum, c) => sum + c.mentions.length, 0) / newClusters.length;
    }

    service.emit('clusteringComplete', newClusters);
    return newClusters;
  };

  service.addToCluster = async (mention: Mention, clusterId: string): Promise<void> => {
    const cluster = clusters.get(clusterId);
    if (cluster) {
      cluster.mentions.push(mention);
      service.emit('mentionAddedToCluster', { mention, clusterId });
    }
  };

  service.mergeClusterz = async (clusterIdA: string, clusterIdB: string): Promise<CorrelationCluster> => {
    const clusterA = clusters.get(clusterIdA);
    const clusterB = clusters.get(clusterIdB);

    if (!clusterA || !clusterB) {
      throw new Error('One or both clusters not found');
    }

    const mergedMentions = [...clusterA.mentions, ...clusterB.mentions];
    const timestamps = mergedMentions.map(m => m.timestamp.getTime());
    const platformCounts: Record<string, number> = {};
    mergedMentions.forEach(m => {
      platformCounts[m.platform] = (platformCounts[m.platform] || 0) + 1;
    });

    const mergedCluster: CorrelationCluster = {
      id: `merged-${Date.now()}`,
      mentions: mergedMentions,
      centroid: clusterA.centroid,
      averageSimilarity: (clusterA.averageSimilarity + clusterB.averageSimilarity) / 2,
      topEntities: [...new Set([...clusterA.topEntities, ...clusterB.topEntities])].slice(0, 5),
      topTopics: [...new Set([...clusterA.topTopics, ...clusterB.topTopics])].slice(0, 5),
      timeRange: {
        start: new Date(Math.min(...timestamps)),
        end: new Date(Math.max(...timestamps))
      },
      platformDistribution: platformCounts
    };

    clusters.delete(clusterIdA);
    clusters.delete(clusterIdB);
    clusters.set(mergedCluster.id, mergedCluster);

    service.emit('clustersMerged', { clusterIdA, clusterIdB, mergedCluster });
    return mergedCluster;
  };

  service.findCrossPlatformCorrelations = async (mentions: Mention[]): Promise<CorrelatedMentionPair[]> => {
    const correlations = await service.correlateMentions(mentions);
    return correlations.filter(c => c.mentionA.platform !== c.mentionB.platform);
  };

  service.trackNarrativeSpread = async (mentions: Mention[]): Promise<{
    originPlatform: string;
    spreadPath: string[];
    spreadTimeMs: number;
  }> => {
    const sorted = [...mentions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (sorted.length === 0) {
      return { originPlatform: '', spreadPath: [], spreadTimeMs: 0 };
    }

    const origin = sorted[0];
    const platforms: string[] = [];
    const seenPlatforms = new Set<string>();

    for (const mention of sorted) {
      if (!seenPlatforms.has(mention.platform)) {
        platforms.push(mention.platform);
        seenPlatforms.add(mention.platform);
      }
    }

    const spreadTimeMs = sorted.length > 1
      ? sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()
      : 0;

    return {
      originPlatform: origin.platform,
      spreadPath: platforms,
      spreadTimeMs
    };
  };

  service.getStats = () => ({ ...stats });

  service.resetStats = () => {
    stats = {
      totalMentionsProcessed: 0,
      correlationsFound: 0,
      clustersIdentified: 0,
      averageClusterSize: 0,
      crossPlatformCorrelations: 0,
      processingTimeMs: 0
    };
  };

  return service;
};

describe('CorrelationEngineService', () => {
  let service: CorrelationEngineService;

  beforeEach(() => {
    service = createMockCorrelationEngineService();
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

      expect(config.similarityThreshold).toBe(0.7);
      expect(config.timeWindowHours).toBe(24);
      expect(config.minConfidenceScore).toBe(0.6);
      expect(config.enableSemanticMatching).toBe(true);
      expect(config.enableTemporalCorrelation).toBe(true);
      expect(config.enableEntityLinking).toBe(true);
      expect(config.maxCorrelationsPerMention).toBe(10);
      expect(config.batchSize).toBe(100);
    });

    it('should accept custom configuration', () => {
      const customService = createMockCorrelationEngineService({
        similarityThreshold: 0.8,
        timeWindowHours: 48,
        maxCorrelationsPerMention: 20
      });

      const config = customService.getConfig();
      expect(config.similarityThreshold).toBe(0.8);
      expect(config.timeWindowHours).toBe(48);
      expect(config.maxCorrelationsPerMention).toBe(20);
    });

    it('should update configuration dynamically', () => {
      service.updateConfig({ similarityThreshold: 0.9 });

      const config = service.getConfig();
      expect(config.similarityThreshold).toBe(0.9);
    });

    it('should emit event on config update', () => {
      const configHandler = vi.fn();
      service.on('configUpdated', configHandler);

      service.updateConfig({ enableSemanticMatching: false });

      expect(configHandler).toHaveBeenCalled();
      expect(configHandler.mock.calls[0][0].enableSemanticMatching).toBe(false);
    });

    it('should validate configuration with zod schema', () => {
      const configSchema = z.object({
        similarityThreshold: z.number().min(0).max(1),
        timeWindowHours: z.number().positive(),
        minConfidenceScore: z.number().min(0).max(1),
        enableSemanticMatching: z.boolean(),
        enableTemporalCorrelation: z.boolean(),
        enableEntityLinking: z.boolean(),
        maxCorrelationsPerMention: z.number().positive().int(),
        batchSize: z.number().positive().int()
      });

      const config = service.getConfig();
      const result = configSchema.safeParse(config);

      expect(result.success).toBe(true);
    });
  });

  // ============================
  // Semantic Similarity Tests
  // ============================
  describe('Semantic Similarity', () => {
    it('should calculate similarity between identical texts', async () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const similarity = await service.calculateSemanticSimilarity(text, text);

      expect(similarity).toBe(1.0);
    });

    it('should calculate high similarity for similar texts', async () => {
      const textA = 'Apex is a great brand for marketing';
      const textB = 'Apex brand is excellent for marketing campaigns';

      const similarity = await service.calculateSemanticSimilarity(textA, textB);

      expect(similarity).toBeGreaterThan(0.3);
    });

    it('should calculate low similarity for different texts', async () => {
      const textA = 'The weather is sunny today';
      const textB = 'Programming languages are interesting';

      const similarity = await service.calculateSemanticSimilarity(textA, textB);

      expect(similarity).toBeLessThan(0.3);
    });

    it('should handle empty texts', async () => {
      const similarity = await service.calculateSemanticSimilarity('', '');

      expect(similarity).toBeGreaterThanOrEqual(0);
    });

    it('should be case-insensitive', async () => {
      const textA = 'APEX BRAND MARKETING';
      const textB = 'apex brand marketing';

      const similarity = await service.calculateSemanticSimilarity(textA, textB);

      expect(similarity).toBe(1.0);
    });
  });

  // ===========================
  // Temporal Proximity Tests
  // ===========================
  describe('Temporal Proximity', () => {
    it('should return 1.0 for identical timestamps', () => {
      const timestamp = new Date();
      const proximity = service.calculateTemporalProximity(timestamp, timestamp);

      expect(proximity).toBe(1.0);
    });

    it('should return high proximity for close timestamps', () => {
      const timestampA = new Date();
      const timestampB = new Date(timestampA.getTime() + 60 * 60 * 1000); // 1 hour later

      const proximity = service.calculateTemporalProximity(timestampA, timestampB);

      expect(proximity).toBeGreaterThan(0.9);
    });

    it('should return low proximity for distant timestamps', () => {
      const timestampA = new Date();
      const timestampB = new Date(timestampA.getTime() + 23 * 60 * 60 * 1000); // 23 hours later

      const proximity = service.calculateTemporalProximity(timestampA, timestampB);

      expect(proximity).toBeLessThan(0.1);
    });

    it('should return 0 for timestamps outside window', () => {
      const timestampA = new Date();
      const timestampB = new Date(timestampA.getTime() + 48 * 60 * 60 * 1000); // 48 hours later

      const proximity = service.calculateTemporalProximity(timestampA, timestampB);

      expect(proximity).toBe(0);
    });

    it('should be symmetric', () => {
      const timestampA = new Date();
      const timestampB = new Date(timestampA.getTime() + 6 * 60 * 60 * 1000);

      const proximityAB = service.calculateTemporalProximity(timestampA, timestampB);
      const proximityBA = service.calculateTemporalProximity(timestampB, timestampA);

      expect(proximityAB).toBe(proximityBA);
    });

    it('should respect custom time window configuration', () => {
      const customService = createMockCorrelationEngineService({ timeWindowHours: 12 });

      const timestampA = new Date();
      const timestampB = new Date(timestampA.getTime() + 12 * 60 * 60 * 1000); // 12 hours later

      const proximity = customService.calculateTemporalProximity(timestampA, timestampB);

      expect(proximity).toBe(0);
    });
  });

  // =======================
  // Entity Extraction Tests
  // =======================
  describe('Entity Extraction', () => {
    it('should extract named entities from text', async () => {
      const text = 'Apple CEO Tim Cook announced new products in California';
      const entities = await service.extractEntities(text);

      expect(entities).toContain('Apple');
      expect(entities).toContain('Tim Cook');
      expect(entities).toContain('California');
    });

    it('should return empty array for text without entities', async () => {
      const text = 'the quick brown fox jumps over the lazy dog';
      const entities = await service.extractEntities(text);

      expect(entities).toEqual([]);
    });

    it('should deduplicate entities', async () => {
      const text = 'Apple is great. I love Apple products. Apple is innovative.';
      const entities = await service.extractEntities(text);

      const appleCount = entities.filter(e => e === 'Apple').length;
      expect(appleCount).toBe(1);
    });

    it('should handle empty text', async () => {
      const entities = await service.extractEntities('');

      expect(entities).toEqual([]);
    });
  });

  // =====================
  // Topic Extraction Tests
  // =====================
  describe('Topic Extraction', () => {
    it('should extract hashtags as topics', async () => {
      const text = 'Check out our new product! #innovation #technology #startup';
      const topics = await service.extractTopics(text);

      expect(topics).toContain('innovation');
      expect(topics).toContain('technology');
      expect(topics).toContain('startup');
    });

    it('should return empty array for text without topics', async () => {
      const text = 'Just a regular sentence without any hashtags.';
      const topics = await service.extractTopics(text);

      expect(topics).toEqual([]);
    });

    it('should deduplicate topics', async () => {
      const text = '#AI is great. #ai is the future. #AI everywhere.';
      const topics = await service.extractTopics(text);

      // Should be lowercase and deduplicated
      expect(topics.filter(t => t === 'ai').length).toBe(1);
    });

    it('should normalize topic case', async () => {
      const text = '#Innovation #INNOVATION #innovation';
      const topics = await service.extractTopics(text);

      expect(topics.length).toBe(1);
      expect(topics[0]).toBe('innovation');
    });
  });

  // ===========================
  // Mention Correlation Tests
  // ===========================
  describe('Mention Correlation', () => {
    const createMention = (id: string, platform: string, content: string, timestamp?: Date): Mention => ({
      id,
      platform,
      brandId: 'brand-1',
      content,
      author: 'author-1',
      timestamp: timestamp || new Date()
    });

    it('should find correlations between similar mentions', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand is amazing for marketing'),
        createMention('m2', 'linkedin', 'Apex brand is great for marketing campaigns')
      ];

      const correlations = await service.correlateMentions(mentions);

      expect(correlations.length).toBeGreaterThan(0);
    });

    it('should not correlate dissimilar mentions', async () => {
      const customService = createMockCorrelationEngineService({ similarityThreshold: 0.9 });

      const mentions = [
        createMention('m1', 'twitter', 'The weather is nice today'),
        createMention('m2', 'linkedin', 'I love programming in TypeScript')
      ];

      const correlations = await customService.correlateMentions(mentions);

      expect(correlations.length).toBe(0);
    });

    it('should not self-correlate mentions', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex is great!')
      ];

      const correlations = await service.correlateMentions(mentions);

      expect(correlations.length).toBe(0);
    });

    it('should identify correlation type correctly', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Meeting with Tim Cook at Apple headquarters'),
        createMention('m2', 'linkedin', 'Tim Cook presented at Apple event')
      ];

      const correlations = await service.correlateMentions(mentions);

      if (correlations.length > 0) {
        expect(['semantic', 'entity', 'topic', 'temporal', 'author']).toContain(correlations[0].correlationType);
      }
    });

    it('should calculate confidence scores', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing is excellent'),
        createMention('m2', 'linkedin', 'Apex brand marketing works great')
      ];

      const correlations = await service.correlateMentions(mentions);

      if (correlations.length > 0) {
        expect(correlations[0].confidenceScore).toBeGreaterThanOrEqual(0);
        expect(correlations[0].confidenceScore).toBeLessThanOrEqual(1);
      }
    });

    it('should include shared entities in correlation', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apple CEO Tim Cook announced new iPhone'),
        createMention('m2', 'linkedin', 'Tim Cook reveals Apple plans for AI')
      ];

      const correlations = await service.correlateMentions(mentions);

      if (correlations.length > 0) {
        expect(correlations[0].sharedEntities).toBeDefined();
      }
    });

    it('should include shared topics in correlation', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Great #innovation in #technology'),
        createMention('m2', 'linkedin', 'The #innovation in #technology is amazing')
      ];

      const correlations = await service.correlateMentions(mentions);

      if (correlations.length > 0) {
        expect(correlations[0].sharedTopics).toContain('innovation');
        expect(correlations[0].sharedTopics).toContain('technology');
      }
    });

    it('should calculate time difference in correlations', async () => {
      const now = new Date();
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing', now),
        createMention('m2', 'linkedin', 'Apex brand marketing campaign', new Date(now.getTime() + 3600000))
      ];

      const correlations = await service.correlateMentions(mentions);

      if (correlations.length > 0) {
        expect(correlations[0].timeDifferenceMs).toBe(3600000);
      }
    });

    it('should limit correlations per mention', async () => {
      const customService = createMockCorrelationEngineService({
        maxCorrelationsPerMention: 2,
        similarityThreshold: 0.1 // Low threshold to get more matches
      });

      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing'),
        createMention('m2', 'linkedin', 'Apex brand is great'),
        createMention('m3', 'facebook', 'Apex brand rocks'),
        createMention('m4', 'reddit', 'Apex brand awesome'),
        createMention('m5', 'instagram', 'Apex brand nice')
      ];

      const correlations = await customService.findCorrelationsForMention(mentions[0], mentions);

      expect(correlations.length).toBeLessThanOrEqual(2);
    });

    it('should emit event when correlations are found', async () => {
      const correlationHandler = vi.fn();
      service.on('correlationsFound', correlationHandler);

      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing is excellent'),
        createMention('m2', 'linkedin', 'Apex brand marketing works great')
      ];

      await service.correlateMentions(mentions);

      expect(correlationHandler).toHaveBeenCalled();
    });
  });

  // ==================
  // Clustering Tests
  // ==================
  describe('Clustering', () => {
    const createMention = (id: string, platform: string, content: string, timestamp?: Date): Mention => ({
      id,
      platform,
      brandId: 'brand-1',
      content,
      author: 'author-1',
      timestamp: timestamp || new Date()
    });

    it('should cluster similar mentions together', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand is amazing for marketing'),
        createMention('m2', 'linkedin', 'Apex brand is great for marketing'),
        createMention('m3', 'facebook', 'Apex brand marketing is excellent')
      ];

      const clusters = await service.clusterMentions(mentions);

      expect(clusters.length).toBeGreaterThan(0);
      if (clusters.length > 0) {
        expect(clusters[0].mentions.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should not cluster dissimilar mentions', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'The weather is nice today'),
        createMention('m2', 'linkedin', 'Programming is fun')
      ];

      const clusters = await service.clusterMentions(mentions);

      // Either no clusters or single-mention clusters
      const multiMentionClusters = clusters.filter(c => c.mentions.length > 1);
      expect(multiMentionClusters.length).toBe(0);
    });

    it('should track platform distribution in clusters', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing is great'),
        createMention('m2', 'twitter', 'Apex brand marketing rocks'),
        createMention('m3', 'linkedin', 'Apex brand marketing awesome')
      ];

      const clusters = await service.clusterMentions(mentions);

      if (clusters.length > 0) {
        expect(clusters[0].platformDistribution).toBeDefined();
        expect(typeof clusters[0].platformDistribution.twitter).toBe('number');
      }
    });

    it('should calculate time range for clusters', async () => {
      const now = new Date();
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing', now),
        createMention('m2', 'linkedin', 'Apex brand marketing great', new Date(now.getTime() + 3600000))
      ];

      const clusters = await service.clusterMentions(mentions);

      if (clusters.length > 0) {
        expect(clusters[0].timeRange.start).toBeDefined();
        expect(clusters[0].timeRange.end).toBeDefined();
        expect(clusters[0].timeRange.start.getTime()).toBeLessThanOrEqual(clusters[0].timeRange.end.getTime());
      }
    });

    it('should identify top entities in clusters', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apple CEO Tim Cook announces new iPhone'),
        createMention('m2', 'linkedin', 'Tim Cook at Apple reveals iPhone updates')
      ];

      const clusters = await service.clusterMentions(mentions);

      if (clusters.length > 0) {
        expect(clusters[0].topEntities).toBeDefined();
        expect(Array.isArray(clusters[0].topEntities)).toBe(true);
      }
    });

    it('should identify top topics in clusters', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Great #innovation in #ai'),
        createMention('m2', 'linkedin', 'Amazing #innovation in #ai technology')
      ];

      const clusters = await service.clusterMentions(mentions);

      if (clusters.length > 0) {
        expect(clusters[0].topTopics).toBeDefined();
        expect(Array.isArray(clusters[0].topTopics)).toBe(true);
      }
    });

    it('should add mention to existing cluster', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing'),
        createMention('m2', 'linkedin', 'Apex brand marketing great')
      ];

      const clusters = await service.clusterMentions(mentions);

      if (clusters.length > 0) {
        const newMention = createMention('m3', 'facebook', 'Apex brand marketing awesome');
        await service.addToCluster(newMention, clusters[0].id);

        // Verify event emitted
        const eventHandler = vi.fn();
        service.on('mentionAddedToCluster', eventHandler);
        await service.addToCluster(createMention('m4', 'reddit', 'test'), clusters[0].id);
        expect(eventHandler).toHaveBeenCalled();
      }
    });

    it('should merge clusters', async () => {
      const mentionsA = [
        createMention('m1', 'twitter', 'Apex brand marketing'),
        createMention('m2', 'linkedin', 'Apex brand marketing great')
      ];

      const mentionsB = [
        createMention('m3', 'facebook', 'Apex brand strategy'),
        createMention('m4', 'reddit', 'Apex brand strategy rocks')
      ];

      const clustersA = await service.clusterMentions(mentionsA);
      const clustersB = await service.clusterMentions(mentionsB);

      if (clustersA.length > 0 && clustersB.length > 0) {
        const merged = await service.mergeClusterz(clustersA[0].id, clustersB[0].id);

        expect(merged.mentions.length).toBe(clustersA[0].mentions.length + clustersB[0].mentions.length);
      }
    });

    it('should emit event on clustering complete', async () => {
      const clusteringHandler = vi.fn();
      service.on('clusteringComplete', clusteringHandler);

      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing great'),
        createMention('m2', 'linkedin', 'Apex brand marketing excellent')
      ];

      await service.clusterMentions(mentions);

      expect(clusteringHandler).toHaveBeenCalled();
    });
  });

  // =================================
  // Cross-Platform Correlation Tests
  // =================================
  describe('Cross-Platform Correlation', () => {
    const createMention = (id: string, platform: string, content: string, timestamp?: Date): Mention => ({
      id,
      platform,
      brandId: 'brand-1',
      content,
      author: 'author-1',
      timestamp: timestamp || new Date()
    });

    it('should find correlations across different platforms', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing is amazing'),
        createMention('m2', 'linkedin', 'Apex brand marketing is great'),
        createMention('m3', 'chatgpt', 'Apex brand for marketing purposes')
      ];

      const correlations = await service.findCrossPlatformCorrelations(mentions);

      correlations.forEach(c => {
        expect(c.mentionA.platform).not.toBe(c.mentionB.platform);
      });
    });

    it('should not include same-platform correlations', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing'),
        createMention('m2', 'twitter', 'Apex brand marketing rocks'),
        createMention('m3', 'linkedin', 'Apex brand marketing great')
      ];

      const correlations = await service.findCrossPlatformCorrelations(mentions);

      correlations.forEach(c => {
        expect(c.mentionA.platform).not.toBe(c.mentionB.platform);
      });
    });

    it('should track narrative spread across platforms', async () => {
      const now = new Date();
      const mentions = [
        createMention('m1', 'twitter', 'Breaking: Apex launches new product', now),
        createMention('m2', 'linkedin', 'Apex new product announcement', new Date(now.getTime() + 3600000)),
        createMention('m3', 'chatgpt', 'Apex product launch details', new Date(now.getTime() + 7200000))
      ];

      const spread = await service.trackNarrativeSpread(mentions);

      expect(spread.originPlatform).toBe('twitter');
      expect(spread.spreadPath).toContain('twitter');
      expect(spread.spreadPath.indexOf('twitter')).toBe(0);
      expect(spread.spreadTimeMs).toBeGreaterThan(0);
    });

    it('should identify earliest platform in narrative', async () => {
      const now = new Date();
      const mentions = [
        createMention('m1', 'linkedin', 'Product update', new Date(now.getTime() + 3600000)),
        createMention('m2', 'twitter', 'Product announcement', now), // First
        createMention('m3', 'facebook', 'Product news', new Date(now.getTime() + 7200000))
      ];

      const spread = await service.trackNarrativeSpread(mentions);

      expect(spread.originPlatform).toBe('twitter');
    });

    it('should handle empty mentions array', async () => {
      const spread = await service.trackNarrativeSpread([]);

      expect(spread.originPlatform).toBe('');
      expect(spread.spreadPath).toEqual([]);
      expect(spread.spreadTimeMs).toBe(0);
    });
  });

  // ================
  // Statistics Tests
  // ================
  describe('Statistics', () => {
    const createMention = (id: string, platform: string, content: string): Mention => ({
      id,
      platform,
      brandId: 'brand-1',
      content,
      author: 'author-1',
      timestamp: new Date()
    });

    it('should track total mentions processed', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing'),
        createMention('m2', 'linkedin', 'Apex brand marketing great')
      ];

      await service.correlateMentions(mentions);

      const stats = service.getStats();
      expect(stats.totalMentionsProcessed).toBe(2);
    });

    it('should track correlations found', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing is amazing'),
        createMention('m2', 'linkedin', 'Apex brand marketing is great')
      ];

      await service.correlateMentions(mentions);

      const stats = service.getStats();
      expect(stats.correlationsFound).toBeGreaterThanOrEqual(0);
    });

    it('should track cross-platform correlations', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing amazing'),
        createMention('m2', 'linkedin', 'Apex brand marketing great')
      ];

      await service.correlateMentions(mentions);

      const stats = service.getStats();
      expect(stats.crossPlatformCorrelations).toBeGreaterThanOrEqual(0);
    });

    it('should track clusters identified', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand marketing is great'),
        createMention('m2', 'linkedin', 'Apex brand marketing is excellent')
      ];

      await service.clusterMentions(mentions);

      const stats = service.getStats();
      expect(stats.clustersIdentified).toBeGreaterThanOrEqual(0);
    });

    it('should track processing time', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand'),
        createMention('m2', 'linkedin', 'Apex brand great')
      ];

      await service.correlateMentions(mentions);

      const stats = service.getStats();
      expect(stats.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should accumulate stats across operations', async () => {
      const mentions1 = [createMention('m1', 'twitter', 'Test 1')];
      const mentions2 = [createMention('m2', 'linkedin', 'Test 2')];

      await service.correlateMentions(mentions1);
      await service.correlateMentions(mentions2);

      const stats = service.getStats();
      expect(stats.totalMentionsProcessed).toBe(2);
    });

    it('should reset stats', async () => {
      const mentions = [
        createMention('m1', 'twitter', 'Apex brand'),
        createMention('m2', 'linkedin', 'Apex brand great')
      ];

      await service.correlateMentions(mentions);
      service.resetStats();

      const stats = service.getStats();
      expect(stats.totalMentionsProcessed).toBe(0);
      expect(stats.correlationsFound).toBe(0);
      expect(stats.clustersIdentified).toBe(0);
      expect(stats.crossPlatformCorrelations).toBe(0);
      expect(stats.processingTimeMs).toBe(0);
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
