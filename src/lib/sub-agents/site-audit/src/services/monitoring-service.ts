/**
 * MonitoringService - Scheduled crawls, snapshots, anomaly detection, alerts, and reporting
 * Part of the Site Audit Sub-Agent
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Configuration schema
const MonitoringConfigSchema = z.object({
  enableScheduledCrawls: z.boolean().default(true),
  enableAnomalyDetection: z.boolean().default(true),
  enableAlerts: z.boolean().default(true),
  defaultCrawlInterval: z.number().positive().default(86400000), // 24 hours in ms
  maxStoredSnapshots: z.number().positive().default(365),
  anomalyStandardDeviations: z.number().positive().default(2),
});

export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;

// Scheduled Crawl types
export interface CrawlSchedule {
  domain: string;
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  cronExpression?: string;
  startTime?: string;
  timezone?: string;
  maxPages?: number;
}

export interface ScheduledCrawl {
  id: string;
  domain: string;
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string;
  startTime?: string;
  timezone: string;
  maxPages?: number;
  status: 'active' | 'paused' | 'running';
  nextRun: Date;
  lastRun?: Date;
  createdAt: Date;
}

export interface CrawlResult {
  scheduleId: string;
  success: boolean;
  nextRun?: Date;
  cronExpression?: string;
}

export interface CrawlCompletionData {
  startTime: Date;
  endTime: Date;
  pagesCount: number;
  issues: number;
  success: boolean;
}

export interface CrawlHistoryEntry extends CrawlCompletionData {
  id: string;
  scheduleId: string;
}

// Snapshot types
export interface SnapshotMetrics {
  pagesCount?: number;
  technicalScore?: number;
  performanceScore?: number;
  semanticScore?: number;
  aiVisibilityScore?: number;
  issues?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
}

export interface Snapshot {
  id: string;
  domain: string;
  timestamp: Date;
  metrics: SnapshotMetrics;
}

export interface SnapshotComparison {
  technicalScoreChange?: number;
  performanceScoreChange?: number;
  semanticScoreChange?: number;
  aiVisibilityScoreChange?: number;
  pagesCountChange?: number;
  improved: boolean;
}

// Anomaly Detection types
export interface AnomalyDetection {
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
}

export interface AnomalyThreshold {
  warningThreshold: number;
  criticalThreshold: number;
}

// Trend Analysis types
export interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable';
  changePercent: number;
  velocity: number; // Change per day
  dataPoints: number;
}

export interface MetricForecast {
  predictedValue: number;
  confidence: number;
  horizon: number; // Days ahead
}

// Alert types
export interface AlertConfig {
  name: string;
  domain: string;
  metric: string;
  condition: 'drops_below' | 'rises_above' | 'changes_by' | 'changes_by_percent';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels?: string[];
}

export interface AlertRule extends AlertConfig {
  id: string;
  enabled: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  domain: string;
  metric: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'acknowledged' | 'dismissed';
  triggeredAt: Date;
  value: number;
  threshold: number;
}

// Report types
export interface MonitoringReport {
  domain: string;
  generatedAt: Date;
  summary: string;
  metrics: SnapshotMetrics;
  trends: Record<string, TrendAnalysis>;
  alerts: Alert[];
  anomalies: AnomalyDetection[];
}

export interface WeeklyReport {
  domain: string;
  weekStartDate: Date;
  weekEndDate: Date;
  averageScores: SnapshotMetrics;
  weekOverWeekChange: SnapshotMetrics;
  highlights: string[];
  concerns: string[];
}

export interface ComparisonReport {
  domain: string;
  currentPeriodAverage: number;
  previousPeriodAverage: number;
  percentChange: number;
}

// Health Check types
export interface HealthCheck {
  domain: string;
  isHealthy: boolean;
  checks: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
  checkedAt: Date;
}

export interface UptimeCheck {
  timestamp: Date;
  isUp: boolean;
}

export interface UptimeStats {
  uptimePercentage: number;
  downtimeIncidents: number;
  totalChecks: number;
}

export class MonitoringService extends EventEmitter {
  private config: MonitoringConfig;
  private scheduledCrawls: Map<string, ScheduledCrawl> = new Map();
  private crawlHistory: Map<string, CrawlHistoryEntry[]> = new Map();
  private snapshots: Map<string, Snapshot[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private anomalyThresholds: Map<string, AnomalyThreshold> = new Map();
  private uptimeChecks: Map<string, UptimeCheck[]> = new Map();
  private idCounter = 0;

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    this.config = MonitoringConfigSchema.parse(config);

    // Set default anomaly thresholds
    this.anomalyThresholds.set('technicalScore', { warningThreshold: 10, criticalThreshold: 25 });
    this.anomalyThresholds.set('performanceScore', { warningThreshold: 10, criticalThreshold: 25 });
    this.anomalyThresholds.set('pagesCount', { warningThreshold: 20, criticalThreshold: 40 });
  }

  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  shutdown(): void {
    this.removeAllListeners();
    this.scheduledCrawls.clear();
    this.crawlHistory.clear();
    this.snapshots.clear();
    this.alertRules.clear();
    this.alerts.clear();
    this.anomalyThresholds.clear();
    this.uptimeChecks.clear();
  }

  private generateId(prefix: string): string {
    return `${prefix}-${++this.idCounter}-${Date.now()}`;
  }

  // Scheduled Crawl Management
  createScheduledCrawl(schedule: CrawlSchedule): CrawlResult {
    const id = this.generateId('crawl');

    const interval = schedule.interval || 'daily';
    const cronExpression = schedule.cronExpression || this.intervalToCron(interval);

    const scheduledCrawl: ScheduledCrawl = {
      id,
      domain: schedule.domain,
      interval: schedule.cronExpression ? 'custom' : interval,
      cronExpression: schedule.cronExpression,
      startTime: schedule.startTime,
      timezone: schedule.timezone || 'UTC',
      maxPages: schedule.maxPages,
      status: 'active',
      nextRun: this.calculateNextRun(interval),
      createdAt: new Date()
    };

    this.scheduledCrawls.set(id, scheduledCrawl);

    return {
      scheduleId: id,
      success: true,
      nextRun: scheduledCrawl.nextRun,
      cronExpression: schedule.cronExpression
    };
  }

  private intervalToCron(interval: string): string {
    switch (interval) {
      case 'hourly': return '0 * * * *';
      case 'daily': return '0 0 * * *';
      case 'weekly': return '0 0 * * 0';
      case 'monthly': return '0 0 1 * *';
      default: return '0 0 * * *';
    }
  }

  private calculateNextRun(interval: string): Date {
    const now = new Date();
    switch (interval) {
      case 'hourly':
        return new Date(now.getTime() + 3600000);
      case 'daily':
        return new Date(now.getTime() + 86400000);
      case 'weekly':
        return new Date(now.getTime() + 604800000);
      case 'monthly':
        return new Date(now.getTime() + 2592000000);
      default:
        return new Date(now.getTime() + 86400000);
    }
  }

  getScheduledCrawlCount(): number {
    return this.scheduledCrawls.size;
  }

  listScheduledCrawls(): ScheduledCrawl[] {
    return Array.from(this.scheduledCrawls.values());
  }

  getScheduledCrawl(scheduleId: string): ScheduledCrawl | null {
    return this.scheduledCrawls.get(scheduleId) || null;
  }

  updateScheduledCrawl(scheduleId: string, updates: Partial<CrawlSchedule>): { success: boolean } {
    const crawl = this.scheduledCrawls.get(scheduleId);
    if (!crawl) {
      return { success: false };
    }

    if (updates.interval) {
      crawl.interval = updates.interval;
      crawl.nextRun = this.calculateNextRun(updates.interval);
    }
    if (updates.maxPages !== undefined) {
      crawl.maxPages = updates.maxPages;
    }
    if (updates.startTime) {
      crawl.startTime = updates.startTime;
    }
    if (updates.timezone) {
      crawl.timezone = updates.timezone;
    }

    return { success: true };
  }

  deleteScheduledCrawl(scheduleId: string): { success: boolean } {
    return { success: this.scheduledCrawls.delete(scheduleId) };
  }

  pauseScheduledCrawl(scheduleId: string): void {
    const crawl = this.scheduledCrawls.get(scheduleId);
    if (crawl) {
      crawl.status = 'paused';
    }
  }

  resumeScheduledCrawl(scheduleId: string): void {
    const crawl = this.scheduledCrawls.get(scheduleId);
    if (crawl) {
      crawl.status = 'active';
    }
  }

  recordCrawlCompletion(scheduleId: string, data: CrawlCompletionData): void {
    const entry: CrawlHistoryEntry = {
      id: this.generateId('history'),
      scheduleId,
      ...data
    };

    const history = this.crawlHistory.get(scheduleId) || [];
    history.push(entry);
    this.crawlHistory.set(scheduleId, history);

    // Update last run
    const crawl = this.scheduledCrawls.get(scheduleId);
    if (crawl) {
      crawl.lastRun = data.endTime;
      crawl.nextRun = this.calculateNextRun(crawl.interval);
    }
  }

  getCrawlHistory(scheduleId: string): CrawlHistoryEntry[] {
    return this.crawlHistory.get(scheduleId) || [];
  }

  // Snapshot Management
  storeSnapshot(data: {
    domain: string;
    timestamp: Date;
    metrics: SnapshotMetrics;
  }): { success: boolean; snapshotId: string } {
    const id = this.generateId('snap');

    const snapshot: Snapshot = {
      id,
      domain: data.domain,
      timestamp: data.timestamp,
      metrics: data.metrics
    };

    let domainSnapshots = this.snapshots.get(data.domain) || [];
    domainSnapshots.push(snapshot);

    // Enforce retention limit
    if (domainSnapshots.length > this.config.maxStoredSnapshots) {
      domainSnapshots = domainSnapshots
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.config.maxStoredSnapshots);
    }

    this.snapshots.set(data.domain, domainSnapshots);

    // Check alert rules
    if (this.config.enableAlerts) {
      this.checkAlertRules(data.domain, data.metrics);
    }

    return { success: true, snapshotId: id };
  }

  getSnapshots(domain: string, dateRange?: { from: Date; to: Date }): Snapshot[] {
    let snapshots = this.snapshots.get(domain) || [];

    if (dateRange) {
      snapshots = snapshots.filter(s =>
        s.timestamp >= dateRange.from && s.timestamp <= dateRange.to
      );
    }

    return snapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getLatestSnapshot(domain: string): Snapshot | null {
    const snapshots = this.getSnapshots(domain);
    return snapshots.length > 0 ? snapshots[0] : null;
  }

  compareSnapshots(snapshotId1: string, snapshotId2: string): SnapshotComparison {
    let snapshot1: Snapshot | null = null;
    let snapshot2: Snapshot | null = null;

    for (const snapshots of this.snapshots.values()) {
      for (const s of snapshots) {
        if (s.id === snapshotId1) snapshot1 = s;
        if (s.id === snapshotId2) snapshot2 = s;
      }
    }

    if (!snapshot1 || !snapshot2) {
      return { improved: false };
    }

    const comparison: SnapshotComparison = {
      improved: false
    };

    if (snapshot1.metrics.technicalScore !== undefined && snapshot2.metrics.technicalScore !== undefined) {
      comparison.technicalScoreChange = snapshot2.metrics.technicalScore - snapshot1.metrics.technicalScore;
    }

    if (snapshot1.metrics.performanceScore !== undefined && snapshot2.metrics.performanceScore !== undefined) {
      comparison.performanceScoreChange = snapshot2.metrics.performanceScore - snapshot1.metrics.performanceScore;
    }

    if (snapshot1.metrics.pagesCount !== undefined && snapshot2.metrics.pagesCount !== undefined) {
      comparison.pagesCountChange = snapshot2.metrics.pagesCount - snapshot1.metrics.pagesCount;
    }

    // Determine if overall improved
    const changes = [
      comparison.technicalScoreChange,
      comparison.performanceScoreChange
    ].filter(c => c !== undefined) as number[];

    comparison.improved = changes.length > 0 && changes.reduce((sum, c) => sum + c, 0) > 0;

    return comparison;
  }

  // Anomaly Detection
  detectAnomalies(domain: string): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const snapshots = this.getSnapshots(domain);

    if (snapshots.length < 5) {
      return anomalies; // Need sufficient history
    }

    const latestSnapshot = snapshots[0];
    const historicalSnapshots = snapshots.slice(1, 11); // Last 10 (excluding current)

    const metricsToCheck = ['technicalScore', 'performanceScore', 'pagesCount'] as const;

    for (const metric of metricsToCheck) {
      const currentValue = latestSnapshot.metrics[metric];
      if (currentValue === undefined) continue;

      const historicalValues = historicalSnapshots
        .map(s => s.metrics[metric])
        .filter((v): v is number => v !== undefined);

      if (historicalValues.length < 5) continue;

      const anomalyScore = this.calculateAnomalyScore(currentValue, historicalValues);
      const threshold = this.anomalyThresholds.get(metric);

      if (anomalyScore > this.config.anomalyStandardDeviations) {
        const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
        const percentChange = Math.abs((currentValue - mean) / mean * 100);

        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (threshold) {
          if (percentChange >= threshold.criticalThreshold) severity = 'critical';
          else if (percentChange >= threshold.warningThreshold) severity = 'high';
          else severity = 'medium';
        } else if (anomalyScore > 3) {
          severity = 'high';
        }

        anomalies.push({
          metric,
          currentValue,
          expectedValue: mean,
          deviation: anomalyScore,
          severity,
          detectedAt: new Date()
        });
      }
    }

    return anomalies;
  }

  calculateAnomalyScore(currentValue: number, historicalData: number[]): number {
    if (historicalData.length === 0) return 0;

    const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const squaredDiffs = historicalData.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / historicalData.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    return Math.abs(currentValue - mean) / stdDev;
  }

  setAnomalyThreshold(metric: string, threshold: AnomalyThreshold): void {
    this.anomalyThresholds.set(metric, threshold);
  }

  getAnomalyThreshold(metric: string): AnomalyThreshold {
    return this.anomalyThresholds.get(metric) || { warningThreshold: 10, criticalThreshold: 25 };
  }

  // Trend Analysis
  analyzeTrend(domain: string, metric: string, days: number): TrendAnalysis {
    const snapshots = this.getSnapshots(domain);
    const cutoff = new Date(Date.now() - days * 86400000);

    const relevantSnapshots = snapshots
      .filter(s => s.timestamp >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const values = relevantSnapshots
      .map(s => s.metrics[metric as keyof SnapshotMetrics] as number | undefined)
      .filter((v): v is number => v !== undefined);

    if (values.length < 2) {
      return {
        direction: 'stable',
        changePercent: 0,
        velocity: 0,
        dataPoints: values.length
      };
    }

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const changePercent = ((lastValue - firstValue) / firstValue) * 100;
    const velocity = (lastValue - firstValue) / days;

    let direction: 'improving' | 'declining' | 'stable';
    if (Math.abs(changePercent) < 5) {
      direction = 'stable';
    } else if (changePercent > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }

    return {
      direction,
      changePercent: Math.round(changePercent * 100) / 100,
      velocity,
      dataPoints: values.length
    };
  }

  calculateMovingAverage(domain: string, metric: string, window: number): number[] {
    const snapshots = this.getSnapshots(domain)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const values = snapshots
      .map(s => s.metrics[metric as keyof SnapshotMetrics] as number | undefined)
      .filter((v): v is number => v !== undefined);

    const movingAverages: number[] = [];

    for (let i = window - 1; i < values.length; i++) {
      const windowValues = values.slice(i - window + 1, i + 1);
      const avg = windowValues.reduce((a, b) => a + b, 0) / window;
      movingAverages.push(Math.round(avg * 100) / 100);
    }

    return movingAverages;
  }

  forecastMetric(domain: string, metric: string, daysAhead: number): MetricForecast {
    const trend = this.analyzeTrend(domain, metric, 30);

    const snapshots = this.getSnapshots(domain);
    const latestValue = snapshots[0]?.metrics[metric as keyof SnapshotMetrics] as number | undefined;

    if (latestValue === undefined) {
      return {
        predictedValue: 0,
        confidence: 0,
        horizon: daysAhead
      };
    }

    const predictedValue = latestValue + (trend.velocity * daysAhead);

    // Confidence based on data points and trend stability
    let confidence = Math.min(0.9, trend.dataPoints / 30);
    if (trend.direction === 'stable') {
      confidence *= 1.1;
    }

    return {
      predictedValue: Math.round(predictedValue * 100) / 100,
      confidence: Math.min(1, confidence),
      horizon: daysAhead
    };
  }

  // Alert Management
  createAlertRule(config: AlertConfig): { success: boolean; ruleId: string } {
    const id = this.generateId('rule');

    const rule: AlertRule = {
      id,
      ...config,
      enabled: true,
      createdAt: new Date()
    };

    this.alertRules.set(id, rule);

    return { success: true, ruleId: id };
  }

  private checkAlertRules(domain: string, metrics: SnapshotMetrics): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled || rule.domain !== domain) continue;

      const metricValue = metrics[rule.metric as keyof SnapshotMetrics] as number | undefined;
      if (metricValue === undefined) continue;

      let triggered = false;

      switch (rule.condition) {
        case 'drops_below':
          triggered = metricValue < rule.threshold;
          break;
        case 'rises_above':
          triggered = metricValue > rule.threshold;
          break;
        case 'changes_by':
          // Would need previous value
          break;
        case 'changes_by_percent':
          // Would need previous value
          break;
      }

      if (triggered) {
        // Check if already triggered (avoid duplicates)
        const existingAlert = Array.from(this.alerts.values()).find(
          a => a.ruleId === rule.id && a.status === 'pending'
        );

        if (!existingAlert) {
          const alert: Alert = {
            id: this.generateId('alert'),
            ruleId: rule.id,
            domain,
            metric: rule.metric,
            message: `${rule.metric} ${rule.condition.replace('_', ' ')} ${rule.threshold}`,
            severity: rule.severity,
            status: 'pending',
            triggeredAt: new Date(),
            value: metricValue,
            threshold: rule.threshold
          };

          this.alerts.set(alert.id, alert);
          rule.lastTriggered = new Date();

          this.emit('alert:triggered', alert);
        }
      }
    }
  }

  getPendingAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.status === 'pending');
  }

  getAlert(alertId: string): Alert | null {
    return this.alerts.get(alertId) || null;
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
    }
  }

  dismissAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'dismissed';
    }
  }

  getAlertHistory(domain: string, days: number): Alert[] {
    const cutoff = new Date(Date.now() - days * 86400000);
    return Array.from(this.alerts.values())
      .filter(a => a.domain === domain && a.triggeredAt >= cutoff)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  // Reporting
  generateDailyReport(domain: string): MonitoringReport {
    const latestSnapshot = this.getLatestSnapshot(domain);
    const anomalies = this.detectAnomalies(domain);
    const alerts = this.getAlertHistory(domain, 1);

    const trends: Record<string, TrendAnalysis> = {};
    const metricsToAnalyze = ['technicalScore', 'performanceScore', 'semanticScore', 'aiVisibilityScore'];
    for (const metric of metricsToAnalyze) {
      trends[metric] = this.analyzeTrend(domain, metric, 7);
    }

    return {
      domain,
      generatedAt: new Date(),
      summary: this.generateSummary(latestSnapshot?.metrics, anomalies, alerts),
      metrics: latestSnapshot?.metrics || {},
      trends,
      alerts,
      anomalies
    };
  }

  private generateSummary(metrics?: SnapshotMetrics, anomalies?: AnomalyDetection[], alerts?: Alert[]): string {
    const parts: string[] = [];

    if (metrics?.technicalScore !== undefined) {
      parts.push(`Technical score: ${metrics.technicalScore}`);
    }

    if (anomalies && anomalies.length > 0) {
      parts.push(`${anomalies.length} anomalies detected`);
    }

    if (alerts && alerts.length > 0) {
      parts.push(`${alerts.length} alerts triggered`);
    }

    return parts.length > 0 ? parts.join('. ') + '.' : 'No data available.';
  }

  generateWeeklyReport(domain: string): WeeklyReport {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 86400000);

    const snapshots = this.getSnapshots(domain, { from: weekStart, to: now });

    // Calculate averages
    const avgScores: SnapshotMetrics = {};
    const metrics = ['technicalScore', 'performanceScore', 'pagesCount'] as const;

    for (const metric of metrics) {
      const values = snapshots
        .map(s => s.metrics[metric])
        .filter((v): v is number => v !== undefined);

      if (values.length > 0) {
        avgScores[metric] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      }
    }

    // Week over week change (simplified)
    const weekOverWeekChange: SnapshotMetrics = {};
    const prevWeekSnapshots = this.getSnapshots(domain, {
      from: new Date(weekStart.getTime() - 7 * 86400000),
      to: weekStart
    });

    for (const metric of metrics) {
      const currentValues = snapshots.map(s => s.metrics[metric]).filter((v): v is number => v !== undefined);
      const prevValues = prevWeekSnapshots.map(s => s.metrics[metric]).filter((v): v is number => v !== undefined);

      if (currentValues.length > 0 && prevValues.length > 0) {
        const currentAvg = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
        const prevAvg = prevValues.reduce((a, b) => a + b, 0) / prevValues.length;
        weekOverWeekChange[metric] = Math.round((currentAvg - prevAvg) * 100) / 100;
      }
    }

    return {
      domain,
      weekStartDate: weekStart,
      weekEndDate: now,
      averageScores: avgScores,
      weekOverWeekChange,
      highlights: [],
      concerns: []
    };
  }

  generateComparisonReport(domain: string, options: {
    currentPeriod: { days: number };
    previousPeriod: { days: number };
  }): ComparisonReport {
    const now = Date.now();

    const currentSnapshots = this.getSnapshots(domain, {
      from: new Date(now - options.currentPeriod.days * 86400000),
      to: new Date(now)
    });

    const previousSnapshots = this.getSnapshots(domain, {
      from: new Date(now - (options.currentPeriod.days + options.previousPeriod.days) * 86400000),
      to: new Date(now - options.currentPeriod.days * 86400000)
    });

    const currentValues = currentSnapshots
      .map(s => s.metrics.technicalScore)
      .filter((v): v is number => v !== undefined);

    const previousValues = previousSnapshots
      .map(s => s.metrics.technicalScore)
      .filter((v): v is number => v !== undefined);

    const currentAvg = currentValues.length > 0
      ? currentValues.reduce((a, b) => a + b, 0) / currentValues.length
      : 0;

    const previousAvg = previousValues.length > 0
      ? previousValues.reduce((a, b) => a + b, 0) / previousValues.length
      : 0;

    const percentChange = previousAvg > 0
      ? ((currentAvg - previousAvg) / previousAvg) * 100
      : 0;

    return {
      domain,
      currentPeriodAverage: Math.round(currentAvg * 100) / 100,
      previousPeriodAverage: Math.round(previousAvg * 100) / 100,
      percentChange: Math.round(percentChange * 100) / 100
    };
  }

  exportReportData(domain: string, format: 'csv' | 'json'): string {
    const snapshots = this.getSnapshots(domain);

    if (format === 'json') {
      return JSON.stringify({
        domain,
        exportedAt: new Date().toISOString(),
        snapshots: snapshots.map(s => ({
          timestamp: s.timestamp.toISOString(),
          ...s.metrics
        }))
      }, null, 2);
    }

    // CSV format
    const headers = ['timestamp', 'technicalScore', 'performanceScore', 'pagesCount'];
    const rows = snapshots.map(s => [
      s.timestamp.toISOString(),
      s.metrics.technicalScore ?? '',
      s.metrics.performanceScore ?? '',
      s.metrics.pagesCount ?? ''
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  // Health Checks
  performHealthCheck(domain: string): HealthCheck {
    const checks: { name: string; passed: boolean; message?: string }[] = [];

    // Check for recent snapshot
    const latestSnapshot = this.getLatestSnapshot(domain);
    const hasRecentData = latestSnapshot && (Date.now() - latestSnapshot.timestamp.getTime()) < 86400000;
    checks.push({
      name: 'Recent Data',
      passed: hasRecentData,
      message: hasRecentData ? 'Data is up to date' : 'No recent data'
    });

    // Check for active schedule
    const hasActiveSchedule = Array.from(this.scheduledCrawls.values())
      .some(c => c.domain === domain && c.status === 'active');
    checks.push({
      name: 'Active Schedule',
      passed: hasActiveSchedule,
      message: hasActiveSchedule ? 'Monitoring active' : 'No active monitoring'
    });

    // Check for anomalies
    const anomalies = this.detectAnomalies(domain);
    checks.push({
      name: 'No Anomalies',
      passed: anomalies.length === 0,
      message: anomalies.length === 0 ? 'No anomalies detected' : `${anomalies.length} anomalies detected`
    });

    return {
      domain,
      isHealthy: checks.every(c => c.passed),
      checks,
      checkedAt: new Date()
    };
  }

  recordUptimeCheck(domain: string, check: UptimeCheck): void {
    const checks = this.uptimeChecks.get(domain) || [];
    checks.push(check);

    // Keep last 24 hours of checks
    const cutoff = new Date(Date.now() - 24 * 3600000);
    const filteredChecks = checks.filter(c => c.timestamp >= cutoff);

    this.uptimeChecks.set(domain, filteredChecks);
  }

  getUptimeStats(domain: string, hours: number): UptimeStats {
    const checks = this.uptimeChecks.get(domain) || [];
    const cutoff = new Date(Date.now() - hours * 3600000);

    const relevantChecks = checks.filter(c => c.timestamp >= cutoff);
    const upChecks = relevantChecks.filter(c => c.isUp);

    // Count downtime incidents (transitions from up to down)
    let downtimeIncidents = 0;
    for (let i = 1; i < relevantChecks.length; i++) {
      if (relevantChecks[i - 1].isUp && !relevantChecks[i].isUp) {
        downtimeIncidents++;
      }
    }

    const uptimePercentage = relevantChecks.length > 0
      ? (upChecks.length / relevantChecks.length) * 100
      : 100;

    return {
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      downtimeIncidents,
      totalChecks: relevantChecks.length
    };
  }
}

// Factory function
export function createMonitoringService(config?: Partial<MonitoringConfig>): MonitoringService {
  return new MonitoringService(config);
}
