/**
 * Content Inventory Tracking (F116)
 * Track all content assets with AI visibility scores and optimization status
 */

import { createId } from "@paralleldrive/cuid2";

// Content types
export interface ContentAsset {
  id: string;
  brandId: string;
  url: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  lastCrawled?: Date;
  lastModified?: Date;
  geoScore: GEOHealthScore;
  seoMetrics?: SEOMetrics;
  aiMetrics?: AIVisibilityMetrics;
  optimizationStatus: OptimizationStatus;
  tags: string[];
  metadata: ContentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentType =
  | "page"
  | "blog_post"
  | "product"
  | "category"
  | "landing"
  | "faq"
  | "resource"
  | "documentation";

export type ContentStatus =
  | "active"
  | "draft"
  | "archived"
  | "redirected"
  | "error"
  | "pending_review";

export interface GEOHealthScore {
  overall: number; // 0-100
  breakdown: {
    schemaMarkup: number;
    voiceReadability: number;
    contentQuality: number;
    entityCoverage: number;
    technicalHealth: number;
    aiOptimization: number;
  };
  grade: "A" | "B" | "C" | "D" | "F";
  lastCalculated: Date;
}

export interface SEOMetrics {
  pageSpeed: number;
  mobileScore: number;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
  hasCanonical: boolean;
  hasHreflang: boolean;
  hasSitemap: boolean;
  indexStatus: "indexed" | "not_indexed" | "blocked" | "unknown";
}

export interface AIVisibilityMetrics {
  mentionCount: number;
  citationCount: number;
  platformCoverage: Record<string, boolean>;
  sentimentScore: number;
  topicRelevance: number;
  competitorComparison: number;
}

export interface OptimizationStatus {
  level: "optimized" | "needs_work" | "critical" | "not_analyzed";
  recommendations: number;
  highPriority: number;
  completedRecommendations: number;
  lastOptimized?: Date;
}

export interface ContentMetadata {
  wordCount?: number;
  readingTime?: number;
  language?: string;
  author?: string;
  publishDate?: Date;
  lastUpdated?: Date;
  hasSchema?: boolean;
  schemaTypes?: string[];
  images?: number;
  internalLinks?: number;
  externalLinks?: number;
}

// Inventory statistics
export interface InventoryStats {
  totalAssets: number;
  byType: Record<ContentType, number>;
  byStatus: Record<ContentStatus, number>;
  averageGEOScore: number;
  scoreDistribution: {
    excellent: number; // 80-100
    good: number; // 60-79
    fair: number; // 40-59
    poor: number; // 20-39
    critical: number; // 0-19
  };
  optimizationSummary: {
    optimized: number;
    needsWork: number;
    critical: number;
    notAnalyzed: number;
  };
}

/**
 * Content Inventory Manager
 */
export class ContentInventoryManager {
  private assets: Map<string, ContentAsset> = new Map();
  private byBrand: Map<string, string[]> = new Map();
  private byUrl: Map<string, string> = new Map();

  /**
   * Add or update a content asset
   */
  upsertAsset(asset: Omit<ContentAsset, "id" | "createdAt" | "updatedAt">): ContentAsset {
    // Check if URL already exists for this brand
    const urlKey = `${asset.brandId}:${asset.url}`;
    const existingId = this.byUrl.get(urlKey);

    if (existingId) {
      // Update existing
      const existing = this.assets.get(existingId)!;
      const updated: ContentAsset = {
        ...existing,
        ...asset,
        id: existingId,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      };
      this.assets.set(existingId, updated);
      return updated;
    }

    // Create new
    const id = createId();
    const newAsset: ContentAsset = {
      ...asset,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.assets.set(id, newAsset);

    // Index by brand
    const brandAssets = this.byBrand.get(asset.brandId) || [];
    brandAssets.push(id);
    this.byBrand.set(asset.brandId, brandAssets);

    // Index by URL
    this.byUrl.set(urlKey, id);

    return newAsset;
  }

  /**
   * Get asset by ID
   */
  getAsset(id: string): ContentAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Get assets for a brand
   */
  getBrandAssets(
    brandId: string,
    options: {
      type?: ContentType;
      status?: ContentStatus;
      minScore?: number;
      maxScore?: number;
      limit?: number;
      offset?: number;
      sortBy?: "score" | "date" | "title";
      sortOrder?: "asc" | "desc";
    } = {}
  ): ContentAsset[] {
    const assetIds = this.byBrand.get(brandId) || [];
    let assets = assetIds
      .map((id) => this.assets.get(id))
      .filter((a): a is ContentAsset => a !== undefined);

    // Apply filters
    if (options.type) {
      assets = assets.filter((a) => a.type === options.type);
    }
    if (options.status) {
      assets = assets.filter((a) => a.status === options.status);
    }
    if (options.minScore !== undefined) {
      assets = assets.filter((a) => a.geoScore.overall >= options.minScore!);
    }
    if (options.maxScore !== undefined) {
      assets = assets.filter((a) => a.geoScore.overall <= options.maxScore!);
    }

    // Sort
    const sortBy = options.sortBy || "score";
    const sortOrder = options.sortOrder || "desc";
    assets.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "score":
          comparison = a.geoScore.overall - b.geoScore.overall;
          break;
        case "date":
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Paginate
    if (options.offset !== undefined || options.limit !== undefined) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      assets = assets.slice(start, end);
    }

    return assets;
  }

