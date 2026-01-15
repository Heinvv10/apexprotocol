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
  ExternalLink,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Edit,
} from "lucide-react";

// Mock page inventory data
const pages = [
  {
    id: "page_001",
    url: "/features/geo-optimization",
    title: "GEO Optimization Features | Apex Platform",
    metaDescription: "Optimize your content for AI search engines with Apex's advanced GEO features",
    status: "published",
    lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    traffic: 2847,
    conversions: 142,
    avgPosition: 1.8,
    citations: 234,
    schema: ["Organization", "FAQPage"],
    wordCount: 2340,
  },
  {
    id: "page_002",
    url: "/blog/getting-started-with-geo",
    title: "Getting Started with Generative Engine Optimization",
    metaDescription: "Learn how to optimize your content for ChatGPT, Claude, and other AI platforms",
    status: "published",
    lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    traffic: 1923,
    conversions: 87,
    avgPosition: 2.3,
    citations: 187,
    schema: ["Article", "HowTo"],
    wordCount: 3120,
  },
  {
    id: "page_003",
    url: "/pricing",
    title: "Pricing Plans | Apex GEO Platform",
    metaDescription: "Flexible pricing for teams of all sizes. Start optimizing for AI search today.",
    status: "published",
    lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    traffic: 3241,
    conversions: 428,
    avgPosition: 1.2,
    citations: 156,
    schema: ["Organization", "Product"],
    wordCount: 1240,
  },
  {
    id: "page_004",
    url: "/blog/ai-search-trends-2026",
    title: "AI Search Trends to Watch in 2026",
    metaDescription: "Discover emerging trends in AI-powered search and how to prepare your content",
    status: "published",
    lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    traffic: 1543,
    conversions: 64,
    avgPosition: 3.1,
    citations: 98,
    schema: ["Article"],
    wordCount: 2850,
  },
  {
    id: "page_005",
    url: "/features/competitor-tracking",
    title: "Competitor Visibility Tracking | Apex",
    metaDescription: "Track how competitors appear in AI search results and identify opportunities",
    status: "published",
    lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    traffic: 987,
    conversions: 52,
    avgPosition: 2.8,
    citations: 76,
    schema: ["Organization"],
    wordCount: 1890,
  },
  {
    id: "page_006",
    url: "/docs/api-reference",
    title: "API Reference Documentation",
    metaDescription: "Complete API reference for the Apex platform",
    status: "draft",
    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    traffic: 0,
    conversions: 0,
    avgPosition: 0,
    citations: 0,
    schema: [],
    wordCount: 4560,
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
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export default function ContentManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [schemaFilter, setSchemaFilter] = useState("all");

  // Filter pages
  const filteredPages = pages.filter((page) => {
    const searchMatch =
      searchQuery === "" ||
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.url.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = statusFilter === "all" || page.status === statusFilter;

    const schemaMatch =
      schemaFilter === "all" || page.schema.some((s) => s === schemaFilter);

    return searchMatch && statusMatch && schemaMatch;
  });

  // Calculate summary stats
  const totalPages = pages.length;
  const publishedPages = pages.filter((p) => p.status === "published").length;
  const totalTraffic = pages.reduce((sum, p) => sum + p.traffic, 0);
  const totalCitations = pages.reduce((sum, p) => sum + p.citations, 0);
  const avgPosition =
    pages.reduce((sum, p) => sum + p.avgPosition, 0) / pages.filter((p) => p.avgPosition > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management</h1>
          <p className="text-gray-400 mt-2">
            Page inventory, meta tags, and performance metrics
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <FileText className="h-4 w-4 mr-2" />
          Add Page
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Total Pages</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalPages}</p>
          <p className="text-xs text-gray-400 mt-1">{publishedPages} published</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Total Traffic</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalTraffic.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-gray-400">Total Citations</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalCitations}</p>
          <p className="text-xs text-gray-400 mt-1">AI platforms</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Avg Position</p>
          </div>
          <p className="text-3xl font-bold text-white">#{avgPosition.toFixed(1)}</p>
          <p className="text-xs text-gray-400 mt-1">In AI responses</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-yellow-400" />
            <p className="text-sm text-gray-400">Content Age</p>
          </div>
          <p className="text-3xl font-bold text-white">7d</p>
          <p className="text-xs text-gray-400 mt-1">Avg since update</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search pages by title or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={schemaFilter} onValueChange={setSchemaFilter}>
              <SelectTrigger className="w-[160px] bg-gray-900 border-gray-700">
                <SelectValue placeholder="Schema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schema</SelectItem>
                <SelectItem value="Organization">Organization</SelectItem>
                <SelectItem value="FAQPage">FAQPage</SelectItem>
                <SelectItem value="HowTo">HowTo</SelectItem>
                <SelectItem value="Article">Article</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Page List */}
      <div className="space-y-3">
        {filteredPages.map((page) => (
          <Card key={page.id} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">{page.title}</h3>
                      <Badge
                        variant="outline"
                        className={
                          page.status === "published"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }
                      >
                        {page.status.toUpperCase()}
                      </Badge>
                    </div>
                    <code className="text-sm text-cyan-400">{page.url}</code>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-sm text-gray-400 mb-3">{page.metaDescription}</p>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Traffic</p>
                    <p className="text-sm font-semibold text-white">
                      {page.traffic.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Citations</p>
                    <p className="text-sm font-semibold text-white">{page.citations}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Avg Position</p>
                    <p className="text-sm font-semibold text-white">
                      {page.avgPosition > 0 ? `#${page.avgPosition}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Conversions</p>
                    <p className="text-sm font-semibold text-white">{page.conversions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Word Count</p>
                    <p className="text-sm font-semibold text-white">
                      {page.wordCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Last Modified</p>
                    <p className="text-sm font-semibold text-white">
                      {formatTimestamp(page.lastModified)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-2">Schema Markup</p>
                  <div className="flex flex-wrap gap-1">
                    {page.schema.length > 0 ? (
                      page.schema.map((schema) => (
                        <Badge
                          key={schema}
                          variant="outline"
                          className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs"
                        >
                          {schema}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No schema implemented</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">No pages found</h3>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
