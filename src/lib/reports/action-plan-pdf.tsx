import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { EnrichedRecommendation } from "@/lib/ai/step-generator";
import type { ImplementationStep, PlatformRelevance } from "@/lib/db/schema/geo-knowledge-base";
import type { TemplateId } from "@/lib/ai/recommendation-templates";

/**
 * Action Plan PDF Generator
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 * Requirements: FR-2.1 through FR-2.6
 *
 * Generates a comprehensive PDF Action Plan with:
 * - Step-by-step implementation guides
 * - Copy-paste schema code
 * - Platform relevance indicators
 * - Progress tracking checklist
 * - Version information
 */

// Register fonts
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2",
      fontWeight: 700,
    },
  ],
});

// Register monospace font for code snippets
Font.register({
  family: "FiraCode",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/firamono/v14/N0bX2SlFPv1weGeLZDtQIfTTkdbJYA.woff2",
      fontWeight: 400,
    },
  ],
});

// Color palette matching the Apex design system
const colors = {
  background: "#FFFFFF",
  cardBg: "#F8FAFC",
  primary: "#00B8A9", // Teal for print
  purple: "#7C3AED",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  codeBg: "#F1F5F9",
  critical: "#DC2626",
  high: "#EA580C",
  medium: "#D97706",
  low: "#2563EB",
};

// Styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    padding: 40,
    fontFamily: "Inter",
  },
  header: {
    marginBottom: 24,
    borderBottom: `2px solid ${colors.primary}`,
    paddingBottom: 16,
  },
  logo: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  versionBadge: {
    marginTop: 8,
    padding: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.cardBg,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  versionText: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    borderLeft: `4px solid ${colors.primary}`,
  },
  summaryText: {
    fontSize: 10,
    color: colors.textPrimary,
    lineHeight: 1.5,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 6,
    padding: 10,
    marginRight: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    border: `1px solid ${colors.border}`,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  actionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  actionNumberText: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.background,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textPrimary,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  actionDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 1.4,
  },
  impactRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  impactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  impactIcon: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  impactText: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  stepsContainer: {
    marginTop: 8,
    borderTop: `1px solid ${colors.border}`,
    paddingTop: 8,
  },
  stepsTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  step: {
    flexDirection: "row",
    marginBottom: 6,
  },
  stepNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  stepNumberText: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.textSecondary,
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 9,
    color: colors.textPrimary,
    lineHeight: 1.4,
  },
  stepTime: {
    fontSize: 8,
    color: colors.textSecondary,
    marginTop: 2,
  },
  codeBlock: {
    backgroundColor: colors.codeBg,
    borderRadius: 4,
    padding: 8,
    marginTop: 6,
    marginBottom: 6,
    fontFamily: "FiraCode",
  },
  codeText: {
    fontSize: 8,
    color: colors.textPrimary,
    fontFamily: "FiraCode",
    lineHeight: 1.4,
  },
  platformRelevance: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: `1px solid ${colors.border}`,
  },
  platformTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  platformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  platformBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  platformBadgeText: {
    fontSize: 8,
    fontWeight: 500,
  },
  checklistContainer: {
    marginTop: 16,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    border: `1px solid ${colors.border}`,
    marginRight: 8,
  },
  checklistText: {
    fontSize: 10,
    color: colors.textPrimary,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: `1px solid ${colors.border}`,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: colors.textSecondary,
  },
  schemaSection: {
    marginTop: 16,
  },
  schemaCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    border: `1px solid ${colors.border}`,
  },
  schemaTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  schemaDescription: {
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  validatorLink: {
    fontSize: 8,
    color: colors.primary,
    marginTop: 4,
  },
});

// Helper functions
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return colors.critical;
    case "high":
      return colors.high;
    case "medium":
      return colors.medium;
    case "low":
      return colors.low;
    default:
      return colors.textSecondary;
  }
};

const getPlatformColor = (score: number) => {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.primary;
  if (score >= 40) return colors.warning;
  return colors.textSecondary;
};

// Props interfaces
interface ActionPlanPDFProps {
  brandName: string;
  actions: EnrichedRecommendation[];
  generatedAt: Date;
  version: string;
  knowledgeBaseVersion?: string;
  expectedScoreImpact?: number;
  estimatedTime?: string;
  changes?: string[];
}

