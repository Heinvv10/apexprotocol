/**
 * @vitest-environment jsdom
 *
 * LoadingState Component Tests
 *
 * Comprehensive tests for the LoadingState component covering:
 * - Basic rendering with different props
 * - Animation behavior (spinner and pulse)
 * - Message display (title and description)
 * - Size variants
 * - Inheritance from EmptyState
 * - Accessibility features
 * - Custom styling
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { LoadingState } from "@/components/ui/loading-state";

describe("LoadingState Component", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      render(<LoadingState />);

      expect(screen.getByText("Loading")).toBeInTheDocument();
    });

    it("should render with custom title", () => {
      render(<LoadingState title="Loading competitors..." />);

      expect(screen.getByText("Loading competitors...")).toBeInTheDocument();
    });

    it("should render with title and description", () => {
      render(
        <LoadingState
          title="Loading data"
          description="This may take a few moments"
        />
      );

      expect(screen.getByText("Loading data")).toBeInTheDocument();
      expect(screen.getByText("This may take a few moments")).toBeInTheDocument();
    });

    it("should render without description when not provided", () => {
      const { container } = render(<LoadingState title="Loading..." />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      // Description should not be rendered
      const section = screen.getByRole("status");
      const paragraphs = section.querySelectorAll("p");
      expect(paragraphs.length).toBe(0);
    });

    it("should render Loader2 icon", () => {
      const { container } = render(<LoadingState />);

      const section = screen.getByRole("status");
      const svg = section.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Animation Behavior", () => {
    it("should have spinning animation by default", () => {
      const { container } = render(<LoadingState />);

      const section = screen.getByRole("status");
      const iconContainer = section.querySelector(".animate-pulse");
      expect(iconContainer).toBeInTheDocument();

      const spinner = section.querySelector("[class*='animate-spin']");
      expect(spinner).toBeInTheDocument();
    });

    it("should apply animate-pulse to icon container", () => {
      const { container } = render(<LoadingState animated={true} />);

      const section = screen.getByRole("status");
      const iconContainer = section.querySelector(".animate-pulse");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should apply animate-spin to icon", () => {
      const { container } = render(<LoadingState animated={true} />);

      const section = screen.getByRole("status");
      const spinner = section.querySelector("[class*='animate-spin']");
      expect(spinner).toBeInTheDocument();
    });

    it("should disable animation when animated is false", () => {
      const { container } = render(<LoadingState animated={false} />);

      const section = screen.getByRole("status");
      const iconContainer = section.querySelector(".animate-pulse");
      expect(iconContainer).not.toBeInTheDocument();

      const spinner = section.querySelector("[class*='animate-spin']");
      expect(spinner).not.toBeInTheDocument();
    });

    it("should have both pulse and spin animations when animated is true", () => {
      const { container } = render(<LoadingState animated={true} />);

      const section = screen.getByRole("status");

      // Check for pulse animation on container
      const pulsingElement = section.querySelector(".animate-pulse");
      expect(pulsingElement).toBeInTheDocument();

      // Check for spin animation on SVG
      const spinningElement = section.querySelector("[class*='animate-spin']");
      expect(spinningElement).toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should render small size correctly", () => {
      render(<LoadingState size="sm" title="Small loading" />);

      const section = screen.getByRole("status");
      expect(section).toHaveClass("min-h-[150px]");
      expect(section).toHaveClass("space-y-2");
    });

    it("should render medium size correctly (default)", () => {
      render(<LoadingState title="Medium loading" />);

      const section = screen.getByRole("status");
      expect(section).toHaveClass("min-h-[200px]");
      expect(section).toHaveClass("space-y-4");
    });

    it("should render large size correctly", () => {
      render(<LoadingState size="lg" title="Large loading" />);

      const section = screen.getByRole("status");
      expect(section).toHaveClass("min-h-[300px]");
      expect(section).toHaveClass("space-y-6");
    });

    it("should render icon at correct size for small variant", () => {
      const { container } = render(<LoadingState size="sm" />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-6");
      expect(svg).toHaveClass("h-6");
    });

    it("should render icon at correct size for medium variant", () => {
      const { container } = render(<LoadingState size="md" />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-8");
      expect(svg).toHaveClass("h-8");
    });

    it("should render icon at correct size for large variant", () => {
      const { container } = render(<LoadingState size="lg" />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-10");
      expect(svg).toHaveClass("h-10");
    });
  });

  describe("Theme and Styling", () => {
    it("should use primary theme by default", () => {
      const { container } = render(<LoadingState />);

      const iconContainer = container.querySelector(".bg-primary\\/10");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should have primary color on icon", () => {
      const { container } = render(<LoadingState />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("text-primary");
    });

    it("should not have glow effect", () => {
      const { container } = render(<LoadingState />);

      const glowElement = container.querySelector("[style*='empty-state-glow-pulse']");
      expect(glowElement).not.toBeInTheDocument();
    });

    it("should apply custom className to container", () => {
      render(<LoadingState className="custom-loading-class" />);

      const section = screen.getByRole("status");
      expect(section).toHaveClass("custom-loading-class");
    });

    it("should apply custom icon container className", () => {
      render(
        <LoadingState iconContainerClassName="custom-icon-class" />
      );

      const section = screen.getByRole("status");
      const iconContainer = section.querySelector(".custom-icon-class");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should combine custom icon container className with animation classes", () => {
      render(
        <LoadingState
          animated={true}
          iconContainerClassName="custom-icon-class"
        />
      );

      const section = screen.getByRole("status");
      const iconContainer = section.querySelector(".custom-icon-class");
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass("animate-pulse");
    });
  });

  describe("Accessibility Features", () => {
    it("should have role='status'", () => {
      render(<LoadingState />);

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
    });

    it("should have aria-live='polite'", () => {
      render(<LoadingState />);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-live", "polite");
    });

    it("should have aria-label with 'Loading: ' prefix", () => {
      render(<LoadingState title="Loading competitors" />);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-label", "Loading: Loading competitors");
    });

    it("should have default aria-label when using default title", () => {
      render(<LoadingState />);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-label", "Loading: Loading");
    });

    it("should mark icon container as aria-hidden", () => {
      const { container } = render(<LoadingState />);

      const iconWrapper = container.querySelector("[aria-hidden='true']");
      expect(iconWrapper).toBeInTheDocument();
    });

    it("should use semantic heading for title", () => {
      render(<LoadingState title="Loading data" />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Loading data");
    });

    it("should have proper semantic HTML structure", () => {
      render(<LoadingState title="Loading" />);

      const status = screen.getByRole("status");
      expect(status.tagName).toBe("SECTION");
    });
  });

  describe("Inheritance from EmptyState", () => {
    it("should support variant prop from EmptyState", () => {
      render(<LoadingState variant="compact" title="Compact loading" />);

      const section = screen.getByRole("status");
      expect(section).toHaveClass("min-h-0");
    });

    it("should support inline variant", () => {
      render(<LoadingState variant="inline" title="Inline loading" />);

      const section = screen.getByRole("status");
      expect(section).toHaveClass("flex-row");
      expect(section).toHaveClass("text-left");
    });

    it("should support card variant", () => {
      render(<LoadingState variant="card" title="Card loading" />);

      const section = screen.getByRole("status");
      expect(section).toHaveClass("card-secondary");
      expect(section).toHaveClass("p-8");
    });

    it("should support maxWidth prop from EmptyState", () => {
      const { container } = render(
        <LoadingState maxWidth="max-w-sm" title="Narrow loading" />
      );

      const wrapper = container.querySelector(".max-w-sm");
      expect(wrapper).toBeInTheDocument();
    });

    it("should support custom minHeight from EmptyState", () => {
      render(<LoadingState minHeight="400px" title="Tall loading" />);

      const section = screen.getByRole("status");
      expect(section).toHaveStyle({ minHeight: "400px" });
    });

    it("should support titleClassName from EmptyState", () => {
      render(
        <LoadingState title="Custom title" titleClassName="custom-title" />
      );

      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("custom-title");
    });

    it("should support descriptionClassName from EmptyState", () => {
      const { container } = render(
        <LoadingState
          title="Title"
          description="Description"
          descriptionClassName="custom-desc"
        />
      );

      const description = container.querySelector(".custom-desc");
      expect(description).toBeInTheDocument();
    });

    it("should support id prop from EmptyState", () => {
      render(<LoadingState id="custom-loading-id" />);

      const section = screen.getByRole("status");
      expect(section).toHaveAttribute("id", "custom-loading-id");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string title", () => {
      render(<LoadingState title="" />);

      const heading = screen.getByRole("heading");
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("");
    });

    it("should handle very long title text", () => {
      const longTitle = "Loading a very large dataset that might take several minutes to complete and requires significant processing time";

      render(<LoadingState title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle very long description text", () => {
      const longDescription = "This operation is processing a significant amount of data and may take several minutes to complete. Please do not close this window or navigate away while the operation is in progress. Your data is being securely processed and will be available shortly.";

      render(<LoadingState title="Loading" description={longDescription} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it("should work with all size variants and variants combinations", () => {
      const { rerender } = render(
        <LoadingState size="sm" variant="compact" title="Small compact" />
      );

      let section = screen.getByRole("status");
      expect(section).toHaveClass("min-h-0");
      expect(section).toHaveClass("space-y-2");

      rerender(
        <LoadingState size="lg" variant="card" title="Large card" />
      );

      section = screen.getByRole("status");
      expect(section).toHaveClass("card-secondary");
      expect(section).toHaveClass("space-y-6");
    });
  });

  describe("Integration Scenarios", () => {
    it("should render complete loading state with all features", () => {
      render(
        <LoadingState
          title="Loading competitors"
          description="Fetching the latest data from the server..."
          size="lg"
          variant="card"
          animated={true}
          className="my-8"
          id="competitors-loading"
        />
      );

      // Verify all elements are present
      expect(screen.getByText("Loading competitors")).toBeInTheDocument();
      expect(screen.getByText("Fetching the latest data from the server...")).toBeInTheDocument();

      // Verify accessibility
      const section = screen.getByRole("status");
      expect(section).toHaveAttribute("id", "competitors-loading");
      expect(section).toHaveAttribute("aria-live", "polite");
      expect(section).toHaveClass("my-8");
      expect(section).toHaveClass("card-secondary");
      expect(section).toHaveClass("min-h-[300px]");

      // Verify animation
      const iconContainer = section.querySelector(".animate-pulse");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should work in React Query loading context", () => {
      render(
        <LoadingState
          title="Loading recommendations"
          description="Analyzing your data..."
          size="md"
        />
      );

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-live", "polite");
      expect(screen.getByText("Loading recommendations")).toBeInTheDocument();
      expect(screen.getByText("Analyzing your data...")).toBeInTheDocument();
    });

    it("should work as Suspense fallback", () => {
      render(
        <LoadingState
          title="Loading component"
          size="lg"
          variant="default"
        />
      );

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      expect(screen.getByText("Loading component")).toBeInTheDocument();
    });

    it("should work in inline variant for subtle loading", () => {
      render(
        <LoadingState
          variant="inline"
          size="sm"
          title="Saving..."
          animated={true}
        />
      );

      const section = screen.getByRole("status");
      expect(section).toHaveClass("flex-row");
      expect(section).toHaveClass("items-center");
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should work in compact variant for cards", () => {
      render(
        <LoadingState
          variant="compact"
          size="sm"
          title="Loading data..."
        />
      );

      const section = screen.getByRole("status");
      expect(section).toHaveClass("min-h-0");
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("should merge custom styling with default styles", () => {
      render(
        <LoadingState
          className="bg-blue-50 border border-blue-200"
          iconContainerClassName="scale-125"
          titleClassName="text-blue-900"
          descriptionClassName="text-blue-700"
          title="Custom styled"
          description="With custom colors"
        />
      );

      const section = screen.getByRole("status");
      expect(section).toHaveClass("bg-blue-50");
      expect(section).toHaveClass("border");
      expect(section).toHaveClass("border-blue-200");

      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("text-blue-900");

      const iconContainer = section.querySelector(".scale-125");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should preserve animation classes when adding custom icon container className", () => {
      const { container } = render(
        <LoadingState
          animated={true}
          iconContainerClassName="border-2 border-primary"
        />
      );

      const section = screen.getByRole("status");
      const iconContainer = section.querySelector(".border-2");
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass("animate-pulse");
      expect(iconContainer).toHaveClass("border-primary");
    });
  });
});
