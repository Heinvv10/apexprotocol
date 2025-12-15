/**
 * PDF Report Generator (F150)
 * Generate PDF reports for sharing
 *
 * Note: In production, use a library like @react-pdf/renderer or pdfmake
 * This module provides the data structure and HTML template generation
 * that can be converted to PDF via puppeteer or similar
 */

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  brandName: string;
  brandLogo?: string;
  dateRange?: { start: Date; end: Date };
  generatedAt?: Date;
  generatedBy?: string;
  theme?: "light" | "dark";
  includeExecutiveSummary?: boolean;
  includeTOC?: boolean;
  pageSize?: "A4" | "Letter";
  orientation?: "portrait" | "landscape";
}

export interface ReportSection {
  id: string;
  title: string;
  content: ReportContent[];
  pageBreakBefore?: boolean;
}

export type ReportContent =
  | { type: "text"; value: string; style?: "normal" | "bold" | "italic" | "heading" }
  | { type: "metric"; label: string; value: string | number; change?: number; changeType?: "positive" | "negative" | "neutral" }
  | { type: "table"; headers: string[]; rows: (string | number)[][] }
  | { type: "chart"; chartType: "bar" | "line" | "pie" | "gauge"; data: Record<string, unknown>; title?: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "spacer"; size?: "small" | "medium" | "large" }
  | { type: "divider" }
  | { type: "image"; src: string; alt?: string; width?: number }
  | { type: "quote"; text: string; author?: string };

export interface GEOScoreReport {
  currentScore: number;
  previousScore: number;
  change: number;
  breakdown: {
    visibility: number;
    sentiment: number;
    authority: number;
    consistency: number;
  };
  trend: { date: string; score: number }[];
}

export interface MentionsReport {
  total: number;
  byPlatform: Record<string, number>;
  bySentiment: { positive: number; neutral: number; negative: number };
  topQueries: { query: string; count: number }[];
  trend: { date: string; count: number }[];
}

export interface RecommendationsReport {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  byPriority: { critical: number; high: number; medium: number; low: number };
  topRecommendations: { title: string; impact: number; effort: number; status: string }[];
}

export interface AuditReport {
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  authorityScore: number;
  aiReadinessScore: number;
  issuesFound: number;
  criticalIssues: number;
  topIssues: { title: string; severity: string; category: string }[];
}

/**
 * PDF Report Generator Class
 */
export class PDFReportGenerator {
  private options: PDFReportOptions;
  private sections: ReportSection[] = [];

  constructor(options: PDFReportOptions) {
    this.options = {
      generatedAt: new Date(),
      theme: "light",
      includeExecutiveSummary: true,
      includeTOC: true,
      pageSize: "A4",
      orientation: "portrait",
      ...options,
    };
  }

  /**
   * Add a section to the report
   */
  addSection(section: ReportSection): this {
    this.sections.push(section);
    return this;
  }

  /**
   * Add GEO Score section
   */
  addGEOScoreSection(data: GEOScoreReport): this {
    const changeIndicator = data.change >= 0 ? "+" : "";

    this.sections.push({
      id: "geo-score",
      title: "GEO Score Overview",
      content: [
        {
          type: "metric",
          label: "Current GEO Score",
          value: data.currentScore,
          change: data.change,
          changeType: data.change >= 0 ? "positive" : "negative",
        },
        { type: "spacer", size: "medium" },
        {
          type: "text",
          value: `Score changed by ${changeIndicator}${data.change} points from ${data.previousScore}`,
          style: "normal",
        },
        { type: "spacer", size: "medium" },
        { type: "text", value: "Score Breakdown", style: "heading" },
        {
          type: "table",
          headers: ["Component", "Score", "Weight"],
          rows: [
            ["Visibility", data.breakdown.visibility.toString(), "30%"],
            ["Sentiment", data.breakdown.sentiment.toString(), "25%"],
            ["Authority", data.breakdown.authority.toString(), "25%"],
            ["Consistency", data.breakdown.consistency.toString(), "20%"],
          ],
        },
        { type: "spacer", size: "medium" },
        {
          type: "chart",
          chartType: "line",
          title: "Score Trend (30 Days)",
          data: { series: data.trend },
        },
      ],
    });

    return this;
  }

