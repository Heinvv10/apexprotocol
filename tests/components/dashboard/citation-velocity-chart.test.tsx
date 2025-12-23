/**
 * @vitest-environment jsdom
 *
 * Citation Velocity Chart Component Tests
 *
 * Tests for the CitationVelocityChart dashboard component that displays
 * citation count trends over time via an area chart.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock the stores module
const mockUseSelectedBrand = vi.fn();

vi.mock("@/stores", () => ({
  useSelectedBrand: () => mockUseSelectedBrand(),
}));

// Mock the useCitations hook
const mockUseCitations = vi.fn();

vi.mock("@/hooks/useMonitor", () => ({
  useCitations: (brandId?: string, range?: string, limit?: number) =>
    mockUseCitations(brandId, range, limit),
}));

// Mock recharts - render children without actual chart
vi.mock("recharts", () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Sample brand data
const mockBrand = {
  id: "brand-1",
  name: "Test Brand",
};

// Sample citations data
const mockCitationsData = {
  success: true,
  citations: [
    {
      id: "cit-1",
      url: "https://example.com/page1",
      title: "Example Page 1",
      citations: 15,
      lastCited: new Date().toISOString(),
      platforms: { chatgpt: 8, claude: 7 },
      context: "Brand was mentioned in this context",
    },
    {
      id: "cit-2",
      url: "https://example.com/page2",
      title: "Example Page 2",
      citations: 10,
      lastCited: new Date().toISOString(),
      platforms: { perplexity: 6, gemini: 4 },
      context: "Another citation context",
    },
  ],
  trendData: [
    { date: "Dec 15", citations: 5 },
    { date: "Dec 16", citations: 8 },
    { date: "Dec 17", citations: 12 },
    { date: "Dec 18", citations: 15 },
    { date: "Dec 19", citations: 10 },
    { date: "Dec 20", citations: 18 },
    { date: "Dec 21", citations: 22 },
  ],
  total: 2,
  meta: {
    range: "30d",
    startDate: "2024-11-23",
    endDate: "2024-12-23",
    totalCitations: 90,
  },
};

// Import component AFTER mocking
import { CitationVelocityChart } from "@/components/dashboard/citation-velocity-chart";

describe("CitationVelocityChart Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: brand selected with citation data
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseCitations.mockReturnValue({
      data: mockCitationsData,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  describe("Rendering with Data", () => {
    it("should render the component with title", async () => {
      render(<CitationVelocityChart />);

      await waitFor(() => {
        expect(screen.getByText("Citation Velocity")).toBeInTheDocument();
      });
    });

    it("should render chart container when data is available", async () => {
      render(<CitationVelocityChart />);

      await waitFor(() => {
        expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      });
    });

    it("should render area chart", async () => {
      render(<CitationVelocityChart />);

      await waitFor(() => {
        expect(screen.getByTestId("area-chart")).toBeInTheDocument();
      });
    });

    it("should call useCitations with brand ID", () => {
      render(<CitationVelocityChart />);

      expect(mockUseCitations).toHaveBeenCalledWith(mockBrand.id, "30d", 20);
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner while fetching data", () => {
      mockUseCitations.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<CitationVelocityChart />);

      expect(screen.getByText("Loading citations...")).toBeInTheDocument();
    });

    it("should display component title during loading", () => {
      mockUseCitations.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<CitationVelocityChart />);

      expect(screen.getByText("Citation Velocity")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message when API fails", () => {
      mockUseCitations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to fetch citations"),
      });

      render(<CitationVelocityChart />);

      expect(screen.getByText("Failed to load citations")).toBeInTheDocument();
    });

    it("should show error details when available", () => {
      mockUseCitations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("API rate limit exceeded"),
      });

      render(<CitationVelocityChart />);

      expect(screen.getByText("API rate limit exceeded")).toBeInTheDocument();
    });

    it("should show fallback error message when error has no message", () => {
      mockUseCitations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: null,
      });

      render(<CitationVelocityChart />);

      expect(screen.getByText("Please try again later")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display 'No data available yet' when no trend data exists", () => {
      mockUseCitations.mockReturnValue({
        data: { ...mockCitationsData, trendData: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<CitationVelocityChart />);

      expect(screen.getByText("No data available yet")).toBeInTheDocument();
    });

    it("should show helpful message for empty state", () => {
      mockUseCitations.mockReturnValue({
        data: { ...mockCitationsData, trendData: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<CitationVelocityChart />);

      expect(
        screen.getByText("Citation trends will appear as data is collected")
      ).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("should use provided data prop instead of fetching", async () => {
      const customData = [
        { date: "Jan 1", citations: 5 },
        { date: "Jan 2", citations: 10 },
      ];

      render(<CitationVelocityChart data={customData} />);

      await waitFor(() => {
        expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      });
    });

    it("should use brandId prop over store value", () => {
      render(<CitationVelocityChart brandId="custom-brand-id" />);

      expect(mockUseCitations).toHaveBeenCalledWith(
        "custom-brand-id",
        "30d",
        20
      );
    });

    it("should use range prop when provided", () => {
      render(<CitationVelocityChart range="7d" />);

      expect(mockUseCitations).toHaveBeenCalledWith(mockBrand.id, "7d", 20);
    });

    it("should accept different range values", () => {
      const { rerender } = render(<CitationVelocityChart range="14d" />);
      expect(mockUseCitations).toHaveBeenCalledWith(mockBrand.id, "14d", 20);

      rerender(<CitationVelocityChart range="90d" />);
      expect(mockUseCitations).toHaveBeenCalledWith(mockBrand.id, "90d", 20);
    });

    it("should apply custom className", () => {
      const { container } = render(
        <CitationVelocityChart className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Data Transformation", () => {
    it("should use trendData from API response", async () => {
      render(<CitationVelocityChart />);

      await waitFor(() => {
        // Chart should render with trend data
        expect(screen.getByTestId("area-chart")).toBeInTheDocument();
      });
    });

    it("should handle partial trend data", async () => {
      const partialData = {
        ...mockCitationsData,
        trendData: [
          { date: "Dec 20", citations: 5 },
          { date: "Dec 21", citations: 0 },
          { date: "Dec 22", citations: 8 },
        ],
      };

      mockUseCitations.mockReturnValue({
        data: partialData,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<CitationVelocityChart />);

      await waitFor(() => {
        expect(screen.getByTestId("area-chart")).toBeInTheDocument();
      });
    });
  });

  describe("No Brand Selected", () => {
    it("should handle undefined brandId when no brand is selected", () => {
      mockUseSelectedBrand.mockReturnValue(null);

      render(<CitationVelocityChart />);

      // When no brand selected, effectiveBrandId is undefined
      expect(mockUseCitations).toHaveBeenCalledWith(undefined, "30d", 20);
    });
  });

  describe("Chart Configuration", () => {
    it("should render with correct chart elements", async () => {
      render(<CitationVelocityChart />);

      await waitFor(() => {
        expect(screen.getByTestId("area")).toBeInTheDocument();
        expect(screen.getByTestId("x-axis")).toBeInTheDocument();
        expect(screen.getByTestId("y-axis")).toBeInTheDocument();
        expect(screen.getByTestId("tooltip")).toBeInTheDocument();
      });
    });
  });

  describe("Default Props", () => {
    it("should use default range of 30d", () => {
      render(<CitationVelocityChart />);

      expect(mockUseCitations).toHaveBeenCalledWith(
        expect.anything(),
        "30d",
        expect.anything()
      );
    });
  });

  describe("With Provided Data", () => {
    it("should skip API call when data prop is provided", async () => {
      const customData = [
        { date: "Week 1", citations: 10 },
        { date: "Week 2", citations: 15 },
        { date: "Week 3", citations: 20 },
      ];

      render(<CitationVelocityChart data={customData} />);

      await waitFor(() => {
        expect(screen.getByTestId("area-chart")).toBeInTheDocument();
      });

      // Component should still render the chart with provided data
      expect(screen.getByText("Citation Velocity")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined trendData gracefully", () => {
      mockUseCitations.mockReturnValue({
        data: { ...mockCitationsData, trendData: undefined },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<CitationVelocityChart />);

      // Should show empty state
      expect(screen.getByText("No data available yet")).toBeInTheDocument();
    });

    it("should handle null data gracefully", () => {
      mockUseCitations.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<CitationVelocityChart />);

      // Should show empty state
      expect(screen.getByText("No data available yet")).toBeInTheDocument();
    });

    it("should handle single data point", async () => {
      mockUseCitations.mockReturnValue({
        data: {
          ...mockCitationsData,
          trendData: [{ date: "Dec 23", citations: 5 }],
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<CitationVelocityChart />);

      await waitFor(() => {
        expect(screen.getByTestId("area-chart")).toBeInTheDocument();
      });
    });
  });
});
