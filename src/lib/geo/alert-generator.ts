/**
 * GEO Alert Generator
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Generates GEO-specific alerts for:
 * - Algorithm/platform behavior changes
 * - Recommendation updates
 * - Strategy deprecation warnings
 * - New opportunities
 * - Competitor moves
 * - Score impacts
 */

import type {
  GeoAlert,
  NewGeoAlert,
  PlatformChange,
  geoAlertTypeEnum,
  alertSeverityEnum,
} from "../db/schema/geo-knowledge-base";

// Alert type enum values
export type GeoAlertType =
  | "algorithm_change"
  | "recommendation_updated"
  | "strategy_deprecated"
  | "new_opportunity"
  | "competitor_move"
  | "score_impact";

// Alert severity enum values
export type AlertSeverity = "info" | "warning" | "critical";

/**
 * Alert template for generating consistent alerts
 */
interface AlertTemplate {
  type: GeoAlertType;
  severity: AlertSeverity;
  titleTemplate: string;
  descriptionTemplate: string;
  actionRequired: boolean;
  suggestedActionsTemplate: string[];
  expiresInDays?: number;
}

/**
 * Context for generating alerts
 */
export interface AlertGenerationContext {
  organizationId: string;
  brandId?: string;
  platform?: string;
  platformChange?: PlatformChange;
  scoreChange?: {
    previousScore: number;
    currentScore: number;
    changePercent: number;
  };
  competitorData?: {
    competitorName: string;
    platform: string;
    changeType: string;
  };
  recommendationChange?: {
    actionTitle: string;
    changeDescription: string;
  };
}

// ============================================================================
// Alert Templates
// ============================================================================

