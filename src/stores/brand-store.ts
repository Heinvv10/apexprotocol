import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Competitor with full details
export interface BrandCompetitor {
  name: string;
  url: string;
  reason: string;
}

// AI analysis confidence scores
export interface BrandConfidence {
  overall: number;
  perField: Record<string, number>;
}

export interface Brand {
  id: string;
  organizationId: string;
  name: string;
  domain: string | null;
  description: string | null;
  tagline: string | null;
  industry: string | null;
  logoUrl: string | null;
  // Keywords (expanded)
  keywords: string[];
  seoKeywords: string[];
  geoKeywords: string[];
  // Competitors with full details
  competitors: BrandCompetitor[];
  // Brand positioning
  valuePropositions: string[];
  socialLinks: Record<string, string>;
  // Voice settings
  voice: {
    tone: "professional" | "friendly" | "authoritative" | "casual" | "formal";
    personality: string[];
    targetAudience: string;
    keyMessages: string[];
    avoidTopics: string[];
  };
  // Visual settings (expanded)
  visual: {
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    colorPalette: string[];
    fontFamily: string | null;
  };
  // Confidence scores
  confidence: BrandConfidence;
  // Monitoring
  monitoringEnabled: boolean;
  monitoringPlatforms: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BrandMeta {
  total: number;
  limit: number;
  plan: "starter" | "professional" | "enterprise";
  canAddMore: boolean;
}

interface BrandState {
  // Brands list
  brands: Brand[];
  meta: BrandMeta | null;
  isLoading: boolean;
  error: string | null;

  // Selected brand
  selectedBrandId: string | null;
  selectedBrand: Brand | null;

  // Actions
  setBrands: (brands: Brand[], meta: BrandMeta) => void;
  setSelectedBrandId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addBrand: (brand: Brand) => void;
  updateBrand: (id: string, updates: Partial<Brand>) => void;
  removeBrand: (id: string) => void;
  refreshBrands: () => Promise<void>;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set, get) => ({
      brands: [],
      meta: null,
      isLoading: false,
      error: null,
      selectedBrandId: null,
      selectedBrand: null,

      setBrands: (brands, meta) => {
        const { selectedBrandId } = get();
        // If current selection is invalid, select first brand
        const validSelection = brands.find((b) => b.id === selectedBrandId);
        const newSelectedId = validSelection?.id ?? brands[0]?.id ?? null;
        const newSelectedBrand = brands.find((b) => b.id === newSelectedId) ?? null;

        set({
          brands,
          meta,
          selectedBrandId: newSelectedId,
          selectedBrand: newSelectedBrand,
        });
      },

      setSelectedBrandId: (id) => {
        const { brands } = get();
        const selectedBrand = brands.find((b) => b.id === id) ?? null;
        set({ selectedBrandId: id, selectedBrand });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      addBrand: (brand) => {
        const { brands, meta } = get();
        const newBrands = [...brands, brand];
        const newMeta = meta
          ? {
              ...meta,
              total: meta.total + 1,
              canAddMore: newBrands.length < meta.limit,
            }
          : null;
        set({ brands: newBrands, meta: newMeta });
      },

      updateBrand: (id, updates) => {
        const { brands, selectedBrand } = get();
        const newBrands = brands.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        );
        const newSelectedBrand =
          selectedBrand?.id === id
            ? { ...selectedBrand, ...updates }
            : selectedBrand;
        set({ brands: newBrands, selectedBrand: newSelectedBrand });
      },

      removeBrand: (id) => {
        const { brands, meta, selectedBrandId } = get();
        const newBrands = brands.filter((b) => b.id !== id);
        const newMeta = meta
          ? {
              ...meta,
              total: meta.total - 1,
              canAddMore: newBrands.length < meta.limit,
            }
          : null;

        // If we removed the selected brand, select the first available
        let newSelectedId = selectedBrandId;
        let newSelectedBrand = null;
        if (selectedBrandId === id) {
          newSelectedId = newBrands[0]?.id ?? null;
          newSelectedBrand = newBrands[0] ?? null;
        } else {
          newSelectedBrand = newBrands.find((b) => b.id === newSelectedId) ?? null;
        }

        set({
          brands: newBrands,
          meta: newMeta,
          selectedBrandId: newSelectedId,
          selectedBrand: newSelectedBrand,
        });
      },

      refreshBrands: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/brands");
          const data = await response.json();

          if (data.success) {
            get().setBrands(data.data.brands, data.data.meta);
          } else {
            set({ error: data.error || "Failed to load brands" });
          }
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to load brands",
          });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "apex-brand-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedBrandId: state.selectedBrandId,
      }),
    }
  )
);

// Selector hooks
export const useSelectedBrand = () =>
  useBrandStore((state) => state.selectedBrand);
export const useBrands = () => useBrandStore((state) => state.brands);
export const useBrandMeta = () => useBrandStore((state) => state.meta);
