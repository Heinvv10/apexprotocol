"use client";

/**
 * Developer Checklist Component
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 * Requirements: FR-4.1 through FR-4.6
 *
 * A printable technical checklist that users can hand to their developers.
 * Includes schema markup implementation, technical SEO, content structure,
 * and crawlability recommendations.
 */

import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Printer, Download, Copy, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

/**
 * Checklist item interface
 */
export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  priority: "critical" | "high" | "medium" | "low";
  estimatedTime?: string;
  codeSnippet?: string;
  resourceLink?: string;
  aiPlatformImpact?: string[];
}

/**
 * Checklist category type
 */
export type ChecklistCategory =
  | "schema_markup"
  | "technical_seo"
  | "content_structure"
  | "crawlability"
  | "performance";

/**
 * Checklist category configuration
 */
interface CategoryConfig {
  label: string;
  description: string;
  icon: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Category configurations
 */
const CATEGORY_CONFIGS: Record<ChecklistCategory, CategoryConfig> = {
  schema_markup: {
    label: "Schema Markup Implementation",
    description: "JSON-LD structured data for AI platforms",
    icon: "{ }",
  },
  technical_seo: {
    label: "Technical SEO for AI",
    description: "Meta tags, headers, and page structure",
    icon: "</>",
  },
  content_structure: {
    label: "Content Structure",
    description: "Headings, summaries, and formatting",
    icon: "H1",
  },
  crawlability: {
    label: "Crawlability",
    description: "Sitemap, robots.txt, and link health",
    icon: "Bot",
  },
  performance: {
    label: "Performance",
    description: "Page speed and core web vitals",
    icon: "Zap",
  },
};

/**
 * Default checklist items
 */
const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  // Schema Markup
  {
    id: "schema-org",
    title: "Add Organization Schema to Homepage",
    description: "Helps AI understand your brand identity and basic company information.",
    category: "schema_markup",
    priority: "critical",
    estimatedTime: "30 minutes",
    codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[BRAND_NAME]",
  "url": "[WEBSITE_URL]",
  "logo": "[LOGO_URL]",
  "description": "[COMPANY_DESCRIPTION]",
  "sameAs": [
    "[LINKEDIN_URL]",
    "[TWITTER_URL]"
  ]
}
</script>`,
    resourceLink: "https://schema.org/Organization",
    aiPlatformImpact: ["ChatGPT", "Claude", "Gemini", "Perplexity"],
  },
  {
    id: "schema-faq",
    title: "Add FAQ Schema to FAQ/Support Pages",
    description: "AI platforms specifically look for FAQ schema to answer user questions.",
    category: "schema_markup",
    priority: "critical",
    estimatedTime: "1 hour",
    codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "[QUESTION_1]",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "[ANSWER_1]"
    }
  }]
}
</script>`,
    resourceLink: "https://schema.org/FAQPage",
    aiPlatformImpact: ["ChatGPT", "Claude", "Perplexity", "Gemini"],
  },
  {
    id: "schema-article",
    title: "Add Article Schema to Blog Posts",
    description: "Helps AI understand and cite your content with proper attribution.",
    category: "schema_markup",
    priority: "high",
    estimatedTime: "30 minutes per article",
    codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[ARTICLE_TITLE]",
  "datePublished": "[PUBLISH_DATE]",
  "dateModified": "[MODIFIED_DATE]",
  "author": {
    "@type": "Person",
    "name": "[AUTHOR_NAME]"
  }
}
</script>`,
    resourceLink: "https://schema.org/Article",
    aiPlatformImpact: ["Perplexity", "ChatGPT", "Claude"],
  },
  {
    id: "schema-product",
    title: "Add Product Schema to Product Pages",
    description: "Enables AI to provide accurate product information.",
    category: "schema_markup",
    priority: "high",
    estimatedTime: "30 minutes per product",
    resourceLink: "https://schema.org/Product",
    aiPlatformImpact: ["ChatGPT", "Gemini", "Copilot"],
  },
  {
    id: "schema-howto",
    title: "Add HowTo Schema to Tutorial Pages",
    description: "Structured step-by-step content for how-to queries.",
    category: "schema_markup",
    priority: "medium",
    estimatedTime: "45 minutes per tutorial",
    resourceLink: "https://schema.org/HowTo",
    aiPlatformImpact: ["ChatGPT", "Perplexity", "Gemini"],
  },
  {
    id: "schema-breadcrumb",
    title: "Add BreadcrumbList to All Pages",
    description: "Helps AI understand site structure and navigation.",
    category: "schema_markup",
    priority: "medium",
    estimatedTime: "1 hour (site-wide)",
    resourceLink: "https://schema.org/BreadcrumbList",
    aiPlatformImpact: ["ChatGPT", "Gemini"],
  },
  {
    id: "schema-validate",
    title: "Validate All Schema at validator.schema.org",
    description: "Ensure all schema markup is error-free and properly formatted.",
    category: "schema_markup",
    priority: "critical",
    estimatedTime: "30 minutes",
    resourceLink: "https://validator.schema.org/",
    aiPlatformImpact: ["All platforms"],
  },

  // Technical SEO
  {
    id: "meta-titles",
    title: "Unique Meta Titles (50-60 chars)",
    description: "Each page should have a unique, descriptive title tag.",
    category: "technical_seo",
    priority: "critical",
    estimatedTime: "2 hours (site-wide audit)",
    aiPlatformImpact: ["All platforms"],
  },
  {
    id: "meta-descriptions",
    title: "Meta Descriptions (150-160 chars)",
    description: "Descriptive meta descriptions with brand name and key information.",
    category: "technical_seo",
    priority: "critical",
    estimatedTime: "2 hours (site-wide)",
    codeSnippet: `<meta name="description" content="[BRAND_NAME] offers [WHAT] for [WHO]. [KEY_DIFFERENTIATOR]. [CALL_TO_ACTION]." />`,
    aiPlatformImpact: ["All platforms"],
  },
  {
    id: "heading-hierarchy",
    title: "Proper Heading Hierarchy (H1 to H3)",
    description: "Use semantic headings in correct order on all pages.",
    category: "technical_seo",
    priority: "high",
    estimatedTime: "1 hour per page",
    aiPlatformImpact: ["All platforms"],
  },
  {
    id: "alt-text",
    title: "Descriptive Alt Text for All Images",
    description: "Alt text should describe the image content, not just 'image1.jpg'.",
    category: "technical_seo",
    priority: "high",
    estimatedTime: "30 minutes per page",
    aiPlatformImpact: ["Gemini", "ChatGPT"],
  },
  {
    id: "last-updated",
    title: "Add 'Last Updated' Dates to Content",
    description: "Visible dates help AI determine content freshness.",
    category: "technical_seo",
    priority: "high",
    estimatedTime: "1 hour (site-wide)",
    aiPlatformImpact: ["Perplexity", "ChatGPT", "Claude"],
  },
  {
    id: "mobile-responsive",
    title: "Mobile-Responsive Design",
    description: "Ensure all pages work well on mobile devices.",
    category: "technical_seo",
    priority: "critical",
    estimatedTime: "Varies",
    aiPlatformImpact: ["All platforms"],
  },

  // Content Structure
  {
    id: "content-summary",
    title: "Add Key Takeaways/Summary to Articles",
    description: "AI often cites summaries directly in responses.",
    category: "content_structure",
    priority: "high",
    estimatedTime: "15 minutes per article",
    codeSnippet: `<div class="key-takeaway">
  <strong>Key Takeaway:</strong> [ONE_SENTENCE_SUMMARY_AI_CAN_QUOTE]
