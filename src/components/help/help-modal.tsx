"use client";

import * as React from "react";
import {
  X,
  Search,
  BookOpen,
  HelpCircle,
  Video,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Keyboard,
  Zap,
  Shield,
  BarChart2,
  FileText,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Help categories
const helpCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    description: "Learn the basics of Apex",
    articles: [
      { title: "Welcome to Apex", readTime: "2 min" },
      { title: "Setting up your brand profile", readTime: "3 min" },
      { title: "Understanding your GEO Score", readTime: "4 min" },
      { title: "Connecting AI platforms", readTime: "2 min" },
    ],
  },
  {
    id: "monitoring",
    title: "Brand Monitoring",
    icon: BarChart2,
    description: "Track your AI visibility",
    articles: [
      { title: "How brand monitoring works", readTime: "5 min" },
      { title: "Interpreting mention analytics", readTime: "4 min" },
      { title: "Setting up alerts", readTime: "3 min" },
      { title: "Exporting reports", readTime: "2 min" },
    ],
  },
  {
    id: "content",
    title: "Content Engine",
    icon: FileText,
    description: "Create AI-optimized content",
    articles: [
      { title: "Using the AI content generator", readTime: "5 min" },
      { title: "Best practices for AI visibility", readTime: "6 min" },
      { title: "Content templates", readTime: "3 min" },
      { title: "Publishing workflow", readTime: "4 min" },
    ],
  },
  {
    id: "recommendations",
    title: "Recommendations",
    icon: Sparkles,
    description: "Optimize your visibility",
    articles: [
      { title: "Understanding recommendations", readTime: "3 min" },
      { title: "Priority and impact scores", readTime: "4 min" },
      { title: "Implementing suggestions", readTime: "5 min" },
      { title: "Tracking improvements", readTime: "3 min" },
    ],
  },
  {
    id: "settings",
    title: "Account & Settings",
    icon: Settings,
    description: "Manage your account",
    articles: [
      { title: "Profile settings", readTime: "2 min" },
      { title: "Team management", readTime: "3 min" },
      { title: "API keys and integrations", readTime: "4 min" },
      { title: "Billing and plans", readTime: "2 min" },
    ],
  },
  {
    id: "security",
    title: "Security & Privacy",
    icon: Shield,
    description: "Keep your data safe",
    articles: [
      { title: "Data security overview", readTime: "4 min" },
      { title: "Two-factor authentication", readTime: "2 min" },
      { title: "Privacy settings", readTime: "3 min" },
      { title: "GDPR compliance", readTime: "5 min" },
    ],
  },
];

// Keyboard shortcuts
const keyboardShortcuts = [
  { keys: ["⌘", "K"], description: "Open command palette" },
  { keys: ["⌘", "/"], description: "Open help" },
  { keys: ["⌘", "B"], description: "Toggle sidebar" },
  { keys: ["⌘", "S"], description: "Save changes" },
  { keys: ["⌘", "N"], description: "New content" },
  { keys: ["Esc"], description: "Close modal" },
];

// Quick actions
const quickActions = [
  {
    title: "Video Tutorials",
    description: "Watch step-by-step guides",
    icon: Video,
    href: "#",
  },
  {
    title: "Documentation",
    description: "Full API & feature docs",
    icon: BookOpen,
    href: "#",
  },
  {
    title: "Contact Support",
    description: "Get help from our team",
    icon: MessageSquare,
    href: "#",
  },
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"docs" | "shortcuts">("docs");

  // Close on Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Filter categories by search
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return helpCategories;
    const query = searchQuery.toLowerCase();
    return helpCategories
      .map((cat) => ({
        ...cat,
        articles: cat.articles.filter((a) =>
          a.title.toLowerCase().includes(query)
        ),
      }))
      .filter(
        (cat) =>
          cat.title.toLowerCase().includes(query) ||
          cat.description.toLowerCase().includes(query) ||
          cat.articles.length > 0
      );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Help & Documentation
              </h2>
              <p className="text-sm text-muted-foreground">
                Find answers and learn how to use Apex
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              autoFocus
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setActiveTab("docs")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                activeTab === "docs"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              Documentation
            </button>
            <button
              onClick={() => setActiveTab("shortcuts")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                activeTab === "shortcuts"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Shortcuts
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "docs" ? (
            <>
              {/* Quick actions */}
              {!searchQuery && !activeCategory && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <a
                        key={action.title}
                        href={action.href}
                        className="card-tertiary p-4 hover:bg-white/5 transition-colors group"
                      >
                        <Icon className="w-5 h-5 text-primary mb-2" />
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {action.description}
                        </p>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Categories */}
              {activeCategory ? (
                <CategoryDetail
                  category={helpCategories.find((c) => c.id === activeCategory)!}
                  onBack={() => setActiveCategory(null)}
                />
              ) : (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {searchQuery ? "Search Results" : "Help Topics"}
                  </h3>
                  {filteredCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <HelpCircle className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No results found for &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  ) : (
                    filteredCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {category.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {category.description} • {category.articles.length} articles
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </>
          ) : (
            <KeyboardShortcuts />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 bg-muted/5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Can&apos;t find what you need?{" "}
              <a href="#" className="text-primary hover:underline">
                Contact support
              </a>
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted/30 border border-border/50 text-[10px] font-mono">
                ⌘
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-muted/30 border border-border/50 text-[10px] font-mono">
                /
              </kbd>
              <span>to open help</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Category detail view
function CategoryDetail({
  category,
  onBack,
}: {
  category: (typeof helpCategories)[0];
  onBack: () => void;
}) {
  const Icon = category.icon;

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back to topics
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {category.title}
          </h3>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        {category.articles.map((article, index) => (
          <a
            key={index}
            href="#"
            className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {article.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {article.readTime}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Keyboard shortcuts view
function KeyboardShortcuts() {
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Keyboard Shortcuts
      </h3>

      <div className="space-y-2">
        {keyboardShortcuts.map((shortcut, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/10"
          >
            <span className="text-sm text-foreground">{shortcut.description}</span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, keyIndex) => (
                <React.Fragment key={keyIndex}>
                  <kbd className="px-2 py-1 rounded bg-muted/30 border border-border/50 text-xs font-mono text-foreground min-w-[28px] text-center">
                    {key}
                  </kbd>
                  {keyIndex < shortcut.keys.length - 1 && (
                    <span className="text-muted-foreground text-xs">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Use these shortcuts to navigate Apex faster
      </p>
    </div>
  );
}

// Hook to use help modal
export function useHelpModal() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

// Help button trigger
export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
    >
      <HelpCircle className="w-4 h-4" />
      <span>Help</span>
      <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-muted/30 border border-border/50 text-[10px] font-mono">
        ⌘/
      </kbd>
    </button>
  );
}
