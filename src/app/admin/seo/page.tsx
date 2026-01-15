"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Globe,
  FileText,
  Key,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSEOSummary } from "@/hooks/useSEO";

export default function SEOPage() {
  // API data with fallback to mock data
  const { summary, isLoading, isError, error } = useSEOSummary();

  // Mock data for fallback
  const mockSummary = {
    overallScore: 82,
    technicalHealth: 88,
    contentQuality: 79,
    totalPages: 145,
    indexedPages: 132,
    trackedKeywords: 87,
    avgPosition: 12.4,
    organicTraffic: 24580,
    recentIssues: 7,
  };

  // Use API data if available, otherwise fallback to mock
  const data = summary ?? mockSummary;

  // Calculate metrics
  const indexationRate = Math.round((data.indexedPages / data.totalPages) * 100);
  const trafficChange = 12.3; // Would come from API comparing to previous period
  const positionChange = -2.1; // Negative is good (moving up)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">SEO Overview</h1>
        <p className="text-muted-foreground mt-1">Monitor website SEO and search visibility</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading SEO data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load SEO data</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching SEO summary"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>
          {/* Overall Score Card */}
          <Card className="card-primary p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Overall SEO Score</h2>
                <p className="text-sm text-gray-400">Combined health metric</p>
              </div>
              <Search className="h-8 w-8 text-cyan-400" />
            </div>

            <div className="flex items-end gap-4 mb-4">
              <div className="text-5xl font-bold text-white">{data.overallScore}</div>
              <div className="text-2xl text-gray-400 mb-1">/100</div>
              <Badge
                variant="outline"
                className={
                  data.overallScore >= 80
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : data.overallScore >= 60
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }
              >
                {data.overallScore >= 80 ? "Excellent" : data.overallScore >= 60 ? "Good" : "Needs Work"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Technical Health</p>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-white">{data.technicalHealth}</div>
                  <div className="text-sm text-gray-400">/100</div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                    style={{ width: `${data.technicalHealth}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Content Quality</p>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-white">{data.contentQuality}</div>
                  <div className="text-sm text-gray-400">/100</div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                    style={{ width: `${data.contentQuality}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Organic Traffic */}
            <Card className="card-secondary p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                  +{trafficChange}%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{data.organicTraffic.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Organic Traffic</p>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </Card>

            {/* Average Position */}
            <Card className="card-secondary p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Search className="h-5 w-5 text-cyan-400" />
                </div>
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                  {positionChange > 0 ? "+" : ""}
                  {positionChange}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{data.avgPosition.toFixed(1)}</p>
              <p className="text-sm text-gray-400">Avg. Position</p>
              <p className="text-xs text-muted-foreground mt-1">Across tracked keywords</p>
            </Card>

            {/* Tracked Keywords */}
            <Card className="card-secondary p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Key className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{data.trackedKeywords}</p>
              <p className="text-sm text-gray-400">Tracked Keywords</p>
              <p className="text-xs text-muted-foreground mt-1">Active monitoring</p>
            </Card>

            {/* Page Indexation */}
            <Card className="card-secondary p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Globe className="h-5 w-5 text-blue-400" />
                </div>
                <Badge
                  variant="outline"
                  className={
                    indexationRate >= 90
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  }
                >
                  {indexationRate}%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">
                {data.indexedPages}/{data.totalPages}
              </p>
              <p className="text-sm text-gray-400">Pages Indexed</p>
              <p className="text-xs text-muted-foreground mt-1">Google Search Console</p>
            </Card>
          </div>

          {/* Recent Issues */}
          {data.recentIssues > 0 && (
            <Card className="card-secondary p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div>
                    <h3 className="font-semibold text-white">Recent Issues</h3>
                    <p className="text-sm text-gray-400">
                      {data.recentIssues} {data.recentIssues === 1 ? "issue" : "issues"} require attention
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/seo/website-health">
                    View Details
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/seo/website-health">
              <Card className="card-tertiary p-4 hover:border-cyan-400/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white">Website Health</h3>
                </div>
                <p className="text-sm text-gray-400">Technical SEO audit & monitoring</p>
              </Card>
            </Link>

            <Link href="/admin/seo/content-management">
              <Card className="card-tertiary p-4 hover:border-purple-400/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Content Management</h3>
                </div>
                <p className="text-sm text-gray-400">Optimize pages & meta tags</p>
              </Card>
            </Link>

            <Link href="/admin/seo/keyword-tracking">
              <Card className="card-tertiary p-4 hover:border-green-400/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Key className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-white">Keyword Tracking</h3>
                </div>
                <p className="text-sm text-gray-400">Monitor rankings & performance</p>
              </Card>
            </Link>

            <Link href="/admin/seo/platform-monitoring">
              <Card className="card-tertiary p-4 hover:border-blue-400/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Platform Monitoring</h3>
                </div>
                <p className="text-sm text-gray-400">Search engine visibility</p>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