// Action Plan PDF Document
export const ActionPlanDocument: React.FC<ActionPlanPDFProps> = ({
  brandName,
  actions,
  generatedAt,
  version,
  knowledgeBaseVersion = "2026.01.1",
  expectedScoreImpact,
  estimatedTime,
  changes,
}) => {
  // Priority is a number: 1 = critical/high, 2 = medium, 3 = low
  // impact is: "high" | "medium" | "low"
  const criticalActions = actions.filter((a) => a.priority === 1 && a.impact === "high");
  const highActions = actions.filter((a) => a.priority === 1 && a.impact !== "high" || a.priority === 2 && a.impact === "high");
  const mediumActions = actions.filter((a) => a.priority === 2 && a.impact !== "high");
  const lowActions = actions.filter((a) => a.priority === 3);

  // Helper to get priority label string from EnrichedRecommendation
  const getPriorityLabel = (action: EnrichedRecommendation): string => {
    if (action.priority === 1 && action.impact === "high") return "critical";
    if (action.priority === 1 || (action.priority === 2 && action.impact === "high")) return "high";
    if (action.priority === 2) return "medium";
    return "low";
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);

  // Group actions with schema code separately
  const actionsWithSchema = actions.filter((a) => a.schemaCode);

  return (
    <Document>
      {/* Page 1: Summary & Critical Actions */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>APEX GEO ACTION PLAN</Text>
          <Text style={styles.title}>{brandName}</Text>
          <Text style={styles.subtitle}>Generated: {formatDate(generatedAt)}</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>
              Version {version} | Knowledge Base: {knowledgeBaseVersion}
            </Text>
          </View>
        </View>

        {/* Changes since last version */}
        {changes && changes.length > 0 && (
          <View style={styles.summaryBox}>
            <Text style={[styles.stepsTitle, { color: colors.warning }]}>
              Changes Since Last Version
            </Text>
            {changes.map((change, idx) => (
              <Text key={idx} style={styles.stepInstruction}>
                • {change}
              </Text>
            ))}
          </View>
        )}

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{actions.length}</Text>
            <Text style={styles.statLabel}>Total Actions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.critical }]}>
              {criticalActions.length}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.high }]}>
              {highActions.length}
            </Text>
            <Text style={styles.statLabel}>High</Text>
          </View>
          <View style={[styles.statBox, { marginRight: 0 }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              +{expectedScoreImpact || 15}
            </Text>
            <Text style={styles.statLabel}>Expected Points</Text>
          </View>
        </View>

        {/* Estimated Time */}
        {estimatedTime && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              <Text style={{ fontWeight: 600 }}>Estimated Time to Complete: </Text>
              {estimatedTime}
            </Text>
          </View>
        )}

        {/* Critical Priority Actions */}
        {criticalActions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.critical }]}>
              Critical Priority (Do This Week)
            </Text>
            {criticalActions.slice(0, 2).map((action, idx) => (
              <ActionCard key={action.templateId} action={action} index={idx + 1} getPriorityLabel={getPriorityLabel} />
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Apex GEO/AEO Platform | {brandName}
          </Text>
          <Text style={styles.footerText}>Page 1</Text>
        </View>
      </Page>

      {/* Page 2+: High Priority Actions */}
      {highActions.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.high }]}>
              High Priority (Do This Month)
            </Text>
            {highActions.slice(0, 3).map((action, idx) => (
              <ActionCard
                key={action.templateId}
                action={action}
                index={criticalActions.length + idx + 1}
                getPriorityLabel={getPriorityLabel}
              />
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Generated by Apex GEO/AEO Platform | {brandName}
            </Text>
            <Text style={styles.footerText}>Page 2</Text>
          </View>
        </Page>
      )}

      {/* Schema Code Library Page */}
      {actionsWithSchema.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schema Code Library</Text>
            <Text style={styles.summaryText}>
              Copy-paste these JSON-LD schema snippets into your website. Validate at
              validator.schema.org before deploying.
            </Text>
          </View>

          {actionsWithSchema.slice(0, 3).map((action) => (
            <View key={action.templateId} style={styles.schemaCard}>
              <Text style={styles.schemaTitle}>{action.title}</Text>
              <Text style={styles.schemaDescription}>{action.description}</Text>
              {action.schemaCode && (
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {action.schemaCode.slice(0, 800)}
                    {action.schemaCode.length > 800 ? "..." : ""}
                  </Text>
                </View>
              )}
              <Text style={styles.validatorLink}>
                Validate at: https://validator.schema.org/
              </Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Generated by Apex GEO/AEO Platform | {brandName}
            </Text>
            <Text style={styles.footerText}>Schema Library</Text>
          </View>
        </Page>
      )}

      {/* Progress Tracker Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Tracker</Text>
          <Text style={styles.summaryText}>
            Check off each action as you complete it. Mark your progress to track GEO
            score improvements.
          </Text>
        </View>

        <View style={styles.checklistContainer}>
          {actions.map((action, idx) => {
            const priorityLabel = getPriorityLabel(action);
            return (
              <View key={action.templateId} style={styles.checklistItem}>
                <View style={styles.checkbox} />
                <Text style={styles.checklistText}>
                  Action #{idx + 1}: {action.title}
                </Text>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: `${getPriorityColor(priorityLabel)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      { color: getPriorityColor(priorityLabel) },
                    ]}
                  >
                    {priorityLabel}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.summaryBox, { marginTop: 20 }]}>
          <Text style={styles.summaryText}>
            <Text style={{ fontWeight: 600 }}>Expected GEO Score After Completion: </Text>
            Current Score + {expectedScoreImpact || 15} points
          </Text>
          <Text style={[styles.summaryText, { marginTop: 4 }]}>
            <Text style={{ fontWeight: 600 }}>Timeline: </Text>
            {estimatedTime || "2-4 weeks with consistent effort"}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Apex GEO/AEO Platform | {brandName}
          </Text>
          <Text style={styles.footerText}>Progress Tracker</Text>
        </View>
      </Page>
    </Document>
  );
};

// Action Card Component
const ActionCard: React.FC<{
  action: EnrichedRecommendation;
  index: number;
  getPriorityLabel: (action: EnrichedRecommendation) => string;
}> = ({ action, index, getPriorityLabel }) => {
  const priorityLabel = getPriorityLabel(action);

  return (
    <View style={styles.actionCard}>
      {/* Header */}
      <View style={styles.actionHeader}>
        <View style={styles.actionNumber}>
          <Text style={styles.actionNumberText}>{index}</Text>
        </View>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: `${getPriorityColor(priorityLabel)}20` },
          ]}
        >
          <Text
            style={[
              styles.priorityText,
              { color: getPriorityColor(priorityLabel) },
            ]}
          >
            {priorityLabel}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.actionDescription}>{action.description}</Text>

      {/* Impact Row */}
      <View style={styles.impactRow}>
        <View style={styles.impactItem}>
          <View style={[styles.impactIcon, { backgroundColor: colors.success }]} />
          <Text style={styles.impactText}>
            Impact: +{action.expectedScoreImpact || 5} points
          </Text>
        </View>
        <View style={styles.impactItem}>
          <View style={[styles.impactIcon, { backgroundColor: colors.primary }]} />
          <Text style={styles.impactText}>Difficulty: {action.difficulty}</Text>
        </View>
        {action.estimatedTime && (
          <View style={styles.impactItem}>
            <View style={[styles.impactIcon, { backgroundColor: colors.warning }]} />
            <Text style={styles.impactText}>Time: {action.estimatedTime}</Text>
          </View>
        )}
      </View>

      {/* Steps */}
      {action.steps && action.steps.length > 0 && (
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Implementation Steps:</Text>
          {action.steps.slice(0, 5).map((step) => (
            <View key={step.stepNumber} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
                {step.estimatedTime && (
                  <Text style={styles.stepTime}>~{step.estimatedTime}</Text>
                )}
              </View>
            </View>
          ))}
          {action.steps.length > 5 && (
            <Text style={[styles.stepInstruction, { marginTop: 4, fontStyle: "italic" }]}>
              +{action.steps.length - 5} more steps...
            </Text>
          )}
        </View>
      )}

      {/* Platform Relevance */}
      {action.platformRelevance && (
        <View style={styles.platformRelevance}>
          <Text style={styles.platformTitle}>AI Platform Impact:</Text>
          <View style={styles.platformRow}>
            {Object.entries(action.platformRelevance)
              .filter(([_, score]) => score && score > 50)
              .sort(([_, a], [__, b]) => (b || 0) - (a || 0))
              .slice(0, 4)
              .map(([platform, score]) => (
                <View
                  key={platform}
                  style={[
                    styles.platformBadge,
                    { backgroundColor: `${getPlatformColor(score || 0)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.platformBadgeText,
                      { color: getPlatformColor(score || 0) },
                    ]}
                  >
                    {platform}: {score}%
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}
    </View>
  );
};

// Function to generate PDF buffer
export async function generateActionPlanPDF(
  props: ActionPlanPDFProps
): Promise<Buffer> {
  const buffer = await renderToBuffer(<ActionPlanDocument {...props} />);
  return buffer as Buffer;
}

// Helper to create sample action plan data for testing
export function createSampleActionPlanData(): ActionPlanPDFProps {
  const sampleActions: EnrichedRecommendation[] = [
    {
      templateId: "optimize_structured_data" as TemplateId,
      title: "Add FAQ Schema to Homepage",
      description:
        "AI platforms like ChatGPT and Perplexity specifically look for FAQ schema to answer user questions. Without it, your answers won't be cited.",
      priority: 1,
      impact: "high",
      difficulty: "easy",
      estimatedTime: "30 minutes",
      expectedScoreImpact: 12,
      steps: [
        { stepNumber: 1, instruction: "Open your homepage HTML in your CMS or code editor" },
        {
          stepNumber: 2,
          instruction: "Add the FAQ schema JSON-LD in the <head> section",
        },
        {
          stepNumber: 3,
          instruction: "Add 5-10 of your most common customer questions",
        },
        { stepNumber: 4, instruction: "Test at https://validator.schema.org/" },
        {
          stepNumber: 5,
          instruction: "Publish and wait 24-48 hours for AI platforms to recrawl",
        },
      ],
      platformRelevance: {
        chatgpt: 95,
        claude: 85,
        gemini: 75,
        perplexity: 90,
        grok: 60,
        deepseek: 70,
        copilot: 80,
      },
      schemaCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is [Your Product]?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "[Your answer here - 2-3 sentences]"
    }
  }]
}
</script>`,
    },
    {
      templateId: "create_authoritative_content" as TemplateId,
      title: "Create 'What is [Brand]?' Page",
      description:
        "When users ask AI 'What is [Brand]?', AI looks for a definitive page that explains your brand. Without this, AI makes up answers or says 'I don't have information'.",
      priority: 1,
      impact: "high",
      difficulty: "moderate",
      estimatedTime: "2 hours",
      expectedScoreImpact: 8,
      steps: [
        {
          stepNumber: 1,
          instruction: "Create new page at yoursite.com/about or /what-is-[brand]",
        },
        {
          stepNumber: 2,
          instruction: "Add H1 with 'What is [Brand]?' title",
        },
        {
          stepNumber: 3,
          instruction: "Write one-sentence definition in first paragraph",
        },
        { stepNumber: 4, instruction: "Add Key Features section with bullet points" },
        { stepNumber: 5, instruction: "Add Organization schema to the page" },
      ],
      platformRelevance: {
        chatgpt: 90,
        claude: 95,
        gemini: 80,
        perplexity: 85,
        grok: 70,
        deepseek: 75,
        copilot: 80,
      },
    },
    {
      templateId: "perplexity_fresh_content" as TemplateId,
      title: "Publish Weekly Industry Content",
      description:
        "Perplexity heavily favors fresh, recently-updated content. Brands that publish weekly get 3x more citations than those publishing monthly.",
      priority: 2,
      impact: "high",
      difficulty: "hard",
      estimatedTime: "4 hours/week",
      expectedScoreImpact: 15,
      steps: [
        { stepNumber: 1, instruction: "Create a content calendar with weekly themes" },
        {
          stepNumber: 2,
          instruction: "Week 1: Industry News Analysis (what happened this week)",
        },
        {
          stepNumber: 3,
          instruction: "Week 2: How-To Guide (solve a customer problem)",
        },
        { stepNumber: 4, instruction: "Week 3: Case Study (customer success story)" },
        {
          stepNumber: 5,
          instruction: "Week 4: Data/Research (original statistics or survey)",
        },
      ],
      platformRelevance: {
        chatgpt: 75,
        claude: 70,
        gemini: 80,
        perplexity: 95,
        grok: 85,
        deepseek: 65,
        copilot: 70,
      },
    },
  ];

  return {
    brandName: "Example Brand",
    generatedAt: new Date(),
    version: "2.3",
    knowledgeBaseVersion: "2026.01.3",
    expectedScoreImpact: 18,
    estimatedTime: "12-16 hours",
    changes: [
      "Action #1: FAQ Schema - Updated code template (Schema.org 2024 spec)",
      "Action #3: Content Calendar - Perplexity now favors 1500+ word articles",
      "NEW: Action #8 - YouTube Shorts for Gemini visibility",
    ],
    actions: sampleActions,
  };
}