  /**
   * Add Mentions section
   */
  addMentionsSection(data: MentionsReport): this {
    const platformRows = Object.entries(data.byPlatform).map(([platform, count]) => [
      platform,
      count.toString(),
      `${((count / data.total) * 100).toFixed(1)}%`,
    ]);

    this.sections.push({
      id: "mentions",
      title: "AI Platform Mentions",
      content: [
        {
          type: "metric",
          label: "Total Mentions",
          value: data.total,
        },
        { type: "spacer", size: "medium" },
        { type: "text", value: "Mentions by Platform", style: "heading" },
        {
          type: "table",
          headers: ["Platform", "Count", "Share"],
          rows: platformRows,
        },
        { type: "spacer", size: "medium" },
        { type: "text", value: "Sentiment Distribution", style: "heading" },
        {
          type: "chart",
          chartType: "pie",
          title: "Sentiment Breakdown",
          data: {
            positive: data.bySentiment.positive,
            neutral: data.bySentiment.neutral,
            negative: data.bySentiment.negative,
          },
        },
        { type: "spacer", size: "medium" },
        { type: "text", value: "Top Queries", style: "heading" },
        {
          type: "list",
          items: data.topQueries.slice(0, 10).map((q) => `${q.query} (${q.count} mentions)`),
          ordered: true,
        },
      ],
    });

    return this;
  }

  /**
   * Add Recommendations section
   */
  addRecommendationsSection(data: RecommendationsReport): this {
    const completionRate = data.total > 0 ? ((data.completed / data.total) * 100).toFixed(1) : "0";

    this.sections.push({
      id: "recommendations",
      title: "Smart Recommendations",
      content: [
        {
          type: "metric",
          label: "Completion Rate",
          value: `${completionRate}%`,
        },
        { type: "spacer", size: "small" },
        {
          type: "table",
          headers: ["Status", "Count"],
          rows: [
            ["Completed", data.completed.toString()],
            ["In Progress", data.inProgress.toString()],
            ["Pending", data.pending.toString()],
          ],
        },
        { type: "spacer", size: "medium" },
        { type: "text", value: "Priority Distribution", style: "heading" },
        {
          type: "table",
          headers: ["Priority", "Count"],
          rows: [
            ["Critical", data.byPriority.critical.toString()],
            ["High", data.byPriority.high.toString()],
            ["Medium", data.byPriority.medium.toString()],
            ["Low", data.byPriority.low.toString()],
          ],
        },
        { type: "spacer", size: "medium" },
        { type: "text", value: "Top Recommendations", style: "heading" },
        {
          type: "table",
          headers: ["Recommendation", "Impact", "Effort", "Status"],
          rows: data.topRecommendations.slice(0, 10).map((r) => [
            r.title,
            `${r.impact}/10`,
            `${r.effort}/10`,
            r.status,
          ]),
        },
      ],
    });

    return this;
  }

  /**
   * Add Audit section
   */
  addAuditSection(data: AuditReport): this {
    this.sections.push({
      id: "audit",
      title: "Site Audit Results",
      pageBreakBefore: true,
      content: [
        {
          type: "metric",
          label: "Overall Score",
          value: data.overallScore,
        },
        { type: "spacer", size: "medium" },
        { type: "text", value: "Score Breakdown", style: "heading" },
        {
          type: "table",
          headers: ["Category", "Score"],
          rows: [
            ["Technical SEO", `${data.technicalScore}/100`],
            ["Content Quality", `${data.contentScore}/100`],
            ["Authority", `${data.authorityScore}/100`],
            ["AI Readiness", `${data.aiReadinessScore}/100`],
          ],
        },
        { type: "spacer", size: "medium" },
        {
          type: "metric",
          label: "Issues Found",
          value: data.issuesFound,
        },
        {
          type: "metric",
          label: "Critical Issues",
          value: data.criticalIssues,
          changeType: data.criticalIssues > 0 ? "negative" : "positive",
        },
        { type: "spacer", size: "medium" },
        { type: "text", value: "Top Issues to Address", style: "heading" },
        {
          type: "table",
          headers: ["Issue", "Severity", "Category"],
          rows: data.topIssues.slice(0, 10).map((issue) => [
            issue.title,
            issue.severity,
            issue.category,
          ]),
        },
      ],
    });

    return this;
  }

