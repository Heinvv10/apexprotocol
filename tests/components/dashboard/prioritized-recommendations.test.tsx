/**
 * @vitest-environment jsdom
 *
 * Prioritized Recommendations Component Tests
 *
 * Tests for the PrioritizedRecommendations dashboard component that displays
 * AI-generated actionable recommendations sorted by priority.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock the stores module
const mockUseSelectedBrand = vi.fn();

vi.mock("@/stores", () => ({
  useSelectedBrand: () => mockUseSelectedBrand(),
}));

// Mock the useRecommendations hook
const mockUseRecommendations = vi.fn();

vi.mock("@/hooks/useRecommendations", () => ({
  useRecommendations: (filters: Record<string, unknown>, options?: { enabled?: boolean }) =>
    mockUseRecommendations(filters, options),
}));

// Sample brand data
const mockBrand = {
  id: "brand-1",
  name: "Test Brand",
};

// Sample recommendations data
const mockRecommendationsData = {
  recommendations: [
    {
      id: "rec-1",
      brandId: "brand-1",
      title: "Add FAQ Schema Markup",
      description: "Implement structured FAQ schema to improve AI understanding",
      category: "technical" as const,
      priority: "critical" as const,
      status: "pending" as const,
      impact: 9,
      effort: "low" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "rec-2",
      brandId: "brand-1",
      title: "Update Meta Descriptions",
      description: "Optimize meta descriptions for AI crawlers",
      category: "content" as const,
      priority: "high" as const,
      status: "pending" as const,
      impact: 7,
      effort: "medium" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "rec-3",
      brandId: "brand-1",
      title: "Improve Page Speed",
      description: "Reduce page load time to under 2 seconds",
      category: "technical" as const,
      priority: "medium" as const,
      status: "pending" as const,
      impact: 6,
      effort: "high" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "rec-4",
      brandId: "brand-1",
      title: "Add Alt Text to Images",
      description: "Ensure all images have descriptive alt text",
      category: "content" as const,
      priority: "low" as const,
      status: "pending" as const,
      impact: 4,
      effort: "low" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  total: 4,
  page: 1,
  limit: 10,
  totalPages: 1,
};

// Import component AFTER mocking
import { PrioritizedRecommendations } from "@/components/dashboard/prioritized-recommendations";

describe("PrioritizedRecommendations Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: brand selected with recommendations
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseRecommendations.mockReturnValue({
      data: mockRecommendationsData,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  describe("Rendering with Data", () => {
    it("should render the component with title", async () => {
      render(<PrioritizedRecommendations />);

      await waitFor(() => {
        expect(screen.getByText("Prioritized Recommendations")).toBeInTheDocument();
      });
    });

    it("should display all recommendation titles", async () => {
      render(<PrioritizedRecommendations />);

      await waitFor(() => {
        expect(screen.getByText("Add FAQ Schema Markup")).toBeInTheDocument();
        expect(screen.getByText("Update Meta Descriptions")).toBeInTheDocument();
        expect(screen.getByText("Improve Page Speed")).toBeInTheDocument();
        expect(screen.getByText("Add Alt Text to Images")).toBeInTheDocument();
      });
    });

    it("should display recommendation descriptions", async () => {
      render(<PrioritizedRecommendations />);

      await waitFor(() => {
        expect(
          screen.getByText("Implement structured FAQ schema to improve AI understanding")
        ).toBeInTheDocument();
      });
    });

    it("should display priority badges", async () => {
      render(<PrioritizedRecommendations />);

      await waitFor(() => {
        expect(screen.getByText("Critical")).toBeInTheDocument();
        expect(screen.getByText("High")).toBeInTheDocument();
        expect(screen.getByText("Medium")).toBeInTheDocument();
        expect(screen.getByText("Low")).toBeInTheDocument();
      });
    });

    it("should display impact percentages", async () => {
      render(<PrioritizedRecommendations />);

      await waitFor(() => {
        // Impact is multiplied by 10 for display
        expect(screen.getByText("90%")).toBeInTheDocument(); // 9 * 10
        expect(screen.getByText("70%")).toBeInTheDocument(); // 7 * 10
      });
    });

    it("should display effort labels", async () => {
      render(<PrioritizedRecommendations />);

      await waitFor(() => {
        // Use getAllByText since there may be multiple items with same effort level
        const quickWins = screen.getAllByText("Quick Win");
        expect(quickWins.length).toBeGreaterThan(0);
        expect(screen.getByText("Medium Effort")).toBeInTheDocument();
        expect(screen.getByText("Long Term")).toBeInTheDocument();
      });
    });

    it("should display category badges", async () => {
      render(<PrioritizedRecommendations />);

      await waitFor(() => {
        const technicalBadges = screen.getAllByText("technical");
        const contentBadges = screen.getAllByText("content");
        expect(technicalBadges.length).toBeGreaterThan(0);
        expect(contentBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner while fetching data", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      expect(screen.getByText("Loading recommendations...")).toBeInTheDocument();
    });

    it("should display component title during loading", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      expect(screen.getByText("Prioritized Recommendations")).toBeInTheDocument();
    });

    it("should render LoadingState component with proper accessibility attributes", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      const loadingState = screen.getByRole("status");
      expect(loadingState).toHaveAttribute("aria-live", "polite");
      expect(loadingState).toHaveAttribute("aria-label", "Loading: Loading recommendations...");
    });

    it("should display loading icon in LoadingState", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      const loadingState = screen.getByRole("status");
      const svg = loadingState.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should use compact variant and small size in LoadingState", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { container } = render(<PrioritizedRecommendations />);

      const loadingState = screen.getByRole("status");
      // Check for min-h-0 class from compact variant
      expect(loadingState).toHaveClass("min-h-0");
    });
  });

  describe("Error State", () => {
    it("should display error message when API fails", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to fetch recommendations"),
      });

      render(<PrioritizedRecommendations />);

      expect(screen.getByText("Failed to load recommendations")).toBeInTheDocument();
    });

    it("should show error details when available", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Database connection failed"),
      });

      render(<PrioritizedRecommendations />);

      expect(screen.getByText("Database connection failed")).toBeInTheDocument();
    });

    it("should render ErrorState component with proper accessibility attributes", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Network error"),
      });

      render(<PrioritizedRecommendations />);

      const errorState = screen.getByRole("alert");
      expect(errorState).toHaveAttribute("aria-live", "assertive");
      expect(errorState).toHaveAttribute("aria-label", "Error: Failed to load recommendations");
    });

    it("should display error icon in ErrorState", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Test error"),
      });

      render(<PrioritizedRecommendations />);

      const errorState = screen.getByRole("alert");
      const svg = errorState.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should use compact variant and small size in ErrorState", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Test error"),
      });

      const { container } = render(<PrioritizedRecommendations />);

      const errorState = screen.getByRole("alert");
      // Check for min-h-0 class from compact variant
      expect(errorState).toHaveClass("min-h-0");
    });

    it("should handle Error object in ErrorState", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Connection timeout"),
      });

      render(<PrioritizedRecommendations />);

      expect(screen.getByText("Connection timeout")).toBeInTheDocument();
    });

    it("should handle string error in ErrorState", () => {
      mockUseRecommendations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: "Custom error message",
      });

      render(<PrioritizedRecommendations />);

      expect(screen.getByText("Custom error message")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display positive message when no recommendations exist", () => {
      mockUseRecommendations.mockReturnValue({
        data: { ...mockRecommendationsData, recommendations: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      expect(screen.getByText("All caught up!")).toBeInTheDocument();
    });

    it("should show encouraging subtext in empty state", () => {
      mockUseRecommendations.mockReturnValue({
        data: { ...mockRecommendationsData, recommendations: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      expect(
        screen.getByText("No pending recommendations. Great job!")
      ).toBeInTheDocument();
    });

    it("should render EmptyState component with proper accessibility attributes", () => {
      mockUseRecommendations.mockReturnValue({
        data: { ...mockRecommendationsData, recommendations: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      const emptyState = screen.getByRole("region");
      expect(emptyState).toHaveAttribute("aria-live", "polite");
      expect(emptyState).toHaveAttribute("aria-label", "All caught up!");
    });

    it("should display success icon in empty state", () => {
      mockUseRecommendations.mockReturnValue({
        data: { ...mockRecommendationsData, recommendations: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      const emptyState = screen.getByRole("region");
      const svg = emptyState.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should use success theme in empty state", () => {
      mockUseRecommendations.mockReturnValue({
        data: { ...mockRecommendationsData, recommendations: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<PrioritizedRecommendations />);

      const emptyState = screen.getByRole("region");
      // Icon container should have success theme classes
      const iconContainer = emptyState.querySelector('[class*="bg-success"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it("should use compact variant and small size in empty state", () => {
      mockUseRecommendations.mockReturnValue({
        data: { ...mockRecommendationsData, recommendations: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<PrioritizedRecommendations />);

      const emptyState = screen.getByRole("region");
      // Check for min-h-0 class from compact variant
      expect(emptyState).toHaveClass("min-h-0");
    });

    it("should not display action buttons in empty state", () => {
      mockUseRecommendations.mockReturnValue({
        data: { ...mockRecommendationsData, recommendations: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      // Empty state should not have any buttons (all caught up state is informational only)
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBe(0);
    });
  });

  describe("Props Handling", () => {
    it("should use provided recommendations prop instead of fetching", async () => {
      const customRecommendations = [
        {
          id: "custom-1",
          title: "Custom Recommendation",
          description: "This is a custom recommendation",
          priority: "high" as const,
          impact: 8,
          effort: "medium" as const,
          category: "content",
        },
      ];

      render(<PrioritizedRecommendations recommendations={customRecommendations} />);

      await waitFor(() => {
        expect(screen.getByText("Custom Recommendation")).toBeInTheDocument();
      });

      // Should not fetch when data is provided
      expect(mockUseRecommendations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ enabled: false })
      );
    });

    it("should use brandId prop over store value", () => {
      render(<PrioritizedRecommendations brandId="custom-brand-id" />);

      expect(mockUseRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({ brandId: "custom-brand-id" }),
        expect.anything()
      );
    });

    it("should respect limit prop", () => {
      render(<PrioritizedRecommendations limit={2} />);

      expect(mockUseRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 4 }), // limit + 2 for buffer
        expect.anything()
      );
    });

    it("should render View All button when onViewAll is provided", async () => {
      const onViewAllMock = vi.fn();
      render(<PrioritizedRecommendations onViewAll={onViewAllMock} />);

      await waitFor(() => {
        const viewAllButton = screen.getByText("View All");
        expect(viewAllButton).toBeInTheDocument();
      });
    });

    it("should call onViewAll when View All is clicked", async () => {
      const onViewAllMock = vi.fn();
      render(<PrioritizedRecommendations onViewAll={onViewAllMock} />);

      await waitFor(() => {
        const viewAllButton = screen.getByText("View All");
        fireEvent.click(viewAllButton);
      });

      expect(onViewAllMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Priority Sorting", () => {
    it("should display recommendations in priority order", async () => {
      render(<PrioritizedRecommendations />);

      await waitFor(() => {
        // First recommendation should be the critical one
        expect(screen.getByText("Add FAQ Schema Markup")).toBeInTheDocument();
        // All recommendations should be displayed in order from API (already sorted by priority)
        expect(screen.getByText("Critical")).toBeInTheDocument();
      });
    });
  });

  describe("Data Transformation", () => {
    it("should correctly map effort values", async () => {
      const dataWithEffort = {
        ...mockRecommendationsData,
        recommendations: [
          {
            ...mockRecommendationsData.recommendations[0],
            effort: "low" as const,
          },
        ],
      };

      mockUseRecommendations.mockReturnValue({
        data: dataWithEffort,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      await waitFor(() => {
        // low effort should display as "Quick Win"
        expect(screen.getByText("Quick Win")).toBeInTheDocument();
      });
    });
  });

  describe("Limit Display", () => {
    it("should limit displayed recommendations to 4 by default", async () => {
      const manyRecommendations = {
        ...mockRecommendationsData,
        recommendations: [
          ...mockRecommendationsData.recommendations,
          {
            id: "rec-5",
            brandId: "brand-1",
            title: "Fifth Recommendation",
            description: "This should not be displayed",
            category: "technical" as const,
            priority: "low" as const,
            status: "pending" as const,
            impact: 3,
            effort: "low" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "rec-6",
            brandId: "brand-1",
            title: "Sixth Recommendation",
            description: "This should not be displayed either",
            category: "content" as const,
            priority: "low" as const,
            status: "pending" as const,
            impact: 2,
            effort: "low" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 6,
      };

      mockUseRecommendations.mockReturnValue({
        data: manyRecommendations,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PrioritizedRecommendations />);

      await waitFor(() => {
        // Should show first 4
        expect(screen.getByText("Add FAQ Schema Markup")).toBeInTheDocument();
        expect(screen.getByText("Add Alt Text to Images")).toBeInTheDocument();
        // Should not show 5th and 6th
        expect(screen.queryByText("Fifth Recommendation")).not.toBeInTheDocument();
        expect(screen.queryByText("Sixth Recommendation")).not.toBeInTheDocument();
      });
    });
  });

  describe("No Brand Selected", () => {
    it("should not fetch when no brand is selected", () => {
      mockUseSelectedBrand.mockReturnValue(null);

      render(<PrioritizedRecommendations />);

      expect(mockUseRecommendations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ enabled: false })
      );
    });
  });
});
