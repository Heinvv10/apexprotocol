"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Loader2,
  RefreshCw,
  Settings,
  ArrowLeft,
  Globe,
  Activity,
  BarChart3,
  Target,
  Lightbulb,
  MessageSquare,
  ExternalLink,
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
import { PredictiveChart } from "@/components/analytics/PredictiveChart";
import { LinkedInTeamDiscovery } from "@/components/people/linkedin-team-discovery";

// Type definitions
interface Brand {
  id: string;
  name: string;
  domain: string | null;
  logoUrl: string | null;
  description: string | null;
  industry: string | null;
  isActive: boolean;
  monitoringEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GeoScoreData {
  overall: number;
  breakdown: Array<{
    category: string;
    score: number;
    maxScore: number;
  }>;
  metrics: {
    totalMentions: number;
    positiveMentions: number;
    citedMentions: number;
    platforms: number;
  };
}

// Fetch brand details
async function fetchBrandDetails(id: string): Promise<Brand> {
  const res = await fetch(`/api/brands/${id}`);
  if (!res.ok) throw new Error("Failed to fetch brand");
  const data = await res.json();
  return data.data;
}

// Fetch GEO score
async function fetchGeoScore(brandId: string): Promise<GeoScoreData> {
  const res = await fetch(`/api/analytics/geo-score?brandId=${brandId}`);
  if (!res.ok) throw new Error("Failed to fetch GEO score");
  const data = await res.json();
  return data;
}

// Fetch predictions
async function fetchPredictions(brandId: string) {
  const res = await fetch(`/api/predictions?brandId=${brandId}&horizon=90`);
  if (!res.ok) {
    if (res.status === 400) {
      // Insufficient data - return null
      return null;
    }
    throw new Error("Failed to fetch predictions");
  }
  const data = await res.json();
  return data;
}

// Transform predictions to chart data format
function transformPredictionsToChartData(predictions: any, geoScore: GeoScoreData | undefined) {
  const chartData = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Add current score as the last historical data point
  const now = new Date();
  if (geoScore) {
    chartData.push({
      month: `${monthNames[now.getMonth()]} ${now.getDate()}`,
      actual: geoScore.overall,
      isPrediction: false,
    });
  }

  // Add predicted data points
  if (predictions.predictions && Array.isArray(predictions.predictions)) {
    predictions.predictions.forEach((pred: any) => {
      const predDate = new Date(pred.targetDate);
      chartData.push({
        month: `${monthNames[predDate.getMonth()]} ${predDate.getDate()}`,
        predicted: pred.predictedValue,
        confidenceLower: pred.confidenceLower,
        confidenceUpper: pred.confidenceUpper,
        isPrediction: true,
      });
    });
  }

  return chartData;
}

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;

  const {
    data: brand,
    isLoading: isBrandLoading,
    error: brandError,
    refetch: refetchBrand,
  } = useQuery({
    queryKey: ["brand", brandId],
    queryFn: () => fetchBrandDetails(brandId),
  });

  const {
    data: geoScore,
    isLoading: isScoreLoading,
    error: scoreError,
    refetch: refetchScore,
  } = useQuery({
    queryKey: ["geo-score", brandId],
    queryFn: () => fetchGeoScore(brandId),
    enabled: !!brand,
  });

  const {
    data: predictions,
    isLoading: isPredictionsLoading,
    error: predictionsError,
  } = useQuery({
    queryKey: ["predictions", brandId],
    queryFn: () => fetchPredictions(brandId),
    enabled: !!brand,
    retry: false, // Don't retry if insufficient data
  });

  const handleRefresh = () => {
    refetchBrand();
    refetchScore();
  };

