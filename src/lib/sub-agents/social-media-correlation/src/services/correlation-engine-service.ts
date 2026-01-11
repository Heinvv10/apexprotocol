/**
 * CorrelationEngineService
 * Links mentions across platforms using contextual similarity analysis
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Configuration schema
const correlationEngineConfigSchema = z.object({
  similarityThreshold: z.number().min(0).max(1).default(0.7),
  timeWindowHours: z.number().positive().default(24),
  minConfidenceScore: z.number().min(0).max(1).default(0.6),
  enableSemanticMatching: z.boolean().default(true),
  enableTemporalCorrelation: z.boolean().default(true),
  enableEntityLinking: z.boolean().default(true),
  maxCorrelationsPerMention: z.number().positive().int().default(10),
  batchSize: z.number().positive().int().default(100),
});

export type CorrelationEngineConfig = z.infer<typeof correlationEngineConfigSchema>;

export interface Mention {
  id: string;
  platform: string;
  brandId: string;
  content: string;
  author: string;
  timestamp: Date;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface CorrelatedMentionPair {
  mentionA: Mention;
  mentionB: Mention;
  correlationType: 'semantic' | 'temporal' | 'entity' | 'author' | 'topic';
  similarityScore: number;
  confidenceScore: number;
  sharedEntities: string[];
  sharedTopics: string[];
  timeDifferenceMs: number;
}

export interface CorrelationCluster {
  id: string;
  mentions: Mention[];
  centroid: string;
  averageSimilarity: number;
  topEntities: string[];
  topTopics: string[];
  timeRange: { start: Date; end: Date };
  platformDistribution: Record<string, number>;
}

export interface CorrelationStats {
  totalMentionsProcessed: number;
  correlationsFound: number;
  clustersIdentified: number;
  averageClusterSize: number;
  crossPlatformCorrelations: number;
  processingTimeMs: number;
}

/**
 * CorrelationEngineService
 * Provides cross-platform mention correlation and clustering
 */
export class CorrelationEngineService extends EventEmitter {
  private config: CorrelationEngineConfig;
  private clusters: Map<string, CorrelationCluster> = new Map();
  private stats: CorrelationStats = {
    totalMentionsProcessed: 0,
    correlationsFound: 0,
    clustersIdentified: 0,
    averageClusterSize: 0,
    crossPlatformCorrelations: 0,
    processingTimeMs: 0,
  };
  private isInitialized: boolean = false;

  constructor(config: Partial<CorrelationEngineConfig> = {}) {
    super();
    this.config = correlationEngineConfigSchema.parse(config);
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
    this.clusters.clear();
    this.emit('shutdown');
  }

