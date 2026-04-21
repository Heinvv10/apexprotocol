import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MonitoringService,
  createMonitoringService,
  type MonitoringConfig,
  type ScheduledCrawl,
  type CrawlSchedule,
  type AnomalyDetection,
  type TrendAnalysis,
  type AlertConfig,
  type Alert,
  type MonitoringReport
} from '../src/services/monitoring-service';

describe('MonitoringService', () => {
  let service: MonitoringService;

  beforeEach(() => {
    service = createMonitoringService();
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Configuration', () => {
    it('should create service with default configuration', () => {
      const config = service.getConfig();
      expect(config.enableScheduledCrawls).toBe(true);
      expect(config.enableAnomalyDetection).toBe(true);
      expect(config.enableAlerts).toBe(true);
      expect(config.defaultCrawlInterval).toBe(86400000); // 24 hours
    });

    it('should accept custom configuration', () => {
      const customService = createMonitoringService({
        enableScheduledCrawls: false,
        defaultCrawlInterval: 3600000, // 1 hour
        maxStoredSnapshots: 100
      });
      const config = customService.getConfig();
      expect(config.enableScheduledCrawls).toBe(false);
      expect(config.defaultCrawlInterval).toBe(3600000);
      expect(config.maxStoredSnapshots).toBe(100);
      customService.shutdown();
    });

    it('should validate configuration values', () => {
      expect(() => createMonitoringService({ defaultCrawlInterval: -1 })).toThrow();
      expect(() => createMonitoringService({ maxStoredSnapshots: 0 })).toThrow();
    });
  });

  describe('Scheduled Crawl Management', () => {
    it('should create a scheduled crawl', () => {
      const schedule: CrawlSchedule = {
        domain: 'example.com',
        interval: 'daily',
        startTime: '02:00',
        timezone: 'UTC'
      };

      const result = service.createScheduledCrawl(schedule);

      expect(result.success).toBe(true);
      expect(result.scheduleId).toBeDefined();
      expect(result.nextRun).toBeDefined();
    });

    it('should support various crawl intervals', () => {
      const schedules: CrawlSchedule[] = [
        { domain: 'example1.com', interval: 'hourly' },
        { domain: 'example2.com', interval: 'daily' },
        { domain: 'example3.com', interval: 'weekly' },
        { domain: 'example4.com', interval: 'monthly' }
      ];

      for (const schedule of schedules) {
        const result = service.createScheduledCrawl(schedule);
        expect(result.success).toBe(true);
      }

      expect(service.getScheduledCrawlCount()).toBe(4);
    });

    it('should support custom cron expressions', () => {
      const schedule: CrawlSchedule = {
        domain: 'example.com',
        cronExpression: '0 0 * * MON', // Every Monday at midnight
        timezone: 'America/New_York'
      };

      const result = service.createScheduledCrawl(schedule);

      expect(result.success).toBe(true);
      expect(result.cronExpression).toBe('0 0 * * MON');
    });

    it('should list all scheduled crawls', () => {
      service.createScheduledCrawl({ domain: 'site1.com', interval: 'daily' });
      service.createScheduledCrawl({ domain: 'site2.com', interval: 'weekly' });

      const schedules = service.listScheduledCrawls();

      expect(schedules).toHaveLength(2);
      expect(schedules.some(s => s.domain === 'site1.com')).toBe(true);
    });

    it('should update a scheduled crawl', () => {
      const result = service.createScheduledCrawl({ domain: 'example.com', interval: 'daily' });
      const scheduleId = result.scheduleId;

      const updateResult = service.updateScheduledCrawl(scheduleId, {
        interval: 'weekly',
        maxPages: 500
      });

      expect(updateResult.success).toBe(true);

      const schedule = service.getScheduledCrawl(scheduleId);
      expect(schedule?.interval).toBe('weekly');
      expect(schedule?.maxPages).toBe(500);
    });

    it('should delete a scheduled crawl', () => {
      const result = service.createScheduledCrawl({ domain: 'example.com', interval: 'daily' });
      const scheduleId = result.scheduleId;

      const deleteResult = service.deleteScheduledCrawl(scheduleId);

      expect(deleteResult.success).toBe(true);
      expect(service.getScheduledCrawl(scheduleId)).toBeNull();
    });

    it('should pause and resume scheduled crawls', () => {
      const result = service.createScheduledCrawl({ domain: 'example.com', interval: 'daily' });
      const scheduleId = result.scheduleId;

      service.pauseScheduledCrawl(scheduleId);
      expect(service.getScheduledCrawl(scheduleId)?.status).toBe('paused');

      service.resumeScheduledCrawl(scheduleId);
      expect(service.getScheduledCrawl(scheduleId)?.status).toBe('active');
    });

    it('should track crawl history', () => {
      const result = service.createScheduledCrawl({ domain: 'example.com', interval: 'daily' });
      const scheduleId = result.scheduleId;

      // Simulate completed crawls
      service.recordCrawlCompletion(scheduleId, {
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
        pagesCount: 150,
        issues: 5,
        success: true
      });

      const history = service.getCrawlHistory(scheduleId);

      expect(history).toHaveLength(1);
      expect(history[0].pagesCount).toBe(150);
    });
  });

  describe('Snapshot Management', () => {
    it('should store audit snapshots', () => {
      const snapshot = {
        domain: 'example.com',
        timestamp: new Date(),
        metrics: {
          pagesCount: 200,
          technicalScore: 85,
          performanceScore: 78,
          semanticScore: 82,
          aiVisibilityScore: 75
        },
        issues: { critical: 2, high: 5, medium: 10, low: 15 }
      };

      const result = service.storeSnapshot(snapshot);

      expect(result.success).toBe(true);
      expect(result.snapshotId).toBeDefined();
    });

    it('should retrieve snapshots by date range', () => {
      const now = Date.now();

      // Store multiple snapshots
      for (let i = 0; i < 5; i++) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(now - i * 86400000), // Each day
          metrics: { pagesCount: 200 + i, technicalScore: 85 - i }
        });
      }

      const snapshots = service.getSnapshots('example.com', {
        from: new Date(now - 3 * 86400000),
        to: new Date(now)
      });

      expect(snapshots.length).toBe(4); // Last 4 days
    });

    it('should get latest snapshot', () => {
      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(Date.now() - 86400000),
        metrics: { technicalScore: 80 }
      });

      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: { technicalScore: 85 }
      });

      const latest = service.getLatestSnapshot('example.com');

      expect(latest?.metrics.technicalScore).toBe(85);
    });

    it('should compare snapshots', () => {
      const snapshot1 = service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(Date.now() - 86400000),
        metrics: { technicalScore: 75, pagesCount: 180 }
      });

      const snapshot2 = service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: { technicalScore: 85, pagesCount: 200 }
      });

      const comparison = service.compareSnapshots(snapshot1.snapshotId, snapshot2.snapshotId);

      expect(comparison.technicalScoreChange).toBe(10);
      expect(comparison.pagesCountChange).toBe(20);
      expect(comparison.improved).toBe(true);
    });

    it('should enforce snapshot retention limits', () => {
      const customService = createMonitoringService({ maxStoredSnapshots: 5 });

      // Store more than the limit
      for (let i = 0; i < 10; i++) {
        customService.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { technicalScore: 80 + i }
        });
      }

      const snapshots = customService.getSnapshots('example.com');
      expect(snapshots.length).toBe(5);

      customService.shutdown();
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect significant metric changes', () => {
      // Establish baseline with historical data with some variance
      const baseScores = [78, 82, 79, 81, 80, 78, 83, 79, 81, 80]; // Mean ~80, small variance
      for (let i = 10; i >= 1; i--) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { technicalScore: baseScores[10 - i], pagesCount: 200 }
        });
      }

      // Store anomalous snapshot - significant drop from ~80 to 50
      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: { technicalScore: 50, pagesCount: 200 }
      });

      const anomalies = service.detectAnomalies('example.com');

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].metric).toBe('technicalScore');
      expect(anomalies[0].severity).toBe('critical'); // 80 -> 50 is a severe drop
    });

    it('should detect sudden page count changes', () => {
      // Baseline with some variance (so stdDev is non-zero)
      const pageCounts = [495, 505, 498, 502, 500];
      for (let i = 5; i >= 1; i--) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { pagesCount: pageCounts[5 - i] }
        });
      }

      // Sudden drop - potential issue
      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: { pagesCount: 200 } // 60% drop
      });

      const anomalies = service.detectAnomalies('example.com');

      expect(anomalies.some(a => a.metric === 'pagesCount')).toBe(true);
    });

    it('should calculate anomaly scores', () => {
      const historicalData = [80, 82, 78, 81, 79, 80, 83, 77, 81, 80];
      const currentValue = 50;

      const score = service.calculateAnomalyScore(currentValue, historicalData);

      expect(score).toBeGreaterThan(2); // Standard deviations from mean
    });

    it('should configure anomaly thresholds', () => {
      service.setAnomalyThreshold('technicalScore', {
        warningThreshold: 10, // 10% change
        criticalThreshold: 25 // 25% change
      });

      const config = service.getAnomalyThreshold('technicalScore');

      expect(config.warningThreshold).toBe(10);
      expect(config.criticalThreshold).toBe(25);
    });

    it('should ignore expected fluctuations', () => {
      // Normal fluctuation data
      for (let i = 5; i >= 1; i--) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { technicalScore: 80 + (i % 3) } // Small fluctuations
        });
      }

      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: { technicalScore: 82 } // Within normal range
      });

      const anomalies = service.detectAnomalies('example.com');

      expect(anomalies.length).toBe(0);
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze metric trends over time', () => {
      // Create improving trend
      for (let i = 30; i >= 0; i--) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { technicalScore: 60 + (30 - i) } // Gradual improvement
        });
      }

      const trend = service.analyzeTrend('example.com', 'technicalScore', 30);

      expect(trend.direction).toBe('improving');
      expect(trend.changePercent).toBeGreaterThan(30);
      expect(trend.velocity).toBeGreaterThan(0);
    });

    it('should detect declining trends', () => {
      // Create declining trend
      for (let i = 30; i >= 0; i--) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { performanceScore: 90 - (30 - i) * 0.5 } // Gradual decline
        });
      }

      const trend = service.analyzeTrend('example.com', 'performanceScore', 30);

      expect(trend.direction).toBe('declining');
    });

    it('should identify stable metrics', () => {
      // Create stable data
      for (let i = 30; i >= 0; i--) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { technicalScore: 80 + (Math.random() * 4 - 2) } // Small fluctuations
        });
      }

      const trend = service.analyzeTrend('example.com', 'technicalScore', 30);

      expect(trend.direction).toBe('stable');
    });

    it('should calculate moving averages', () => {
      // Create increasing trend: oldest (i=10) = 70, newest (i=0) = 90
      for (let i = 10; i >= 0; i--) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { technicalScore: 90 - i * 2 } // 70 -> 72 -> ... -> 88 -> 90
        });
      }

      const movingAverage = service.calculateMovingAverage('example.com', 'technicalScore', 5);

      expect(movingAverage.length).toBeGreaterThan(0);
      // Last MA should be average of last 5 values: (82+84+86+88+90)/5 = 86
      expect(movingAverage[movingAverage.length - 1]).toBeGreaterThan(80);
    });

    it('should forecast future values', () => {
      // Create historical data with clear trend
      for (let i = 30; i >= 0; i--) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { technicalScore: 60 + (30 - i) }
        });
      }

      const forecast = service.forecastMetric('example.com', 'technicalScore', 7);

      expect(forecast.predictedValue).toBeGreaterThan(90);
      expect(forecast.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Alert Configuration', () => {
    it('should create alert rules', () => {
      const alertConfig: AlertConfig = {
        name: 'Technical Score Drop',
        domain: 'example.com',
        metric: 'technicalScore',
        condition: 'drops_below',
        threshold: 70,
        severity: 'critical',
        channels: ['email', 'slack']
      };

      const result = service.createAlertRule(alertConfig);

      expect(result.success).toBe(true);
      expect(result.ruleId).toBeDefined();
    });

    it('should support various alert conditions', () => {
      const conditions = [
        { condition: 'drops_below', threshold: 70 },
        { condition: 'rises_above', threshold: 90 },
        { condition: 'changes_by', threshold: 10 },
        { condition: 'changes_by_percent', threshold: 15 }
      ] as const;

      for (const { condition, threshold } of conditions) {
        const result = service.createAlertRule({
          name: `Alert for ${condition}`,
          domain: 'example.com',
          metric: 'technicalScore',
          condition,
          threshold,
          severity: 'medium'
        });
        expect(result.success).toBe(true);
      }
    });

    it('should trigger alerts when conditions are met', () => {
      service.createAlertRule({
        name: 'Low Score Alert',
        domain: 'example.com',
        metric: 'technicalScore',
        condition: 'drops_below',
        threshold: 70,
        severity: 'critical'
      });

      // Store snapshot that triggers alert
      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: { technicalScore: 65 }
      });

      const alerts = service.getPendingAlerts();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('critical');
    });

    it('should not trigger duplicate alerts', () => {
      service.createAlertRule({
        name: 'Low Score Alert',
        domain: 'example.com',
        metric: 'technicalScore',
        condition: 'drops_below',
        threshold: 70,
        severity: 'critical'
      });

      // Store multiple snapshots below threshold
      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(Date.now() - 3600000),
        metrics: { technicalScore: 65 }
      });

      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: { technicalScore: 64 }
      });

      const alerts = service.getPendingAlerts();

      expect(alerts.length).toBe(1); // Only one alert despite multiple triggers
    });

    it('should dismiss and acknowledge alerts', () => {
      service.createAlertRule({
        name: 'Test Alert',
        domain: 'example.com',
        metric: 'technicalScore',
        condition: 'drops_below',
        threshold: 70,
        severity: 'medium'
      });

      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: { technicalScore: 65 }
      });

      const alerts = service.getPendingAlerts();
      const alertId = alerts[0].id;

      service.acknowledgeAlert(alertId);
      expect(service.getAlert(alertId)?.status).toBe('acknowledged');

      service.dismissAlert(alertId);
      expect(service.getAlert(alertId)?.status).toBe('dismissed');
    });

    it('should get alert history', () => {
      service.createAlertRule({
        name: 'Test Alert',
        domain: 'example.com',
        metric: 'technicalScore',
        condition: 'drops_below',
        threshold: 70,
        severity: 'medium'
      });

      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: { technicalScore: 65 }
      });

      const alerts = service.getPendingAlerts();
      service.dismissAlert(alerts[0].id);

      const history = service.getAlertHistory('example.com', 30);

      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Reporting', () => {
    it('should generate daily monitoring report', () => {
      // Setup data
      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: {
          technicalScore: 85,
          performanceScore: 78,
          pagesCount: 200,
          issues: { critical: 0, high: 3, medium: 10, low: 20 }
        }
      });

      const report = service.generateDailyReport('example.com');

      expect(report.domain).toBe('example.com');
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.trends).toBeDefined();
    });

    it('should generate weekly summary report', () => {
      // Store a week of data
      for (let i = 7; i >= 0; i--) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { technicalScore: 80 + i, pagesCount: 200 }
        });
      }

      const report = service.generateWeeklyReport('example.com');

      expect(report.weekStartDate).toBeDefined();
      expect(report.weekEndDate).toBeDefined();
      expect(report.averageScores).toBeDefined();
      expect(report.weekOverWeekChange).toBeDefined();
    });

    it('should generate comparison report', () => {
      // Store current and previous period data
      for (let i = 60; i >= 0; i--) {
        service.storeSnapshot({
          domain: 'example.com',
          timestamp: new Date(Date.now() - i * 86400000),
          metrics: { technicalScore: 70 + Math.floor(i / 2) }
        });
      }

      const report = service.generateComparisonReport('example.com', {
        currentPeriod: { days: 30 },
        previousPeriod: { days: 30 }
      });

      expect(report.currentPeriodAverage).toBeDefined();
      expect(report.previousPeriodAverage).toBeDefined();
      expect(report.percentChange).toBeDefined();
    });

    it('should export report data', () => {
      service.storeSnapshot({
        domain: 'example.com',
        timestamp: new Date(),
        metrics: { technicalScore: 85 }
      });

      const csvExport = service.exportReportData('example.com', 'csv');
      expect(csvExport).toContain('technicalScore');

      const jsonExport = service.exportReportData('example.com', 'json');
      expect(JSON.parse(jsonExport)).toBeDefined();
    });
  });

  describe('Health Checks', () => {
    it('should perform domain health check', () => {
      const result = service.performHealthCheck('example.com');

      expect(result.domain).toBe('example.com');
      expect(result.isHealthy).toBeDefined();
      expect(result.checks).toBeDefined();
    });

    it('should track uptime metrics', () => {
      // Record uptime data
      for (let i = 24; i >= 0; i--) {
        service.recordUptimeCheck('example.com', {
          timestamp: new Date(Date.now() - i * 3600000),
          isUp: i !== 5 && i !== 6 // Down for 2 hours
        });
      }

      const uptime = service.getUptimeStats('example.com', 24);

      expect(uptime.uptimePercentage).toBeCloseTo(91.67, 0);
      expect(uptime.downtimeIncidents).toBe(1);
    });
  });

  describe('Event Handling', () => {
    it('should emit events for monitoring activities', () => {
      const events: string[] = [];

      service.on('crawl:scheduled', () => events.push('scheduled'));
      service.on('crawl:started', () => events.push('started'));
      service.on('crawl:completed', () => events.push('completed'));
      service.on('anomaly:detected', () => events.push('anomaly'));
      service.on('alert:triggered', () => events.push('alert'));

      service.emit('crawl:scheduled', { domain: 'example.com' });
      service.emit('crawl:started', { domain: 'example.com' });
      service.emit('crawl:completed', { domain: 'example.com' });
      service.emit('anomaly:detected', { metric: 'technicalScore' });
      service.emit('alert:triggered', { severity: 'critical' });

      expect(events).toContain('scheduled');
      expect(events).toContain('started');
      expect(events).toContain('completed');
      expect(events).toContain('anomaly');
      expect(events).toContain('alert');
    });
  });
});
