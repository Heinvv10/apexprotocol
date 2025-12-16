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
import type { ReportContent } from "@/lib/db/schema/portfolios";

// Register fonts (using default system fonts for now)
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

// Color palette matching the Apex design system
const colors = {
  background: "#02030A",
  cardBg: "#0F1225",
  primary: "#00E5CC",
  purple: "#8B5CF6",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  border: "#1E293B",
};

// Styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    padding: 40,
    fontFamily: "Inter",
  },
  header: {
    marginBottom: 30,
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    border: `1px solid ${colors.border}`,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginTop: 4,
  },
  metricChange: {
    fontSize: 12,
    marginTop: 4,
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.error,
  },
  neutral: {
    color: colors.textSecondary,
  },
  text: {
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 1.5,
  },
  textSecondary: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 1.4,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
    marginTop: 4,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.border,
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: `1px solid ${colors.border}`,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: colors.textPrimary,
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: `1px solid ${colors.border}`,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  scoreBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    width: "23%",
    marginRight: "2%",
    border: `1px solid ${colors.border}`,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.textPrimary,
  },
  scoreLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 4,
    textTransform: "uppercase",
  },
  highlight: {
    backgroundColor: `${colors.primary}15`,
    borderLeft: `3px solid ${colors.primary}`,
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  highlightText: {
    fontSize: 11,
    color: colors.textPrimary,
  },
});

// Helper to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Helper to get change indicator
const getChangeIndicator = (change: number): string => {
  if (change > 0) return `+${change}%`;
  if (change < 0) return `${change}%`;
  return "0%";
};

interface ExecutiveReportProps {
  title: string;
  portfolioName?: string;
  periodStart: Date;
  periodEnd: Date;
  content: ReportContent;
  organizationName?: string;
}

