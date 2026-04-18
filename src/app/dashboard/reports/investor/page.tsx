"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BrandHeader } from "@/components/layout/brand-header";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Building2,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";

// Decorative star component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientInvestor)"
        />
        <defs>
          <linearGradient id="starGradientInvestor" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(var(--color-primary))" stopOpacity="0.6"/>
            <stop offset="1" stopColor="hsl(var(--color-accent-purple))" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface Portfolio {
  id: string;
  name: string;
}

interface InvestorReport {
  id: string;
  portfolioId: string;
  portfolioName: string;
  periodStart: string;
  periodEnd: string;
  status: "completed" | "generating" | "failed";
  pdfUrl: string | null;
  createdAt: string;
}

export default function InvestorReportsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("all");
  const [periodStart, setPeriodStart] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );
  const [periodEnd, setPeriodEnd] = useState(format(new Date(), "yyyy-MM-dd"));

  // Fetch portfolios for dropdown
  const { data: portfoliosData, isLoading: portfoliosLoading } = useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const res = await fetch("/api/portfolios");
      if (!res.ok) throw new Error("Failed to fetch portfolios");
      return res.json();
    },
  });

  // Fetch investor reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ["investor-reports", selectedPortfolio, periodStart, periodEnd],
    queryFn: async () => {
      const params = new URLSearchParams({
        periodStart,
        periodEnd,
      });
      if (selectedPortfolio !== "all") {
        params.append("portfolioId", selectedPortfolio);
      }
      const res = await fetch(`/api/investor-reports?${params}`);
      if (!res.ok) throw new Error("Failed to fetch investor reports");
      return res.json();
    },
  });

  const portfolios: Portfolio[] = portfoliosData?.portfolios || [];
  const reports: InvestorReport[] = reportsData?.reports || [];

  const handleDownloadPDF = async (reportId: string, portfolioName: string) => {
    try {
      const res = await fetch(`/api/investor-reports/${reportId}/pdf`);
      if (!res.ok) throw new Error("Failed to download PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Investor_Report_${portfolioName.replace(/[^a-z0-9]/gi, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  // Generate report mutation
  const generateReport = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/investor-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId: selectedPortfolio === "all" ? null : selectedPortfolio,
          periodStart,
          periodEnd,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate report");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["investor-reports"] });
      toast.success("Report generated successfully!");

      // Automatically download the PDF if available
      if (data.report?.id && data.report?.portfolioName) {
        await handleDownloadPDF(data.report.id, data.report.portfolioName);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate report");
    },
  });

  const getStatusBadge = (status: InvestorReport["status"]) => {
    const variants = {
      completed: { variant: "default" as const, label: "Completed", color: "text-green-500" },
      generating: { variant: "outline" as const, label: "Generating", color: "text-yellow-500" },
      failed: { variant: "destructive" as const, label: "Failed", color: "text-red-500" },
    };
    const config = variants[status];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* APEX Header */}
      <BrandHeader pageName="Investor Intelligence" />

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Investor Intelligence Reports</h1>
        <p className="text-muted-foreground">
          Generate comprehensive investor reports with portfolio performance insights
        </p>
      </div>

      {/* Filters */}
      <Card className="card-secondary">
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Select a portfolio and date range to generate an investor intelligence report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio</Label>
              <Select
                value={selectedPortfolio}
                onValueChange={setSelectedPortfolio}
              >
                <SelectTrigger id="portfolio">
                  <SelectValue placeholder="Select portfolio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Portfolios</SelectItem>
                  {portfoliosLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    portfolios.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodStart">Period Start</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodEnd">Period End</Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={() => generateReport.mutate()}
                disabled={generateReport.isPending}
                className="w-full"
              >
                {generateReport.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <Card className="card-tertiary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <TrendingUp className="w-6 h-6 text-cyan-500" />
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
      </div>

      {/* Reports List */}
      <Card className="card-secondary">
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            View and download your investor intelligence reports
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
                Generate your first investor intelligence report to get started
              </p>
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
                      <h4 className="font-medium">{report.portfolioName}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(new Date(report.periodStart), "MMM d")} -{" "}
                          {format(new Date(report.periodEnd), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(report.status)}
                    <div className="flex items-center gap-1">
                      {report.status === "completed" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              window.open(`/api/investor-reports/${report.id}/preview`, "_blank");
                            }}
                            title="View Report"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(report.id, report.portfolioName)}
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decorative Star */}
      <DecorativeStar />
    </div>
  );
}
