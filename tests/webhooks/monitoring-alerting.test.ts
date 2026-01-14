/**
 * Webhook Monitoring and Alerting Tests (Phase M2)
 * Tests delivery success rates, failure thresholds, and alert triggering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Alert Severity Levels
 */
type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Alert Status
 */
type AlertStatus = 'active' | 'acknowledged' | 'resolved';

/**
 * Webhook Metrics
 */
interface WebhookMetrics {
  source: string;
  totalReceived: number;
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTimeMs: number;
  lastReceivedAt?: Date;
  lastProcessedAt?: Date;
  successRate: number;
}

/**
 * Alert Definition
 */
interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: string;
  message: string;
  metadata: Record<string, any>;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

/**
 * Alert Threshold Configuration
 */
interface AlertThresholds {
  successRateWarning: number; // e.g., 95%
  successRateCritical: number; // e.g., 90%
  processingTimeWarningMs: number; // e.g., 1000ms
  processingTimeCriticalMs: number; // e.g., 5000ms
  queueDepthWarning: number; // e.g., 100
  queueDepthCritical: number; // e.g., 500
  failureCountWarning: number; // e.g., 10
  failureCountCritical: number; // e.g., 50
}

/**
 * Webhook Monitoring Engine
 * Tracks metrics and triggers alerts based on thresholds
 */
class WebhookMonitoringEngine {
  private metrics: Map<string, WebhookMetrics> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private thresholds: AlertThresholds = {
    successRateWarning: 95,
    successRateCritical: 90,
    processingTimeWarningMs: 1000,
    processingTimeCriticalMs: 5000,
    queueDepthWarning: 100,
    queueDepthCritical: 500,
    failureCountWarning: 10,
    failureCountCritical: 50,
  };
  private alertIdCounter = 0;

  /**
   * Initialize metrics for a webhook source
   */
  initializeSource(source: string): void {
    this.metrics.set(source, {
      source,
      totalReceived: 0,
      totalProcessed: 0,
      totalFailed: 0,
      averageProcessingTimeMs: 0,
      successRate: 100,
    });
  }

  /**
   * Record a received webhook
   */
  recordReceived(source: string): void {
    const metrics = this.getOrCreateMetrics(source);
    metrics.totalReceived++;
    metrics.lastReceivedAt = new Date();
    this.updateSuccessRate(source);
  }

  /**
   * Record a successfully processed webhook
   */
  recordProcessed(source: string, processingTimeMs: number): void {
    const metrics = this.getOrCreateMetrics(source);
    metrics.totalProcessed++;
    metrics.lastProcessedAt = new Date();

    // Update average processing time (rolling average)
    const totalProcessed = metrics.totalProcessed;
    metrics.averageProcessingTimeMs =
      (metrics.averageProcessingTimeMs * (totalProcessed - 1) + processingTimeMs) /
      totalProcessed;

    this.updateSuccessRate(source);
    this.checkThresholds(source);
  }

  /**
   * Record a failed webhook
   */
  recordFailed(source: string, error: string): void {
    const metrics = this.getOrCreateMetrics(source);
    metrics.totalFailed++;
    this.updateSuccessRate(source);
    this.checkThresholds(source);
  }

  /**
   * Get metrics for a source
   */
  getMetrics(source: string): WebhookMetrics | undefined {
    return this.metrics.get(source);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): WebhookMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Create alert
   */
  createAlert(
    type: string,
    severity: AlertSeverity,
    source: string,
    message: string,
    metadata: Record<string, any> = {}
  ): Alert {
    const alertId = `alert-${++this.alertIdCounter}`;
    const alert: Alert = {
      id: alertId,
      type,
      severity,
      status: 'active',
      source,
      message,
      metadata,
      createdAt: new Date(),
    };

    this.alerts.set(alertId, alert);
    return alert;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    return true;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(
      a => a.status === 'active'
    );
  }

  /**
   * Get alerts by source
   */
  getAlertsBySource(source: string): Alert[] {
    return Array.from(this.alerts.values()).filter(
      a => a.source === source
    );
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return Array.from(this.alerts.values()).filter(
      a => a.severity === severity
    );
  }

  /**
   * Check if there's already an active alert for type/source
   */
  hasActiveAlert(type: string, source: string): boolean {
    return Array.from(this.alerts.values()).some(
      a => a.type === type && a.source === source && a.status === 'active'
    );
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): AlertThresholds {
    return { ...this.thresholds };
  }

