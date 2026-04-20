/**
 * Richer PSI wrapper for the in-app PageSpeed tool. Returns everything
 * Google's own report shows: 4 category scores, Core Web Vitals, final
 * screenshot, and prioritized opportunities + diagnostics.
 *
 * Kept separate from src/lib/audit/checks/pagespeed-check.ts which is
 * the lightweight version the audit worker uses (metrics only, no
 * screenshots or category breakdown). That one runs against every audited
 * URL so it stays cheap; this one runs on user-triggered tool scans
 * where the richer payload is worth the extra bandwidth.
 */

export interface CategoryScore {
  /** 0-100 integer */
  score: number;
  title: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  /** Estimated savings in ms, or bytes for payload-type audits. */
  savingsMs?: number;
  /** 0-1 from lighthouse (lower = more urgent). */
  score: number | null;
  /** LH numeric value if present (raw measurement). */
  numericValue?: number;
}

export interface PageSpeedFullResult {
  url: string;
  strategy: "mobile" | "desktop";
  fetchedAt: string;
  categories: {
    performance: CategoryScore;
    accessibility: CategoryScore;
    bestPractices: CategoryScore;
    seo: CategoryScore;
  };
  metrics: {
    lcp: number; // ms
    fcp: number; // ms
    tbt: number; // ms
    cls: number;
    speedIndex: number; // ms
    ttfb: number; // ms
  };
  /** Data URI (image/jpeg;base64,...) for the final paint — may be null if PSI didn't include it. */
  finalScreenshot: string | null;
  /** Opportunities + diagnostics that aren't already passing. */
  opportunities: Opportunity[];
  diagnostics: Opportunity[];
  /** Field data from Chrome UX Report if the URL is in the dataset. */
  fieldData: {
    lcp?: { p75: number; category: "FAST" | "AVERAGE" | "SLOW" };
    fid?: { p75: number; category: "FAST" | "AVERAGE" | "SLOW" };
    cls?: { p75: number; category: "FAST" | "AVERAGE" | "SLOW" };
    inp?: { p75: number; category: "FAST" | "AVERAGE" | "SLOW" };
  } | null;
}

interface PsiAudit {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  numericValue?: number;
  details?: {
    type?: string;
    overallSavingsMs?: number;
  };
}

interface PsiResponse {
  lighthouseResult?: {
    categories?: Record<
      string,
      { score?: number | null; title?: string; auditRefs?: Array<{ id: string; group?: string; relevantAudits?: string[] }> }
    >;
    audits?: Record<string, PsiAudit>;
  };
  loadingExperience?: {
    metrics?: Record<string, { percentile?: number; category?: string }>;
  };
}

export async function checkPageSpeedFull(
  url: string,
  options: { strategy?: "mobile" | "desktop"; timeoutMs?: number } = {},
): Promise<PageSpeedFullResult | null> {
  const { strategy = "mobile", timeoutMs = 60000 } = options;

  const params = new URLSearchParams({ url, strategy });
  // Ask for all four categories in one call — PSI returns them together
  // when you pass multiple `category` params.
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) {
    params.append("category", c);
  }
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (key) params.set("key", key);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      { signal: controller.signal },
    );
    if (!res.ok) {
      console.warn(`[pagespeed-full] ${res.status} ${res.statusText} for ${url}`);
      return null;
    }
    const data = (await res.json()) as PsiResponse;
    const lh = data.lighthouseResult;
    if (!lh?.categories || !lh?.audits) return null;

    const pick = (k: string): number => {
      const v = lh.audits?.[k]?.numericValue;
      return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
    };

    const score = (k: string): CategoryScore => {
      const c = lh.categories?.[k];
      const s = typeof c?.score === "number" ? Math.round(c.score * 100) : 0;
      return { score: s, title: c?.title ?? k };
    };

    const cls = lh.audits["cumulative-layout-shift"]?.numericValue;

    const finalShot = lh.audits["final-screenshot"] as unknown as
      | { details?: { data?: string } }
      | undefined;

    // Collect opportunities (savings-oriented performance audits) and
    // diagnostics (non-savings performance audits). Filter to only
    // those that didn't pass (score < 0.9) so we don't drown the UI in
    // green ticks.
    const perfAudits = lh.categories?.["performance"]?.auditRefs ?? [];
    const opportunities: Opportunity[] = [];
    const diagnostics: Opportunity[] = [];
    for (const ref of perfAudits) {
      const audit = lh.audits?.[ref.id];
      if (!audit) continue;
      const passed =
        typeof audit.score === "number" && audit.score >= 0.9;
      if (passed) continue;
      const isOpp = audit.details?.type === "opportunity";
      const item: Opportunity = {
        id: ref.id,
        title: audit.title ?? ref.id,
        description: audit.description ?? "",
        score: audit.score ?? null,
        savingsMs: audit.details?.overallSavingsMs,
        numericValue: audit.numericValue,
      };
      if (isOpp) opportunities.push(item);
      else if (ref.group === "diagnostics" || ref.group === "load-opportunities") {
        diagnostics.push(item);
      }
    }
    // Sort opportunities by savings desc, diagnostics by score asc
    opportunities.sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0));
    diagnostics.sort((a, b) => (a.score ?? 1) - (b.score ?? 1));

    // Field data from CrUX if present
    const lx = data.loadingExperience?.metrics;
    const lxPick = (k: string) => {
      const m = lx?.[k];
      if (!m || typeof m.percentile !== "number") return undefined;
      const cat = (m.category ?? "AVERAGE") as "FAST" | "AVERAGE" | "SLOW";
      return { p75: m.percentile, category: cat };
    };
    const fieldData =
      lx && Object.keys(lx).length > 0
        ? {
            lcp: lxPick("LARGEST_CONTENTFUL_PAINT_MS"),
            fid: lxPick("FIRST_INPUT_DELAY_MS"),
            cls: lxPick("CUMULATIVE_LAYOUT_SHIFT_SCORE"),
            inp: lxPick("INTERACTION_TO_NEXT_PAINT"),
          }
        : null;

    return {
      url,
      strategy,
      fetchedAt: new Date().toISOString(),
      categories: {
        performance: score("performance"),
        accessibility: score("accessibility"),
        bestPractices: score("best-practices"),
        seo: score("seo"),
      },
      metrics: {
        lcp: pick("largest-contentful-paint"),
        fcp: pick("first-contentful-paint"),
        tbt: pick("total-blocking-time"),
        cls:
          typeof cls === "number" && Number.isFinite(cls)
            ? Math.round(cls * 1000) / 1000
            : 0,
        speedIndex: pick("speed-index"),
        ttfb: pick("server-response-time"),
      },
      finalScreenshot: finalShot?.details?.data ?? null,
      opportunities,
      diagnostics,
      fieldData,
    };
  } catch (e) {
    console.warn(
      `[pagespeed-full] failed for ${url}:`,
      e instanceof Error ? e.message : String(e),
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}
