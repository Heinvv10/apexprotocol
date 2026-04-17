"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BrandHeader } from "@/components/layout/brand-header";
import {
  Plus,
  Pencil,
  Trash2,
  Globe,
  MoreVertical,
  Loader2,
  Search,
  Building2,
  X,
  Upload,
  AlertTriangle,
  Sparkles,
  Target,
  Users,
  MessageSquare,
  TrendingUp,
  Palette,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandStore, useBrands, useBrandMeta, type Brand } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrapeWizard } from "@/components/brands/scrape-wizard";
import { BrandDetailView } from "@/components/brands/brand-detail-view";
import { CompletionWizard } from "@/components/brands/completion-wizard";
import { BrandLogo } from "@/components/brands/brand-logo";
import { useToast } from "@/components/toast";
import type { ScrapedBrandData } from "@/app/api/brands/scrape/route";

// AI Platforms for monitoring (colors from UI_DESIGN_SYSTEM.md)
const AI_PLATFORMS = [
  { id: "chatgpt", name: "ChatGPT", color: "#10A37F" },
  { id: "claude", name: "Claude", color: "#D97757" },
  { id: "gemini", name: "Gemini", color: "#4285F4" },
  { id: "perplexity", name: "Perplexity", color: "#20B8CD" },
  { id: "grok", name: "Grok", color: "#FFFFFF" },
  { id: "deepseek", name: "DeepSeek", color: "#6366F1" },
  { id: "copilot", name: "Copilot", color: "#0078D4" },
];

// Design system colors (from UI_DESIGN_SYSTEM.md - consistent with brand-detail-view)
const DESIGN = {
  // Primary brand colors
  primaryCyan: "#00E5CC",
  cyanBright: "#00FFE0",
  cyanMuted: "#00B8A3",
  accentPurple: "#8B5CF6",
  purpleLight: "#A78BFA",
  accentPink: "#EC4899",
  accentBlue: "#3B82F6",
  // Semantic colors
  successGreen: "#22C55E",
  warningYellow: "#F59E0B",
  errorRed: "#EF4444",
  infoBlue: "#3B82F6",
  // Backgrounds
  bgDeep: "#02030A",
  bgBase: "#060812",
  bgElevated: "#0A0D1A",
  bgCard: "#0F1225",
  bgCardHover: "#151935",
  bgInput: "#0D1020",
  // Text colors
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textAccent: "#00E5CC",
  textLink: "#60A5FA",
  // Borders
  borderSubtle: "rgba(255, 255, 255, 0.05)",
  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.12)",
  borderAccent: "rgba(0, 229, 204, 0.3)",
  borderGlow: "rgba(0, 229, 204, 0.5)",
};

// Industries list - matches INDUSTRY_OPTIONS in brand-analysis.ts
const INDUSTRIES = [
  "Technology",
  "E-commerce",
  "Finance",
  "Healthcare",
  "Education",
  "Real Estate",
  "Travel",
  "Food & Beverage",
  "Fashion",
  "Automotive",
  "Entertainment",
  "Sports",
  "News & Media",
  "Legal",
  "Marketing",
  "Advertising",
  "Telecommunications",
  "Internet Service Provider",
  "Consulting",
  "Manufacturing",
  "Energy",
  "Construction",
  "Logistics",
  "Insurance",
  "Hospitality",
  "Retail",
  "Agriculture",
  "Aerospace",
  "Pharmaceuticals",
  "Non-profit",
  "Government",
  "Other",
];

// Voice tones
const VOICE_TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "authoritative", label: "Authoritative" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
];

