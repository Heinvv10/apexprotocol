/**
 * PageSpeed Insights check
 *
 * Calls Google's PSI API to get real Lighthouse metrics (FCP/LCP/TBT/CLS/
 * Speed Index) for the audit URL. Replaces the previous fabricated
 * "3000ms / 4000ms / 200ms / 10%" defaults.
 *
 * No API key is required for low-volume anonymous use. To raise the
 * quota, set GOOGLE_PAGESPEED_API_KEY.
 *
 * On any failure (network, rate-limit, PSI returned no data) this
 * returns null and the caller renders an honest "not captured" state.
 */
export interface PageSpeedResult {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  speedIndex: number;
  // Navigation Timing sub-phases. Optional because PSI only returns
  // full waterfall for some URLs; fall back to 0 when missing.
  responseTime?: number;
  dnsLookup?: number;
  tcpConnection?: number;
  requestTime?: number;
  domProcessing?: number;
  resourcesDownload?: number;
}

interface PsiAudit {
  numericValue?: number;
}

interface PsiLighthouseResult {
  audits?: {
    "first-contentful-paint"?: PsiAudit;
    "largest-contentful-paint"?: PsiAudit;
    "total-blocking-time"?: PsiAudit;
    "cumulative-layout-shift"?: PsiAudit;
    "speed-index"?: PsiAudit;
    "server-response-time"?: PsiAudit;
    "network-rtt"?: PsiAudit;
    "network-server-latency"?: PsiAudit;
  };
}

interface PsiResponse {
  lighthouseResult?: PsiLighthouseResult;
}

export async function checkPageSpeed(
  url: string,
  options: { strategy?: "mobile" | "desktop"; timeoutMs?: number } = {}
): Promise<PageSpeedResult | null> {
  const { strategy = "mobile", timeoutMs = 45000 } = options;

  const params = new URLSearchParams({
    url,
    strategy,
    category: "performance",
  });
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (key) params.set("key", key);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      { signal: controller.signal }
    );
    if (!res.ok) {
      console.warn(`[pagespeed] ${res.status} ${res.statusText} for ${url}`);
      return null;
    }
    const data = (await res.json()) as PsiResponse;
    const audits = data.lighthouseResult?.audits;
    if (!audits) return null;

    const pick = (k: keyof NonNullable<PsiLighthouseResult["audits"]>): number => {
      const v = audits[k]?.numericValue;
      return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
    };

    // FCP/LCP/TBT/SI/responseTime come back in ms; CLS is unitless.
    const cls = audits["cumulative-layout-shift"]?.numericValue;
    return {
      firstContentfulPaint: pick("first-contentful-paint"),
      largestContentfulPaint: pick("largest-contentful-paint"),
      totalBlockingTime: pick("total-blocking-time"),
      cumulativeLayoutShift:
        typeof cls === "number" && Number.isFinite(cls)
          ? Math.round(cls * 1000) / 1000
          : 0,
      speedIndex: pick("speed-index"),
      responseTime: pick("server-response-time"),
      // PSI doesn't break out DNS/TCP/DOM phases directly. Leave them
      // undefined so the waterfall renders "insufficient data" on those
      // rows rather than 0-width bars that look intentional.
    };
  } catch (e) {
    console.warn(
      `[pagespeed] failed for ${url}:`,
      e instanceof Error ? e.message : String(e)
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}
