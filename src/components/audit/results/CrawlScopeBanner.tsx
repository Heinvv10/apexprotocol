"use client";

import { Info } from "lucide-react";

interface CrawlScopeBannerProps {
  depth?: string;
  pagesAnalyzed?: number;
}

export function CrawlScopeBanner({
  depth,
  pagesAnalyzed,
}: CrawlScopeBannerProps) {
  const isShallow =
    depth === "homepage" ||
    depth === "single" ||
    (typeof pagesAnalyzed === "number" && pagesAnalyzed <= 1);
  if (!isShallow) return null;

  return (
    <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <Info className="h-4 w-4 text-warning mt-0.5 flex-none" />
      <div>
        <p className="font-medium text-foreground">
          Homepage-only audit
        </p>
        <p className="text-muted-foreground">
          This audit crawled {pagesAnalyzed ?? 1}{" "}
          {pagesAnalyzed === 1 ? "page" : "pages"}. Findings reflect the
          homepage only. Run a full-site audit to surface issues on inner
          pages.
        </p>
      </div>
    </div>
  );
}
