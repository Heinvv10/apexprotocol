/**
 * @vitest-environment jsdom
 *
 * ErrorState Component Tests
 *
 * Comprehensive tests for the ErrorState component covering:
 * - Basic rendering with different props
 * - Error message handling (Error objects and strings)
 * - Retry action functionality
 * - Dismiss action functionality
 * - Inheritance from EmptyState
 * - Accessibility features
 * - Custom styling
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ErrorState } from "@/components/ui/error-state";

describe("ErrorState Component", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      render(<ErrorState />);

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should render with custom title", () => {
      render(<ErrorState title="Failed to load data" />);

      expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    });

    it("should render with title and description", () => {
      render(
        <ErrorState
          title="Upload failed"
          description="The file size exceeds the maximum limit"
        />
      );

      expect(screen.getByText("Upload failed")).toBeInTheDocument();
      expect(screen.getByText("The file size exceeds the maximum limit")).toBeInTheDocument();
    });

    it("should render AlertCircle icon", () => {
      const { container } = render(<ErrorState />);

      const section = screen.getByRole("alert");
      const svg = section.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render without description when not provided", () => {
      const { container } = render(<ErrorState title="Error occurred" />);

      expect(screen.getByText("Error occurred")).toBeInTheDocument();

      const section = screen.getByRole("alert");
      const paragraphs = section.querySelectorAll("p");
      expect(paragraphs.length).toBe(0);
    });
  });

  describe("Error Message Handling", () => {
    it("should display error message from Error object", () => {
      const error = new Error("Network request failed");

      render(<ErrorState error={error} />);

      expect(screen.getByText("Network request failed")).toBeInTheDocument();
    });

    it("should display error message from string", () => {
      render(<ErrorState error="Invalid API key" />);

      expect(screen.getByText("Invalid API key")).toBeInTheDocument();
    });

    it("should use error prop when both error and description are provided", () => {
      const error = new Error("Error message from error prop");

      render(
        <ErrorState
          error={error}
          description="Description text"
        />
      );

      // error prop takes precedence over description prop
      expect(screen.getByText("Error message from error prop")).toBeInTheDocument();
      expect(screen.queryByText("Description text")).not.toBeInTheDocument();
    });

    it("should handle Error object with empty message", () => {
      const error = new Error("");

      render(<ErrorState error={error} />);

      const section = screen.getByRole("alert");
      expect(section).toBeInTheDocument();
    });

    it("should handle complex Error objects", () => {
      const error = new Error("Authentication failed: Invalid credentials");

      render(
        <ErrorState
          title="Login error"
          error={error}
        />
      );

      expect(screen.getByText("Login error")).toBeInTheDocument();
      expect(screen.getByText("Authentication failed: Invalid credentials")).toBeInTheDocument();
    });

    it("should update error message when error prop changes", () => {
      const { rerender } = render(
        <ErrorState error="First error" />
      );

      expect(screen.getByText("First error")).toBeInTheDocument();

      rerender(<ErrorState error="Second error" />);

      expect(screen.getByText("Second error")).toBeInTheDocument();
      expect(screen.queryByText("First error")).not.toBeInTheDocument();
    });
  });

  describe("Retry Action", () => {
    it("should render retry button when onRetry is provided", () => {
      const handleRetry = vi.fn();

      render(<ErrorState onRetry={handleRetry} />);

      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should call onRetry when retry button is clicked", async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(<ErrorState onRetry={handleRetry} />);

      const retryButton = screen.getByText("Try Again");
      await user.click(retryButton);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it("should render custom retry label", () => {
      render(
        <ErrorState
          onRetry={vi.fn()}
          retryLabel="Retry Upload"
        />
      );

      expect(screen.getByText("Retry Upload")).toBeInTheDocument();
    });

    it("should render retry button with RotateCw icon", () => {
      const { container } = render(<ErrorState onRetry={vi.fn()} />);

      const retryButton = screen.getByText("Try Again");
      const svg = retryButton.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should not render retry button when onRetry is not provided", () => {
      render(<ErrorState />);

      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    });

    it("should handle multiple retry clicks", async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(<ErrorState onRetry={handleRetry} />);

      const retryButton = screen.getByText("Try Again");
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      expect(handleRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe("Dismiss Action", () => {
    it("should render dismiss button when onDismiss is provided", () => {
      const handleDismiss = vi.fn();

      render(<ErrorState onDismiss={handleDismiss} />);

      expect(screen.getByText("Dismiss")).toBeInTheDocument();
    });

    it("should call onDismiss when dismiss button is clicked", async () => {
      const user = userEvent.setup();
      const handleDismiss = vi.fn();

      render(<ErrorState onDismiss={handleDismiss} />);

      const dismissButton = screen.getByText("Dismiss");
      await user.click(dismissButton);

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it("should render custom dismiss label", () => {
      render(
        <ErrorState
          onDismiss={vi.fn()}
          dismissLabel="Close"
        />
      );

      expect(screen.getByText("Close")).toBeInTheDocument();
    });

    it("should not render dismiss button when onDismiss is not provided", () => {
      render(<ErrorState />);

      expect(screen.queryByText("Dismiss")).not.toBeInTheDocument();
    });

    it("should render dismiss button with ghost variant", () => {
      render(<ErrorState onDismiss={vi.fn()} />);

      const dismissButton = screen.getByText("Dismiss");
      expect(dismissButton).toHaveClass("hover:bg-accent");
    });
  });

  describe("Combined Actions", () => {
    it("should render both retry and dismiss buttons", () => {
      render(
        <ErrorState
          onRetry={vi.fn()}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText("Try Again")).toBeInTheDocument();
      expect(screen.getByText("Dismiss")).toBeInTheDocument();
    });

    it("should call correct handlers for retry and dismiss", async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();
      const handleDismiss = vi.fn();

      render(
        <ErrorState
          onRetry={handleRetry}
          onDismiss={handleDismiss}
        />
      );

      await user.click(screen.getByText("Try Again"));
      expect(handleRetry).toHaveBeenCalledTimes(1);
      expect(handleDismiss).not.toHaveBeenCalled();

      await user.click(screen.getByText("Dismiss"));
      expect(handleDismiss).toHaveBeenCalledTimes(1);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it("should render with custom labels for both actions", () => {
      render(
        <ErrorState
          onRetry={vi.fn()}
          retryLabel="Retry Payment"
          onDismiss={vi.fn()}
          dismissLabel="Cancel"
        />
      );

      expect(screen.getByText("Retry Payment")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  describe("Theme and Styling", () => {
    it("should use error theme by default", () => {
      const { container } = render(<ErrorState />);

      const iconContainer = container.querySelector(".bg-error\\/10");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should have error color on icon", () => {
      const { container } = render(<ErrorState />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("text-error");
    });

    it("should not have glow effect", () => {
      const { container } = render(<ErrorState />);

      const glowElement = container.querySelector("[style*='empty-state-glow-pulse']");
      expect(glowElement).not.toBeInTheDocument();
    });

    it("should apply custom className to container", () => {
      render(<ErrorState className="custom-error-class" />);

      const section = screen.getByRole("alert");
      expect(section).toHaveClass("custom-error-class");
    });
  });

  describe("Size Variants", () => {
    it("should render small size correctly", () => {
      render(<ErrorState size="sm" />);

      const section = screen.getByRole("alert");
      expect(section).toHaveClass("min-h-[150px]");
      expect(section).toHaveClass("space-y-2");
    });

    it("should render medium size correctly (default)", () => {
      render(<ErrorState />);

      const section = screen.getByRole("alert");
      expect(section).toHaveClass("min-h-[200px]");
      expect(section).toHaveClass("space-y-4");
    });

    it("should render large size correctly", () => {
      render(<ErrorState size="lg" />);

      const section = screen.getByRole("alert");
      expect(section).toHaveClass("min-h-[300px]");
      expect(section).toHaveClass("space-y-6");
    });

    it("should render icon at correct size for small variant", () => {
      const { container } = render(<ErrorState size="sm" />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-6");
      expect(svg).toHaveClass("h-6");
    });

    it("should render icon at correct size for medium variant", () => {
      const { container } = render(<ErrorState size="md" />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-8");
      expect(svg).toHaveClass("h-8");
    });

    it("should render icon at correct size for large variant", () => {
      const { container } = render(<ErrorState size="lg" />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-10");
      expect(svg).toHaveClass("h-10");
    });
  });

  describe("Accessibility Features", () => {
    it("should have role='alert'", () => {
      render(<ErrorState />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("should have aria-live='assertive'", () => {
      render(<ErrorState />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");
    });

    it("should have aria-label with 'Error: ' prefix", () => {
      render(<ErrorState title="Failed to load" />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-label", "Error: Failed to load");
    });

    it("should have default aria-label when using default title", () => {
      render(<ErrorState />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-label", "Error: Something went wrong");
    });

    it("should mark icon container as aria-hidden", () => {
      const { container } = render(<ErrorState />);

      const iconWrapper = container.querySelector("[aria-hidden='true']");
      expect(iconWrapper).toBeInTheDocument();
    });

    it("should use semantic heading for title", () => {
      render(<ErrorState title="Error occurred" />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Error occurred");
    });

    it("should have proper semantic HTML structure", () => {
      render(<ErrorState />);

      const alert = screen.getByRole("alert");
      expect(alert.tagName).toBe("SECTION");
    });

    it("should have accessible button labels", () => {
      render(
        <ErrorState
          onRetry={vi.fn()}
          onDismiss={vi.fn()}
        />
      );

      const retryButton = screen.getByText("Try Again");
      expect(retryButton).toHaveAttribute("aria-label", "Try Again");

      const dismissButton = screen.getByText("Dismiss");
      expect(dismissButton).toHaveAttribute("aria-label", "Dismiss");
    });
  });

  describe("Inheritance from EmptyState", () => {
    it("should support variant prop from EmptyState", () => {
      render(<ErrorState variant="compact" />);

      const section = screen.getByRole("alert");
      expect(section).toHaveClass("min-h-0");
    });

    it("should support inline variant", () => {
      render(<ErrorState variant="inline" />);

      const section = screen.getByRole("alert");
      expect(section).toHaveClass("flex-row");
      expect(section).toHaveClass("text-left");
    });

    it("should support card variant", () => {
      render(<ErrorState variant="card" />);

      const section = screen.getByRole("alert");
      expect(section).toHaveClass("card-secondary");
      expect(section).toHaveClass("p-8");
    });

    it("should support maxWidth prop from EmptyState", () => {
      const { container } = render(
        <ErrorState maxWidth="max-w-sm" />
      );

      const wrapper = container.querySelector(".max-w-sm");
      expect(wrapper).toBeInTheDocument();
    });

    it("should support custom minHeight from EmptyState", () => {
      render(<ErrorState minHeight="400px" />);

      const section = screen.getByRole("alert");
      expect(section).toHaveStyle({ minHeight: "400px" });
    });

    it("should support titleClassName from EmptyState", () => {
      render(
        <ErrorState title="Custom title" titleClassName="custom-title" />
      );

      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("custom-title");
    });

    it("should support descriptionClassName from EmptyState", () => {
      const { container } = render(
        <ErrorState
          description="Description"
          descriptionClassName="custom-desc"
        />
      );

      const description = container.querySelector(".custom-desc");
      expect(description).toBeInTheDocument();
    });

    it("should support id prop from EmptyState", () => {
      render(<ErrorState id="custom-error-id" />);

      const section = screen.getByRole("alert");
      expect(section).toHaveAttribute("id", "custom-error-id");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string title", () => {
      render(<ErrorState title="" />);

      const heading = screen.getByRole("heading");
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("");
    });

    it("should handle very long title text", () => {
      const longTitle = "An unexpected error occurred while processing your request and we were unable to complete the operation successfully";

      render(<ErrorState title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle very long description text", () => {
      const longDescription = "The server encountered an unexpected condition that prevented it from fulfilling the request. This could be due to a temporary server error, network connectivity issues, or a problem with the data you submitted. Please try again in a few moments, and if the problem persists, contact our support team for assistance.";

      render(<ErrorState description={longDescription} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it("should handle Error object with very long message", () => {
      const longMessage = "Network request failed: timeout after 30000ms while attempting to fetch data from https://api.example.com/v1/competitors/12345/analytics";
      const error = new Error(longMessage);

      render(<ErrorState error={error} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should work with all size and variant combinations", () => {
      const { rerender } = render(
        <ErrorState size="sm" variant="compact" title="Small compact error" />
      );

      let section = screen.getByRole("alert");
      expect(section).toHaveClass("min-h-0");
      expect(section).toHaveClass("space-y-2");

      rerender(
        <ErrorState size="lg" variant="card" title="Large card error" />
      );

      section = screen.getByRole("alert");
      expect(section).toHaveClass("card-secondary");
      expect(section).toHaveClass("space-y-6");
    });
  });

  describe("Integration Scenarios", () => {
    it("should render complete error state with all features", () => {
      const handleRetry = vi.fn();
      const handleDismiss = vi.fn();
      const error = new Error("Failed to fetch competitors");

      render(
        <ErrorState
          title="Failed to load competitors"
          error={error}
          onRetry={handleRetry}
          retryLabel="Retry"
          onDismiss={handleDismiss}
          dismissLabel="Cancel"
          size="lg"
          variant="card"
          className="my-8"
          id="competitors-error"
        />
      );

      // Verify all elements are present
      expect(screen.getByText("Failed to load competitors")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch competitors")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();

      // Verify accessibility
      const section = screen.getByRole("alert");
      expect(section).toHaveAttribute("id", "competitors-error");
      expect(section).toHaveAttribute("aria-live", "assertive");
      expect(section).toHaveClass("my-8");
      expect(section).toHaveClass("card-secondary");
      expect(section).toHaveClass("min-h-[300px]");
    });

    it("should work in React Query error boundary", () => {
      const error = new Error("Network request failed");
      const handleRetry = vi.fn();

      render(
        <ErrorState
          title="Failed to load data"
          error={error}
          onRetry={handleRetry}
        />
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");
      expect(screen.getByText("Failed to load data")).toBeInTheDocument();
      expect(screen.getByText("Network request failed")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should work in try-catch error handling", () => {
      const error = new Error("Upload failed");
      const handleRetry = vi.fn();
      const handleDismiss = vi.fn();

      render(
        <ErrorState
          title="File upload failed"
          error={error}
          onRetry={handleRetry}
          onDismiss={handleDismiss}
        />
      );

      expect(screen.getByText("File upload failed")).toBeInTheDocument();
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
    });

    it("should work for 404 / resource not found scenarios", () => {
      const handleDismiss = vi.fn();

      render(
        <ErrorState
          title="Competitor not found"
          description="This competitor may have been deleted or you don't have access."
          onDismiss={handleDismiss}
          dismissLabel="Back to List"
        />
      );

      expect(screen.getByText("Competitor not found")).toBeInTheDocument();
      expect(screen.getByText("This competitor may have been deleted or you don't have access.")).toBeInTheDocument();
      expect(screen.getByText("Back to List")).toBeInTheDocument();
      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    });

    it("should work for permission errors", () => {
      const handleDismiss = vi.fn();

      render(
        <ErrorState
          title="Access denied"
          description="You don't have permission to perform this action."
          onDismiss={handleDismiss}
          dismissLabel="Go to Dashboard"
        />
      );

      expect(screen.getByText("Access denied")).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to perform this action.")).toBeInTheDocument();
      expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
    });

    it("should work in compact variant for modals", () => {
      const handleDismiss = vi.fn();

      render(
        <ErrorState
          variant="compact"
          title="Failed to delete"
          description="This item cannot be deleted because it's in use."
          onDismiss={handleDismiss}
          dismissLabel="Close"
        />
      );

      const section = screen.getByRole("alert");
      expect(section).toHaveClass("min-h-0");
      expect(screen.getByText("Failed to delete")).toBeInTheDocument();
      expect(screen.getByText("Close")).toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("should merge custom styling with default styles", () => {
      render(
        <ErrorState
          className="bg-red-50 border border-red-200"
          titleClassName="text-red-900"
          descriptionClassName="text-red-700"
          title="Custom styled error"
          description="With custom colors"
        />
      );

      const section = screen.getByRole("alert");
      expect(section).toHaveClass("bg-red-50");
      expect(section).toHaveClass("border");
      expect(section).toHaveClass("border-red-200");

      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("text-red-900");
    });

    it("should support custom icon container className", () => {
      render(
        <ErrorState
          iconContainerClassName="border-2 border-error"
        />
      );

      const section = screen.getByRole("alert");
      const iconContainer = section.querySelector(".border-2");
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass("border-error");
    });
  });
});
