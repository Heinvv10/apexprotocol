"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Smartphone,
  Lock,
  Link,
  FileText,
  Gauge,
  RefreshCw,
} from "lucide-react";

// Mock data for technical SEO health check
const healthChecks = {
  overall: {
    score: 87,
    status: "good", // "good" | "warning" | "critical"
    lastChecked: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    checksRun: 12,
    checksPassed: 10,
    checksWarning: 1,
    checksFailed: 1,
  },
  performance: {
    status: "good",
    score: 92,
    metrics: {
      lcp: { value: 1.8, threshold: 2.5, unit: "s", status: "good" }, // Largest Contentful Paint
      fid: { value: 45, threshold: 100, unit: "ms", status: "good" }, // First Input Delay
      cls: { value: 0.08, threshold: 0.1, unit: "", status: "good" }, // Cumulative Layout Shift
      ttfb: { value: 320, threshold: 600, unit: "ms", status: "good" }, // Time to First Byte
      fcp: { value: 1.2, threshold: 1.8, unit: "s", status: "good" }, // First Contentful Paint
    },
  },
  mobile: {
    status: "good",
    score: 89,
    checks: [
      { name: "Mobile-Friendly Test", status: "pass", details: "Page is mobile-friendly" },
      { name: "Viewport Meta Tag", status: "pass", details: "Properly configured" },
      { name: "Text Readability", status: "pass", details: "Text is easily readable" },
      { name: "Tap Targets", status: "warning", details: "Some buttons are close together" },
      { name: "Mobile Speed", status: "pass", details: "Load time: 2.1s" },
    ],
  },
  security: {
    status: "good",
    score: 95,
    checks: [
      { name: "HTTPS", status: "pass", details: "SSL certificate valid" },
      { name: "Mixed Content", status: "pass", details: "No mixed content detected" },
      { name: "Security Headers", status: "pass", details: "All headers configured" },
      { name: "Certificate Expiry", status: "pass", details: "Expires in 87 days" },
    ],
  },
  technical: {
    status: "warning",
    checks: [
      { name: "Robots.txt", status: "pass", details: "File found and valid" },
      { name: "Sitemap.xml", status: "pass", details: "Sitemap found and valid (247 URLs)" },
      { name: "Canonical Tags", status: "pass", details: "Properly implemented" },
      { name: "Structured Data", status: "pass", details: "4 schema types found" },
      { name: "404 Errors", status: "warning", details: "12 broken links found" },
      { name: "Redirect Chains", status: "pass", details: "No redirect chains detected" },
    ],
  },
};

// Mock broken links data
const brokenLinks = [
  {
    id: "broken_001",
    sourceUrl: "/blog/getting-started-with-geo",
    brokenUrl: "/docs/api-reference-v1",
    statusCode: 404,
    lastChecked: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    occurrences: 3,
  },
  {
    id: "broken_002",
    sourceUrl: "/features/monitoring",
    brokenUrl: "https://external-site.com/resource",
    statusCode: 404,
    lastChecked: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    occurrences: 1,
  },
  {
    id: "broken_003",
    sourceUrl: "/pricing",
    brokenUrl: "/contact-sales",
    statusCode: 404,
    lastChecked: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    occurrences: 2,
  },
];

// Mock schema validation data
const schemaValidation = [
  {
    type: "Organization",
    pagesImplemented: 1,
    status: "valid",
    issues: 0,
    warnings: 0,
  },
  {
    type: "FAQPage",
    pagesImplemented: 45,
    status: "valid",
    issues: 0,
    warnings: 2,
  },
  {
    type: "HowTo",
    pagesImplemented: 32,
    status: "valid",
    issues: 0,
    warnings: 0,
  },
  {
    type: "Article",
    pagesImplemented: 78,
    status: "warning",
    issues: 0,
    warnings: 5,
  },
];

