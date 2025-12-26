"use client";

import * as React from "react";
import { ChevronDown, Plus, Building2, Settings, Loader2 } from "lucide-react";
import { useBrandStore, useSelectedBrand, useBrands, useBrandMeta } from "@/stores";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface BrandSelectorProps {
  className?: string;
}

export function BrandSelector({ className }: BrandSelectorProps) {
  const selectedBrand = useSelectedBrand();
  const brands = useBrands();
  const meta = useBrandMeta();
  const { setSelectedBrandId, refreshBrands, isLoading } = useBrandStore();

  // Load brands on mount
  React.useEffect(() => {
    refreshBrands();
  }, [refreshBrands]);

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
  };

  const handleManageBrands = () => {
    window.location.href = "/dashboard/brands";
  };

  const handleAddBrand = () => {
    window.location.href = "/dashboard/brands?action=new";
  };

  // Get brand initials for avatar
  const getBrandInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Get brand color for avatar background
  const getBrandColor = (brand: { visual?: { primaryColor?: string | null } }) => {
    return brand?.visual?.primaryColor || "#4926FA";
  };

  if (isLoading && brands.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddBrand}
        className={cn(
          "gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/10",
          className
        )}
      >
        <Plus className="h-4 w-4" />
        <span>Add Your First Brand</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "gap-2 h-9 px-3 hover:bg-muted/50 focus-ring-primary",
            className
          )}
          aria-label={selectedBrand?.name ? `Selected brand: ${selectedBrand.name}` : "Select a brand"}
        >
          {/* Brand Avatar */}
          <div
            className="flex items-center justify-center h-6 w-6 rounded-md text-xs font-semibold text-white"
            style={{ backgroundColor: getBrandColor(selectedBrand || {}) }}
            aria-hidden="true"
          >
            {selectedBrand?.logoUrl ? (
              <img
                src={selectedBrand.logoUrl}
                alt=""
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              getBrandInitials(selectedBrand?.name || "Brand")
            )}
          </div>

          {/* Brand Name */}
          <span className="max-w-[120px] truncate text-sm font-medium">
            {selectedBrand?.name || "Select Brand"}
          </span>

          {/* Chevron */}
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 glass-tooltip">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Your Brands</span>
          <span className="text-xs font-normal text-muted-foreground">
            {meta?.total ?? 0}/{meta?.limit ?? 1}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Brand List */}
        <div className="max-h-[240px] overflow-y-auto" role="group" aria-label="Available brands">
          {brands.map((brand) => (
            <DropdownMenuItem
              key={brand.id}
              onClick={() => handleSelectBrand(brand.id)}
              className={cn(
                "gap-3 cursor-pointer",
                selectedBrand?.id === brand.id && "bg-primary/10"
              )}
              aria-current={selectedBrand?.id === brand.id ? "true" : undefined}
            >
              {/* Brand Avatar */}
              <div
                className="flex items-center justify-center h-8 w-8 rounded-md text-xs font-semibold text-white shrink-0"
                style={{ backgroundColor: getBrandColor(brand) }}
                aria-hidden="true"
              >
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt=""
                    className="h-full w-full rounded-md object-cover"
                  />
                ) : (
                  getBrandInitials(brand.name)
                )}
              </div>

              {/* Brand Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{brand.name}</div>
                {brand.domain && (
                  <div className="text-xs text-muted-foreground truncate">
                    {brand.domain}
                  </div>
                )}
              </div>

              {/* Selected Indicator */}
              {selectedBrand?.id === brand.id && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0" aria-label="Currently selected" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        {/* Add Brand */}
        {meta?.canAddMore && (
          <DropdownMenuItem onClick={handleAddBrand} className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Add New Brand</span>
          </DropdownMenuItem>
        )}

        {/* Upgrade prompt if at limit */}
        {!meta?.canAddMore && (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            <p>
              Brand limit reached ({meta?.limit}).{" "}
              <a
                href="/dashboard/settings?tab=billing"
                className="text-primary hover:underline focus-ring-primary rounded-sm"
                aria-label="Upgrade to add more brands"
              >
                Upgrade
              </a>{" "}
              for more.
            </p>
          </div>
        )}

        {/* Manage Brands */}
        <DropdownMenuItem onClick={handleManageBrands} className="gap-2 cursor-pointer">
          <Settings className="h-4 w-4" />
          <span>Manage Brands</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
