/**
 * BrandMonitoringSubAgent
 * Main orchestration agent that coordinates all brand monitoring services
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import {
  createPlatformAdapterService,
  type PlatformAdapterService,
} from './services/platform-adapter-service';
import {
  createMentionExtractionService,
  type MentionExtractionService,
} from './services/mention-extraction-service';
import {
  createSentimentScoringService,
  type SentimentScoringService,
} from './services/sentiment-scoring-service';
import {
  createTrendDetectionService,
  type TrendDetectionService,
} from './services/trend-detection-service';
import {
  createRiskAssessmentService,
  type RiskAssessmentService,
} from './services/risk-assessment-service';
import {
  createPerformanceModelService,
  type PerformanceModelService,
} from './services/performance-model-service';

// ============================================================================
// Type Definitions
// ============================================================================

export type PlatformType = 'ai_search' | 'social_media' | 'news';
export type MonitoringFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';
export type SessionStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'terminated' | 'failed';
export type ServiceStatus = 'initializing' | 'ready' | 'degraded' | 'failed' | 'stopped';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type RiskLevel = 'minimal' | 'low' | 'medium' | 'high' | 'critical';

export interface PlatformConfig {
  id: string;
  type: PlatformType;
  name: string;
  enabled: boolean;
}

export interface AlertThresholds {
  riskLevel: RiskLevel;
  sentimentDrop: number;
  volumeSpike: number;
}

export interface AgentState {
  lastMonitoringRun?: Date;
  totalMentionsProcessed: number;
  lastError?: string;
}

export const BrandMonitoringConfigSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  brandAliases: z.array(z.string()).default([]),
  platforms: z.array(z.object({
    id: z.string(),
    type: z.enum(['ai_search', 'social_media', 'news']),
    name: z.string(),
    enabled: z.boolean(),
  })).default([
    { id: 'chatgpt', type: 'ai_search', name: 'ChatGPT', enabled: true },
  ]),
  monitoringFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']).default('hourly'),
  sensitivityThreshold: z.number().min(0).max(1).default(0.6),
  alertThresholds: z.object({
    riskLevel: z.enum(['minimal', 'low', 'medium', 'high', 'critical']).default('medium'),
    sentimentDrop: z.number().default(0.2),
    volumeSpike: z.number().default(2.0),
  }).optional(),
  initialState: z.object({
    lastMonitoringRun: z.date().optional(),
    totalMentionsProcessed: z.number().default(0),
  }).optional(),
});

export type BrandMonitoringConfig = z.infer<typeof BrandMonitoringConfigSchema>;

export interface MonitoringSession {
  id: string;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  platforms: string[];
  progress: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface MonitoringOptions {
  platforms?: string[];
  timeRange?: TimeRange | 'last_7_days' | 'last_30_days' | 'last_24_hours';
}

export interface MentionsByPlatform {
  [platform: string]: Array<{
    id: string;
    text: string;
    sentiment: number;
    timestamp: Date;
  }>;
}

export interface SentimentAnalysis {
  overall: {
    score: number;
    label: string;
  };
  byPlatform: Record<string, { score: number; label: string }>;
}

export interface TrendData {
  volume: {
    direction: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  topics: Array<{
    topic: string;
    mentions: number;
    trend: 'rising' | 'falling' | 'stable';
  }>;
}

export interface RiskData {
  level: RiskLevel;
  categories: string[];
  threats: string[];
}

export interface PerformanceData {
  visibilityScore: number;
  platformScores: Record<string, number>;
}

export interface CrossPlatformData {
  totalMentions: number;
  averageSentiment: number;
  topPlatform: string;
}

export interface InsightRecommendation {
  id: string;
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: number;
}

export interface MonitoringInsights {
  summary: string;
  keyTrends: string[];
  potentialRisks: string[];
  recommendations: InsightRecommendation[];
  overallSentiment: number;
}

export interface MonitoringResult {
  sessionId: string;
  status: 'completed' | 'partial' | 'failed';
  partialResults?: boolean;
  errors?: string[];
  timeRange: TimeRange;
  mentions: {
    total: number;
    byPlatform: MentionsByPlatform;
  };
  sentimentAnalysis: SentimentAnalysis;
  trends: TrendData;
  risks: RiskData;
  performance: PerformanceData;
  crossPlatform: CrossPlatformData;
  insights: MonitoringInsights;
}

export interface MonitoringSchedule {
  id: string;
  frequency?: MonitoringFrequency;
  cron?: string;
  nextRun: Date;
  startTime?: Date;
}

export interface CollaborationRequest {
  requesterId: string;
  type: 'data_request' | 'insight_share' | 'alert_forward';
  payload: Record<string, unknown>;
}

export interface CollaborationResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface AgentAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: Date;
}

export interface HealthCheck {
  status: HealthStatus;
  services: Record<string, ServiceStatus>;
  lastCheck: Date;
}

export interface AgentStats {
  totalMonitoringRuns: number;
  totalMentionsProcessed: number;
  averageRunTimeMs: number;
  alertsGenerated: number;
  lastRunTime?: Date;
}

export type AgentCapabilities =
  | 'mention_extraction'
  | 'sentiment_analysis'
  | 'trend_detection'
  | 'risk_assessment'
  | 'performance_modeling';

// ============================================================================
// Service Interface
// ============================================================================

export interface BrandMonitoringSubAgent extends EventEmitter {
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  isRunning(): boolean;

  // Configuration
  getConfig(): BrandMonitoringConfig;
  updateConfig(config: Partial<BrandMonitoringConfig>): void;

  // Monitoring
  monitor(options?: MonitoringOptions): Promise<MonitoringResult>;
  startSession(options?: MonitoringOptions): Promise<MonitoringSession>;
  waitForSession(sessionId: string): Promise<MonitoringResult>;
  cancelSession(sessionId: string): Promise<void>;
  getSessionStatus(sessionId: string): SessionStatus;
  getActiveSessions(): MonitoringSession[];

  // Scheduling
  scheduleMonitoring(options: { frequency?: MonitoringFrequency; cron?: string; startTime?: Date }): MonitoringSchedule;
  cancelSchedule(scheduleId: string): void;
  getActiveSchedules(): MonitoringSchedule[];

  // Services
  getServicesStatus(): Record<string, ServiceStatus>;
  areServicesReady(): boolean;
  degradeService(serviceName: string): void;
  failService(serviceName: string): void;

  // State Management
  getState(): AgentState;
  exportState(): string;
  importState(stateJson: string): void;

  // Capabilities
  getCapabilities(): AgentCapabilities[];
  hasCapability(capability: string): boolean;

  // Collaboration
  handleCollaborationRequest(request: CollaborationRequest): Promise<CollaborationResponse>;
  requestCollaboration(request: { targetAgentId: string; type: string; payload: unknown }): Promise<CollaborationResponse>;
  register(orchestratorId: string): Promise<void>;

  // Health & Statistics
  checkHealth(): Promise<HealthCheck>;
  getStats(): AgentStats;
  resetStats(): void;

  // Testing/Debugging
  triggerTestAlert(alert: { type: string; severity: string; message: string }): void;
  triggerError(error: Error): void;
}

// ============================================================================
// Implementation
// ============================================================================

class BrandMonitoringSubAgentImpl extends EventEmitter implements BrandMonitoringSubAgent {
  private config: BrandMonitoringConfig;
  private state: AgentState;
  private stats: AgentStats;
  private running = false;
  private initialized = false;

  // Services
  private platformAdapter!: PlatformAdapterService;
  private mentionExtraction!: MentionExtractionService;
  private sentimentScoring!: SentimentScoringService;
  private trendDetection!: TrendDetectionService;
  private riskAssessment!: RiskAssessmentService;
  private performanceModel!: PerformanceModelService;

  // Service statuses
  private serviceStatuses: Record<string, ServiceStatus> = {
    platformAdapter: 'initializing',
    mentionExtraction: 'initializing',
    sentimentScoring: 'initializing',
    trendDetection: 'initializing',
    riskAssessment: 'initializing',
    performanceModel: 'initializing',
  };

  // Sessions and schedules
  private sessions: Map<string, MonitoringSession> = new Map();
  private sessionResults: Map<string, MonitoringResult> = new Map();
  private schedules: Map<string, MonitoringSchedule> = new Map();
  private runTimes: number[] = [];

  constructor(config: Partial<BrandMonitoringConfig> = {}) {
    super();
    const configWithDefaults = {
      brandName: config.brandName || 'Default',
      ...config,
    };
    this.config = BrandMonitoringConfigSchema.parse(configWithDefaults);
    this.state = {
      totalMentionsProcessed: config.initialState?.totalMentionsProcessed || 0,
      lastMonitoringRun: config.initialState?.lastMonitoringRun,
    };
    this.stats = this.createEmptyStats();
  }

  async initialize(): Promise<void> {
    try {
      await this.initializeServices();
      this.initialized = true;
      this.running = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async initializeServices(): Promise<void> {
    // Create services
    this.platformAdapter = createPlatformAdapterService();
    this.mentionExtraction = createMentionExtractionService({
      brandName: this.config.brandName,
      brandAliases: this.config.brandAliases,
    });
    this.sentimentScoring = createSentimentScoringService();
    this.trendDetection = createTrendDetectionService();
    this.riskAssessment = createRiskAssessmentService({
      brandName: this.config.brandName,
    });
    this.performanceModel = createPerformanceModelService({
      brandName: this.config.brandName,
      platforms: this.config.platforms.map(p => p.id),
    });

    // Initialize all services
    await Promise.all([
      this.platformAdapter.initialize(),
      this.mentionExtraction.initialize(),
      this.sentimentScoring.initialize(),
      this.trendDetection.initialize(),
      this.riskAssessment.initialize(),
      this.performanceModel.initialize(),
    ]);

    // Update statuses
    for (const key of Object.keys(this.serviceStatuses)) {
      this.serviceStatuses[key] = 'ready';
    }
  }

  async shutdown(): Promise<void> {
    this.running = false;

    // Terminate all active sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.status === 'running') {
        session.status = 'terminated';
        session.endTime = new Date();
        this.sessions.set(sessionId, session);
      }
    }

    // Shutdown all services
    await Promise.all([
      this.platformAdapter?.shutdown(),
      this.mentionExtraction?.shutdown(),
      this.sentimentScoring?.shutdown(),
      this.trendDetection?.shutdown(),
      this.riskAssessment?.shutdown(),
      this.performanceModel?.shutdown(),
    ]);

    // Update statuses
    for (const key of Object.keys(this.serviceStatuses)) {
      this.serviceStatuses[key] = 'stopped';
    }

    this.emit('shutdown');
  }

  isRunning(): boolean {
    return this.running;
  }

  getConfig(): BrandMonitoringConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<BrandMonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  async monitor(options: MonitoringOptions = {}): Promise<MonitoringResult> {
    const startTime = Date.now();
    const sessionId = this.generateId('session');

    // Resolve time range
    const timeRange = this.resolveTimeRange(options.timeRange);

    // Get enabled platforms (filtered by options if provided)
    const platforms = this.getTargetPlatforms(options.platforms);
    const errors: string[] = [];
    let partialResults = false;

    // Collect mentions from all platforms
    const mentionsByPlatform: MentionsByPlatform = {};
    let totalMentions = 0;

    for (const platform of platforms) {
      try {
        // Simulate mention collection
        const mentions = this.simulateMentions(platform.id, 5);
        mentionsByPlatform[platform.id] = mentions;
        totalMentions += mentions.length;
      } catch (error) {
        errors.push(`Failed to collect from ${platform.id}: ${error}`);
        partialResults = true;
      }
    }

    // Emit progress
    this.emit('sessionProgress', { sessionId, progress: 0.3, stage: 'mentions_collected' });

    // Analyze sentiment
    const sentimentAnalysis = await this.analyzeSentiment(mentionsByPlatform);

    this.emit('sessionProgress', { sessionId, progress: 0.5, stage: 'sentiment_analyzed' });

    // Detect trends
    const trends = await this.detectTrends(mentionsByPlatform);

    this.emit('sessionProgress', { sessionId, progress: 0.7, stage: 'trends_detected' });

    // Assess risks
    const risks = await this.assessRisks(mentionsByPlatform, sentimentAnalysis);

    // Calculate performance
    const performance = await this.calculatePerformance(mentionsByPlatform);

    // Cross-platform aggregation
    const crossPlatform = this.aggregateCrossPlatform(mentionsByPlatform, sentimentAnalysis);

    // Generate insights
    const insights = this.generateInsights(
      mentionsByPlatform,
      sentimentAnalysis,
      trends,
      risks,
      performance
    );

    // Update state and stats
    this.state.lastMonitoringRun = new Date();
    this.state.totalMentionsProcessed += totalMentions;
    this.stats.totalMonitoringRuns++;
    this.stats.totalMentionsProcessed += totalMentions;

    const endTime = Date.now();
    this.runTimes.push(endTime - startTime);
    this.stats.averageRunTimeMs =
      this.runTimes.reduce((sum, t) => sum + t, 0) / this.runTimes.length;
    this.stats.lastRunTime = new Date();

    const result: MonitoringResult = {
      sessionId,
      status: errors.length > 0 ? 'partial' : 'completed',
      partialResults,
      errors: errors.length > 0 ? errors : undefined,
      timeRange,
      mentions: {
        total: totalMentions,
        byPlatform: mentionsByPlatform,
      },
      sentimentAnalysis,
      trends,
      risks,
      performance,
      crossPlatform,
      insights,
    };

    return result;
  }

  async startSession(options: MonitoringOptions = {}): Promise<MonitoringSession> {
    const sessionId = this.generateId('session');
    const platforms = options.platforms || this.config.platforms.filter(p => p.enabled).map(p => p.id);

    const session: MonitoringSession = {
      id: sessionId,
      status: 'running',
      startTime: new Date(),
      platforms,
      progress: 0,
    };

    this.sessions.set(sessionId, session);

    // Start async monitoring
    this.runSessionAsync(sessionId, options);

    return session;
  }

  private async runSessionAsync(sessionId: string, options: MonitoringOptions): Promise<void> {
    try {
      // Emit initial progress
      setTimeout(() => {
        this.emit('sessionProgress', { sessionId, progress: 0.1 });
      }, 50);

      const result = await this.monitor(options);
      this.sessionResults.set(sessionId, result);

      const session = this.sessions.get(sessionId);
      if (session && session.status === 'running') {
        session.status = 'completed';
        session.endTime = new Date();
        session.progress = 1;
        this.sessions.set(sessionId, session);
      }
    } catch (error) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.status = 'failed';
        session.endTime = new Date();
        this.sessions.set(sessionId, session);
      }
    }
  }

  async waitForSession(sessionId: string): Promise<MonitoringResult> {
    // Wait for session to complete
    while (true) {
      const session = this.sessions.get(sessionId);
      if (!session || session.status === 'completed' || session.status === 'failed') {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const result = this.sessionResults.get(sessionId);
    if (result) {
      return result;
    }

    // Return error result if no result found
    return {
      sessionId,
      status: 'failed',
      timeRange: { start: new Date(), end: new Date() },
      mentions: { total: 0, byPlatform: {} },
      sentimentAnalysis: { overall: { score: 0, label: 'neutral' }, byPlatform: {} },
      trends: { volume: { direction: 'stable', changePercent: 0 }, topics: [] },
      risks: { level: 'minimal', categories: [], threats: [] },
      performance: { visibilityScore: 0, platformScores: {} },
      crossPlatform: { totalMentions: 0, averageSentiment: 0, topPlatform: '' },
      insights: { summary: '', keyTrends: [], potentialRisks: [], recommendations: [], overallSentiment: 0 },
    };
  }

  async cancelSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'cancelled';
      session.endTime = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  getSessionStatus(sessionId: string): SessionStatus {
    const session = this.sessions.get(sessionId);
    return session?.status || 'pending';
  }

  getActiveSessions(): MonitoringSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'running');
  }

  scheduleMonitoring(options: {
    frequency?: MonitoringFrequency;
    cron?: string;
    startTime?: Date;
  }): MonitoringSchedule {
    const scheduleId = this.generateId('schedule');

    const schedule: MonitoringSchedule = {
      id: scheduleId,
      frequency: options.frequency,
      cron: options.cron,
      nextRun: options.startTime || new Date(Date.now() + 3600000), // 1 hour from now
      startTime: options.startTime,
    };

    this.schedules.set(scheduleId, schedule);
    return schedule;
  }

  cancelSchedule(scheduleId: string): void {
    this.schedules.delete(scheduleId);
  }

  getActiveSchedules(): MonitoringSchedule[] {
    return Array.from(this.schedules.values());
  }

  getServicesStatus(): Record<string, ServiceStatus> {
    return { ...this.serviceStatuses };
  }

  areServicesReady(): boolean {
    return Object.values(this.serviceStatuses).every(
      status => status === 'ready' || status === 'degraded'
    );
  }

  degradeService(serviceName: string): void {
    if (this.serviceStatuses[serviceName]) {
      this.serviceStatuses[serviceName] = 'degraded';
    }
  }

  failService(serviceName: string): void {
    if (this.serviceStatuses[serviceName]) {
      this.serviceStatuses[serviceName] = 'failed';
    }
  }

  getState(): AgentState {
    return { ...this.state };
  }

  exportState(): string {
    return JSON.stringify(this.state);
  }

  importState(stateJson: string): void {
    try {
      const parsed = JSON.parse(stateJson);
      this.state = {
        lastMonitoringRun: parsed.lastMonitoringRun ? new Date(parsed.lastMonitoringRun) : undefined,
        totalMentionsProcessed: parsed.totalMentionsProcessed || 0,
      };
    } catch (error) {
      this.emit('error', new Error('Failed to import state'));
    }
  }

  getCapabilities(): AgentCapabilities[] {
    return [
      'mention_extraction',
      'sentiment_analysis',
      'trend_detection',
      'risk_assessment',
      'performance_modeling',
    ];
  }

  hasCapability(capability: string): boolean {
    return this.getCapabilities().includes(capability as AgentCapabilities);
  }

  async handleCollaborationRequest(request: CollaborationRequest): Promise<CollaborationResponse> {
    try {
      switch (request.type) {
        case 'data_request':
          return {
            success: true,
            data: { type: request.payload.dataType, available: true },
          };
        case 'insight_share':
          return { success: true };
        case 'alert_forward':
          return { success: true };
        default:
          return { success: false, error: 'Unknown request type' };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async requestCollaboration(request: {
    targetAgentId: string;
    type: string;
    payload: unknown;
  }): Promise<CollaborationResponse> {
    // In a real implementation, this would communicate with other agents
    return { success: true, data: { acknowledged: true } };
  }

  async register(orchestratorId: string): Promise<void> {
    this.emit('registered', { orchestratorId, agentId: 'brand-monitoring' });
  }

  async checkHealth(): Promise<HealthCheck> {
    const services = { ...this.serviceStatuses };

    let status: HealthStatus = 'healthy';

    const statuses = Object.values(services);
    if (statuses.some(s => s === 'failed')) {
      status = 'unhealthy';
    } else if (statuses.some(s => s === 'degraded')) {
      status = 'degraded';
    }

    return {
      status,
      services,
      lastCheck: new Date(),
    };
  }

  getStats(): AgentStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = this.createEmptyStats();
    this.runTimes = [];
  }

  triggerTestAlert(alert: { type: string; severity: string; message: string }): void {
    const fullAlert: AgentAlert = {
      id: this.generateId('alert'),
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date(),
    };
    this.stats.alertsGenerated++;
    this.emit('alert', fullAlert);
  }

  triggerError(error: Error): void {
    this.emit('error', error);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private resolveTimeRange(range?: TimeRange | string): TimeRange {
    if (!range) {
      return {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
    }

    if (typeof range === 'string') {
      const now = new Date();
      switch (range) {
        case 'last_24_hours':
          return { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };
        case 'last_7_days':
          return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
        case 'last_30_days':
          return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
        default:
          return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
      }
    }

    return range;
  }

  private getTargetPlatforms(platformIds?: string[]): PlatformConfig[] {
    const enabledPlatforms = this.config.platforms.filter(p => p.enabled);

    if (platformIds && platformIds.length > 0) {
      return enabledPlatforms.filter(p => platformIds.includes(p.id));
    }

    return enabledPlatforms;
  }

  private simulateMentions(platformId: string, count: number): Array<{
    id: string;
    text: string;
    sentiment: number;
    timestamp: Date;
  }> {
    const mentions = [];
    for (let i = 0; i < count; i++) {
      mentions.push({
        id: `mention-${platformId}-${i}`,
        text: `Sample mention about ${this.config.brandName} on ${platformId}`,
        sentiment: Math.random() * 2 - 1, // -1 to 1
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
    return mentions;
  }

  private async analyzeSentiment(mentionsByPlatform: MentionsByPlatform): Promise<SentimentAnalysis> {
    const byPlatform: Record<string, { score: number; label: string }> = {};
    let totalScore = 0;
    let totalCount = 0;

    for (const [platform, mentions] of Object.entries(mentionsByPlatform)) {
      if (mentions.length === 0) continue;

      const avgSentiment = mentions.reduce((sum, m) => sum + m.sentiment, 0) / mentions.length;
      byPlatform[platform] = {
        score: avgSentiment,
        label: this.sentimentLabel(avgSentiment),
      };
      totalScore += avgSentiment * mentions.length;
      totalCount += mentions.length;
    }

    const overallScore = totalCount > 0 ? totalScore / totalCount : 0;

    return {
      overall: {
        score: overallScore,
        label: this.sentimentLabel(overallScore),
      },
      byPlatform,
    };
  }

  private sentimentLabel(score: number): string {
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    return 'neutral';
  }

  private async detectTrends(mentionsByPlatform: MentionsByPlatform): Promise<TrendData> {
    const allMentions = Object.values(mentionsByPlatform).flat();

    // Simple trend detection
    const volume = {
      direction: 'stable' as 'increasing' | 'decreasing' | 'stable',
      changePercent: 0,
    };

    const topics = [
      { topic: 'product quality', mentions: Math.floor(allMentions.length * 0.3), trend: 'rising' as const },
      { topic: 'customer service', mentions: Math.floor(allMentions.length * 0.2), trend: 'stable' as const },
    ];

    return { volume, topics };
  }

  private async assessRisks(
    mentionsByPlatform: MentionsByPlatform,
    sentimentAnalysis: SentimentAnalysis
  ): Promise<RiskData> {
    const overallSentiment = sentimentAnalysis.overall.score;

    let level: RiskLevel = 'minimal';
    if (overallSentiment < -0.5) {
      level = 'high';
    } else if (overallSentiment < -0.3) {
      level = 'medium';
    } else if (overallSentiment < 0) {
      level = 'low';
    }

    return {
      level,
      categories: overallSentiment < 0 ? ['reputational'] : [],
      threats: [],
    };
  }

  private async calculatePerformance(mentionsByPlatform: MentionsByPlatform): Promise<PerformanceData> {
    const platformScores: Record<string, number> = {};
    let totalScore = 0;
    let platformCount = 0;

    for (const [platform, mentions] of Object.entries(mentionsByPlatform)) {
      const score = Math.min(100, mentions.length * 10);
      platformScores[platform] = score;
      totalScore += score;
      platformCount++;
    }

    return {
      visibilityScore: platformCount > 0 ? totalScore / platformCount : 0,
      platformScores,
    };
  }

  private aggregateCrossPlatform(
    mentionsByPlatform: MentionsByPlatform,
    sentimentAnalysis: SentimentAnalysis
  ): CrossPlatformData {
    const allMentions = Object.values(mentionsByPlatform).flat();
    const totalMentions = allMentions.length;

    let topPlatform = '';
    let maxMentions = 0;
    for (const [platform, mentions] of Object.entries(mentionsByPlatform)) {
      if (mentions.length > maxMentions) {
        maxMentions = mentions.length;
        topPlatform = platform;
      }
    }

    return {
      totalMentions,
      averageSentiment: sentimentAnalysis.overall.score,
      topPlatform,
    };
  }

  private generateInsights(
    mentionsByPlatform: MentionsByPlatform,
    sentimentAnalysis: SentimentAnalysis,
    trends: TrendData,
    risks: RiskData,
    performance: PerformanceData
  ): MonitoringInsights {
    const totalMentions = Object.values(mentionsByPlatform).flat().length;

    const summary = `Monitored ${totalMentions} mentions across ${Object.keys(mentionsByPlatform).length} platforms. ` +
      `Overall sentiment is ${sentimentAnalysis.overall.label} (${sentimentAnalysis.overall.score.toFixed(2)}). ` +
      `Risk level: ${risks.level}.`;

    const keyTrends = trends.topics.map(t => `${t.topic}: ${t.trend}`);

    const potentialRisks = risks.categories.map(c => `${c} risk detected`);

    const recommendations: InsightRecommendation[] = [];
    if (sentimentAnalysis.overall.score < 0) {
      recommendations.push({
        id: 'rec-1',
        action: 'Address negative sentiment',
        description: 'Consider proactive engagement to improve brand perception',
        priority: 'high',
        impact: 0.7,
      });
    }
    if (performance.visibilityScore < 50) {
      recommendations.push({
        id: 'rec-2',
        action: 'Increase visibility',
        description: 'Create more content optimized for AI platforms',
        priority: 'medium',
        impact: 0.5,
      });
    }

    return {
      summary,
      keyTrends,
      potentialRisks,
      recommendations,
      overallSentiment: sentimentAnalysis.overall.score,
    };
  }

  private createEmptyStats(): AgentStats {
    return {
      totalMonitoringRuns: 0,
      totalMentionsProcessed: 0,
      averageRunTimeMs: 0,
      alertsGenerated: 0,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createBrandMonitoringSubAgent(
  config: Partial<BrandMonitoringConfig> = {}
): BrandMonitoringSubAgent {
  return new BrandMonitoringSubAgentImpl(config);
}
