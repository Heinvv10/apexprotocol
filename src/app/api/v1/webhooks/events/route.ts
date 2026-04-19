/**
 * GET /api/v1/webhooks/events
 *
 * Zapier trigger sample. Returns the last ~10 event payloads that would
 * have fired for each subscribed event type, so Zapier can build its
 * preview UI without requiring a real Zap to fire.
 */

import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";

export const GET = withApiErrorHandling(async () => {
  const auth = await requireV1Auth();

  // Synthetic sample — we don't retain dispatched payloads, but Zapier only
  // needs field shapes, not live data, to render its field picker.
  const now = new Date().toISOString();
  const sample = [
    {
      event: "score_changed",
      organization_id: auth.tenantId,
      brand_id: "example_brand_id",
      occurred_at: now,
      data: {
        brand_name: "Example Brand",
        previous_score: 68,
        current_score: 74,
        delta: 6,
        platform: "chatgpt",
      },
    },
    {
      event: "new_recommendation",
      organization_id: auth.tenantId,
      brand_id: "example_brand_id",
      occurred_at: now,
      data: {
        recommendation_id: "rec_example",
        title: "Add FAQ schema to /pricing",
        priority: "high",
        impact: "high",
        effort: "quick_win",
      },
    },
    {
      event: "alert_fired",
      organization_id: auth.tenantId,
      brand_id: "example_brand_id",
      occurred_at: now,
      data: {
        kind: "mention_drop",
        severity: "warning",
        z_score: -3.4,
        summary:
          "Brand mentions fell to 2 today vs. baseline avg 12.1 (3.4σ below normal).",
      },
    },
    {
      event: "mention_detected",
      organization_id: auth.tenantId,
      brand_id: "example_brand_id",
      occurred_at: now,
      data: {
        mention_id: "mention_example",
        platform: "perplexity",
        query: "best CRM for small business",
        position: 2,
        sentiment: "positive",
        citation_url: "https://example.com/pricing",
      },
    },
    {
      event: "audit_completed",
      organization_id: auth.tenantId,
      brand_id: "example_brand_id",
      occurred_at: now,
      data: {
        audit_id: "audit_example",
        url: "https://example.com",
        overall_score: 82,
        issues: { critical: 0, high: 2, medium: 5, low: 11 },
      },
    },
  ];

  return NextResponse.json({ data: sample });
});
