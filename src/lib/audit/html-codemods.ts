/**
 * HTML codemods — rule-based safe perf fixes the "Let Apex fix it"
 * feature applies to a page's HTML.
 *
 * Each codemod takes the full HTML string, returns { patched, changes[] }
 * where `changes` describes each site of modification so the UI can
 * render a "we changed these 6 things" list.
 *
 * Safety constraints:
 *   - Never touch content inside <script>, <style>, <pre>, <code>.
 *   - Never add `defer` to a script that has `async` already.
 *   - Never add `defer` to an inline script (no src attr).
 *   - Never lazy-load the first (likely hero) image.
 *   - Always produce valid HTML — test with parseDocument round-trip.
 *
 * We use cheerio for parsing to keep this consistent with how the audit
 * module reads signals from the same HTML. Attribute order is preserved
 * where possible; cheerio's serializer is stable for our purposes.
 */

import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

export type CodemodKind =
  | "defer_script"
  | "lazy_load_image"
  | "image_dimensions"
  | "preconnect_fonts"
  | "fetchpriority_hero"
  | "async_third_party";

export interface CodemodChange {
  kind: CodemodKind;
  /** Short human description of what changed */
  summary: string;
  /** The specific HTML snippet before (truncated to ~100 chars) */
  before: string;
  /** After (truncated) */
  after: string;
}

export interface CodemodResult {
  patched: string;
  changes: CodemodChange[];
  /** Estimated perf score lift (rough heuristic based on what changed) */
  estimatedLift: number;
  /** Metrics the patches most affect — for UI explanation */
  metricsImpacted: Array<"LCP" | "FCP" | "TBT" | "CLS" | "SI">;
}

const DEFER_SKIP_PATTERNS = [
  /gtag\.js/i,           // Google Tag Manager — has its own async loader
  /googletagmanager/i,
  /\banalytics\b/i,       // may rely on early load
  /cloudflare-static/i,   // CF auto-scripts — leave alone
];

const HERO_IMAGE_HINTS = [/hero/i, /banner/i, /cover/i, /^[^/]*logo/i];

const FONT_CDNS = [
  "https://fonts.gstatic.com",
  "https://fonts.googleapis.com",
];

function trunc(s: string, n = 100): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1) + "…" : clean;
}

function isHeroImage($: cheerio.CheerioAPI, img: AnyNode, index: number): boolean {
  if (index === 0) return true;
  const $img = $(img);
  const cls = ($img.attr("class") ?? "").toLowerCase();
  const alt = ($img.attr("alt") ?? "").toLowerCase();
  const src = ($img.attr("src") ?? "").toLowerCase();
  if (HERO_IMAGE_HINTS.some((rx) => rx.test(cls))) return true;
  if (HERO_IMAGE_HINTS.some((rx) => rx.test(alt))) return true;
  if (HERO_IMAGE_HINTS.some((rx) => rx.test(src))) return true;
  return false;
}

/**
 * Parse "bs-dark-512.png" style filenames where dimensions are baked in.
 * Returns null when we can't infer safely.
 */
function inferDimensionsFromFilename(src: string): { w: number; h: number } | null {
  // Match the common `-{W}x{H}` or `-{SIZE}` patterns
  const m1 = src.match(/[-_](\d{2,4})x(\d{2,4})\.(png|jpe?g|webp|avif|gif|svg)/i);
  if (m1) return { w: Number(m1[1]), h: Number(m1[2]) };
  const m2 = src.match(/[-_](\d{2,4})\.(png|jpe?g|webp|avif|gif|svg)/i);
  if (m2) {
    const s = Number(m2[1]);
    // Only use as square if number looks like a square icon size (32/64/128/256/512...)
    if ([16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 1024].includes(s)) {
      return { w: s, h: s };
    }
  }
  return null;
}

