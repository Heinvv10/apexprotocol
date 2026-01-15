"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Search,
  Download,
  Calendar,
  Mail,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useReports } from "@/hooks/useAnalytics";

// Mock custom reports data
const customReports = [
  {
    id: "report_001",
    name: "Weekly Executive Summary",
    description: "High-level KPIs and trends for executive team",
    category: "executive",
    schedule: "weekly",
    format: "pdf",
    recipients: ["exec@company.com", "ceo@company.com"],
    lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    metrics: ["MRR", "ARR", "Customer Count", "Lead Count", "Pipeline Value"],
    createdBy: "Admin",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "report_002",
    name: "Daily Lead Report",
    description: "New leads, MQL/SQL status, and lead scoring trends",
    category: "sales",
    schedule: "daily",
    format: "csv",
    recipients: ["sales@company.com"],
    lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    status: "active",
    metrics: ["New Leads", "Lead Score", "MQL Count", "SQL Count", "Conversion Rate"],
    createdBy: "Sales Manager",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "report_003",
    name: "Monthly Marketing ROI",
    description: "Campaign performance, spend, and ROI by channel",
    category: "marketing",
    schedule: "monthly",
    format: "pdf",
    recipients: ["marketing@company.com", "cmo@company.com"],
    lastRun: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    metrics: ["Total Spend", "Leads Generated", "Cost per Lead", "ROI", "Channel Performance"],
    createdBy: "Marketing Director",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "report_004",
    name: "Platform Visibility Report",
    description: "AI platform mentions, citations, and share of voice",
    category: "platform",
    schedule: "weekly",
    format: "excel",
    recipients: ["seo@company.com", "content@company.com"],
    lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    metrics: ["Total Mentions", "Avg Position", "Share of Voice", "Competitor Visibility"],
    createdBy: "SEO Lead",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "report_005",
    name: "Integration Health Check",
    description: "API status, error rates, and uptime for all integrations",
    category: "operations",
    schedule: "daily",
    format: "csv",
    recipients: ["ops@company.com", "devops@company.com"],
    lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    status: "active",
    metrics: ["Uptime", "Error Rate", "Avg Response Time", "Failed Requests"],
    createdBy: "DevOps",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "report_006",
    name: "Q4 Performance Review",
    description: "Comprehensive quarterly review for board presentation",
    category: "executive",
    schedule: "manual",
    format: "pdf",
    recipients: ["board@company.com"],
    lastRun: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    nextRun: null,
    status: "paused",
    metrics: ["Revenue", "Customer Growth", "Churn Rate", "ARR", "MRR", "Net Retention"],
    createdBy: "CFO",
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock alert configurations
const alertConfigurations = [
  {
    id: "alert_001",
    name: "High Churn Alert",
    metric: "Churn Rate",
    condition: "greater_than",
    threshold: 5.0,
    status: "active",
    recipients: ["exec@company.com", "customer-success@company.com"],
    lastTriggered: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    triggerCount: 2,
  },
  {
    id: "alert_002",
    name: "Low Lead Generation",
    metric: "New Leads (Daily)",
    condition: "less_than",
    threshold: 50,
    status: "active",
    recipients: ["marketing@company.com"],
    lastTriggered: null,
    triggerCount: 0,
  },
  {
    id: "alert_003",
    name: "Integration Downtime",
    metric: "Integration Uptime",
    condition: "less_than",
    threshold: 99.0,
    status: "active",
    recipients: ["ops@company.com", "devops@company.com"],
    lastTriggered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    triggerCount: 1,
  },
  {
    id: "alert_004",
    name: "Pipeline Value Drop",
    metric: "Pipeline Value",
    condition: "decreased_by",
    threshold: 20.0,
    status: "active",
    recipients: ["sales@company.com", "cro@company.com"],
    lastTriggered: null,
    triggerCount: 0,
  },
  {
    id: "alert_005",
    name: "Marketing ROI Decline",
    metric: "Marketing ROI",
    condition: "less_than",
    threshold: 2.0,
    status: "paused",
    recipients: ["marketing@company.com"],
    lastTriggered: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    triggerCount: 3,
  },
];

function formatDate(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export default function CustomReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // API data with fallback to mock data
  const { reports, totalReports: apiTotalReports, isLoading, isError, error } = useReports();

  // Use API data if available, otherwise use mock
  const data = reports.length > 0 ? reports : customReports;

  // Filter reports
  const filteredReports = data.filter((report) => {
    const searchMatch =
      searchQuery === "" ||
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryMatch = categoryFilter === "all" || report.category === categoryFilter;
    const statusMatch = statusFilter === "all" || report.status === statusFilter;

    return searchMatch && categoryMatch && statusMatch;
  });

  // Calculate summary stats
  const totalReports = data.length;
  const activeReports = data.filter((r) => r.status === "active").length;
  const scheduledReports = data.filter((r) => r.schedule !== "manual").length;
  const totalAlerts = alertConfigurations.length;
  const activeAlerts = alertConfigurations.filter((a) => a.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Custom Reports</h1>
          <p className="text-gray-400 mt-2">
            Build, schedule, and manage custom reports and alerts
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading reports data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load reports data</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching reports"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>
          {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Total Reports</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalReports}</p>
          <p className="text-xs text-gray-400 mt-1">{activeReports} active</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-gray-400">Scheduled</p>
          </div>
          <p className="text-3xl font-bold text-white">{scheduledReports}</p>
          <p className="text-xs text-gray-400 mt-1">Auto-generated</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Recipients</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {new Set(data.flatMap((r) => r.recipients)).size}
          </p>
          <p className="text-xs text-gray-400 mt-1">Unique emails</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <p className="text-sm text-gray-400">Alerts</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalAlerts}</p>
          <p className="text-xs text-gray-400 mt-1">{activeAlerts} active</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Exports</p>
          </div>
          <p className="text-3xl font-bold text-white">247</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Report List */}
      <div className="space-y-3">
        {filteredReports.map((report) => (
          <Card key={report.id} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                  <Badge
                    variant="outline"
                    className={
                      report.status === "active"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    }
                  >
                    {report.status.toUpperCase()}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 text-purple-400 border-purple-500/20"
                  >
                    {report.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                  >
                    {report.schedule}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">{report.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Format</p>
                    <p className="text-sm font-semibold text-white uppercase">{report.format}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Recipients</p>
                    <p className="text-sm font-semibold text-white">{report.recipients.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Last Run</p>
                    <p className="text-sm font-semibold text-white">
                      {formatTimestamp(report.lastRun)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Next Run</p>
                    <p className="text-sm font-semibold text-white">
                      {report.nextRun ? formatTimestamp(report.nextRun) : "Manual"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Created</p>
                    <p className="text-sm font-semibold text-white">{report.createdBy}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-2">Metrics Included</p>
                  <div className="flex flex-wrap gap-1">
                    {report.metrics.map((metric) => (
                      <Badge
                        key={metric}
                        variant="outline"
                        className="bg-gray-900/50 text-gray-300 border-gray-600 text-xs"
                      >
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button variant="ghost" size="sm">
                  <Play className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">No reports found</h3>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </Card>
      )}

      {/* Alert Configurations */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Alert Configurations</h2>
          <Button className="bg-cyan-600 hover:bg-cyan-700" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Alert
          </Button>
        </div>
        <div className="space-y-3">
          {alertConfigurations.map((alert) => (
            <div
              key={alert.id}
              className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white">{alert.name}</h3>
                    <Badge
                      variant="outline"
                      className={
                        alert.status === "active"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }
                    >
                      {alert.status.toUpperCase()}
                    </Badge>
                    {alert.lastTriggered && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      >
                        Triggered {alert.triggerCount}x
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400 mb-1">Metric</p>
                      <p className="font-semibold text-white">{alert.metric}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Condition</p>
                      <p className="font-semibold text-white">
                        {alert.condition.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Threshold</p>
                      <p className="font-semibold text-white">{alert.threshold}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Recipients</p>
                      <p className="font-semibold text-white">{alert.recipients.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Last Triggered</p>
                      <p className="font-semibold text-white">
                        {alert.lastTriggered ? formatTimestamp(alert.lastTriggered) : "Never"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm">
                    {alert.status === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
        </>
      )}
    </div>
  );
}
