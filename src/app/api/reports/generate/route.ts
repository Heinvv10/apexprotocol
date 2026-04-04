/**
 * Report Generation API
 * POST /api/reports/generate
 * Renders the report page via Puppeteer and returns a PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({})) as { brandId?: string; period?: string };
    const { brandId, period } = body;

    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    // Fetch brand name for filename
    const brandResult = await db
      .select({ name: brands.name, domain: brands.domain })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    const brand = brandResult[0];
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const reportPeriod = period ?? new Date().toISOString().slice(0, 7); // e.g. 2026-03
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3011";
    const reportUrl = `${baseUrl}/report/${brandId}/${reportPeriod}?token=preview${orgId ? `&orgId=${orgId}` : ""}`;

    // Launch Puppeteer
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123 }); // A4 at 96dpi

      await page.goto(reportUrl, {
        waitUntil: "networkidle2",
        timeout: 20000,
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      const brandSlug = brand.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const filename = `apexgeo-report-${brandSlug}-${reportPeriod}.pdf`;

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("[report/generate] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
