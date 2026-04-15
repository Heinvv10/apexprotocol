/**
 * @vitest-environment jsdom
 *
 * Monitor Page - Brand Integration Tests
 *
 * PAI Doc-Driven TDD: Tests written BEFORE implementation
 * These tests will FAIL initially until Monitor page is connected to brand context
 *
 * Requirements from plan:
 * - Connect Monitor page to real API using selected brand context
 * - Fetch mentions when brand is selected
 * - Display mentions in SmartTable with real data
 * - Show appropriate loading/empty/error states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { Brand } from "@/stores/brand-store";

// Mock the stores module
const mockUseSelectedBrand = vi.fn();
const mockUseBrands = vi.fn();

vi.mock("@/stores", () => ({
  useBrandStore: vi.fn((selector) => {
    const state = {
      brands: mockUseBrands() || [],
      selectedBrand: mockUseSelectedBrand(),
      selectedBrandId: mockUseSelectedBrand()?.id ?? null,
      meta: { total: 1, limit: 5, plan: "professional", canAddMore: true },
      isLoading: false,
      error: null,
      setSelectedBrandId: vi.fn(),
      refreshBrands: vi.fn(),
    };
    if (typeof selector === "function") {
      return selector(state);
    }
    return state;
  }),
  useSelectedBrand: () => mockUseSelectedBrand(),
  useBrands: () => mockUseBrands() || [],
  useBrandMeta: () => ({ total: 1, limit: 5, plan: "professional", canAddMore: true }),
}));

// Mock the useMonitor hook
const mockUseMentionsByBrand = vi.fn();

vi.mock("@/hooks/useMonitor", () => ({
  useMentionsByBrand: (brandId: string, filters: unknown) => mockUseMentionsByBrand(brandId, filters),
  useMentions: vi.fn(),
  Mention: {},
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

// Sample mention data matching Mention interface from useMonitor
const mockMentions = [
  {
    id: "mention-1",
    brandId: "brand-1",
    platform: "chatgpt",
    query: "What is the best test brand?",
    response: "Test Brand is highly recommended...",
    sentiment: "positive" as const,
    sentimentScore: 0.85,
    position: 1,
    citationUrl: "https://example.com/citation",
    mentioned: true,
    status: "new" as const,
    tags: ["competitor1"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "mention-2",
    brandId: "brand-1",
    platform: "claude",
    query: "Tell me about Test Brand",
    response: "Test Brand offers excellent services...",
    sentiment: "positive" as const,
    sentimentScore: 0.9,
    position: 2,
    mentioned: true,
    status: "reviewed" as const,
    createdAt: new Date().toISOString(),
  },
];

// Mock response structure matching MentionListResponse
const mockMentionsResponse = {
  mentions: mockMentions,
  total: mockMentions.length,
  page: 1,
  limit: 50,
  totalPages: 1,
  filters: {},
};

// Import AFTER mocking
import MonitorPage from "../page";

describe("Monitor Page - Brand Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Default: brand selected with mentions
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseMentionsByBrand.mockReturnValue({
      data: mockMentionsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  describe("Expected Behavior", () => {
    it("should fetch mentions when brand is selected", async () => {
      render(<MonitorPage />);

      // The page should use the selected brand to fetch mentions
      // This test verifies the page integrates with brand context
      await waitFor(() => {
        // Should show the Live Query Analysis section (not empty state)
        expect(screen.getByText("Live Query Analysis")).toBeInTheDocument();
      });
    });

    it("should display mentions in SmartTable with real data", async () => {
      render(<MonitorPage />);

      await waitFor(() => {
        // Should show mention queries in the table
        expect(screen.getByText(/What is the best test brand/i)).toBeInTheDocument();
        expect(screen.getByText(/Tell me about Test Brand/i)).toBeInTheDocument();
      });
    });

    it("should filter mentions by selected brand", async () => {
      render(<MonitorPage />);

      // The mentions shown should only be for the selected brand
      await waitFor(() => {
        // Verify useMentionsByBrand is called with brand id
        expect(mockUseMentionsByBrand).toHaveBeenCalledWith(mockBrand.id, expect.any(Object));
      });
    });

    it("should show platform icons for each mention", async () => {
      render(<MonitorPage />);

      await waitFor(() => {
        // Should display platform indicators (ChatGPT, Claude icons)
        // Use getAllByText since platform names may appear multiple times
        expect(screen.getAllByText(/chatgpt/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/claude/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should show 'Select a brand to view monitoring' when no brand selected", async () => {
      mockUseSelectedBrand.mockReturnValue(null);
      mockUseMentionsByBrand.mockReturnValue({
        data: { mentions: [], total: 0, page: 1, limit: 50, totalPages: 0, filters: {} },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<MonitorPage />);

      await waitFor(() => {
        // Should prompt user to select a brand
        expect(screen.getByText(/select a brand/i)).toBeInTheDocument();
      });
    });

    it("should show loading skeleton while fetching", async () => {
      mockUseMentionsByBrand.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<MonitorPage />);

      // Should show loading indicator
      expect(screen.getByTestId("monitor-loading")).toBeInTheDocument();
    });

    it("should show empty state when brand has no mentions", async () => {
      mockUseMentionsByBrand.mockReturnValue({
        data: { mentions: [], total: 0, page: 1, limit: 50, totalPages: 0, filters: {} },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<MonitorPage />);

      await waitFor(() => {
        // Should show empty state message
        expect(screen.getByText(/no monitoring configured/i)).toBeInTheDocument();
      });
    });
  });

  describe("Failure Cases", () => {
    it("should show error state when API fails", async () => {
      mockUseMentionsByBrand.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch mentions"),
        refetch: vi.fn(),
      });

      render(<MonitorPage />);

      await waitFor(() => {
        // Should show error heading
        expect(screen.getByRole("heading", { name: /failed to load mentions/i })).toBeInTheDocument();
      });
    });

    it("should retry fetch on error with retry button", async () => {
      const mockRefetch = vi.fn();
      mockUseMentionsByBrand.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch mentions"),
        refetch: mockRefetch,
      });

      render(<MonitorPage />);

      await waitFor(() => {
        // Should have a retry button
        const retryButton = screen.getByRole("button", { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });
});

describe("Monitor Page - Data Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseMentionsByBrand.mockReturnValue({
      data: mockMentionsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("should pass brandId to useMentionsByBrand hook", () => {
    render(<MonitorPage />);

    // Verify useMentionsByBrand is called with brand id
    expect(mockUseMentionsByBrand).toHaveBeenCalledWith(mockBrand.id, expect.any(Object));
  });

  it("should update when selected brand changes", async () => {
    const { rerender } = render(<MonitorPage />);

    // Change selected brand
    const newBrand = { ...mockBrand, id: "brand-2", name: "New Brand" };
    mockUseSelectedBrand.mockReturnValue(newBrand);

    rerender(<MonitorPage />);

    // The hook should be called again with new brand id
    expect(mockUseMentionsByBrand).toHaveBeenCalledWith("brand-2", expect.any(Object));
  });
});
