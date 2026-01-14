/**
 * Webhook Monitoring and Alerting
 * Tracks delivery success rates, failure thresholds, and triggers alerts
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface WebhookMetrics {
  source: string;
  totalReceived: number;
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTimeMs: number;
  lastReceivedAt?: Date;
  lastProcessedAt?: Date;
  successRate: number;
}

export interface Alert {
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

export interface AlertThresholds {
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
export class WebhookMonitoringEngine {
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
export class AlertNotificationService {
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

// Export singleton instances
export const webhookMonitoringEngine = new WebhookMonitoringEngine();
export const alertNotificationService = new AlertNotificationService();