export function applyCodemods(html: string): CodemodResult {
  const $ = cheerio.load(html);
  const changes: CodemodChange[] = [];
  const metricsImpacted = new Set<"LCP" | "FCP" | "TBT" | "CLS" | "SI">();

  // ----- 1. Defer render-blocking scripts (non-critical) -----
  $("script[src]").each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src") ?? "";
    if (!src) return;
    const hasAsync = $el.attr("async") !== undefined;
    const hasDefer = $el.attr("defer") !== undefined;
    const type = ($el.attr("type") ?? "").toLowerCase();
    if (hasAsync || hasDefer) return;
    if (type && type !== "text/javascript" && type !== "module") return;
    if (DEFER_SKIP_PATTERNS.some((rx) => rx.test(src))) return;

    const before = trunc(String($.html(el)));
    $el.attr("defer", "");
    const after = trunc(String($.html(el)));
    changes.push({
      kind: "defer_script",
      summary: `Defer non-critical script: ${src.slice(0, 60)}`,
      before,
      after,
    });
    metricsImpacted.add("TBT");
    metricsImpacted.add("FCP");
  });

  // ----- 2. loading="lazy" on below-the-fold images -----
  $("img").each((i, el) => {
    const $el = $(el);
    if ($el.attr("loading")) return;
    if (isHeroImage($, el, i)) return;
    const before = trunc(String($.html(el)));
    $el.attr("loading", "lazy");
    const after = trunc(String($.html(el)));
    changes.push({
      kind: "lazy_load_image",
      summary: `Lazy-load below-fold image: ${($el.attr("src") ?? "").slice(0, 60)}`,
      before,
      after,
    });
    metricsImpacted.add("LCP");
    metricsImpacted.add("SI");
  });

  // ----- 3. width + height attributes (prevents CLS) -----
  $("img").each((_, el) => {
    const $el = $(el);
    const hasW = $el.attr("width");
    const hasH = $el.attr("height");
    if (hasW && hasH) return;
    const src = $el.attr("src") ?? "";
    if (!src) return;
    const dims = inferDimensionsFromFilename(src);
    if (!dims) return; // can't safely infer — skip
    const before = trunc(String($.html(el)));
    if (!hasW) $el.attr("width", String(dims.w));
    if (!hasH) $el.attr("height", String(dims.h));
    const after = trunc(String($.html(el)));
    changes.push({
      kind: "image_dimensions",
      summary: `Add width/height to ${src.split("/").pop()} (${dims.w}×${dims.h})`,
      before,
      after,
    });
    metricsImpacted.add("CLS");
  });

  // ----- 4. preconnect for font CDNs (only when fonts are used) -----
  const usesFonts = $(`link[href*="fonts.googleapis.com"]`).length > 0 ||
                    $(`link[href*="fonts.gstatic.com"]`).length > 0;
  if (usesFonts) {
    for (const origin of FONT_CDNS) {
      const already = $(`link[rel="preconnect"][href="${origin}"]`).length > 0;
      if (already) continue;
      const needsCrossorigin = origin.includes("gstatic"); // actual font files served CORS
      const tag = needsCrossorigin
        ? `<link rel="preconnect" href="${origin}" crossorigin />`
        : `<link rel="preconnect" href="${origin}" />`;
      $("head").append(`\n  ${tag}`);
      changes.push({
        kind: "preconnect_fonts",
        summary: `Preconnect to ${origin} for faster font loading`,
        before: "(missing)",
        after: trunc(tag),
      });
      metricsImpacted.add("FCP");
      metricsImpacted.add("LCP");
    }
  }

  // ----- 5. fetchpriority="high" on the hero image -----
  const firstImg = $("img").first();
  if (firstImg.length > 0 && !firstImg.attr("fetchpriority")) {
    const src = firstImg.attr("src") ?? "";
    const before = trunc(String($.html(firstImg[0])));
    firstImg.attr("fetchpriority", "high");
    // Also ensure loading="eager" (default, but explicit)
    if (!firstImg.attr("loading")) firstImg.attr("loading", "eager");
    const after = trunc(String($.html(firstImg[0])));
    changes.push({
      kind: "fetchpriority_hero",
      summary: `Mark hero image as high-priority fetch: ${src.slice(0, 60)}`,
      before,
      after,
    });
    metricsImpacted.add("LCP");
  }

  const patched = $.html();
  const estimatedLift = computeEstimatedLift(changes);

  return { patched, changes, estimatedLift, metricsImpacted: [...metricsImpacted] };
}

/**
 * Rough heuristic — each codemod type contributes an expected score lift
 * based on typical Lighthouse weightings. This is just UI sizzle; the
 * real lift only comes from an actual PSI re-run.
 */
function computeEstimatedLift(changes: CodemodChange[]): number {
  let lift = 0;
  for (const c of changes) {
    if (c.kind === "defer_script") lift += 8;
    else if (c.kind === "lazy_load_image") lift += 2;
    else if (c.kind === "image_dimensions") lift += 1;
    else if (c.kind === "preconnect_fonts") lift += 3;
    else if (c.kind === "fetchpriority_hero") lift += 4;
    else if (c.kind === "async_third_party") lift += 5;
  }
  return Math.min(lift, 40);
}
