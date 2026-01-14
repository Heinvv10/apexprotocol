/**
 * Citation Conversions API
 * GET /api/citation-roi/conversions - List conversions for a brand
 * POST /api/citation-roi/conversions - Record a new conversion
 *
 * Phase 15: AI Citation ROI Calculator
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth";
import { db } from "@/lib/db";
import { citationConversions, brands, brandMentions } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { z } from "zod";

// Validation schema for creating a conversion
const createConversionSchema = z.object({
  brandId: z.string().min(1),
  mentionId: z.string().optional(),
  sourcePlatform: z.string().min(1),
  visitorSessionId: z.string().optional(),
  landingPage: z.string().url().optional(),
  referrerUrl: z.string().url().optional(),
  conversionType: z.enum([
    "signup",
    "purchase",
    "contact",
    "download",
    "demo_request",
    "newsletter",
    "free_trial",
    "custom",
  ]),
  conversionValue: z.number().min(0).optional().default(0),
  currency: z.string().length(3).optional().default("USD"),
  attributionConfidence: z.number().min(0).max(1).optional().default(0.5),
  attributionModel: z
    .enum(["first_touch", "last_touch", "linear", "time_decay", "position_based"])
    .optional()
    .default("last_touch"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const platform = searchParams.get("platform");
    const conversionType = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const sortBy = searchParams.get("sortBy") || "convertedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Verify brand belongs to user's organization
    const [brand] = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, brandId),
          eq(brands.organizationId, orgId || userId)
        )
      )
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Build query conditions
    const conditions = [eq(citationConversions.brandId, brandId)];

    if (platform) {
      conditions.push(eq(citationConversions.sourcePlatform, platform));
    }

    if (conversionType) {
      conditions.push(
        sql`${citationConversions.conversionType} = ${conversionType}`
      );
    }

    if (startDate) {
      conditions.push(gte(citationConversions.convertedAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(citationConversions.convertedAt, new Date(endDate)));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(citationConversions)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    // Get conversions with pagination
    const offset = (page - 1) * limit;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const conversions = await db
      .select({
        id: citationConversions.id,
        brandId: citationConversions.brandId,
        mentionId: citationConversions.mentionId,
        sourcePlatform: citationConversions.sourcePlatform,
        visitorSessionId: citationConversions.visitorSessionId,
        landingPage: citationConversions.landingPage,
        referrerUrl: citationConversions.referrerUrl,
        conversionType: citationConversions.conversionType,
        conversionValue: citationConversions.conversionValue,
        currency: citationConversions.currency,
        attributionConfidence: citationConversions.attributionConfidence,
        attributionModel: citationConversions.attributionModel,
        metadata: citationConversions.metadata,
        convertedAt: citationConversions.convertedAt,
        createdAt: citationConversions.createdAt,
      })
      .from(citationConversions)
      .where(and(...conditions))
      .orderBy(
        sortBy === "value"
          ? orderFn(citationConversions.conversionValue)
          : orderFn(citationConversions.convertedAt)
      )
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: {
        conversions: conversions.map((c) => ({
          ...c,
          conversionValue: parseFloat(c.conversionValue || "0"),
          attributionConfidence: parseFloat(c.attributionConfidence || "0.5"),
          convertedAt: c.convertedAt.toISOString(),
          createdAt: c.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[Citation Conversions GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createConversionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify brand belongs to user's organization
    const [brand] = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, data.brandId),
          eq(brands.organizationId, orgId || userId)
        )
      )
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Verify mention exists if provided
    if (data.mentionId) {
      const [mention] = await db
        .select()
        .from(brandMentions)
        .where(
          and(
            eq(brandMentions.id, data.mentionId),
            eq(brandMentions.brandId, data.brandId)
          )
        )
        .limit(1);

      if (!mention) {
        return NextResponse.json(
          { error: "Mention not found for this brand" },
          { status: 404 }
        );
      }
    }

    // Create conversion
    const [conversion] = await db
      .insert(citationConversions)
      .values({
        brandId: data.brandId,
        mentionId: data.mentionId || null,
        sourcePlatform: data.sourcePlatform,
        visitorSessionId: data.visitorSessionId || null,
        landingPage: data.landingPage || null,
        referrerUrl: data.referrerUrl || null,
        conversionType: data.conversionType,
        conversionValue: data.conversionValue.toString(),
        currency: data.currency,
        attributionConfidence: data.attributionConfidence.toString(),
        attributionModel: data.attributionModel,
        metadata: data.metadata || {},
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        ...conversion,
        conversionValue: parseFloat(conversion.conversionValue || "0"),
        attributionConfidence: parseFloat(conversion.attributionConfidence || "0.5"),
        convertedAt: conversion.convertedAt.toISOString(),
        createdAt: conversion.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Citation Conversions POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to create conversion" },
      { status: 500 }
    );
  }
}
