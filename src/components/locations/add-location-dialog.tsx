"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// ============================================================================
// Types & Schema
// ============================================================================

const locationTypes = [
  { value: "headquarters", label: "Headquarters" },
  { value: "branch", label: "Branch" },
  { value: "store", label: "Store" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "factory", label: "Factory" },
  { value: "distribution_center", label: "Distribution Center" },
] as const;

const addLocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  locationType: z.enum([
    "headquarters",
    "branch",
    "store",
    "office",
    "warehouse",
    "factory",
    "distribution_center",
  ]).optional(),
  isPrimary: z.boolean().optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").or(z.literal("")).optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
});

type AddLocationFormData = z.infer<typeof addLocationSchema>;

interface AddLocationDialogProps {
  brandId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ============================================================================
// AddLocationDialog Component
// ============================================================================

export function AddLocationDialog({
  brandId,
  open,
  onOpenChange,
  onSuccess,
}: AddLocationDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<AddLocationFormData>({
    resolver: zodResolver(addLocationSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      locationType: "headquarters",
      isPrimary: false,
      phone: "",
      website: "",
      email: "",
    },
  });

  const handleSubmit = async (data: AddLocationFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          ...data,
          website: data.website || undefined,
          email: data.email || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create location");
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create location");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Add Location
          </DialogTitle>
          <DialogDescription>
            Add a new physical location for your brand. You can sync it with Google Places later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Location Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Location Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Main Office, Downtown Store"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-error">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Location Type & Primary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationType">Type</Label>
              <Select
                value={form.watch("locationType")}
                onValueChange={(value) =>
                  form.setValue("locationType", value as AddLocationFormData["locationType"])
                }
              >
                <SelectTrigger id="locationType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isPrimary">Primary Location</Label>
              <div className="flex items-center h-10 gap-2">
                <Switch
                  id="isPrimary"
                  checked={form.watch("isPrimary")}
                  onCheckedChange={(checked) => form.setValue("isPrimary", checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {form.watch("isPrimary") ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              placeholder="123 Main Street"
              {...form.register("address")}
            />
          </div>

          {/* City, State, Postal */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                {...form.register("city")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                placeholder="State"
                {...form.register("state")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                placeholder="12345"
                {...form.register("postalCode")}
              />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="Country"
              {...form.register("country")}
            />
          </div>

          {/* Contact Info */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-sm font-medium text-foreground mb-3">
              Contact Information (Optional)
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...form.register("phone")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="location@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-error">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  {...form.register("website")}
                />
                {form.formState.errors.website && (
                  <p className="text-xs text-error">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Location"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
