/**
 * Recommendation Templates API (F112)
 * GET /api/recommendations/templates - List templates
 * POST /api/recommendations/templates - Create template or render from template
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  templateRegistry,
  renderTemplate,
  findMatchingTemplate,
  createTemplateFromRecommendation,
  type RecommendationTemplate,
} from "@/lib/recommendations";
import type { RecommendationCategory, RecommendationSource } from "@/lib/recommendations/types";

// Request schemas
const renderTemplateSchema = z.object({
  templateId: z.string().min(1),
  variables: z.record(z.string(), z.unknown()),
  brandId: z.string().min(1),
  urgency: z.number().min(0).max(100).optional(),
  confidence: z.number().min(0).max(100).optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["schema", "content", "technical", "seo", "voice", "entity", "qa"]),
  source: z.enum(["monitor", "audit", "content", "schema", "entity", "voice", "qa"]),
  titleTemplate: z.string().min(1),
  descriptionTemplate: z.string().min(1),
  impactLevel: z.enum(["high", "medium", "low"]),
  effortLevel: z.enum(["quick", "moderate", "substantial", "major"]),
  variables: z.array(
    z.object({
      name: z.string(),
      required: z.boolean(),
      type: z.enum(["string", "number", "url", "date"]),
      description: z.string().optional(),
    })
  ),
  tags: z.array(z.string()).optional(),
});

const findTemplateSchema = z.object({
  category: z.string().optional(),
  source: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Get templates
    let templates: RecommendationTemplate[];
    if (category) {
      templates = templateRegistry.getTemplatesByCategory(category as RecommendationCategory);
    } else {
      templates = templateRegistry.getAllTemplates();
    }

    // Group by category
    interface TemplateSummary {
      id: string;
      name: string;
      source: string;
      impactLevel: number;
      effortLevel: number;
      variableCount: number;
      tags: string[];
    }
    const grouped = templates.reduce(
      (acc, template) => {
        if (!acc[template.category]) {
          acc[template.category] = [];
        }
        acc[template.category].push({
          id: template.id,
          name: template.name,
          source: template.source,
          impactLevel: template.defaultImpact,
          effortLevel: template.defaultEffort,
          variableCount: template.variables.length,
          tags: template.metadata.tags,
        });
        return acc;
      },
      {} as Record<string, TemplateSummary[]>
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalTemplates: templates.length,
        categories: Object.keys(grouped).length,
      },
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        source: t.source,
        impactLevel: t.defaultImpact,
        effortLevel: t.defaultEffort,
        variables: t.variables,
        tags: t.metadata.tags,
      })),
      grouped,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch templates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action || "render";

    switch (action) {
      case "render":
        return handleRenderTemplate(body);

      case "create":
        return handleCreateTemplate(body);

      case "find":
        return handleFindTemplate(body);

      case "fromRecommendation":
        return handleCreateFromRecommendation(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: render, create, find, or fromRecommendation" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Template operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleRenderTemplate(body: unknown) {
  const { templateId, variables, brandId, urgency, confidence } = renderTemplateSchema.parse(body);

  const template = templateRegistry.getTemplate(templateId);
  if (!template) {
    return NextResponse.json(
      { error: "Template not found", templateId },
      { status: 404 }
    );
  }

  const recommendation = renderTemplate(template, variables, { brandId, urgency, confidence });

  return NextResponse.json({
    success: true,
    template: {
      id: template.id,
      name: template.name,
    },
    recommendation: {
      id: recommendation.id,
      title: recommendation.title,
      description: recommendation.description,
      category: recommendation.category,
      priority: recommendation.priority,
      impact: recommendation.impact,
      effort: recommendation.effort,
      actionItems: recommendation.actionItems,
      metadata: recommendation.metadata,
    },
    variablesUsed: variables,
  });
}

async function handleCreateTemplate(body: unknown) {
  const templateData = createTemplateSchema.parse(body);

  // Generate ID
  const id = `custom_${templateData.name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;

  // Map effort level to numeric score
  const effortScore = templateData.effortLevel === "quick" ? 20
    : templateData.effortLevel === "moderate" ? 40
    : templateData.effortLevel === "substantial" ? 60
    : 80;

  // Map impact level to numeric score
  const impactScore = templateData.impactLevel === "high" ? 80
    : templateData.impactLevel === "medium" ? 50
    : 20;

  // Map impact level to priority
  const priorityMap: Record<string, "critical" | "high" | "medium" | "low"> = {
    high: "high",
    medium: "medium",
    low: "low",
  };

  const template: RecommendationTemplate = {
    id,
    name: templateData.name,
    category: templateData.category,
    source: templateData.source,
    titleTemplate: templateData.titleTemplate,
    descriptionTemplate: templateData.descriptionTemplate,
    defaultPriority: priorityMap[templateData.impactLevel] || "medium",
    defaultImpact: impactScore,
    defaultEffort: effortScore,
    actionItemTemplates: [],
    variables: templateData.variables.map((v, index) => ({
      name: v.name,
      type: v.type === "url" || v.type === "date" ? "string" : v.type,
      required: v.required,
      description: v.description || "",
    })),
    metadata: {
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      tags: templateData.tags || [],
    },
  };

  templateRegistry.registerTemplate(template);

  return NextResponse.json({
    success: true,
    message: "Template created successfully",
    template: {
      id: template.id,
      name: template.name,
      category: template.category,
      source: template.source,
      variableCount: template.variables.length,
    },
  });
}

async function handleFindTemplate(body: unknown) {
  const { category, source, context } = findTemplateSchema.parse(body);

  const matchingTemplate = findMatchingTemplate(templateRegistry, {
    category: category as RecommendationCategory | undefined,
    source: source as RecommendationSource | undefined,
    ...((context || {}) as { tags?: string[]; issueType?: string }),
  });

  if (!matchingTemplate) {
    return NextResponse.json({
      success: true,
      found: false,
      message: "No matching template found",
    });
  }

  return NextResponse.json({
    success: true,
    found: true,
    template: {
      id: matchingTemplate.id,
      name: matchingTemplate.name,
      category: matchingTemplate.category,
      source: matchingTemplate.source,
      variables: matchingTemplate.variables,
    },
  });
}

async function handleCreateFromRecommendation(body: unknown) {
  const schema = z.object({
    recommendation: z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      priority: z.string(),
    }),
    name: z.string(),
    variables: z.array(z.string()),
  });

  const { recommendation, name, variables } = schema.parse(body);

  const template = createTemplateFromRecommendation(
    recommendation,
    name,
    variables
  );

  templateRegistry.registerTemplate(template);

  return NextResponse.json({
    success: true,
    message: "Template created from recommendation",
    template: {
      id: template.id,
      name: template.name,
      category: template.category,
      titleTemplate: template.titleTemplate,
      descriptionTemplate: template.descriptionTemplate,
      variables: template.variables,
    },
  });
}
