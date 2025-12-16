/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Brand } from "@/stores/brand-store";

// Mock the stores module
const mockUseSelectedBrand = vi.fn();
const mockUseBrands = vi.fn();
const mockUseBrandMeta = vi.fn();
const mockSetSelectedBrandId = vi.fn();
const mockRefreshBrands = vi.fn();

vi.mock("@/stores", () => ({
  useBrandStore: vi.fn((selector) => {
    const state = {
      brands: mockUseBrands(),
      selectedBrand: mockUseSelectedBrand(),
      selectedBrandId: mockUseSelectedBrand()?.id ?? null,
      meta: mockUseBrandMeta(),
      isLoading: false,
      error: null,
      setSelectedBrandId: mockSetSelectedBrandId,
      refreshBrands: mockRefreshBrands,
      setBrands: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      addBrand: vi.fn(),
      updateBrand: vi.fn(),
      removeBrand: vi.fn(),
    };
    if (typeof selector === "function") {
      return selector(state);
    }
    return state;
  }),
  useSelectedBrand: () => mockUseSelectedBrand(),
  useBrands: () => mockUseBrands(),
  useBrandMeta: () => mockUseBrandMeta(),
}));

// Import BrandSelector AFTER mocking
import { BrandSelector } from "../brand-selector";

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// BrandMeta interface (matches store)
interface BrandMeta {
  total: number;
  limit: number;
  plan: "starter" | "professional" | "enterprise";
  canAddMore: boolean;
}

// Sample brand data
const mockBrand: Brand = {
  id: "brand-1",
  organizationId: "org-1",
  name: "Test Brand",
  domain: "testbrand.com",
  description: "A test brand",
  tagline: "Testing is believing",
  industry: "Technology",
  logoUrl: null,
  keywords: ["test", "brand"],
  seoKeywords: ["seo", "keywords"],
  geoKeywords: ["geo", "keywords"],
  competitors: [],
  valuePropositions: ["Value 1"],
  socialLinks: {},
  voice: {
    tone: "professional",
    personality: ["Innovative"],
    targetAudience: "Developers",
    keyMessages: ["Test message"],
    avoidTopics: [],
  },
  visual: {
    primaryColor: "#00E5CC",
    secondaryColor: null,
    accentColor: null,
    colorPalette: [],
    fontFamily: null,
  },
  confidence: {
    overall: 85,
    perField: {},
  },
  monitoringEnabled: true,
  monitoringPlatforms: ["chatgpt", "claude"],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockBrand2: Brand = {
  ...mockBrand,
  id: "brand-2",
  name: "Second Brand",
  domain: "secondbrand.com",
  visual: {
    ...mockBrand.visual,
    primaryColor: "#8B5CF6",
  },
};

const mockMeta: BrandMeta = {
  total: 2,
  limit: 5,
  plan: "professional",
  canAddMore: true,
};

describe("BrandSelector Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Default mock setup
    mockUseBrands.mockReturnValue([mockBrand, mockBrand2]);
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrandMeta.mockReturnValue(mockMeta);
  });

  describe("Expected Behavior", () => {
    it("should render BrandSelector in header", () => {
      render(<BrandSelector />);

      // Should display the selected brand name
      expect(screen.getByText("Test Brand")).toBeInTheDocument();
    });

    it("should display selected brand name when brand is selected", () => {
      render(<BrandSelector />);

      expect(screen.getByText("Test Brand")).toBeInTheDocument();
    });

    it("should show brand dropdown menu on click", async () => {
      const user = userEvent.setup();

      render(<BrandSelector />);

      // Click the selector button
      const button = screen.getByRole("button");
      await user.click(button);

      // Dropdown should show brand list header
      await waitFor(() => {
        expect(screen.getByText("Your Brands")).toBeInTheDocument();
      });
    });

    it("should show all brands in dropdown", async () => {
      const user = userEvent.setup();

      render(<BrandSelector />);

      // Open dropdown
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        // In dropdown, brand names appear multiple times (selector + list)
        expect(screen.getAllByText("Test Brand").length).toBeGreaterThan(0);
        expect(screen.getByText("Second Brand")).toBeInTheDocument();
      });
    });

    it("should call setSelectedBrandId when brand is selected", async () => {
      const user = userEvent.setup();

      render(<BrandSelector />);

      // Open dropdown
      await user.click(screen.getByRole("button"));

      // Wait for dropdown content and click second brand
      await waitFor(() => {
        expect(screen.getByText("Second Brand")).toBeInTheDocument();
      });

      const secondBrand = screen.getByText("Second Brand");
      await user.click(secondBrand);

      expect(mockSetSelectedBrandId).toHaveBeenCalledWith("brand-2");
    });
  });

  describe("Edge Cases", () => {
    it("should show 'Select Brand' when no brand selected", () => {
      mockUseSelectedBrand.mockReturnValue(null);

      render(<BrandSelector />);

      expect(screen.getByText("Select Brand")).toBeInTheDocument();
    });

    it("should handle empty brands list gracefully", () => {
      mockUseBrands.mockReturnValue([]);
      mockUseSelectedBrand.mockReturnValue(null);
      mockUseBrandMeta.mockReturnValue({ ...mockMeta, total: 0, canAddMore: true });

      render(<BrandSelector />);

      // Should show "Add Your First Brand" CTA
      expect(screen.getByText("Add Your First Brand")).toBeInTheDocument();
    });

    it("should show brand count in dropdown header", async () => {
      const user = userEvent.setup();

      render(<BrandSelector />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("2/5")).toBeInTheDocument();
      });
    });

    it("should show 'Add New Brand' when user can add more brands", async () => {
      const user = userEvent.setup();

      render(<BrandSelector />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Add New Brand")).toBeInTheDocument();
      });
    });

    it("should show upgrade prompt when at brand limit", async () => {
      mockUseBrandMeta.mockReturnValue({ total: 5, limit: 5, plan: "professional" as const, canAddMore: false });
      const user = userEvent.setup();

      render(<BrandSelector />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText(/Brand limit reached/)).toBeInTheDocument();
        expect(screen.getByText("Upgrade")).toBeInTheDocument();
      });
    });
  });

  describe("Visual Indicators", () => {
    it("should call refreshBrands on mount", () => {
      render(<BrandSelector />);

      expect(mockRefreshBrands).toHaveBeenCalled();
    });

    it("should display brand initials when no logo is provided", () => {
      mockUseSelectedBrand.mockReturnValue({ ...mockBrand, logoUrl: null });

      render(<BrandSelector />);

      // "Test Brand" should show initials "TB"
      expect(screen.getByText("TB")).toBeInTheDocument();
    });

    it("should show brand domain in dropdown when available", async () => {
      const user = userEvent.setup();

      render(<BrandSelector />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("testbrand.com")).toBeInTheDocument();
      });
    });
  });
});

describe("Dashboard Layout - Brand Selector Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrandMeta.mockReturnValue(mockMeta);
  });

  it("should render BrandSelector within dashboard header context", () => {
    render(<BrandSelector />);

    // Verify brand selector renders with expected content
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Test Brand")).toBeInTheDocument();
  });

  it("should have proper structure for header placement", () => {
    render(<BrandSelector />);

    // Should have a button trigger for the dropdown
    const button = screen.getByRole("button");
    expect(button).toHaveClass("gap-2"); // Verify styling class
  });
});