// Executive Report PDF Document
export const ExecutiveReportDocument: React.FC<ExecutiveReportProps> = ({
  title,
  portfolioName,
  periodStart,
  periodEnd,
  content,
  organizationName = "Your Organization",
}) => {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);

  return (
    <Document>
      {/* Page 1: Summary & Scores */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>APEX</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {portfolioName && `${portfolioName} | `}
            {formatDate(periodStart)} - {formatDate(periodEnd)}
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.card}>
            <Text
              style={[styles.text, { fontWeight: 600, marginBottom: 12 }]}
            >
              {content.summary.headline}
            </Text>

            {/* Key Metrics Grid */}
            <View style={[styles.row, { marginBottom: 16 }]}>
              {content.summary.keyMetrics.slice(0, 4).map((metric, idx) => (
                <View key={idx} style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>
                    {typeof metric.value === "number"
                      ? formatNumber(metric.value)
                      : metric.value}
                  </Text>
                  <Text style={styles.scoreLabel}>{metric.label}</Text>
                  <Text
                    style={[
                      styles.metricChange,
                      metric.changeDirection === "up"
                        ? styles.positive
                        : metric.changeDirection === "down"
                        ? styles.negative
                        : styles.neutral,
                    ]}
                  >
                    {getChangeIndicator(metric.change)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Highlights */}
            {content.summary.highlights.map((highlight, idx) => (
              <View key={idx} style={styles.highlight}>
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Digital Presence Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Digital Presence Scores</Text>
          <View style={styles.row}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{content.scores.unified.current}</Text>
              <Text style={styles.scoreLabel}>Unified Score</Text>
              <Text
                style={[
                  styles.metricChange,
                  content.scores.unified.current >= content.scores.unified.previous
                    ? styles.positive
                    : styles.negative,
                ]}
              >
                {getChangeIndicator(
                  content.scores.unified.current - content.scores.unified.previous
                )}
              </Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{content.scores.geo.current}</Text>
              <Text style={styles.scoreLabel}>GEO Score</Text>
              <Text
                style={[
                  styles.metricChange,
                  content.scores.geo.current >= content.scores.geo.previous
                    ? styles.positive
                    : styles.negative,
                ]}
              >
                {getChangeIndicator(
                  content.scores.geo.current - content.scores.geo.previous
                )}
              </Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{content.scores.seo.current}</Text>
              <Text style={styles.scoreLabel}>SEO Score</Text>
              <Text
                style={[
                  styles.metricChange,
                  content.scores.seo.current >= content.scores.seo.previous
                    ? styles.positive
                    : styles.negative,
                ]}
              >
                {getChangeIndicator(
                  content.scores.seo.current - content.scores.seo.previous
                )}
              </Text>
            </View>
            <View style={[styles.scoreBox, { marginRight: 0 }]}>
              <Text style={styles.scoreValue}>{content.scores.aeo.current}</Text>
              <Text style={styles.scoreLabel}>AEO Score</Text>
              <Text
                style={[
                  styles.metricChange,
                  content.scores.aeo.current >= content.scores.aeo.previous
                    ? styles.positive
                    : styles.negative,
                ]}
              >
                {getChangeIndicator(
                  content.scores.aeo.current - content.scores.aeo.previous
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Apex | {organizationName}
          </Text>
          <Text style={styles.footerText}>Page 1</Text>
        </View>
      </Page>

      {/* Page 2: AI Mentions & Recommendations */}
      <Page size="A4" style={styles.page}>
        {/* AI Platform Mentions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Platform Mentions</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.metricValue}>
                  {formatNumber(content.mentions.total)}
                </Text>
                <Text style={styles.metricLabel}>Total Mentions</Text>
              </View>
            </View>

            {/* Platform Breakdown */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Platform</Text>
                <Text style={styles.tableCellHeader}>Mentions</Text>
                <Text style={styles.tableCellHeader}>Sentiment</Text>
              </View>
              {content.mentions.byPlatform.map((platform, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {platform.platform.charAt(0).toUpperCase() +
                      platform.platform.slice(1)}
                  </Text>
                  <Text style={styles.tableCell}>{platform.count}</Text>
                  <Text
                    style={[
                      styles.tableCell,
                      platform.sentiment === "positive"
                        ? styles.positive
                        : platform.sentiment === "negative"
                        ? styles.negative
                        : styles.neutral,
                    ]}
                  >
                    {platform.sentiment.charAt(0).toUpperCase() +
                      platform.sentiment.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Top Queries */}
        {content.mentions.topQueries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top AI Queries</Text>
            <View style={styles.card}>
              {content.mentions.topQueries.slice(0, 5).map((query, idx) => (
                <View key={idx} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.text}>{query.query}</Text>
                    <Text style={styles.textSecondary}>
                      {query.count} mentions
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommendations Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendation Progress</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.scoreBox}>
                <Text style={[styles.scoreValue, styles.positive]}>
                  {content.recommendations.completed}
                </Text>
                <Text style={styles.scoreLabel}>Completed</Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={[styles.scoreValue, { color: colors.warning }]}>
                  {content.recommendations.inProgress}
                </Text>
                <Text style={styles.scoreLabel}>In Progress</Text>
              </View>
              <View style={[styles.scoreBox, { marginRight: 0 }]}>
                <Text style={styles.scoreValue}>
                  {content.recommendations.pending}
                </Text>
                <Text style={styles.scoreLabel}>Pending</Text>
              </View>
            </View>

            {/* Top Priority Recommendations */}
            {content.recommendations.topPriority.length > 0 && (
              <>
                <Text
                  style={[
                    styles.text,
                    { fontWeight: 600, marginTop: 16, marginBottom: 8 },
                  ]}
                >
                  Top Priority Actions
                </Text>
                {content.recommendations.topPriority.slice(0, 3).map((rec, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <View style={styles.bullet} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.text}>{rec.title}</Text>
                      <Text style={styles.textSecondary}>
                        {rec.category} | {rec.impact} Impact
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Apex | {organizationName}
          </Text>
          <Text style={styles.footerText}>Page 2</Text>
        </View>
      </Page>

      {/* Page 3: Competitive Intelligence & Insights */}
      <Page size="A4" style={styles.page}>
        {/* Competitive Intelligence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Competitive Intelligence</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.metricValue}>
                  {content.competitive.shareOfVoice}%
                </Text>
                <Text style={styles.metricLabel}>Share of Voice</Text>
              </View>
            </View>

            {/* Competitor Comparison */}
            {content.competitive.competitorComparison.length > 0 && (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, { flex: 2 }]}>
                    Competitor
                  </Text>
                  <Text style={styles.tableCellHeader}>Share of Voice</Text>
                </View>
                {content.competitive.competitorComparison.map((comp, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{comp.name}</Text>
                    <Text style={styles.tableCell}>{comp.sov}%</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Opportunity Gaps */}
        {content.competitive.gaps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opportunity Gaps</Text>
            <View style={styles.card}>
              {content.competitive.gaps.slice(0, 5).map((gap, idx) => (
                <View key={idx} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.text}>{gap.keyword}</Text>
                    <Text style={styles.textSecondary}>{gap.opportunity}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Key Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          <View style={styles.card}>
            {content.insights.map((insight, idx) => (
              <View key={idx} style={styles.highlight}>
                <Text style={styles.highlightText}>{insight}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Brand Breakdown (if portfolio) */}
        {content.brandBreakdown && content.brandBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Brand Performance</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Brand</Text>
                <Text style={styles.tableCellHeader}>Unified</Text>
                <Text style={styles.tableCellHeader}>GEO</Text>
                <Text style={styles.tableCellHeader}>Mentions</Text>
              </View>
              {content.brandBreakdown.map((brand, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {brand.brandName}
                  </Text>
                  <Text style={styles.tableCell}>{brand.scores.unified}</Text>
                  <Text style={styles.tableCell}>{brand.scores.geo}</Text>
                  <Text style={styles.tableCell}>{brand.mentionCount}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Apex | {organizationName}
          </Text>
          <Text style={styles.footerText}>Page 3</Text>
        </View>
      </Page>
    </Document>
  );
};

// Function to generate PDF buffer
export async function generateExecutiveReportPDF(
  props: ExecutiveReportProps
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <ExecutiveReportDocument {...props} />
  );
  return buffer as Buffer;
}

// Helper to create sample report content for testing
export function createSampleReportContent(): ReportContent {
  return {
    summary: {
      headline:
        "Strong growth in AI visibility with 23% increase in positive mentions across all platforms.",
      keyMetrics: [
        { label: "Unified Score", value: 72, change: 8, changeDirection: "up" },
        { label: "AI Mentions", value: 1247, change: 23, changeDirection: "up" },
        { label: "Share of Voice", value: 34, change: 5, changeDirection: "up" },
        { label: "Sentiment", value: "78%", change: -2, changeDirection: "down" },
      ],
      highlights: [
        "ChatGPT mentions increased by 45% following schema optimization",
        "Perplexity citations now consistently include brand recommendations",
        "Competitor gap analysis reveals 3 high-opportunity keywords",
      ],
    },
    scores: {
      unified: { current: 72, previous: 64, trend: [60, 62, 64, 68, 72] },
      seo: { current: 78, previous: 75, trend: [72, 73, 75, 76, 78] },
      geo: { current: 68, previous: 58, trend: [52, 55, 58, 63, 68] },
      aeo: { current: 65, previous: 62, trend: [58, 60, 62, 63, 65] },
    },
    mentions: {
      total: 1247,
      byPlatform: [
        { platform: "chatgpt", count: 423, sentiment: "positive" },
        { platform: "claude", count: 312, sentiment: "positive" },
        { platform: "gemini", count: 198, sentiment: "neutral" },
        { platform: "perplexity", count: 187, sentiment: "positive" },
        { platform: "copilot", count: 127, sentiment: "neutral" },
      ],
      topQueries: [
        { query: "Best [industry] companies in [region]", count: 156 },
        { query: "Top rated [product] providers", count: 134 },
        { query: "[Brand] vs competitors comparison", count: 98 },
        { query: "Recommended [service] solutions", count: 87 },
        { query: "[Brand] reviews and ratings", count: 72 },
      ],
    },
    recommendations: {
      completed: 12,
      inProgress: 5,
      pending: 8,
      topPriority: [
        { title: "Add FAQ Schema to product pages", category: "Schema", impact: "High" },
        { title: "Optimize meta descriptions for AI extraction", category: "Content", impact: "High" },
        { title: "Create authoritative comparison content", category: "Content", impact: "Medium" },
      ],
    },
    competitive: {
      shareOfVoice: 34,
      competitorComparison: [
        { name: "Competitor A", sov: 28 },
        { name: "Competitor B", sov: 22 },
        { name: "Competitor C", sov: 16 },
      ],
      gaps: [
        { keyword: "best enterprise solutions", opportunity: "Not appearing in top 3 AI responses" },
        { keyword: "industry benchmarks", opportunity: "Competitor A dominates this query" },
        { keyword: "pricing comparison", opportunity: "Missing structured pricing content" },
      ],
    },
    insights: [
      "Your brand is consistently mentioned in positive contexts when users ask for recommendations.",
      "Schema markup improvements have directly correlated with increased AI citations.",
      "Consider creating more comparison content to capture competitor-related queries.",
    ],
  };
}