// Page Header Component
// Decorative Star Component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientBrands)"
        />
        <defs>
          <linearGradient id="starGradientBrands" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function BrandsPageContent() {
  const searchParams = useSearchParams();
  const brands = useBrands();
  const meta = useBrandMeta();
  const { refreshBrands, addBrand, updateBrand, removeBrand, isLoading } = useBrandStore();
  const toast = useToast();

  // UI state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBrand, setEditingBrand] = React.useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRescanning, setIsRescanning] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [wizardMode, setWizardMode] = React.useState<"wizard" | "form">("wizard");

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    domain: "",
    description: "",
    tagline: "",
    industry: "",
    logoUrl: "",
    keywords: [] as string[],
    seoKeywords: [] as string[],
    geoKeywords: [] as string[],
    competitors: [] as Array<{ name: string; url: string; reason: string }>,
    locations: [] as Array<{ type?: string; address?: string; city?: string; state?: string; country?: string; postalCode?: string; phone?: string; email?: string }>,
    personnel: [] as Array<{ name: string; title: string; department?: string; bio?: string; email?: string; linkedinUrl?: string; isActive?: boolean; joinedDate?: string }>,
    valuePropositions: [] as string[],
    socialLinks: {} as Record<string, string>,
    voiceTone: "professional" as Brand["voice"]["tone"],
    targetAudience: "",
    primaryColor: "#4926FA",
    secondaryColor: "",
    accentColor: "",
    colorPalette: [] as string[],
    confidence: { overall: 0, perField: {} as Record<string, number> },
    monitoringEnabled: true,
    monitoringPlatforms: ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"],
  });
  const [keywordInput, setKeywordInput] = React.useState("");
  const [competitorInput, setCompetitorInput] = React.useState("");
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  // Detail view state
  const [viewingBrand, setViewingBrand] = React.useState<Brand | null>(null);
  // Completion wizard state
  const [showCompletionWizard, setShowCompletionWizard] = React.useState<Brand | null>(null);

  // Load brands on mount
  React.useEffect(() => {
    refreshBrands();
  }, [refreshBrands]);

  // Check for ?action=new param
  React.useEffect(() => {
    if (searchParams.get("action") === "new" && meta?.canAddMore) {
      openNewBrandModal();
    }
  }, [searchParams, meta?.canAddMore]);

  // Filter brands by search
  const filteredBrands = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open modal for new brand
  const openNewBrandModal = () => {
    setEditingBrand(null);
    setWizardMode("wizard"); // Start with wizard for new brands
    setFormData({
      name: "",
      domain: "",
      description: "",
      tagline: "",
      industry: "",
      logoUrl: "",
      keywords: [],
      seoKeywords: [],
      geoKeywords: [],
      competitors: [],
      locations: [],
      personnel: [],
      valuePropositions: [],
      socialLinks: {},
      voiceTone: "professional",
      targetAudience: "",
      primaryColor: "#4926FA",
      secondaryColor: "",
      accentColor: "",
      colorPalette: [],
      confidence: { overall: 0, perField: {} },
      monitoringEnabled: true,
      monitoringPlatforms: ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"],
    });
    setKeywordInput("");
    setCompetitorInput("");
    setError(null);
    setIsModalOpen(true);
  };

  // Handle scraped data from wizard
  const handleScrapedData = (data: ScrapedBrandData) => {
    // Extract domain from scraped URL or raw data
    let domain = "";
    try {
      // First try the scrapedUrl field (most reliable)
      const urlStr = data.scrapedUrl || data.rawData?.ogData?.url;
      if (urlStr) {
        domain = new URL(urlStr).hostname.replace(/^www\./, "");
      }
    } catch {
      // URL parsing failed, leave domain empty
    }

    // Pre-fill form with ALL scraped data
    setFormData({
      name: data.brandName,
      domain,
      description: data.description,
      tagline: data.tagline || "",
      industry: data.industry,
      logoUrl: data.logoUrl || "",
      keywords: data.keywords || [],
      seoKeywords: data.seoKeywords || [],
      geoKeywords: data.geoKeywords || [],
      competitors: data.competitors || [],
      locations: (data as any).locations || [],
      personnel: (data as any).personnel || [],
      valuePropositions: data.valuePropositions || [],
      socialLinks: data.socialLinks || {},
      voiceTone: "professional",
      targetAudience: data.targetAudience || "",
      primaryColor: data.primaryColor || "#4926FA",
      secondaryColor: data.secondaryColor || "",
      accentColor: data.accentColor || "",
      colorPalette: data.colorPalette || [],
      confidence: data.confidence || { overall: 0, perField: {} },
      monitoringEnabled: true,
      monitoringPlatforms: ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"],
    });
    setWizardMode("form"); // Switch to form view to edit/confirm
  };

  // Handle manual mode from wizard
  const handleManualMode = () => {
    setWizardMode("form");
  };

  // Open modal for editing
  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setWizardMode("form"); // Skip wizard when editing
    setFormData({
      name: brand.name,
      domain: brand.domain || "",
      description: brand.description || "",
      tagline: brand.tagline || "",
      industry: brand.industry || "",
      logoUrl: brand.logoUrl || "",
      keywords: brand.keywords || [],
      seoKeywords: brand.seoKeywords || [],
      geoKeywords: brand.geoKeywords || [],
      competitors: brand.competitors || [],
      locations: (brand as any).locations || [],
      personnel: (brand as any).personnel || [],
      valuePropositions: brand.valuePropositions || [],
      socialLinks: brand.socialLinks || {},
      voiceTone: brand.voice?.tone || "professional",
      targetAudience: brand.voice?.targetAudience || "",
      primaryColor: brand.visual?.primaryColor || "#4926FA",
      secondaryColor: brand.visual?.secondaryColor || "",
      accentColor: brand.visual?.accentColor || "",
      colorPalette: brand.visual?.colorPalette || [],
      confidence: brand.confidence || { overall: 0, perField: {} },
      monitoringEnabled: brand.monitoringEnabled,
      monitoringPlatforms: brand.monitoringPlatforms || [],
    });
    setKeywordInput("");
    setCompetitorInput("");
    setError(null);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setError(null);
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", "brand-logos");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (data.success) {
        setFormData((prev) => ({ ...prev, logoUrl: data.data.url }));
      } else {
        setError(data.error || "Failed to upload logo");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Add keyword
  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData((prev) => ({ ...prev, keywords: [...prev.keywords, keyword] }));
      setKeywordInput("");
    }
  };

  // Remove keyword
  const removeKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  // Add competitor
  const addCompetitor = () => {
    const competitorName = competitorInput.trim();
    if (competitorName && !formData.competitors.some((c) => c.name === competitorName)) {
      const newCompetitor = { name: competitorName, url: "", reason: "" };
      setFormData((prev) => ({ ...prev, competitors: [...prev.competitors, newCompetitor] }));
      setCompetitorInput("");
    }
  };

  // Remove competitor
  const removeCompetitor = (competitorName: string) => {
    setFormData((prev) => ({
      ...prev,
      competitors: prev.competitors.filter((c) => c.name !== competitorName),
    }));
  };

  // Toggle platform
  const togglePlatform = (platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      monitoringPlatforms: prev.monitoringPlatforms.includes(platformId)
        ? prev.monitoringPlatforms.filter((p) => p !== platformId)
        : [...prev.monitoringPlatforms, platformId],
    }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        domain: formData.domain || null,
        description: formData.description || null,
        tagline: formData.tagline || null,
        industry: formData.industry || null,
        logoUrl: formData.logoUrl || null,
        keywords: formData.keywords,
        seoKeywords: formData.seoKeywords,
        geoKeywords: formData.geoKeywords,
        competitors: formData.competitors,
        locations: formData.locations,
        personnel: formData.personnel,
        valuePropositions: formData.valuePropositions,
        socialLinks: formData.socialLinks,
        voice: {
          tone: formData.voiceTone,
          targetAudience: formData.targetAudience,
          personality: [],
          keyMessages: [],
          avoidTopics: [],
        },
        visual: {
          primaryColor: formData.primaryColor || null,
          secondaryColor: formData.secondaryColor || null,
          accentColor: formData.accentColor || null,
          colorPalette: formData.colorPalette,
          fontFamily: null,
        },
        confidence: formData.confidence,
        monitoringEnabled: formData.monitoringEnabled,
        monitoringPlatforms: formData.monitoringPlatforms,
      };

      if (editingBrand) {
        // Update existing brand
        const response = await fetch(`/api/brands/${editingBrand.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.success) {
          updateBrand(editingBrand.id, data.data);
          closeModal();
        } else {
          setError(data.error || "Failed to update brand");
        }
      } else {
        // Create new brand
        const response = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.success) {
          addBrand(data.data);
          closeModal();
          refreshBrands(); // Refresh meta from server (plan/limit)
          // Trigger completion wizard for newly created brand
          setShowCompletionWizard(data.data);
        } else {
          setError(data.error || "Failed to create brand");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rescan brand website to update information
  const handleRescan = async () => {
    if (!editingBrand?.domain) {
      setError("No domain available to rescan");
      return;
    }

    setIsRescanning(true);
    setError(null);

    try {
      // Normalize URL
      let url = editingBrand.domain;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }

      const response = await fetch("/api/brands/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start rescan");
      }

      // Handle synchronous response (no Redis) or completed async job
      if (data.job?.status === "completed" && data.job?.data) {
        const scrapedData = data.job.data as ScrapedBrandData;

        // Update form with scraped data, preserving existing values for unchanged fields
        setFormData((prev) => ({
          ...prev,
          name: scrapedData.brandName || prev.name,
          description: scrapedData.description || prev.description,
          tagline: scrapedData.tagline || prev.tagline,
          industry: scrapedData.industry || prev.industry,
          logoUrl: scrapedData.logoUrl || prev.logoUrl,
          primaryColor: scrapedData.primaryColor || prev.primaryColor,
          secondaryColor: scrapedData.secondaryColor || prev.secondaryColor,
          accentColor: scrapedData.accentColor || prev.accentColor,
          colorPalette: scrapedData.colorPalette || prev.colorPalette,
          targetAudience: scrapedData.targetAudience || prev.targetAudience,
          valuePropositions: scrapedData.valuePropositions || prev.valuePropositions,
          seoKeywords: scrapedData.seoKeywords || prev.seoKeywords,
          geoKeywords: scrapedData.geoKeywords || prev.geoKeywords,
          competitors: scrapedData.competitors || prev.competitors,
          socialLinks: scrapedData.socialLinks || prev.socialLinks,
          confidence: scrapedData.confidence || prev.confidence,
        }));

        // Show success toast
        toast.success(
          "Website rescanned successfully",
          "Brand information has been updated. Review the changes and click Save to apply them."
        );
      } else if (data.job?.status === "failed") {
        throw new Error(data.job.error || "Rescan failed");
      } else {
        // Async job started - would need polling, but for now just show info
        toast.info(
          "Rescan started",
          "The website is being analyzed. Refresh the page to see updates."
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to rescan brand";
      setError(errorMessage);
      toast.error("Rescan failed", errorMessage);
    } finally {
      setIsRescanning(false);
    }
  };

  // Delete brand
  const handleDelete = async (brandId: string) => {
    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        removeBrand(brandId);
        setDeleteConfirm(null);
        // Refresh from server to get accurate plan/limit
        refreshBrands();
      } else {
        setError(data.error || "Failed to delete brand");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete brand");
    }
  };

  // Get brand initials
  const getBrandInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6 relative">
      <BrandHeader pageName="Brands" />

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Brand Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your brands and their GEO monitoring settings
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 bg-muted/50"
            />
          </div>

          {/* Add Brand Button */}
          <Button
            onClick={openNewBrandModal}
            disabled={!meta?.canAddMore}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Brand
          </Button>
        </div>
      </div>

      {/* Brand Limit Info */}
      <div className="card-secondary p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">
                {brands.length} of {meta?.limit ?? 1} brands used
              </p>
              <p className="text-sm text-muted-foreground">
                {meta?.plan === "starter" && `Starter plan - ${meta?.limit ?? 1} brand${(meta?.limit ?? 1) > 1 ? 's' : ''} included`}
                {meta?.plan === "professional" && `Professional plan - ${meta?.limit ?? 5} brands included`}
                {meta?.plan === "enterprise" && "Enterprise plan - Unlimited brands"}
              </p>
            </div>
          </div>
          {!meta?.canAddMore && meta?.plan !== "enterprise" && (
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/settings?tab=billing">Upgrade Plan</a>
            </Button>
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${Math.min((brands.length / (meta?.limit ?? 1)) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Brands Grid */}
      {isLoading && brands.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="card-secondary p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? "No brands found" : "No brands yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery
              ? "Try a different search term"
              : "Create your first brand to start monitoring AI mentions"}
          </p>
          {!searchQuery && meta?.canAddMore && (
            <Button onClick={openNewBrandModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Brand
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="card-secondary p-5 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => setViewingBrand(brand)}
            >
              {/* Brand Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Brand Logo/Avatar */}
                  <div
                    className="flex items-center justify-center h-12 w-12 rounded-lg text-sm font-semibold text-white shrink-0"
                    style={{
                      backgroundColor: brand.visual?.primaryColor || "#4926FA",
                    }}
                  >
                    <BrandLogo
                      logoUrl={brand.logoUrl}
                      brandName={brand.name}
                      fallbackColor={brand.visual?.primaryColor || "#4926FA"}
                      size="md"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium truncate group-hover:text-primary transition-colors">{brand.name}</h3>
                    {brand.domain && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {brand.domain}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-tooltip">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewingBrand(brand); }} className="gap-2">
                      <Search className="h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditModal(brand); }} className="gap-2">
                      <Pencil className="h-4 w-4" />
                      Edit Brand
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(brand.id); }}
                      className="gap-2 text-error focus:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Brand
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Industry & Description */}
              {(brand.industry || brand.description) && (
                <div className="mb-4">
                  {brand.industry && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mb-2">
                      {brand.industry}
                    </span>
                  )}
                  {brand.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {brand.description}
                    </p>
                  )}
                </div>
              )}

              {/* Confidence Score (if available) */}
              {brand.confidence?.overall > 0 && (
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${brand.confidence.overall}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{brand.confidence.overall}%</span>
                </div>
              )}

              {/* Monitoring Platforms */}
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Monitoring {brand.monitoringPlatforms?.length || 0} platforms
                </p>
                <div className="flex flex-wrap gap-1">
                  {brand.monitoringPlatforms?.slice(0, 5).map((platformId) => {
                    const platform = AI_PLATFORMS.find((p) => p.id === platformId);
                    return (
                      <span
                        key={platformId}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: `${platform?.color}20`,
                          color: platform?.color,
                        }}
                      >
                        {platform?.name || platformId}
                      </span>
                    );
                  })}
                  {(brand.monitoringPlatforms?.length || 0) > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{(brand.monitoringPlatforms?.length || 0) - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: `${DESIGN.bgDeep}E6` }}
            onClick={() => setDeleteConfirm(null)}
          />
          {/* Modal - translucent glass effect */}
          <div
            className="relative max-w-md w-full rounded-2xl overflow-hidden backdrop-blur-xl"
            style={{
              backgroundColor: `${DESIGN.bgCard}80`, // 50% opacity for glass effect
              border: `1px solid ${DESIGN.errorRed}33`,
              boxShadow: `0 0 40px ${DESIGN.errorRed}15, 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
            }}
          >
            {/* Header */}
            <div
              className="p-6"
              style={{
                borderBottom: `1px solid ${DESIGN.borderDefault}`,
                background: `linear-gradient(180deg, ${DESIGN.bgElevated} 0%, ${DESIGN.bgCard} 100%)`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${DESIGN.errorRed}20` }}
                >
                  <AlertTriangle className="h-6 w-6" style={{ color: DESIGN.errorRed }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: DESIGN.textPrimary }}>
                    Delete Brand
                  </h3>
                  <p className="text-xs" style={{ color: DESIGN.textMuted }}>
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>
            {/* Content - transparent to maintain glass effect */}
            <div className="p-6">
              <p className="text-sm leading-relaxed mb-6" style={{ color: DESIGN.textSecondary }}>
                Are you sure you want to delete this brand? This will permanently remove all
                monitoring data, analytics history, and configurations associated with this brand.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  className="border-border/50 hover:border-border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="gap-2"
                  style={{
                    backgroundColor: DESIGN.errorRed,
                    color: DESIGN.textPrimary,
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Brand
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: `${DESIGN.bgDeep}E6` }}
            onClick={closeModal}
          />
          {/* Modal - translucent glass effect matching brand-detail-view */}
          <div
            className={cn(
              "relative rounded-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-xl",
              !editingBrand && wizardMode === "wizard" ? "max-w-xl w-full" : "max-w-3xl w-full"
            )}
            style={{
              backgroundColor: `${DESIGN.bgCard}80`, // 50% opacity for glass effect
              border: `1px solid ${DESIGN.primaryCyan}33`,
              boxShadow: `0 0 40px ${DESIGN.primaryCyan}15, 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
            }}
          >
            {/* Show wizard for new brands */}
            {!editingBrand && wizardMode === "wizard" ? (
              <div className="p-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeModal}
                  className="absolute top-4 right-4 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
                <ScrapeWizard
                  onComplete={handleScrapedData}
                  onManual={handleManualMode}
                  onCancel={closeModal}
                />
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div
                  className="p-6 flex items-center justify-between gap-4 shrink-0"
                  style={{
                    borderBottom: `1px solid ${DESIGN.borderDefault}`,
                    background: `linear-gradient(180deg, ${DESIGN.bgElevated} 0%, ${DESIGN.bgCard} 100%)`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Brand Logo/Avatar - show brand identity when editing */}
                    <div
                      className="flex items-center justify-center h-14 w-14 rounded-xl text-lg font-bold shrink-0 overflow-hidden"
                      style={{
                        backgroundColor: editingBrand?.visual?.primaryColor || `${DESIGN.primaryCyan}20`,
                        color: editingBrand ? DESIGN.bgDeep : DESIGN.primaryCyan,
                        border: editingBrand ? `2px solid ${DESIGN.borderAccent}` : 'none',
                      }}
                    >
                      {editingBrand?.logoUrl ? (
                        <img
                          src={editingBrand.logoUrl}
                          alt={editingBrand.name}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : editingBrand ? (
                        editingBrand.name?.substring(0, 2).toUpperCase() || "BR"
                      ) : (
                        <Sparkles className="h-6 w-6" style={{ color: DESIGN.primaryCyan }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold truncate" style={{ color: DESIGN.textPrimary }}>
                        {editingBrand ? editingBrand.name : "Create New Brand"}
                      </h2>
                      <p className="text-xs" style={{ color: DESIGN.textMuted }}>
                        {editingBrand ? "Edit brand settings and monitoring" : "Configure your brand for AI visibility tracking"}
                      </p>
                      {editingBrand?.domain && (
                        <p className="text-xs mt-0.5" style={{ color: DESIGN.primaryCyan }}>
                          {editingBrand.domain}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeModal} className="hover:bg-white/10">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Scrollable Content - transparent to maintain glass effect */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Error Message */}
                  {error && (
                    <div
                      className="mb-6 p-4 rounded-xl flex items-center gap-3"
                      style={{
                        backgroundColor: `${DESIGN.errorRed}15`,
                        border: `1px solid ${DESIGN.errorRed}40`,
                      }}
                    >
                      <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: DESIGN.errorRed }} />
                      <p className="text-sm" style={{ color: DESIGN.errorRed }}>{error}</p>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3
                        className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                        style={{ color: DESIGN.textSecondary }}
                      >
                        <Building2 className="h-4 w-4" style={{ color: DESIGN.primaryCyan }} />
                        Basic Information
                      </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Brand Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Acme Corp"
                      required
                    />
                  </div>

                  {/* Domain */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website Domain</label>
                    <Input
                      value={formData.domain}
                      onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value }))}
                      placeholder="e.g., acme.com"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your brand..."
                    className="w-full h-20 px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Industry */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Industry</label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger className="w-full h-10 bg-muted/50 border-border">
                        <SelectValue placeholder="Select industry..." />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand Color */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        placeholder="#4926FA"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand Logo</label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-lg border border-border flex items-center justify-center overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${formData.primaryColor}22, ${formData.primaryColor}44)`,
                      }}
                    >
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Brand logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="gap-2"
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            {formData.logoUrl ? "Change Logo" : "Upload Logo"}
                          </>
                        )}
                      </Button>
                      {formData.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData((prev) => ({ ...prev, logoUrl: "" }))}
                          className="ml-2 text-error hover:text-error"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                    {/* SEO/GEO Settings */}
                    <div
                      className="space-y-4 pt-6 mt-6"
                      style={{ borderTop: `1px solid ${DESIGN.borderDefault}` }}
                    >
                      <h3
                        className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                        style={{ color: DESIGN.textSecondary }}
                      >
                        <Target className="h-4 w-4" style={{ color: DESIGN.successGreen }} />
                        SEO/GEO Settings
                      </h3>

                {/* Keywords */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Keywords</label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                      placeholder="Add a keyword..."
                    />
                    <Button type="button" variant="outline" onClick={addKeyword}>
                      Add
                    </Button>
                  </div>
                  {formData.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="hover:text-error"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Competitors */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Competitors to Track</label>
                  <div className="flex gap-2">
                    <Input
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCompetitor())}
                      placeholder="Add a competitor..."
                    />
                    <Button type="button" variant="outline" onClick={addCompetitor}>
                      Add
                    </Button>
                  </div>
                  {formData.competitors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.competitors.map((competitor) => (
                        <span
                          key={competitor.name}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-foreground text-sm"
                        >
                          {competitor.name}
                          <button
                            type="button"
                            onClick={() => removeCompetitor(competitor.name)}
                            className="hover:text-error"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

                    {/* Brand Voice */}
                    <div
                      className="space-y-4 pt-6 mt-6"
                      style={{ borderTop: `1px solid ${DESIGN.borderDefault}` }}
                    >
                      <h3
                        className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                        style={{ color: DESIGN.textSecondary }}
                      >
                        <MessageSquare className="h-4 w-4" style={{ color: DESIGN.accentPurple }} />
                        Brand Voice (for AI Content)
                      </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Voice Tone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Voice Tone</label>
                    <Select
                      value={formData.voiceTone}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          voiceTone: value as Brand["voice"]["tone"],
                        }))
                      }
                    >
                      <SelectTrigger className="w-full h-10 bg-muted/50 border-border">
                        <SelectValue placeholder="Select tone..." />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICE_TONES.map((tone) => (
                          <SelectItem key={tone.value} value={tone.value}>
                            {tone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Audience</label>
                    <Input
                      value={formData.targetAudience}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))
                      }
                      placeholder="e.g., Small business owners"
                    />
                  </div>
                </div>
              </div>

                    {/* Monitoring Settings */}
                    <div
                      className="space-y-4 pt-6 mt-6"
                      style={{ borderTop: `1px solid ${DESIGN.borderDefault}` }}
                    >
                      <div className="flex items-center justify-between">
                        <h3
                          className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                          style={{ color: DESIGN.textSecondary }}
                        >
                          <TrendingUp className="h-4 w-4" style={{ color: DESIGN.warningYellow }} />
                          AI Platform Monitoring
                        </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={formData.monitoringEnabled}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, monitoringEnabled: checked }))
                      }
                    />
                    <span className="text-sm">Enable Monitoring</span>
                  </label>
                </div>

                      {formData.monitoringEnabled && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {AI_PLATFORMS.map((platform) => {
                            const isSelected = formData.monitoringPlatforms.includes(platform.id);
                            return (
                              <button
                                key={platform.id}
                                type="button"
                                onClick={() => togglePlatform(platform.id)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-105"
                                style={{
                                  backgroundColor: isSelected ? `${platform.color}25` : DESIGN.bgElevated,
                                  color: isSelected ? platform.color : DESIGN.textMuted,
                                  border: `1px solid ${isSelected ? `${platform.color}40` : DESIGN.borderDefault}`,
                                }}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor: isSelected ? platform.color : 'transparent',
                                    border: isSelected ? 'none' : `2px solid ${platform.color}`,
                                    opacity: isSelected ? 1 : 0.4,
                                  }}
                                />
                                {platform.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
              </div>

                    {/* Form Actions */}
                    <div
                      className="flex justify-end gap-3 pt-6 mt-6"
                      style={{ borderTop: `1px solid ${DESIGN.borderDefault}` }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeModal}
                        className="border-border/50 hover:border-border"
                      >
                        Cancel
                      </Button>
                      {/* Rescan button - only show when editing an existing brand with a domain */}
                      {editingBrand && editingBrand.domain && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRescan}
                          disabled={isRescanning || isSubmitting}
                          className="gap-2"
                          style={{
                            borderColor: `${DESIGN.accentPurple}50`,
                            color: DESIGN.accentPurple,
                          }}
                        >
                          {isRescanning ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Rescanning...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Rescan Website
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={isSubmitting || isRescanning || !formData.name}
                        className="gap-2"
                        style={{
                          backgroundColor: DESIGN.primaryCyan,
                          color: DESIGN.bgDeep,
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {editingBrand ? "Saving..." : "Creating..."}
                          </>
                        ) : editingBrand ? (
                          <>
                            <Pencil className="h-4 w-4" />
                            Save Changes
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Create Brand
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Brand Detail View Modal */}
      {viewingBrand && (
        <BrandDetailView
          brand={viewingBrand}
          onClose={() => setViewingBrand(null)}
          onEdit={() => {
            setViewingBrand(null);
            openEditModal(viewingBrand);
          }}
        />
      )}

      {/* Completion Wizard Modal */}
      {showCompletionWizard && (
        <CompletionWizard
          brand={showCompletionWizard}
          onComplete={async (updatedData) => {
            // Update the brand with the completed data
            await updateBrand(showCompletionWizard.id, updatedData);
            setShowCompletionWizard(null);
            toast.success("Brand data completed successfully!");
          }}
          onClose={() => setShowCompletionWizard(null)}
        />
      )}

      {/* Decorative Star */}
      <DecorativeStar />
    </div>
  );
}

// Wrapper with Suspense boundary for useSearchParams
export default function BrandsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <BrandsPageContent />
    </Suspense>
  );
}
