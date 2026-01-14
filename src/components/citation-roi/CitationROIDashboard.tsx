/**
 * Citation ROI Dashboard Component
 * Phase 15: AI Citation ROI Calculator
 *
 * Main dashboard showing ROI metrics, conversions, and tracking links
 */

"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Link2,
  BarChart3,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useROISummary,
  useConversions,
  useTrackingLinks,
  useDeleteTrackingLink,
  type TimePeriod,
} from "@/hooks/useCitationROI";
import { CreateTrackingLinkDialog } from "./CreateTrackingLinkDialog";
import { RecordConversionDialog } from "./RecordConversionDialog";

// =============================================================================
// Helper Components
// =============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  suffix?: string;
  loading?: boolean;
}

function MetricCard({
  title,
  value,
  change,
  icon,
  suffix = "",
  loading,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className="card-secondary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-32 mt-4" />
          <Skeleton className="h-4 w-24 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-secondary">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          {change !== undefined && (
            <Badge
              variant={change >= 0 ? "default" : "destructive"}
              className="gap-1"
            >
              {change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change).toFixed(1)}%
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-foreground">
            {value}
            {suffix}
          </p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CitationROIDashboard() {
  const { toast } = useToast();
  const [period, setPeriod] = React.useState<TimePeriod>("30d");
  const [showCreateLink, setShowCreateLink] = React.useState(false);
  const [showRecordConversion, setShowRecordConversion] = React.useState(false);

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useROISummary(period);

  const { data: conversionsData, isLoading: conversionsLoading } =
    useConversions({ limit: 5 });

  const { data: trackingLinksData, isLoading: linksLoading } =
    useTrackingLinks();

  const deleteLink = useDeleteTrackingLink();

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Tracking link copied to clipboard",
    });
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteLink.mutateAsync(linkId);
      toast({
        title: "Link Deleted",
        description: "Tracking link has been deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete link",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Citation ROI Calculator
          </h2>
          <p className="text-sm text-muted-foreground">
            Track conversions and calculate ROI from AI platform citations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetchSummary()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Conversions"
          value={summary?.totalConversions || 0}
          icon={<Target className="h-5 w-5 text-primary" />}
          loading={summaryLoading}
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(summary?.totalRevenue || 0)}
          icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
          loading={summaryLoading}
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercentage(summary?.conversionRate || 0)}
          icon={<BarChart3 className="h-5 w-5 text-purple-500" />}
          loading={summaryLoading}
        />
        <MetricCard
          title="Avg. Value"
          value={formatCurrency(summary?.averageConversionValue || 0)}
          icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
          loading={summaryLoading}
        />
      </div>

      {/* Platform Breakdown */}
      {summary?.platformBreakdown && summary.platformBreakdown.length > 0 && (
        <Card className="card-secondary">
          <CardHeader>
            <CardTitle className="text-lg">Platform Performance</CardTitle>
            <CardDescription>
              Conversions breakdown by AI platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.platformBreakdown.map((platform) => (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">
                      {platform.platform}
                    </span>
                    <span className="text-muted-foreground">
                      {platform.conversions} conversions ({formatCurrency(platform.revenue)})
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${platform.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversions */}
        <Card className="card-secondary">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Conversions</CardTitle>
              <CardDescription>
                Latest tracked conversions from AI citations
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRecordConversion(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Record
            </Button>
          </CardHeader>
          <CardContent>
            {conversionsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : conversionsData?.conversions &&
              conversionsData.conversions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversionsData.conversions.map((conversion) => (
                    <TableRow key={conversion.id}>
                      <TableCell className="font-medium capitalize">
                        {conversion.sourcePlatform}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {conversion.conversionType.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(conversion.conversionValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No conversions recorded yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Record conversions to track ROI from AI citations
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking Links */}
        <Card className="card-secondary">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tracking Links</CardTitle>
              <CardDescription>
                UTM-tagged links for citation tracking
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateLink(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </CardHeader>
          <CardContent>
            {linksLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : trackingLinksData?.links &&
              trackingLinksData.links.length > 0 ? (
              <div className="space-y-3">
                {trackingLinksData.links.slice(0, 5).map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium truncate">
                        {link.campaignName || "Untitled Link"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {link.originalUrl}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{link.clicks} clicks</span>
                        <span>{link.conversions} conversions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleCopyLink(link.trackingUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        asChild
                      >
                        <a
                          href={link.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={deleteLink.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Link2 className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No tracking links created yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create tracking links to attribute conversions to AI citations
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateTrackingLinkDialog
        open={showCreateLink}
        onOpenChange={setShowCreateLink}
      />
      <RecordConversionDialog
        open={showRecordConversion}
        onOpenChange={setShowRecordConversion}
      />
    </div>
  );
}
