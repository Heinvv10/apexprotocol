import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Recommendation Workflow Service
 *
 * Provides comprehensive recommendation management including:
 * - Recommendation generation from insights
 * - Priority calculation
 * - Status workflow management
 * - Action item tracking
 * - Metrics and analytics
 */

// Configuration Schema
export const RecommendationWorkflowConfigSchema = z.object({
  maxRecommendationsPerBrand: z.number().min(1).default(20),
  autoApprovalThreshold: z.number().min(0).max(100).default(95),
  priorityThresholds: z.object({
    critical: z.number().default(90),
    high: z.number().default(75),
    medium: z.number().default(50),
    low: z.number().default(0)
  }).default({
    critical: 90,
    high: 75,
    medium: 50,
    low: 0
  }),
  enableAutoCompletion: z.boolean().default(true)
});

export type RecommendationWorkflowConfig = z.infer<typeof RecommendationWorkflowConfigSchema>;

// Input Types
export type InsightType = 'performance_trend' | 'opportunity' | 'risk' | 'anomaly' | 'competitive_intelligence';

export interface InsightInput {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  dataPoints: string[];
}

export interface RecommendationInput {
  brandId: string;
  insights: InsightInput[];
}

// Status Types
export type RecommendationStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'deferred';
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationCategory = 'content' | 'technical' | 'competitive' | 'strategic' | 'operational';

// Action Item
export interface ActionItem {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate?: Date;
  completedAt?: Date;
  assignee?: string;
}

// Status History Entry
export interface StatusHistoryEntry {
  status: RecommendationStatus;
  changedAt: Date;
  changedBy?: string;
  reason?: string;
}

// Recommendation
export interface Recommendation {
  id: string;
  brandId: string;
  insightId: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  actionItems: ActionItem[];
  estimatedImpact: {
    metric: string;
    improvement: number;
    timeframe: string;
  };
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  statusHistory: StatusHistoryEntry[];
}

// Results
export interface WorkflowResult {
  success: boolean;
  recommendations: Recommendation[];
  processingTime: number;
  error?: string;
}

export interface StatusUpdateResult {
  success: boolean;
  recommendation?: Recommendation;
  error?: string;
}

export interface ActionUpdateResult {
  success: boolean;
  actionItem?: ActionItem;
  error?: string;
}

export interface WorkflowMetrics {
  totalRecommendations: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  rejectedCount: number;
  averageCompletionTime: number;
  completionRate: number;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<RecommendationStatus, RecommendationStatus[]> = {
  pending: ['approved', 'rejected', 'deferred'],
  approved: ['in_progress', 'rejected', 'deferred'],
  in_progress: ['completed', 'deferred'],
  completed: [], // Terminal state
  rejected: ['pending'], // Can be reconsidered
  deferred: ['pending', 'approved']
};

/**
 * Recommendation Workflow Service
 */
export class RecommendationWorkflowService extends EventEmitter {
  private config: RecommendationWorkflowConfig;
  private recommendations: Map<string, Recommendation> = new Map();
  private brandRecommendations: Map<string, Set<string>> = new Map();

