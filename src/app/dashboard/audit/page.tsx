"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Globe, Loader2, AlertCircle, CheckCircle2, Clock, Bot, ArrowRight, RefreshCw, XCircle, RotateCcw, ExternalLink } from "lucide-react";

// Decorative star component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientAudit)"
        />
        <defs>
          <linearGradient id="starGradientAudit" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSelectedBrand } from "@/stores";
import { useAuditsByBrand, useStartAudit, useCancelAudit, useRetryAudit, Audit } from "@/hooks/useAudit";
import { formatDate } from "@/lib/utils/formatters";

// URL validation regex - validates http/https URLs
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

// Threshold for considering an audit "stuck" (10 minutes)
const STUCK_AUDIT_THRESHOLD_MS = 10 * 60 * 1000;

// Check if an audit is potentially stuck (running too long)
function isAuditStuck(audit: Audit): boolean {
  if (audit.status !== "pending" && audit.status !== "crawling" && audit.status !== "analyzing") {
    return false;
  }
  const startTime = new Date(audit.startedAt).getTime();
  const now = Date.now();
  return (now - startTime) > STUCK_AUDIT_THRESHOLD_MS;
}

export interface AuditHistoryItem {
  id: string;
  url: string;
  score: number;
  status: "completed" | "in_progress" | "failed";
  date: string;
  startedAt: string;
  isStuck: boolean;
}

// Transform API audit to history item format
function auditToHistoryItem(audit: Audit): AuditHistoryItem {
  const statusMap: Record<string, "completed" | "in_progress" | "failed"> = {
    completed: "completed",
    pending: "in_progress",
    crawling: "in_progress",
    analyzing: "in_progress",
    failed: "failed",
  };

  // Get date from completedAt or startedAt using safe formatter
  const dateString = formatDate(audit.completedAt || audit.startedAt, "short");

  return {
    id: audit.id,
    url: audit.url,
    score: audit.overallScore || 0,
    status: statusMap[audit.status] || "in_progress",
    date: dateString !== "N/A" ? dateString : "Unknown date",
    startedAt: audit.startedAt,
    isStuck: isAuditStuck(audit),
  };
}

