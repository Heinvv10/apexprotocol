"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  AlertCircle,
  Plus,
  X,
  Settings as SettingsIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const portfolioFormSchema = z.object({
  name: z.string().min(1, "Portfolio name is required").max(100, "Portfolio name too long"),
  description: z.string().optional(),
});

type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  brands?: PortfolioBrand[];
}

interface PortfolioBrand {
  id: string;
  brandId: string;
  displayOrder: number;
  isHighlighted: boolean;
  customLabel: string | null;
  addedAt: Date;
  brand: {
    id: string;
    name: string;
    domain: string | null;
    logoUrl: string | null;
    industry: string | null;
    isActive: boolean;
  };
}

interface Brand {
  id: string;
  name: string;
  domain: string | null;
  logoUrl: string | null;
  industry: string | null;
}

// Fetch portfolio details
async function fetchPortfolio(id: string): Promise<Portfolio> {
  const res = await fetch(`/api/portfolios/${id}`);
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  const data = await res.json();
  return data.portfolio;
}

// Fetch available brands
async function fetchAvailableBrands(): Promise<Brand[]> {
  const res = await fetch("/api/brands");
  if (!res.ok) throw new Error("Failed to fetch brands");
  const data = await res.json();
  return data.data.brands;
}

// Update portfolio API call
async function updatePortfolio(id: string, data: PortfolioFormValues) {
  const res = await fetch(`/api/portfolios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update portfolio");
  }

  return res.json();
}

// Delete portfolio API call
async function deletePortfolio(id: string) {
  const res = await fetch(`/api/portfolios/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete portfolio");
  }

  return res.json();
}

