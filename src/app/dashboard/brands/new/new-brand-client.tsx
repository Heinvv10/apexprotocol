"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Save,
  Sparkles,
  ImageIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrapeWizard } from "@/components/brands/scrape-wizard";
import type { ScrapedBrandData } from "@/app/api/brands/scrape/route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100, "Brand name too long"),
  domain: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(val),
      "Must be a valid domain (e.g., example.com)"
    ),
  description: z.string().optional(),
  industry: z.string().optional(),
  logoUrl: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith("http") || val.startsWith("/uploads/"), "Must be a valid URL or uploaded file"),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

// Industry options
const industries = [
  "Technology",
  "E-commerce",
  "Healthcare",
  "Finance",
  "Education",
  "Real Estate",
  "Travel & Hospitality",
  "Food & Beverage",
  "Fashion & Apparel",
  "Entertainment",
  "Automotive",
  "Sports & Fitness",
  "B2B Services",
  "Other",
];

// Create brand API call
async function createBrand(data: BrandFormValues) {
  const res = await fetch("/api/brands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create brand");
  }

  return res.json();
}

// Fetch brand metadata (limits)
async function fetchBrandMeta() {
  const res = await fetch("/api/brands");
  if (!res.ok) throw new Error("Failed to fetch brand metadata");
  const data = await res.json();
  return data.data.meta;
}

