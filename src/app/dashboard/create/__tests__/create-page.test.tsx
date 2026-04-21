/**
 * @vitest-environment jsdom
 *
 * Create Page - Brand Integration Tests
 *
 * PAI Doc-Driven TDD: Tests written BEFORE implementation
 * These tests will FAIL initially until Create page is connected to brand context
 *
 * Requirements from plan:
 * - Load brand voice settings when brand selected
 * - Display brand keywords as suggestions
 * - Pass brand context to content generation API
 * - Show appropriate loading/empty/error states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

// Mock the useContent hooks
const mockUseContentByBrand = vi.fn();
const mockUseDeleteContent = vi.fn();
const mockUseUpdateContent = vi.fn();

vi.mock("@/hooks/useContent", () => ({
  useContentByBrand: (brandId: string, filters: unknown) =>
    mockUseContentByBrand(brandId, filters),
  useDeleteContent: () => mockUseDeleteContent(),
  useUpdateContent: () => mockUseUpdateContent(),
  Content: {},
  ContentStatus: {},
  ContentType: {},
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample brand data with voice settings
const mockBrand: Brand = {
  id: "brand-1",
  organizationId: "org-1",
  name: "Test Brand",
  domain: "testbrand.com",
  description: "A test brand for AI visibility",
  tagline: "Testing is believing",
  industry: "Technology",
  logoUrl: null,
  keywords: ["test", "brand", "quality"],
  seoKeywords: ["SEO test", "search optimization"],
  geoKeywords: ["AI visibility", "LLM optimization"],
  competitors: [
    { name: "Competitor A", url: "https://competitor-a.com", reason: "Main competitor" },
    { name: "Competitor B", url: "https://competitor-b.com", reason: "Secondary competitor" },
  ],
  valuePropositions: ["Value 1", "Value 2"],
  socialLinks: {},
  locations: [],
  personnel: [],
  voice: {
    tone: "professional",
    personality: ["Innovative", "Trustworthy"],
    targetAudience: "Developers and marketers",
    keyMessages: ["AI-first approach", "Data-driven decisions"],
    avoidTopics: ["Competitor bashing"],
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

// Sample content data matching Content interface from useContent
const mockContentItems = [
  {
    id: "content-1",
    brandId: "brand-1",
    title: "AI Visibility Guide",
    type: "blog" as const,
    status: "published" as const,
    content: "Full content here...",
    excerpt: "Learn how to improve your AI visibility",
    keywords: ["AI", "visibility"],
    aiGenerated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "content-2",
    brandId: "brand-1",
    title: "FAQ Schema Guide",
    type: "faq" as const,
    status: "draft" as const,
    content: "FAQ content...",
    excerpt: "Implement FAQ schema for better AI comprehension",
    keywords: ["FAQ", "schema"],
    aiGenerated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock response structure matching ContentListResponse
const mockContentResponse = {
  content: mockContentItems,
  total: mockContentItems.length,
  page: 1,
  limit: 50,
  totalPages: 1,
};

// Mock mutation functions
const mockDeleteMutate = vi.fn();
const mockUpdateMutate = vi.fn();

// Import AFTER mocking
import CreatePage from "../page";

describe("Create Page - Brand Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Default: brand selected with content
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseContentByBrand.mockReturnValue({
      data: mockContentResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseDeleteContent.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    });
    mockUseUpdateContent.mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    });
  });

  describe("Expected Behavior", () => {
    it("should fetch content when brand is selected", async () => {
      render(<CreatePage />);

      // The page should use the selected brand to fetch content
      await waitFor(() => {
        // Should show the Create heading (not empty state)
        expect(screen.getByText("Create")).toBeInTheDocument();
      });
    });

    it("should display content list from API", async () => {
      render(<CreatePage />);

      await waitFor(() => {
        // Should show content titles from API
        expect(screen.getByText("AI Visibility Guide")).toBeInTheDocument();
        expect(screen.getByText("FAQ Schema Guide")).toBeInTheDocument();
      });
    });

    it("should pass brandId to useContentByBrand hook", () => {
      render(<CreatePage />);

      // Verify useContentByBrand is called with brand id
      expect(mockUseContentByBrand).toHaveBeenCalledWith(mockBrand.id, expect.any(Object));
    });

    it("should show brand voice info panel", async () => {
      render(<CreatePage />);

      await waitFor(() => {
        // Should display brand voice settings
        expect(screen.getByText(/professional/i)).toBeInTheDocument();
        // Should show target audience
        expect(screen.getByText(/developers/i)).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should show 'Select a brand' when no brand selected", async () => {
      mockUseSelectedBrand.mockReturnValue(null);
      mockUseContentByBrand.mockReturnValue({
        data: { content: [], total: 0, page: 1, limit: 50, totalPages: 0 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<CreatePage />);

      await waitFor(() => {
        // Should prompt user to select a brand
        expect(screen.getByText(/select a brand/i)).toBeInTheDocument();
      });
    });

    it("should show loading state while fetching content", async () => {
      mockUseContentByBrand.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<CreatePage />);

      // Should show loading indicator
      expect(screen.getByTestId("content-loading")).toBeInTheDocument();
    });

    it("should show empty state when brand has no content", async () => {
      mockUseContentByBrand.mockReturnValue({
        data: { content: [], total: 0, page: 1, limit: 50, totalPages: 0 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<CreatePage />);

      await waitFor(() => {
        // Should show empty state message
        expect(screen.getByText(/no content yet/i)).toBeInTheDocument();
      });
    });

    it("should filter content by search query", async () => {
      const user = userEvent.setup();
      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("AI Visibility Guide")).toBeInTheDocument();
      });

      // Type in search box
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, "FAQ");

      await waitFor(() => {
        // Should only show FAQ content
        expect(screen.getByText("FAQ Schema Guide")).toBeInTheDocument();
        expect(screen.queryByText("AI Visibility Guide")).not.toBeInTheDocument();
      });
    });
  });

  describe("Content Operations", () => {
    it("should have delete mutation hook initialized", async () => {
      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("AI Visibility Guide")).toBeInTheDocument();
      });

      // Verify useDeleteContent hook is called and ready
      expect(mockUseDeleteContent).toHaveBeenCalled();
    });

    it("should have update mutation hook initialized", async () => {
      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("AI Visibility Guide")).toBeInTheDocument();
      });

      // Verify useUpdateContent hook is called and ready
      expect(mockUseUpdateContent).toHaveBeenCalled();
    });
  });

  describe("Failure Cases", () => {
    it("should show error state when content fetch fails", async () => {
      mockUseContentByBrand.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch content"),
        refetch: vi.fn(),
      });

      render(<CreatePage />);

      await waitFor(() => {
        // Should show error heading
        expect(
          screen.getByRole("heading", { name: /failed to load content/i })
        ).toBeInTheDocument();
      });
    });

    it("should have retry button on error state", async () => {
      const mockRefetch = vi.fn();
      mockUseContentByBrand.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch content"),
        refetch: mockRefetch,
      });

      render(<CreatePage />);

      await waitFor(() => {
        // Should have a retry button
        const retryButton = screen.getByRole("button", { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });
});

describe("Create Page - Data Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseContentByBrand.mockReturnValue({
      data: mockContentResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseDeleteContent.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    });
    mockUseUpdateContent.mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    });
  });

  it("should pass brandId to useContentByBrand hook", () => {
    render(<CreatePage />);

    // Verify useContentByBrand is called with brand id
    expect(mockUseContentByBrand).toHaveBeenCalledWith(mockBrand.id, expect.any(Object));
  });

  it("should update when selected brand changes", async () => {
    const { rerender } = render(<CreatePage />);

    // Change selected brand
    const newBrand = { ...mockBrand, id: "brand-2", name: "New Brand" };
    mockUseSelectedBrand.mockReturnValue(newBrand);

    rerender(<CreatePage />);

    // The hook should be called again with new brand id
    expect(mockUseContentByBrand).toHaveBeenCalledWith("brand-2", expect.any(Object));
  });
});
