/**
 * @vitest-environment jsdom
 *
 * EmptyState Component Tests
 *
 * Comprehensive tests for the unified EmptyState component covering:
 * - Rendering with different props
 * - Variant behavior (default, compact, inline, card)
 * - Icon rendering and glow effects
 * - Action callbacks (primary and secondary)
 * - Accessibility attributes (ARIA roles, labels, live regions)
 * - Responsive behavior and size variants
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Users, Plus, Search, AlertCircle, CheckCircle } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState Component", () => {
  describe("Basic Rendering", () => {
    it("should render with required props only (title)", () => {
      render(<EmptyState title="No data available" />);

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("should render title and description", () => {
      render(
        <EmptyState
          title="No items found"
          description="Try adjusting your search"
        />
      );

      expect(screen.getByText("No items found")).toBeInTheDocument();
      expect(screen.getByText("Try adjusting your search")).toBeInTheDocument();
    });

    it("should render with icon", () => {
      render(
        <EmptyState
          icon={Users}
          title="No users"
          description="Add your first user"
        />
      );

      // Icon should be rendered (check for SVG element)
      const section = screen.getByRole("region");
      const svg = section.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render without description when not provided", () => {
      const { container } = render(<EmptyState title="Just a title" />);

      expect(screen.getByText("Just a title")).toBeInTheDocument();
      // No description paragraph should exist
      expect(container.querySelector("p")).not.toBeInTheDocument();
    });

    it("should render without icon when not provided", () => {
      const { container } = render(
        <EmptyState title="No icon state" description="This has no icon" />
      );

      // No SVG should be rendered
      const section = screen.getByRole("region");
      const svg = section.querySelector("svg");
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe("Variant Behavior", () => {
    it("should render default variant with centered layout", () => {
      render(
        <EmptyState variant="default" title="Default variant" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("text-center");
    });

    it("should render compact variant without minimum height", () => {
      render(
        <EmptyState variant="compact" title="Compact variant" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("text-center");
      expect(section).toHaveClass("min-h-0");
    });

    it("should render inline variant with horizontal layout", () => {
      render(
        <EmptyState variant="inline" title="Inline variant" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("flex-row");
      expect(section).toHaveClass("items-center");
      expect(section).toHaveClass("text-left");
    });

    it("should render card variant with card styling", () => {
      render(
        <EmptyState variant="card" title="Card variant" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("card-secondary");
      expect(section).toHaveClass("p-8");
    });
  });

  describe("Size Variants", () => {
    it("should render small size with appropriate dimensions", () => {
      render(
        <EmptyState size="sm" title="Small state" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("min-h-[150px]");
    });

    it("should render medium size (default) with appropriate dimensions", () => {
      render(
        <EmptyState size="md" title="Medium state" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("min-h-[200px]");
    });

    it("should render large size with appropriate dimensions", () => {
      render(
        <EmptyState size="lg" title="Large state" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("min-h-[300px]");
    });

    it("should use medium size when size prop is not provided", () => {
      render(<EmptyState title="Default size" />);

      const section = screen.getByRole("region");
      expect(section).toHaveClass("min-h-[200px]");
    });
  });

  describe("Theme Variants", () => {
    it("should render with default theme", () => {
      const { container } = render(
        <EmptyState icon={Users} theme="default" title="Default theme" />
      );

      const iconContainer = container.querySelector(".bg-muted\\/10");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should render with primary theme", () => {
      const { container } = render(
        <EmptyState icon={Users} theme="primary" title="Primary theme" />
      );

      const iconContainer = container.querySelector(".bg-primary\\/10");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should render with success theme", () => {
      const { container } = render(
        <EmptyState icon={CheckCircle} theme="success" title="Success theme" />
      );

      const iconContainer = container.querySelector(".bg-success\\/10");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should render with warning theme", () => {
      const { container } = render(
        <EmptyState icon={AlertCircle} theme="warning" title="Warning theme" />
      );

      const iconContainer = container.querySelector(".bg-warning\\/10");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should render with error theme", () => {
      const { container } = render(
        <EmptyState icon={AlertCircle} theme="error" title="Error theme" />
      );

      const iconContainer = container.querySelector(".bg-error\\/10");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should render with muted theme", () => {
      const { container } = render(
        <EmptyState icon={Users} theme="muted" title="Muted theme" />
      );

      const iconContainer = container.querySelector(".bg-muted\\/5");
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe("Icon Rendering", () => {
    it("should render icon with correct size for small variant", () => {
      const { container } = render(
        <EmptyState icon={Users} size="sm" title="Small icon" />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-6");
      expect(svg).toHaveClass("h-6");
    });

    it("should render icon with correct size for medium variant", () => {
      const { container } = render(
        <EmptyState icon={Users} size="md" title="Medium icon" />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-8");
      expect(svg).toHaveClass("h-8");
    });

    it("should render icon with correct size for large variant", () => {
      const { container } = render(
        <EmptyState icon={Users} size="lg" title="Large icon" />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-10");
      expect(svg).toHaveClass("h-10");
    });

    it("should mark icon container as aria-hidden", () => {
      const { container } = render(
        <EmptyState icon={Users} title="Hidden icon" />
      );

      const iconWrapper = container.querySelector("[aria-hidden='true']");
      expect(iconWrapper).toBeInTheDocument();
    });
  });

  describe("Glow Effect", () => {
    it("should auto-enable glow for primary theme with default variant", () => {
      const { container } = render(
        <EmptyState
          icon={Users}
          variant="default"
          theme="primary"
          title="Auto glow"
        />
      );

      // Check for glow animation style
      const glowElement = container.querySelector("[style*='animation']");
      expect(glowElement).toBeInTheDocument();
    });

    it("should auto-enable glow for success theme with default variant", () => {
      const { container } = render(
        <EmptyState
          icon={CheckCircle}
          variant="default"
          theme="success"
          title="Success glow"
        />
      );

      const glowElement = container.querySelector("[style*='animation']");
      expect(glowElement).toBeInTheDocument();
    });

    it("should auto-enable glow for warning theme with default variant", () => {
      const { container } = render(
        <EmptyState
          icon={AlertCircle}
          variant="default"
          theme="warning"
          title="Warning glow"
        />
      );

      const glowElement = container.querySelector("[style*='animation']");
      expect(glowElement).toBeInTheDocument();
    });

    it("should auto-enable glow for error theme with default variant", () => {
      const { container } = render(
        <EmptyState
          icon={AlertCircle}
          variant="default"
          theme="error"
          title="Error glow"
        />
      );

      const glowElement = container.querySelector("[style*='animation']");
      expect(glowElement).toBeInTheDocument();
    });

    it("should not enable glow for default theme without explicit prop", () => {
      const { container } = render(
        <EmptyState
          icon={Users}
          variant="default"
          theme="default"
          title="No glow"
        />
      );

      const glowElement = container.querySelector("[style*='empty-state-glow-pulse']");
      expect(glowElement).not.toBeInTheDocument();
    });

    it("should force enable glow when withGlow is true", () => {
      const { container } = render(
        <EmptyState
          icon={Users}
          theme="default"
          withGlow={true}
          title="Forced glow"
        />
      );

      const glowElement = container.querySelector("[style*='animation']");
      expect(glowElement).toBeInTheDocument();
    });

    it("should force disable glow when withGlow is false", () => {
      const { container } = render(
        <EmptyState
          icon={Users}
          variant="default"
          theme="primary"
          withGlow={false}
          title="No glow"
        />
      );

      const glowElement = container.querySelector("[style*='empty-state-glow-pulse']");
      expect(glowElement).not.toBeInTheDocument();
    });

    it("should use custom glow color when provided", () => {
      const { container } = render(
        <EmptyState
          icon={Users}
          withGlow={true}
          glowColor="rgba(255, 0, 0, 0.5)"
          title="Custom glow"
        />
      );

      const glowElement = container.querySelector("[style*='rgba(255, 0, 0, 0.5)']");
      expect(glowElement).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should render primary action button", () => {
      const handleClick = vi.fn();

      render(
        <EmptyState
          title="With action"
          primaryAction={{
            label: "Add Item",
            onClick: handleClick,
          }}
        />
      );

      expect(screen.getByText("Add Item")).toBeInTheDocument();
    });

    it("should call primary action onClick when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <EmptyState
          title="Action test"
          primaryAction={{
            label: "Click Me",
            onClick: handleClick,
          }}
        />
      );

      const button = screen.getByText("Click Me");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should render primary action with icon", () => {
      const { container } = render(
        <EmptyState
          title="With icon action"
          primaryAction={{
            label: "Add",
            icon: Plus,
            onClick: vi.fn(),
          }}
        />
      );

      const button = screen.getByText("Add");
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render secondary action button", () => {
      render(
        <EmptyState
          title="With secondary"
          secondaryAction={{
            label: "Learn More",
            onClick: vi.fn(),
          }}
        />
      );

      expect(screen.getByText("Learn More")).toBeInTheDocument();
    });

    it("should call secondary action onClick when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <EmptyState
          title="Secondary action test"
          secondaryAction={{
            label: "Dismiss",
            onClick: handleClick,
          }}
        />
      );

      const button = screen.getByText("Dismiss");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should render both primary and secondary actions", () => {
      render(
        <EmptyState
          title="Both actions"
          primaryAction={{
            label: "Primary",
            onClick: vi.fn(),
          }}
          secondaryAction={{
            label: "Secondary",
            onClick: vi.fn(),
          }}
        />
      );

      expect(screen.getByText("Primary")).toBeInTheDocument();
      expect(screen.getByText("Secondary")).toBeInTheDocument();
    });

    it("should disable primary action when disabled prop is true", () => {
      render(
        <EmptyState
          title="Disabled action"
          primaryAction={{
            label: "Disabled",
            onClick: vi.fn(),
            disabled: true,
          }}
        />
      );

      const button = screen.getByText("Disabled");
      expect(button).toBeDisabled();
    });

    it("should disable primary action when loading prop is true", () => {
      render(
        <EmptyState
          title="Loading action"
          primaryAction={{
            label: "Loading",
            onClick: vi.fn(),
            loading: true,
          }}
        />
      );

      const button = screen.getByText("Loading");
      expect(button).toBeDisabled();
    });

    it("should respect primary action variant", () => {
      render(
        <EmptyState
          title="Variant action"
          primaryAction={{
            label: "Destructive",
            onClick: vi.fn(),
            variant: "destructive",
          }}
        />
      );

      const button = screen.getByText("Destructive");
      // Check that the button has destructive variant class applied
      expect(button).toHaveClass("bg-destructive");
    });

    it("should respect secondary action variant", () => {
      render(
        <EmptyState
          title="Ghost action"
          secondaryAction={{
            label: "Ghost",
            onClick: vi.fn(),
            variant: "ghost",
          }}
        />
      );

      const button = screen.getByText("Ghost");
      // Check that the button has ghost variant class applied
      expect(button).toHaveClass("hover:bg-accent");
    });
  });

  describe("Accessibility Attributes", () => {
    it("should have default role as region", () => {
      render(<EmptyState title="Region role" />);

      const section = screen.getByRole("region");
      expect(section).toBeInTheDocument();
    });

    it("should support status role", () => {
      render(<EmptyState title="Status role" role="status" />);

      const section = screen.getByRole("status");
      expect(section).toBeInTheDocument();
    });

    it("should support alert role", () => {
      render(<EmptyState title="Alert role" role="alert" />);

      const section = screen.getByRole("alert");
      expect(section).toBeInTheDocument();
    });

    it("should have aria-label defaulting to title", () => {
      render(<EmptyState title="Default aria label" />);

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-label", "Default aria label");
    });

    it("should use custom aria-label when provided", () => {
      render(
        <EmptyState
          title="Title"
          ariaLabel="Custom accessibility label"
        />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-label", "Custom accessibility label");
    });

    it("should have default aria-live as polite", () => {
      render(<EmptyState title="Polite aria live" />);

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-live", "polite");
    });

    it("should support assertive aria-live", () => {
      render(
        <EmptyState title="Assertive" ariaLive="assertive" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-live", "assertive");
    });

    it("should support off aria-live", () => {
      render(<EmptyState title="Off" ariaLive="off" />);

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-live", "off");
    });

    it("should have custom id when provided", () => {
      render(<EmptyState title="Custom ID" id="custom-empty-state" />);

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("id", "custom-empty-state");
    });

    it("should have aria-label on action buttons", () => {
      render(
        <EmptyState
          title="Button labels"
          primaryAction={{
            label: "Submit",
            onClick: vi.fn(),
          }}
        />
      );

      const button = screen.getByText("Submit");
      expect(button).toHaveAttribute("aria-label", "Submit");
    });

    it("should use semantic heading for title", () => {
      render(<EmptyState title="Semantic heading" />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Semantic heading");
    });
  });

  describe("Layout and Styling", () => {
    it("should apply custom className to container", () => {
      render(
        <EmptyState title="Custom class" className="custom-test-class" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("custom-test-class");
    });

    it("should apply custom minHeight style", () => {
      render(
        <EmptyState title="Custom height" minHeight="500px" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveStyle({ minHeight: "500px" });
    });

    it("should apply custom maxWidth", () => {
      const { container } = render(
        <EmptyState title="Custom width" maxWidth="max-w-xl" />
      );

      const wrapper = container.querySelector(".max-w-xl");
      expect(wrapper).toBeInTheDocument();
    });

    it("should apply custom icon container className", () => {
      render(
        <EmptyState
          icon={Users}
          title="Custom icon container"
          iconContainerClassName="custom-icon-class"
        />
      );

      const section = screen.getByRole("region");
      const iconContainer = section.querySelector(".custom-icon-class");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should apply custom title className", () => {
      render(
        <EmptyState
          title="Custom title class"
          titleClassName="custom-title-class"
        />
      );

      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("custom-title-class");
    });

    it("should apply custom description className", () => {
      const { container } = render(
        <EmptyState
          title="Title"
          description="Description"
          descriptionClassName="custom-desc-class"
        />
      );

      const description = container.querySelector(".custom-desc-class");
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent("Description");
    });

    it("should apply custom actions container className", () => {
      const { container } = render(
        <EmptyState
          title="Actions"
          primaryAction={{
            label: "Action",
            onClick: vi.fn(),
          }}
          actionsClassName="custom-actions-class"
        />
      );

      const actionsContainer = container.querySelector(".custom-actions-class");
      expect(actionsContainer).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should have responsive flex layout for actions", () => {
      const { container } = render(
        <EmptyState
          title="Responsive actions"
          primaryAction={{
            label: "Primary",
            onClick: vi.fn(),
          }}
          secondaryAction={{
            label: "Secondary",
            onClick: vi.fn(),
          }}
        />
      );

      const actionsContainer = container.querySelector(".flex.flex-col.sm\\:flex-row");
      expect(actionsContainer).toBeInTheDocument();
    });

    it("should render inline variant with flex-row layout", () => {
      render(
        <EmptyState variant="inline" title="Inline responsive" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("flex-row");
    });

    it("should use size-appropriate spacing", () => {
      render(
        <EmptyState size="sm" title="Small spacing" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("space-y-2");
    });

    it("should use medium spacing for default size", () => {
      render(<EmptyState title="Default spacing" />);

      const section = screen.getByRole("region");
      expect(section).toHaveClass("space-y-4");
    });

    it("should use large spacing for large size", () => {
      render(
        <EmptyState size="lg" title="Large spacing" />
      );

      const section = screen.getByRole("region");
      expect(section).toHaveClass("space-y-6");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string title gracefully", () => {
      render(<EmptyState title="" />);

      const heading = screen.getByRole("heading");
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("");
    });

    it("should handle very long title text", () => {
      const longTitle = "This is a very long title that might wrap to multiple lines and we need to ensure it renders correctly without breaking the layout";

      render(<EmptyState title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle very long description text", () => {
      const longDescription = "This is an extremely long description that contains a lot of text and might wrap across multiple lines. We need to verify that the component handles this gracefully and maintains proper spacing and layout even with extensive content.";

      render(
        <EmptyState title="Title" description={longDescription} />
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it("should render without actions", () => {
      const { container } = render(
        <EmptyState title="No actions" />
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBe(0);
    });

    it("should handle multiple rapid clicks on action button", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <EmptyState
          title="Rapid clicks"
          primaryAction={{
            label: "Click",
            onClick: handleClick,
          }}
        />
      );

      const button = screen.getByText("Click");
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("should maintain layout with only secondary action", () => {
      render(
        <EmptyState
          title="Only secondary"
          secondaryAction={{
            label: "Secondary Only",
            onClick: vi.fn(),
          }}
        />
      );

      expect(screen.getByText("Secondary Only")).toBeInTheDocument();
    });
  });

  describe("Integration Scenarios", () => {
    it("should render complete empty state with all features", () => {
      const handlePrimary = vi.fn();
      const handleSecondary = vi.fn();

      render(
        <EmptyState
          icon={Search}
          variant="card"
          size="lg"
          theme="primary"
          title="No search results"
          description="Try adjusting your filters or search terms"
          primaryAction={{
            label: "Clear Filters",
            icon: Plus,
            onClick: handlePrimary,
            variant: "default",
          }}
          secondaryAction={{
            label: "Browse All",
            onClick: handleSecondary,
            variant: "outline",
          }}
          withGlow={true}
          role="status"
          ariaLive="polite"
          className="my-8"
          id="search-empty"
        />
      );

      // Verify all elements are present
      expect(screen.getByText("No search results")).toBeInTheDocument();
      expect(screen.getByText("Try adjusting your filters or search terms")).toBeInTheDocument();
      expect(screen.getByText("Clear Filters")).toBeInTheDocument();
      expect(screen.getByText("Browse All")).toBeInTheDocument();

      // Verify accessibility
      const section = screen.getByRole("status");
      expect(section).toHaveAttribute("id", "search-empty");
      expect(section).toHaveAttribute("aria-live", "polite");
      expect(section).toHaveClass("my-8");
      expect(section).toHaveClass("card-secondary");
      expect(section).toHaveClass("min-h-[300px]");
    });

    it("should work in error state context", () => {
      render(
        <EmptyState
          icon={AlertCircle}
          theme="error"
          title="Failed to load data"
          description="An error occurred while fetching"
          role="alert"
          ariaLive="assertive"
          primaryAction={{
            label: "Retry",
            onClick: vi.fn(),
          }}
        />
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");
      expect(screen.getByText("Failed to load data")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    it("should work in success state context", () => {
      render(
        <EmptyState
          icon={CheckCircle}
          theme="success"
          title="All done!"
          description="You've completed all tasks"
          variant="compact"
          size="sm"
        />
      );

      expect(screen.getByText("All done!")).toBeInTheDocument();
      expect(screen.getByText("You've completed all tasks")).toBeInTheDocument();
    });
  });
});
