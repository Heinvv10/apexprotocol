"use client";

import * as React from "react";
import { Link2, TrendingUp, TrendingDown } from "lucide-react";

interface TopReferrer {
  domain: string;
  backlinks: number;
  authority: number;
}

interface BacklinkSummaryCardProps {
  estimatedBacklinks: number;
  topReferrers: TopReferrer[];
  backlinksChange: number;
  backlinksTrend: "up" | "down" | "stable";
}

export function BacklinkSummaryCard({
  estimatedBacklinks,
  topReferrers,
  backlinksChange,
  backlinksTrend,
}: BacklinkSummaryCardProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return { icon: "📈", color: "text-success", label: "Growing" };
      case "down":
        return { icon: "📉", color: "text-error", label: "Declining" };
      default:
        return { icon: "➡️", color: "text-muted-foreground", label: "Stable" };
    }
  };

  const trend = getTrendIcon(backlinksTrend);

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Backlink Summary</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Estimated backlink count and top referring domains with authority scores
        </p>
      </div>

      {/* Overall backlink card */}
      <div className="card-tertiary p-6 border bg-gradient-to-br from-primary/5 to-muted/5 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-4xl font-bold text-primary">{estimatedBacklinks}</div>
            <div className="text-sm text-muted-foreground mt-1">Est. Backlinks</div>
          </div>
          <div className="flex items-center justify-center border-l border-r border-border">
            <div className="text-center">
              <div className={`text-2xl ${trend.color}`}>{trend.icon}</div>
              <div className={`text-xs font-semibold ${trend.color} mt-1`}>{trend.label}</div>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${backlinksTrend === "up" ? "text-success" : "text-error"}`}>
              {backlinksTrend === "up" ? "+" : ""}{backlinksChange}
            </div>
            <div className="text-xs text-muted-foreground mt-1">This Month</div>
          </div>
        </div>
      </div>

      {/* Top referrers */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Top Referring Domains</h4>
        {topReferrers.map((referrer, idx) => (
          <div key={idx} className="card-tertiary p-4 border rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{referrer.domain}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {referrer.backlinks} backlink
                  {referrer.backlinks > 1 ? "s" : ""} from this domain
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-primary">{referrer.authority}</div>
                <div className="text-xs text-muted-foreground mt-1">Authority</div>
              </div>
            </div>

            {/* Authority bar */}
            <div className="mt-3">
              <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-success h-full rounded-full transition-all"
                  style={{ width: `${(referrer.authority / 100) * 100}%` }}
                />
              </div>
            </div>

            {/* Domain type indicator */}
            <div className="mt-2 flex gap-2">
              {referrer.authority >= 90 && (
                <span className="text-xs px-2 py-1 rounded bg-success/10 text-success font-medium">
                  High Authority
                </span>
              )}
              {referrer.authority >= 80 && referrer.authority < 90 && (
                <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                  Established
                </span>
              )}
              {referrer.authority < 80 && (
                <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning font-medium">
                  Growing
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Backlink quality tip */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-foreground mb-1">Backlink Quality Indicators:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong>High Authority (90+)</strong> - Very valuable links from established domains</li>
          <li>• <strong>Established (80-89)</strong> - Good quality links from reputable sources</li>
          <li>• <strong>Growing (&lt;80)</strong> - Emerging domains, potential for future growth</li>
        </ul>
      </div>

      {/* Recommendations */}
      <div className="bg-success/5 border border-success/20 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-foreground mb-1">Link Building Strategy:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Target backlinks from domains with 80+ authority scores</li>
          <li>• Focus on industry-related sites for topical relevance</li>
          <li>• Monitor competitor backlinks for opportunities</li>
          <li>• Create linkable assets (guides, tools, research) to attract natural links</li>
          <li>• Disavow toxic or spammy backlinks that harm your profile</li>
        </ul>
      </div>
    </div>
  );
}
