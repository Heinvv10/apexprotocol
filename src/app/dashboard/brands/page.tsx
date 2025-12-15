"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
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

// AI Platforms for monitoring
const AI_PLATFORMS = [
  { id: "chatgpt", name: "ChatGPT", color: "#10A37F" },
  { id: "claude", name: "Claude", color: "#D97706" },
  { id: "gemini", name: "Gemini", color: "#4285F4" },
  { id: "perplexity", name: "Perplexity", color: "#1FB8CD" },
  { id: "grok", name: "Grok", color: "#1DA1F2" },
  { id: "deepseek", name: "DeepSeek", color: "#6366F1" },
  { id: "copilot", name: "Copilot", color: "#0078D4" },
];

// Industries list
const INDUSTRIES = [
  "Technology",
  "E-commerce",
  "Healthcare",
  "Finance",
  "Education",
  "Real Estate",
  "Travel",
  "Food & Beverage",
  "Entertainment",
  "Consulting",
  "Manufacturing",
  "Retail",
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

export default function BrandsPage() {
  const searchParams = useSearchParams();
  const brands = useBrands();
  const meta = useBrandMeta();
  const { refreshBrands, addBrand, updateBrand, removeBrand, isLoading } = useBrandStore();

  // UI state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBrand, setEditingBrand] = React.useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    domain: "",
    description: "",
    industry: "",
    logoUrl: "",
    keywords: [] as string[],
    competitors: [] as string[],
    voiceTone: "professional" as Brand["voice"]["tone"],
    targetAudience: "",
    primaryColor: "#4926FA",
    monitoringEnabled: true,
    monitoringPlatforms: ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"],
  });
  const [keywordInput, setKeywordInput] = React.useState("");
  const [competitorInput, setCompetitorInput] = React.useState("");
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);

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
    setFormData({
      name: "",
      domain: "",
      description: "",
      industry: "",
      logoUrl: "",
      keywords: [],
      competitors: [],
      voiceTone: "professional",
      targetAudience: "",
      primaryColor: "#4926FA",
      monitoringEnabled: true,
      monitoringPlatforms: ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"],
    });
    setKeywordInput("");
    setCompetitorInput("");
    setError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      domain: brand.domain || "",
      description: brand.description || "",
      industry: brand.industry || "",
      logoUrl: brand.logoUrl || "",
      keywords: brand.keywords || [],
      competitors: brand.competitors || [],
      voiceTone: brand.voice?.tone || "professional",
      targetAudience: brand.voice?.targetAudience || "",
      primaryColor: brand.visual?.primaryColor || "#4926FA",
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
    const competitor = competitorInput.trim();
    if (competitor && !formData.competitors.includes(competitor)) {
      setFormData((prev) => ({ ...prev, competitors: [...prev.competitors, competitor] }));
      setCompetitorInput("");
    }
  };

  // Remove competitor
  const removeCompetitor = (competitor: string) => {
    setFormData((prev) => ({
      ...prev,
      competitors: prev.competitors.filter((c) => c !== competitor),
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
        industry: formData.industry || null,
        logoUrl: formData.logoUrl || null,
        keywords: formData.keywords,
        competitors: formData.competitors,
        voice: {
          tone: formData.voiceTone,
          targetAudience: formData.targetAudience,
          personality: [],
          keyMessages: [],
          avoidTopics: [],
        },
        visual: {
          primaryColor: formData.primaryColor,
          secondaryColor: null,
          fontFamily: null,
        },
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Brand Management</h1>
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
                {meta?.total ?? 0} of {meta?.limit ?? 1} brands used
              </p>
              <p className="text-sm text-muted-foreground">
                {meta?.plan === "starter" && "Starter plan - 1 brand included"}
                {meta?.plan === "professional" && "Professional plan - 5 brands included"}
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
              width: `${Math.min(((meta?.total ?? 0) / (meta?.limit ?? 1)) * 100, 100)}%`,
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
              className="card-secondary p-5 hover:border-primary/30 transition-colors"
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
                    {brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      getBrandInitials(brand.name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{brand.name}</h3>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-tooltip">
                    <DropdownMenuItem onClick={() => openEditModal(brand)} className="gap-2">
                      <Pencil className="h-4 w-4" />
                      Edit Brand
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteConfirm(brand.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative glass-modal p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-error/10">
                <AlertTriangle className="h-5 w-5 text-error" />
              </div>
              <h3 className="text-lg font-semibold">Delete Brand</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this brand? This will remove all monitoring data
              and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-error hover:bg-error/90"
              >
                Delete Brand
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative glass-modal p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingBrand ? "Edit Brand" : "Create New Brand"}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>

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
                          className="w-full h-full object-cover"
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
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground">SEO/GEO Settings</h3>

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
                          key={competitor}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-foreground text-sm"
                        >
                          {competitor}
                          <button
                            type="button"
                            onClick={() => removeCompetitor(competitor)}
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
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground">Brand Voice (for AI Content)</h3>

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
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">AI Platform Monitoring</h3>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {AI_PLATFORMS.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
                          "transition-all duration-150 ease-out",
                          "hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0",
                          formData.monitoringPlatforms.includes(platform.id)
                            ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25"
                            : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:shadow-md"
                        )}
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: platform.color }}
                        />
                        {platform.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.name}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {editingBrand ? "Saving..." : "Creating..."}
                    </>
                  ) : editingBrand ? (
                    "Save Changes"
                  ) : (
                    "Create Brand"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
