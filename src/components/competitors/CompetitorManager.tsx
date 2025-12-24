"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Building2,
  AlertCircle,
  Users,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Types
export interface TrackedCompetitor {
  competitorName: string;
  competitorDomain: string;
  latestSnapshot?: {
    geoScore?: number | null;
    aiMentionCount?: number | null;
    snapshotDate?: string;
  } | null;
}

interface CompetitorManagerProps {
  brandId: string;
  className?: string;
  onCompetitorAdded?: () => void;
  onCompetitorRemoved?: () => void;
}

// Empty state component
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center max-w-md space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">Track Your Competitors</h3>
          <p className="text-muted-foreground text-sm">
            Add up to 10 competitors to monitor their GEO scores, AI mentions, and market
            positioning over time.
          </p>
        </div>

        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Add First Competitor
        </button>
      </div>
    </div>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-pulse">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">Loading Competitors</h3>
          <p className="text-muted-foreground text-sm">
            Fetching your tracked competitors...
          </p>
        </div>
      </div>
    </div>
  );
}

// Competitor card item
function CompetitorCard({
  competitor,
  onRemove,
}: {
  competitor: TrackedCompetitor;
  onRemove: () => void;
}) {
  return (
    <div className="group relative rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-foreground truncate">
              {competitor.competitorName}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{competitor.competitorDomain}</span>
          </div>

          {competitor.latestSnapshot && (
            <div className="mt-3 flex items-center gap-4 text-xs">
              {competitor.latestSnapshot.geoScore !== null &&
                competitor.latestSnapshot.geoScore !== undefined && (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">GEO Score</span>
                    <span className="font-bold text-foreground text-sm">
                      {competitor.latestSnapshot.geoScore}
                    </span>
                  </div>
                )}
              {competitor.latestSnapshot.aiMentionCount !== null &&
                competitor.latestSnapshot.aiMentionCount !== undefined && (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">AI Mentions</span>
                    <span className="font-bold text-foreground text-sm">
                      {competitor.latestSnapshot.aiMentionCount}
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>

        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 text-destructive"
          aria-label={`Remove ${competitor.competitorName}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function CompetitorManager({
  brandId,
  className,
  onCompetitorAdded,
  onCompetitorRemoved,
}: CompetitorManagerProps) {
  const [competitors, setCompetitors] = React.useState<TrackedCompetitor[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [competitorName, setCompetitorName] = React.useState("");
  const [competitorDomain, setCompetitorDomain] = React.useState("");

  // Fetch competitors on mount
  React.useEffect(() => {
    fetchCompetitors();
  }, [brandId]);

  const fetchCompetitors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/competitors?brandId=${brandId}`);
      if (!response.ok) throw new Error("Failed to fetch competitors");
      const data = await response.json();
      setCompetitors(data.competitors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!competitorName.trim() || !competitorDomain.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          competitorName: competitorName.trim(),
          competitorDomain: competitorDomain.trim(),
          snapshotDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to add competitor");
      }

      // Reset form
      setCompetitorName("");
      setCompetitorDomain("");
      setIsDialogOpen(false);

      // Refresh competitors list
      await fetchCompetitors();

      // Notify parent
      onCompetitorAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add competitor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCompetitor = async (competitorDomain: string) => {
    if (!confirm("Are you sure you want to remove this competitor and all its historical data?")) {
      return;
    }

    setError(null);

    try {
      // Delete all snapshots for this competitor domain
      const response = await fetch(
        `/api/competitors/by-domain/${encodeURIComponent(competitorDomain)}?brandId=${brandId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to remove competitor");
      }

      // Refresh competitors list
      await fetchCompetitors();

      // Notify parent
      onCompetitorRemoved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove competitor");
    }
  };

  const canAddMore = competitors.length < 10;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tracked Competitors</h2>
          <p className="text-sm text-muted-foreground">
            {competitors.length} of 10 competitors tracked
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={!canAddMore}
              className="gap-2"
              title={!canAddMore ? "Maximum 10 competitors reached" : "Add competitor"}
            >
              <Plus className="w-4 h-4" />
              Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddCompetitor}>
              <DialogHeader>
                <DialogTitle>Add Competitor</DialogTitle>
                <DialogDescription>
                  Track a new competitor to monitor their GEO scores and AI mentions over
                  time. You can track up to 10 competitors.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="competitor-name">Competitor Name</Label>
                  <Input
                    id="competitor-name"
                    placeholder="e.g., Acme Corp"
                    value={competitorName}
                    onChange={(e) => setCompetitorName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competitor-domain">Website Domain</Label>
                  <Input
                    id="competitor-domain"
                    placeholder="e.g., acme.com"
                    value={competitorDomain}
                    onChange={(e) => setCompetitorDomain(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Competitor
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error display */}
      {error && !isDialogOpen && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 10-competitor limit warning */}
      {!canAddMore && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Maximum competitor limit reached. Remove a competitor to add a new one.
          </span>
        </div>
      )}

      {/* Competitors list */}
      {isLoading ? (
        <LoadingState />
      ) : competitors.length === 0 ? (
        <EmptyState onAdd={() => setIsDialogOpen(true)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {competitors.map((competitor) => (
            <CompetitorCard
              key={competitor.competitorDomain}
              competitor={competitor}
              onRemove={() => handleRemoveCompetitor(competitor.competitorDomain)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
