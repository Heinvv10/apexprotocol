/**
 * RiskAssessmentService
 * Reputation risk detection and threat assessment for brand monitoring
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';
export type RiskCategory = 'reputational' | 'security' | 'legal' | 'operational' | 'financial' | 'competitive';
export type ThreatType = 'misinformation' | 'coordinated_attack' | 'viral_negative' | 'influencer_criticism' | 'negative_media_coverage';
export type MitigationUrgency = 'immediate' | 'urgent' | 'normal' | 'low';
export type SensitivityLevel = 'low' | 'medium' | 'high';

export const RiskAssessmentConfigSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  sensitivityLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  alertThreshold: z.number().min(0).max(1).default(0.6),
  enableRealTimeAlerts: z.boolean().default(true),
  historicalWindowDays: z.number().positive().default(30),
});

export type RiskAssessmentConfig = z.infer<typeof RiskAssessmentConfigSchema>;

export interface RiskInput {
  id: string;
  text: string;
  source: string;
  sentiment: number;
  reach: number;
  timestamp: Date;
  metadata?: {
    isVerified?: boolean;
    accountAge?: number;
    engagementRate?: number;
    shareCount?: number;
    influencerTier?: string;
    followerCount?: number;
    publicationTier?: string;
    isEditorial?: boolean;
    contractValue?: number;
  };
}

export interface RiskMitigation {
  id: string;
  strategy: string;
  description: string;
  urgency: MitigationUrgency;
  responsibleTeam: string;
  estimatedEffectiveness: number;
  estimatedCost?: number;
  timeToImplement?: string;
}

export interface RiskImpact {
  potentialReach: number;
  estimatedRevenueImpact: number;
  brandPerceptionImpact: number;
  estimatedRecoveryDays: number;
}

export interface HistoricalComparison {
  averageRiskScore: number;
  percentileRank: number;
  comparisonPeriod: string;
}

export interface RiskAssessment {
  id: string;
  inputId: string;
  riskLevel: ThreatLevel;
  score: number;
  categories: RiskCategory[];
  threats: ThreatType[];
  impact: RiskImpact;
  mitigations: RiskMitigation[];
  historicalComparison?: HistoricalComparison;
  confidence: number;
  timestamp: Date;
  error?: string;
}

export interface RiskAlert {
  id: string;
  severity: ThreatLevel;
  title: string;
  description: string;
  riskAssessmentId: string;
  escalationPath: string[];
  timestamp: Date;
}

export interface BatchRiskResult {
  assessments: RiskAssessment[];
  aggregateRiskLevel: ThreatLevel;
  aggregateRiskScore: number;
  correlatedRisks?: CorrelatedRisk[];
  threats: ThreatType[];
}

export interface CorrelatedRisk {
  theme: string;
  riskIds: string[];
  correlationScore: number;
}

export interface RiskTrend {
  direction: 'increasing' | 'decreasing' | 'stable';
  velocity: number;
  dataPoints: number;
}

export interface HistoricalPatterns {
  mostCommonCategories: RiskCategory[];
  peakRiskPeriods: { start: Date; end: Date; avgScore: number }[];
  averageRiskScore: number;
}

export interface RiskStats {
  totalAssessments: number;
  alertsGenerated: number;
  averageRiskScore: number;
  riskLevelDistribution: Record<ThreatLevel, number>;
  categoryDistribution: Record<RiskCategory, number>;
}

// ============================================================================
// Risk Keywords and Patterns
// ============================================================================

const RISK_CATEGORY_KEYWORDS: Record<RiskCategory, string[]> = {
  reputational: ['scandal', 'accused', 'unethical', 'controversy', 'reputation', 'image', 'trust', 'lying', 'dishonest', 'worst'],
  security: ['breach', 'hack', 'vulnerability', 'leak', 'security', 'exploit', 'attack', 'compromised', 'exposed'],
  legal: ['lawsuit', 'sued', 'litigation', 'legal', 'court', 'patent', 'infringement', 'violation', 'regulation', 'compliance'],
  operational: ['outage', 'downtime', 'service', 'unavailable', 'error', 'bug', 'issue', 'failure', 'degradation'],
  financial: ['stock', 'revenue', 'earnings', 'financial', 'investor', 'loss', 'plummet', 'decline', 'bankruptcy'],
  competitive: ['competitor', 'switch', 'alternative', 'replaced', 'behind', 'losing', 'market share', 'migration'],
};

const THREAT_PATTERNS: Record<ThreatType, { keywords: string[]; conditions: (input: RiskInput) => boolean }> = {
  misinformation: {
    keywords: ['false', 'fake', 'debunked', 'rumor', 'conspiracy', 'hoax'],
    conditions: (input) => input.metadata?.isVerified === false,
  },
  coordinated_attack: {
    keywords: ['boycott', 'campaign', 'organized', 'coordinated'],
    conditions: () => false, // Detected via batch analysis
  },
  viral_negative: {
    keywords: ['viral', 'thread', 'trending', 'spreading'],
    conditions: (input) => (input.reach > 100000 || (input.metadata?.shareCount || 0) > 10000),
  },
  influencer_criticism: {
    keywords: ['recommend', 'followers', 'audience', 'subscribers'],
    conditions: (input) => (input.metadata?.influencerTier !== undefined || (input.metadata?.followerCount || 0) > 100000),
  },
  negative_media_coverage: {
    keywords: ['investigation', 'report', 'analysis', 'exclusive', 'breaking'],
    conditions: (input) => (input.metadata?.publicationTier === 'tier1' || input.metadata?.isEditorial === true),
  },
};

// ============================================================================
// Service Interface
// ============================================================================

export interface RiskAssessmentService extends EventEmitter {
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Configuration
  getConfig(): RiskAssessmentConfig;
  updateConfig(config: Partial<RiskAssessmentConfig>): void;

  // Risk Assessment
  assessRisk(input: RiskInput): Promise<RiskAssessment>;
  assessBatchRisk(inputs: RiskInput[]): Promise<BatchRiskResult>;

  // Trend Analysis
  getRiskTrend(): RiskTrend;
  analyzeHistoricalPatterns(options: { startDate: Date; endDate: Date }): Promise<HistoricalPatterns>;

  // Statistics
  getStats(): RiskStats;
  resetStats(): void;
}

// ============================================================================
// Service Implementation
// ============================================================================

class RiskAssessmentServiceImpl extends EventEmitter implements RiskAssessmentService {
  private config: RiskAssessmentConfig;
  private assessmentHistory: RiskAssessment[] = [];
  private stats: RiskStats;
  private initialized = false;

  constructor(config: Partial<RiskAssessmentConfig> = {}) {
    super();
    // Provide default brandName if not specified
    const configWithDefaults = {
      brandName: config.brandName || 'Default',
      ...config,
    };
    this.config = RiskAssessmentConfigSchema.parse(configWithDefaults);
    this.stats = this.createEmptyStats();
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this.assessmentHistory = [];
    this.emit('shutdown');
  }

  getConfig(): RiskAssessmentConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<RiskAssessmentConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  async assessRisk(input: RiskInput): Promise<RiskAssessment> {
    // Handle null/invalid input
    if (!input) {
      const errorAssessment = this.createErrorAssessment('', 'Invalid input: null or undefined');
      this.emit('error', new Error('Invalid input: null or undefined'));
      return errorAssessment;
    }

    // Handle empty text
    if (!input.text || input.text.trim() === '') {
      return this.createMinimalAssessment(input.id);
    }

    try {
      const textLower = input.text.toLowerCase();
      const brandLower = this.config.brandName.toLowerCase();

      // Calculate base risk score
      const sentimentRisk = this.calculateSentimentRisk(input.sentiment);
      const reachRisk = this.calculateReachRisk(input.reach);
      const sourceRisk = this.calculateSourceRisk(input.source);

      // Combine risk factors with weights
      let rawScore = (sentimentRisk * 0.4) + (reachRisk * 0.35) + (sourceRisk * 0.25);

      // Apply sensitivity multiplier
      rawScore *= this.getSensitivityMultiplier();

      // Detect categories
      const categories = this.detectCategories(textLower);

      // Detect threats
      const threats = this.detectThreats(input, textLower);

      // Boost score for certain threats
      if (threats.includes('viral_negative')) rawScore = Math.min(1, rawScore * 1.3);
      if (threats.includes('influencer_criticism')) rawScore = Math.min(1, rawScore * 1.2);
      if (threats.includes('negative_media_coverage')) rawScore = Math.min(1, rawScore * 1.25);

      // Clamp score to 0-1
      const score = Math.max(0, Math.min(1, rawScore));

      // Determine risk level
      const riskLevel = this.scoreToRiskLevel(score);

      // Calculate impact
      const impact = this.calculateImpact(input, score, categories);

      // Generate mitigations
      const mitigations = this.generateMitigations(riskLevel, categories, threats);

      // Historical comparison
      const historicalComparison = this.getHistoricalComparison(score);

      const assessment: RiskAssessment = {
        id: `assessment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        inputId: input.id,
        riskLevel,
        score,
        categories,
        threats,
        impact,
        mitigations,
        historicalComparison,
        confidence: this.calculateConfidence(input),
        timestamp: new Date(),
      };

      // Store in history
      this.assessmentHistory.push(assessment);

      // Update stats
      this.updateStats(assessment);

      // Generate alert if above threshold
      if (score >= this.config.alertThreshold && this.config.enableRealTimeAlerts) {
        const alert = this.generateAlert(assessment, input);
        this.emit('alert', alert);
        this.stats.alertsGenerated++;
      }

      return assessment;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.emit('error', error);
      return this.createErrorAssessment(input.id, errorMsg);
    }
  }

  async assessBatchRisk(inputs: RiskInput[]): Promise<BatchRiskResult> {
    const assessments: RiskAssessment[] = [];
    const allThreats: Set<ThreatType> = new Set();

    for (const input of inputs) {
      const assessment = await this.assessRisk(input);
      assessments.push(assessment);
      assessment.threats.forEach(t => allThreats.add(t));
    }

    // Detect coordinated attack pattern
    if (this.detectCoordinatedAttack(inputs)) {
      allThreats.add('coordinated_attack');
    }

    // Calculate aggregate score
    const aggregateRiskScore = assessments.length > 0
      ? assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length
      : 0;

    const aggregateRiskLevel = this.scoreToRiskLevel(aggregateRiskScore);

    // Find correlated risks
    const correlatedRisks = this.findCorrelatedRisks(inputs, assessments);

    // Emit batch alert if there are correlated risks
    if (correlatedRisks.length > 0) {
      this.emit('batchAlert', {
        correlatedRisks,
        aggregateRiskScore,
        aggregateRiskLevel,
      });
    }

    return {
      assessments,
      aggregateRiskLevel,
      aggregateRiskScore,
      correlatedRisks,
      threats: Array.from(allThreats),
    };
  }

  getRiskTrend(): RiskTrend {
    if (this.assessmentHistory.length < 2) {
      return { direction: 'stable', velocity: 0, dataPoints: this.assessmentHistory.length };
    }

    // Sort by timestamp
    const sorted = Array.from(this.assessmentHistory).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Calculate velocity (change in score over time)
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const avgFirst = firstHalf.reduce((sum, a) => sum + a.score, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, a) => sum + a.score, 0) / secondHalf.length;

    const velocity = avgSecond - avgFirst;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (velocity > 0.1) {
      direction = 'increasing';
    } else if (velocity < -0.1) {
      direction = 'decreasing';
    } else {
      direction = 'stable';
    }

    return {
      direction,
      velocity: Math.abs(velocity),
      dataPoints: sorted.length,
    };
  }

  async analyzeHistoricalPatterns(options: { startDate: Date; endDate: Date }): Promise<HistoricalPatterns> {
    const { startDate, endDate } = options;

    const filteredHistory = this.assessmentHistory.filter(
      a => a.timestamp >= startDate && a.timestamp <= endDate
    );

    // Count category occurrences
    const categoryCount: Record<RiskCategory, number> = {
      reputational: 0,
      security: 0,
      legal: 0,
      operational: 0,
      financial: 0,
      competitive: 0,
    };

    for (const assessment of filteredHistory) {
      for (const category of assessment.categories) {
        categoryCount[category]++;
      }
    }

    // Sort by count to get most common
    const mostCommonCategories = (Object.entries(categoryCount) as [RiskCategory, number][])
      .sort((a, b) => b[1] - a[1])
      .filter(([, count]) => count > 0)
      .map(([cat]) => cat);

    // Find peak risk periods (simplified - just return empty for now)
    const peakRiskPeriods: { start: Date; end: Date; avgScore: number }[] = [];

    const averageRiskScore = filteredHistory.length > 0
      ? filteredHistory.reduce((sum, a) => sum + a.score, 0) / filteredHistory.length
      : 0;

    return {
      mostCommonCategories,
      peakRiskPeriods,
      averageRiskScore,
    };
  }

  getStats(): RiskStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = this.createEmptyStats();
    this.assessmentHistory = [];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private calculateSentimentRisk(sentiment: number): number {
    // Convert sentiment (-1 to 1) to risk (0 to 1)
    // Negative sentiment = higher risk
    return Math.max(0, -sentiment);
  }

  private calculateReachRisk(reach: number): number {
    // Logarithmic scale for reach
    if (reach <= 0) return 0;
    if (reach >= 1000000) return 1;
    return Math.log10(reach) / 6; // log10(1000000) = 6
  }

  private calculateSourceRisk(source: string): number {
    const highRiskSources = ['news', 'major_publication', 'financial_news', 'security_feed'];
    const mediumRiskSources = ['twitter', 'linkedin', 'reddit', 'youtube', 'industry_news', 'tech_blog'];
    const lowRiskSources = ['support', 'internal', 'review_site'];

    if (highRiskSources.includes(source)) return 0.8;
    if (mediumRiskSources.includes(source)) return 0.5;
    if (lowRiskSources.includes(source)) return 0.3;
    return 0.4; // Default medium-low
  }

  private getSensitivityMultiplier(): number {
    switch (this.config.sensitivityLevel) {
      case 'high': return 1.3;
      case 'medium': return 1.0;
      case 'low': return 0.7;
      default: return 1.0;
    }
  }

  private scoreToRiskLevel(score: number): ThreatLevel {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'low';
    return 'minimal';
  }

  private detectCategories(textLower: string): RiskCategory[] {
    const detected: RiskCategory[] = [];

    for (const [category, keywords] of Object.entries(RISK_CATEGORY_KEYWORDS) as [RiskCategory, string[]][]) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          detected.push(category);
          break;
        }
      }
    }

    return detected;
  }

  private detectThreats(input: RiskInput, textLower: string): ThreatType[] {
    const detected: ThreatType[] = [];

    for (const [threat, pattern] of Object.entries(THREAT_PATTERNS) as [ThreatType, typeof THREAT_PATTERNS[ThreatType]][]) {
      // Skip coordinated_attack - detected via batch analysis
      if (threat === 'coordinated_attack') continue;

      const hasKeyword = pattern.keywords.some(k => textLower.includes(k));
      const matchesCondition = pattern.conditions(input);

      if (hasKeyword || matchesCondition) {
        detected.push(threat);
      }
    }

    return detected;
  }

  private detectCoordinatedAttack(inputs: RiskInput[]): boolean {
    if (inputs.length < 10) return false;

    // Check for similar messages from new accounts in short time
    const negativeInputs = inputs.filter(i => i.sentiment < -0.5);
    if (negativeInputs.length < 10) return false;

    // Check for new accounts (accountAge < 90 days)
    const newAccounts = negativeInputs.filter(i => (i.metadata?.accountAge || 365) < 90);
    if (newAccounts.length >= 10) return true;

    // Check for similar text patterns
    const texts = negativeInputs.map(i => i.text.toLowerCase());
    const uniqueTexts = new Set(texts);
    if (texts.length > 0 && uniqueTexts.size < texts.length * 0.5) {
      return true; // More than 50% similar messages
    }

    return false;
  }

  private calculateImpact(input: RiskInput, score: number, categories: RiskCategory[]): RiskImpact {
    // Potential reach = actual reach * viral multiplier
    const viralMultiplier = input.metadata?.shareCount
      ? Math.log10(input.metadata.shareCount + 1)
      : 1;
    const potentialReach = Math.max(input.reach, input.reach * viralMultiplier * 1.5);

    // Revenue impact based on contract value or estimated from reach
    let estimatedRevenueImpact = 0;
    if (input.metadata?.contractValue) {
      estimatedRevenueImpact = input.metadata.contractValue;
    } else if (categories.includes('financial')) {
      estimatedRevenueImpact = score * potentialReach * 0.01; // $0.01 per reached user
    }

    // Brand perception impact (0-1 scale)
    const brandPerceptionImpact = Math.min(1, score * 0.8 + (categories.length * 0.05));

    // Recovery time in days
    const baseRecoveryDays = score * 30; // Up to 30 days for critical
    const categoryMultiplier = 1 + (categories.length * 0.2);
    const estimatedRecoveryDays = Math.ceil(baseRecoveryDays * categoryMultiplier);

    return {
      potentialReach,
      estimatedRevenueImpact,
      brandPerceptionImpact,
      estimatedRecoveryDays,
    };
  }

  private generateMitigations(
    riskLevel: ThreatLevel,
    categories: RiskCategory[],
    threats: ThreatType[]
  ): RiskMitigation[] {
    const mitigations: RiskMitigation[] = [];
    let idCounter = 1;

    // Urgency based on risk level
    const urgency: MitigationUrgency =
      riskLevel === 'critical' ? 'immediate' :
      riskLevel === 'high' ? 'urgent' :
      riskLevel === 'medium' ? 'normal' : 'low';

    // Category-specific mitigations
    if (categories.includes('reputational')) {
      mitigations.push({
        id: `mit-${idCounter++}`,
        strategy: 'Public Statement',
        description: 'Issue official statement addressing concerns',
        urgency,
        responsibleTeam: 'PR/Communications',
        estimatedEffectiveness: 0.7,
      });
    }

    if (categories.includes('security')) {
      mitigations.push({
        id: `mit-${idCounter++}`,
        strategy: 'Security Response',
        description: 'Investigate and patch security vulnerabilities',
        urgency: 'immediate',
        responsibleTeam: 'Security Team',
        estimatedEffectiveness: 0.9,
      });
    }

    if (categories.includes('operational')) {
      mitigations.push({
        id: `mit-${idCounter++}`,
        strategy: 'Service Restoration',
        description: 'Restore service and communicate status updates',
        urgency,
        responsibleTeam: 'Engineering/DevOps',
        estimatedEffectiveness: 0.85,
      });
    }

    if (categories.includes('legal')) {
      mitigations.push({
        id: `mit-${idCounter++}`,
        strategy: 'Legal Review',
        description: 'Engage legal team for response strategy',
        urgency,
        responsibleTeam: 'Legal',
        estimatedEffectiveness: 0.6,
      });
    }

    // Default mitigation if none specific
    if (mitigations.length === 0) {
      mitigations.push({
        id: `mit-${idCounter++}`,
        strategy: 'Monitor and Assess',
        description: 'Continue monitoring situation for escalation',
        urgency: 'low',
        responsibleTeam: 'Brand Team',
        estimatedEffectiveness: 0.5,
      });
    }

    // Sort by urgency
    const urgencyOrder: Record<MitigationUrgency, number> = {
      immediate: 0,
      urgent: 1,
      normal: 2,
      low: 3,
    };
    mitigations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return mitigations;
  }

  private generateAlert(assessment: RiskAssessment, input: RiskInput): RiskAlert {
    const escalationPath = this.getEscalationPath(assessment.riskLevel);

    return {
      id: `alert-${Date.now()}`,
      severity: assessment.riskLevel,
      title: `${assessment.riskLevel.toUpperCase()} Risk Detected`,
      description: `Risk detected from ${input.source}: "${input.text.substring(0, 100)}..."`,
      riskAssessmentId: assessment.id,
      escalationPath,
      timestamp: new Date(),
    };
  }

  private getEscalationPath(riskLevel: ThreatLevel): string[] {
    switch (riskLevel) {
      case 'critical':
        return ['Brand Manager', 'VP Marketing', 'CEO', 'Board'];
      case 'high':
        return ['Brand Manager', 'VP Marketing', 'CMO'];
      case 'medium':
        return ['Brand Manager', 'Marketing Director'];
      case 'low':
        return ['Brand Team Lead'];
      default:
        return ['Brand Analyst'];
    }
  }

  private getHistoricalComparison(score: number): HistoricalComparison {
    if (this.assessmentHistory.length === 0) {
      return {
        averageRiskScore: score,
        percentileRank: 50,
        comparisonPeriod: 'no history',
      };
    }

    const scores = this.assessmentHistory.map(a => a.score);
    const averageRiskScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // Calculate percentile rank
    const sortedScores = Array.from(scores).sort((a, b) => a - b);
    let rank = 0;
    for (const s of sortedScores) {
      if (s < score) rank++;
    }
    const percentileRank = (rank / sortedScores.length) * 100;

    return {
      averageRiskScore,
      percentileRank,
      comparisonPeriod: `last ${this.config.historicalWindowDays} days`,
    };
  }

  private findCorrelatedRisks(inputs: RiskInput[], assessments: RiskAssessment[]): CorrelatedRisk[] {
    const correlations: CorrelatedRisk[] = [];

    // Group by common keywords/themes
    const themes: Map<string, string[]> = new Map();

    for (const input of inputs) {
      const textLower = input.text.toLowerCase();

      // Look for pricing-related correlation
      if (textLower.includes('price') || textLower.includes('expensive') || textLower.includes('afford') || textLower.includes('cost')) {
        const existing = themes.get('pricing') || [];
        existing.push(input.id);
        themes.set('pricing', existing);
      }

      // Look for quality-related correlation
      if (textLower.includes('quality') || textLower.includes('terrible') || textLower.includes('bad') || textLower.includes('poor')) {
        const existing = themes.get('quality') || [];
        existing.push(input.id);
        themes.set('quality', existing);
      }

      // Look for service-related correlation
      if (textLower.includes('service') || textLower.includes('support') || textLower.includes('help')) {
        const existing = themes.get('service') || [];
        existing.push(input.id);
        themes.set('service', existing);
      }
    }

    // Create correlations for themes with multiple entries
    for (const [theme, ids] of themes.entries()) {
      if (ids.length >= 2) {
        correlations.push({
          theme,
          riskIds: ids,
          correlationScore: Math.min(1, ids.length / inputs.length + 0.2),
        });
      }
    }

    return correlations;
  }

  private calculateConfidence(input: RiskInput): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence for verified sources
    if (input.metadata?.isVerified) confidence += 0.1;

    // Increase confidence for high reach (more data)
    if (input.reach > 10000) confidence += 0.1;

    // Decrease confidence for very new content
    const age = Date.now() - input.timestamp.getTime();
    if (age < 3600000) confidence -= 0.1; // Less than 1 hour old

    return Math.max(0.3, Math.min(1, confidence));
  }

  private updateStats(assessment: RiskAssessment): void {
    this.stats.totalAssessments++;

    // Update running average
    const n = this.stats.totalAssessments;
    this.stats.averageRiskScore =
      ((this.stats.averageRiskScore * (n - 1)) + assessment.score) / n;

    // Update risk level distribution
    this.stats.riskLevelDistribution[assessment.riskLevel]++;

    // Update category distribution
    for (const category of assessment.categories) {
      this.stats.categoryDistribution[category]++;
    }
  }

  private createEmptyStats(): RiskStats {
    return {
      totalAssessments: 0,
      alertsGenerated: 0,
      averageRiskScore: 0,
      riskLevelDistribution: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        minimal: 0,
      },
      categoryDistribution: {
        reputational: 0,
        security: 0,
        legal: 0,
        operational: 0,
        financial: 0,
        competitive: 0,
      },
    };
  }

  private createMinimalAssessment(inputId: string): RiskAssessment {
    return {
      id: `assessment-${Date.now()}`,
      inputId,
      riskLevel: 'minimal',
      score: 0,
      categories: [],
      threats: [],
      impact: {
        potentialReach: 0,
        estimatedRevenueImpact: 0,
        brandPerceptionImpact: 0,
        estimatedRecoveryDays: 0,
      },
      mitigations: [],
      confidence: 0.5,
      timestamp: new Date(),
    };
  }

  private createErrorAssessment(inputId: string, error: string): RiskAssessment {
    return {
      id: `assessment-${Date.now()}`,
      inputId,
      riskLevel: 'minimal',
      score: 0,
      categories: [],
      threats: [],
      impact: {
        potentialReach: 0,
        estimatedRevenueImpact: 0,
        brandPerceptionImpact: 0,
        estimatedRecoveryDays: 0,
      },
      mitigations: [],
      confidence: 0,
      timestamp: new Date(),
      error,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createRiskAssessmentService(
  config: Partial<RiskAssessmentConfig> = {}
): RiskAssessmentService {
  return new RiskAssessmentServiceImpl(config);
}