</div>`,
    aiPlatformImpact: ["ChatGPT", "Claude", "Perplexity"],
  },
  {
    id: "content-faq",
    title: "Add FAQ Section to Major Pages",
    description: "Anticipate and answer common questions on each page.",
    category: "content_structure",
    priority: "high",
    estimatedTime: "30 minutes per page",
    aiPlatformImpact: ["ChatGPT", "Claude", "Perplexity", "Gemini"],
  },
  {
    id: "content-lists",
    title: "Use Bullet Points and Numbered Lists",
    description: "Structured content is easier for AI to parse and cite.",
    category: "content_structure",
    priority: "medium",
    estimatedTime: "1 hour per page",
    aiPlatformImpact: ["All platforms"],
  },
  {
    id: "content-toc",
    title: "Table of Contents for Long Articles",
    description: "Helps AI navigate and understand content structure.",
    category: "content_structure",
    priority: "medium",
    estimatedTime: "15 minutes per article",
    aiPlatformImpact: ["Perplexity", "Gemini"],
  },
  {
    id: "content-internal-links",
    title: "Internal Links Between Related Content",
    description: "Connect related articles to help AI understand context.",
    category: "content_structure",
    priority: "medium",
    estimatedTime: "30 minutes per page",
    aiPlatformImpact: ["All platforms"],
  },

  // Crawlability
  {
    id: "sitemap-submit",
    title: "Submit Sitemap to Google Search Console",
    description: "Ensure your sitemap is submitted and regularly updated.",
    category: "crawlability",
    priority: "critical",
    estimatedTime: "30 minutes",
    resourceLink: "https://search.google.com/search-console",
    aiPlatformImpact: ["All platforms"],
  },
  {
    id: "robots-check",
    title: "Check robots.txt Configuration",
    description: "Ensure important pages are not blocked from crawling.",
    category: "crawlability",
    priority: "critical",
    estimatedTime: "15 minutes",
    aiPlatformImpact: ["All platforms"],
  },
  {
    id: "fix-404",
    title: "Fix All Broken Links (404 Errors)",
    description: "Broken links hurt crawlability and user experience.",
    category: "crawlability",
    priority: "high",
    estimatedTime: "Varies",
    aiPlatformImpact: ["All platforms"],
  },
  {
    id: "canonical-urls",
    title: "Implement Canonical URLs",
    description: "Prevent duplicate content issues with canonical tags.",
    category: "crawlability",
    priority: "high",
    estimatedTime: "1 hour (site-wide)",
    codeSnippet: `<link rel="canonical" href="[CANONICAL_URL]" />`,
    aiPlatformImpact: ["All platforms"],
  },

  // Performance
  {
    id: "page-speed",
    title: "Page Load Time Under 3 Seconds",
    description: "Fast-loading pages are more likely to be crawled and indexed.",
    category: "performance",
    priority: "critical",
    estimatedTime: "Varies",
    resourceLink: "https://pagespeed.web.dev/",
    aiPlatformImpact: ["All platforms"],
  },
  {
    id: "lcp-optimize",
    title: "Optimize Largest Contentful Paint (LCP)",
    description: "Target LCP under 2.5 seconds for optimal performance.",
    category: "performance",
    priority: "high",
    estimatedTime: "Varies",
    aiPlatformImpact: ["All platforms"],
  },
  {
    id: "image-optimization",
    title: "Optimize Images (WebP, lazy loading)",
    description: "Use modern image formats and lazy loading for performance.",
    category: "performance",
    priority: "high",
    estimatedTime: "2-4 hours",
    aiPlatformImpact: ["All platforms"],
  },
];

// ============================================================================
// Components
// ============================================================================

/**
 * Priority badge component
 */
function PriorityBadge({ priority }: { priority: ChecklistItem["priority"] }) {
  const colors = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 text-xs font-medium rounded border uppercase",
        colors[priority]
      )}
    >
      {priority}
    </span>
  );
}

/**
 * Code snippet component with copy functionality
 */
function CodeSnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-2">
      <pre className="bg-[#0d1321] border border-white/10 rounded-lg p-3 text-xs overflow-x-auto font-mono text-gray-300">
        {code}
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 w-7 p-0"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-400" />
        ) : (
          <Copy className="h-3 w-3 text-gray-400" />
        )}
      </Button>
    </div>
  );
}

/**
 * Checklist item component
 */
function ChecklistItemRow({
  item,
  checked,
  onToggle,
  showDetails,
}: {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
  showDetails: boolean;
}) {
  return (
    <div
      className={cn(
        "p-4 border border-white/10 rounded-lg transition-colors",
        checked ? "bg-green-500/5 border-green-500/20" : "bg-[#141930]/50"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0"
          aria-label={checked ? "Mark as incomplete" : "Mark as complete"}
        >
          {checked ? (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          ) : (
            <Circle className="h-5 w-5 text-gray-500" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "font-medium",
                checked ? "text-gray-400 line-through" : "text-white"
              )}
            >
              {item.title}
            </span>
            <PriorityBadge priority={item.priority} />
            {item.estimatedTime && (
              <span className="text-xs text-gray-500">
                ~{item.estimatedTime}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-400 mt-1">{item.description}</p>

          {showDetails && (
            <div className="mt-3 space-y-2">
              {item.aiPlatformImpact && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-gray-500">AI Impact:</span>
                  {item.aiPlatformImpact.map((platform) => (
                    <span
                      key={platform}
                      className="px-1.5 py-0.5 text-xs bg-[#00E5CC]/10 text-[#00E5CC] rounded"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              )}

              {item.resourceLink && (
                <a
                  href={item.resourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#00E5CC] hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Documentation
                </a>
              )}

              {item.codeSnippet && <CodeSnippet code={item.codeSnippet} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Category section component
 */
function CategorySection({
  category,
  items,
  checkedItems,
  onToggle,
  showDetails,
}: {
  category: ChecklistCategory;
  items: ChecklistItem[];
  checkedItems: Set<string>;
  onToggle: (id: string) => void;
  showDetails: boolean;
}) {
  const config = CATEGORY_CONFIGS[category];
  const completedCount = items.filter((item) => checkedItems.has(item.id)).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-mono text-[#00E5CC]">{config.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">{config.label}</h3>
            <p className="text-sm text-gray-400">{config.description}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-400">
            {completedCount}/{items.length}
          </span>
          <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1">
            <div
              className="h-full bg-[#00E5CC] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            checked={checkedItems.has(item.id)}
            onToggle={() => onToggle(item.id)}
            showDetails={showDetails}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Developer Checklist Props
 */
export interface DeveloperChecklistProps {
  brandName?: string;
  items?: ChecklistItem[];
  onExport?: () => void;
  onPrint?: () => void;
}

/**
 * Developer Checklist Component
 *
 * A printable technical checklist for GEO/AEO optimization.
 */
export function DeveloperChecklist({
  brandName = "Your Brand",
  items = DEFAULT_CHECKLIST_ITEMS,
  onExport,
  onPrint,
}: DeveloperChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(true);
  const [filterPriority, setFilterPriority] = useState<
    ChecklistItem["priority"] | "all"
  >("all");

  // Group items by category
  const groupedItems = useMemo(() => {
    const filtered =
      filterPriority === "all"
        ? items
        : items.filter((item) => item.priority === filterPriority);

    return Object.keys(CATEGORY_CONFIGS).reduce((acc, category) => {
      acc[category as ChecklistCategory] = filtered.filter(
        (item) => item.category === category
      );
      return acc;
    }, {} as Record<ChecklistCategory, ChecklistItem[]>);
  }, [items, filterPriority]);

  // Calculate overall progress
  const totalItems = items.length;
  const completedItems = checkedItems.size;
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Toggle item
  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle print
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default: generate a simple JSON export
      const exportData = {
        brandName,
        generatedAt: new Date().toISOString(),
        totalItems,
        completedItems,
        items: items.map((item) => ({
          ...item,
          completed: checkedItems.has(item.id),
        })),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `developer-checklist-${brandName.toLowerCase().replace(/\s+/g, "-")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 print:mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Developer Checklist
            </h1>
            <p className="text-gray-400">
              GEO/AEO Technical Implementation Guide for {brandName}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-white/20 text-gray-300"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-white/20 text-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-[#141930] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm text-gray-400">
              {completedItems} of {totalItems} tasks completed
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-[#00E5CC] to-[#8B5CF6] rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {overallProgress === 100
              ? "All tasks completed! Your site is optimized for AI visibility."
              : overallProgress > 50
              ? "Good progress! Keep going to maximize AI visibility."
              : "Start with critical priority items for maximum impact."}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Priority:</span>
          {(["all", "critical", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                filterPriority === p
                  ? "bg-[#00E5CC]/20 text-[#00E5CC] border-[#00E5CC]/30"
                  : "bg-transparent text-gray-400 border-white/10 hover:border-white/20"
              )}
            >
              {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDetails}
            onChange={(e) => setShowDetails(e.target.checked)}
            className="rounded border-white/20 bg-transparent text-[#00E5CC]"
          />
          <span className="text-sm text-gray-400">Show code snippets</span>
        </label>
      </div>

      {/* Checklist Categories */}
      {(Object.keys(CATEGORY_CONFIGS) as ChecklistCategory[]).map((category) => {
        const categoryItems = groupedItems[category];
        if (categoryItems.length === 0) return null;

        return (
          <CategorySection
            key={category}
            category={category}
            items={categoryItems}
            checkedItems={checkedItems}
            onToggle={toggleItem}
            showDetails={showDetails}
          />
        );
      })}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-white/10 text-center print:mt-4">
        <p className="text-xs text-gray-500">
          Generated by Apex GEO/AEO Platform | {new Date().toLocaleDateString()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Validate schema at{" "}
          <a
            href="https://validator.schema.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00E5CC] hover:underline"
          >
            validator.schema.org
          </a>
        </p>
      </div>
    </div>
  );
}

export default DeveloperChecklist;

// Export default items for reuse
export { DEFAULT_CHECKLIST_ITEMS };
