/**
 * XLSX Export Generator (F149)
 * Export mentions, audits, recommendations, analytics as Excel files
 *
 * Uses SpreadsheetML XML format which Excel can open natively.
 * This approach avoids external dependencies while maintaining Excel compatibility.
 */

export interface XLSXExportOptions {
  filename?: string;
  sheetName?: string;
  dateFormat?: string;
  includeHeaders?: boolean;
}

export type XLSXRow = Record<string, string | number | boolean | null | undefined | Date>;

/**
 * XLSX Generator Class using SpreadsheetML XML format
 */
export class XLSXGenerator {
  private options: Required<XLSXExportOptions>;

  constructor(options: XLSXExportOptions = {}) {
    this.options = {
      filename: options.filename || "export.xlsx",
      sheetName: options.sheetName || "Sheet1",
      dateFormat: options.dateFormat || "ISO",
      includeHeaders: options.includeHeaders !== false,
    };
  }

  /**
   * Generate SpreadsheetML XML that Excel can open
   */
  generate(data: XLSXRow[], columns?: string[]): string {
    if (data.length === 0) {
      return this.generateEmptyWorkbook();
    }

    // Determine columns from first row if not provided
    const headers = columns || Object.keys(data[0]);

    // Start XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>Apex Export</Title>
    <Author>Apex GEO/AEO Platform</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom"/>
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
      <Interior ss:Color="#4F81BD" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF"/>
    </Style>
    <Style ss:ID="Number">
      <NumberFormat ss:Format="Standard"/>
    </Style>
    <Style ss:ID="Date">
      <NumberFormat ss:Format="yyyy-mm-dd hh:mm:ss"/>
    </Style>
    <Style ss:ID="Percent">
      <NumberFormat ss:Format="Percent"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${this.escapeXml(this.options.sheetName)}">
    <Table ss:ExpandedColumnCount="${headers.length}" ss:ExpandedRowCount="${data.length + (this.options.includeHeaders ? 1 : 0)}">
`;

    // Add column definitions
    for (let i = 0; i < headers.length; i++) {
      xml += `      <Column ss:Index="${i + 1}" ss:AutoFitWidth="1" ss:Width="100"/>\n`;
    }

    // Add header row
    if (this.options.includeHeaders) {
      xml += `      <Row ss:StyleID="Header">\n`;
      for (const header of headers) {
        xml += `        <Cell><Data ss:Type="String">${this.escapeXml(this.formatHeader(header))}</Data></Cell>\n`;
      }
      xml += `      </Row>\n`;
    }

    // Add data rows
    for (const row of data) {
      xml += `      <Row>\n`;
      for (const header of headers) {
        const value = row[header];
        const { type, formattedValue, styleId } = this.formatCell(value);
        const styleAttr = styleId ? ` ss:StyleID="${styleId}"` : "";
        xml += `        <Cell${styleAttr}><Data ss:Type="${type}">${formattedValue}</Data></Cell>\n`;
      }
      xml += `      </Row>\n`;
    }

    // Close tags
    xml += `    </Table>
  </Worksheet>
</Workbook>`;

    return xml;
  }

  /**
   * Generate empty workbook
   */
  private generateEmptyWorkbook(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${this.escapeXml(this.options.sheetName)}">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">No data available</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`;
  }

  /**
   * Format header for display (camelCase to Title Case)
   */
  private formatHeader(header: string): string {
    return header
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Format cell value and determine type
   */
  private formatCell(value: unknown): { type: string; formattedValue: string; styleId?: string } {
    if (value === null || value === undefined) {
      return { type: "String", formattedValue: "" };
    }

    if (value instanceof Date) {
      return {
        type: "DateTime",
        formattedValue: value.toISOString(),
        styleId: "Date",
      };
    }

    if (typeof value === "number") {
      return {
        type: "Number",
        formattedValue: value.toString(),
        styleId: "Number",
      };
    }

    if (typeof value === "boolean") {
      return {
        type: "Boolean",
        formattedValue: value ? "1" : "0",
      };
    }

    // Check if string looks like a percentage
    const strValue = String(value);
    if (strValue.endsWith("%")) {
      const numValue = parseFloat(strValue);
      if (!isNaN(numValue)) {
        return {
          type: "Number",
          formattedValue: (numValue / 100).toString(),
          styleId: "Percent",
        };
      }
    }

    // Check if string is a date
    if (typeof value === "string" && this.isISODate(value)) {
      return {
        type: "DateTime",
        formattedValue: value,
        styleId: "Date",
      };
    }

    // Check if string is a number
    if (typeof value === "string" && !isNaN(Number(value)) && value.trim() !== "") {
      return {
        type: "Number",
        formattedValue: value,
        styleId: "Number",
      };
    }

    // Default to string
    return {
      type: "String",
      formattedValue: this.escapeXml(strValue),
    };
  }

  /**
   * Check if string is ISO date format
   */
  private isISODate(value: string): boolean {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    return isoDateRegex.test(value);
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}

// Pre-configured exporters for different data types

export const MentionsXLSX = {
  columns: [
    "id",
    "brandId",
    "platform",
    "query",
    "response",
    "sentiment",
    "position",
    "citationUrl",
    "mentioned",
    "timestamp",
    "createdAt",
  ],

  generate(mentions: XLSXRow[]): string {
    const generator = new XLSXGenerator({
      filename: "mentions_export.xlsx",
      sheetName: "Brand Mentions",
    });
    return generator.generate(mentions, this.columns);
  },
};

export const AuditsXLSX = {
  columns: [
    "id",
    "brandId",
    "url",
    "status",
    "overallScore",
    "issueCount",
    "criticalCount",
    "highCount",
    "mediumCount",
    "lowCount",
    "startedAt",
    "completedAt",
    "createdAt",
  ],

  generate(audits: XLSXRow[]): string {
    const generator = new XLSXGenerator({
      filename: "audits_export.xlsx",
      sheetName: "Site Audits",
    });
    return generator.generate(audits, this.columns);
  },
};

export const RecommendationsXLSX = {
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
    "source",
    "estimatedTime",
    "dueDate",
    "createdAt",
    "completedAt",
  ],

  generate(recommendations: XLSXRow[]): string {
    const generator = new XLSXGenerator({
      filename: "recommendations_export.xlsx",
      sheetName: "Recommendations",
    });
    return generator.generate(recommendations, this.columns);
  },
};

export const AnalyticsXLSX = {
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

  generate(analytics: XLSXRow[]): string {
    const generator = new XLSXGenerator({
      filename: "analytics_export.xlsx",
      sheetName: "Analytics",
    });
    return generator.generate(analytics, this.columns);
  },
};

// Helper function to create XLSX response
export function createXLSXResponse(
  data: string,
  filename: string
): Response {
  const bytes = new TextEncoder().encode(data);

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": bytes.length.toString(),
    },
  });
}

// Generic XLSX export function
export function generateXLSX(
  data: XLSXRow[],
  options?: XLSXExportOptions & { columns?: string[] }
): string {
  const generator = new XLSXGenerator(options);
  return generator.generate(data, options?.columns);
}