  constructor(config: Partial<RecommendationWorkflowConfig> = {}) {
    super();
    this.config = RecommendationWorkflowConfigSchema.parse(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): RecommendationWorkflowConfig {
    return { ...this.config };
  }

  /**
   * Generate recommendations from insights
   */
  async generateRecommendations(input: RecommendationInput): Promise<WorkflowResult> {
    const startTime = Date.now();

    if (!input.brandId) {
      return {
        success: false,
        recommendations: [],
        processingTime: Date.now() - startTime,
        error: 'Brand ID is required'
      };
    }

    if (input.insights.length === 0) {
      return {
        success: true,
        recommendations: [],
        processingTime: Date.now() - startTime
      };
    }

    const recommendations: Recommendation[] = [];

    for (const insight of input.insights) {
      const recommendation = this.createRecommendationFromInsight(input.brandId, insight);
      recommendations.push(recommendation);

      // Store recommendation
      this.recommendations.set(recommendation.id, recommendation);

      // Track by brand
      if (!this.brandRecommendations.has(input.brandId)) {
        this.brandRecommendations.set(input.brandId, new Set());
      }
      this.brandRecommendations.get(input.brandId)!.add(recommendation.id);

      this.emit('recommendation:created', recommendation);
    }

    // Sort by priority and limit
    const sortedRecs = this.sortByPriority(recommendations)
      .slice(0, this.config.maxRecommendationsPerBrand);

    return {
      success: true,
      recommendations: sortedRecs,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(
    recommendationId: string,
    newStatus: RecommendationStatus,
    reason?: string
  ): Promise<StatusUpdateResult> {
    const recommendation = this.recommendations.get(recommendationId);

    if (!recommendation) {
      return {
        success: false,
        error: 'Recommendation not found'
      };
    }

    // Validate transition
    const validTransitions = VALID_TRANSITIONS[recommendation.status];
    if (!validTransitions.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status transition from ${recommendation.status} to ${newStatus}`
      };
    }

    const previousStatus = recommendation.status;
    recommendation.status = newStatus;
    recommendation.updatedAt = new Date();
    recommendation.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
      reason
    });

    this.emit('recommendation:statusChanged', {
      recommendation,
      previousStatus,
      newStatus
    });

    // Check if workflow is complete for brand
    this.checkWorkflowCompletion(recommendation.brandId);

    return {
      success: true,
      recommendation
    };
  }

  /**
   * Get status history for a recommendation
   */
  async getStatusHistory(recommendationId: string): Promise<StatusHistoryEntry[]> {
    const recommendation = this.recommendations.get(recommendationId);
    return recommendation?.statusHistory || [];
  }

  /**
   * Update action item status
   */
  async updateActionItemStatus(
    recommendationId: string,
    actionId: string,
    newStatus: ActionItem['status']
  ): Promise<ActionUpdateResult> {
    const recommendation = this.recommendations.get(recommendationId);

    if (!recommendation) {
      return {
        success: false,
        error: 'Recommendation not found'
      };
    }

    const actionItem = recommendation.actionItems.find(a => a.id === actionId);

    if (!actionItem) {
      return {
        success: false,
        error: 'Action item not found'
      };
    }

    actionItem.status = newStatus;
    if (newStatus === 'completed') {
      actionItem.completedAt = new Date();
    }

    recommendation.updatedAt = new Date();

    // Check if all actions are completed
    if (this.config.enableAutoCompletion) {
      const allCompleted = recommendation.actionItems.every(
        a => a.status === 'completed' || a.status === 'skipped'
      );

      if (allCompleted && recommendation.status === 'in_progress') {
        await this.updateRecommendationStatus(recommendationId, 'completed', 'All action items completed');
      }
    }

    this.emit('actionItem:updated', { recommendation, actionItem });

    return {
      success: true,
      actionItem
    };
  }

  /**
   * Get a single recommendation
   */
  async getRecommendation(recommendationId: string): Promise<Recommendation | undefined> {
    return this.recommendations.get(recommendationId);
  }

  /**
   * Get recommendations by brand
   */
  async getRecommendationsByBrand(brandId: string): Promise<Recommendation[]> {
    const recIds = this.brandRecommendations.get(brandId);
    if (!recIds) return [];

    return Array.from(recIds)
      .map(id => this.recommendations.get(id))
      .filter((r): r is Recommendation => r !== undefined);
  }

  /**
   * Get recommendations by priority
   */
  async getRecommendationsByPriority(priority: RecommendationPriority): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values())
      .filter(r => r.priority === priority);
  }

  /**
   * Get recommendations by status
   */
  async getRecommendationsByStatus(status: RecommendationStatus): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values())
      .filter(r => r.status === status);
  }

  /**
   * Get workflow metrics for a brand
   */
  async getMetrics(brandId: string): Promise<WorkflowMetrics> {
    const recommendations = await this.getRecommendationsByBrand(brandId);

    const pendingCount = recommendations.filter(r => r.status === 'pending').length;
    const inProgressCount = recommendations.filter(r => r.status === 'in_progress' || r.status === 'approved').length;
    const completedCount = recommendations.filter(r => r.status === 'completed').length;
    const rejectedCount = recommendations.filter(r => r.status === 'rejected').length;

    // Calculate average completion time
    const completedRecs = recommendations.filter(r => r.status === 'completed');
    let averageCompletionTime = 0;

    if (completedRecs.length > 0) {
      const totalTime = completedRecs.reduce((sum, rec) => {
        const completedEntry = rec.statusHistory.find(h => h.status === 'completed');
        if (completedEntry) {
          return sum + (completedEntry.changedAt.getTime() - rec.createdAt.getTime());
        }
        return sum;
      }, 0);
      averageCompletionTime = totalTime / completedRecs.length;
    }

    return {
      totalRecommendations: recommendations.length,
      pendingCount,
      inProgressCount,
      completedCount,
      rejectedCount,
      averageCompletionTime,
      completionRate: recommendations.length > 0 ? (completedCount / recommendations.length) * 100 : 0
    };
  }

  // Private methods

  private createRecommendationFromInsight(brandId: string, insight: InsightInput): Recommendation {
    const priority = this.calculatePriority(insight);
    const category = this.determineCategory(insight);
    const actionItems = this.generateActionItems(insight, category);

    return {
      id: this.generateId(),
      brandId,
      insightId: insight.id,
      title: this.generateTitle(insight),
      description: this.generateDescription(insight),
      category,
      priority,
      status: 'pending',
      actionItems,
      estimatedImpact: this.estimateImpact(insight),
      confidence: insight.confidence,
      createdAt: new Date(),
      updatedAt: new Date(),
      statusHistory: [{
        status: 'pending',
        changedAt: new Date()
      }]
    };
  }

  private calculatePriority(insight: InsightInput): RecommendationPriority {
    const score = this.calculatePriorityScore(insight);

    if (score >= this.config.priorityThresholds.critical) return 'critical';
    if (score >= this.config.priorityThresholds.high) return 'high';
    if (score >= this.config.priorityThresholds.medium) return 'medium';
    return 'low';
  }

  private calculatePriorityScore(insight: InsightInput): number {
    let score = insight.confidence;

    // Adjust based on impact
    if (insight.impact === 'high') score += 15;
    else if (insight.impact === 'medium') score += 5;
    else score -= 5;

    // Adjust based on type
    if (insight.type === 'risk') score += 10;
    else if (insight.type === 'anomaly') score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private determineCategory(insight: InsightInput): RecommendationCategory {
    const dataPoints = insight.dataPoints.join(' ').toLowerCase();
    const title = insight.title.toLowerCase();
    const description = insight.description.toLowerCase();
    const combined = `${dataPoints} ${title} ${description}`;

    if (combined.includes('content') || combined.includes('coverage') || combined.includes('visibility')) {
      return 'content';
    }
    if (combined.includes('technical') || combined.includes('schema') || combined.includes('structured')) {
      return 'technical';
    }
    if (combined.includes('competitor') || combined.includes('share') || combined.includes('competitive')) {
      return 'competitive';
    }
    if (insight.type === 'risk' || insight.type === 'anomaly') {
      return 'operational';
    }

    return 'strategic';
  }

  private generateActionItems(insight: InsightInput, category: RecommendationCategory): ActionItem[] {
    const baseActions: ActionItem[] = [];

    // Generate category-specific actions
    switch (category) {
      case 'content':
        baseActions.push(
          { id: this.generateId(), description: 'Audit current content coverage', status: 'pending' },
          { id: this.generateId(), description: 'Identify content gaps', status: 'pending' },
          { id: this.generateId(), description: 'Create content optimization plan', status: 'pending' }
        );
        break;
      case 'technical':
        baseActions.push(
          { id: this.generateId(), description: 'Run technical audit', status: 'pending' },
          { id: this.generateId(), description: 'Implement recommended fixes', status: 'pending' },
          { id: this.generateId(), description: 'Verify implementation', status: 'pending' }
        );
        break;
      case 'competitive':
        baseActions.push(
          { id: this.generateId(), description: 'Analyze competitor strategies', status: 'pending' },
          { id: this.generateId(), description: 'Identify differentiation opportunities', status: 'pending' },
          { id: this.generateId(), description: 'Develop competitive response', status: 'pending' }
        );
        break;
      case 'operational':
        baseActions.push(
          { id: this.generateId(), description: 'Investigate root cause', status: 'pending' },
          { id: this.generateId(), description: 'Implement corrective measures', status: 'pending' },
          { id: this.generateId(), description: 'Monitor for recurrence', status: 'pending' }
        );
        break;
      default:
        baseActions.push(
          { id: this.generateId(), description: 'Review insight details', status: 'pending' },
          { id: this.generateId(), description: 'Develop action plan', status: 'pending' },
          { id: this.generateId(), description: 'Execute and measure results', status: 'pending' }
        );
    }

    return baseActions;
  }

  private generateTitle(insight: InsightInput): string {
    switch (insight.type) {
      case 'opportunity':
        return `Capitalize on: ${insight.title}`;
      case 'risk':
        return `Address Risk: ${insight.title}`;
      case 'anomaly':
        return `Investigate: ${insight.title}`;
      case 'competitive_intelligence':
        return `Competitive Action: ${insight.title}`;
      default:
        return `Action Required: ${insight.title}`;
    }
  }

  private generateDescription(insight: InsightInput): string {
    const impactText = insight.impact === 'high' ? 'significant' :
                       insight.impact === 'medium' ? 'moderate' : 'minor';

    return `Based on the identified ${insight.type.replace(/_/g, ' ')}, this recommendation ` +
           `addresses "${insight.title}" with ${impactText} potential impact. ` +
           `Confidence level: ${insight.confidence}%.`;
  }

  private estimateImpact(insight: InsightInput): Recommendation['estimatedImpact'] {
    const baseImprovement = insight.impact === 'high' ? 25 :
                            insight.impact === 'medium' ? 15 : 5;

    const confidenceMultiplier = insight.confidence / 100;
    const improvement = Math.round(baseImprovement * confidenceMultiplier);

    return {
      metric: insight.dataPoints[0] || 'overall_performance',
      improvement,
      timeframe: insight.impact === 'high' ? '1-3 months' :
                 insight.impact === 'medium' ? '3-6 months' : '6-12 months'
    };
  }

  private sortByPriority(recommendations: Recommendation[]): Recommendation[] {
    const priorityOrder: Record<RecommendationPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };

    return recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  private checkWorkflowCompletion(brandId: string): void {
    const recIds = this.brandRecommendations.get(brandId);
    if (!recIds || recIds.size === 0) return;

    const recommendations = Array.from(recIds)
      .map(id => this.recommendations.get(id))
      .filter((r): r is Recommendation => r !== undefined);

    const allComplete = recommendations.every(
      r => r.status === 'completed' || r.status === 'rejected'
    );

    if (allComplete) {
      this.emit('workflow:completed', { brandId, recommendations });
    }
  }

  private generateId(): string {
    return `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Factory function
 */
export function createRecommendationWorkflowService(
  config: Partial<RecommendationWorkflowConfig> = {}
): RecommendationWorkflowService {
  return new RecommendationWorkflowService(config);
}
