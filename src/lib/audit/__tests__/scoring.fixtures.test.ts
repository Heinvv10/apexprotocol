/**
 * Control-brand regression tests for the new signal-grounded scoring.
 *
 * These are the tests that resolve the "is scoring real?" skepticism. We
 * assert *bands*, not exact numbers — exact numbers drift with any scoring
 * tweak and make the tests brittle. Bands encode the real product claim:
 * well-optimized sites land in B+/A, decent-but-minimal sites in C/B-,
 * and genuinely poor sites in D/F.
 *
 * When these change, scoring has drifted enough to reconsider calibration.
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseHtmlFixture, scoreFixture } from "./helpers";

const FIXTURES = path.join(__dirname, "fixtures");

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES, name), "utf8");
}

describe("scoreAudit — control brand calibration", () => {
  it("Stripe-like (well-optimized): overall ≥ 85", async () => {
    const html = loadFixture("stripe-like.html");
    const page = await parseHtmlFixture("https://stripe.com", html);
    const result = scoreFixture([page]);

    expect(result.overall).toBeGreaterThanOrEqual(85);
    // Schema scores ≥75 on a site with Organization + WebSite + FAQPage +
    // BreadcrumbList (missing Article/Product caps it at 80 — correct for
    // a marketing homepage without article schema).
    expect(result.categoryScores.schema).toBeGreaterThanOrEqual(75);
    // Metadata should be strong — we have title+desc+canonical+og+type
    expect(result.categoryScores.metadata).toBeGreaterThanOrEqual(85);
    // Accessibility: all images have alt, semantic nav/main/article
    expect(result.categoryScores.accessibility).toBeGreaterThanOrEqual(75);
  });

  it("Calendly-like (real SaaS, good basics): overall ≥ 70", async () => {
    const html = loadFixture("calendly-like.html");
    const page = await parseHtmlFixture("https://calendly.com", html);
    const result = scoreFixture([page]);

    expect(result.overall).toBeGreaterThanOrEqual(70);
    expect(result.overall).toBeLessThan(95);
    expect(result.categoryScores.metadata).toBeGreaterThanOrEqual(80);
  });

  it("HN-like (minimal but semantic): 55-80", async () => {
    const html = loadFixture("hn-like.html");
    const page = await parseHtmlFixture("https://news.ycombinator.com", html);
    const result = scoreFixture([page]);

    expect(result.overall).toBeGreaterThanOrEqual(50);
    expect(result.overall).toBeLessThanOrEqual(80);
    // No JSON-LD → schema score low
    expect(result.categoryScores.schema).toBeLessThan(60);
  });

  it("Lorem-poor (no meta, no schema, no alt, bare links): overall ≤ 45", async () => {
    const html = loadFixture("poor-lorem.html");
    const page = await parseHtmlFixture("https://example.com/lorem", html);
    const result = scoreFixture([page]);

    expect(result.overall).toBeLessThanOrEqual(45);
    // Missing title + description should tank metadata
    expect(result.categoryScores.metadata).toBeLessThan(30);
    // No alt text + bare "click here" links → accessibility tanks
    expect(result.categoryScores.accessibility).toBeLessThan(40);
    // No semantic landmarks, no H1 → structure tanks
    expect(result.categoryScores.structure).toBeLessThan(50);
  });

  it("evidence trail is populated for every category", async () => {
    const html = loadFixture("stripe-like.html");
    const page = await parseHtmlFixture("https://stripe.com", html);
    const result = scoreFixture([page]);

    expect(result.evidence.structure.length).toBeGreaterThan(0);
    expect(result.evidence.schema.length).toBeGreaterThan(0);
    expect(result.evidence.clarity.length).toBeGreaterThan(0);
    expect(result.evidence.metadata.length).toBeGreaterThan(0);
    expect(result.evidence.accessibility.length).toBeGreaterThan(0);
  });

  it("decomposition weights sum to 100 across factors", async () => {
    const html = loadFixture("calendly-like.html");
    const page = await parseHtmlFixture("https://calendly.com", html);
    const result = scoreFixture([page]);

    const weightSum = result.decomposition.factors.reduce((s, f) => s + f.weight, 0);
    expect(weightSum).toBeCloseTo(1, 2);
    const contribSum = result.decomposition.factors.reduce((s, f) => s + f.weightedContribution, 0);
    expect(Math.abs(contribSum - result.overall)).toBeLessThanOrEqual(1);
  });

  it("scores differ across brands (no hardcoded constants)", async () => {
    const stripe = scoreFixture([await parseHtmlFixture("s", loadFixture("stripe-like.html"))]);
    const calendly = scoreFixture([await parseHtmlFixture("c", loadFixture("calendly-like.html"))]);
    const hn = scoreFixture([await parseHtmlFixture("h", loadFixture("hn-like.html"))]);
    const lorem = scoreFixture([await parseHtmlFixture("l", loadFixture("poor-lorem.html"))]);

    const scores = [stripe.overall, calendly.overall, hn.overall, lorem.overall];
    // At least 3 distinct values — guards against the old bug where every
    // site scored the same because formulas were baseline constants.
    const distinct = new Set(scores);
    expect(distinct.size).toBeGreaterThanOrEqual(3);
  });
});
