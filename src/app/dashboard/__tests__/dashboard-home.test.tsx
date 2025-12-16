/**
 * @vitest-environment jsdom
 *
 * Dashboard Home - Brand Integration Tests
 *
 * PAI Doc-Driven TDD: Tests written BEFORE implementation
 * These tests will FAIL initially until Dashboard Home shows brand-specific metrics
 *
 * Requirements from plan:
 * - Show brand-specific metrics when brand selected
 * - Display recent mentions count
 * - Show pending recommendations count
 * - Link to Monitor, Create, Audit, Recommendations pages
 * - Show onboarding flow when no brand
 * - Display GEO score gauge
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { Brand } from "@/stores/brand-store";

// Mock the stores module
const mockUseSelectedBrand = vi.fn();
const mockUseBrands = vi.fn();
const mockRefreshBrands = vi.fn();

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
      refreshBrands: mockRefreshBrands,
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

// Mock the useDashboard hooks
const mockUseDashboardMetrics = vi.fn();
const mockUseGEOScore = vi.fn();
const mockUseRecentActivity = vi.fn();
const mockUseUnifiedScore = vi.fn();

vi.mock("@/hooks/useDashboard", () => ({
  useDashboardMetrics: (brandId: string) => mockUseDashboardMetrics(brandId),
  useGEOScore: (brandId: string) => mockUseGEOScore(brandId),
  useRecentActivity: (brandId: string, limit: number) => mockUseRecentActivity(brandId, limit),
  useUnifiedScore: (brandId: string) => mockUseUnifiedScore(brandId),
  usePlatformAnalytics: vi.fn(),
  useTrends: vi.fn(),
  useHealthStatus: vi.fn(),
}));

// Mock useOnboarding hook
vi.mock("@/hooks/useOnboarding", () => ({
  useOnboardingProgress: () => ({
    progress: 25,
    completedSteps: 1,
    totalSteps: 4,
    status: {
      brandAdded: true,
      monitoringConfigured: false,
      auditRun: false,
      recommendationsReviewed: false,
    },
  }),
}));

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

// Sample dashboard metrics
const mockDashboardMetrics = {
  geoScore: {
    current: 72,
    change: 5,
    trend: "up" as const,
    history: [
      { date: "2024-01-01", score: 65 },
      { date: "2024-01-15", score: 72 },
    ],
  },
  mentions: {
    total: 156,
    positive: 98,
    neutral: 42,
    negative: 16,
    change: 12,
    trend: "up" as const,
  },
  audits: {
    total: 5,
    completed: 4,
    inProgress: 1,
    lastScore: 78,
    averageScore: 75,
  },
  recommendations: {
    total: 24,
    completed: 8,
    pending: 16,
    highPriority: 4,
    completionRate: 33,
  },
  content: {
    total: 12,
    published: 8,
    draft: 4,
    thisWeek: 3,
  },
  platforms: [
    { name: "ChatGPT", mentions: 45, sentiment: 78, change: 5 },
    { name: "Claude", mentions: 32, sentiment: 85, change: 8 },
  ],
  recentActivity: [
    {
      id: "act-1",
      type: "mention",
      title: "New mention detected",
      description: "Your brand was mentioned in ChatGPT",
      timestamp: new Date().toISOString(),
      icon: "message",
    },
  ],
  topRecommendations: [
    {
      id: "rec-1",
      title: "Add FAQ Schema",
      priority: "critical" as const,
      impact: 9,
      category: "technical",
    },
  ],
};

// Sample GEO score details
const mockGEOScore = {
  overall: 72,
  technical: 78,
  content: 68,
  authority: 65,
  aiReadiness: 80,
  breakdown: [],
  competitors: [],
  history: [],
};

// Import AFTER mocking
import DashboardPage from "../page";

describe("Dashboard Home - Brand Stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: brand selected with metrics
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseDashboardMetrics.mockReturnValue({
      data: mockDashboardMetrics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseGEOScore.mockReturnValue({
      data: mockGEOScore,
      isLoading: false,
      error: null,
    });
    mockUseRecentActivity.mockReturnValue({
      data: { activities: mockDashboardMetrics.recentActivity },
      isLoading: false,
      error: null,
    });
    mockUseUnifiedScore.mockReturnValue({
      data: { overall: 72, grade: "B", trend: "up", change: 3 },
      isLoading: false,
      error: null,
    });
  });

  describe("Expected Behavior", () => {
    it("should show brand-specific metrics when brand is selected", async () => {
      render(<DashboardPage />);

      // Should display metrics dashboard (not just onboarding)
      await waitFor(() => {
        // Should show GEO score or some metrics indicator
        expect(screen.getByTestId("dashboard-metrics")).toBeInTheDocument();
      });
    });

    it("should display GEO score gauge", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        // Should show GEO score value
        expect(screen.getByText("72")).toBeInTheDocument();
      });
    });

    it("should display recent mentions count", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        // Should show mentions count
        expect(screen.getByText("156")).toBeInTheDocument();
      });
    });

    it("should show pending recommendations count", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        // Should show pending recommendations
        expect(screen.getByText("16")).toBeInTheDocument();
      });
    });

    it("should link to Monitor page", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const monitorLink = screen.getByRole("link", { name: /monitor/i });
        expect(monitorLink).toHaveAttribute("href", "/dashboard/monitor");
      });
    });

    it("should link to Create page", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const createLink = screen.getByRole("link", { name: /create/i });
        expect(createLink).toHaveAttribute("href", "/dashboard/create");
      });
    });

    it("should link to Audit page", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const auditLink = screen.getByRole("link", { name: /audit/i });
        expect(auditLink).toHaveAttribute("href", "/dashboard/audit");
      });
    });

    it("should link to Recommendations page", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const recsLinks = screen.getAllByRole("link", { name: /recommendations/i });
        expect(recsLinks.length).toBeGreaterThan(0);
        expect(recsLinks[0]).toHaveAttribute("href", "/dashboard/recommendations");
      });
    });

    it("should show brand name in dashboard", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Brand")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should show onboarding flow when no brand selected", async () => {
      mockUseSelectedBrand.mockReturnValue(null);
      mockUseBrands.mockReturnValue([]);

      render(<DashboardPage />);

      await waitFor(() => {
        // Should show welcome/onboarding message
        expect(screen.getByText(/Welcome to Apex/i)).toBeInTheDocument();
      });
    });

    it("should show 'Add Your First Brand' CTA for new users", async () => {
      mockUseSelectedBrand.mockReturnValue(null);
      mockUseBrands.mockReturnValue([]);

      render(<DashboardPage />);

      await waitFor(() => {
        // Should have CTA to add brand
        expect(screen.getByText(/Add Your Brand/i)).toBeInTheDocument();
      });
    });

    it("should show loading state while fetching metrics", async () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<DashboardPage />);

      // Should show loading indicator
      expect(screen.getByTestId("dashboard-loading")).toBeInTheDocument();
    });

    it("should pass brandId to useDashboardMetrics hook", () => {
      render(<DashboardPage />);

      // Verify hook is called with brand id
      expect(mockUseDashboardMetrics).toHaveBeenCalledWith(mockBrand.id);
    });

    it("should show trend indicators for metrics", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        // Should show positive trend indicator (+5 or up arrow)
        expect(screen.getByText(/\+5/)).toBeInTheDocument();
      });
    });
  });

  describe("Failure Cases", () => {
    it("should gracefully handle API failure", async () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch metrics"),
        refetch: vi.fn(),
      });

      render(<DashboardPage />);

      await waitFor(() => {
        // Should show error state or fallback
        expect(screen.getByRole("heading", { name: /failed to load/i })).toBeInTheDocument();
      });
    });

    it("should have retry button on error state", async () => {
      const mockRefetch = vi.fn();
      mockUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch metrics"),
        refetch: mockRefetch,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        const retryButton = screen.getByRole("button", { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it("should show partial data when some API calls fail", async () => {
      // Metrics work but GEO score fails
      mockUseGEOScore.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("GEO score unavailable"),
      });

      render(<DashboardPage />);

      await waitFor(() => {
        // Should still show mentions count even if GEO fails
        expect(screen.getByText("156")).toBeInTheDocument();
      });
    });
  });
});

describe("Dashboard Home - Data Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseDashboardMetrics.mockReturnValue({
      data: mockDashboardMetrics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseGEOScore.mockReturnValue({
      data: mockGEOScore,
      isLoading: false,
      error: null,
    });
    mockUseRecentActivity.mockReturnValue({
      data: { activities: mockDashboardMetrics.recentActivity },
      isLoading: false,
      error: null,
    });
    mockUseUnifiedScore.mockReturnValue({
      data: { overall: 72, grade: "B", trend: "up", change: 3 },
      isLoading: false,
      error: null,
    });
  });

  it("should pass brandId to dashboard hooks", () => {
    render(<DashboardPage />);

    expect(mockUseDashboardMetrics).toHaveBeenCalledWith(mockBrand.id);
  });

  it("should update when selected brand changes", async () => {
    const { rerender } = render(<DashboardPage />);

    // Change selected brand
    const newBrand = { ...mockBrand, id: "brand-2", name: "New Brand" };
    mockUseSelectedBrand.mockReturnValue(newBrand);

    rerender(<DashboardPage />);

    // The hook should be called with new brand id
    expect(mockUseDashboardMetrics).toHaveBeenCalledWith("brand-2");
  });

  it("should call refreshBrands on mount", () => {
    render(<DashboardPage />);

    expect(mockRefreshBrands).toHaveBeenCalled();
  });
});
