"use client";

import * as React from "react";
import { Search, Globe, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// URL validation regex - validates http/https URLs
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

export interface AuditHistoryItem {
  id: string;
  url: string;
  score: number;
  status: "completed" | "in_progress" | "failed";
  date: string;
}

export default function AuditPage() {
  // TODO: Fetch audit history from API endpoint
  // const { data: auditHistory } = useQuery(['audits'], fetchAuditHistory);
  const auditHistory: AuditHistoryItem[] = []; // Empty array - no mock data

  const [url, setUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isValid, setIsValid] = React.useState<boolean | null>(null);

  const hasHistory = auditHistory.length > 0;

  // Validate URL on change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setError(null);

    if (value.length === 0) {
      setIsValid(null);
    } else if (URL_REGEX.test(value)) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL before submitting
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    if (!URL_REGEX.test(url)) {
      setError("Please enter a valid URL (e.g., https://example.com)");
      setIsValid(false);
      return;
    }

    // Start loading state
    setIsLoading(true);
    setError(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In real app, this would call the audit API
    setIsLoading(false);
    // Would redirect to audit results page
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Site Audit</h2>
        <p className="text-muted-foreground">
          Analyze your website for AI visibility and get actionable recommendations
        </p>
      </div>

      {/* URL Input Form */}
      <div className="card-primary p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <span className="font-semibold">Enter URL to Audit</span>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={handleUrlChange}
                disabled={isLoading}
                className={`pr-10 ${
                  isValid === true
                    ? "border-success focus-visible:ring-success"
                    : isValid === false
                    ? "border-error focus-visible:ring-error"
                    : ""
                }`}
              />
              {/* Validation indicator */}
              {isValid === true && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
              )}
              {isValid === false && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-error" />
              )}
            </div>
            <Button type="submit" disabled={isLoading || isValid === false}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Start Audit
                </>
              )}
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-error text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Helper text */}
          <p className="text-xs text-muted-foreground">
            Enter a full URL including https:// to analyze your site&apos;s AI visibility
          </p>
        </form>
      </div>

      {/* What We Analyze */}
      <div className="card-secondary p-6">
        <h3 className="font-semibold mb-4">What We Analyze</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-tertiary p-4">
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-medium">Content Structure</div>
            <div className="text-sm text-muted-foreground">
              Headings, FAQs, and semantic markup
            </div>
          </div>
          <div className="card-tertiary p-4">
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-medium">Technical SEO</div>
            <div className="text-sm text-muted-foreground">
              Schema, meta tags, and crawlability
            </div>
          </div>
          <div className="card-tertiary p-4">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-medium">AI Readiness</div>
            <div className="text-sm text-muted-foreground">
              LLM citation potential analysis
            </div>
          </div>
          <div className="card-tertiary p-4">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Competitor Gap</div>
            <div className="text-sm text-muted-foreground">
              Compare against top performers
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audits */}
      <div className="card-secondary p-6">
        <h3 className="font-semibold mb-4">Recent Audits</h3>
        {hasHistory ? (
          <div className="space-y-2">
            {auditHistory.map((item) => (
              <div
                key={item.id}
                className="card-tertiary p-4 flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{item.url}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.status === "completed" && (
                    <div className="flex items-center gap-2">
                      <div className={`text-lg font-bold ${
                        item.score >= 80 ? "text-success" :
                        item.score >= 60 ? "text-warning" :
                        "text-error"
                      }`}>
                        {item.score}
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                  )}
                  {item.status === "in_progress" && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">In Progress</span>
                    </div>
                  )}
                  {item.status === "failed" && (
                    <div className="flex items-center gap-2 text-error">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Failed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No audits yet. Enter a URL above to run your first site audit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
