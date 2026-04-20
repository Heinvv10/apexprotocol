/**
 * POST /api/tools/meta-tags
 *
 * Fetches a URL, extracts its current title + meta description + OG +
 * canonical, and returns a quality verdict with suggestions. The user
 * copies the suggestions back to their CMS.
 *
 * Doesn't render JS — static HTML only. That's fine for ~95% of sites;
 * SPA-rendered meta tags would need headless Chrome which is out of
 * scope for this tool.
 */

import { NextResponse, type NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { getUserId } from "@/lib/auth/supabase-server";

interface MetaReport {
  url: string;
  title: { value: string; length: number; verdict: "good" | "warn" | "bad"; issues: string[] };
  description: { value: string; length: number; verdict: "good" | "warn" | "bad"; issues: string[] };
  canonical: { value: string | null; issues: string[] };
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    issues: string[];
  };
  suggestions: {
    titleDraft: string;
    descriptionDraft: string;
  };
}

function verdictLen(len: number, good: [number, number], ok: [number, number]): "good" | "warn" | "bad" {
  if (len >= good[0] && len <= good[1]) return "good";
  if (len >= ok[0] && len <= ok[1]) return "warn";
  return "bad";
}

function suggestTitle(current: string, hostname: string): string {
  // Keep the first meaningful clause, trim to 50-60 chars, ensure brand suffix.
  const trimmed = current.trim().replace(/\s+/g, " ");
  const brand = hostname.replace(/^www\./, "").split(".").slice(0, -1).join(".");
  const brandCap = brand.charAt(0).toUpperCase() + brand.slice(1);

  if (trimmed.length >= 50 && trimmed.length <= 60 && trimmed.toLowerCase().includes(brand.toLowerCase())) {
    return trimmed; // already good
  }
  // Strip existing brand if present, re-append " | Brand" form
  const bare = trimmed.replace(new RegExp(`\\s*[|\\-—]\\s*${brandCap}\\s*$`, "i"), "");
  let draft = bare.length > 0 ? bare : "Home";
  const suffix = ` | ${brandCap}`;
  // Budget: 60 - suffix - 1 (gap)
  const budget = 60 - suffix.length;
  if (draft.length > budget) draft = draft.slice(0, budget - 1).trimEnd() + "…";
  return `${draft}${suffix}`;
}

function suggestDescription(current: string, title: string): string {
  const trimmed = current.trim().replace(/\s+/g, " ");
  if (trimmed.length >= 120 && trimmed.length <= 160) return trimmed;
  if (trimmed.length > 160) return trimmed.slice(0, 157).trimEnd() + "…";
  // Too short or missing: scaffold one from the title
  const base = title.split(/[|\-—]/)[0].trim();
  const draft = `Learn about ${base.toLowerCase()}. Features, pricing, and real-world use cases. Compare options and get started in minutes.`;
  return draft.slice(0, 160);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { url } = body as { url?: string };
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "url is not a valid URL" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ error: "url must be http or https" }, { status: 400 });
  }

  // Fetch the page
  let html: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ApexGEO-MetaScanner/1.0; +https://apexgeo.app)",
      },
    });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Page returned HTTP ${res.status}. Can't read meta tags.` },
        { status: 502 },
      );
    }
    html = await res.text();
  } catch (e) {
    return NextResponse.json(
      {
        error: `Couldn't fetch the page: ${
          e instanceof Error ? e.message : "network error"
        }`,
      },
      { status: 502 },
    );
  }

  const $ = cheerio.load(html);

  // Title
  const titleValue = ($("title").first().text() || "").trim();
  const titleIssues: string[] = [];
  if (!titleValue) titleIssues.push("Missing <title> — every page needs one.");
  else if (titleValue.length < 30) titleIssues.push("Title is under 30 characters — too short for SERP CTR.");
  else if (titleValue.length > 60) titleIssues.push("Title is over 60 characters — Google will truncate in results.");

  // Description
  const descValue =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";
  const descTrimmed = descValue.trim();
  const descIssues: string[] = [];
  if (!descTrimmed) descIssues.push("Missing meta description — Google may generate its own from page body.");
  else if (descTrimmed.length < 120) descIssues.push("Description under 120 characters — underusing the SERP real estate.");
  else if (descTrimmed.length > 160) descIssues.push("Description over 160 characters — will be truncated on mobile.");

  // Canonical
  const canonicalValue = $('link[rel="canonical"]').attr("href") ?? null;
  const canonicalIssues: string[] = [];
  if (!canonicalValue) canonicalIssues.push("No canonical URL — duplicates may be indexed separately.");

  // Open Graph
  const og = {
    title: $('meta[property="og:title"]').attr("content") ?? null,
    description: $('meta[property="og:description"]').attr("content") ?? null,
    image: $('meta[property="og:image"]').attr("content") ?? null,
    type: $('meta[property="og:type"]').attr("content") ?? null,
  };
  const ogIssues: string[] = [];
  if (!og.title) ogIssues.push("Missing og:title — social previews fall back to <title>.");
  if (!og.description) ogIssues.push("Missing og:description — social previews fall back to meta description.");
  if (!og.image) ogIssues.push("Missing og:image — no preview image on LinkedIn/X/Slack etc.");
  if (!og.type) ogIssues.push("Missing og:type — set to 'website' or 'article'.");

  const report: MetaReport = {
    url: parsed.toString(),
    title: {
      value: titleValue,
      length: titleValue.length,
      verdict: verdictLen(titleValue.length, [30, 60], [20, 70]),
      issues: titleIssues,
    },
    description: {
      value: descTrimmed,
      length: descTrimmed.length,
      verdict: verdictLen(descTrimmed.length, [120, 160], [80, 180]),
      issues: descIssues,
    },
    canonical: { value: canonicalValue, issues: canonicalIssues },
    og: { ...og, issues: ogIssues },
    suggestions: {
      titleDraft: suggestTitle(titleValue || parsed.hostname, parsed.hostname),
      descriptionDraft: suggestDescription(descTrimmed, titleValue),
    },
  };

  return NextResponse.json(report);
}
