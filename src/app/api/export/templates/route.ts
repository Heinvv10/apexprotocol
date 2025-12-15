/**
 * Export Templates API Route (F177)
 * Manage report templates
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

// In-memory template storage
const templates = new Map<string, ReportTemplate>();

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
  format: string;
  sections: string[];
  isDefault: boolean;
}

// Initialize with default templates
const defaultTemplates: ReportTemplate[] = [
  {
    id: "executive-summary",
    name: "Executive Summary",
    description: "High-level overview for stakeholders",
    dataTypes: ["analytics", "mentions"],
    format: "pdf",
    sections: ["overview", "kpis", "trends", "recommendations"],
    isDefault: true,
  },
  {
    id: "audit-comprehensive",
    name: "Comprehensive Audit Report",
    description: "Detailed technical audit findings",
    dataTypes: ["audits"],
    format: "pdf",
    sections: ["scores", "issues", "recommendations", "technical-details"],
    isDefault: true,
  },
  {
    id: "mention-analysis",
    name: "Mention Analysis Report",
    description: "AI platform mention analysis",
    dataTypes: ["mentions", "analytics"],
    format: "csv",
    sections: ["platform-breakdown", "sentiment", "trends"],
    isDefault: true,
  },
  {
    id: "competitor-comparison",
    name: "Competitor Comparison",
    description: "Side-by-side competitor analysis",
    dataTypes: ["competitors", "mentions"],
    format: "pdf",
    sections: ["visibility-scores", "sentiment-comparison", "share-of-voice"],
    isDefault: true,
  },
];

// Load default templates
for (const template of defaultTemplates) {
  templates.set(template.id, template);
}

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  dataTypes: z.array(z.string()),
  format: z.enum(["csv", "pdf", "xlsx", "json"]),
  sections: z.array(z.string()),
  isDefault: z.boolean().optional(),
});

/**
 * GET /api/export/templates
 * List available report templates
 */
export async function GET() {
  try {
    const templateList = Array.from(templates.values());

    return NextResponse.json({
      success: true,
      templates: templateList,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/export/templates
 * Create a new report template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = templateSchema.parse(body);

    const template: ReportTemplate = {
      id: createId(),
      ...params,
      isDefault: params.isDefault || false,
    };

    templates.set(template.id, template);

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid template data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create template" },
      { status: 500 }
    );
  }
}