const ALERT_TEMPLATES: Record<string, AlertTemplate> = {
  // Algorithm Change Alerts
  algorithm_change_citation: {
    type: "algorithm_change",
    severity: "warning",
    titleTemplate: "{platform} Citation Pattern Change Detected",
    descriptionTemplate:
      "We've detected that {platform} is now citing {changeType} {changePercent}% more frequently than 2 weeks ago. This may impact your brand visibility.",
    actionRequired: true,
    suggestedActionsTemplate: [
      "Review your current {changeType} implementation",
      "Update affected pages within 7 days",
      "Monitor your score for changes",
    ],
    expiresInDays: 14,
  },

  algorithm_change_content: {
    type: "algorithm_change",
    severity: "warning",
    titleTemplate: "{platform} Content Preference Changed",
    descriptionTemplate:
      "{platform} now appears to prefer {preferenceType}. Content not meeting these criteria may see reduced visibility.",
    actionRequired: true,
    suggestedActionsTemplate: [
      "Audit existing content against new preferences",
      "Prioritize updating high-traffic pages",
      "Adjust content strategy accordingly",
    ],
    expiresInDays: 21,
  },

  algorithm_change_feature: {
    type: "algorithm_change",
    severity: "info",
    titleTemplate: "New {platform} Feature Available",
    descriptionTemplate:
      "{platform} has introduced {featureName}. Brands utilizing this feature may gain competitive advantage in AI visibility.",
    actionRequired: false,
    suggestedActionsTemplate: [
      "Learn about the new feature",
      "Evaluate if it's relevant to your brand",
      "Consider early adoption for competitive advantage",
    ],
    expiresInDays: 30,
  },

  // Recommendation Update Alerts
  recommendation_updated_priority: {
    type: "recommendation_updated",
    severity: "info",
    titleTemplate: "Action Plan Priority Updated",
    descriptionTemplate:
      'The priority of "{actionTitle}" has been {direction} based on latest platform behavior analysis. Your action plan has been automatically updated.',
    actionRequired: false,
    suggestedActionsTemplate: [
      "Review your updated action plan",
      "Adjust your implementation timeline",
      "Download the latest action plan PDF",
    ],
    expiresInDays: 7,
  },

  recommendation_updated_new: {
    type: "recommendation_updated",
    severity: "info",
    titleTemplate: "New Recommendation Added to Your Plan",
    descriptionTemplate:
      'A new action "{actionTitle}" has been added to your plan based on recent platform changes. This action is expected to improve your score by {expectedImpact} points.',
    actionRequired: false,
    suggestedActionsTemplate: [
      "Review the new recommendation",
      "Add it to your implementation schedule",
      "Download updated action plan",
    ],
    expiresInDays: 14,
  },

  // Strategy Deprecation Alerts
  strategy_deprecated_schema: {
    type: "strategy_deprecated",
    severity: "warning",
    titleTemplate: "Schema Strategy Effectiveness Declining",
    descriptionTemplate:
      "The {schemaType} schema implementation you've applied is showing reduced effectiveness across AI platforms. Consider updating to the latest best practices.",
    actionRequired: true,
    suggestedActionsTemplate: [
      "Review the updated schema guidelines",
      "Update your schema implementation",
      "Validate with schema.org validator",
    ],
    expiresInDays: 14,
  },

  strategy_deprecated_content: {
    type: "strategy_deprecated",
    severity: "warning",
    titleTemplate: "Content Strategy Update Needed",
    descriptionTemplate:
      "Your current content approach for {contentType} is becoming less effective. AI platforms now favor {newPreference}.",
    actionRequired: true,
    suggestedActionsTemplate: [
      "Audit affected content",
      "Update content to match new preferences",
      "Monitor impact on visibility",
    ],
    expiresInDays: 21,
  },

  // New Opportunity Alerts
  new_opportunity_platform: {
    type: "new_opportunity",
    severity: "info",
    titleTemplate: "New Platform Opportunity: {platform}",
    descriptionTemplate:
      "{platform} is showing increased engagement in your industry. Early optimization could establish strong visibility before competitors adapt.",
    actionRequired: false,
    suggestedActionsTemplate: [
      "Research the platform's requirements",
      "Create a platform-specific strategy",
      "Consider prioritizing this platform",
    ],
    expiresInDays: 30,
  },

  new_opportunity_feature: {
    type: "new_opportunity",
    severity: "info",
    titleTemplate: "Leverage New {platform} Feature",
    descriptionTemplate:
      "{platform}'s new {featureName} feature provides an opportunity to improve visibility. Brands using this feature are seeing {improvement}% better citation rates.",
    actionRequired: false,
    suggestedActionsTemplate: [
      "Learn about the feature",
      "Plan implementation",
      "Monitor results",
    ],
    expiresInDays: 21,
  },

  // Competitor Move Alerts
  competitor_move_visibility: {
    type: "competitor_move",
    severity: "warning",
    titleTemplate: "Competitor Visibility Increase Detected",
    descriptionTemplate:
      "{competitorName} has gained significant visibility on {platform}. They appear to have {changeDescription}. Consider reviewing your strategy.",
    actionRequired: true,
    suggestedActionsTemplate: [
      "Analyze competitor's changes",
      "Identify gaps in your strategy",
      "Prioritize competitive actions",
    ],
    expiresInDays: 14,
  },

  competitor_move_new: {
    type: "competitor_move",
    severity: "info",
    titleTemplate: "New Competitor Detected",
    descriptionTemplate:
      "A new competitor ({competitorName}) is appearing in AI responses for queries related to your brand. Monitor their strategy and visibility.",
    actionRequired: false,
    suggestedActionsTemplate: [
      "Add them to your monitoring list",
      "Analyze their GEO strategy",
      "Identify differentiation opportunities",
    ],
    expiresInDays: 30,
  },

  // Score Impact Alerts
  score_impact_significant_drop: {
    type: "score_impact",
    severity: "critical",
    titleTemplate: "Significant GEO Score Drop Detected",
    descriptionTemplate:
      "Your GEO score has dropped by {changePercent}% (from {previousScore} to {currentScore}). This may be due to recent platform changes or competitor actions.",
    actionRequired: true,
    suggestedActionsTemplate: [
      "Review recent platform changes",
      "Check for technical issues",
      "Prioritize high-impact recovery actions",
    ],
    expiresInDays: 7,
  },

  score_impact_moderate_drop: {
    type: "score_impact",
    severity: "warning",
    titleTemplate: "GEO Score Declined",
    descriptionTemplate:
      "Your GEO score has dropped by {changePercent}% (from {previousScore} to {currentScore}). Consider reviewing your action plan.",
    actionRequired: false,
    suggestedActionsTemplate: [
      "Review your current action items",
      "Check recent platform changes",
      "Monitor for continued decline",
    ],
    expiresInDays: 14,
  },

  score_impact_improvement: {
    type: "score_impact",
    severity: "info",
    titleTemplate: "GEO Score Improved!",
    descriptionTemplate:
      "Great news! Your GEO score has improved by {changePercent}% (from {previousScore} to {currentScore}). Your optimization efforts are paying off.",
    actionRequired: false,
    suggestedActionsTemplate: [
      "Continue with current strategy",
      "Document what's working",
      "Share success with stakeholders",
    ],
    expiresInDays: 30,
  },
};

