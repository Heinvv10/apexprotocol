/**
 * Algorithm Change Detector
 *
 * Aggregates customer data to detect significant shifts in AI platform behavior.
 * Monitors trends across all 7 platforms to identify when algorithms change.
 */

export interface PlatformBehaviorData {
  platform: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "janus";
  timestamp: string;
  metrics: {
    avgCitationRate: number; // Citations per 1000 queries
    avgPosition: number; // Average position in responses
    avgVisibility: number; // Percentage visibility
    contentTypePreferences: {
      type: string;
      citationRate: number;
    }[];
    schemaEffectiveness: {
      schema: string;
      impactScore: number; // 0-100
    }[];
  };
}

export interface AlgorithmChange {
  id: string;
  platform: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "janus";
  detectedAt: string;
  confidence: "low" | "medium" | "high";
  changeType: "content_preference" | "schema_impact" | "position_shift" | "visibility_change";
  description: string;
  impact: "minor" | "moderate" | "major";
  metrics: {
    before: number;
    after: number;
    percentageChange: number;
  };
  affectedContentTypes?: string[];
  recommendedActions: string[];
}

/**
 * Detect significant changes in platform behavior
 * Compares recent data against historical baseline
 */
export function detectAlgorithmChanges(
  recentData: PlatformBehaviorData[],
  historicalBaseline: PlatformBehaviorData[]
): AlgorithmChange[] {
  const changes: AlgorithmChange[] = [];
  const platforms = ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "janus"] as const;

  for (const platform of platforms) {
    const recentPlatformData = recentData.filter((d) => d.platform === platform);
    const baselinePlatformData = historicalBaseline.filter((d) => d.platform === platform);

    if (recentPlatformData.length === 0 || baselinePlatformData.length === 0) {
      continue;
    }

    // Calculate averages for recent period
    const recentAvg = calculateAverageMetrics(recentPlatformData);
    const baselineAvg = calculateAverageMetrics(baselinePlatformData);

    // Detect citation rate changes
    const citationRateChange = calculatePercentageChange(
      baselineAvg.avgCitationRate,
      recentAvg.avgCitationRate
    );

    if (Math.abs(citationRateChange) > 15) {
      changes.push({
        id: `change_${platform}_citation_${Date.now()}`,
        platform,
        detectedAt: new Date().toISOString(),
        confidence: Math.abs(citationRateChange) > 30 ? "high" : "medium",
        changeType: "visibility_change",
        description: `${platform} citation rate changed by ${citationRateChange.toFixed(1)}%`,
        impact: Math.abs(citationRateChange) > 30 ? "major" : "moderate",
        metrics: {
          before: baselineAvg.avgCitationRate,
          after: recentAvg.avgCitationRate,
          percentageChange: citationRateChange,
        },
        recommendedActions: generateCitationRateRecommendations(citationRateChange, platform),
      });
    }

    // Detect position changes
    const positionChange = calculatePercentageChange(baselineAvg.avgPosition, recentAvg.avgPosition);

    if (Math.abs(positionChange) > 20) {
      changes.push({
        id: `change_${platform}_position_${Date.now()}`,
        platform,
        detectedAt: new Date().toISOString(),
        confidence: Math.abs(positionChange) > 40 ? "high" : "medium",
        changeType: "position_shift",
        description: `${platform} average position changed by ${positionChange.toFixed(1)}%`,
        impact: Math.abs(positionChange) > 40 ? "major" : "moderate",
        metrics: {
          before: baselineAvg.avgPosition,
          after: recentAvg.avgPosition,
          percentageChange: positionChange,
        },
        recommendedActions: generatePositionChangeRecommendations(positionChange, platform),
      });
    }

    // Detect content type preference shifts
    const contentTypeChanges = detectContentTypePreferenceShifts(
      baselinePlatformData,
      recentPlatformData,
      platform
    );
    changes.push(...contentTypeChanges);

    // Detect schema effectiveness changes
    const schemaChanges = detectSchemaEffectivenessShifts(
      baselinePlatformData,
      recentPlatformData,
      platform
    );
    changes.push(...schemaChanges);
  }

  return changes.sort((a, b) => {
    // Sort by impact (major > moderate > minor) then by confidence
    const impactOrder = { major: 3, moderate: 2, minor: 1 };
    const confidenceOrder = { high: 3, medium: 2, low: 1 };

    if (impactOrder[a.impact] !== impactOrder[b.impact]) {
      return impactOrder[b.impact] - impactOrder[a.impact];
    }

    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });
}

/**
 * Calculate average metrics from behavior data
 */
