"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  FileText,
  Plus,
  Download,
  Eye,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/toast";

interface Report {
  id: string;
  title: string;
  portfolioId: string | null;
  portfolioName: string | null;
  periodStart: string;
  periodEnd: string;
  status: "scheduled" | "generating" | "completed" | "failed";
  pdfUrl: string | null;
  pdfGeneratedAt: string | null;
  recipients: string[];
  createdAt: string;
  updatedAt: string;
}

interface Portfolio {
  id: string;
  name: string;
}

interface ReportContent {
  summary: {
    headline: string;
    keyMetrics: Array<{
      label: string;
      value: number | string;
      change: number;
      changeDirection: "up" | "down" | "stable";
    }>;
    highlights: string[];
  };
  scores: {
    unified: { current: number; previous: number; trend: number[] };
    seo: { current: number; previous: number; trend: number[] };
    geo: { current: number; previous: number; trend: number[] };
    aeo: { current: number; previous: number; trend: number[] };
  };
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newReport, setNewReport] = useState({
    title: "",
    portfolioId: "",
    reportType: "custom",
    periodStart: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    periodEnd: format(new Date(), "yyyy-MM-dd"),
  });

  // Fetch reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports?limit=50");
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });

  // Fetch portfolios for dropdown
  const { data: portfoliosData } = useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const res = await fetch("/api/portfolios");
      if (!res.ok) throw new Error("Failed to fetch portfolios");
      return res.json();
    },
  });

  // Fetch single report with content
  const { data: reportDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["report", selectedReport?.id],
    queryFn: async () => {
      if (!selectedReport?.id) return null;
      const res = await fetch(`/api/reports/${selectedReport.id}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    enabled: !!selectedReport?.id && isViewOpen,
  });

  // Create report mutation
  const createReport = useMutation({
    mutationFn: async (data: typeof newReport) => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create report");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setIsCreateOpen(false);
      setNewReport({
        title: "",
        portfolioId: "",
        reportType: "custom",
        periodStart: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        periodEnd: format(new Date(), "yyyy-MM-dd"),
      });
      toast.success("Report created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete report mutation
  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete report");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report deleted");
    },
    onError: () => {
      toast.error("Failed to delete report");
    },
  });

  const reports: Report[] = reportsData?.reports || [];
  const portfolios: Portfolio[] = portfoliosData?.portfolios || [];

  const getStatusBadge = (status: Report["status"]) => {
    const variants: Record<Report["status"], { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      scheduled: { variant: "secondary", icon: <Clock className="w-3 h-3 mr-1" /> },
      generating: { variant: "outline", icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" /> },
      completed: { variant: "default", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      failed: { variant: "destructive", icon: <AlertCircle className="w-3 h-3 mr-1" /> },
    };
    const config = variants[status];
    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleDownloadPDF = async (reportId: string, title: string) => {
    try {
      toast.info("Generating PDF...");
      const res = await fetch(`/api/reports/${reportId}/pdf`);
      if (!res.ok) throw new Error("Failed to download PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Executive Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage executive summary reports
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Executive Report</DialogTitle>
              <DialogDescription>
                Generate a new executive summary report for your brand or portfolio.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  placeholder="Monthly Performance Report"
                  value={newReport.title}
                  onChange={(e) =>
                    setNewReport({ ...newReport, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio (Optional)</Label>
                <Select
                  value={newReport.portfolioId || "all"}
                  onValueChange={(value) =>
                    setNewReport({ ...newReport, portfolioId: value === "all" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All brands</SelectItem>
                    {portfolios.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={newReport.reportType}
                  onValueChange={(value) =>
                    setNewReport({ ...newReport, reportType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Report</SelectItem>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="custom">Custom Period</SelectItem>
                    <SelectItem value="audit">Audit Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart">Period Start</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={newReport.periodStart}
                    onChange={(e) =>
                      setNewReport({ ...newReport, periodStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodEnd">Period End</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={newReport.periodEnd}
                    onChange={(e) =>
                      setNewReport({ ...newReport, periodEnd: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => createReport.mutate(newReport)}
                disabled={!newReport.title || createReport.isPending}
              >
                {createReport.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Report"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-tertiary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-tertiary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {reports.filter((r) => r.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-tertiary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">
                  {reports.filter((r) => r.status === "scheduled").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-tertiary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Building2 className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Portfolios</p>
                <p className="text-2xl font-bold">{portfolios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="card-secondary">
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            View and manage your executive reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No reports yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first executive report to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{report.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(new Date(report.periodStart), "MMM d")} -{" "}
                          {format(new Date(report.periodEnd), "MMM d, yyyy")}
                        </span>
                        {report.portfolioName && (
                          <>
                            <span className="mx-1">|</span>
                            <Building2 className="w-3 h-3" />
                            <span>{report.portfolioName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(report.status)}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedReport(report);
                          setIsViewOpen(true);
                        }}
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {report.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPDF(report.id, report.title)}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteReport.mutate(report.id)}
                        title="Delete Report"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              {selectedReport && (
                <>
                  {format(new Date(selectedReport.periodStart), "MMM d")} -{" "}
                  {format(new Date(selectedReport.periodEnd), "MMM d, yyyy")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportDetails?.report?.content ? (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-muted-foreground">
                  {reportDetails.report.content.summary?.headline}
                </p>
              </div>

              {/* Key Metrics */}
              {reportDetails.report.content.summary?.keyMetrics && (
                <div>
                  <h3 className="font-semibold mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {reportDetails.report.content.summary.keyMetrics.map(
                      (metric: { label: string; value: number | string; change: number; changeDirection: string }, index: number) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-background/50 border border-border/50"
                        >
                          <p className="text-sm text-muted-foreground">
                            {metric.label}
                          </p>
                          <p className="text-xl font-bold">{metric.value}</p>
                          <p
                            className={`text-sm ${
                              metric.changeDirection === "up"
                                ? "text-green-500"
                                : metric.changeDirection === "down"
                                ? "text-red-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {metric.change > 0 ? "+" : ""}
                            {metric.change}%
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Scores */}
              {reportDetails.report.content.scores && (
                <div>
                  <h3 className="font-semibold mb-3">Visibility Scores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(reportDetails.report.content.scores).map(
                      ([key, data]: [string, unknown]) => {
                        const scoreData = data as { current: number; previous: number };
                        return (
                          <div
                            key={key}
                            className="p-3 rounded-lg bg-background/50 border border-border/50"
                          >
                            <p className="text-sm text-muted-foreground uppercase">
                              {key}
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              {scoreData.current}
                            </p>
                            <p
                              className={`text-sm ${
                                scoreData.current >= scoreData.previous
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {scoreData.current >= scoreData.previous ? "+" : ""}
                              {scoreData.current - scoreData.previous} from previous
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {reportDetails.report.content.summary?.highlights && (
                <div>
                  <h3 className="font-semibold mb-2">Highlights</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {reportDetails.report.content.summary.highlights.map(
                      (highlight: string, index: number) => (
                        <li key={index}>{highlight}</li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Insights */}
              {reportDetails.report.content.insights && (
                <div>
                  <h3 className="font-semibold mb-2">Insights & Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {reportDetails.report.content.insights.map(
                      (insight: string, index: number) => (
                        <li key={index}>{insight}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No report content available
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            {selectedReport?.status === "completed" && (
              <Button
                onClick={() =>
                  selectedReport &&
                  handleDownloadPDF(selectedReport.id, selectedReport.title)
                }
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