// Add brands to portfolio
async function addBrandsToPortfolio(portfolioId: string, brandIds: string[]) {
  const res = await fetch(`/api/portfolios/${portfolioId}/brands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brandIds }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add brands");
  }

  return res.json();
}

// Remove brand from portfolio
async function removeBrandFromPortfolio(portfolioId: string, brandId: string) {
  const res = await fetch(`/api/portfolios/${portfolioId}/brands?brandId=${brandId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove brand");
  }

  return res.json();
}

export default function PortfolioSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const portfolioId = params.id as string;

  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);

  // Fetch portfolio data
  const {
    data: portfolio,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["portfolio", portfolioId],
    queryFn: () => fetchPortfolio(portfolioId),
  });

  // Fetch available brands
  const { data: allBrands } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchAvailableBrands,
  });

  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form when portfolio data loads
  React.useEffect(() => {
    if (portfolio) {
      form.reset({
        name: portfolio.name,
        description: portfolio.description || "",
      });
    }
  }, [portfolio, form]);

  // Update portfolio mutation
  const updateMutation = useMutation({
    mutationFn: (data: PortfolioFormValues) => updatePortfolio(portfolioId, data),
    onSuccess: (data) => {
      toast({
        title: "Portfolio Updated",
        description: `${data.portfolio.name} has been successfully updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      router.push(`/dashboard/portfolios/${portfolioId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete portfolio mutation
  const deleteMutation = useMutation({
    mutationFn: () => deletePortfolio(portfolioId),
    onSuccess: () => {
      toast({
        title: "Portfolio Deleted",
        description: "The portfolio has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      router.push("/dashboard/portfolios");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add brands mutation
  const addBrandsMutation = useMutation({
    mutationFn: (brandIds: string[]) => addBrandsToPortfolio(portfolioId, brandIds),
    onSuccess: (data) => {
      toast({
        title: "Brands Added",
        description: `${data.added} brand(s) added to portfolio.`,
      });
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
      setSelectedBrands([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove brand mutation
  const removeBrandMutation = useMutation({
    mutationFn: (brandId: string) => removeBrandFromPortfolio(portfolioId, brandId),
    onSuccess: () => {
      toast({
        title: "Brand Removed",
        description: "Brand has been removed from portfolio.",
      });
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: PortfolioFormValues) => {
    updateMutation.mutate(values);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleAddBrands = () => {
    if (selectedBrands.length === 0) {
      toast({
        title: "No Brands Selected",
        description: "Please select at least one brand to add.",
        variant: "destructive",
      });
      return;
    }
    addBrandsMutation.mutate(selectedBrands);
  };

  const handleRemoveBrand = (brandId: string) => {
    removeBrandMutation.mutate(brandId);
  };

  // Get brands not in portfolio
  const availableBrands = React.useMemo(() => {
    if (!allBrands || !portfolio?.brands) return [];
    const portfolioBrandIds = new Set(portfolio.brands.map((pb) => pb.brandId));
    return allBrands.filter((brand) => !portfolioBrandIds.has(brand.id));
  }, [allBrands, portfolio]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="card-secondary p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Portfolio Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The portfolio you're trying to edit doesn't exist or you don't have access to it.
          </p>
          <Button
            onClick={() => router.push("/dashboard/portfolios")}
            variant="default"
          >
            Back to Portfolios
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
            onClick={() => router.push(`/dashboard/portfolios/${portfolioId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Portfolio Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your portfolio settings and brands
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information Form */}
      <Card className="card-secondary border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Basic Information</CardTitle>
          <CardDescription>
            Update your portfolio name and description
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Portfolio Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>
                      Portfolio Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Portfolio"
                        {...field}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormDescription>
                      The name that identifies this portfolio
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
                        placeholder="A brief description of this portfolio..."
                        className="bg-background min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of what this portfolio tracks
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/portfolios/${portfolioId}`)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
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
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Manage Brands */}
      <Card className="card-secondary border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Manage Brands</CardTitle>
          <CardDescription>
            Add or remove brands from this portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Brands */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              Current Brands ({portfolio.brands?.length || 0})
            </h3>
            {portfolio.brands && portfolio.brands.length > 0 ? (
              <div className="space-y-2">
                {portfolio.brands.map((pb) => (
                  <div
                    key={pb.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        {pb.brand.logoUrl ? (
                          <img
                            src={pb.brand.logoUrl}
                            alt={pb.brand.name}
                            className="h-6 w-6 rounded object-contain"
                          />
                        ) : (
                          <SettingsIcon className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {pb.brand.name}
                        </p>
                        {pb.brand.domain && (
                          <p className="text-xs text-muted-foreground">
                            {pb.brand.domain}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBrand(pb.brandId)}
                      disabled={removeBrandMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No brands in this portfolio yet.
              </p>
            )}
          </div>

          {/* Add Brands */}
          {availableBrands.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                Add Brands
              </h3>
              <div className="space-y-2">
                {availableBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50"
                  >
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={selectedBrands.includes(brand.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBrands([...selectedBrands, brand.id]);
                        } else {
                          setSelectedBrands(selectedBrands.filter((id) => id !== brand.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`brand-${brand.id}`}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        {brand.logoUrl ? (
                          <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="h-6 w-6 rounded object-contain"
                          />
                        ) : (
                          <SettingsIcon className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {brand.name}
                        </p>
                        {brand.domain && (
                          <p className="text-xs text-muted-foreground">
                            {brand.domain}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleAddBrands}
                disabled={selectedBrands.length === 0 || addBrandsMutation.isPending}
                className="w-full"
              >
                {addBrandsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Selected Brands ({selectedBrands.length})
                  </>
                )}
              </Button>
            </div>
          )}

          {availableBrands.length === 0 && portfolio.brands && portfolio.brands.length > 0 && (
            <p className="text-sm text-muted-foreground">
              All available brands are already in this portfolio.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="card-tertiary border-0 border-l-4 border-l-destructive">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={updateMutation.isPending || deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Portfolio
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Portfolio?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete "{portfolio.name}"
                  and remove all brand associations. The brands themselves will not be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Portfolio"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                <li>• Changes to portfolio name will affect how it appears across the dashboard</li>
                <li>• Adding brands will immediately include them in portfolio analytics</li>
                <li>• Removing brands will exclude them from portfolio metrics but won't delete the brand</li>
                <li>• Deleting a portfolio only removes brand associations, not the brands themselves</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