  private getOrCreateMetrics(source: string): WebhookMetrics {
    if (!this.metrics.has(source)) {
      this.initializeSource(source);
    }
    return this.metrics.get(source)!;
  }

  private updateSuccessRate(source: string): void {
    const metrics = this.metrics.get(source);
    if (!metrics || metrics.totalReceived === 0) return;

    metrics.successRate =
      (metrics.totalProcessed / metrics.totalReceived) * 100;
  }

  private checkThresholds(source: string): void {
    const metrics = this.metrics.get(source);
    if (!metrics) return;

    // Check success rate thresholds
    if (metrics.successRate < this.thresholds.successRateCritical) {
      if (!this.hasActiveAlert('success_rate_critical', source)) {
        this.createAlert(
          'success_rate_critical',
          'critical',
          source,
          `Success rate dropped to ${metrics.successRate.toFixed(1)}%`,
          { successRate: metrics.successRate }
        );
      }
    } else if (metrics.successRate < this.thresholds.successRateWarning) {
      if (!this.hasActiveAlert('success_rate_warning', source)) {
        this.createAlert(
          'success_rate_warning',
          'warning',
          source,
          `Success rate dropped to ${metrics.successRate.toFixed(1)}%`,
          { successRate: metrics.successRate }
        );
      }
    }

    // Check processing time thresholds
    if (metrics.averageProcessingTimeMs > this.thresholds.processingTimeCriticalMs) {
      if (!this.hasActiveAlert('processing_time_critical', source)) {
        this.createAlert(
          'processing_time_critical',
          'critical',
          source,
          `Average processing time is ${metrics.averageProcessingTimeMs.toFixed(0)}ms`,
          { averageProcessingTimeMs: metrics.averageProcessingTimeMs }
        );
      }
    } else if (metrics.averageProcessingTimeMs > this.thresholds.processingTimeWarningMs) {
      if (!this.hasActiveAlert('processing_time_warning', source)) {
        this.createAlert(
          'processing_time_warning',
          'warning',
          source,
          `Average processing time is ${metrics.averageProcessingTimeMs.toFixed(0)}ms`,
          { averageProcessingTimeMs: metrics.averageProcessingTimeMs }
        );
      }
    }

    // Check failure count thresholds
    if (metrics.totalFailed >= this.thresholds.failureCountCritical) {
      if (!this.hasActiveAlert('failure_count_critical', source)) {
        this.createAlert(
          'failure_count_critical',
          'critical',
          source,
          `Total failures reached ${metrics.totalFailed}`,
          { totalFailed: metrics.totalFailed }
        );
      }
    } else if (metrics.totalFailed >= this.thresholds.failureCountWarning) {
      if (!this.hasActiveAlert('failure_count_warning', source)) {
        this.createAlert(
          'failure_count_warning',
          'warning',
          source,
          `Total failures reached ${metrics.totalFailed}`,
          { totalFailed: metrics.totalFailed }
        );
      }
    }
  }
}

/**
 * Alert Notification Service
 * Sends notifications for alerts
 */
class AlertNotificationService {
  private sentNotifications: Array<{
    alertId: string;
    channel: string;
    sentAt: Date;
  }> = [];

  async notify(
    alert: Alert,
    channels: string[]
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const channel of channels) {
      try {
        await this.sendToChannel(alert, channel);
        this.sentNotifications.push({
          alertId: alert.id,
          channel,
          sentAt: new Date(),
        });
        sent++;
      } catch (error) {
        failed++;
      }
    }

    return { sent, failed };
  }

  private async sendToChannel(alert: Alert, channel: string): Promise<void> {
    // Simulate sending notification
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  getNotificationHistory(alertId: string): Array<{
    channel: string;
    sentAt: Date;
  }> {
    return this.sentNotifications
      .filter(n => n.alertId === alertId)
      .map(({ channel, sentAt }) => ({ channel, sentAt }));
  }
}