  if (isBrandLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading brand...</p>
        </div>
      </div>
    );
  }

  if (brandError || !brand) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="card-secondary p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Brand Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The brand you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button
            onClick={() => router.push("/dashboard/brands")}
            variant="default"
          >
            Back to Brands
          </Button>
        </div>
      </div>
    );
  }

  const metrics = geoScore?.metrics || {
    totalMentions: 0,
    positiveMentions: 0,
    citedMentions: 0,
    platforms: 0,
  };

  const breakdown = geoScore?.breakdown || [];
  const overallScore = geoScore?.overall || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/brands")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="h-8 w-8 rounded object-contain"
                  />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{brand.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {brand.domain && (
                    <a
                      href={`https://${brand.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Globe className="h-3 w-3" />
                      {brand.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {brand.industry && (
                    <>
                      <span>â€¢</span>
                      <span className="capitalize">{brand.industry}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/brands/${brandId}/edit`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Brand
          </Button>
        </div>
      </div>

      {/* Description */}
      {brand.description && (
        <Card className="card-secondary border-0">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{brand.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-primary border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              GEO Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isScoreLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <ScoreGauge score={overallScore} />
            )}
          </CardContent>
        </Card>

        <Card className="card-secondary border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Mentions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">{metrics.totalMentions}</span>
              <span className="text-xs text-muted-foreground mt-1">Across AI Platforms</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-secondary border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Positive Mentions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-emerald-500">{metrics.positiveMentions}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {metrics.totalMentions > 0
                  ? `${Math.round((metrics.positiveMentions / metrics.totalMentions) * 100)}%`
                  : "0%"}{" "}
                of total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-secondary border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Platform Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-primary">{metrics.platforms}</span>
              <span className="text-xs text-muted-foreground mt-1">of 7 AI Platforms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Breakdown */}
      {breakdown.length > 0 && (
        <Card className="card-secondary border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Breakdown</CardTitle>
            <CardDescription>
              Detailed analysis of your brand's GEO score components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breakdown.map((item, index) => {
                const percentage = (item.score / item.maxScore) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.category}</span>
                      <span className="font-semibold text-foreground">
                        {item.score}/{item.maxScore}
                      </span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentage >= 70
                            ? "bg-emerald-500"
                            : percentage >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
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

      {/* Predictive Analytics */}
      {predictions && predictions.predictions && predictions.predictions.length > 0 && (
        <PredictiveChart
          data={transformPredictionsToChartData(predictions, geoScore)}
          title="GEO Score Forecast"
          description="Historical data and 90-day prediction with confidence intervals"
          isLoading={isPredictionsLoading}
          isError={!!predictionsError}
          error={predictionsError as Error}
          height={400}
          showConfidenceBands={true}
          showLegend={true}
        />
      )}

      {/* Monitoring Status */}
      <Card className="card-tertiary border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Monitoring Status</p>
                <p className="text-sm text-muted-foreground">
                  {brand.monitoringEnabled
                    ? "Active - Tracking brand mentions across AI platforms"
                    : "Paused - Brand monitoring is currently disabled"}
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                brand.monitoringEnabled
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {brand.monitoringEnabled ? "Active" : "Paused"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Team Discovery */}
      <LinkedInTeamDiscovery
        brandId={brandId}
        brandName={brand.name}
        domain={brand.domain || undefined}
      />

      {/* Quick Actions */}
      <Card className="card-tertiary border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/dashboard/monitor?brandId=${brandId}`}>
              <Button variant="outline" className="w-full justify-start" size="lg">
                <BarChart3 className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">View Mentions</div>
                  <div className="text-xs text-muted-foreground">Track AI platform mentions</div>
                </div>
              </Button>
            </Link>
            <Link href={`/dashboard/create?brandId=${brandId}`}>
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Lightbulb className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Create Content</div>
                  <div className="text-xs text-muted-foreground">Generate AI-optimized content</div>
                </div>
              </Button>
            </Link>
            <Link href={`/dashboard/audit?brandId=${brandId}`}>
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Target className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Run Audit</div>
                  <div className="text-xs text-muted-foreground">Analyze technical SEO</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
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
