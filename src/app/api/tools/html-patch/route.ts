/**
 * POST /api/tools/html-patch
 *
 * Fetches a URL's HTML (or accepts raw HTML in `html` field) and returns
 * the patched version after running src/lib/audit/html-codemods.ts over it.
 *
 * Non-destructive — the caller downloads the patched file and deploys
 * on their own. Apex never writes to the customer's server from this
 * route.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getUserId } from "@/lib/auth/supabase-server";
import { applyCodemods } from "@/lib/audit/html-codemods";

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { url, html } = body as { url?: string; html?: string };

  let sourceHtml: string;
  let sourceUrl: string | null = null;

  if (html && typeof html === "string") {
    if (html.length > 5_000_000) {
      return NextResponse.json(
        { error: "HTML is too large (over 5 MB). Paste a single page, not a whole site." },
        { status: 400 },
      );
    }
    sourceHtml = html;
  } else if (url && typeof url === "string") {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "url is not a valid URL" }, { status: 400 });
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "url must be http or https" }, { status: 400 });
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(parsed.toString(), {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ApexGEO-HtmlPatcher/1.0; +https://apexgeo.app)",
        },
      });
      clearTimeout(timer);
      if (!res.ok) {
        return NextResponse.json(
          { error: `Page returned HTTP ${res.status}` },
          { status: 502 },
        );
      }
      sourceHtml = await res.text();
      sourceUrl = parsed.toString();
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
  } else {
    return NextResponse.json(
      { error: "Provide either `url` or `html` in the request body" },
      { status: 400 },
    );
  }

  const result = applyCodemods(sourceHtml);

  return NextResponse.json({
    url: sourceUrl,
    sourceBytes: sourceHtml.length,
    patchedBytes: result.patched.length,
    ...result,
  });
}
