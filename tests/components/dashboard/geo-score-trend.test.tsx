/**
 * @vitest-environment jsdom
 *
 * GEO Score Trend Component Tests
 *
 * Tests for the GeoScoreTrend dashboard component that displays
 * historical AI visibility scores via a line chart.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock the stores module
const mockUseSelectedBrand = vi.fn();

vi.mock("@/stores", () => ({
  useSelectedBrand: () => mockUseSelectedBrand(),
}));

// Mock the useDashboard hooks
const mockUseUnifiedScore = vi.fn();

vi.mock("@/hooks/useDashboard", () => ({
  useUnifiedScore: (brandId: string, options?: { enabled?: boolean }) =>
    mockUseUnifiedScore(brandId, options),
}));

// Mock recharts - render children without actual chart
vi.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ReferenceLine: () => <div data-testid="reference-line" />,
  ReferenceArea: () => <div data-testid="reference-area" />,
  ReferenceDot: () => <div data-testid="reference-dot" />,
}));

// Sample brand data
const mockBrand = {
  id: "brand-1",
  name: "Test Brand",
};

// Sample unified score data
const mockUnifiedScoreData = {
  score: {
    overall: 72,
    grade: "B" as const,
    trend: "up" as const,
    change: 5,
    components: {
      seo: { score: 75, breakdown: {}, recommendations: [] },
      geo: { score: 70, breakdown: {}, recommendations: [] },
      aeo: { score: 71, breakdown: {}, recommendations: [] },
    },
    weights: { seo: 0.33, geo: 0.33, aeo: 0.34 },
    insights: [],
    priorityActions: [],
  },
  history: [
    { date: "2024-01-01", label: "Jan 1", unified: 65, seo: 60, geo: 68, aeo: 67 },
    { date: "2024-01-15", label: "Jan 15", unified: 68, seo: 65, geo: 70, aeo: 69 },
    { date: "2024-02-01", label: "Feb 1", unified: 72, seo: 70, geo: 73, aeo: 73 },
  ],
  lastUpdated: new Date().toISOString(),
};

// Import component AFTER mocking
import { GeoScoreTrend } from "@/components/dashboard/geo-score-trend";

describe("GeoScoreTrend Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: brand selected with data
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseUnifiedScore.mockReturnValue({
      data: mockUnifiedScoreData,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  describe("Rendering with Data", () => {
    it("should render the component with title", async () => {
      render(<GeoScoreTrend />);

      await waitFor(() => {
        expect(screen.getByText("GEO Score Trend")).toBeInTheDocument();
      });
    });

    it("should display 3-month score progression subtitle", async () => {
      render(<GeoScoreTrend />);

      await waitFor(() => {
        expect(screen.getByText("3-month score progression")).toBeInTheDocument();
      });
    });

    it("should render chart container when data is available", async () => {
      render(<GeoScoreTrend />);

      await waitFor(() => {
        expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      });
    });

    it("should call useUnifiedScore with brand ID", () => {
      render(<GeoScoreTrend />);

      expect(mockUseUnifiedScore).toHaveBeenCalledWith(
        mockBrand.id,
        expect.objectContaining({ enabled: true })
      );
    });

    it("should display improvement stats badge", async () => {
      render(<GeoScoreTrend />);

      await waitFor(() => {
        // Improvement is last score (72) - first score (65) = +7
        expect(screen.getByText(/\+7 pts/)).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner while fetching data", () => {
      mockUseUnifiedScore.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<GeoScoreTrend />);

      expect(screen.getByText("Loading trend data...")).toBeInTheDocument();
    });

    it("should display component title during loading", () => {
      mockUseUnifiedScore.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<GeoScoreTrend />);

      expect(screen.getByText("GEO Score Trend")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message when API fails", () => {
      mockUseUnifiedScore.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("API connection failed"),
      });

      render(<GeoScoreTrend />);

      expect(screen.getByText("Failed to load trend data")).toBeInTheDocument();
    });

    it("should show error details when available", () => {
      mockUseUnifiedScore.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Network timeout"),
      });

      render(<GeoScoreTrend />);

      expect(screen.getByText("Network timeout")).toBeInTheDocument();
    });

    it("should show fallback error message when error has no message", () => {
      mockUseUnifiedScore.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: null,
      });

      render(<GeoScoreTrend />);

      expect(screen.getByText("Please try again later")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display 'No data available yet' when no history exists", () => {
      mockUseUnifiedScore.mockReturnValue({
        data: { ...mockUnifiedScoreData, history: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<GeoScoreTrend />);

      expect(screen.getByText("No data available yet")).toBeInTheDocument();
    });

    it("should show helpful message for empty state", () => {
      mockUseUnifiedScore.mockReturnValue({
        data: { ...mockUnifiedScoreData, history: [] },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<GeoScoreTrend />);

      expect(
        screen.getByText("Score history will appear here as data is collected")
      ).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("should use provided data prop instead of fetching", async () => {
      const customData = [
        { month: "Mar", score: 80 },
        { month: "Apr", score: 85 },
      ];

      render(<GeoScoreTrend data={customData} />);

      await waitFor(() => {
        expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      });

      // Should not try to fetch when data is provided
      expect(mockUseUnifiedScore).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ enabled: false })
      );
    });

    it("should use brandId prop over store value", () => {
      render(<GeoScoreTrend brandId="custom-brand-id" />);

      expect(mockUseUnifiedScore).toHaveBeenCalledWith(
        "custom-brand-id",
        expect.anything()
      );
    });

    it("should display target score reference line when provided", async () => {
      render(<GeoScoreTrend targetScore={85} />);

      await waitFor(() => {
        expect(screen.getByText(/Target: 85/)).toBeInTheDocument();
      });
    });

    it("should render annotations legend when showAnnotations is true", async () => {
      render(<GeoScoreTrend showAnnotations={true} />);

      await waitFor(() => {
        expect(screen.getByText("Recommendation")).toBeInTheDocument();
        expect(screen.getByText("Improvement")).toBeInTheDocument();
        expect(screen.getByText("Milestone")).toBeInTheDocument();
      });
    });
  });

  describe("Data Transformation", () => {
    it("should calculate correct improvement from history", async () => {
      const historyData = {
        ...mockUnifiedScoreData,
        history: [
          { date: "2024-01-01", label: "Start", unified: 50, seo: 50, geo: 50, aeo: 50 },
          { date: "2024-02-01", label: "End", unified: 75, seo: 75, geo: 75, aeo: 75 },
        ],
      };

      mockUseUnifiedScore.mockReturnValue({
        data: historyData,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<GeoScoreTrend />);

      await waitFor(() => {
        // Improvement: 75 - 50 = 25
        expect(screen.getByText("+25 pts")).toBeInTheDocument();
      });
    });

    it("should handle negative improvement", async () => {
      const historyData = {
        ...mockUnifiedScoreData,
        history: [
          { date: "2024-01-01", label: "Start", unified: 80, seo: 80, geo: 80, aeo: 80 },
          { date: "2024-02-01", label: "End", unified: 70, seo: 70, geo: 70, aeo: 70 },
        ],
      };

      mockUseUnifiedScore.mockReturnValue({
        data: historyData,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<GeoScoreTrend />);

      await waitFor(() => {
        // Improvement: 70 - 80 = -10
        expect(screen.getByText("-10 pts")).toBeInTheDocument();
      });
    });
  });

  describe("No Brand Selected", () => {
    it("should not fetch when no brand is selected", () => {
      mockUseSelectedBrand.mockReturnValue(null);

      render(<GeoScoreTrend />);

      expect(mockUseUnifiedScore).toHaveBeenCalledWith(
        "",
        expect.objectContaining({ enabled: false })
      );
    });
  });
});