  /**
   * Get inventory statistics for a brand
   */
  getStats(brandId: string): InventoryStats {
    const assets = this.getBrandAssets(brandId);

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const scoreDistribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      critical: 0,
    };
    const optimizationSummary = {
      optimized: 0,
      needsWork: 0,
      critical: 0,
      notAnalyzed: 0,
    };

    let totalScore = 0;

    for (const asset of assets) {
      // Count by type
      byType[asset.type] = (byType[asset.type] || 0) + 1;

      // Count by status
      byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;

      // Score distribution
      totalScore += asset.geoScore.overall;
      if (asset.geoScore.overall >= 80) scoreDistribution.excellent++;
      else if (asset.geoScore.overall >= 60) scoreDistribution.good++;
      else if (asset.geoScore.overall >= 40) scoreDistribution.fair++;
      else if (asset.geoScore.overall >= 20) scoreDistribution.poor++;
      else scoreDistribution.critical++;

      // Optimization status
      optimizationSummary[asset.optimizationStatus.level === "needs_work" ? "needsWork" : asset.optimizationStatus.level as keyof typeof optimizationSummary]++;
    }

    return {
      totalAssets: assets.length,
      byType: byType as Record<ContentType, number>,
      byStatus: byStatus as Record<ContentStatus, number>,
      averageGEOScore: assets.length > 0 ? totalScore / assets.length : 0,
      scoreDistribution,
      optimizationSummary,
    };
  }

  /**
   * Update GEO score for an asset
   */
  updateGEOScore(
    id: string,
    breakdown: GEOHealthScore["breakdown"]
  ): ContentAsset | undefined {
    const asset = this.assets.get(id);
    if (!asset) return undefined;

    // Calculate overall score as weighted average
    const weights = {
      schemaMarkup: 0.15,
      voiceReadability: 0.15,
      contentQuality: 0.25,
      entityCoverage: 0.15,
      technicalHealth: 0.15,
      aiOptimization: 0.15,
    };

    const overall = Object.entries(breakdown).reduce((sum, [key, value]) => {
      return sum + value * weights[key as keyof typeof weights];
    }, 0);

    // Determine grade
    let grade: GEOHealthScore["grade"];
    if (overall >= 90) grade = "A";
    else if (overall >= 80) grade = "B";
    else if (overall >= 70) grade = "C";
    else if (overall >= 60) grade = "D";
    else grade = "F";

    asset.geoScore = {
      overall: Math.round(overall),
      breakdown,
      grade,
      lastCalculated: new Date(),
    };

    // Update optimization status based on score
    if (overall >= 80) {
      asset.optimizationStatus.level = "optimized";
    } else if (overall >= 50) {
      asset.optimizationStatus.level = "needs_work";
    } else {
      asset.optimizationStatus.level = "critical";
    }

    asset.updatedAt = new Date();
    this.assets.set(id, asset);

    return asset;
  }

  /**
   * Update optimization status
   */
  updateOptimizationStatus(
    id: string,
    status: Partial<OptimizationStatus>
  ): ContentAsset | undefined {
    const asset = this.assets.get(id);
    if (!asset) return undefined;

    asset.optimizationStatus = {
      ...asset.optimizationStatus,
      ...status,
    };
    asset.updatedAt = new Date();
    this.assets.set(id, asset);

    return asset;
  }

  /**
   * Bulk import assets from crawl
   */
  bulkImport(
    brandId: string,
    pages: Array<{
      url: string;
      title: string;
      type?: ContentType;
      metadata?: Partial<ContentMetadata>;
    }>
  ): ContentAsset[] {
    const imported: ContentAsset[] = [];

    for (const page of pages) {
      const asset = this.upsertAsset({
        brandId,
        url: page.url,
        title: page.title,
        type: page.type || "page",
        status: "active",
        lastCrawled: new Date(),
        geoScore: {
          overall: 0,
          breakdown: {
            schemaMarkup: 0,
            voiceReadability: 0,
            contentQuality: 0,
            entityCoverage: 0,
            technicalHealth: 0,
            aiOptimization: 0,
          },
          grade: "F",
          lastCalculated: new Date(),
        },
        optimizationStatus: {
          level: "not_analyzed",
          recommendations: 0,
          highPriority: 0,
          completedRecommendations: 0,
        },
        tags: [],
        metadata: page.metadata || {},
      });
      imported.push(asset);
    }

    return imported;
  }