describe('Webhook Monitoring and Alerting', () => {
  let engine: WebhookMonitoringEngine;
  let notificationService: AlertNotificationService;

  beforeEach(() => {
    engine = new WebhookMonitoringEngine();
    notificationService = new AlertNotificationService();
    vi.clearAllMocks();
  });

  describe('Metrics Tracking', () => {
    it('should initialize source with zero metrics', () => {
      engine.initializeSource('mautic');
      const metrics = engine.getMetrics('mautic');

      expect(metrics).toBeDefined();
      expect(metrics!.totalReceived).toBe(0);
      expect(metrics!.totalProcessed).toBe(0);
      expect(metrics!.totalFailed).toBe(0);
      expect(metrics!.successRate).toBe(100);
    });

    it('should record received webhooks', () => {
      engine.recordReceived('mautic');
      engine.recordReceived('mautic');
      engine.recordReceived('mautic');

      const metrics = engine.getMetrics('mautic');
      expect(metrics!.totalReceived).toBe(3);
    });

    it('should record processed webhooks with timing', () => {
      engine.recordReceived('mautic');
      engine.recordProcessed('mautic', 100);

      const metrics = engine.getMetrics('mautic');
      expect(metrics!.totalProcessed).toBe(1);
      expect(metrics!.averageProcessingTimeMs).toBe(100);
    });

    it('should calculate average processing time', () => {
      engine.recordReceived('mautic');
      engine.recordProcessed('mautic', 100);
      engine.recordReceived('mautic');
      engine.recordProcessed('mautic', 200);
      engine.recordReceived('mautic');
      engine.recordProcessed('mautic', 300);

      const metrics = engine.getMetrics('mautic');
      expect(metrics!.averageProcessingTimeMs).toBe(200); // (100+200+300)/3
    });

    it('should record failed webhooks', () => {
      engine.recordReceived('mautic');
      engine.recordFailed('mautic', 'Connection timeout');
      engine.recordReceived('mautic');
      engine.recordFailed('mautic', 'Invalid payload');

      const metrics = engine.getMetrics('mautic');
      expect(metrics!.totalFailed).toBe(2);
    });

    it('should calculate success rate correctly', () => {
      // 8 received, 6 processed, 2 failed = 75% success
      for (let i = 0; i < 8; i++) {
        engine.recordReceived('mautic');
      }
      for (let i = 0; i < 6; i++) {
        engine.recordProcessed('mautic', 100);
      }
      for (let i = 0; i < 2; i++) {
        engine.recordFailed('mautic', 'Error');
      }

      const metrics = engine.getMetrics('mautic');
      expect(metrics!.successRate).toBe(75);
    });

    it('should track last received timestamp', () => {
      const before = new Date();
      engine.recordReceived('mautic');
      const after = new Date();

      const metrics = engine.getMetrics('mautic');
      expect(metrics!.lastReceivedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(metrics!.lastReceivedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should track last processed timestamp', () => {
      engine.recordReceived('mautic');

      const before = new Date();
      engine.recordProcessed('mautic', 100);
      const after = new Date();

      const metrics = engine.getMetrics('mautic');
      expect(metrics!.lastProcessedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(metrics!.lastProcessedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should track multiple sources independently', () => {
      engine.recordReceived('mautic');
      engine.recordReceived('mautic');
      engine.recordReceived('listmonk');
      engine.recordReceived('postiz');
      engine.recordReceived('postiz');
      engine.recordReceived('postiz');

      expect(engine.getMetrics('mautic')!.totalReceived).toBe(2);
      expect(engine.getMetrics('listmonk')!.totalReceived).toBe(1);
      expect(engine.getMetrics('postiz')!.totalReceived).toBe(3);
    });

    it('should get all metrics', () => {
      engine.initializeSource('mautic');
      engine.initializeSource('listmonk');
      engine.initializeSource('postiz');

      const allMetrics = engine.getAllMetrics();
      expect(allMetrics).toHaveLength(3);
    });
  });

  describe('Alert Thresholds', () => {
    it('should have default thresholds', () => {
      const thresholds = engine.getThresholds();

      expect(thresholds.successRateWarning).toBe(95);
      expect(thresholds.successRateCritical).toBe(90);
      expect(thresholds.processingTimeWarningMs).toBe(1000);
      expect(thresholds.processingTimeCriticalMs).toBe(5000);
    });

    it('should allow custom thresholds', () => {
      engine.setThresholds({
        successRateWarning: 99,
        successRateCritical: 95,
      });

      const thresholds = engine.getThresholds();
      expect(thresholds.successRateWarning).toBe(99);
      expect(thresholds.successRateCritical).toBe(95);
    });

    it('should preserve other thresholds when updating partial', () => {
      engine.setThresholds({
        successRateWarning: 99,
      });

      const thresholds = engine.getThresholds();
      expect(thresholds.successRateWarning).toBe(99);
      expect(thresholds.processingTimeWarningMs).toBe(1000); // Unchanged
    });
  });

  describe('Alert Creation', () => {
    it('should create alert with correct properties', () => {
      const alert = engine.createAlert(
        'success_rate_warning',
        'warning',
        'mautic',
        'Success rate dropped to 92%',
        { successRate: 92 }
      );

      expect(alert.id).toBeDefined();
      expect(alert.type).toBe('success_rate_warning');
      expect(alert.severity).toBe('warning');
      expect(alert.status).toBe('active');
      expect(alert.source).toBe('mautic');
      expect(alert.message).toContain('92%');
      expect(alert.metadata.successRate).toBe(92);
      expect(alert.createdAt).toBeDefined();
    });

    it('should auto-generate unique alert IDs', () => {
      const alert1 = engine.createAlert('test', 'info', 'mautic', 'Test 1');
      const alert2 = engine.createAlert('test', 'info', 'mautic', 'Test 2');
      const alert3 = engine.createAlert('test', 'info', 'mautic', 'Test 3');

      expect(alert1.id).not.toBe(alert2.id);
      expect(alert2.id).not.toBe(alert3.id);
    });
  });

  describe('Alert Lifecycle', () => {
    it('should acknowledge alert', () => {
      const alert = engine.createAlert('test', 'warning', 'mautic', 'Test');

      const result = engine.acknowledgeAlert(alert.id);

      expect(result).toBe(true);
      expect(engine.getActiveAlerts()).toHaveLength(0);
    });

    it('should set acknowledged timestamp', () => {
      const alert = engine.createAlert('test', 'warning', 'mautic', 'Test');

      const before = new Date();
      engine.acknowledgeAlert(alert.id);
      const after = new Date();

      expect(alert.acknowledgedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(alert.acknowledgedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should resolve alert', () => {
      const alert = engine.createAlert('test', 'warning', 'mautic', 'Test');

      const result = engine.resolveAlert(alert.id);

      expect(result).toBe(true);
      expect(alert.status).toBe('resolved');
      expect(alert.resolvedAt).toBeDefined();
    });

    it('should return false for non-existent alert acknowledge', () => {
      const result = engine.acknowledgeAlert('nonexistent');
      expect(result).toBe(false);
    });

    it('should return false for non-existent alert resolve', () => {
      const result = engine.resolveAlert('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Automatic Alert Triggering', () => {
    it('should trigger warning when success rate drops below 95%', () => {
      // 20 received, 18 processed = 90% success (below 95% warning)
      for (let i = 0; i < 20; i++) {
        engine.recordReceived('mautic');
      }
      for (let i = 0; i < 18; i++) {
        engine.recordProcessed('mautic', 100);
      }

      const alerts = engine.getActiveAlerts();
      const warningAlert = alerts.find(
        a => a.type === 'success_rate_warning' || a.type === 'success_rate_critical'
      );

      expect(warningAlert).toBeDefined();
    });

    it('should trigger critical when success rate drops below 90%', () => {
      // 10 received, 8 processed = 80% success (below 90% critical)
      for (let i = 0; i < 10; i++) {
        engine.recordReceived('mautic');
      }
      for (let i = 0; i < 8; i++) {
        engine.recordProcessed('mautic', 100);
      }

      const alerts = engine.getActiveAlerts();
      const criticalAlert = alerts.find(a => a.type === 'success_rate_critical');

      expect(criticalAlert).toBeDefined();
      expect(criticalAlert!.severity).toBe('critical');
    });

    it('should trigger warning when processing time exceeds 1000ms', () => {
      engine.recordReceived('mautic');
      engine.recordProcessed('mautic', 1500); // Above 1000ms warning threshold

      const alerts = engine.getActiveAlerts();
      const timeAlert = alerts.find(a => a.type.includes('processing_time'));

      expect(timeAlert).toBeDefined();
    });

    it('should trigger critical when processing time exceeds 5000ms', () => {
      engine.recordReceived('mautic');
      engine.recordProcessed('mautic', 6000); // Above 5000ms critical threshold

      const alerts = engine.getActiveAlerts();
      const criticalAlert = alerts.find(a => a.type === 'processing_time_critical');

      expect(criticalAlert).toBeDefined();
      expect(criticalAlert!.severity).toBe('critical');
    });

    it('should trigger warning when failure count reaches 10', () => {
      for (let i = 0; i < 10; i++) {
        engine.recordReceived('mautic');
        engine.recordFailed('mautic', 'Error');
      }

      const alerts = engine.getActiveAlerts();
      const failureAlert = alerts.find(a => a.type.includes('failure_count'));

      expect(failureAlert).toBeDefined();
    });

    it('should not duplicate alerts for same type/source', () => {
      // Trigger multiple failures
      for (let i = 0; i < 20; i++) {
        engine.recordReceived('mautic');
        engine.recordFailed('mautic', 'Error');
      }

      const alerts = engine.getAlertsBySource('mautic');
      const failureAlerts = alerts.filter(a => a.type.includes('failure_count'));

      // Should have at most one of each type
      const types = new Set(failureAlerts.map(a => a.type));
      expect(types.size).toBe(failureAlerts.length);
    });
  });

  describe('Alert Queries', () => {
    it('should get all active alerts', () => {
      engine.createAlert('test1', 'warning', 'mautic', 'Test 1');
      engine.createAlert('test2', 'critical', 'mautic', 'Test 2');
      const alert3 = engine.createAlert('test3', 'info', 'mautic', 'Test 3');

      engine.resolveAlert(alert3.id);

      const active = engine.getActiveAlerts();
      expect(active).toHaveLength(2);
    });

    it('should get alerts by source', () => {
      engine.createAlert('test', 'warning', 'mautic', 'Mautic alert');
      engine.createAlert('test', 'warning', 'listmonk', 'ListMonk alert');
      engine.createAlert('test', 'warning', 'mautic', 'Another Mautic alert');

      const mauticAlerts = engine.getAlertsBySource('mautic');
      expect(mauticAlerts).toHaveLength(2);
    });

    it('should get alerts by severity', () => {
      engine.createAlert('test1', 'warning', 'mautic', 'Warning');
      engine.createAlert('test2', 'critical', 'mautic', 'Critical');
      engine.createAlert('test3', 'warning', 'listmonk', 'Warning 2');
      engine.createAlert('test4', 'info', 'postiz', 'Info');

      const warnings = engine.getAlertsBySeverity('warning');
      expect(warnings).toHaveLength(2);

      const criticals = engine.getAlertsBySeverity('critical');
      expect(criticals).toHaveLength(1);
    });

    it('should check for existing active alert', () => {
      engine.createAlert('success_rate', 'warning', 'mautic', 'Test');

      expect(engine.hasActiveAlert('success_rate', 'mautic')).toBe(true);
      expect(engine.hasActiveAlert('success_rate', 'listmonk')).toBe(false);
      expect(engine.hasActiveAlert('other_type', 'mautic')).toBe(false);
    });
  });

  describe('Alert Notifications', () => {
    it('should send notifications to multiple channels', async () => {
      const alert = engine.createAlert('test', 'critical', 'mautic', 'Test');

      const result = await notificationService.notify(alert, [
        'email',
        'slack',
        'pagerduty',
      ]);

      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should track notification history', async () => {
      const alert = engine.createAlert('test', 'critical', 'mautic', 'Test');

      await notificationService.notify(alert, ['email', 'slack']);

      const history = notificationService.getNotificationHistory(alert.id);
      expect(history).toHaveLength(2);
      expect(history[0].channel).toBe('email');
      expect(history[1].channel).toBe('slack');
    });

    it('should record sent timestamp for each notification', async () => {
      const alert = engine.createAlert('test', 'critical', 'mautic', 'Test');

      const before = new Date();
      await notificationService.notify(alert, ['email']);
      const after = new Date();

      const history = notificationService.getNotificationHistory(alert.id);
      expect(history[0].sentAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(history[0].sentAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero received webhooks', () => {
      engine.initializeSource('mautic');
      const metrics = engine.getMetrics('mautic');

      expect(metrics!.successRate).toBe(100); // Default when no activity
    });

    it('should handle 100% success rate', () => {
      for (let i = 0; i < 100; i++) {
        engine.recordReceived('mautic');
        engine.recordProcessed('mautic', 100);
      }

      const metrics = engine.getMetrics('mautic');
      expect(metrics!.successRate).toBe(100);

      // Should not trigger any alerts
      const alerts = engine.getActiveAlerts();
      expect(alerts).toHaveLength(0);
    });

    it('should handle source not initialized', () => {
      // Should auto-create metrics
      engine.recordReceived('new-source');

      const metrics = engine.getMetrics('new-source');
      expect(metrics).toBeDefined();
      expect(metrics!.totalReceived).toBe(1);
    });

    it('should handle very high processing times', () => {
      engine.recordReceived('mautic');
      engine.recordProcessed('mautic', 999999);

      const alerts = engine.getActiveAlerts();
      const criticalAlert = alerts.find(a => a.type === 'processing_time_critical');

      expect(criticalAlert).toBeDefined();
    });

    it('should handle empty channels array for notifications', async () => {
      const alert = engine.createAlert('test', 'warning', 'mautic', 'Test');

      const result = await notificationService.notify(alert, []);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });
  });
});
