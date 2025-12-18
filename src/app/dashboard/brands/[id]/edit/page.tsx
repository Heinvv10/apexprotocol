"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Save,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

interface Brand {
  id: string;
  name: string;
  domain: string | null;
  description: string | null;
  industry: string | null;
  logoUrl: string | null;
}

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

// Fetch brand details
async function fetchBrand(id: string): Promise<Brand> {
  const res = await fetch(`/api/brands/${id}`);
  if (!res.ok) throw new Error("Failed to fetch brand");
  const data = await res.json();
  return data.data;
}

// Update brand API call
async function updateBrand(id: string, data: BrandFormValues) {
  const res = await fetch(`/api/brands/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update brand");
  }

  return res.json();
}

// Delete brand API call
async function deleteBrand(id: string) {
  const res = await fetch(`/api/brands/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete brand");
  }

  return res.json();
}

export default function EditBrandPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const brandId = params.id as string;

  // Fetch brand data
  const {
    data: brand,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["brand", brandId],
    queryFn: () => fetchBrand(brandId),
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

  // Update form when brand data loads
  React.useEffect(() => {
    if (brand) {
      form.reset({
        name: brand.name,
        domain: brand.domain || "",
        description: brand.description || "",
        industry: brand.industry || "",
        logoUrl: brand.logoUrl || "",
      });
    }
  }, [brand, form]);

  // Update brand mutation
  const updateMutation = useMutation({
    mutationFn: (data: BrandFormValues) => updateBrand(brandId, data),
    onSuccess: (data) => {
      toast({
        title: "Brand Updated",
        description: `${data.data.name} has been successfully updated.`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["brand", brandId] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      // Redirect to brand detail page
      router.push(`/dashboard/brands/${brandId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete brand mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteBrand(brandId),
    onSuccess: () => {
      toast({
        title: "Brand Deleted",
        description: "The brand has been permanently deleted.",
      });
      // Invalidate brands list
      queryClient.invalidateQueries({ queryKey: ["brands"] });
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
    updateMutation.mutate(values);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading brand...</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="card-secondary p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Brand Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The brand you're trying to edit doesn't exist or you don't have access to it.
          </p>
          <Button
            onClick={() => router.push("/dashboard/brands")}
            variant="default"
          >
            Back to Brands
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/brands/${brandId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Brand</h1>
            <p className="text-sm text-muted-foreground">
              Update your brand information
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="card-secondary border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Brand Information</CardTitle>
          <CardDescription>
            Update your brand details below. Changes will be saved immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Brand Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
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
                render={({ field }) => (
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
                render={({ field }) => (
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
                      A short description of what your brand does
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Logo URL */}
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
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
                      Direct URL to your brand's logo image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={updateMutation.isPending || deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Brand
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Brand?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete "{brand.name}"
                        and remove all associated data including mentions, content, and analytics.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Brand"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/brands/${brandId}`)}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Warning Card */}
      <Card className="card-tertiary border-0">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Important Notes</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Changes to brand name or domain may affect existing mentions</li>
                <li>• Logo updates will reflect across all dashboard views</li>
                <li>• Industry changes may impact recommendation relevance</li>
                <li>• Deleting a brand will permanently remove all associated data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
