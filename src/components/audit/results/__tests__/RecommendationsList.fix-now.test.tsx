/**
 * @vitest-environment jsdom
 *
 * Regression guard for the "Fix Now" dead-end bug (2026-04-24):
 * every recommendation's Fix Now button MUST point at /dashboard/create/generate
 * (not /dashboard/create) and MUST carry a JSON-encoded context payload that
 * GenerateContentForm consumes to pre-fill.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecommendationsList } from "../RecommendationsList";
import type { Audit } from "@/hooks/useAudit";

const FIXTURE_AUDIT: Audit = {
  id: "test-audit",
  brandId: "brand-1",
  url: "https://crankmart.com",
  status: "completed",
  overallScore: 64,
  createdAt: new Date().toISOString(),
  issues: [
    {
      id: "issue-1",
      auditId: "test-audit",
      category: "content",
      severity: "high",
      type: "missing_faq",
      title: "No FAQ Schema Found",
      description: "Add FAQ schema",
      recommendation: "Add FAQPage schema to pages with FAQ content for AI visibility",
      impact: "high",
      effort: "low",
      status: "open",
    },
  ],
  categoryScores: [],
  platformScores: [],
} as unknown as Audit;

function extractContextFromHref(href: string | null): unknown | null {
  if (!href) return null;
  const match = href.match(/[?&]context=([^&]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

describe("RecommendationsList — Fix Now wiring", () => {
  it("points every 'Fix Now' button at /dashboard/create/generate with a JSON context", () => {
    render(<RecommendationsList audit={FIXTURE_AUDIT} />);

    const fixNowLinks = screen
      .getAllByRole("link")
      .filter((a) => a.textContent?.trim() === "Fix Now");

    expect(fixNowLinks.length).toBeGreaterThan(0);

    for (const link of fixNowLinks) {
      const href = link.getAttribute("href") ?? "";
      expect(href).toMatch(/^\/dashboard\/create\/generate\?context=/);

      const ctx = extractContextFromHref(href) as {
        recommendation?: string;
        auditUrl?: string;
        issues?: unknown[];
      } | null;
      expect(ctx).toBeTruthy();
      expect(ctx?.recommendation).toBe(
        "Add FAQPage schema to pages with FAQ content for AI visibility"
      );
      expect(ctx?.auditUrl).toBe("https://crankmart.com");
      expect(Array.isArray(ctx?.issues)).toBe(true);
    }
  });

  it("seeds the bottom CTA with the top recommendation context", () => {
    render(<RecommendationsList audit={FIXTURE_AUDIT} />);

    const ctaLink = screen
      .getAllByRole("link")
      .find((a) => a.textContent?.includes("Generate Content to Fix Issues"));

    expect(ctaLink).toBeTruthy();
    const href = ctaLink!.getAttribute("href") ?? "";
    expect(href).toMatch(/^\/dashboard\/create\/generate\?context=/);
    const ctx = extractContextFromHref(href) as { recommendation?: string } | null;
    expect(ctx?.recommendation).toBe(
      "Add FAQPage schema to pages with FAQ content for AI visibility"
    );
  });
});
