/**
 * @vitest-environment jsdom
 *
 * Settings Page - Brand Configuration Flow Tests
 *
 * Subtask 3.4: Test the complete flow of loading, editing, and saving
 * brand configuration through the Settings page.
 *
 * Acceptance Criteria:
 * - Brand config loads from API
 * - Form displays current values
 * - Save persists changes to database
 * - Success/error feedback shown
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Brand } from "@/stores/brand-store";

// Ensure ResizeObserver is properly mocked (reinforcing global setup)
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = "";
  thresholds = [];
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock the stores module
const mockUseSelectedBrand = vi.fn();

vi.mock("@/stores", () => ({
  useBrandStore: vi.fn((selector) => {
    const state = {
      brands: [],
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
  useBrands: () => [],
  useBrandMeta: () => ({ total: 1, limit: 5, plan: "professional", canAddMore: true }),
}));

// Mock the useMonitor hooks
const mockUseBrandConfig = vi.fn();
const mockUseSaveBrandConfig = vi.fn();

vi.mock("@/hooks/useMonitor", () => ({
  useBrandConfig: (brandId: string) => mockUseBrandConfig(brandId),
  useSaveBrandConfig: () => mockUseSaveBrandConfig(),
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
  keywords: ["test", "brand", "monitoring"],
  seoKeywords: ["seo", "keywords"],
  geoKeywords: ["geo", "keywords"],
  competitors: [
    { name: "Competitor 1", url: "https://competitor1.com", reason: "Direct competitor" },
    { name: "Competitor 2", url: "https://competitor2.com", reason: "Industry rival" },
  ],
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

// Sample brand config API response
const mockBrandConfig = {
  id: "brand-1",
  name: "Test Brand",
  domain: "testbrand.com",
  description: "A test brand",
  keywords: ["test", "brand", "monitoring"],
  competitors: ["Competitor 1", "Competitor 2"],
  trackingEnabled: true,
  alertsEnabled: true,
  platforms: ["chatgpt", "claude"],
};

// Import AFTER mocking
import MonitorSettingsPage from "../page";

describe("Settings Page - Brand Configuration Flow", () => {
  let mockMutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset default mocks
    mockMutateAsync = vi.fn().mockResolvedValue(mockBrandConfig);

    mockUseSelectedBrand.mockReturnValue(mockBrand);
    mockUseBrandConfig.mockReturnValue({
      data: mockBrandConfig,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseSaveBrandConfig.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isError: false,
      error: null,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("AC-3.4.1: Brand config loads from API", () => {
    it("should call useBrandConfig with selected brand ID", async () => {
      render(<MonitorSettingsPage />);

      await waitFor(() => {
        expect(mockUseBrandConfig).toHaveBeenCalledWith("brand-1");
      });
    });

    it("should show loading state while fetching brand config", async () => {
      mockUseBrandConfig.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<MonitorSettingsPage />);

      expect(screen.getByText(/loading brand configuration/i)).toBeInTheDocument();
    });

    it("should show error state when API fails", async () => {
      mockUseBrandConfig.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to load brand config"),
        refetch: vi.fn(),
      });

      render(<MonitorSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load brand configuration/i)).toBeInTheDocument();
      });
    });

    it("should have retry button when API fails", async () => {
      const mockRefetch = vi.fn();
      mockUseBrandConfig.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to load brand config"),
        refetch: mockRefetch,
      });

      render(<MonitorSettingsPage />);

      const retryButton = screen.getByRole("button", { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe("AC-3.4.2: Form displays current values", () => {
    it("should display brand name from API", async () => {
      render(<MonitorSettingsPage />);

      await waitFor(() => {
        const brandNameInput = screen.getByPlaceholderText(/enter your brand name/i);
        expect(brandNameInput).toHaveValue("Test Brand");
      });
    });

    it("should display keywords from API", async () => {
      render(<MonitorSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("test")).toBeInTheDocument();
        expect(screen.getByText("brand")).toBeInTheDocument();
        expect(screen.getByText("monitoring")).toBeInTheDocument();
      });
    });

    it("should display competitors from API", async () => {
      render(<MonitorSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("Competitor 1")).toBeInTheDocument();
        expect(screen.getByText("Competitor 2")).toBeInTheDocument();
      });
    });

    it("should show 'no brand selected' state when no brand is selected", async () => {
      mockUseSelectedBrand.mockReturnValue(null);

      render(<MonitorSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/no brand selected/i)).toBeInTheDocument();
      });
    });
  });

  describe("AC-3.4.3: Save persists changes to database", () => {
    it("should call saveBrandConfig when form is submitted", async () => {
      const user = userEvent.setup();

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save configuration/i });
      await user.click(saveButton);

      // Verify mutateAsync was called
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it("should pass correct data structure to saveBrandConfig", async () => {
      const user = userEvent.setup();

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save configuration/i });
      await user.click(saveButton);

      // Verify the data structure passed to mutateAsync
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "brand-1",
            name: "Test Brand",
            keywords: ["test", "brand", "monitoring"],
            competitors: ["Competitor 1", "Competitor 2"],
          })
        );
      });
    });

    it("should disable save button during submission", async () => {
      const user = userEvent.setup();

      // Make mutateAsync take some time
      mockMutateAsync.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockBrandConfig), 100))
      );

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save configuration/i });
      await user.click(saveButton);

      // Button should show saving state
      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });
    });
  });

  describe("AC-3.4.4: Success/error feedback shown", () => {
    it("should show success message after successful save", async () => {
      const user = userEvent.setup();

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save configuration/i });
      await user.click(saveButton);

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/configuration saved successfully/i)).toBeInTheDocument();
      });
    });

    it("should show error message when save fails", async () => {
      mockUseSaveBrandConfig.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isError: true,
        error: { message: "Failed to save configuration" },
        isPending: false,
      });

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Error message should be displayed - use getAllBy since error appears in heading and description
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/failed to save configuration/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it("should show specific error message from API", async () => {
      mockUseSaveBrandConfig.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isError: true,
        error: { message: "Brand name already exists" },
        isPending: false,
      });

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Specific error message should be displayed
      await waitFor(() => {
        expect(screen.getByText(/brand name already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should require brand name", async () => {
      const user = userEvent.setup();

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Clear brand name
      const brandNameInput = screen.getByPlaceholderText(/enter your brand name/i);
      await user.clear(brandNameInput);

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save configuration/i });
      await user.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/brand name is required/i)).toBeInTheDocument();
      });

      // mutateAsync should not be called
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("should require at least one keyword", async () => {
      const user = userEvent.setup();

      // Start with empty keywords
      mockUseBrandConfig.mockReturnValue({
        data: { ...mockBrandConfig, keywords: [] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save configuration/i });
      await user.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/at least one keyword is required/i)).toBeInTheDocument();
      });
    });

    it("should require at least one competitor", async () => {
      const user = userEvent.setup();

      // Start with empty competitors
      mockUseBrandConfig.mockReturnValue({
        data: { ...mockBrandConfig, competitors: [] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save configuration/i });
      await user.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/at least one competitor is required/i)).toBeInTheDocument();
      });
    });
  });

  describe("Keyword Management", () => {
    it("should add a new keyword when enter is pressed", async () => {
      const user = userEvent.setup();

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Add a new keyword
      const keywordInput = screen.getByPlaceholderText(/add a keyword/i);
      await user.type(keywordInput, "newkeyword{enter}");

      // New keyword should appear
      await waitFor(() => {
        expect(screen.getByText("newkeyword")).toBeInTheDocument();
      });
    });

    it("should remove a keyword when clicking remove button", async () => {
      const user = userEvent.setup();

      render(<MonitorSettingsPage />);

      // Wait for form to load with keywords
      await waitFor(() => {
        expect(screen.getByText("test")).toBeInTheDocument();
      });

      // Find and click the remove button for "test" keyword
      const testKeywordElement = screen.getByText("test");
      const removeButton = testKeywordElement.parentElement?.querySelector("button");

      if (removeButton) {
        await user.click(removeButton);
      }

      // Keyword should be removed
      await waitFor(() => {
        expect(screen.queryByText("test")).not.toBeInTheDocument();
      });
    });

    it("should not add duplicate keywords", async () => {
      const user = userEvent.setup();

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText("test")).toBeInTheDocument();
      });

      // Try to add duplicate keyword
      const keywordInput = screen.getByPlaceholderText(/add a keyword/i);
      await user.type(keywordInput, "test{enter}");

      // Should still have only one "test" keyword
      const testKeywords = screen.getAllByText("test");
      expect(testKeywords).toHaveLength(1);
    });
  });

  describe("Competitor Management", () => {
    it("should add a new competitor when enter is pressed", async () => {
      const user = userEvent.setup();

      render(<MonitorSettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      });

      // Add a new competitor
      const competitorInput = screen.getByPlaceholderText(/add a competitor/i);
      await user.type(competitorInput, "New Competitor{enter}");

      // New competitor should appear
      await waitFor(() => {
        expect(screen.getByText("New Competitor")).toBeInTheDocument();
      });
    });

    it("should remove a competitor when clicking remove button", async () => {
      const user = userEvent.setup();

      render(<MonitorSettingsPage />);

      // Wait for form to load with competitors
      await waitFor(() => {
        expect(screen.getByText("Competitor 1")).toBeInTheDocument();
      });

      // Find and click the remove button for "Competitor 1"
      const competitorElement = screen.getByText("Competitor 1");
      const removeButton = competitorElement.parentElement?.querySelector("button");

      if (removeButton) {
        await user.click(removeButton);
      }

      // Competitor should be removed
      await waitFor(() => {
        expect(screen.queryByText("Competitor 1")).not.toBeInTheDocument();
      });
    });
  });

  describe("Page Structure", () => {
    it("should display page header", async () => {
      render(<MonitorSettingsPage />);

      expect(screen.getByText("Brand Configuration")).toBeInTheDocument();
      expect(
        screen.getByText(/configure your brand details for ai platform monitoring/i)
      ).toBeInTheDocument();
    });

    it("should display how brand monitoring works section", async () => {
      render(<MonitorSettingsPage />);

      expect(screen.getByText("How Brand Monitoring Works")).toBeInTheDocument();
    });

    it("should have back button to monitor dashboard", async () => {
      render(<MonitorSettingsPage />);

      const backLink = screen.getByRole("link", { name: "" });
      expect(backLink).toHaveAttribute("href", "/dashboard/monitor");
    });
  });
});
