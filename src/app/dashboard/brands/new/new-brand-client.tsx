"use client";

import * as React from "react";
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
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
    .refine((val) => !val || val.startsWith("http"), "Must be a valid URL"),
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

export default function NewBrandClient() {
  const router = useRouter();
  const { toast } = useToast();

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

  // Check if user can add more brands
  const canAddBrand = meta?.canAddMore ?? true;
  const currentCount = meta?.total ?? 0;
  const brandLimit = meta?.limit ?? 1;

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
                      Your brand's primary website domain (without https://)
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
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/logo.png"
                        {...field}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormDescription>
                      Direct URL to your brand's logo image (optional)
                    </FormDescription>
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
