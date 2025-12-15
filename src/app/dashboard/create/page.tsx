"use client";

import * as React from "react";
import { Plus, Search, Filter, FileText, ChevronDown, Sparkles, PenTool, Wand2, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { ContentCard, ContentItem, ContentStatus, ContentType } from "@/components/create";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Empty state component for when no content exists
function CreateEmptyState() {
  const contentTypes = [
    { icon: FileText, title: "Articles", description: "Long-form content optimized for AI citation" },
    { icon: LayoutTemplate, title: "Landing Pages", description: "Conversion-focused pages with structured data" },
    { icon: Wand2, title: "FAQs", description: "Question-answer format for AI comprehension" },
  ];

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-lg space-y-8">
        {/* Animated icon */}
        <div className="relative mx-auto w-24 h-24">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-24 h-24 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <PenTool className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">AI-Optimized Content</span>
        </div>

        {/* Title and description */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            No Content Yet
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Start creating AI-optimized content that ranks well across ChatGPT, Claude, Gemini, and other AI platforms.
          </p>
        </div>

        {/* Content type preview */}
        <div className="grid gap-3">
          {contentTypes.map((type) => (
            <div
              key={type.title}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <type.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{type.title}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          href="/dashboard/create/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(0,229,204,0.3)] hover:shadow-[0_0_35px_rgba(0,229,204,0.4)]"
        >
          <Plus className="w-5 h-5" />
          Create Your First Content
        </Link>
      </div>
    </div>
  );
}

const statusOptions: { value: ContentStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

const typeOptions: { value: ContentType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "article", label: "Articles" },
  { value: "faq", label: "FAQs" },
  { value: "landing", label: "Landing Pages" },
  { value: "product", label: "Product Pages" },
];

export default function CreatePage() {
  // TODO: Fetch content from API endpoint
  // const { data: contentData } = useQuery(['content'], fetchContent);
  const [content, setContent] = React.useState<ContentItem[]>([]); // Empty array - no mock data
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ContentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = React.useState<ContentType | "all">("all");

  // Check if there's any content
  const hasContent = content.length > 0;

  const handleDelete = (id: string) => {
    setContent((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStatusChange = (id: string, status: ContentStatus) => {
    setContent((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status, updatedAt: "Just now" } : item
      )
    );
  };

  // Filter content
  const filteredContent = content.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats
  const stats = {
    total: content.length,
    published: content.filter((c) => c.status === "published").length,
    draft: content.filter((c) => c.status === "draft").length,
    scheduled: content.filter((c) => c.status === "scheduled").length,
  };

  const currentStatusLabel = statusOptions.find((o) => o.value === statusFilter)?.label || "All Status";
  const currentTypeLabel = typeOptions.find((o) => o.value === typeFilter)?.label || "All Types";

  // Show empty state if no content at all
  if (!hasContent) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create</h2>
            <p className="text-muted-foreground">
              Generate and manage AI-optimized content
            </p>
          </div>
        </div>
        <CreateEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create</h2>
          <p className="text-muted-foreground">
            Generate and manage AI-optimized content
          </p>
        </div>
        <Link href="/dashboard/create/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card-tertiary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Content</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div className="card-tertiary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold mt-1 text-success">{stats.published}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-success" />
          </div>
        </div>
        <div className="card-tertiary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-bold mt-1 text-warning">{stats.draft}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-warning" />
          </div>
        </div>
        <div className="card-tertiary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold mt-1 text-accent-blue">{stats.scheduled}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-accent-blue" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[160px] justify-between">
              <span className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                {currentStatusLabel}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            {statusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={statusFilter === option.value ? "bg-accent" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[160px] justify-between">
              <span className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                {currentTypeLabel}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            {typeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTypeFilter(option.value)}
                className={typeFilter === option.value ? "bg-accent" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {filteredContent.length > 0 ? (
          filteredContent.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))
        ) : (
          <div className="card-secondary text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>

      {/* Results count */}
      {filteredContent.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredContent.length} of {content.length} items
        </p>
      )}
    </div>
  );
}