// Helper function to extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Fetch logo from domain using cascading fallbacks
async function fetchLogoFromDomain(domain: string): Promise<{ success: boolean; logoUrl?: string; source?: string; error?: string }> {
  const res = await fetch("/api/brands/logo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });
  return res.json();
}

export default function NewBrandClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<"choose" | "wizard" | "manual">("choose");
  
  // Logo fetching state
  const [logoFetchState, setLogoFetchState] = useState<"idle" | "fetching" | "success" | "error">("idle");
  const [logoSource, setLogoSource] = useState<string | null>(null);

  // Fetch brand limits
  const { data: meta } = useQuery({
    queryKey: ["brand-meta"],
    queryFn: fetchBrandMeta,
  });

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      domain: "",
      description: "",
      industry: "",
      logoUrl: "",
    },
  });

  // Watch domain field for auto logo fetch
  const watchedDomain = form.watch("domain");
  const currentLogoUrl = form.watch("logoUrl");

  // Auto-fetch logo when domain changes (with debounce)
  useEffect(() => {
    // Don't fetch if domain is empty or invalid
    if (!watchedDomain || !/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(watchedDomain)) {
      setLogoFetchState("idle");
      setLogoSource(null);
      return;
    }

    // Don't fetch if logo URL is already set manually
    if (currentLogoUrl && !currentLogoUrl.startsWith("/uploads/")) {
      return;
    }

    // Debounce the fetch
    const timeoutId = setTimeout(async () => {
      setLogoFetchState("fetching");
      setLogoSource(null);

      try {
        const result = await fetchLogoFromDomain(watchedDomain);
        
        if (result.success && result.logoUrl) {
          form.setValue("logoUrl", result.logoUrl);
          setLogoFetchState("success");
          setLogoSource(result.source || "auto");
          toast({
            title: "Logo Found",
            description: `Auto-fetched logo from ${result.source || "website"}`,
          });
        } else {
          setLogoFetchState("error");
          toast({
            title: "Logo Not Found",
            description: result.error || "Could not auto-fetch logo. You can upload manually.",
            variant: "destructive",
          });
        }
      } catch (err) {
        setLogoFetchState("error");
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [watchedDomain]);

  // Create brand mutation
  const createMutation = useMutation({
    mutationFn: createBrand,
    onSuccess: (data) => {
      toast({
        title: "Brand Created",
        description: `${data.data.name} has been successfully created.`,
      });
      // Redirect to brands list
      router.push("/dashboard/brands");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: BrandFormValues) => {
    createMutation.mutate(values);
  };

  // Handle wizard completion
  const handleWizardComplete = (data: ScrapedBrandData) => {
    // Auto-extract domain from scrapedUrl
    const domain = extractDomain(data.scrapedUrl);

    // Create brand with all scraped data
    createMutation.mutate({
      name: data.brandName,
      domain: domain,
      description: data.description || "",
      industry: data.industry || "",
      logoUrl: data.logoUrl || "",
      // Note: API route will handle locations, personnel, etc.
    });
  };

  // Check if user can add more brands
  const canAddBrand = meta?.canAddMore ?? true;
  const currentCount = meta?.total ?? 0;
  const brandLimit = meta?.limit ?? 1;

  // ============================================================================
  // Render Mode Selection or Wizard
  // ============================================================================

  // Show choice screen first
  if (mode === "choose") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/brands")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New Brand</h1>
              <p className="text-sm text-muted-foreground">
                Add a new brand to start monitoring its AI visibility
              </p>
            </div>
          </div>
        </div>

        {/* Brand limit warning */}
        {!canAddBrand && (
          <Card className="card-secondary border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Brand Limit Reached</p>
                  <p className="text-sm text-muted-foreground">
                    You've reached the limit of {brandLimit} brand(s) for your {meta?.plan || "current"} plan.
                    Upgrade to add more brands.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Choice Card */}
        <Card className="card-secondary border-0">
          <CardContent className="pt-6">
            <ScrapeWizard
              onComplete={handleWizardComplete}
              onManual={() => setMode("manual")}
              onCancel={() => router.push("/dashboard/brands")}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wizard flow (handled by ScrapeWizard component above)
  // if (mode === "wizard") - integrated into choose mode

  // ============================================================================
  // Manual Form (existing code)
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/brands")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create New Brand</h1>
            <p className="text-sm text-muted-foreground">
              Add a new brand to start monitoring its AI visibility
            </p>
          </div>
        </div>
      </div>

      {/* Brand limit warning */}
      {!canAddBrand && (
        <Card className="card-secondary border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Brand Limit Reached</p>
                <p className="text-sm text-muted-foreground">
                  You've reached the limit of {brandLimit} brand(s) for your {meta?.plan || "current"} plan.
                  Upgrade to add more brands.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back to Choice Button */}
      {mode === "manual" && (
        <Button
          variant="ghost"
          onClick={() => setMode("choose")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Options
        </Button>
      )}

      {/* Form */}
      <Card className="card-secondary border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Brand Information</CardTitle>
          <CardDescription>
            Enter your brand details below. Only the brand name is required to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Brand Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>
                      Brand Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Inc."
                        {...field}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormDescription>
                      The official name of your brand or company
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Domain */}
              <FormField
                control={form.control}
                name="domain"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example.com"
                        {...field}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormDescription>
                      Your brand's website domain (without https://) — logo will be auto-fetched
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Industry */}
              <FormField
                control={form.control}
                name="industry"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry.toLowerCase()}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The primary industry your brand operates in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of your brand, products, or services..."
                        className="bg-background min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A short description of what your brand does (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Logo URL */}
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Logo
                      {logoFetchState === "fetching" && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Auto-fetching...
                        </span>
                      )}
                      {logoFetchState === "success" && logoSource && (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Found via {logoSource}
                        </span>
                      )}
                      {logoFetchState === "error" && (
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Not found - enter manually
                        </span>
                      )}
                    </FormLabel>
                    <div className="flex gap-3 items-start">
                      {/* Logo Preview */}
                      <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {field.value ? (
                          <img 
                            src={field.value} 
                            alt="Logo preview" 
                            className="h-full w-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="https://example.com/logo.png"
                            {...field}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormDescription className="mt-1">
                          Auto-fetched from domain, or enter URL manually
                        </FormDescription>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/brands")}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !canAddBrand}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Brand
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Helper Card */}
      <Card className="card-tertiary border-0">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your brand will be added to the monitoring system</li>
                <li>• AI platforms will be scanned for brand mentions</li>
                <li>• You can start creating AI-optimized content</li>
                <li>• Performance metrics will begin tracking automatically</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