// ============================================================================
// Alert Generation Functions
// ============================================================================

/**
 * Replace template placeholders with actual values
 */
function fillTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`{${key}}`, "g"), String(value));
  }
  return result;
}

/**
 * Generate an alert from a platform change
 */
export function generateAlertFromPlatformChange(
  platformChange: PlatformChange,
  context: AlertGenerationContext
): NewGeoAlert | null {
  let templateKey: string;
  const values: Record<string, string | number> = {
    platform: platformChange.platform,
  };

  switch (platformChange.changeType) {
    case "citation_pattern":
      templateKey = "algorithm_change_citation";
      values.changeType = "structured data";
      values.changePercent = platformChange.confidenceScore || 15;
      break;
    case "content_preference":
      templateKey = "algorithm_change_content";
      values.preferenceType = platformChange.description.substring(0, 100);
      break;
    case "feature_update":
      templateKey = "algorithm_change_feature";
      values.featureName = platformChange.description.substring(0, 50);
      break;
    case "ranking_factor":
      templateKey = "algorithm_change_citation";
      values.changeType = "ranking signals";
      values.changePercent = platformChange.confidenceScore || 10;
      break;
    case "deprecation":
      templateKey = "strategy_deprecated_content";
      values.contentType = "deprecated features";
      values.newPreference = platformChange.recommendedResponse.substring(0, 100);
      break;
    default:
      return null;
  }

  const template = ALERT_TEMPLATES[templateKey];
  if (!template) return null;

  const expiresAt = template.expiresInDays
    ? new Date(Date.now() + template.expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  return {
    organizationId: context.organizationId,
    brandId: context.brandId,
    alertType: template.type,
    severity: template.severity,
    title: fillTemplate(template.titleTemplate, values),
    description: fillTemplate(template.descriptionTemplate, values),
    affectedPlatforms: [platformChange.platform],
    actionRequired: template.actionRequired,
    suggestedActions: template.suggestedActionsTemplate.map((action) =>
      fillTemplate(action, values)
    ),
    platformChangeId: platformChange.id,
    expiresAt,
  };
}

/**
 * Generate a score impact alert
 */
export function generateScoreImpactAlert(
  context: AlertGenerationContext
): NewGeoAlert | null {
  if (!context.scoreChange) return null;

  const { previousScore, currentScore, changePercent } = context.scoreChange;
  const values: Record<string, string | number> = {
    previousScore,
    currentScore,
    changePercent: Math.abs(changePercent),
  };

  let templateKey: string;
  if (changePercent <= -15) {
    templateKey = "score_impact_significant_drop";
  } else if (changePercent < -5) {
    templateKey = "score_impact_moderate_drop";
  } else if (changePercent >= 5) {
    templateKey = "score_impact_improvement";
  } else {
    // Change too small to alert
    return null;
  }

  const template = ALERT_TEMPLATES[templateKey];
  if (!template) return null;

  const expiresAt = template.expiresInDays
    ? new Date(Date.now() + template.expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  return {
    organizationId: context.organizationId,
    brandId: context.brandId,
    alertType: template.type,
    severity: template.severity,
    title: fillTemplate(template.titleTemplate, values),
    description: fillTemplate(template.descriptionTemplate, values),
    affectedPlatforms: ["chatgpt", "claude", "gemini", "perplexity"],
    actionRequired: template.actionRequired,
    suggestedActions: template.suggestedActionsTemplate.map((action) =>
      fillTemplate(action, values)
    ),
    expiresAt,
  };
}

/**
 * Generate a competitor alert
 */
export function generateCompetitorAlert(
  context: AlertGenerationContext
): NewGeoAlert | null {
  if (!context.competitorData) return null;

  const { competitorName, platform, changeType } = context.competitorData;
  const values: Record<string, string | number> = {
    competitorName,
    platform,
    changeDescription: changeType,
  };

  const templateKey =
    changeType === "new_entrant"
      ? "competitor_move_new"
      : "competitor_move_visibility";

  const template = ALERT_TEMPLATES[templateKey];
  if (!template) return null;

  const expiresAt = template.expiresInDays
    ? new Date(Date.now() + template.expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  return {
    organizationId: context.organizationId,
    brandId: context.brandId,
    alertType: template.type,
    severity: template.severity,
    title: fillTemplate(template.titleTemplate, values),
    description: fillTemplate(template.descriptionTemplate, values),
    affectedPlatforms: [platform],
    actionRequired: template.actionRequired,
    suggestedActions: template.suggestedActionsTemplate.map((action) =>
      fillTemplate(action, values)
    ),
    expiresAt,
  };
}

/**
 * Generate a recommendation update alert
 */
export function generateRecommendationUpdateAlert(
  context: AlertGenerationContext,
  isNew: boolean = false,
  priorityDirection?: "increased" | "decreased"
): NewGeoAlert | null {
  if (!context.recommendationChange) return null;

  const { actionTitle, changeDescription } = context.recommendationChange;
  const values: Record<string, string | number> = {
    actionTitle,
    expectedImpact: 5,
    direction: priorityDirection || "updated",
  };

  const templateKey = isNew
    ? "recommendation_updated_new"
    : "recommendation_updated_priority";

  const template = ALERT_TEMPLATES[templateKey];
  if (!template) return null;

  const expiresAt = template.expiresInDays
    ? new Date(Date.now() + template.expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  return {
    organizationId: context.organizationId,
    brandId: context.brandId,
    alertType: template.type,
    severity: template.severity,
    title: fillTemplate(template.titleTemplate, values),
    description: fillTemplate(template.descriptionTemplate, values),
    affectedPlatforms: ["chatgpt", "claude", "gemini", "perplexity"],
    actionRequired: template.actionRequired,
    suggestedActions: template.suggestedActionsTemplate.map((action) =>
      fillTemplate(action, values)
    ),
    expiresAt,
  };
}

/**
 * Generate a new opportunity alert
 */
export function generateNewOpportunityAlert(
  context: AlertGenerationContext,
  opportunityType: "platform" | "feature",
  details: {
    platform: string;
    featureName?: string;
    improvement?: number;
  }
): NewGeoAlert | null {
  const values: Record<string, string | number> = {
    platform: details.platform,
    featureName: details.featureName || "new feature",
    improvement: details.improvement || 20,
  };

  const templateKey =
    opportunityType === "platform"
      ? "new_opportunity_platform"
      : "new_opportunity_feature";

  const template = ALERT_TEMPLATES[templateKey];
  if (!template) return null;

  const expiresAt = template.expiresInDays
    ? new Date(Date.now() + template.expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  return {
    organizationId: context.organizationId,
    brandId: context.brandId,
    alertType: template.type,
    severity: template.severity,
    title: fillTemplate(template.titleTemplate, values),
    description: fillTemplate(template.descriptionTemplate, values),
    affectedPlatforms: [details.platform],
    actionRequired: template.actionRequired,
    suggestedActions: template.suggestedActionsTemplate.map((action) =>
      fillTemplate(action, values)
    ),
    expiresAt,
  };
}

// ============================================================================
// Alert Filtering and Prioritization
// ============================================================================

/**
 * Sort alerts by severity and date
 */
export function sortAlerts(alerts: GeoAlert[]): GeoAlert[] {
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return [...alerts].sort((a, b) => {
    // First by severity
    const severityDiff =
      severityOrder[a.severity as AlertSeverity] -
      severityOrder[b.severity as AlertSeverity];
    if (severityDiff !== 0) return severityDiff;

    // Then by action required
    if (a.actionRequired !== b.actionRequired) {
      return a.actionRequired ? -1 : 1;
    }

    // Finally by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Filter expired alerts
 */
export function filterExpiredAlerts(alerts: GeoAlert[]): GeoAlert[] {
  const now = new Date();
  return alerts.filter((alert) => {
    if (!alert.expiresAt) return true;
    return new Date(alert.expiresAt) > now;
  });
}

/**
 * Filter unread alerts
 */
export function filterUnreadAlerts(alerts: GeoAlert[]): GeoAlert[] {
  return alerts.filter((alert) => !alert.readAt);
}

/**
 * Get alert counts by type
 */
export function getAlertCounts(alerts: GeoAlert[]): Record<GeoAlertType, number> {
  const counts: Record<GeoAlertType, number> = {
    algorithm_change: 0,
    recommendation_updated: 0,
    strategy_deprecated: 0,
    new_opportunity: 0,
    competitor_move: 0,
    score_impact: 0,
  };

  for (const alert of alerts) {
    if (alert.alertType in counts) {
      counts[alert.alertType as GeoAlertType]++;
    }
  }

  return counts;
}

/**
 * Get critical action items from alerts
 */
export function getCriticalActions(alerts: GeoAlert[]): GeoAlert[] {
  return alerts.filter(
    (alert) => alert.severity === "critical" && alert.actionRequired && !alert.dismissedAt
  );
}

// ============================================================================
// Alert Display Helpers
// ============================================================================

/**
 * Get severity icon (for UI)
 */
export function getSeverityIcon(severity: AlertSeverity): string {
  switch (severity) {
    case "critical":
      return "alert-circle";
    case "warning":
      return "alert-triangle";
    case "info":
      return "info";
    default:
      return "bell";
  }
}

/**
 * Get severity color class (for UI)
 */
export function getSeverityColorClass(severity: AlertSeverity): string {
  switch (severity) {
    case "critical":
      return "text-red-500 bg-red-500/10 border-red-500/20";
    case "warning":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "info":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    default:
      return "text-gray-500 bg-gray-500/10 border-gray-500/20";
  }
}

/**
 * Get alert type label (human-readable)
 */
export function getAlertTypeLabel(type: GeoAlertType): string {
  switch (type) {
    case "algorithm_change":
      return "Platform Update";
    case "recommendation_updated":
      return "Plan Updated";
    case "strategy_deprecated":
      return "Strategy Alert";
    case "new_opportunity":
      return "Opportunity";
    case "competitor_move":
      return "Competitor Alert";
    case "score_impact":
      return "Score Change";
    default:
      return "Alert";
  }
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    perplexity: "Perplexity",
    grok: "Grok",
    deepseek: "DeepSeek",
    copilot: "Copilot",
    all: "All Platforms",
  };
  return names[platform] || platform;
}

export { ALERT_TEMPLATES };