// Prompt to select a brand
function SelectBrandPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-lg space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Bot className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Select a Brand to Run Audits</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to audit your website and see audit history.
          </p>
        </div>
        <Link href="/dashboard/brands">
          <Button variant="outline" size="lg" className="gap-2">
            Manage Brands
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Loading state for audit history
function AuditHistoryLoadingState() {
  return (
    <div className="space-y-2" data-testid="audit-history-loading">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card-tertiary p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-muted rounded" />
              <div className="space-y-2">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="h-8 w-12 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Error state for audit history
function AuditHistoryErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-error/10 border border-error/30 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-error" />
      </div>
      <h4 className="text-lg font-semibold text-foreground mb-2">Failed to Load Audit History</h4>
      <p className="text-muted-foreground text-sm mb-4">{error.message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

export default function AuditPage() {
  const router = useRouter();

  // Get selected brand from global state
  const selectedBrand = useSelectedBrand();

  // Fetch audits for selected brand
  const {
    data: auditsResponse,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useAuditsByBrand(selectedBrand?.id || "", {
    limit: 10,
  });

  // Start audit mutation
  const startAuditMutation = useStartAudit();

  // Cancel and retry audit mutations
  const cancelAuditMutation = useCancelAudit();
  const retryAuditMutation = useRetryAudit();

  // Transform API audits to history items
  const auditHistory: AuditHistoryItem[] = React.useMemo(() => {
    if (!auditsResponse?.audits) return [];
    return auditsResponse.audits.map(auditToHistoryItem);
  }, [auditsResponse]);

  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isValid, setIsValid] = React.useState<boolean | null>(null);

  // Pre-fill URL with brand domain when brand changes
  React.useEffect(() => {
    if (selectedBrand?.domain) {
      const brandUrl = `https://${selectedBrand.domain}`;
      setUrl(brandUrl);
      setIsValid(URL_REGEX.test(brandUrl));
    }
  }, [selectedBrand?.domain]);

  const hasHistory = auditHistory.length > 0;
  const isLoading = startAuditMutation.isPending;

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

    // Require brand to be selected
    if (!selectedBrand) {
      setError("Please select a brand first");
      return;
    }

    setError(null);

    // Start the audit with brandId
    startAuditMutation.mutate({
      brandId: selectedBrand.id,
      url,
    });
  };

  // Show select brand prompt if no brand selected
  if (!selectedBrand) {
    return (
      <div className="space-y-6 relative">
        {/* Header Row: APEX branding + AI Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradAudit1)" />
                <defs>
                  <linearGradient id="apexGradAudit1" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5CC"/>
                    <stop offset="1" stopColor="#8B5CF6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              APEX
            </span>
            <span className="text-xl font-light text-foreground ml-1">Audit</span>
          </div>

          {/* AI Status */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">AI Status:</span>
            <span className="text-xs text-primary font-medium">Active</span>
          </div>
        </div>

        <SelectBrandPrompt />
        <DecorativeStar />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header Row: APEX branding + AI Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradAudit2)" />
              <defs>
                <linearGradient id="apexGradAudit2" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00E5CC"/>
                  <stop offset="1" stopColor="#8B5CF6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            APEX
          </span>
          <span className="text-xl font-light text-foreground ml-1">Audit</span>
        </div>

        {/* AI Status */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">AI Status:</span>
          <span className="text-xs text-primary font-medium">Active</span>
        </div>
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
          {/* URL validation error */}
          {isValid === false && !error && (
            <div className="flex items-center gap-2 text-error text-sm">
              <AlertCircle className="h-4 w-4" />
              Please enter a valid URL (e.g., https://example.com)
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
        {/* Loading state */}
        {isLoadingHistory ? (
          <AuditHistoryLoadingState />
        ) : /* Error state */ historyError ? (
          <AuditHistoryErrorState error={historyError as Error} onRetry={() => refetchHistory()} />
        ) : /* Has history */ hasHistory ? (
          <div className="space-y-2">
            {auditHistory.map((item) => (
              <div
                key={item.id}
                className="card-tertiary p-4 flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => {
                  if (item.status === "completed") {
                    router.push(`/dashboard/audit/results?id=${item.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && item.status === "completed") {
                    e.preventDefault();
                    router.push(`/dashboard/audit/results?id=${item.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {item.url}
                      {item.status === "completed" && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.date}
                      {item.status === "completed" && (
                        <span className="ml-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to view details
                        </span>
                      )}
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
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 ${item.isStuck ? "text-warning" : "text-muted-foreground"}`}>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">
                          {item.isStuck ? "Possibly Stuck" : "In Progress"}
                        </span>
                      </div>
                      {item.isStuck && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Cancel first, then retry
                            cancelAuditMutation.mutate(item.id, {
                              onSuccess: () => {
                                retryAuditMutation.mutate(item.id);
                              }
                            });
                          }}
                          disabled={cancelAuditMutation.isPending || retryAuditMutation.isPending}
                          title="Force restart audit"
                        >
                          {(cancelAuditMutation.isPending || retryAuditMutation.isPending) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-error hover:text-error hover:bg-error/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelAuditMutation.mutate(item.id);
                        }}
                        disabled={cancelAuditMutation.isPending}
                        title="Cancel audit"
                      >
                        {cancelAuditMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                  {item.status === "failed" && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-error">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Failed</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          retryAuditMutation.mutate(item.id);
                        }}
                        disabled={retryAuditMutation.isPending}
                        title="Retry audit"
                      >
                        {retryAuditMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
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

      {/* Decorative Star */}
      <DecorativeStar />
    </div>
  );
}
