"use client";

import * as React from "react";
import { Plus, Search, Filter, FileText, ChevronDown, Sparkles, PenTool, Wand2, LayoutTemplate, Bot, ArrowRight, AlertCircle, RefreshCw, MessageSquare, Users, FileCheck } from "lucide-react";

// Page Header Component
function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradCreate)" />
            <defs>
              <linearGradient id="apexGradCreate" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-foreground ml-1">Create</span>
      </div>

      {/* AI Status */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">AI Status:</span>
        <span className="text-xs text-primary font-medium">Active</span>
      </div>
    </div>
  );
}

// Decorative Star Component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientCreate)"
        />
        <defs>
          <linearGradient id="starGradientCreate" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
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
import { useSelectedBrand } from "@/stores";
import { useContentByBrand, useDeleteContent, useUpdateContent, Content } from "@/hooks/useContent";
import { formatDate } from "@/lib/utils/formatters";

// Transform API Content to UI ContentItem
function contentToItem(content: Content): ContentItem {
  // Map API type to UI type
  const typeMap: Record<string, ContentType> = {
    blog: "article",
    social: "article",
    faq: "faq",
    product: "product",
    landing: "landing",
    email: "article",
  };

  // Map API status to UI status
  const statusMap: Record<string, ContentStatus> = {
    draft: "draft",
    reviewing: "draft",
    approved: "draft",
    published: "published",
    archived: "archived",
  };

  return {
    id: content.id,
    title: content.title,
    excerpt: content.excerpt || content.content?.substring(0, 150) + "..." || "",
    status: statusMap[content.status] || "draft",
    type: typeMap[content.type] || "article",
    createdAt: formatDate(content.createdAt, "short"),
    updatedAt: formatDate(content.updatedAt, "short"),
    wordCount: content.wordCount || content.content?.split(/\s+/).length || 0,
    aiScore: content.seoScore,
  };
}

// Prompt to select a brand
function SelectBrandPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-lg space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Bot className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Select a Brand to Create Content</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to create AI-optimized content with brand voice and keywords.
          </p>
        </div>
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/30 font-medium hover:bg-primary/20 transition-all"
        >
          Manage Brands
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Loading state component
function ContentLoadingState() {
  return (
    <div className="space-y-4" data-testid="content-loading">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card-secondary p-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-muted rounded-lg" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-3 w-2/3 bg-muted rounded" />
              <div className="flex gap-4">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Error state component
function ContentErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-error/10 border border-error/30 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-error" />
      </div>
      <h4 className="text-lg font-semibold text-foreground mb-2">Failed to Load Content</h4>
      <p className="text-muted-foreground text-sm mb-4">{error.message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

// Brand voice info panel
function BrandVoicePanel({ brand }: { brand: { voice?: { tone?: string; targetAudience?: string; personality?: string[]; keyMessages?: string[] } } }) {
  if (!brand?.voice) return null;

  const { tone, targetAudience, personality, keyMessages } = brand.voice;

  return (
    <div className="card-secondary p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Brand Voice</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {tone && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tone:</span>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">{tone}</span>
          </div>
        )}
        {targetAudience && (
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Audience:</span>
            <span className="text-xs text-foreground">{targetAudience}</span>
          </div>
        )}
      </div>
      {personality && personality.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {personality.map((trait) => (
            <span key={trait} className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/10 text-accent-purple">
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Empty state component for when no content exists
function CreateEmptyState() {
  const contentTypes = [
    { icon: FileCheck, title: "Content Briefs", description: "AI-optimized briefs with headers, questions, entities", href: "/dashboard/create/brief" },
    { icon: Bot, title: "Generate AI Content", description: "Create blog posts, FAQs, and press releases with AI", href: "/dashboard/create/generate" },
    { icon: FileText, title: "Articles", description: "Long-form content optimized for AI citation", href: "/dashboard/create/new" },
    { icon: LayoutTemplate, title: "Landing Pages", description: "Conversion-focused pages with structured data", href: "/dashboard/create/new" },
    { icon: Wand2, title: "FAQs", description: "Question-answer format for AI comprehension", href: "/dashboard/create/new" },
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
            <Link
              key={type.title}
              href={type.href}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <type.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{type.title}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
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
  // Get selected brand from global state
  const selectedBrand = useSelectedBrand();

  // Fetch content for selected brand
  const {
    data: contentResponse,
    isLoading,
    error,
    refetch,
  } = useContentByBrand(selectedBrand?.id || "", {
    limit: 50,
  });

  // Mutations
  const deleteContentMutation = useDeleteContent();
  const updateContentMutation = useUpdateContent();

  // Transform API content to UI format
  const content: ContentItem[] = React.useMemo(() => {
    if (!contentResponse?.content) return [];
    return contentResponse.content.map(contentToItem);
  }, [contentResponse]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ContentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = React.useState<ContentType | "all">("all");

  // Check if there's any content
  const hasContent = content.length > 0;

  const handleDelete = (id: string) => {
    deleteContentMutation.mutate(id);
  };

  const handleStatusChange = (id: string, status: ContentStatus) => {
    // Map UI status to API status
    const statusMap: Record<ContentStatus, string> = {
      draft: "draft",
      published: "published",
      scheduled: "draft", // scheduled needs special handling
      archived: "archived",
    };
    updateContentMutation.mutate({
      id,
      data: { status: statusMap[status] as "draft" | "published" | "archived" },
    });
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

  // Show select brand prompt if no brand selected
  if (!selectedBrand) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        <SelectBrandPrompt />
        <DecorativeStar />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        <ContentLoadingState />
        <DecorativeStar />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        <ContentErrorState error={error as Error} onRetry={() => refetch()} />
        <DecorativeStar />
      </div>
    );
  }

  // Show empty state if no content at all
  if (!hasContent) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        {/* Brand Voice Panel */}
        <BrandVoicePanel brand={selectedBrand} />
        <CreateEmptyState />
        <DecorativeStar />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Page Header */}
      <PageHeader />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2">
        <Link href="/dashboard/create/brief">
          <Button variant="outline">
            <FileCheck className="mr-2 h-4 w-4" />
            Generate Brief
          </Button>
        </Link>
        <Link href="/dashboard/create/generate">
          <Button variant="outline">
            <Bot className="mr-2 h-4 w-4" />
            Generate AI Content
          </Button>
        </Link>
        <Link href="/dashboard/create/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        </Link>
      </div>

      {/* Brand Voice Panel */}
      <BrandVoicePanel brand={selectedBrand} />

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

      {/* Decorative Star */}
      <DecorativeStar />
    </div>
  );
}
