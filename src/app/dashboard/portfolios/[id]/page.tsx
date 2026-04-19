"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FolderKanban,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Loader2,
  RefreshCw,
  Settings,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  Target,
  Lightbulb,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Type definitions
interface Brand {
  id: string;
  name: string;
  domain: string;
  logoUrl: string | null;
  industry: string | null;
  isActive: boolean;
}

interface PortfolioBrand {
  id: string;
  brandId: string;
  displayOrder: number;
  isHighlighted: boolean;
  customLabel: string | null;
  addedAt: Date;
  brand: Brand;
}

interface PortfolioMetrics {
  totalBrands: number;
  avgUnifiedScore: number;
  avgGeoScore: number;
  avgSeoScore: number;
  avgAeoScore: number;
  totalMentions: number;
  totalRecommendations: number;
  healthStatus: "healthy" | "warning" | "critical";
  brandBreakdown: Array<{
    brandId: string;
    brandName: string;
    unifiedScore: number;
    trend: "up" | "down" | "stable";
  }>;
}

interface Portfolio {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  brands: PortfolioBrand[];
  liveMetrics: PortfolioMetrics;
}

// Fetch portfolio details
async function fetchPortfolioDetails(id: string): Promise<Portfolio> {
  const res = await fetch(`/api/portfolios/${id}`);
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  const data = await res.json();
  return data.portfolio;
}

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.id as string;

  const {
    data: portfolio,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portfolio", portfolioId],
    queryFn: () => fetchPortfolioDetails(portfolioId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="card-secondary p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Portfolio Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The portfolio you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button
            onClick={() => router.push("/dashboard/portfolios")}
            variant="default"
          >
            Back to Portfolios
          </Button>
        </div>
      </div>
    );
  }

  const metrics = portfolio.liveMetrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/portfolios")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{portfolio.name}</h1>
                {portfolio.description && (
                  <p className="text-sm text-muted-foreground">{portfolio.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/portfolios/${portfolioId}/settings`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Health Status Banner */}
      <div className="card-primary p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HealthBadge status={metrics.healthStatus} />
            <div>
              <p className="text-sm font-medium text-foreground">Portfolio Health</p>
              <p className="text-xs text-muted-foreground">
                Monitoring {metrics.totalBrands} {metrics.totalBrands === 1 ? "brand" : "brands"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{metrics.totalMentions}</p>
              <p className="text-xs text-muted-foreground">Total Mentions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{metrics.totalRecommendations}</p>
              <p className="text-xs text-muted-foreground">Recommendations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-secondary border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Unified Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreGauge score={metrics.avgUnifiedScore} />
          </CardContent>
        </Card>

        <Card className="card-secondary border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              GEO Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreGauge score={metrics.avgGeoScore} />
          </CardContent>
        </Card>

        <Card className="card-secondary border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              SEO Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreGauge score={metrics.avgSeoScore} />
          </CardContent>
        </Card>

        <Card className="card-secondary border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              AEO Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreGauge score={metrics.avgAeoScore} />
          </CardContent>
        </Card>
      </div>

      {/* Brands in Portfolio */}
      <Card className="card-secondary border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Brands in Portfolio</CardTitle>
          <CardDescription>
            {portfolio.brands.length} {portfolio.brands.length === 1 ? "brand" : "brands"} being tracked
          </CardDescription>
        </CardHeader>
        <CardContent>
          {portfolio.brands.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No brands added to this portfolio yet
              </p>
              <Button variant="outline" size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                Add Brands
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.brands.map((pb) => {
                const brandMetric = metrics.brandBreakdown.find(
                  (b) => b.brandId === pb.brandId
                );
                return (
                  <Link
                    key={pb.id}
                    href={`/dashboard/brands/${pb.brandId}`}
                    className="block"
                  >
                    <div className="card-tertiary p-4 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{pb.brand.name}</h4>
                            <p className="text-sm text-muted-foreground">{pb.brand.domain}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">
                              {brandMetric?.unifiedScore || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                          {brandMetric && (
                            <TrendIndicator trend={brandMetric.trend} />
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Comparison */}
      {metrics.brandBreakdown.length > 1 && (
        <Card className="card-secondary border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Brand Comparison</CardTitle>
            <CardDescription>
              Compare performance across all brands in this portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.brandBreakdown
                .sort((a, b) => b.unifiedScore - a.unifiedScore)
                .map((brand, index) => {
                  const maxScore = Math.max(...metrics.brandBreakdown.map((b) => b.unifiedScore));
                  const percentage = (brand.unifiedScore / maxScore) * 100;

                  return (
                    <div key={brand.brandId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {index + 1}. {brand.brandName}
                          </span>
                          <TrendIndicator trend={brand.trend} />
                        </div>
                        <span className="font-semibold text-foreground">{brand.unifiedScore}</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Components
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
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${className}`}
    >
      <Icon className="h-4 w-4" />
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

function ScoreGauge({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 70) return "text-emerald-500";
    if (s >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 70) return "Excellent";
    if (s >= 50) return "Good";
    if (s >= 30) return "Fair";
    return "Poor";
  };

  return (
    <div className="flex flex-col items-center">
      <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
      <span className="text-xs text-muted-foreground mt-1">{getScoreLabel(score)}</span>
    </div>
  );
}
