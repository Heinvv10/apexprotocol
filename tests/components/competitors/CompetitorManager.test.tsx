/**
 * @vitest-environment jsdom
 *
 * CompetitorManager Component Tests
 *
 * Tests for the CompetitorManager component that manages tracked competitors.
 * Tests include empty states, loading states, data rendering, and user interactions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CompetitorManager } from "@/components/competitors/CompetitorManager";

// Sample competitor data
const mockCompetitors = [
  {
    competitorName: "Acme Corp",
    competitorDomain: "acme.com",
    latestSnapshot: {
      geoScore: 85,
      aiMentionCount: 42,
      snapshotDate: "2024-01-15",
    },
  },
  {
    competitorName: "Beta Inc",
    competitorDomain: "beta.com",
    latestSnapshot: {
      geoScore: 72,
      aiMentionCount: 28,
      snapshotDate: "2024-01-14",
    },
  },
  {
    competitorName: "Gamma Ltd",
    competitorDomain: "gamma.com",
    latestSnapshot: null,
  },
];

describe("CompetitorManager Component", () => {
  const mockBrandId = "brand-123";
  const mockOnCompetitorAdded = vi.fn();
  const mockOnCompetitorRemoved = vi.fn();

  // Mock fetch
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  // Mock window.confirm
  const mockConfirm = vi.fn();
  global.confirm = mockConfirm;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true); // Default to confirming deletions
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should display LoadingState component while fetching competitors", async () => {
      // Simulate delayed response
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ competitors: [] }),
                }),
              100
            )
          )
      );

      render(<CompetitorManager brandId={mockBrandId} />);

      // Should show loading state immediately
      expect(screen.getByText("Loading Competitors")).toBeInTheDocument();
      expect(screen.getByText("Fetching your tracked competitors...")).toBeInTheDocument();

      // Should show loading spinner icon
      const section = screen.getByRole("status");
      const svg = section.querySelector("svg");
      expect(svg).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText("Loading Competitors")).not.toBeInTheDocument();
      });
    });

    it("should have proper accessibility attributes in loading state", async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ competitors: [] }),
                }),
              100
            )
          )
      );

      render(<CompetitorManager brandId={mockBrandId} />);

      const loadingState = screen.getByRole("status");
      expect(loadingState).toHaveAttribute("aria-live", "polite");
      expect(loadingState).toHaveAttribute("aria-label", "Loading: Loading Competitors");

      await waitFor(() => {
        expect(screen.queryByText("Loading Competitors")).not.toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("should display EmptyState when no competitors are tracked", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Track Your Competitors")).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          "Add up to 10 competitors to monitor their GEO scores, AI mentions, and market positioning over time."
        )
      ).toBeInTheDocument();
    });

    it("should display primary action button in empty state", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Add First Competitor")).toBeInTheDocument();
      });

      const addButton = screen.getByText("Add First Competitor");
      expect(addButton).toBeInTheDocument();
    });

    it("should open add competitor dialog when clicking empty state action", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Add First Competitor")).toBeInTheDocument();
      });

      const addButton = screen.getByText("Add First Competitor");
      await user.click(addButton);

      // Dialog should open - check for dialog description which is unique
      await waitFor(() => {
        expect(
          screen.getByText(
            "Track a new competitor to monitor their GEO scores and AI mentions over time. You can track up to 10 competitors."
          )
        ).toBeInTheDocument();
      });
    });

    it("should have proper accessibility attributes in empty state", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        const emptyState = screen.getByRole("region");
        expect(emptyState).toHaveAttribute("aria-label", "Track Your Competitors");
        expect(emptyState).toHaveAttribute("aria-live", "polite");
      });
    });

    it("should display icon in empty state", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        const emptyState = screen.getByRole("region");
        const svg = emptyState.querySelector("svg");
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe("Rendering with Data", () => {
    it("should render competitor cards when competitors exist", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: mockCompetitors }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("Beta Inc")).toBeInTheDocument();
        expect(screen.getByText("Gamma Ltd")).toBeInTheDocument();
      });
    });

    it("should display competitor domains", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: mockCompetitors }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("acme.com")).toBeInTheDocument();
        expect(screen.getByText("beta.com")).toBeInTheDocument();
        expect(screen.getByText("gamma.com")).toBeInTheDocument();
      });
    });

    it("should display GEO scores when available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: mockCompetitors }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("85")).toBeInTheDocument();
        expect(screen.getByText("72")).toBeInTheDocument();
      });
    });

    it("should display AI mention counts when available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: mockCompetitors }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("42")).toBeInTheDocument();
        expect(screen.getByText("28")).toBeInTheDocument();
      });
    });

    it("should display competitor count", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: mockCompetitors }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("3 of 10 competitors tracked")).toBeInTheDocument();
      });
    });
  });

  describe("Add Competitor Dialog", () => {
    it("should open dialog when clicking Add Competitor button", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Tracked Competitors")).toBeInTheDocument();
      });

      const headerAddButton = screen.getByRole("button", { name: /Add competitor/i });
      await user.click(headerAddButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Track a new competitor to monitor their GEO scores and AI mentions over time. You can track up to 10 competitors."
          )
        ).toBeInTheDocument();
      });
    });

    it("should successfully add a competitor", async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ competitors: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              competitors: [
                {
                  competitorName: "New Competitor",
                  competitorDomain: "newcomp.com",
                },
              ],
            }),
        });

      render(
        <CompetitorManager brandId={mockBrandId} onCompetitorAdded={mockOnCompetitorAdded} />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText("Tracked Competitors")).toBeInTheDocument();
      });

      // Open dialog - use the button role
      const addButton = screen.getByRole("button", { name: /Add competitor/i });
      await user.click(addButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByLabelText("Competitor Name")).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText("Competitor Name");
      const domainInput = screen.getByLabelText("Website Domain");

      await user.type(nameInput, "New Competitor");
      await user.type(domainInput, "newcomp.com");

      // Submit form - use button type
      const submitButton = screen.getByRole("button", { name: /Add Competitor/i });
      await user.click(submitButton);

      // Verify callback was called
      await waitFor(() => {
        expect(mockOnCompetitorAdded).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it("should disable Add Competitor button when limit reached", async () => {
      const tenCompetitors = Array.from({ length: 10 }, (_, i) => ({
        competitorName: `Competitor ${i + 1}`,
        competitorDomain: `competitor${i + 1}.com`,
        latestSnapshot: null,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: tenCompetitors }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Competitor 1")).toBeInTheDocument();
      });

      const addButton = screen.getByRole("button", { name: /Add competitor/i });
      expect(addButton).toBeDisabled();
    });

    it("should show warning when competitor limit is reached", async () => {
      const tenCompetitors = Array.from({ length: 10 }, (_, i) => ({
        competitorName: `Competitor ${i + 1}`,
        competitorDomain: `competitor${i + 1}.com`,
        latestSnapshot: null,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: tenCompetitors }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Competitor 1")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Maximum competitor limit reached. Remove a competitor to add a new one.")
      ).toBeInTheDocument();
    });
  });

  describe("Remove Competitor", () => {
    it("should show remove button on hover", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [mockCompetitors[0]] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText("Remove Acme Corp");
      expect(removeButton).toBeInTheDocument();
    });

    it("should remove competitor when confirmed", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ competitors: [mockCompetitors[0]] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ competitors: [] }),
        });

      render(
        <CompetitorManager brandId={mockBrandId} onCompetitorRemoved={mockOnCompetitorRemoved} />
      );

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText("Remove Acme Corp");
      await user.click(removeButton);

      // Verify confirm was called
      expect(mockConfirm).toHaveBeenCalledWith(
        "Are you sure you want to remove this competitor and all its historical data?"
      );

      // Verify callback was called
      await waitFor(() => {
        expect(mockOnCompetitorRemoved).toHaveBeenCalled();
      });
    });

    it("should not remove competitor when cancelled", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [mockCompetitors[0]] }),
      });

      render(
        <CompetitorManager brandId={mockBrandId} onCompetitorRemoved={mockOnCompetitorRemoved} />
      );

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText("Remove Acme Corp");
      await user.click(removeButton);

      // Verify callback was NOT called
      expect(mockOnCompetitorRemoved).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should display error message when fetch fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it("should display error when add competitor fails", async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ competitors: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: "Failed to add competitor" }),
        });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Tracked Competitors")).toBeInTheDocument();
      });

      // Open dialog
      const addButton = screen.getByRole("button", { name: /Add competitor/i });
      await user.click(addButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByLabelText("Competitor Name")).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText("Competitor Name");
      const domainInput = screen.getByLabelText("Website Domain");

      await user.type(nameInput, "Test Competitor");
      await user.type(domainInput, "test.com");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /Add Competitor/i });
      await user.click(submitButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText("Failed to add competitor")).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels on buttons", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [mockCompetitors[0]] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText("Remove Acme Corp");
      expect(removeButton).toBeInTheDocument();
    });

    it("should have proper heading structure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Tracked Competitors")).toBeInTheDocument();
      });
    });

    it("should have accessible form labels", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Tracked Competitors")).toBeInTheDocument();
      });

      // Open dialog
      const addButton = screen.getByRole("button", { name: /Add competitor/i });
      await user.click(addButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByLabelText("Competitor Name")).toBeInTheDocument();
      });

      // Check for form labels
      expect(screen.getByLabelText("Competitor Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Website Domain")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should update form inputs correctly", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Tracked Competitors")).toBeInTheDocument();
      });

      // Open dialog
      const addButton = screen.getByRole("button", { name: /Add competitor/i });
      await user.click(addButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByLabelText("Competitor Name")).toBeInTheDocument();
      });

      // Type in inputs
      const nameInput = screen.getByLabelText("Competitor Name") as HTMLInputElement;
      const domainInput = screen.getByLabelText("Website Domain") as HTMLInputElement;

      await user.type(nameInput, "Test Company");
      await user.type(domainInput, "test.com");

      expect(nameInput.value).toBe("Test Company");
      expect(domainInput.value).toBe("test.com");
    });

    it("should close dialog when clicking Cancel", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(<CompetitorManager brandId={mockBrandId} />);

      await waitFor(() => {
        expect(screen.getByText("Tracked Competitors")).toBeInTheDocument();
      });

      // Open dialog
      const addButton = screen.getByRole("button", { name: /Add competitor/i });
      await user.click(addButton);

      // Wait for dialog to open and verify content is visible
      await waitFor(() => {
        expect(
          screen.getByText(
            "Track a new competitor to monitor their GEO scores and AI mentions over time. You can track up to 10 competitors."
          )
        ).toBeInTheDocument();
      });

      // Click Cancel
      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      // Dialog should be closed
      await waitFor(() => {
        expect(
          screen.queryByText(
            "Track a new competitor to monitor their GEO scores and AI mentions over time. You can track up to 10 competitors."
          )
        ).not.toBeInTheDocument();
      });
    });
  });
});
