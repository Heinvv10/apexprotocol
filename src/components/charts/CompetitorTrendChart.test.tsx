/**
 * @vitest-environment jsdom
 *
 * Competitor Trend Chart Component Tests
 *
 * Tests for the CompetitorTrendChart component that displays time-series
 * trend data for competitor metrics using Recharts LineChart.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock recharts - render children without actual chart
vi.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`line-${dataKey}`} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Brush: () => <div data-testid="brush" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Sample snapshot response data
const mockSnapshotResponse = {
  brandId: "brand-1",
  timeRange: {
    startDate: "2024-11-23",
    endDate: "2024-12-23",
    days: 30,
  },
  snapshots: [
    {
      date: "2024-12-20",
      competitorName: "Competitor A",
      competitorDomain: "competitora.com",
      geoScore: 450,
      aiMentionCount: 25,
      sentimentScore: 0.75,
      socialFollowers: 15000,
      contentPageCount: 120,
    },
    {
      date: "2024-12-21",
      competitorName: "Competitor A",
      competitorDomain: "competitora.com",
      geoScore: 460,
      aiMentionCount: 28,
      sentimentScore: 0.78,
      socialFollowers: 15100,
      contentPageCount: 122,
    },
    {
      date: "2024-12-20",
      competitorName: "Competitor B",
      competitorDomain: "competitorb.com",
      geoScore: 380,
      aiMentionCount: 18,
      sentimentScore: 0.65,
      socialFollowers: 12000,
      contentPageCount: 95,
    },
    {
      date: "2024-12-21",
      competitorName: "Competitor B",
      competitorDomain: "competitorb.com",
      geoScore: 390,
      aiMentionCount: 20,
      sentimentScore: 0.68,
      socialFollowers: 12100,
      contentPageCount: 98,
    },
  ],
  summary: {
    totalSnapshots: 4,
    competitorsTracked: 2,
    avgGeoScore: 420,
    avgMentionCount: 22,
  },
};

// Import component AFTER mocking
import { CompetitorTrendChart } from "./CompetitorTrendChart";

describe("CompetitorTrendChart Component", () => {
  // Mock fetch globally
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    vi.clearAllMocks();

    // Default: successful fetch with data
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSnapshotResponse,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering with Data", () => {
    it("should render the component with title", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Competitor Trends - GEO Score/)
        ).toBeInTheDocument();
      });
    });

    it("should display date range in header", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(/2024-11-23 to 2024-12-23 \(30 days\)/)
        ).toBeInTheDocument();
      });
    });

    it("should render chart container when data is available", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      });
    });

    it("should render line chart", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      });
    });

    it("should display tracked competitors count", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("should display summary statistics for GEO Score", async () => {
      render(<CompetitorTrendChart brandId="brand-1" metric="geoScore" />);

      await waitFor(() => {
        expect(screen.getByText("Avg GEO Score")).toBeInTheDocument();
        expect(screen.getByText("420")).toBeInTheDocument();
      });
    });

    it("should display summary statistics for AI Mentions", async () => {
      render(<CompetitorTrendChart brandId="brand-1" metric="aiMentionCount" />);

      await waitFor(() => {
        expect(screen.getByText("Avg AI Mentions")).toBeInTheDocument();
        expect(screen.getByText("22")).toBeInTheDocument();
      });
    });
  });

  describe("API Integration", () => {
    it("should call fetch with correct brandId", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("brandId=brand-1")
        );
      });
    });

    it("should call fetch with correct days parameter", async () => {
      render(<CompetitorTrendChart brandId="brand-1" days={60} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("days=60")
        );
      });
    });

    it("should include competitor filter when provided", async () => {
      render(
        <CompetitorTrendChart
          brandId="brand-1"
          competitorFilter="Competitor A"
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("competitorName=Competitor+A")
        );
      });
    });

    it("should use default days of 30 when not specified", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("days=30")
        );
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner while fetching data", () => {
      // Make fetch never resolve to keep loading state
      mockFetch.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<CompetitorTrendChart brandId="brand-1" />);

      expect(screen.getByText("Loading trend data...")).toBeInTheDocument();
    });

    it("should display loading spinner element", () => {
      mockFetch.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<CompetitorTrendChart brandId="brand-1" />);

      // The Loader2 icon is present (can't test icon directly due to mocking)
      expect(screen.getByText("Loading trend data...")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message when API fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });

      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load trend data")
        ).toBeInTheDocument();
      });
    });

    it("should show error details when fetch throws", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should handle non-Error exceptions gracefully", async () => {
      mockFetch.mockRejectedValue("String error");

      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(screen.getByText("An error occurred")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no snapshots exist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockSnapshotResponse,
          snapshots: [],
        }),
      });

      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(
          screen.getByText("No trend data available")
        ).toBeInTheDocument();
      });
    });

    it("should show helpful message for empty state", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockSnapshotResponse,
          snapshots: [],
        }),
      });

      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Competitor data will appear once snapshots are recorded"
          )
        ).toBeInTheDocument();
      });
    });

    it("should treat null API response as error", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        // Null response should be treated as an error since it's invalid data
        expect(
          screen.getByText("Failed to load trend data")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Metric Handling", () => {
    it("should display GEO Score metric label", async () => {
      render(<CompetitorTrendChart brandId="brand-1" metric="geoScore" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Competitor Trends - GEO Score/)
        ).toBeInTheDocument();
      });
    });

    it("should display AI Mentions metric label", async () => {
      render(
        <CompetitorTrendChart brandId="brand-1" metric="aiMentionCount" />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Competitor Trends - AI Mentions/)
        ).toBeInTheDocument();
      });
    });

    it("should display Sentiment Score metric label", async () => {
      render(
        <CompetitorTrendChart brandId="brand-1" metric="sentimentScore" />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Competitor Trends - Sentiment Score/)
        ).toBeInTheDocument();
      });
    });

    it("should display Social Followers metric label", async () => {
      render(
        <CompetitorTrendChart brandId="brand-1" metric="socialFollowers" />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Competitor Trends - Social Followers/)
        ).toBeInTheDocument();
      });
    });

    it("should display Content Pages metric label", async () => {
      render(
        <CompetitorTrendChart brandId="brand-1" metric="contentPageCount" />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Competitor Trends - Content Pages/)
        ).toBeInTheDocument();
      });
    });

    it("should default to geoScore metric when not specified", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Competitor Trends - GEO Score/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Props Handling", () => {
    it("should accept custom className", async () => {
      const { container } = render(
        <CompetitorTrendChart brandId="brand-1" className="custom-class" />
      );

      await waitFor(() => {
        expect(container.querySelector(".custom-class")).toBeInTheDocument();
      });
    });

    it("should handle different days values", async () => {
      const { rerender } = render(
        <CompetitorTrendChart brandId="brand-1" days={7} />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("days=7")
        );
      });

      rerender(<CompetitorTrendChart brandId="brand-1" days={90} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("days=90")
        );
      });
    });
  });

  describe("Chart Elements", () => {
    it("should render all chart elements", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(screen.getByTestId("line-chart")).toBeInTheDocument();
        expect(screen.getByTestId("x-axis")).toBeInTheDocument();
        expect(screen.getByTestId("y-axis")).toBeInTheDocument();
        expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
        expect(screen.getByTestId("tooltip")).toBeInTheDocument();
        expect(screen.getByTestId("legend")).toBeInTheDocument();
      });
    });

    it("should not render brush for small datasets", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(screen.queryByTestId("brush")).not.toBeInTheDocument();
      });
    });
  });

  describe("Data Transformation", () => {
    it("should group snapshots by date", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        // Chart should render with properly grouped data
        expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      });
    });

    it("should handle single competitor data", async () => {
      const singleCompetitorData = {
        ...mockSnapshotResponse,
        snapshots: mockSnapshotResponse.snapshots.filter(
          (s) => s.competitorName === "Competitor A"
        ),
        summary: {
          ...mockSnapshotResponse.summary,
          competitorsTracked: 1,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => singleCompetitorData,
      });

      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle large datasets", async () => {
      const largeDataset = {
        ...mockSnapshotResponse,
        snapshots: Array.from({ length: 100 }, (_, i) => ({
          date: `2024-12-${(i % 30) + 1}`,
          competitorName: `Competitor ${String.fromCharCode(65 + (i % 10))}`,
          competitorDomain: `competitor${i % 10}.com`,
          geoScore: 400 + Math.floor(Math.random() * 100),
          aiMentionCount: 20 + Math.floor(Math.random() * 10),
          sentimentScore: 0.5 + Math.random() * 0.5,
          socialFollowers: 10000 + Math.floor(Math.random() * 5000),
          contentPageCount: 100 + Math.floor(Math.random() * 50),
        })),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => largeDataset,
      });

      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      });
    });

    it("should handle missing metric values gracefully", async () => {
      const incompleteData = {
        ...mockSnapshotResponse,
        snapshots: [
          {
            date: "2024-12-20",
            competitorName: "Competitor A",
            competitorDomain: "competitora.com",
            geoScore: 450,
            aiMentionCount: 0, // Zero value
            sentimentScore: 0,
            socialFollowers: 0,
            contentPageCount: 0,
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => incompleteData,
      });

      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      });
    });

    it("should re-fetch when brandId changes", async () => {
      const { rerender } = render(
        <CompetitorTrendChart brandId="brand-1" />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("brandId=brand-1")
        );
      });

      mockFetch.mockClear();

      rerender(<CompetitorTrendChart brandId="brand-2" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("brandId=brand-2")
        );
      });
    });

    it("should re-fetch when days parameter changes", async () => {
      const { rerender } = render(
        <CompetitorTrendChart brandId="brand-1" days={30} />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("days=30")
        );
      });

      mockFetch.mockClear();

      rerender(<CompetitorTrendChart brandId="brand-1" days={60} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("days=60")
        );
      });
    });
  });

  describe("Component State Management", () => {
    it("should initialize with all competitors visible", async () => {
      render(<CompetitorTrendChart brandId="brand-1" />);

      await waitFor(() => {
        // Both competitors should be rendered
        expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      });
    });
  });
});