  /**
   * Generate HTML representation (can be converted to PDF)
   */
  generateHTML(): string {
    const theme = this.options.theme === "dark" ? darkThemeCSS : lightThemeCSS;

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.options.title}</title>
  <style>
    ${baseCSS}
    ${theme}
  </style>
</head>
<body>
  <div class="report">
    ${this.generateHeader()}
    ${this.options.includeTOC ? this.generateTOC() : ""}
    ${this.options.includeExecutiveSummary ? this.generateExecutiveSummary() : ""}
    ${this.sections.map((s) => this.generateSection(s)).join("")}
    ${this.generateFooter()}
  </div>
</body>
</html>
`;

    return html;
  }

  /**
   * Generate report data structure (for API response)
   */
  generateReportData(): {
    metadata: PDFReportOptions;
    sections: ReportSection[];
    generatedAt: string;
  } {
    return {
      metadata: this.options,
      sections: this.sections,
      generatedAt: (this.options.generatedAt || new Date()).toISOString(),
    };
  }

  // Private helper methods
  private generateHeader(): string {
    const dateRange = this.options.dateRange
      ? `${this.options.dateRange.start.toLocaleDateString()} - ${this.options.dateRange.end.toLocaleDateString()}`
      : "";

    return `
    <header class="report-header">
      ${this.options.brandLogo ? `<img src="${this.options.brandLogo}" alt="${this.options.brandName}" class="brand-logo" />` : ""}
      <h1 class="report-title">${this.options.title}</h1>
      ${this.options.subtitle ? `<p class="report-subtitle">${this.options.subtitle}</p>` : ""}
      <div class="report-meta">
        <span class="brand-name">${this.options.brandName}</span>
        ${dateRange ? `<span class="date-range">${dateRange}</span>` : ""}
        <span class="generated-date">Generated: ${(this.options.generatedAt || new Date()).toLocaleDateString()}</span>
      </div>
    </header>
    `;
  }

  private generateTOC(): string {
    const items = this.sections
      .map((s, i) => `<li><a href="#${s.id}">${i + 1}. ${s.title}</a></li>`)
      .join("");

    return `
    <nav class="toc">
      <h2>Table of Contents</h2>
      <ol>${items}</ol>
    </nav>
    `;
  }

  private generateExecutiveSummary(): string {
    return `
    <section class="executive-summary">
      <h2>Executive Summary</h2>
      <p>This report provides a comprehensive overview of ${this.options.brandName}'s performance across AI platforms and search engines. Key metrics, recommendations, and insights are detailed in the following sections.</p>
    </section>
    `;
  }

  private generateSection(section: ReportSection): string {
    const content = section.content.map((c) => this.generateContent(c)).join("");

    return `
    <section id="${section.id}" class="report-section ${section.pageBreakBefore ? "page-break" : ""}">
      <h2 class="section-title">${section.title}</h2>
      ${content}
    </section>
    `;
  }

  private generateContent(content: ReportContent): string {
    switch (content.type) {
      case "text":
        const tag = content.style === "heading" ? "h3" : "p";
        const className = content.style || "normal";
        return `<${tag} class="text-${className}">${content.value}</${tag}>`;

      case "metric":
        const changeClass = content.changeType || "neutral";
        const changeDisplay = content.change !== undefined ? `<span class="metric-change ${changeClass}">${content.change >= 0 ? "+" : ""}${content.change}</span>` : "";
        return `
        <div class="metric">
          <span class="metric-label">${content.label}</span>
          <span class="metric-value">${content.value}</span>
          ${changeDisplay}
        </div>
        `;

      case "table":
        const headers = content.headers.map((h) => `<th>${h}</th>`).join("");
        const rows = content.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
        return `
        <table class="data-table">
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
        `;

      case "chart":
        return `
        <div class="chart" data-type="${content.chartType}">
          ${content.title ? `<h4 class="chart-title">${content.title}</h4>` : ""}
          <div class="chart-placeholder">[${content.chartType.toUpperCase()} CHART]</div>
        </div>
        `;

      case "list":
        const tag2 = content.ordered ? "ol" : "ul";
        const items = content.items.map((item) => `<li>${item}</li>`).join("");
        return `<${tag2} class="content-list">${items}</${tag2}>`;

      case "spacer":
        return `<div class="spacer spacer-${content.size || "medium"}"></div>`;

      case "divider":
        return `<hr class="divider" />`;

      case "image":
        return `<img src="${content.src}" alt="${content.alt || ""}" class="content-image" ${content.width ? `width="${content.width}"` : ""} />`;

      case "quote":
        return `
        <blockquote class="content-quote">
          <p>"${content.text}"</p>
          ${content.author ? `<cite>— ${content.author}</cite>` : ""}
        </blockquote>
        `;

      default:
        return "";
    }
  }

  private generateFooter(): string {
    return `
    <footer class="report-footer">
      <p>Generated by Apex GEO/AEO Platform</p>
      <p>${this.options.generatedBy ? `Prepared by: ${this.options.generatedBy}` : ""}</p>
      <p class="confidential">Confidential - For Internal Use Only</p>
    </footer>
    `;
  }
}

// CSS Styles
const baseCSS = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
    font-size: 12pt;
  }
  .report {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px;
  }
  .report-header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e5e5e5;
  }
  .brand-logo {
    max-height: 60px;
    margin-bottom: 20px;
  }
  .report-title {
    font-size: 28pt;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .report-subtitle {
    font-size: 14pt;
    color: #666;
    margin-bottom: 16px;
  }
  .report-meta {
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 10pt;
    color: #888;
  }
  .toc {
    margin-bottom: 40px;
  }
  .toc h2 {
    font-size: 16pt;
    margin-bottom: 16px;
  }
  .toc ol {
    padding-left: 20px;
  }
  .toc li {
    margin-bottom: 8px;
  }
  .toc a {
    color: #4926fa;
    text-decoration: none;
  }
  .executive-summary {
    margin-bottom: 40px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  .report-section {
    margin-bottom: 40px;
  }
  .section-title {
    font-size: 18pt;
    font-weight: 600;
    margin-bottom: 20px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e5e5;
  }
  .metric {
    display: inline-block;
    margin-right: 30px;
    margin-bottom: 16px;
  }
  .metric-label {
    display: block;
    font-size: 10pt;
    color: #666;
    margin-bottom: 4px;
  }
  .metric-value {
    font-size: 24pt;
    font-weight: 700;
    color: #4926fa;
  }
  .metric-change {
    display: block;
    font-size: 10pt;
    margin-top: 4px;
  }
  .metric-change.positive { color: #17ca29; }
  .metric-change.negative { color: #d4292a; }
  .metric-change.neutral { color: #666; }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }
  .data-table th,
  .data-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #e5e5e5;
  }
  .data-table th {
    font-weight: 600;
    background: #f8f9fa;
  }
  .chart {
    margin: 20px 0;
    padding: 20px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
  }
  .chart-title {
    font-size: 12pt;
    margin-bottom: 12px;
  }
  .chart-placeholder {
    text-align: center;
    padding: 40px;
    color: #888;
    background: #f8f9fa;
    border-radius: 4px;
  }
  .content-list {
    padding-left: 24px;
    margin: 16px 0;
  }
  .content-list li {
    margin-bottom: 8px;
  }
  .spacer-small { height: 8px; }
  .spacer-medium { height: 16px; }
  .spacer-large { height: 32px; }
  .divider {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 20px 0;
  }
  .content-quote {
    padding: 16px 24px;
    border-left: 4px solid #4926fa;
    background: #f8f9fa;
    margin: 16px 0;
    font-style: italic;
  }
  .content-quote cite {
    display: block;
    margin-top: 8px;
    font-size: 10pt;
    color: #666;
    font-style: normal;
  }
  .report-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #e5e5e5;
    text-align: center;
    font-size: 10pt;
    color: #888;
  }
  .confidential {
    margin-top: 8px;
    font-weight: 600;
    color: #d4292a;
  }
  .page-break {
    page-break-before: always;
  }
  @media print {
    .report { padding: 0; }
    .page-break { page-break-before: always; }
  }
`;

const lightThemeCSS = `
  body { background: #fff; color: #1a1a1a; }
`;

const darkThemeCSS = `
  body { background: #0a0a0b; color: #e5e5e5; }
  .report-header { border-bottom-color: #27272a; }
  .executive-summary { background: #18181b; }
  .section-title { border-bottom-color: #27272a; }
  .metric-value { color: #4926fa; }
  .data-table th { background: #18181b; }
  .data-table th, .data-table td { border-bottom-color: #27272a; }
  .chart { border-color: #27272a; }
  .chart-placeholder { background: #18181b; }
  .divider { border-top-color: #27272a; }
  .content-quote { background: #18181b; }
  .report-footer { border-top-color: #27272a; }
`;

// Export helper
export function createPDFReport(options: PDFReportOptions): PDFReportGenerator {
  return new PDFReportGenerator(options);
}
