import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { InvestorReportContent } from "@/lib/db/schema/portfolios";

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
  coverPage: {
    backgroundColor: colors.background,
    padding: 40,
    fontFamily: "Inter",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  coverContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverLogo: {
    fontSize: 48,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 24,
    letterSpacing: 4,
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: "center",
  },
  coverDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 40,
    textAlign: "center",
  },
  coverDivider: {
    width: 100,
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: 24,
  },
  coverConfidential: {
    position: "absolute",
    bottom: 60,
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 2,
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
  tocItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottom: `1px solid ${colors.border}`,
    alignItems: "center",
  },
  tocLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  tocPage: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: 600,
  },
  credibilityCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    border: `2px solid ${colors.primary}`,
  },
  credibilityScore: {
    fontSize: 48,
    fontWeight: 700,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  credibilityLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
    marginTop: 5,
  },
  strengthBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 8,
    marginTop: 5,
  },
  riskBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
    marginRight: 8,
    marginTop: 5,
  },
  investmentRecommendation: {
    backgroundColor: `${colors.purple}15`,
    borderLeft: `3px solid ${colors.purple}`,
    padding: 16,
    marginTop: 16,
    borderRadius: 4,
  },
  chartImage: {
    width: "100%",
    maxWidth: 500,
    height: "auto",
    marginVertical: 12,
    borderRadius: 4,
  },
  trendIndicator: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
  },
  trendUp: {
    color: colors.success,
  },
  trendDown: {
    color: colors.error,
  },
  trendStable: {
    color: colors.textSecondary,
  },
  comparisonBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    border: `1px solid ${colors.border}`,
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.textPrimary,
  },
  comparisonChange: {
    fontSize: 11,
    marginTop: 2,
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

interface InvestorReportProps {
  title: string;
  portfolioName?: string;
  businessName?: string;
  periodStart: Date;
  periodEnd: Date;
  content: InvestorReportContent;
  organizationName?: string;
  geoTrendsChartImage?: string; // Base64 encoded chart image
}

// Investor Report PDF Document
export const InvestorReportDocument: React.FC<InvestorReportProps> = ({
  title,
  portfolioName,
  businessName,
  periodStart,
  periodEnd,
  content,
  organizationName = "Your Organization",
  geoTrendsChartImage,
}) => {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);

  const reportDate = formatDate(new Date());
  const subjectName = businessName || portfolioName || "Subject Business";

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContent}>
          <Text style={styles.coverLogo}>APEX</Text>
          <View style={styles.coverDivider} />
          <Text style={styles.coverTitle}>{title}</Text>
          <Text style={styles.coverSubtitle}>{subjectName}</Text>
          <Text style={styles.coverSubtitle}>
            {formatDate(periodStart)} - {formatDate(periodEnd)}
          </Text>
          <Text style={styles.coverDate}>Generated: {reportDate}</Text>
        </View>
        <Text style={styles.coverConfidential}>
          Confidential Investor Intelligence
        </Text>
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>APEX</Text>
          <Text style={styles.title}>Table of Contents</Text>
          <Text style={styles.subtitle}>
            {subjectName} | Investor Intelligence Report
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.tocItem}>
            <Text style={styles.tocLabel}>Executive Summary</Text>
            <Text style={styles.tocPage}>Page 1</Text>
          </View>
          <View style={styles.tocItem}>
            <Text style={styles.tocLabel}>Brand Credibility Assessment</Text>
            <Text style={styles.tocPage}>Page 1</Text>
          </View>
          <View style={styles.tocItem}>
            <Text style={styles.tocLabel}>GEO Visibility Trends</Text>
            <Text style={styles.tocPage}>Page 2</Text>
          </View>
          <View style={styles.tocItem}>
            <Text style={styles.tocLabel}>Industry Benchmark Comparison</Text>
            <Text style={styles.tocPage}>Page 3</Text>
          </View>
          <View style={styles.tocItem}>
            <Text style={styles.tocLabel}>Impact Index Breakdown</Text>
            <Text style={styles.tocPage}>Page 4</Text>
          </View>
          <View style={styles.tocItem}>
            <Text style={styles.tocLabel}>Calculation Methodology</Text>
            <Text style={styles.tocPage}>Page 4</Text>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 32 }]}>
          <View style={styles.card}>
            <Text style={[styles.text, { fontWeight: 600, marginBottom: 8 }]}>
              Report Scope
            </Text>
            <Text style={styles.textSecondary}>
              Period: {formatDate(periodStart)} - {formatDate(periodEnd)}
            </Text>
            <Text style={styles.textSecondary}>
              Generated: {reportDate}
            </Text>
            <Text style={[styles.textSecondary, { marginTop: 8 }]}>
              This report provides comprehensive investor intelligence including GEO visibility analytics,
              credibility metrics, industry benchmarks, and Impact Index analysis for {subjectName}.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Apex | {organizationName}
          </Text>
          <Text style={styles.footerText}>Contents</Text>
        </View>
      </Page>

      {/* Page 1: Executive Summary & Credibility */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>APEX</Text>
          <Text style={styles.title}>Executive Summary</Text>
          <Text style={styles.subtitle}>
            {subjectName} | {formatDate(periodStart)} - {formatDate(periodEnd)}
          </Text>
        </View>

        {/* Key Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          <View style={styles.card}>
            <Text style={[styles.text, { fontWeight: 600, marginBottom: 12 }]}>
              {content.summary.headline}
            </Text>

            {/* Summary Highlights */}
            {content.summary.highlights.map((highlight, idx) => (
              <View key={idx} style={styles.highlight}>
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Metrics</Text>
          <View style={styles.row}>
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
        </View>

        {/* Brand Credibility Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brand Credibility Assessment</Text>
          <View style={styles.credibilityCard}>
            <Text style={styles.credibilityScore}>
              {content.credibilitySummary.credibilityScore}
            </Text>
            <Text style={styles.credibilityLabel}>
              Credibility Score (Impact Index: {content.credibilitySummary.impactIndexRating})
            </Text>

            {/* Strengths */}
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.text, { fontWeight: 600, marginBottom: 6, color: colors.success }]}>
                Key Strengths
              </Text>
              {content.credibilitySummary.strengths.map((strength, idx) => (
                <View key={idx} style={styles.listItem}>
                  <View style={styles.strengthBullet} />
                  <Text style={[styles.text, { flex: 1 }]}>{strength}</Text>
                </View>
              ))}
            </View>

            {/* Risks */}
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.text, { fontWeight: 600, marginBottom: 6, color: colors.warning }]}>
                Risk Factors
              </Text>
              {content.credibilitySummary.risks.map((risk, idx) => (
                <View key={idx} style={styles.listItem}>
                  <View style={styles.riskBullet} />
                  <Text style={[styles.text, { flex: 1 }]}>{risk}</Text>
                </View>
              ))}
            </View>

            {/* Investment Recommendation */}
            <View style={styles.investmentRecommendation}>
              <Text style={[styles.text, { fontWeight: 600, marginBottom: 6, color: colors.purple }]}>
                Investment Recommendation
              </Text>
              <Text style={styles.text}>
                {content.credibilitySummary.investmentRecommendation}
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

      {/* Page 2: GEO Visibility Trends */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>APEX</Text>
          <Text style={styles.title}>GEO Visibility Trends</Text>
          <Text style={styles.subtitle}>
            {subjectName} | {content.geoTrends.dateRange.start} - {content.geoTrends.dateRange.end}
          </Text>
        </View>

        {/* Trend Direction Indicator */}
        <View style={styles.section}>
          <Text
            style={[
              styles.trendIndicator,
              content.geoTrends.trendDirection === "up"
                ? styles.trendUp
                : content.geoTrends.trendDirection === "down"
                ? styles.trendDown
                : styles.trendStable,
            ]}
          >
            Trend Direction: {content.geoTrends.trendDirection === "up" ? "Upward" : content.geoTrends.trendDirection === "down" ? "Downward" : "Stable"}
          </Text>
        </View>

        {/* GEO Visibility Chart or No Data Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Over Time</Text>
          {geoTrendsChartImage ? (
            <View style={styles.card}>
              <Image src={geoTrendsChartImage} style={styles.chartImage} />
            </View>
          ) : content.geoTrends.metrics.length === 0 ? (
            <View style={styles.card}>
              <Text style={[styles.text, { color: colors.warning, fontWeight: 600, textAlign: "center", paddingVertical: 20 }]}>
                No GEO data available for this period.
              </Text>
              <Text style={[styles.textSecondary, { textAlign: "center" }]}>
                Data Range: {content.geoTrends.dateRange.start} - {content.geoTrends.dateRange.end}
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={[styles.textSecondary, { textAlign: "center", paddingVertical: 20 }]}>
                Chart visualization not available in this version.
              </Text>
            </View>
          )}
        </View>

        {/* Period Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period-over-Period Comparison</Text>
          <View style={styles.row}>
            {/* Impressions Comparison */}
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonLabel}>Impressions</Text>
              <Text style={styles.comparisonValue}>
                {formatNumber(content.geoTrends.periodComparison.currentPeriod.impressions)}
              </Text>
              <Text
                style={[
                  styles.comparisonChange,
                  content.geoTrends.periodComparison.percentChange.impressions >= 0
                    ? styles.positive
                    : styles.negative,
                ]}
              >
                {getChangeIndicator(content.geoTrends.periodComparison.percentChange.impressions)}
              </Text>
            </View>

            {/* Clicks Comparison */}
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonLabel}>Clicks</Text>
              <Text style={styles.comparisonValue}>
                {formatNumber(content.geoTrends.periodComparison.currentPeriod.clicks)}
              </Text>
              <Text
                style={[
                  styles.comparisonChange,
                  content.geoTrends.periodComparison.percentChange.clicks >= 0
                    ? styles.positive
                    : styles.negative,
                ]}
              >
                {getChangeIndicator(content.geoTrends.periodComparison.percentChange.clicks)}
              </Text>
            </View>

            {/* CTR Comparison */}
            <View style={[styles.comparisonBox, { marginRight: 0 }]}>
              <Text style={styles.comparisonLabel}>CTR</Text>
              <Text style={styles.comparisonValue}>
                {content.geoTrends.periodComparison.currentPeriod.ctr.toFixed(2)}%
              </Text>
              <Text
                style={[
                  styles.comparisonChange,
                  content.geoTrends.periodComparison.percentChange.ctr >= 0
                    ? styles.positive
                    : styles.negative,
                ]}
              >
                {getChangeIndicator(content.geoTrends.periodComparison.percentChange.ctr)}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Metrics Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Metrics</Text>
          <View style={styles.card}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellHeader}>Metric</Text>
                <Text style={styles.tableCellHeader}>Current Period</Text>
                <Text style={styles.tableCellHeader}>Previous Period</Text>
                <Text style={styles.tableCellHeader}>Change</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Impressions</Text>
                <Text style={styles.tableCell}>
                  {formatNumber(content.geoTrends.periodComparison.currentPeriod.impressions)}
                </Text>
                <Text style={styles.tableCell}>
                  {formatNumber(content.geoTrends.periodComparison.previousPeriod.impressions)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    content.geoTrends.periodComparison.percentChange.impressions >= 0
                      ? styles.positive
                      : styles.negative,
                  ]}
                >
                  {getChangeIndicator(content.geoTrends.periodComparison.percentChange.impressions)}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Clicks</Text>
                <Text style={styles.tableCell}>
                  {formatNumber(content.geoTrends.periodComparison.currentPeriod.clicks)}
                </Text>
                <Text style={styles.tableCell}>
                  {formatNumber(content.geoTrends.periodComparison.previousPeriod.clicks)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    content.geoTrends.periodComparison.percentChange.clicks >= 0
                      ? styles.positive
                      : styles.negative,
                  ]}
                >
                  {getChangeIndicator(content.geoTrends.periodComparison.percentChange.clicks)}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>CTR</Text>
                <Text style={styles.tableCell}>
                  {content.geoTrends.periodComparison.currentPeriod.ctr.toFixed(2)}%
                </Text>
                <Text style={styles.tableCell}>
                  {content.geoTrends.periodComparison.previousPeriod.ctr.toFixed(2)}%
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    content.geoTrends.periodComparison.percentChange.ctr >= 0
                      ? styles.positive
                      : styles.negative,
                  ]}
                >
                  {getChangeIndicator(content.geoTrends.periodComparison.percentChange.ctr)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Apex | {organizationName}
          </Text>
          <Text style={styles.footerText}>Page 2</Text>
        </View>
      </Page>

      {/* Page 3: Benchmark Comparison */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>APEX</Text>
          <Text style={styles.title}>Industry Benchmark Comparison</Text>
          <Text style={styles.subtitle}>
            {subjectName} | {formatDate(periodStart)} - {formatDate(periodEnd)}
          </Text>
        </View>

        {/* Benchmark Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance vs. Industry Median</Text>
          {content.benchmarkData.comparableBusinessesCount < 3 ? (
            <View style={styles.card}>
              <Text style={[styles.text, { color: colors.warning, fontWeight: 600, marginBottom: 12 }]}>
                Insufficient benchmark data available. Industry comparisons require minimum 3 comparable businesses.
              </Text>
              <Text style={[styles.text, { marginBottom: 16 }]}>
                Currently found: {content.benchmarkData.comparableBusinessesCount} comparable businesses in the organization.
              </Text>
              <Text style={[styles.text, { fontWeight: 600, marginBottom: 12 }]}>
                Subject Business Performance:
              </Text>
              {/* Subject Business Metrics Only */}
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, { flex: 2 }]}>Metric</Text>
                  <Text style={styles.tableCellHeader}>Score</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Unified Score</Text>
                  <Text style={styles.tableCell}>
                    {content.benchmarkData.subjectBusiness.unifiedScore}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>GEO Score</Text>
                  <Text style={styles.tableCell}>
                    {content.benchmarkData.subjectBusiness.geoScore}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Credibility Score</Text>
                  <Text style={styles.tableCell}>
                    {content.benchmarkData.subjectBusiness.credibilityScore}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={[styles.text, { marginBottom: 12 }]}>
                Compared against {content.benchmarkData.comparableBusinessesCount} comparable businesses in the industry.
              </Text>
              <Text style={[styles.text, { fontWeight: 600, marginBottom: 16 }]}>
                Percentile Ranking: {content.benchmarkData.percentileRanking}th percentile
                {content.benchmarkData.percentileRanking >= 75 && " (Top 25%)"}
              </Text>

              {/* Benchmark Comparison Table */}
              <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Metric</Text>
                <Text style={styles.tableCellHeader}>Industry Median</Text>
                <Text style={styles.tableCellHeader}>Subject Business</Text>
                <Text style={styles.tableCellHeader}>Delta</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Unified Score</Text>
                <Text style={styles.tableCell}>
                  {content.benchmarkData.industryMedian.unifiedScore}
                </Text>
                <Text style={styles.tableCell}>
                  {content.benchmarkData.subjectBusiness.unifiedScore}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    content.benchmarkData.delta.unifiedScore >= 0
                      ? styles.positive
                      : styles.negative,
                  ]}
                >
                  {getChangeIndicator(content.benchmarkData.delta.unifiedScore)}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>GEO Score</Text>
                <Text style={styles.tableCell}>
                  {content.benchmarkData.industryMedian.geoScore}
                </Text>
                <Text style={styles.tableCell}>
                  {content.benchmarkData.subjectBusiness.geoScore}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    content.benchmarkData.delta.geoScore >= 0
                      ? styles.positive
                      : styles.negative,
                  ]}
                >
                  {getChangeIndicator(content.benchmarkData.delta.geoScore)}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Credibility Score</Text>
                <Text style={styles.tableCell}>
                  {content.benchmarkData.industryMedian.credibilityScore}
                </Text>
                <Text style={styles.tableCell}>
                  {content.benchmarkData.subjectBusiness.credibilityScore}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    content.benchmarkData.delta.credibilityScore >= 0
                      ? styles.positive
                      : styles.negative,
                  ]}
                >
                  {getChangeIndicator(content.benchmarkData.delta.credibilityScore)}
                </Text>
              </View>
            </View>
            </View>
          )}
        </View>

        {/* Competitive Intelligence (if available) */}
        {content.competitiveIntelligence && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Competitive Intelligence</Text>
            <View style={styles.card}>
              {/* Direct Competitors */}
              {content.competitiveIntelligence.directCompetitors.length > 0 && (
                <>
                  <Text style={[styles.text, { fontWeight: 600, marginBottom: 8 }]}>
                    Direct Competitors
                  </Text>
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableCellHeader, { flex: 2 }]}>Competitor</Text>
                      <Text style={styles.tableCellHeader}>Unified Score</Text>
                      <Text style={styles.tableCellHeader}>GEO Score</Text>
                      <Text style={styles.tableCellHeader}>Market Share</Text>
                    </View>
                    {content.competitiveIntelligence.directCompetitors.map((comp, idx) => (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{comp.name}</Text>
                        <Text style={styles.tableCell}>{comp.unifiedScore}</Text>
                        <Text style={styles.tableCell}>{comp.geoScore}</Text>
                        <Text style={styles.tableCell}>{comp.marketShare}%</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Competitive Advantages */}
              {content.competitiveIntelligence.competitiveAdvantages.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.text, { fontWeight: 600, marginBottom: 6, color: colors.success }]}>
                    Competitive Advantages
                  </Text>
                  {content.competitiveIntelligence.competitiveAdvantages.map((advantage, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <View style={styles.strengthBullet} />
                      <Text style={[styles.text, { flex: 1 }]}>{advantage}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Threats */}
              {content.competitiveIntelligence.threats.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.text, { fontWeight: 600, marginBottom: 6, color: colors.warning }]}>
                    Competitive Threats
                  </Text>
                  {content.competitiveIntelligence.threats.map((threat, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <View style={styles.riskBullet} />
                      <Text style={[styles.text, { flex: 1 }]}>{threat}</Text>
                    </View>
                  ))}
                </View>
              )}
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

      {/* Page 4: Impact Index Breakdown */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>APEX</Text>
          <Text style={styles.title}>Impact Index Breakdown</Text>
          <Text style={styles.subtitle}>
            {subjectName} | Detailed Component Analysis
          </Text>
        </View>

        {/* Overall Impact Index Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Impact Index</Text>
          <View style={styles.credibilityCard}>
            <Text style={styles.credibilityScore}>
              {content.impactIndexBreakdown.overallScore}
            </Text>
            <Text style={styles.credibilityLabel}>
              Impact Index Score (0-100)
            </Text>
          </View>
        </View>

        {/* Component Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Component Analysis</Text>
          <View style={styles.card}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Component</Text>
                <Text style={styles.tableCellHeader}>Score</Text>
                <Text style={styles.tableCellHeader}>Weight</Text>
              </View>
              {content.impactIndexBreakdown.components.map((component, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{component.name}</Text>
                  <Text style={styles.tableCell}>{component.score}</Text>
                  <Text style={styles.tableCell}>{component.weight}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Component Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Component Details</Text>
          {content.impactIndexBreakdown.components.map((component, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.text, { fontWeight: 600, marginBottom: 4 }]}>
                    {component.name}
                  </Text>
                  <Text style={styles.textSecondary}>
                    Score: {component.score}/100 | Weight: {component.weight}%
                  </Text>
                </View>
              </View>
              <Text style={[styles.textSecondary, { marginTop: 8 }]}>
                {component.rawData}
              </Text>
            </View>
          ))}
        </View>

        {/* Methodology */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calculation Methodology</Text>
          <View style={styles.card}>
            <Text style={styles.text}>
              {content.impactIndexBreakdown.methodology}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Apex | {organizationName}
          </Text>
          <Text style={styles.footerText}>Page 4</Text>
        </View>
      </Page>
    </Document>
  );
};

// Function to generate PDF buffer
export async function generateInvestorReportPDF(
  props: InvestorReportProps
): Promise<Buffer> {
  const buffer = await renderToBuffer(<InvestorReportDocument {...props} />);
  return buffer as Buffer;
}
