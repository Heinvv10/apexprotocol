/**
 * Webhook Integration Module - Phase M2
 * Complete webhook processing infrastructure
 */

// Signature verification
export {
  generateSignature,
  WebhookSignatureVerifier,
  webhookSignatureVerifier,
} from './signature-verification';

// Lead scoring
export {
  type EmailEngagement,
  type SocialEngagement,
  type EngagementMetrics,
  type BonusScores,
  LeadScoringEngine,
  leadScoringEngine,
} from './lead-scoring';

// Status transitions
export {
  type LeadStatus,
  type LeadData,
  LeadStatusTransitionEngine,
  leadStatusTransitionEngine,
} from './status-transitions';

// Transaction handling
export {
  type TransactionStatus,
  type TransactionOperation,
  WebhookTransaction,
  WebhookTransactionManager,
  WebhookEventProcessor,
  webhookTransactionManager,
} from './transaction-handling';

// Retry logic
export {
  type DeliveryStatus,
  type RetryConfig,
  type WebhookDelivery,
  WebhookRetryEngine,
  WebhookRetryScheduler,
  webhookRetryEngine,
} from './retry-logic';

// Monitoring and alerting
export {
  type AlertSeverity,
  type AlertStatus,
  type WebhookMetrics,
  type Alert,
  type AlertThresholds,
  WebhookMonitoringEngine,
  AlertNotificationService,
  webhookMonitoringEngine,
  alertNotificationService,
} from './monitoring-alerting';
