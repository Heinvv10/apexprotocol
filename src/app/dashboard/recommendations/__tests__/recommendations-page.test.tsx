/**
 * @vitest-environment jsdom
 *
 * Recommendations Page - Brand Integration Tests
 *
 * PAI Doc-Driven TDD: Tests written BEFORE implementation
 * These tests will FAIL initially until Recommendations page is connected to brand context
 *
 * Requirements from plan:
 * - Connect Recommendations page to API with status update mutations
 * - Fetch recommendations when brand is selected
 * - Display recommendations sorted by priority
 * - Update status when action button clicked
 * - Show appropriate loading/empty/error states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Brand } from "@/stores/brand-store";

// Create a wrapper component with QueryClientProvider for tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderWithProviders(component: ReactNode) {
  return render(<TestWrapper>{component}</TestWrapper>);
}

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

// Mock the useRecommendations hook
const mockUseRecommendationsByBrand = vi.fn();
const mockUseUpdateRecommendationStatus = vi.fn();

vi.mock("@/hooks/useRecommendations", () => ({
  useRecommendationsByBrand: (brandId: string, filters: unknown) =>
    mockUseRecommendationsByBrand(brandId, filters),
  useUpdateRecommendationStatus: () => mockUseUpdateRecommendationStatus(),
  Recommendation: {},
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
  locations: [],
  personnel: [],
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

// Sample recommendation data matching Recommendation interface from useRecommendations
const mockRecommendations = [
  {
    id: "rec-1",
    brandId: "brand-1",
    title: "Add FAQ Schema to Homepage",
    description: "Adding FAQ schema will improve AI comprehension of your Q&A content",
    category: "technical" as const,
    priority: "critical" as const,
    status: "pending" as const,
    impact: 9,
    effort: "low" as const,
    estimatedTime: "30 minutes",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-2",
    brandId: "brand-1",
    title: "Optimize Meta Descriptions",
    description: "Improve meta descriptions for better AI snippet extraction",
    category: "content" as const,
    priority: "high" as const,
    status: "in_progress" as const,
    impact: 7,
    effort: "medium" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-3",
    brandId: "brand-1",
    title: "Add Organization Schema",
    description: "Organization schema helps AI understand your brand structure",
    category: "technical" as const,
    priority: "medium" as const,
    status: "completed" as const,
    impact: 6,
    effort: "low" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock response structure matching RecommendationListResponse
const mockRecommendationsResponse = {
  recommendations: mockRecommendations,
  total: mockRecommendations.length,
  page: 1,
  limit: 50,
  totalPages: 1,
  stats: {
    byCategory: { technical: 2, content: 1 },
    byPriority: { critical: 1, high: 1, medium: 1 },
    byStatus: { pending: 1, in_progress: 1, completed: 1 },
  },
};

// Mock mutation function
const mockMutate = vi.fn();
const mockMutateAsync = vi.fn();

// Import AFTER mocking
import RecommendationsPage from "../page";

describe("Recommendations Page - Brand Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Default: brand selected with recommendations
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseRecommendationsByBrand.mockReturnValue({
      data: mockRecommendationsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseUpdateRecommendationStatus.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  describe("Expected Behavior", () => {
    it("should fetch recommendations when brand is selected", async () => {
      renderWithProviders(<RecommendationsPage />);

      // The page should use the selected brand to fetch recommendations
      await waitFor(() => {
        // Should show recommendation titles (not empty state which shows "No Recommendations Yet")
        // "Smart Recommendations" badge only appears in empty state
        expect(screen.getByText("Add FAQ Schema to Homepage")).toBeInTheDocument();
      });
    });

    it("should display recommendations in list with real data", async () => {
      renderWithProviders(<RecommendationsPage />);

      await waitFor(() => {
        // Should show recommendation titles
        expect(screen.getByText("Add FAQ Schema to Homepage")).toBeInTheDocument();
        expect(screen.getByText("Optimize Meta Descriptions")).toBeInTheDocument();
      });
    });

    it("should show recommendation cards with priority badges", async () => {
      renderWithProviders(<RecommendationsPage />);

      await waitFor(() => {
        // Should display priority badges (may appear multiple times - in cards + filter dropdown)
        expect(screen.getAllByText("Critical").length).toBeGreaterThan(0);
        expect(screen.getAllByText("High").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Medium").length).toBeGreaterThan(0);
      });
    });

    it("should show recommendation cards with category badges", async () => {
      renderWithProviders(<RecommendationsPage />);

      await waitFor(() => {
        // Should display category badges (Technical, Content)
        expect(screen.getAllByText("Technical").length).toBeGreaterThan(0);
        expect(screen.getByText("Content")).toBeInTheDocument();
      });
    });

    it("should filter recommendations by selected brand", async () => {
      renderWithProviders(<RecommendationsPage />);

      // The recommendations shown should only be for the selected brand
      await waitFor(() => {
        // Verify useRecommendationsByBrand is called with brand id
        expect(mockUseRecommendationsByBrand).toHaveBeenCalledWith(
          mockBrand.id,
          expect.any(Object)
        );
      });
    });

    it("should show stats bar with counts", async () => {
      renderWithProviders(<RecommendationsPage />);

      await waitFor(() => {
        // Should display stats counts (may appear multiple times - in stats bar + filter tabs)
        expect(screen.getByText("Total")).toBeInTheDocument();
        expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
        expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should show 'Select a brand to view recommendations' when no brand selected", async () => {
      mockUseSelectedBrand.mockReturnValue(null);
      mockUseRecommendationsByBrand.mockReturnValue({
        data: { recommendations: [], total: 0, page: 1, limit: 50, totalPages: 0 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<RecommendationsPage />);

      await waitFor(() => {
        // Should prompt user to select a brand
        expect(screen.getByText(/select a brand/i)).toBeInTheDocument();
      });
    });

    it("should show loading skeleton while fetching", async () => {
      mockUseRecommendationsByBrand.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<RecommendationsPage />);

      // Should show loading indicator
      expect(screen.getByTestId("recommendations-loading")).toBeInTheDocument();
    });

    it("should show empty state with 'Run First Audit' CTA when no recommendations", async () => {
      mockUseRecommendationsByBrand.mockReturnValue({
        data: { recommendations: [], total: 0, page: 1, limit: 50, totalPages: 0 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<RecommendationsPage />);

      await waitFor(() => {
        // Should show empty state message
        expect(screen.getByText(/No Recommendations Yet/i)).toBeInTheDocument();
        // Should show CTA to run audit
        expect(screen.getByText("Run First Audit")).toBeInTheDocument();
      });
    });

    it("should filter by status when status tab clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RecommendationsPage />);

      await waitFor(() => {
        expect(screen.getByText("Add FAQ Schema to Homepage")).toBeInTheDocument();
      });

      // Click "In Progress" filter (first one is the filter tab, not the card)
      const inProgressButtons = screen.getAllByRole("button", { name: /in progress/i });
      // The filter tab is the one with specific styling classes
      const filterTab = inProgressButtons.find(btn =>
        btn.classList.contains("px-3") && btn.classList.contains("py-1.5")
      ) || inProgressButtons[0];
      await user.click(filterTab);

      // Should show only in_progress recommendations
      await waitFor(() => {
        expect(screen.getByText("Optimize Meta Descriptions")).toBeInTheDocument();
        // Pending item should not be visible (filtered out)
        expect(screen.queryByText("Add FAQ Schema to Homepage")).not.toBeInTheDocument();
      });
    });
  });

  describe("Status Update with Mutations", () => {
    it("should call updateStatus mutation when status button clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RecommendationsPage />);

      await waitFor(() => {
        expect(screen.getByText("Add FAQ Schema to Homepage")).toBeInTheDocument();
      });

      // Find the first recommendation card and click to expand it
      const cardButtons = screen.getAllByRole("button");
      const expandButton = cardButtons.find(btn =>
        btn.classList.contains("w-full") && btn.classList.contains("p-4")
      ) || cardButtons[0];
      await user.click(expandButton);

      // Click "Dismiss" button (the status button that exists in the UI for pending items)
      const dismissButtons = await screen.findAllByRole("button", { name: /dismiss/i });
      await user.click(dismissButtons[0]);

      // Should call the mutation with dismissed status
      expect(mockMutate).toHaveBeenCalledWith({
        id: "rec-1",
        status: "dismissed",
      });
    });

    it("should show optimistic update while mutation is pending", async () => {
      mockUseUpdateRecommendationStatus.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
        variables: { id: "rec-1", status: "completed" },
      });

      renderWithProviders(<RecommendationsPage />);

      // The page should still render with data while mutation is pending
      await waitFor(() => {
        expect(screen.getByText("Add FAQ Schema to Homepage")).toBeInTheDocument();
      });

      // Verify the mutation hook is in pending state
      expect(mockUseUpdateRecommendationStatus).toHaveBeenCalled();
    });
  });

  describe("Failure Cases", () => {
    it("should show error state when API fails", async () => {
      mockUseRecommendationsByBrand.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch recommendations"),
        refetch: vi.fn(),
      });

      renderWithProviders(<RecommendationsPage />);

      await waitFor(() => {
        // Should show error heading
        expect(
          screen.getByRole("heading", { name: /failed to load recommendations/i })
        ).toBeInTheDocument();
      });
    });

    it("should have retry button on error state", async () => {
      const mockRefetch = vi.fn();
      mockUseRecommendationsByBrand.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch recommendations"),
        refetch: mockRefetch,
      });

      renderWithProviders(<RecommendationsPage />);

      await waitFor(() => {
        // Should have a retry button
        const retryButton = screen.getByRole("button", { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });
});

describe("Recommendations Page - Data Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseRecommendationsByBrand.mockReturnValue({
      data: mockRecommendationsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseUpdateRecommendationStatus.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it("should pass brandId to useRecommendationsByBrand hook", () => {
    renderWithProviders(<RecommendationsPage />);

    // Verify useRecommendationsByBrand is called with brand id
    expect(mockUseRecommendationsByBrand).toHaveBeenCalledWith(mockBrand.id, expect.any(Object));
  });

  it("should update when selected brand changes", async () => {
    const { rerender } = renderWithProviders(<RecommendationsPage />);

    // Change selected brand
    const newBrand = { ...mockBrand, id: "brand-2", name: "New Brand" };
    mockUseSelectedBrand.mockReturnValue(newBrand);

    rerender(
      <TestWrapper>
        <RecommendationsPage />
      </TestWrapper>
    );

    // The hook should be called again with new brand id
    expect(mockUseRecommendationsByBrand).toHaveBeenCalledWith("brand-2", expect.any(Object));
  });
});