  getConfig(): CorrelationEngineConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<CorrelationEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  // Calculate semantic similarity using Jaccard similarity on words
  async calculateSemanticSimilarity(textA: string, textB: string): Promise<number> {
    const wordsA = new Set(textA.toLowerCase().split(/\s+/).filter(w => w.length > 0));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/).filter(w => w.length > 0));

    if (wordsA.size === 0 && wordsB.size === 0) {
      return 0;
    }

    const intersection = new Set(Array.from(wordsA).filter(w => wordsB.has(w)));
    const union = new Set(Array.from(wordsA).concat(Array.from(wordsB)));

    return intersection.size / union.size;
  }

  // Calculate temporal proximity (1.0 = same time, 0 = outside window)
  calculateTemporalProximity(timestampA: Date, timestampB: Date): number {
    const diffMs = Math.abs(timestampA.getTime() - timestampB.getTime());
    const windowMs = this.config.timeWindowHours * 60 * 60 * 1000;

    if (diffMs >= windowMs) {
      return 0;
    }

    return Math.max(0, 1 - (diffMs / windowMs));
  }

  // Extract named entities (capitalized words/phrases)
  async extractEntities(text: string): Promise<string[]> {
    if (!text) return [];

    const entityPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const matches = text.match(entityPattern) || [];
    return Array.from(new Set(matches));
  }

  // Extract topics (hashtags)
  async extractTopics(text: string): Promise<string[]> {
    if (!text) return [];

    const hashtags = text.match(/#\w+/g) || [];
    const topics = hashtags.map(h => h.substring(1).toLowerCase());
    return Array.from(new Set(topics));
  }

  // Find correlations for a single mention
  async findCorrelationsForMention(
    mention: Mention,
    candidates: Mention[]
  ): Promise<CorrelatedMentionPair[]> {
    const correlations: CorrelatedMentionPair[] = [];

    for (const candidate of candidates) {
      if (candidate.id === mention.id) continue;

      const semanticScore = await this.calculateSemanticSimilarity(
        mention.content,
        candidate.content
      );
      const temporalScore = this.calculateTemporalProximity(
        mention.timestamp,
        candidate.timestamp
      );

      const mentionEntities = await this.extractEntities(mention.content);
      const candidateEntities = await this.extractEntities(candidate.content);
      const sharedEntities = mentionEntities.filter(e => candidateEntities.includes(e));

      const mentionTopics = await this.extractTopics(mention.content);
      const candidateTopics = await this.extractTopics(candidate.content);
      const sharedTopics = mentionTopics.filter(t => candidateTopics.includes(t));

      // Calculate combined score
      const combinedScore =
        semanticScore * 0.5 +
        temporalScore * 0.3 +
        (sharedEntities.length > 0 ? 0.1 : 0) +
        (sharedTopics.length > 0 ? 0.1 : 0);

      if (combinedScore >= this.config.similarityThreshold) {
        // Determine correlation type
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
          timeDifferenceMs: Math.abs(
            mention.timestamp.getTime() - candidate.timestamp.getTime()
          ),
        });
      }
    }

    return correlations.slice(0, this.config.maxCorrelationsPerMention);
  }

  // Correlate all mentions
  async correlateMentions(mentions: Mention[]): Promise<CorrelatedMentionPair[]> {
    const startTime = Date.now();
    const allCorrelations: CorrelatedMentionPair[] = [];
    const seenPairs = new Set<string>();

    for (const mention of mentions) {
      const correlations = await this.findCorrelationsForMention(mention, mentions);

      for (const correlation of correlations) {
        const pairKey = [correlation.mentionA.id, correlation.mentionB.id]
          .sort()
          .join('-');

        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          allCorrelations.push(correlation);
        }
      }
    }

    // Update stats
    this.stats.totalMentionsProcessed += mentions.length;
    this.stats.correlationsFound += allCorrelations.length;
    this.stats.crossPlatformCorrelations += allCorrelations.filter(
      c => c.mentionA.platform !== c.mentionB.platform
    ).length;
    this.stats.processingTimeMs += Date.now() - startTime;

    this.emit('correlationsFound', allCorrelations);
    return allCorrelations;
  }

  // Cluster mentions by similarity
  async clusterMentions(mentions: Mention[]): Promise<CorrelationCluster[]> {
    const newClusters: CorrelationCluster[] = [];
    const assigned = new Set<string>();

    for (const mention of mentions) {
      if (assigned.has(mention.id)) continue;

      const clusterMentions = [mention];
      assigned.add(mention.id);

      // Find similar mentions to add to this cluster
      for (const other of mentions) {
        if (assigned.has(other.id)) continue;

        const similarity = await this.calculateSemanticSimilarity(
          mention.content,
          other.content
        );

        if (similarity >= this.config.similarityThreshold) {
          clusterMentions.push(other);
          assigned.add(other.id);
        }
      }

      // Only create cluster if we have multiple mentions
      if (clusterMentions.length > 1) {
        const timestamps = clusterMentions.map(m => m.timestamp.getTime());
        const platformCounts: Record<string, number> = {};

        for (const m of clusterMentions) {
          platformCounts[m.platform] = (platformCounts[m.platform] || 0) + 1;
        }

        // Extract entities and topics from all mentions
        const allEntities: string[] = [];
        const allTopics: string[] = [];

        for (const m of clusterMentions) {
          const entities = await this.extractEntities(m.content);
          const topics = await this.extractTopics(m.content);
          allEntities.push(...entities);
          allTopics.push(...topics);
        }

        // Count occurrences
        const entityCounts: Record<string, number> = {};
        allEntities.forEach(e => {
          entityCounts[e] = (entityCounts[e] || 0) + 1;
        });

        const topicCounts: Record<string, number> = {};
        allTopics.forEach(t => {
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        });

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
            end: new Date(Math.max(...timestamps)),
          },
          platformDistribution: platformCounts,
        };

        this.clusters.set(cluster.id, cluster);
        newClusters.push(cluster);
      }
    }

    // Update stats
    this.stats.clustersIdentified += newClusters.length;
    if (newClusters.length > 0) {
      this.stats.averageClusterSize =
        newClusters.reduce((sum, c) => sum + c.mentions.length, 0) / newClusters.length;
    }

    this.emit('clusteringComplete', newClusters);
    return newClusters;
  }

  // Add a mention to an existing cluster
  async addToCluster(mention: Mention, clusterId: string): Promise<void> {
    const cluster = this.clusters.get(clusterId);
    if (cluster) {
      cluster.mentions.push(mention);
      this.emit('mentionAddedToCluster', { mention, clusterId });
    }
  }

  // Merge two clusters
  async mergeClusterz(
    clusterIdA: string,
    clusterIdB: string
  ): Promise<CorrelationCluster> {
    const clusterA = this.clusters.get(clusterIdA);
    const clusterB = this.clusters.get(clusterIdB);

    if (!clusterA || !clusterB) {
      throw new Error('One or both clusters not found');
    }

    const mergedMentions = [...clusterA.mentions, ...clusterB.mentions];
    const timestamps = mergedMentions.map(m => m.timestamp.getTime());
    const platformCounts: Record<string, number> = {};

    for (const m of mergedMentions) {
      platformCounts[m.platform] = (platformCounts[m.platform] || 0) + 1;
    }

    const mergedCluster: CorrelationCluster = {
      id: `merged-${Date.now()}`,
      mentions: mergedMentions,
      centroid: clusterA.centroid,
      averageSimilarity: (clusterA.averageSimilarity + clusterB.averageSimilarity) / 2,
      topEntities: Array.from(new Set(clusterA.topEntities.concat(clusterB.topEntities))).slice(
        0,
        5
      ),
      topTopics: Array.from(new Set(clusterA.topTopics.concat(clusterB.topTopics))).slice(0, 5),
      timeRange: {
        start: new Date(Math.min(...timestamps)),
        end: new Date(Math.max(...timestamps)),
      },
      platformDistribution: platformCounts,
    };

    this.clusters.delete(clusterIdA);
    this.clusters.delete(clusterIdB);
    this.clusters.set(mergedCluster.id, mergedCluster);

    this.emit('clustersMerged', { clusterIdA, clusterIdB, mergedCluster });
    return mergedCluster;
  }

  // Find correlations across different platforms only
  async findCrossPlatformCorrelations(
    mentions: Mention[]
  ): Promise<CorrelatedMentionPair[]> {
    const correlations = await this.correlateMentions(mentions);
    return correlations.filter(c => c.mentionA.platform !== c.mentionB.platform);
  }

  // Track how a narrative spreads across platforms
  async trackNarrativeSpread(
    mentions: Mention[]
  ): Promise<{ originPlatform: string; spreadPath: string[]; spreadTimeMs: number }> {
    const sorted = [...mentions].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

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

    const spreadTimeMs =
      sorted.length > 1
        ? sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()
        : 0;

    return {
      originPlatform: origin.platform,
      spreadPath: platforms,
      spreadTimeMs,
    };
  }

  // Get statistics
  getStats(): CorrelationStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      totalMentionsProcessed: 0,
      correlationsFound: 0,
      clustersIdentified: 0,
      averageClusterSize: 0,
      crossPlatformCorrelations: 0,
      processingTimeMs: 0,
    };
  }
}

/**
 * Factory function to create CorrelationEngineService
 */
export function createCorrelationEngineService(
  config: Partial<CorrelationEngineConfig> = {}
): CorrelationEngineService {
  return new CorrelationEngineService(config);
}