  /**
   * Get assets needing attention
   */
  getNeedsAttention(
    brandId: string,
    options: {
      maxScore?: number;
      limit?: number;
    } = {}
  ): ContentAsset[] {
    const { maxScore = 60, limit = 10 } = options;

    return this.getBrandAssets(brandId, {
      maxScore,
      sortBy: "score",
      sortOrder: "asc",
      limit,
    });
  }

  /**
   * Get recently updated assets
   */
  getRecentlyUpdated(brandId: string, limit: number = 10): ContentAsset[] {
    return this.getBrandAssets(brandId, {
      sortBy: "date",
      sortOrder: "desc",
      limit,
    });
  }

  /**
   * Search assets
   */
  searchAssets(
    brandId: string,
    query: string,
    options: { limit?: number } = {}
  ): ContentAsset[] {
    const { limit = 20 } = options;
    const lowerQuery = query.toLowerCase();

    const assets = this.getBrandAssets(brandId);

    return assets
      .filter(
        (a) =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.url.toLowerCase().includes(lowerQuery) ||
          a.tags.some((t) => t.toLowerCase().includes(lowerQuery))
      )
      .slice(0, limit);
  }

  /**
   * Delete asset
   */
  deleteAsset(id: string): boolean {
    const asset = this.assets.get(id);
    if (!asset) return false;

    // Remove from indexes
    const brandAssets = this.byBrand.get(asset.brandId) || [];
    this.byBrand.set(
      asset.brandId,
      brandAssets.filter((a) => a !== id)
    );

    const urlKey = `${asset.brandId}:${asset.url}`;
    this.byUrl.delete(urlKey);

    this.assets.delete(id);
    return true;
  }

  /**
   * Export inventory for reporting
   */
  exportInventory(brandId: string): {
    assets: ContentAsset[];
    stats: InventoryStats;
    exportedAt: Date;
  } {
    return {
      assets: this.getBrandAssets(brandId),
      stats: this.getStats(brandId),
      exportedAt: new Date(),
    };
  }
}

// Singleton instance
export const contentInventory = new ContentInventoryManager();

/**
 * Calculate GEO score from audit and content data
 */
export function calculateGEOScore(data: {
  hasSchema: boolean;
  schemaCount: number;
  readabilityScore: number;
  wordCount: number;
  entityCount: number;
  pageSpeed: number;
  mobileScore: number;
  aiMentions: number;
  citations: number;
}): GEOHealthScore["breakdown"] {
  // Schema markup score (0-100)
  const schemaMarkup = data.hasSchema
    ? Math.min(100, 50 + data.schemaCount * 10)
    : 0;

  // Voice readability (from readability score)
  const voiceReadability = Math.min(100, data.readabilityScore);

  // Content quality based on word count and structure
  const contentQuality = Math.min(
    100,
    data.wordCount >= 500 ? 60 : (data.wordCount / 500) * 60 +
    (data.wordCount >= 1500 ? 40 : ((data.wordCount - 500) / 1000) * 40)
  );

  // Entity coverage
  const entityCoverage = Math.min(100, data.entityCount * 5);

  // Technical health
  const technicalHealth = (data.pageSpeed + data.mobileScore) / 2;

  // AI optimization based on mentions and citations
  const aiOptimization = Math.min(
    100,
    data.aiMentions * 10 + data.citations * 20
  );

  return {
    schemaMarkup: Math.round(schemaMarkup),
    voiceReadability: Math.round(voiceReadability),
    contentQuality: Math.round(contentQuality),
    entityCoverage: Math.round(entityCoverage),
    technicalHealth: Math.round(technicalHealth),
    aiOptimization: Math.round(aiOptimization),
  };
}

/**
 * Format asset for API response
 */
export function formatAssetResponse(asset: ContentAsset) {
  return {
    id: asset.id,
    url: asset.url,
    title: asset.title,
    type: asset.type,
    status: asset.status,
    geoScore: {
      overall: asset.geoScore.overall,
      grade: asset.geoScore.grade,
      breakdown: asset.geoScore.breakdown,
      lastCalculated: asset.geoScore.lastCalculated.toISOString(),
    },
    optimization: {
      level: asset.optimizationStatus.level,
      recommendations: asset.optimizationStatus.recommendations,
      highPriority: asset.optimizationStatus.highPriority,
      completed: asset.optimizationStatus.completedRecommendations,
    },
    metadata: asset.metadata,
    tags: asset.tags,
    lastCrawled: asset.lastCrawled?.toISOString() || null,
    updatedAt: asset.updatedAt.toISOString(),
  };
}
