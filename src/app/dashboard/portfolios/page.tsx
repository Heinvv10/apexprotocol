"use client";

import * as React from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Settings,
  Trash2,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
// Note: PageHeader expects pageName and currentPage props

// Types
interface PortfolioMetrics {
  totalBrands: number;
  avgUnifiedScore: number;
  avgGeoScore: number;
  avgSeoScore: number;
  avgAeoScore: number;
  totalMentions: number;
  totalRecommendations: number;
  healthStatus: "healthy" | "warning" | "critical";
  brandBreakdown?: {
    brandId: string;
    brandName: string;
    unifiedScore: number;
    trend: "up" | "down" | "stable";
  }[];
}

interface Portfolio {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  settings: {
    defaultView: "grid" | "list" | "comparison";
    alertThresholds: {
      scoreDropPercent: number;
      mentionDropPercent: number;
      competitorGainPercent: number;
    };
    reportRecipients: string[];
    reportFrequency: string;
    compareMetrics: string[];
  };
  aggregatedMetrics: PortfolioMetrics;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metricsUpdatedAt: string | null;
  brandCount: number;
  liveMetrics?: PortfolioMetrics;
}

interface PortfolioListResponse {
  portfolios: Portfolio[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API hooks
function usePortfolios() {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async (): Promise<PortfolioListResponse> => {
      const res = await fetch("/api/portfolios?includeMetrics=true");
      if (!res.ok) throw new Error("Failed to fetch portfolios");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

function useCreatePortfolio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create portfolio");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({
        title: "Portfolio created",
        description: "Your new portfolio has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

function useDeletePortfolio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (portfolioId: string) => {
      const res = await fetch(`/api/portfolios/${portfolioId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete portfolio");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({
        title: "Portfolio deleted",
        description: "The portfolio has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete portfolio",
        variant: "destructive",
      });
    },
  });
}

// Components
function HealthBadge({ status }: { status: "healthy" | "warning" | "critical" }) {
  const config = {
    healthy: {
      icon: CheckCircle,
      label: "Healthy",
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    warning: {
      icon: AlertTriangle,
      label: "Warning",
      className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    critical: {
      icon: AlertCircle,
      label: "Critical",
      className: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") {
    return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  }
  if (trend === "down") {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const getScoreColor = (s: number) => {
    if (s >= 70) return "text-emerald-500";
    if (s >= 50) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function PortfolioCard({ portfolio, onDelete }: { portfolio: Portfolio; onDelete: () => void }) {
  const metrics = portfolio.liveMetrics || portfolio.aggregatedMetrics;

  return (
    <div className="card-secondary p-6 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{portfolio.name}</h3>
            <p className="text-sm text-muted-foreground">
              {portfolio.brandCount} {portfolio.brandCount === 1 ? "brand" : "brands"}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/portfolios/${portfolio.id}`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/portfolios/${portfolio.id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {portfolio.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {portfolio.description}
        </p>
      )}

      {/* Health Status */}
      <div className="mb-4">
        <HealthBadge status={metrics.healthStatus} />
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-4 gap-4 mb-4 py-4 border-y border-border/50">
        <ScoreGauge score={metrics.avgUnifiedScore} label="Unified" />
        <ScoreGauge score={metrics.avgGeoScore} label="GEO" />
        <ScoreGauge score={metrics.avgSeoScore} label="SEO" />
        <ScoreGauge score={metrics.avgAeoScore} label="AEO" />
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span>{metrics.totalMentions} mentions</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>{metrics.totalRecommendations} pending</span>
        </div>
      </div>

      {/* Brand Preview */}
      {metrics.brandBreakdown && metrics.brandBreakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Brand Performance</p>
          <div className="space-y-2">
            {metrics.brandBreakdown.slice(0, 3).map((brand) => (
              <div key={brand.brandId} className="flex items-center justify-between">
                <span className="text-sm truncate">{brand.brandName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{brand.unifiedScore}</span>
                  <TrendIndicator trend={brand.trend} />
                </div>
              </div>
            ))}
            {metrics.brandBreakdown.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{metrics.brandBreakdown.length - 3} more brands
              </p>
            )}
          </div>
        </div>
      )}

      {/* View Link */}
      <Link
        href={`/dashboard/portfolios/${portfolio.id}`}
        className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
      >
        View Portfolio
        <TrendingUp className="ml-1 h-4 w-4" />
      </Link>
    </div>
  );
}

function CreatePortfolioDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const createMutation = useCreatePortfolio();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createMutation.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
    });

    setName("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Portfolio
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-modal">
        <DialogHeader>
          <DialogTitle>Create Portfolio</DialogTitle>
          <DialogDescription>
            Create a new portfolio to group and manage multiple brands together.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Portfolio Name</Label>
              <Input
                id="name"
                placeholder="e.g., Enterprise Clients"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this portfolio..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Portfolio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <FolderKanban className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Portfolios Yet</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Create your first portfolio to group and manage multiple brands together.
        Perfect for agencies or enterprises managing multiple brands.
      </p>
      <CreatePortfolioDialog />
    </div>
  );
}

// Main Page Component
export default function PortfoliosPage() {
  const { data, isLoading, error, refetch } = usePortfolios();
  const deleteMutation = useDeletePortfolio();

  const handleDelete = (portfolioId: string, portfolioName: string) => {
    if (confirm(`Are you sure you want to delete "${portfolioName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(portfolioId);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Brand Portfolios</h1>
              <p className="text-muted-foreground">
                Group brands for unified analysis and reporting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <CreatePortfolioDialog />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading portfolios...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card-secondary p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Portfolios</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading your portfolios. Please try again.
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {data && data.portfolios.length === 0 && <EmptyState />}

        {/* Portfolio Grid */}
        {data && data.portfolios.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="card-tertiary p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.total}</p>
                    <p className="text-sm text-muted-foreground">Portfolios</p>
                  </div>
                </div>
              </div>
              <div className="card-tertiary p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {data.portfolios.reduce((sum, p) => sum + p.brandCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Brands</p>
                  </div>
                </div>
              </div>
              <div className="card-tertiary p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {data.portfolios.reduce(
                        (sum, p) =>
                          sum + (p.liveMetrics?.totalMentions || p.aggregatedMetrics.totalMentions),
                        0
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Mentions</p>
                  </div>
                </div>
              </div>
              <div className="card-tertiary p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        data.portfolios.reduce(
                          (sum, p) =>
                            sum +
                            (p.liveMetrics?.avgUnifiedScore || p.aggregatedMetrics.avgUnifiedScore),
                          0
                        ) / data.portfolios.length
                      ) || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.portfolios.map((portfolio) => (
                <PortfolioCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  onDelete={() => handleDelete(portfolio.id, portfolio.name)}
                />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <p className="text-sm text-muted-foreground">
                  Showing {data.portfolios.length} of {data.total} portfolios
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