function getStatusIcon(status: string) {
  switch (status) {
    case "pass":
    case "good":
    case "valid":
      return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    case "warning":
      return <AlertCircle className="h-5 w-5 text-yellow-400" />;
    case "fail":
    case "critical":
    case "error":
      return <XCircle className="h-5 w-5 text-red-400" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pass":
    case "good":
    case "valid":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
          {status.toUpperCase()}
        </Badge>
      );
    case "warning":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
          WARNING
        </Badge>
      );
    case "fail":
    case "critical":
    case "error":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
          {status.toUpperCase()}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
          UNKNOWN
        </Badge>
      );
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function WebsiteHealthPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Website Health</h1>
          <p className="text-gray-400 mt-2">
            Technical SEO audit and site health monitoring
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Run Health Check
        </Button>
      </div>

      {/* Overall Health Score */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Gauge className="h-6 w-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Overall Health Score</h2>
            </div>
            <p className="text-sm text-gray-400">
              Last checked {formatTimestamp(healthChecks.overall.lastChecked)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-cyan-400 mb-1">
              {healthChecks.overall.score}
            </div>
            <p className="text-sm text-gray-400">out of 100</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-2xl font-semibold text-white">
                {healthChecks.overall.checksPassed}
              </span>
            </div>
            <p className="text-sm text-gray-400">Passed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <span className="text-2xl font-semibold text-white">
                {healthChecks.overall.checksWarning}
              </span>
            </div>
            <p className="text-sm text-gray-400">Warnings</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="h-5 w-5 text-red-400" />
              <span className="text-2xl font-semibold text-white">
                {healthChecks.overall.checksFailed}
              </span>
            </div>
            <p className="text-sm text-gray-400">Failed</p>
          </div>
        </div>
      </Card>

      {/* Core Web Vitals */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(healthChecks.performance.metrics).map(([key, metric]) => (
            <Card key={key} className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{key.toUpperCase()}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{metric.value}</span>
                    <span className="text-sm text-gray-400">{metric.unit}</span>
                  </div>
                </div>
                {getStatusIcon(metric.status)}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metric.status === "good"
                      ? "bg-gradient-to-r from-green-500 to-green-600"
                      : metric.status === "warning"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                      : "bg-gradient-to-r from-red-500 to-red-600"
                  }`}
                  style={{
                    width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Threshold: {metric.threshold}
                {metric.unit}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mobile Responsiveness */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Mobile Responsiveness</h3>
            </div>
            {getStatusBadge(healthChecks.mobile.status)}
          </div>

          <div className="space-y-3">
            {healthChecks.mobile.checks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between pb-3 border-b border-gray-700 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-2">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="text-sm font-medium text-white">{check.name}</p>
                    <p className="text-xs text-gray-400">{check.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Security */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Security</h3>
            </div>
            {getStatusBadge(healthChecks.security.status)}
          </div>

          <div className="space-y-3">
            {healthChecks.security.checks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between pb-3 border-b border-gray-700 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-2">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="text-sm font-medium text-white">{check.name}</p>
                    <p className="text-xs text-gray-400">{check.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Technical SEO */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Technical SEO</h3>
          </div>
          {getStatusBadge(healthChecks.technical.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthChecks.technical.checks.map((check, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 pb-4 border-b border-gray-700 last:border-0"
            >
              {getStatusIcon(check.status)}
              <div>
                <p className="text-sm font-medium text-white">{check.name}</p>
                <p className="text-xs text-gray-400">{check.details}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Broken Links */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Broken Links</h3>
          </div>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            {brokenLinks.length} FOUND
          </Badge>
        </div>

        <div className="space-y-3">
          {brokenLinks.map((link) => (
            <div key={link.id} className="p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white mb-1">Source Page</p>
                  <code className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {link.sourceUrl}
                  </code>
                </div>
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                  {link.statusCode}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-1">Broken URL</p>
                <code className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                  {link.brokenUrl}
                </code>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>{link.occurrences} occurrence(s)</span>
                <span>Checked {formatTimestamp(link.lastChecked)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Schema Validation */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Schema Markup Validation</h3>
        </div>

        <div className="space-y-3">
          {schemaValidation.map((schema, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between pb-3 border-b border-gray-700 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(schema.status)}
                <div>
                  <p className="text-sm font-medium text-white">{schema.type}</p>
                  <p className="text-xs text-gray-400">
                    {schema.pagesImplemented} page(s) • {schema.issues} issue(s) •{" "}
                    {schema.warnings} warning(s)
                  </p>
                </div>
              </div>
              {getStatusBadge(schema.status)}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
