/**
 * @vitest-environment jsdom
 *
 * Audit Page - Brand Integration Tests
 *
 * PAI Doc-Driven TDD: Tests written BEFORE implementation
 * These tests will FAIL initially until Audit page is connected to brand context
 *
 * Requirements from plan:
 * - Pre-fill URL input with selected brand domain
 * - Update URL when brand changes
 * - Pass brandId to audit API on submit
 * - Show audit history for selected brand
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

// Mock the useAudit hooks
const mockUseAuditsByBrand = vi.fn();
const mockUseStartAudit = vi.fn();

vi.mock("@/hooks/useAudit", () => ({
  useAuditsByBrand: (brandId: string, filters: unknown) =>
    mockUseAuditsByBrand(brandId, filters),
  useStartAudit: () => mockUseStartAudit(),
  useAudit: vi.fn(),
  useAuditIssues: vi.fn(),
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

// Sample audit data matching Audit interface from useAudit
const mockAudits = [
  {
    id: "audit-1",
    brandId: "brand-1",
    url: "https://testbrand.com",
    status: "completed" as const,
    overallScore: 78,
    technicalScore: 82,
    contentScore: 75,
    authorityScore: 70,
    aiReadinessScore: 85,
    pagesScanned: 15,
    issuesFound: 12,
    criticalIssues: 2,
    startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    completedAt: new Date().toISOString(),
  },
  {
    id: "audit-2",
    brandId: "brand-1",
    url: "https://testbrand.com/products",
    status: "completed" as const,
    overallScore: 65,
    technicalScore: 70,
    contentScore: 60,
    authorityScore: 55,
    aiReadinessScore: 75,
    pagesScanned: 8,
    issuesFound: 18,
    criticalIssues: 5,
    startedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    completedAt: new Date(Date.now() - 82800000).toISOString(),
  },
];

// Mock response structure matching AuditListResponse
const mockAuditsResponse = {
  audits: mockAudits,
  total: mockAudits.length,
  page: 1,
  limit: 50,
};

// Mock mutation functions
const mockMutate = vi.fn();
const mockMutateAsync = vi.fn();

// Import AFTER mocking
import AuditPage from "../page";

describe("Audit Page - Brand Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Default: brand selected with audit history
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseAuditsByBrand.mockReturnValue({
      data: mockAuditsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseStartAudit.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  describe("Expected Behavior", () => {
    it("should pre-fill URL input with selected brand domain", async () => {
      render(<AuditPage />);

      // The URL input should be pre-filled with the brand's domain
      await waitFor(() => {
        const urlInput = screen.getByPlaceholderText(/example\.com/i);
        expect(urlInput).toHaveValue("https://testbrand.com");
      });
    });

    it("should show audit history for selected brand", async () => {
      render(<AuditPage />);

      await waitFor(() => {
        // Should show audit URLs in history
        expect(screen.getByText("https://testbrand.com")).toBeInTheDocument();
        expect(screen.getByText("https://testbrand.com/products")).toBeInTheDocument();
      });
    });

    it("should display audit scores in history", async () => {
      render(<AuditPage />);

      await waitFor(() => {
        // Should show audit scores
        expect(screen.getByText("78")).toBeInTheDocument();
        expect(screen.getByText("65")).toBeInTheDocument();
      });
    });

    it("should pass brandId to useAuditsByBrand hook", () => {
      render(<AuditPage />);

      // Verify useAuditsByBrand is called with brand id
      expect(mockUseAuditsByBrand).toHaveBeenCalledWith(mockBrand.id, expect.any(Object));
    });
  });

  describe("Edge Cases", () => {
    it("should show 'Select a brand' when no brand selected", async () => {
      mockUseSelectedBrand.mockReturnValue(null);
      mockUseAuditsByBrand.mockReturnValue({
        data: { audits: [], total: 0, page: 1, limit: 50 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<AuditPage />);

      await waitFor(() => {
        // Should prompt user to select a brand
        expect(screen.getByText(/select a brand/i)).toBeInTheDocument();
      });
    });

    it("should allow manual URL entry (override brand domain)", async () => {
      const user = userEvent.setup();
      render(<AuditPage />);

      await waitFor(() => {
        const urlInput = screen.getByPlaceholderText(/example\.com/i);
        expect(urlInput).toHaveValue("https://testbrand.com");
      });

      // User can type a different URL
      const urlInput = screen.getByPlaceholderText(/example\.com/i);
      await user.clear(urlInput);
      await user.type(urlInput, "https://different-site.com");

      expect(urlInput).toHaveValue("https://different-site.com");
    });

    it("should show loading state while fetching audit history", async () => {
      mockUseAuditsByBrand.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<AuditPage />);

      // Should show loading indicator for history section
      expect(screen.getByTestId("audit-history-loading")).toBeInTheDocument();
    });

    it("should show empty state when brand has no audits", async () => {
      mockUseAuditsByBrand.mockReturnValue({
        data: { audits: [], total: 0, page: 1, limit: 50 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<AuditPage />);

      await waitFor(() => {
        // Should show empty state message
        expect(screen.getByText(/no audits yet/i)).toBeInTheDocument();
      });
    });

    it("should update URL when brand changes", async () => {
      const { rerender } = render(<AuditPage />);

      // Initial brand domain
      await waitFor(() => {
        const urlInput = screen.getByPlaceholderText(/example\.com/i);
        expect(urlInput).toHaveValue("https://testbrand.com");
      });

      // Change to new brand
      const newBrand = { ...mockBrand, id: "brand-2", domain: "newbrand.com" };
      mockUseSelectedBrand.mockReturnValue(newBrand);

      rerender(<AuditPage />);

      // URL should update to new brand's domain
      await waitFor(() => {
        const urlInput = screen.getByPlaceholderText(/example\.com/i);
        expect(urlInput).toHaveValue("https://newbrand.com");
      });
    });
  });

  describe("Audit Submission", () => {
    it("should call startAudit mutation with brandId on submit", async () => {
      const user = userEvent.setup();
      render(<AuditPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/example\.com/i)).toHaveValue("https://testbrand.com");
      });

      // Click Start Audit button
      const startButton = screen.getByRole("button", { name: /start audit/i });
      await user.click(startButton);

      // Should call mutation with brandId
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          brandId: mockBrand.id,
          url: "https://testbrand.com",
        })
      );
    });

    it("should show error for invalid URL format", async () => {
      const user = userEvent.setup();
      render(<AuditPage />);

      const urlInput = screen.getByPlaceholderText(/example\.com/i);
      await user.clear(urlInput);
      await user.type(urlInput, "not-a-valid-url");

      // Click Start Audit button
      const startButton = screen.getByRole("button", { name: /start audit/i });
      await user.click(startButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/valid url/i)).toBeInTheDocument();
      });
    });

    it("should show loading state during audit submission", async () => {
      mockUseStartAudit.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
      });

      render(<AuditPage />);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
      });
    });
  });

  describe("Failure Cases", () => {
    it("should show error state when audit history fetch fails", async () => {
      mockUseAuditsByBrand.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch audits"),
        refetch: vi.fn(),
      });

      render(<AuditPage />);

      await waitFor(() => {
        // Should show error heading
        expect(
          screen.getByRole("heading", { name: /failed to load audit history/i })
        ).toBeInTheDocument();
      });
    });

    it("should have retry button on error state", async () => {
      const mockRefetch = vi.fn();
      mockUseAuditsByBrand.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch audits"),
        refetch: mockRefetch,
      });

      render(<AuditPage />);

      await waitFor(() => {
        // Should have a retry button
        const retryButton = screen.getByRole("button", { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });
});

describe("Audit Page - Data Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrands.mockReturnValue([mockBrand]);
    mockUseAuditsByBrand.mockReturnValue({
      data: mockAuditsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseStartAudit.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it("should pass brandId to useAuditsByBrand hook", () => {
    render(<AuditPage />);

    // Verify useAuditsByBrand is called with brand id
    expect(mockUseAuditsByBrand).toHaveBeenCalledWith(mockBrand.id, expect.any(Object));
  });

  it("should update when selected brand changes", async () => {
    const { rerender } = render(<AuditPage />);

    // Change selected brand
    const newBrand = { ...mockBrand, id: "brand-2", name: "New Brand", domain: "newbrand.com" };
    mockUseSelectedBrand.mockReturnValue(newBrand);

    rerender(<AuditPage />);

    // The hook should be called again with new brand id
    expect(mockUseAuditsByBrand).toHaveBeenCalledWith("brand-2", expect.any(Object));
  });
});