function calculateAverageMetrics(data: PlatformBehaviorData[]) {
  const sum = data.reduce(
    (acc, d) => ({
      avgCitationRate: acc.avgCitationRate + d.metrics.avgCitationRate,
      avgPosition: acc.avgPosition + d.metrics.avgPosition,
      avgVisibility: acc.avgVisibility + d.metrics.avgVisibility,
    }),
    { avgCitationRate: 0, avgPosition: 0, avgVisibility: 0 }
  );

  return {
    avgCitationRate: sum.avgCitationRate / data.length,
    avgPosition: sum.avgPosition / data.length,
    avgVisibility: sum.avgVisibility / data.length,
  };
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(before: number, after: number): number {
  if (before === 0) return 0;
  return ((after - before) / before) * 100;
}

/**
 * Detect shifts in content type preferences
 */
function detectContentTypePreferenceShifts(
  baseline: PlatformBehaviorData[],
  recent: PlatformBehaviorData[],
  platform: string
): AlgorithmChange[] {
  const changes: AlgorithmChange[] = [];

  // Aggregate content type preferences
  const baselinePrefs = aggregateContentTypePreferences(baseline);
  const recentPrefs = aggregateContentTypePreferences(recent);

  for (const contentType of Object.keys(recentPrefs)) {
    const baselineRate = baselinePrefs[contentType] || 0;
    const recentRate = recentPrefs[contentType] || 0;
    const change = calculatePercentageChange(baselineRate, recentRate);

    if (Math.abs(change) > 25) {
      changes.push({
        id: `change_${platform}_content_${contentType}_${Date.now()}`,
        platform: platform as any,
        detectedAt: new Date().toISOString(),
        confidence: Math.abs(change) > 50 ? "high" : "medium",
        changeType: "content_preference",
        description: `${platform} preference for ${contentType} changed by ${change.toFixed(1)}%`,
        impact: Math.abs(change) > 50 ? "major" : "moderate",
        metrics: {
          before: baselineRate,
          after: recentRate,
          percentageChange: change,
        },
        affectedContentTypes: [contentType],
        recommendedActions: generateContentTypeRecommendations(change, contentType, platform),
      });
    }
  }

  return changes;
}

/**
 * Aggregate content type preferences from behavior data
 */
function aggregateContentTypePreferences(data: PlatformBehaviorData[]): Record<string, number> {
  const prefs: Record<string, { sum: number; count: number }> = {};

  for (const entry of data) {
    for (const pref of entry.metrics.contentTypePreferences) {
      if (!prefs[pref.type]) {
        prefs[pref.type] = { sum: 0, count: 0 };
      }
      prefs[pref.type].sum += pref.citationRate;
      prefs[pref.type].count += 1;
    }
  }

  const result: Record<string, number> = {};
  for (const [type, data] of Object.entries(prefs)) {
    result[type] = data.sum / data.count;
  }

  return result;
}

/**
 * Detect shifts in schema effectiveness
 */
function detectSchemaEffectivenessShifts(
  baseline: PlatformBehaviorData[],
  recent: PlatformBehaviorData[],
  platform: string
): AlgorithmChange[] {
  const changes: AlgorithmChange[] = [];

  const baselineSchemas = aggregateSchemaEffectiveness(baseline);
  const recentSchemas = aggregateSchemaEffectiveness(recent);

  for (const schema of Object.keys(recentSchemas)) {
    const baselineScore = baselineSchemas[schema] || 0;
    const recentScore = recentSchemas[schema] || 0;
    const change = calculatePercentageChange(baselineScore, recentScore);

    if (Math.abs(change) > 20) {
      changes.push({
        id: `change_${platform}_schema_${schema}_${Date.now()}`,
        platform: platform as any,
        detectedAt: new Date().toISOString(),
        confidence: Math.abs(change) > 40 ? "high" : "medium",
        changeType: "schema_impact",
        description: `${platform} effectiveness of ${schema} schema changed by ${change.toFixed(1)}%`,
        impact: Math.abs(change) > 40 ? "major" : "moderate",
        metrics: {
          before: baselineScore,
          after: recentScore,
          percentageChange: change,
        },
        recommendedActions: generateSchemaRecommendations(change, schema, platform),
      });
    }
  }

  return changes;
}

/**
 * Aggregate schema effectiveness from behavior data
 */
function aggregateSchemaEffectiveness(data: PlatformBehaviorData[]): Record<string, number> {
  const schemas: Record<string, { sum: number; count: number }> = {};

  for (const entry of data) {
    for (const schema of entry.metrics.schemaEffectiveness) {
      if (!schemas[schema.schema]) {
        schemas[schema.schema] = { sum: 0, count: 0 };
      }
      schemas[schema.schema].sum += schema.impactScore;
      schemas[schema.schema].count += 1;
    }
  }

  const result: Record<string, number> = {};
  for (const [schema, data] of Object.entries(schemas)) {
    result[schema] = data.sum / data.count;
  }

  return result;
}

/**
 * Generate recommendations for citation rate changes
 */
function generateCitationRateRecommendations(change: number, platform: string): string[] {
  if (change < 0) {
    // Citation rate decreased
    return [
      `Analyze recent content updates to identify what changed on ${platform}`,
      "Review competitor content that's now outranking you",
      "Check if platform algorithm updates were announced",
      "Consider refreshing existing high-performing content",
    ];
  } else {
    // Citation rate increased
    return [
      `Identify which content changes drove the ${change.toFixed(1)}% increase`,
      "Double down on the content strategies that are working",
      "Apply successful patterns to other content pieces",
      "Monitor to ensure the increase is sustained",
    ];
  }
}

/**
 * Generate recommendations for position changes
 */
function generatePositionChangeRecommendations(change: number, platform: string): string[] {
  if (change < 0) {
    // Position improved (lower number)
    return [
      "Maintain the content strategies that improved position",
      "Apply successful patterns to other pages",
      "Monitor for sustained improvement over next 2 weeks",
    ];
  } else {
    // Position worsened (higher number)
    return [
      `Review recent changes that may have caused position drop on ${platform}`,
      "Check if competitors made significant content improvements",
      "Consider A/B testing different content structures",
      "Review platform-specific best practices",
    ];
  }
}

/**
 * Generate recommendations for content type preference changes
 */
function generateContentTypeRecommendations(
  change: number,
  contentType: string,
  platform: string
): string[] {
  if (change > 0) {
    // Platform now prefers this content type more
    return [
      `Increase production of ${contentType} content`,
      `Optimize existing ${contentType} for ${platform}`,
      `Study top-performing ${contentType} on ${platform}`,
      `Consider converting other content types to ${contentType} format`,
    ];
  } else {
    // Platform prefers this content type less
    return [
      `Diversify away from ${contentType} for ${platform}`,
      `Research what content types are now preferred`,
      `Update existing ${contentType} with new formats/structures`,
      `Monitor if this is a temporary shift or permanent change`,
    ];
  }
}

/**
 * Generate recommendations for schema effectiveness changes
 */
function generateSchemaRecommendations(change: number, schema: string, platform: string): string[] {
  if (change > 0) {
    // Schema effectiveness increased
    return [
      `Implement ${schema} schema on more pages`,
      `Audit existing ${schema} implementation for quality`,
      `Test different ${schema} patterns to maximize impact`,
      `Share this insight with content team for new pages`,
    ];
  } else {
    // Schema effectiveness decreased
    return [
      `Review ${schema} implementation for ${platform} changes`,
      `Check if platform released new schema requirements`,
      `Consider alternative schema types`,
      `Monitor if other schemas show increased effectiveness`,
    ];
  }
}

/**
 * Get historical baseline data for a platform
 * In production, this would query the database for the past 30-90 days
 */
export async function getHistoricalBaseline(
  platform: string,
  daysBack: number = 30
): Promise<PlatformBehaviorData[]> {
  // TODO: Implement database query
  // This is a placeholder that would be replaced with actual DB queries
  throw new Error("Not implemented - would query customer data from database");
}

/**
 * Get recent platform behavior data
 * In production, this would query the database for the past 7 days
 */
export async function getRecentBehaviorData(
  platform: string,
  daysBack: number = 7
): Promise<PlatformBehaviorData[]> {
  // TODO: Implement database query
  // This is a placeholder that would be replaced with actual DB queries
  throw new Error("Not implemented - would query customer data from database");
}

/**
 * Run algorithm change detection for all platforms
 */
export async function runAlgorithmChangeDetection(): Promise<AlgorithmChange[]> {
  const platforms = ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "janus"];
  const allChanges: AlgorithmChange[] = [];

  for (const platform of platforms) {
    try {
      const historical = await getHistoricalBaseline(platform, 30);
      const recent = await getRecentBehaviorData(platform, 7);

      const changes = detectAlgorithmChanges(recent, historical);
      allChanges.push(...changes);
    } catch (error) {
      console.error(`Failed to detect changes for ${platform}:`, error);
      // Continue with other platforms
    }
  }

  return allChanges;
}
