import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Audit API Routes (F103-F105)
 * POST /api/audit - Start a new audit crawl
 * GET /api/audit - Get list of audits for brand
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { audits, brands, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { auditRequestSchema } from "@/lib/validations/audit";
import { addAuditJob } from "@/lib/queue";
import { ZodError } from "zod";

/**
 * POST /api/audit - Start a new audit
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request
    const validatedData = auditRequestSchema.parse(body);

    // Get brandId from query or body
    const brandId = request.nextUrl.searchParams.get("brandId") || body.brandId;

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand belongs to user's org
    const brand = await db.query.brands.findFirst({
      where: and(
        eq(brands.id, brandId),
        orgId ? eq(brands.organizationId, orgId) : undefined
      ),
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Normalize URL
    let normalizedUrl = validatedData.url;
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Resolve internal user ID from Clerk user ID
    let internalUserId: string | null = null;
    try {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkUserId, userId),
        columns: { id: true },
      });
      internalUserId = dbUser?.id ?? null;
    } catch {
      // User not in DB yet — audit will proceed without triggeredById
    }

    // Create audit record
    const auditId = createId();
    const now = new Date();
    await db.insert(audits).values({
      id: auditId,
      brandId,
      triggeredById: internalUserId,
      url: normalizedUrl,
      status: "pending",
      startedAt: now,
      metadata: {
        depth: validatedData.depth,
        options: validatedData.options,
        priority: validatedData.priority,
      },
    });

    // Queue the audit job
    const job = await addAuditJob(
      brandId,
      orgId || "",
      normalizedUrl,
      {
        depth: validatedData.depth === "full" ? 3 : validatedData.depth === "section" ? 2 : 1,
        maxPages: validatedData.depth === "full" ? 50 : validatedData.depth === "section" ? 25 : 1,
        priority: validatedData.priority === "high" ? 1 : validatedData.priority === "low" ? 5 : 3,
      }
    );

    // Worker pickup: the cron at /api/cron/audit runs runAuditWorker() every
    // minute (see vercel.json). POST no longer calls setImmediate — that
    // path was lost on every Next.js dev-server restart because the async
    // work was tied to the ephemeral request lifecycle. Cron owns the
    // processing loop now.
    //
    // Dev mode still gets prompt processing because the cron secret is
    // bypassed in NODE_ENV=development (see cron route:18).

    return NextResponse.json({
      success: true,
      auditId,
      jobId: job.id,
      url: normalizedUrl,
      status: "pending",
      message: "Audit queued successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to start audit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/audit - Get audits for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const brandId = request.nextUrl.searchParams.get("brandId");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0", 10);

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand belongs to user's org
    const brand = await db.query.brands.findFirst({
      where: and(
        eq(brands.id, brandId),
        orgId ? eq(brands.organizationId, orgId) : undefined
      ),
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Fetch audits
    const auditsList = await db.query.audits.findMany({
      where: eq(audits.brandId, brandId),
      orderBy: [desc(audits.createdAt)],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      audits: auditsList,
      pagination: {
        limit,
        offset,
        total: auditsList.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch audits",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
