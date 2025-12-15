/**
 * CSV Export Generator (F149)
 * Export mentions, audits, recommendations as CSV
 */

export interface CSVExportOptions {
  filename?: string;
  delimiter?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  nullValue?: string;
  quoteAll?: boolean;
}

export type CSVRow = Record<string, string | number | boolean | null | undefined | Date>;

/**
 * CSV Generator Class
 */
export class CSVGenerator {
  private options: Required<CSVExportOptions>;

  constructor(options: CSVExportOptions = {}) {
    this.options = {
      filename: options.filename || "export.csv",
      delimiter: options.delimiter || ",",
      includeHeaders: options.includeHeaders !== false,
      dateFormat: options.dateFormat || "ISO",
      nullValue: options.nullValue || "",
      quoteAll: options.quoteAll || false,
    };
  }

  /**
   * Generate CSV string from data
   */
  generate(data: CSVRow[], columns?: string[]): string {
    if (data.length === 0) {
      return "";
    }

    // Determine columns from first row if not provided
    const headers = columns || Object.keys(data[0]);
    const lines: string[] = [];

    // Add header row
    if (this.options.includeHeaders) {
      lines.push(headers.map((h) => this.escapeField(h)).join(this.options.delimiter));
    }

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        return this.escapeField(this.formatValue(value));
      });
      lines.push(values.join(this.options.delimiter));
    }

    return lines.join("\n");
  }

  /**
   * Generate CSV with BOM for Excel compatibility
   */
  generateWithBOM(data: CSVRow[], columns?: string[]): string {
    const BOM = "\uFEFF"; // UTF-8 BOM
    return BOM + this.generate(data, columns);
  }

  /**
   * Generate CSV as Uint8Array (for streaming/downloads)
   */
  generateBytes(data: CSVRow[], columns?: string[]): Uint8Array {
    const csv = this.generateWithBOM(data, columns);
    return new TextEncoder().encode(csv);
  }

  /**
   * Format value based on type
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return this.options.nullValue;
    }

    if (value instanceof Date) {
      return this.formatDate(value);
    }

    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }

    if (typeof value === "number") {
      return value.toString();
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Format date based on options
   */
  private formatDate(date: Date): string {
    switch (this.options.dateFormat) {
      case "ISO":
        return date.toISOString();
      case "DATE_ONLY":
        return date.toISOString().split("T")[0];
      case "DATETIME":
        return date.toISOString().replace("T", " ").replace("Z", "");
      case "TIMESTAMP":
        return date.getTime().toString();
      default:
        return date.toISOString();
    }
  }

  /**
   * Escape field for CSV
   */
  private escapeField(value: string): string {
    const needsQuoting =
      this.options.quoteAll ||
      value.includes(this.options.delimiter) ||
      value.includes('"') ||
      value.includes("\n") ||
      value.includes("\r");

    if (needsQuoting) {
      // Escape double quotes by doubling them
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return value;
  }
}

// Pre-configured exporters for different data types
export const MentionsCSV = {
  columns: [
    "id",
    "brandId",
    "platform",
    "query",
    "response",
    "sentiment",
    "sentimentScore",
    "position",
    "citationUrl",
    "mentioned",
    "createdAt",
  ],

  generate(mentions: CSVRow[]): string {
    const generator = new CSVGenerator({
      filename: "mentions_export.csv",
      dateFormat: "DATETIME",
    });
    return generator.generate(mentions, this.columns);
  },

  generateBytes(mentions: CSVRow[]): Uint8Array {
    const generator = new CSVGenerator({
      filename: "mentions_export.csv",
      dateFormat: "DATETIME",
    });
    return generator.generateBytes(mentions, this.columns);
  },
};

export const AuditsCSV = {
  columns: [
    "id",
    "brandId",
    "url",
    "status",
    "overallScore",
    "technicalScore",
    "contentScore",
    "authorityScore",
    "aiReadinessScore",
    "pagesScanned",
    "issuesFound",
    "criticalIssues",
    "startedAt",
    "completedAt",
  ],

  generate(audits: CSVRow[]): string {
    const generator = new CSVGenerator({
      filename: "audits_export.csv",
      dateFormat: "DATETIME",
    });
    return generator.generate(audits, this.columns);
  },

  generateBytes(audits: CSVRow[]): Uint8Array {
    const generator = new CSVGenerator({
      filename: "audits_export.csv",
      dateFormat: "DATETIME",
    });
    return generator.generateBytes(audits, this.columns);
  },
};

export const RecommendationsCSV = {
  columns: [
    "id",
    "brandId",
    "title",
    "description",
    "category",
    "priority",
    "status",
    "impact",
    "effort",
    "score",
    "sourceType",
    "sourceId",
    "dueDate",
    "assignedTo",
    "createdAt",
    "completedAt",
  ],

  generate(recommendations: CSVRow[]): string {
    const generator = new CSVGenerator({
      filename: "recommendations_export.csv",
      dateFormat: "DATETIME",
    });
    return generator.generate(recommendations, this.columns);
  },

  generateBytes(recommendations: CSVRow[]): Uint8Array {
    const generator = new CSVGenerator({
      filename: "recommendations_export.csv",
      dateFormat: "DATETIME",
    });
    return generator.generateBytes(recommendations, this.columns);
  },
};

export const AnalyticsCSV = {
  columns: [
    "date",
    "brandId",
    "geoScore",
    "totalMentions",
    "positiveMentions",
    "neutralMentions",
    "negativeMentions",
    "avgSentiment",
    "avgPosition",
    "citationRate",
    "platformBreakdown",
  ],

  generate(analytics: CSVRow[]): string {
    const generator = new CSVGenerator({
      filename: "analytics_export.csv",
      dateFormat: "DATE_ONLY",
    });
    return generator.generate(analytics, this.columns);
  },

  generateBytes(analytics: CSVRow[]): Uint8Array {
    const generator = new CSVGenerator({
      filename: "analytics_export.csv",
      dateFormat: "DATE_ONLY",
    });
    return generator.generateBytes(analytics, this.columns);
  },
};

// Helper function to create CSV response
export function createCSVResponse(
  data: Uint8Array | string,
  filename: string
): Response {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  // Create a new ArrayBuffer from the bytes to ensure compatibility
  const buffer = new ArrayBuffer(bytes.length);
  const view = new Uint8Array(buffer);
  view.set(bytes);
  const blob = new Blob([buffer], { type: "text/csv; charset=utf-8" });

  return new Response(blob, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": bytes.length.toString(),
    },
  });
}

// Generic CSV export function
export function generateCSV(
  data: CSVRow[],
  options?: CSVExportOptions & { columns?: string[] }
): string {
  const generator = new CSVGenerator(options);
  return generator.generate(data, options?.columns);
}
