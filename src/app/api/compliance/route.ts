/**
 * Compliance API Route (F145)
 * POPIA/GDPR compliance checking endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  runComplianceCheck,
  ComplianceChecker,
  COMPLIANCE_CHECKS,
  GDPR_ADEQUATE_COUNTRIES,
  type OrganizationComplianceConfig,
  type ComplianceFramework,
} from "@/lib/compliance";

// Request validation schema
const complianceConfigSchema = z.object({
  frameworks: z
    .array(z.enum(["gdpr", "popia", "ccpa", "lgpd"]))
    .min(1, "At least one framework required"),
  dataTypes: z.array(z.string()).default([]),
  hasLegalBasis: z.boolean().default(false),
  hasConsentMechanism: z.boolean().default(false),
  hasPrivacyNotice: z.boolean().default(false),
  hasCookieConsent: z.boolean().default(false),
  hasBreachProcedure: z.boolean().default(false),
  hasDPO: z.boolean().default(false),
  dataRetentionPolicyDays: z.number().min(0).default(0),
  crossBorderTransfers: z.boolean().default(false),
  transferDestinations: z.array(z.string()).default([]),
});

/**
 * GET /api/compliance - Get compliance checks list or quick summary
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Get available compliance checks
    if (action === "checks") {
      const framework = searchParams.get("framework") as ComplianceFramework | null;

      const checks = framework
        ? COMPLIANCE_CHECKS.filter((c) => c.frameworks.includes(framework))
        : COMPLIANCE_CHECKS;

      return NextResponse.json({
        success: true,
        data: {
          total: checks.length,
          byCategory: groupByCategory(checks),
          byFramework: groupByFramework(checks),
          checks: checks.map((c) => ({
            id: c.id,
            name: c.name,
            category: c.category,
            frameworks: c.frameworks,
            severity: c.severity,
          })),
        },
      });
    }

    // Get adequate countries list
    if (action === "countries") {
      return NextResponse.json({
        success: true,
        data: {
          adequateCountries: GDPR_ADEQUATE_COUNTRIES,
          total: GDPR_ADEQUATE_COUNTRIES.length,
        },
      });
    }

    // Get available frameworks
    if (action === "frameworks") {
      return NextResponse.json({
        success: true,
        data: {
          frameworks: [
            {
              id: "gdpr",
              name: "GDPR",
              fullName: "General Data Protection Regulation",
              region: "European Union",
              description: "EU regulation on data protection and privacy",
            },
            {
              id: "popia",
              name: "POPIA",
              fullName: "Protection of Personal Information Act",
              region: "South Africa",
              description: "South African data protection legislation",
            },
            {
              id: "ccpa",
              name: "CCPA",
              fullName: "California Consumer Privacy Act",
              region: "California, USA",
              description: "California state privacy law",
            },
            {
              id: "lgpd",
              name: "LGPD",
              fullName: "Lei Geral de Proteção de Dados",
              region: "Brazil",
              description: "Brazilian data protection law",
            },
          ],
        },
      });
    }

    // Default: return API info
    return NextResponse.json({
      success: true,
      data: {
        endpoints: [
          {
            method: "GET",
            path: "/api/compliance?action=checks",
            description: "Get list of compliance checks",
          },
          {
            method: "GET",
            path: "/api/compliance?action=checks&framework=gdpr",
            description: "Get checks for specific framework",
          },
          {
            method: "GET",
            path: "/api/compliance?action=countries",
            description: "Get list of GDPR-adequate countries",
          },
          {
            method: "GET",
            path: "/api/compliance?action=frameworks",
            description: "Get available compliance frameworks",
          },
          {
            method: "POST",
            path: "/api/compliance",
            description: "Run compliance check",
          },
          {
            method: "POST",
            path: "/api/compliance?action=summary",
            description: "Get quick compliance summary",
          },
        ],
      },
    });
  } catch (error) {
    console.error("Compliance GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/compliance - Run compliance check
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Validate request body
    const validationResult = complianceConfigSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const config: OrganizationComplianceConfig = {
      organizationId: orgId || userId,
      ...validationResult.data,
    };

    // Quick summary
    if (action === "summary") {
      const checker = new ComplianceChecker(config);
      const summary = checker.getSummary();

      return NextResponse.json({
        success: true,
        data: summary,
      });
    }

    // Full compliance report
    const report = runComplianceCheck(config);

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        organizationId: report.organizationId,
        frameworks: report.frameworks,
        generatedAt: report.generatedAt.toISOString(),
        summary: {
          overallScore: report.overallScore,
          isCompliant: report.criticalIssues === 0 && report.overallScore >= 80,
          issues: {
            critical: report.criticalIssues,
            high: report.highIssues,
            medium: report.mediumIssues,
            low: report.lowIssues,
          },
        },
        scoreByCategory: report.scoreByCategory,
        scoreByFramework: report.scoreByFramework,
        results: report.results.map((r) => ({
          checkId: r.checkId,
          status: r.status,
          message: r.message,
          details: r.details,
        })),
        recommendations: report.recommendations.slice(0, 10).map((r) => ({
          checkId: r.checkId,
          category: r.category,
          severity: r.severity,
          title: r.title,
          description: r.description,
          remediation: r.remediation,
          estimatedEffort: r.estimatedEffort,
          deadline: r.deadline?.toISOString(),
        })),
        totalRecommendations: report.recommendations.length,
      },
    });
  } catch (error) {
    console.error("Compliance POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper functions
function groupByCategory(checks: typeof COMPLIANCE_CHECKS) {
  const grouped: Record<string, number> = {};
  for (const check of checks) {
    grouped[check.category] = (grouped[check.category] || 0) + 1;
  }
  return grouped;
}

function groupByFramework(checks: typeof COMPLIANCE_CHECKS) {
  const grouped: Record<string, number> = {};
  for (const check of checks) {
    for (const framework of check.frameworks) {
      grouped[framework] = (grouped[framework] || 0) + 1;
    }
  }
  return grouped;
}
