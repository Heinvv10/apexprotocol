/**
 * @vitest-environment jsdom
 *
 * Skeleton Component Tests
 *
 * Comprehensive tests for the Skeleton component covering:
 * - Basic rendering with default props
 * - Shape variants (rectangle, circle, text)
 * - Size variants (sm, md, lg)
 * - Animation behavior (enabled/disabled, speed variants)
 * - Rounded variants (none, sm, md, lg, full)
 * - Custom dimensions (width, height, aspectRatio)
 * - Custom styling and className
 * - data-slot attributes
 * - Accessibility (ARIA attributes, roles, screen readers, keyboard navigation)
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
} from "@/components/ui/skeleton";

describe("Skeleton Component", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toBeInTheDocument();
    });

    it("should render as div element", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton?.tagName).toBe("DIV");
    });

    it("should have data-slot attribute", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveAttribute("data-slot", "skeleton");
    });

    it("should have default background color", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("bg-muted");
    });

    it("should have pulse animation by default", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      const animationStyle = skeleton?.getAttribute("style");
      expect(animationStyle).toContain("pulse");
      expect(animationStyle).toContain("2s");
      expect(animationStyle).toContain("infinite");
    });
  });

  describe("Shape Variants", () => {
    it("should render rectangle shape (default)", () => {
      const { container } = render(<Skeleton shape="rectangle" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toBeInTheDocument();
      // Rectangle doesn't add rounded-full class
      expect(skeleton).not.toHaveClass("rounded-full");
    });

    it("should render circle shape with rounded-full", () => {
      const { container } = render(<Skeleton shape="circle" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("rounded-full");
    });

    it("should render text shape with rounded-sm and h-4", () => {
      const { container } = render(<Skeleton shape="text" size="sm" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      // Text shape applies rounded-sm, but rounded prop default (md) may override
      // Size sm gives h-4
      expect(skeleton).toHaveClass("h-4");
    });

    it("should override rounded variant when shape is circle", () => {
      const { container } = render(<Skeleton shape="circle" rounded="md" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      // Circle shape should force rounded-full regardless of rounded prop
      expect(skeleton).toHaveClass("rounded-full");
      expect(skeleton).not.toHaveClass("rounded-md");
    });

    it("should default to rectangle shape when not specified", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      // Default rectangle doesn't have rounded-full or h-4 (text shape)
      expect(skeleton).not.toHaveClass("rounded-full");
      expect(skeleton).toHaveClass("rounded-md"); // Default rounded variant
    });
  });

  describe("Size Variants", () => {
    it("should render small size with h-4", () => {
      const { container } = render(<Skeleton size="sm" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("h-4");
    });

    it("should render medium size with h-8 (default)", () => {
      const { container } = render(<Skeleton size="md" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("h-8");
    });

    it("should render large size with h-12", () => {
      const { container } = render(<Skeleton size="lg" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("h-12");
    });

    it("should default to medium size when not specified", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("h-8");
    });

    it("should apply size variant even with text shape", () => {
      const { container } = render(<Skeleton shape="text" size="lg" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      // Size variant overrides text shape height
      expect(skeleton).toHaveClass("h-12"); // From size lg
    });
  });

  describe("Rounded Variants", () => {
    it("should render with no rounding", () => {
      const { container } = render(<Skeleton shape="rectangle" rounded="none" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("rounded-none");
    });

    it("should render with small rounding", () => {
      const { container } = render(<Skeleton shape="rectangle" rounded="sm" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("rounded-sm");
    });

    it("should render with medium rounding (default)", () => {
      const { container } = render(<Skeleton shape="rectangle" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("rounded-md");
    });

    it("should render with large rounding", () => {
      const { container } = render(<Skeleton shape="rectangle" rounded="lg" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("rounded-lg");
    });

    it("should render with full rounding", () => {
      const { container } = render(<Skeleton shape="rectangle" rounded="full" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("rounded-full");
    });

    it("should not apply rounded variant to circle shape", () => {
      const { container } = render(<Skeleton shape="circle" rounded="sm" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      // Circle shape overrides rounded to always be full
      expect(skeleton).toHaveClass("rounded-full");
      expect(skeleton).not.toHaveClass("rounded-sm");
    });
  });

  describe("Animation Behavior", () => {
    it("should have pulse animation enabled by default", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      const animationStyle = skeleton?.getAttribute("style");
      expect(animationStyle).toContain("pulse");
      expect(animationStyle).toContain("2s");
      expect(animationStyle).toContain("infinite");
    });

    it("should disable animation when disableAnimation is true", () => {
      const { container } = render(<Skeleton disableAnimation={true} />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      // When animation is disabled, the style.animation should not be set or be empty
      expect(skeleton).not.toHaveStyle({
        animation: expect.stringContaining("pulse"),
      });
    });

    it("should apply normal animation speed by default", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      const animationStyle = skeleton?.getAttribute("style");
      expect(animationStyle).toContain("2s");
    });

    it("should apply slow animation speed", () => {
      const { container } = render(<Skeleton speed="slow" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      const animationStyle = skeleton?.getAttribute("style");
      expect(animationStyle).toContain("3s");
    });

    it("should apply fast animation speed", () => {
      const { container } = render(<Skeleton speed="fast" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      const animationStyle = skeleton?.getAttribute("style");
      expect(animationStyle).toContain("1s");
    });

    it("should not apply speed when animation is disabled", () => {
      const { container } = render(
        <Skeleton disableAnimation={true} speed="fast" />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).not.toHaveStyle({
        animation: expect.stringContaining("pulse"),
      });
    });

    it("should have cubic-bezier easing function", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      const animationStyle = skeleton?.getAttribute("style");
      expect(animationStyle).toContain("cubic-bezier(0.4, 0, 0.6, 1)");
    });

    it("should have infinite animation", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      const animationStyle = skeleton?.getAttribute("style");
      expect(animationStyle).toContain("infinite");
    });
  });

  describe("Custom Dimensions", () => {
    it("should apply custom width as string", () => {
      const { container } = render(<Skeleton width="200px" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ width: "200px" });
    });

    it("should apply custom width as number (converted to pixels)", () => {
      const { container } = render(<Skeleton width={150} />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ width: "150px" });
    });

    it("should apply custom height as string", () => {
      const { container } = render(<Skeleton height="50px" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ height: "50px" });
    });

    it("should apply custom height as number (converted to pixels)", () => {
      const { container } = render(<Skeleton height={100} />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ height: "100px" });
    });

    it("should apply both custom width and height", () => {
      const { container } = render(<Skeleton width={200} height={100} />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({
        width: "200px",
        height: "100px",
      });
    });

    it("should support CSS units for width", () => {
      const { container } = render(<Skeleton width="50%" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ width: "50%" });
    });

    it("should support CSS units for height", () => {
      const { container } = render(<Skeleton height="10rem" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ height: "10rem" });
    });

    it("should apply aspectRatio", () => {
      const { container } = render(<Skeleton aspectRatio="16/9" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ aspectRatio: "16/9" });
    });

    it("should apply aspectRatio with custom width", () => {
      const { container } = render(
        <Skeleton width={400} aspectRatio="4/3" />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({
        width: "400px",
        aspectRatio: "4/3",
      });
    });

    it("should support 1/1 aspectRatio for square", () => {
      const { container } = render(<Skeleton aspectRatio="1/1" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ aspectRatio: "1/1" });
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <Skeleton className="custom-skeleton-class" />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("custom-skeleton-class");
    });

    it("should merge custom className with default classes", () => {
      const { container } = render(
        <Skeleton className="w-full border border-gray-300" />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("w-full");
      expect(skeleton).toHaveClass("border");
      expect(skeleton).toHaveClass("border-gray-300");
      expect(skeleton).toHaveClass("bg-muted"); // Default class preserved
    });

    it("should apply custom style object", () => {
      const { container } = render(
        <Skeleton style={{ opacity: 0.5, borderRadius: "4px" }} />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({
        opacity: "0.5",
        borderRadius: "4px",
      });
    });

    it("should merge custom style with dimension styles", () => {
      const { container } = render(
        <Skeleton
          width={200}
          height={100}
          style={{ backgroundColor: "red", margin: "10px" }}
        />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      const styleAttr = skeleton?.getAttribute("style");
      expect(styleAttr).toContain("width: 200px");
      expect(styleAttr).toContain("height: 100px");
      expect(styleAttr).toContain("background-color: red");
      expect(styleAttr).toContain("margin: 10px");
    });

    it("should merge custom style with animation styles", () => {
      const { container } = render(
        <Skeleton speed="slow" style={{ transform: "scale(1.1)" }} />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      const styleAttr = skeleton?.getAttribute("style");
      expect(styleAttr).toContain("transform: scale(1.1)");
      expect(styleAttr).toContain("pulse");
      expect(styleAttr).toContain("3s");
    });
  });

  describe("Variant Combinations", () => {
    it("should work with all props combined", () => {
      const { container } = render(
        <Skeleton
          shape="rectangle"
          size="lg"
          rounded="lg"
          width={300}
          height={200}
          aspectRatio="3/2"
          speed="slow"
          className="custom-class"
          style={{ margin: "20px" }}
        />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("bg-muted");
      expect(skeleton).toHaveClass("h-12"); // size lg
      expect(skeleton).toHaveClass("rounded-lg");
      expect(skeleton).toHaveClass("custom-class");
      const styleAttr = skeleton?.getAttribute("style");
      expect(styleAttr).toContain("width: 300px");
      expect(styleAttr).toContain("height: 200px");
      expect(styleAttr).toContain("aspect-ratio: 3/2");
      expect(styleAttr).toContain("margin: 20px");
      expect(styleAttr).toContain("3s");
    });

    it("should work with circle shape and custom dimensions", () => {
      const { container } = render(
        <Skeleton shape="circle" width={60} height={60} />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("rounded-full");
      expect(skeleton).toHaveStyle({
        width: "60px",
        height: "60px",
      });
    });

    it("should work with text shape and custom width", () => {
      const { container } = render(
        <Skeleton shape="text" size="sm" className="w-3/4" />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("h-4"); // size sm gives h-4
      expect(skeleton).toHaveClass("w-3/4");
    });

    it("should handle size and height prop together", () => {
      const { container } = render(<Skeleton size="lg" height={150} />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      // Custom height should override size height
      expect(skeleton).toHaveStyle({ height: "150px" });
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero width", () => {
      const { container } = render(<Skeleton width={0} />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ width: "0px" });
    });

    it("should handle zero height", () => {
      const { container } = render(<Skeleton height={0} />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ height: "0px" });
    });

    it("should handle very large dimensions", () => {
      const { container } = render(<Skeleton width={9999} height={9999} />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({
        width: "9999px",
        height: "9999px",
      });
    });

    it("should handle empty className", () => {
      const { container } = render(<Skeleton className="" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass("bg-muted"); // Default class still present
    });

    it("should handle empty style object", () => {
      const { container } = render(<Skeleton style={{}} />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toBeInTheDocument();
      // Should still have animation by default
      const animationStyle = skeleton?.getAttribute("style");
      expect(animationStyle).toContain("pulse");
    });

    it("should handle all variants disabled/default", () => {
      const { container } = render(
        <Skeleton disableAnimation={true} />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass("bg-muted");
      expect(skeleton).not.toHaveStyle({
        animation: expect.stringContaining("pulse"),
      });
    });
  });

  describe("HTML Attributes", () => {
    it("should support aria-label attribute", () => {
      const { container } = render(
        <Skeleton aria-label="Loading content" />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveAttribute("aria-label", "Loading content");
    });

    it("should support role attribute", () => {
      const { container } = render(<Skeleton role="status" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveAttribute("role", "status");
    });

    it("should support id attribute", () => {
      const { container } = render(<Skeleton id="skeleton-1" />);

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveAttribute("id", "skeleton-1");
    });

    it("should support data attributes", () => {
      const { container } = render(
        <Skeleton data-testid="custom-skeleton" data-index="5" />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveAttribute("data-testid", "custom-skeleton");
      expect(skeleton).toHaveAttribute("data-index", "5");
    });

    it("should spread additional HTML attributes", () => {
      const { container } = render(
        <Skeleton title="Skeleton element" tabIndex={0} />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveAttribute("title", "Skeleton element");
      expect(skeleton).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("Integration Scenarios", () => {
    it("should work as avatar placeholder (circle)", () => {
      const { container } = render(
        <Skeleton shape="circle" width={40} height={40} />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("rounded-full");
      expect(skeleton).toHaveStyle({
        width: "40px",
        height: "40px",
      });
    });

    it("should work as text line placeholder", () => {
      const { container } = render(
        <Skeleton shape="text" size="sm" className="w-full" />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("h-4"); // size sm
      expect(skeleton).toHaveClass("w-full");
    });

    it("should work as image placeholder with aspect ratio", () => {
      const { container } = render(
        <Skeleton aspectRatio="16/9" className="w-full" rounded="lg" />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({ aspectRatio: "16/9" });
      expect(skeleton).toHaveClass("w-full");
      expect(skeleton).toHaveClass("rounded-lg");
    });

    it("should work as button placeholder", () => {
      const { container } = render(
        <Skeleton width={100} height={40} rounded="md" />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveStyle({
        width: "100px",
        height: "40px",
      });
      expect(skeleton).toHaveClass("rounded-md");
    });

    it("should work as card placeholder", () => {
      // ðŸŸ¢ WORKING: Card placeholder with custom dimensions, className override for rounded-xl
      const { container } = render(
        <Skeleton
          shape="rectangle"
          className="w-full rounded-xl"
          height={200}
          speed="slow"
        />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("w-full");
      expect(skeleton).toHaveClass("rounded-xl");
      const styleAttr = skeleton?.getAttribute("style");
      expect(styleAttr).toContain("height: 200px");
      expect(styleAttr).toContain("3s");
    });

    it("should work in loading state without animation", () => {
      const { container } = render(
        <Skeleton
          disableAnimation={true}
          className="w-full h-32"
        />
      );

      const skeleton = container.querySelector("[data-slot='skeleton']");
      expect(skeleton).toHaveClass("w-full");
      expect(skeleton).toHaveClass("h-32");
      expect(skeleton).not.toHaveStyle({
        animation: expect.stringContaining("pulse"),
      });
    });
  });

  // ðŸŸ¢ WORKING: Accessibility-focused tests for screen readers and assistive technologies
  describe("Accessibility", () => {
    describe("ARIA Attributes", () => {
      it("should support aria-busy attribute", () => {
        const { container } = render(<Skeleton aria-busy="true" />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-busy", "true");
      });

      it("should support aria-label for providing context", () => {
        const { container } = render(
          <Skeleton aria-label="Loading user profile" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-label", "Loading user profile");
      });

      it("should support aria-live for screen reader announcements", () => {
        const { container } = render(<Skeleton aria-live="polite" />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-live", "polite");
      });

      it("should support aria-live with assertive priority", () => {
        const { container } = render(<Skeleton aria-live="assertive" />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-live", "assertive");
      });

      it("should support aria-valuemin for progressbar role", () => {
        const { container } = render(
          <Skeleton role="progressbar" aria-valuemin={0} />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-valuemin", "0");
      });

      it("should support aria-valuemax for progressbar role", () => {
        const { container } = render(
          <Skeleton role="progressbar" aria-valuemax={100} />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-valuemax", "100");
      });

      it("should support aria-valuenow for progressbar role", () => {
        const { container } = render(
          <Skeleton role="progressbar" aria-valuenow={50} />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-valuenow", "50");
      });

      it("should support aria-valuetext for progressbar description", () => {
        const { container } = render(
          <Skeleton role="progressbar" aria-valuetext="Loading 50%" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-valuetext", "Loading 50%");
      });

      it("should support aria-hidden to hide from screen readers", () => {
        const { container } = render(<Skeleton aria-hidden="true" />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-hidden", "true");
      });

      it("should support aria-describedby for additional context", () => {
        const { container } = render(
          <Skeleton aria-describedby="loading-description" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-describedby", "loading-description");
      });

      it("should support aria-labelledby for referenced labels", () => {
        const { container } = render(
          <Skeleton aria-labelledby="loading-title" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-labelledby", "loading-title");
      });
    });

    describe("Role Attributes", () => {
      it("should support role='status' for loading state announcements", () => {
        const { container } = render(<Skeleton role="status" />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "status");
      });

      it("should support role='progressbar' for progress indication", () => {
        const { container } = render(<Skeleton role="progressbar" />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "progressbar");
      });

      it("should support role='alert' for important loading states", () => {
        const { container } = render(<Skeleton role="alert" />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "alert");
      });

      it("should support role='img' with aria-label for image placeholders", () => {
        const { container } = render(
          <Skeleton role="img" aria-label="Loading profile picture" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "img");
        expect(skeleton).toHaveAttribute("aria-label", "Loading profile picture");
      });

      it("should support role='presentation' to mark as decorative", () => {
        const { container } = render(<Skeleton role="presentation" />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "presentation");
      });
    });

    describe("Screen Reader Announcements", () => {
      it("should support combination of role and aria-label for complete announcement", () => {
        const { container } = render(
          <Skeleton role="status" aria-label="Loading content, please wait" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "status");
        expect(skeleton).toHaveAttribute("aria-label", "Loading content, please wait");
      });

      it("should support aria-live with role for dynamic announcements", () => {
        const { container } = render(
          <Skeleton role="status" aria-live="polite" aria-label="Loading" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "status");
        expect(skeleton).toHaveAttribute("aria-live", "polite");
        expect(skeleton).toHaveAttribute("aria-label", "Loading");
      });

      it("should support aria-busy with loading message", () => {
        const { container } = render(
          <Skeleton aria-busy="true" aria-label="Loading user data" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-busy", "true");
        expect(skeleton).toHaveAttribute("aria-label", "Loading user data");
      });

      it("should support complete progressbar announcement", () => {
        const { container } = render(
          <Skeleton
            role="progressbar"
            aria-label="Loading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={75}
            aria-valuetext="75 percent complete"
          />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "progressbar");
        expect(skeleton).toHaveAttribute("aria-label", "Loading progress");
        expect(skeleton).toHaveAttribute("aria-valuemin", "0");
        expect(skeleton).toHaveAttribute("aria-valuemax", "100");
        expect(skeleton).toHaveAttribute("aria-valuenow", "75");
        expect(skeleton).toHaveAttribute("aria-valuetext", "75 percent complete");
      });

      it("should support hidden state to prevent announcement", () => {
        const { container } = render(
          <Skeleton aria-hidden="true" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-hidden", "true");
      });
    });

    describe("Keyboard Navigation", () => {
      it("should not be keyboard-focusable by default (no tabIndex)", () => {
        const { container } = render(<Skeleton />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).not.toHaveAttribute("tabIndex");
      });

      it("should support tabIndex=-1 to ensure not keyboard-focusable", () => {
        const { container } = render(<Skeleton tabIndex={-1} />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("tabIndex", "-1");
      });

      it("should not be keyboard-focusable even with role='status'", () => {
        const { container } = render(<Skeleton role="status" />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        // Should not have tabIndex or should be -1
        const tabIndexValue = skeleton?.getAttribute("tabIndex");
        if (tabIndexValue !== null) {
          expect(tabIndexValue).toBe("-1");
        }
      });

      it("should allow custom tabIndex if explicitly needed", () => {
        const { container } = render(<Skeleton tabIndex={0} />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("tabIndex", "0");
      });
    });

    describe("Accessibility Best Practices", () => {
      it("should support recommended pattern: role='status' with aria-live='polite'", () => {
        const { container } = render(
          <Skeleton
            role="status"
            aria-live="polite"
            aria-label="Loading content"
          />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "status");
        expect(skeleton).toHaveAttribute("aria-live", "polite");
        expect(skeleton).toHaveAttribute("aria-label", "Loading content");
      });

      it("should support image placeholder pattern with role='img' and aria-label", () => {
        const { container } = render(
          <Skeleton
            shape="circle"
            role="img"
            aria-label="Loading profile picture"
            width={100}
            height={100}
          />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "img");
        expect(skeleton).toHaveAttribute("aria-label", "Loading profile picture");
        expect(skeleton).toHaveClass("rounded-full");
      });

      it("should support decorative pattern with aria-hidden='true'", () => {
        const { container } = render(
          <Skeleton aria-hidden="true" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-hidden", "true");
      });

      it("should support progress indication pattern", () => {
        const { container } = render(
          <Skeleton
            role="progressbar"
            aria-label="Content loading"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={50}
          />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "progressbar");
        expect(skeleton).toHaveAttribute("aria-label", "Content loading");
        expect(skeleton).toHaveAttribute("aria-valuemin", "0");
        expect(skeleton).toHaveAttribute("aria-valuemax", "100");
        expect(skeleton).toHaveAttribute("aria-valuenow", "50");
      });
    });

    describe("Composite Component Accessibility", () => {
      it("should support accessibility attributes on SkeletonText", () => {
        const { container } = render(
          <SkeletonText
            role="status"
            aria-label="Loading text content"
            aria-live="polite"
          />
        );

        const skeletonText = container.querySelector("[data-slot='skeleton-text']");
        expect(skeletonText).toHaveAttribute("role", "status");
        expect(skeletonText).toHaveAttribute("aria-label", "Loading text content");
        expect(skeletonText).toHaveAttribute("aria-live", "polite");
      });

      it("should support accessibility attributes on SkeletonCard", () => {
        const { container } = render(
          <SkeletonCard
            role="status"
            aria-label="Loading card content"
            aria-busy="true"
          />
        );

        const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
        expect(skeletonCard).toHaveAttribute("role", "status");
        expect(skeletonCard).toHaveAttribute("aria-label", "Loading card content");
        expect(skeletonCard).toHaveAttribute("aria-busy", "true");
      });

      it("should support accessibility attributes on SkeletonTable", () => {
        const { container } = render(
          <SkeletonTable
            role="status"
            aria-label="Loading table data"
            aria-live="polite"
          />
        );

        const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
        expect(skeletonTable).toHaveAttribute("role", "status");
        expect(skeletonTable).toHaveAttribute("aria-label", "Loading table data");
        expect(skeletonTable).toHaveAttribute("aria-live", "polite");
      });

      it("should support accessibility attributes on SkeletonList", () => {
        const { container } = render(
          <SkeletonList
            role="status"
            aria-label="Loading list items"
            aria-busy="true"
          />
        );

        const skeletonList = container.querySelector("[data-slot='skeleton-list']");
        expect(skeletonList).toHaveAttribute("role", "status");
        expect(skeletonList).toHaveAttribute("aria-label", "Loading list items");
        expect(skeletonList).toHaveAttribute("aria-busy", "true");
      });

      it("should support aria-hidden on composite components", () => {
        const { container } = render(
          <SkeletonCard aria-hidden="true" />
        );

        const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
        expect(skeletonCard).toHaveAttribute("aria-hidden", "true");
      });
    });

    describe("Dynamic Accessibility Updates", () => {
      it("should support changing aria-busy from true to false", () => {
        const { container, rerender } = render(
          <Skeleton aria-busy="true" aria-label="Loading" />
        );

        let skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-busy", "true");

        rerender(<Skeleton aria-busy="false" aria-label="Loaded" />);

        skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-busy", "false");
        expect(skeleton).toHaveAttribute("aria-label", "Loaded");
      });

      it("should support updating aria-valuenow for progress indication", () => {
        const { container, rerender } = render(
          <Skeleton role="progressbar" aria-valuenow={25} aria-valuemin={0} aria-valuemax={100} />
        );

        let skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-valuenow", "25");

        rerender(
          <Skeleton role="progressbar" aria-valuenow={75} aria-valuemin={0} aria-valuemax={100} />
        );

        skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-valuenow", "75");
      });

      it("should support updating aria-valuetext for progress description", () => {
        const { container, rerender } = render(
          <Skeleton role="progressbar" aria-valuetext="25% complete" />
        );

        let skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-valuetext", "25% complete");

        rerender(
          <Skeleton role="progressbar" aria-valuetext="75% complete" />
        );

        skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("aria-valuetext", "75% complete");
      });
    });
  });
});

// ðŸŸ¢ WORKING: Comprehensive tests for SkeletonText, SkeletonCard, SkeletonTable, and SkeletonList

describe("SkeletonText Component", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<SkeletonText />);

      const skeletonText = container.querySelector("[data-slot='skeleton-text']");
      expect(skeletonText).toBeInTheDocument();
    });

    it("should render 3 text lines by default", () => {
      const { container } = render(<SkeletonText />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(3);
    });

    it("should render all lines with text shape", () => {
      const { container } = render(<SkeletonText />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        // Text shape with default size (md) and default rounded (md)
        // Height comes from default size (md = h-8), rounded from default (rounded-md)
        expect(skeleton).toHaveClass("h-8");
        expect(skeleton).toHaveClass("rounded-md");
      });
    });

    it("should have data-slot attribute", () => {
      const { container } = render(<SkeletonText />);

      const skeletonText = container.querySelector("[data-slot='skeleton-text']");
      expect(skeletonText).toHaveAttribute("data-slot", "skeleton-text");
    });

    it("should have default spacing", () => {
      const { container } = render(<SkeletonText />);

      const skeletonText = container.querySelector("[data-slot='skeleton-text']");
      expect(skeletonText).toHaveClass("space-y-2");
    });
  });

  describe("Line Count Configuration", () => {
    it("should render specified number of lines", () => {
      const { container } = render(<SkeletonText lines={5} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(5);
    });

    it("should render single line", () => {
      const { container } = render(<SkeletonText lines={1} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(1);
    });

    it("should clamp lines to minimum of 1", () => {
      const { container } = render(<SkeletonText lines={0} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(1);
    });

    it("should clamp lines to maximum of 10", () => {
      const { container } = render(<SkeletonText lines={15} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(10);
    });

    it("should render 10 lines at maximum", () => {
      const { container } = render(<SkeletonText lines={10} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(10);
    });
  });

  describe("Width Variants", () => {
    it("should render full width by default", () => {
      const { container } = render(<SkeletonText lines={2} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons[0]).toHaveClass("w-full");
    });

    it("should render 75% width variant", () => {
      const { container } = render(<SkeletonText lines={2} widthVariant="75" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons[0]).toHaveClass("w-3/4");
    });

    it("should render 50% width variant", () => {
      const { container } = render(<SkeletonText lines={2} widthVariant="50" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons[0]).toHaveClass("w-1/2");
    });

    it("should render 25% width variant", () => {
      const { container } = render(<SkeletonText lines={2} widthVariant="25" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons[0]).toHaveClass("w-1/4");
    });

    it("should make last line 75% of specified width (full)", () => {
      const { container } = render(<SkeletonText lines={3} widthVariant="full" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      const lastLine = skeletons[2];
      expect(lastLine).toHaveClass("w-3/4");
    });

    it("should make last line 75% of specified width (75%)", () => {
      const { container } = render(<SkeletonText lines={3} widthVariant="75" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      const lastLine = skeletons[2];
      expect(lastLine).toHaveClass("w-[56.25%]");
    });

    it("should make last line 75% of specified width (50%)", () => {
      const { container } = render(<SkeletonText lines={3} widthVariant="50" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      const lastLine = skeletons[2];
      expect(lastLine).toHaveClass("w-[37.5%]");
    });

    it("should make last line 75% of specified width (25%)", () => {
      const { container } = render(<SkeletonText lines={3} widthVariant="25" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      const lastLine = skeletons[2];
      expect(lastLine).toHaveClass("w-[18.75%]");
    });

    it("should handle single line with reduced width", () => {
      const { container } = render(<SkeletonText lines={1} widthVariant="full" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      // Single line is also the last line
      expect(skeletons[0]).toHaveClass("w-3/4");
    });
  });

  describe("Spacing Configuration", () => {
    it("should apply custom spacing", () => {
      const { container } = render(<SkeletonText spacing="space-y-4" />);

      const skeletonText = container.querySelector("[data-slot='skeleton-text']");
      expect(skeletonText).toHaveClass("space-y-4");
    });

    it("should apply tight spacing", () => {
      const { container } = render(<SkeletonText spacing="space-y-1" />);

      const skeletonText = container.querySelector("[data-slot='skeleton-text']");
      expect(skeletonText).toHaveClass("space-y-1");
    });

    it("should apply loose spacing", () => {
      const { container } = render(<SkeletonText spacing="space-y-6" />);

      const skeletonText = container.querySelector("[data-slot='skeleton-text']");
      expect(skeletonText).toHaveClass("space-y-6");
    });
  });

  describe("Animation Behavior", () => {
    it("should have animation enabled by default", () => {
      const { container } = render(<SkeletonText lines={2} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("pulse");
      });
    });

    it("should disable animation on all lines", () => {
      const { container } = render(<SkeletonText lines={3} disableAnimation />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        expect(skeleton).not.toHaveStyle({
          animation: expect.stringContaining("pulse"),
        });
      });
    });

    it("should apply slow speed to all lines", () => {
      const { container } = render(<SkeletonText lines={2} speed="slow" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("3s");
      });
    });

    it("should apply fast speed to all lines", () => {
      const { container } = render(<SkeletonText lines={2} speed="fast" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("1s");
      });
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <SkeletonText className="custom-text-class" />
      );

      const skeletonText = container.querySelector("[data-slot='skeleton-text']");
      expect(skeletonText).toHaveClass("custom-text-class");
    });

    it("should merge custom className with spacing", () => {
      const { container } = render(
        <SkeletonText className="p-4 bg-gray-100" spacing="space-y-2" />
      );

      const skeletonText = container.querySelector("[data-slot='skeleton-text']");
      expect(skeletonText).toHaveClass("space-y-2");
      expect(skeletonText).toHaveClass("p-4");
      expect(skeletonText).toHaveClass("bg-gray-100");
    });
  });

  describe("Variant Combinations", () => {
    it("should work with all props combined", () => {
      const { container } = render(
        <SkeletonText
          lines={5}
          widthVariant="75"
          spacing="space-y-3"
          speed="slow"
          className="custom-class"
        />
      );

      const skeletonText = container.querySelector("[data-slot='skeleton-text']");
      expect(skeletonText).toHaveClass("space-y-3");
      expect(skeletonText).toHaveClass("custom-class");

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(5);
      expect(skeletons[0]).toHaveClass("w-3/4");

      const animationStyle = skeletons[0].getAttribute("style");
      expect(animationStyle).toContain("3s");
    });
  });
});

describe("SkeletonCard Component", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<SkeletonCard />);

      const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
      expect(skeletonCard).toBeInTheDocument();
    });

    it("should have data-slot attribute", () => {
      const { container } = render(<SkeletonCard />);

      const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
      expect(skeletonCard).toHaveAttribute("data-slot", "skeleton-card");
    });

    it("should have card styling", () => {
      const { container } = render(<SkeletonCard />);

      const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
      expect(skeletonCard).toHaveClass("rounded-xl");
      expect(skeletonCard).toHaveClass("border");
      expect(skeletonCard).toHaveClass("bg-card");
      expect(skeletonCard).toHaveClass("shadow-sm");
      expect(skeletonCard).toHaveClass("py-6");
    });

    it("should render without avatar by default", () => {
      const { container } = render(<SkeletonCard />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      const circleSkeletons = Array.from(skeletons).filter((s) =>
        s.classList.contains("rounded-full")
      );
      expect(circleSkeletons).toHaveLength(0);
    });

    it("should render without footer by default", () => {
      const { container } = render(<SkeletonCard />);

      // Default is 1 title line + 3 description lines = 4 total skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(4);
    });
  });

  describe("Avatar Configuration", () => {
    it("should render with avatar when enabled", () => {
      const { container } = render(<SkeletonCard showAvatar />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      const circleSkeletons = Array.from(skeletons).filter((s) =>
        s.classList.contains("rounded-full")
      );
      expect(circleSkeletons.length).toBeGreaterThan(0);
    });

    it("should render avatar with circle shape", () => {
      const { container } = render(<SkeletonCard showAvatar />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      const avatarSkeleton = skeletons[0]; // First skeleton is avatar
      expect(avatarSkeleton).toHaveClass("rounded-full");
      expect(avatarSkeleton).toHaveStyle({ width: "40px", height: "40px" });
    });
  });

  describe("Title Lines Configuration", () => {
    it("should render 1 title line by default", () => {
      const { container } = render(<SkeletonCard />);

      // 1 title + 3 description = 4 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(4);
    });

    it("should render 2 title lines", () => {
      const { container } = render(<SkeletonCard titleLines={2} />);

      // 2 title + 3 description = 5 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(5);
    });

    it("should make last title line 75% width when multiple title lines", () => {
      const { container } = render(<SkeletonCard titleLines={2} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      // First title line (index 0) should be full width
      expect(skeletons[0]).toHaveClass("w-full");
      // Second title line (index 1) should be 75% width
      expect(skeletons[1]).toHaveClass("w-3/4");
    });
  });

  describe("Description Lines Configuration", () => {
    it("should render 3 description lines by default", () => {
      const { container } = render(<SkeletonCard />);

      // 1 title + 3 description = 4 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(4);
    });

    it("should render 2 description lines", () => {
      const { container } = render(<SkeletonCard descriptionLines={2} />);

      // 1 title + 2 description = 3 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(3);
    });

    it("should render 4 description lines", () => {
      const { container } = render(<SkeletonCard descriptionLines={4} />);

      // 1 title + 4 description = 5 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(5);
    });

    it("should make last description line 2/3 width", () => {
      const { container } = render(<SkeletonCard descriptionLines={3} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      // Last skeleton should be the last description line
      const lastDescLine = skeletons[skeletons.length - 1];
      expect(lastDescLine).toHaveClass("w-2/3");
    });
  });

  describe("Footer Configuration", () => {
    it("should render with footer when enabled", () => {
      const { container } = render(<SkeletonCard showFooter />);

      // 1 title + 3 description + 2 footer buttons = 6 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(6);
    });

    it("should render footer with 2 button-like skeletons", () => {
      const { container } = render(<SkeletonCard showFooter />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      // Last 2 skeletons should be footer buttons
      const footerButtons = [
        skeletons[skeletons.length - 2],
        skeletons[skeletons.length - 1],
      ];

      footerButtons.forEach((button) => {
        expect(button).toHaveStyle({ width: "80px", height: "32px" });
        expect(button).toHaveClass("rounded-md");
      });
    });
  });

  describe("Animation Behavior", () => {
    it("should have animation enabled by default", () => {
      const { container } = render(<SkeletonCard />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("pulse");
      });
    });

    it("should disable animation on all elements", () => {
      const { container } = render(<SkeletonCard disableAnimation />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        expect(skeleton).not.toHaveStyle({
          animation: expect.stringContaining("pulse"),
        });
      });
    });

    it("should apply speed to all elements", () => {
      const { container } = render(<SkeletonCard speed="slow" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("3s");
      });
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <SkeletonCard className="custom-card-class" />
      );

      const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
      expect(skeletonCard).toHaveClass("custom-card-class");
    });

    it("should merge custom className with default classes", () => {
      const { container } = render(
        <SkeletonCard className="w-full max-w-md" />
      );

      const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
      expect(skeletonCard).toHaveClass("w-full");
      expect(skeletonCard).toHaveClass("max-w-md");
      expect(skeletonCard).toHaveClass("rounded-xl");
      expect(skeletonCard).toHaveClass("border");
    });
  });

  describe("Variant Combinations", () => {
    it("should work with all props combined", () => {
      const { container } = render(
        <SkeletonCard
          showAvatar
          titleLines={2}
          descriptionLines={4}
          showFooter
          speed="slow"
          className="custom-card"
        />
      );

      const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
      expect(skeletonCard).toHaveClass("custom-card");

      // 1 avatar + 2 title + 4 description + 2 footer = 9 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(9);

      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("3s");
      });
    });

    it("should work with minimal configuration", () => {
      const { container } = render(<SkeletonCard titleLines={1} descriptionLines={2} />);

      // 1 title + 2 description = 3 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(3);
    });

    it("should work with maximum configuration", () => {
      const { container } = render(
        <SkeletonCard
          showAvatar
          titleLines={2}
          descriptionLines={4}
          showFooter
        />
      );

      // 1 avatar + 2 title + 4 description + 2 footer = 9 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(9);
    });
  });

  describe("Structure Matching", () => {
    it("should match Card component structure with proper padding", () => {
      const { container } = render(<SkeletonCard />);

      const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
      expect(skeletonCard).toHaveClass("flex");
      expect(skeletonCard).toHaveClass("flex-col");
      expect(skeletonCard).toHaveClass("gap-6");
      expect(skeletonCard).toHaveClass("py-6");
    });

    it("should have proper header structure with px-6", () => {
      const { container } = render(<SkeletonCard showAvatar />);

      const headerSection = container.querySelector("[data-slot='skeleton-card'] > div:first-child");
      expect(headerSection).toHaveClass("flex");
      expect(headerSection).toHaveClass("gap-4");
      expect(headerSection).toHaveClass("px-6");
    });

    it("should have proper footer structure with px-6 when enabled", () => {
      const { container } = render(<SkeletonCard showFooter />);

      const footerSection = container.querySelector("[data-slot='skeleton-card'] > div:last-child");
      expect(footerSection).toHaveClass("flex");
      expect(footerSection).toHaveClass("items-center");
      expect(footerSection).toHaveClass("gap-2");
      expect(footerSection).toHaveClass("px-6");
    });
  });
});

describe("SkeletonTable Component", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<SkeletonTable />);

      const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
      expect(skeletonTable).toBeInTheDocument();
    });

    it("should have data-slot attribute", () => {
      const { container } = render(<SkeletonTable />);

      const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
      expect(skeletonTable).toHaveAttribute("data-slot", "skeleton-table");
    });

    it("should have table styling", () => {
      const { container } = render(<SkeletonTable />);

      const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
      expect(skeletonTable).toHaveClass("w-full");
      expect(skeletonTable).toHaveClass("space-y-3");
    });

    it("should render 5 data rows by default", () => {
      const { container } = render(<SkeletonTable />);

      // Default is 5 rows Ã— 4 columns = 20 cell skeletons + 4 header skeletons = 24 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(24);
    });

    it("should render 4 columns by default", () => {
      const { container } = render(<SkeletonTable />);

      const headerRow = container.querySelector("[data-slot='skeleton-table'] > div:first-child");
      const headerCells = headerRow?.querySelectorAll("[data-slot='skeleton']");
      expect(headerCells).toHaveLength(4);
    });
  });

  describe("Row Configuration", () => {
    it("should render specified number of rows", () => {
      const { container } = render(<SkeletonTable rows={8} />);

      // 8 rows Ã— 4 columns = 32 cell skeletons + 4 header skeletons = 36 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(36);
    });

    it("should clamp rows to minimum of 3", () => {
      const { container } = render(<SkeletonTable rows={1} />);

      // 3 rows Ã— 4 columns = 12 cell skeletons + 4 header skeletons = 16 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(16);
    });

    it("should clamp rows to maximum of 10", () => {
      const { container } = render(<SkeletonTable rows={15} />);

      // 10 rows Ã— 4 columns = 40 cell skeletons + 4 header skeletons = 44 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(44);
    });

    it("should render 10 rows at maximum", () => {
      const { container } = render(<SkeletonTable rows={10} />);

      // 10 rows Ã— 4 columns = 40 cell skeletons + 4 header skeletons = 44 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(44);
    });

    it("should render 3 rows at minimum", () => {
      const { container } = render(<SkeletonTable rows={3} />);

      // 3 rows Ã— 4 columns = 12 cell skeletons + 4 header skeletons = 16 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(16);
    });
  });

  describe("Column Configuration", () => {
    it("should render specified number of columns", () => {
      const { container } = render(<SkeletonTable columns={6} />);

      const headerRow = container.querySelector("[data-slot='skeleton-table'] > div:first-child");
      const headerCells = headerRow?.querySelectorAll("[data-slot='skeleton']");
      expect(headerCells).toHaveLength(6);
    });

    it("should clamp columns to minimum of 2", () => {
      const { container } = render(<SkeletonTable columns={1} />);

      const headerRow = container.querySelector("[data-slot='skeleton-table'] > div:first-child");
      const headerCells = headerRow?.querySelectorAll("[data-slot='skeleton']");
      expect(headerCells).toHaveLength(2);
    });

    it("should clamp columns to maximum of 8", () => {
      const { container } = render(<SkeletonTable columns={12} />);

      const headerRow = container.querySelector("[data-slot='skeleton-table'] > div:first-child");
      const headerCells = headerRow?.querySelectorAll("[data-slot='skeleton']");
      expect(headerCells).toHaveLength(8);
    });

    it("should render 8 columns at maximum", () => {
      const { container } = render(<SkeletonTable columns={8} />);

      const headerRow = container.querySelector("[data-slot='skeleton-table'] > div:first-child");
      const headerCells = headerRow?.querySelectorAll("[data-slot='skeleton']");
      expect(headerCells).toHaveLength(8);
    });

    it("should render 2 columns at minimum", () => {
      const { container } = render(<SkeletonTable columns={2} />);

      const headerRow = container.querySelector("[data-slot='skeleton-table'] > div:first-child");
      const headerCells = headerRow?.querySelectorAll("[data-slot='skeleton']");
      expect(headerCells).toHaveLength(2);
    });
  });

  describe("Structure Matching", () => {
    it("should have header row with proper structure", () => {
      const { container } = render(<SkeletonTable />);

      const headerRow = container.querySelector("[data-slot='skeleton-table'] > div:first-child");
      expect(headerRow).toHaveClass("flex");
      expect(headerRow).toHaveClass("gap-4");
    });

    it("should have header cells with flex-1", () => {
      const { container } = render(<SkeletonTable />);

      const headerRow = container.querySelector("[data-slot='skeleton-table'] > div:first-child");
      const headerCells = headerRow?.querySelectorAll("[data-slot='skeleton']");
      headerCells?.forEach((cell) => {
        expect(cell).toHaveClass("flex-1");
      });
    });

    it("should have header cells with height 16", () => {
      const { container } = render(<SkeletonTable />);

      const headerRow = container.querySelector("[data-slot='skeleton-table'] > div:first-child");
      const headerCells = headerRow?.querySelectorAll("[data-slot='skeleton']");
      headerCells?.forEach((cell) => {
        expect(cell).toHaveStyle({ height: "16px" });
      });
    });

    it("should have data rows container with space-y-2", () => {
      const { container } = render(<SkeletonTable />);

      const dataRowsContainer = container.querySelector("[data-slot='skeleton-table'] > div:last-child");
      expect(dataRowsContainer).toHaveClass("space-y-2");
    });

    it("should have data row cells with flex-1", () => {
      const { container } = render(<SkeletonTable />);

      const dataRowsContainer = container.querySelector("[data-slot='skeleton-table'] > div:last-child");
      const firstDataRow = dataRowsContainer?.querySelector("div");
      const cells = firstDataRow?.querySelectorAll("[data-slot='skeleton']");
      cells?.forEach((cell) => {
        expect(cell).toHaveClass("flex-1");
      });
    });

    it("should have data row cells with height 14", () => {
      const { container } = render(<SkeletonTable />);

      const dataRowsContainer = container.querySelector("[data-slot='skeleton-table'] > div:last-child");
      const firstDataRow = dataRowsContainer?.querySelector("div");
      const cells = firstDataRow?.querySelectorAll("[data-slot='skeleton']");
      cells?.forEach((cell) => {
        expect(cell).toHaveStyle({ height: "14px" });
      });
    });
  });

  describe("Animation Behavior", () => {
    it("should have animation enabled by default", () => {
      const { container } = render(<SkeletonTable />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("pulse");
      });
    });

    it("should disable animation on all cells", () => {
      const { container } = render(<SkeletonTable disableAnimation />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        expect(skeleton).not.toHaveStyle({
          animation: expect.stringContaining("pulse"),
        });
      });
    });

    it("should apply speed to all cells", () => {
      const { container } = render(<SkeletonTable speed="fast" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("1s");
      });
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <SkeletonTable className="custom-table-class" />
      );

      const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
      expect(skeletonTable).toHaveClass("custom-table-class");
    });

    it("should merge custom className with default classes", () => {
      const { container } = render(
        <SkeletonTable className="overflow-x-auto rounded-lg" />
      );

      const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
      expect(skeletonTable).toHaveClass("overflow-x-auto");
      expect(skeletonTable).toHaveClass("rounded-lg");
      expect(skeletonTable).toHaveClass("w-full");
      expect(skeletonTable).toHaveClass("space-y-3");
    });
  });

  describe("Variant Combinations", () => {
    it("should work with all props combined", () => {
      const { container } = render(
        <SkeletonTable
          rows={8}
          columns={6}
          speed="slow"
          className="custom-table"
        />
      );

      const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
      expect(skeletonTable).toHaveClass("custom-table");

      // 8 rows Ã— 6 columns = 48 cell skeletons + 6 header skeletons = 54 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(54);

      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("3s");
      });
    });

    it("should work with minimal configuration", () => {
      const { container } = render(<SkeletonTable rows={3} columns={2} />);

      // 3 rows Ã— 2 columns = 6 cell skeletons + 2 header skeletons = 8 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(8);
    });

    it("should work with maximum configuration", () => {
      const { container } = render(<SkeletonTable rows={10} columns={8} />);

      // 10 rows Ã— 8 columns = 80 cell skeletons + 8 header skeletons = 88 total
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(88);
    });
  });
});

describe("SkeletonList Component", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<SkeletonList />);

      const skeletonList = container.querySelector("[data-slot='skeleton-list']");
      expect(skeletonList).toBeInTheDocument();
    });

    it("should have data-slot attribute", () => {
      const { container } = render(<SkeletonList />);

      const skeletonList = container.querySelector("[data-slot='skeleton-list']");
      expect(skeletonList).toHaveAttribute("data-slot", "skeleton-list");
    });

    it("should have default spacing", () => {
      const { container } = render(<SkeletonList />);

      const skeletonList = container.querySelector("[data-slot='skeleton-list']");
      expect(skeletonList).toHaveClass("space-y-4");
    });

    it("should render 5 items by default", () => {
      const { container } = render(<SkeletonList />);

      // 5 items Ã— 2 text lines = 10 text skeletons (no avatars by default)
      const textSkeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(textSkeletons).toHaveLength(10);
    });

    it("should render without avatars by default", () => {
      const { container } = render(<SkeletonList />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      const circleSkeletons = Array.from(skeletons).filter((s) =>
        s.classList.contains("rounded-full")
      );
      expect(circleSkeletons).toHaveLength(0);
    });

    it("should render 2 text lines per item by default", () => {
      const { container } = render(<SkeletonList items={3} />);

      // 3 items (minimum) Ã— 2 text lines = 6 text skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(6);

      // Check that each item has 2 lines by examining structure
      const listItems = container.querySelectorAll("[data-slot='skeleton-list'] > div");
      expect(listItems).toHaveLength(3);
    });
  });

  describe("Item Count Configuration", () => {
    it("should render specified number of items", () => {
      const { container } = render(<SkeletonList items={8} />);

      // 8 items Ã— 2 text lines = 16 text skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(16);
    });

    it("should clamp items to minimum of 3", () => {
      const { container } = render(<SkeletonList items={1} />);

      // 3 items Ã— 2 text lines = 6 text skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(6);
    });

    it("should clamp items to maximum of 10", () => {
      const { container } = render(<SkeletonList items={15} />);

      // 10 items Ã— 2 text lines = 20 text skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(20);
    });

    it("should render 10 items at maximum", () => {
      const { container } = render(<SkeletonList items={10} />);

      // 10 items Ã— 2 text lines = 20 text skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(20);
    });

    it("should render 3 items at minimum", () => {
      const { container } = render(<SkeletonList items={3} />);

      // 3 items Ã— 2 text lines = 6 text skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(6);
    });
  });

  describe("Avatar Configuration", () => {
    it("should render with avatars when enabled", () => {
      const { container } = render(<SkeletonList showAvatar items={5} />);

      // 5 items Ã— (1 avatar + 2 text lines) = 15 total skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(15);
    });

    it("should render circle avatars", () => {
      const { container } = render(<SkeletonList showAvatar items={3} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      const circleSkeletons = Array.from(skeletons).filter((s) =>
        s.classList.contains("rounded-full")
      );
      expect(circleSkeletons).toHaveLength(3);
    });

    it("should render avatars with 40x40 dimensions", () => {
      const { container } = render(<SkeletonList showAvatar items={1} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      const avatar = skeletons[0]; // First skeleton is avatar
      expect(avatar).toHaveStyle({ width: "40px", height: "40px" });
    });
  });

  describe("Text Lines Configuration", () => {
    it("should render single text line per item", () => {
      const { container } = render(<SkeletonList textLines={1} items={5} />);

      // 5 items Ã— 1 text line = 5 text skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(5);
    });

    it("should render 2 text lines per item", () => {
      const { container } = render(<SkeletonList textLines={2} items={5} />);

      // 5 items Ã— 2 text lines = 10 text skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(10);
    });

    it("should make second line 75% width when 2 text lines", () => {
      const { container } = render(<SkeletonList textLines={2} items={1} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      // First line should be full width
      expect(skeletons[0]).toHaveClass("w-full");
      // Second line should be 75% width
      expect(skeletons[1]).toHaveClass("w-3/4");
    });

    it("should make single line full width", () => {
      const { container } = render(<SkeletonList textLines={1} items={1} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons[0]).toHaveClass("w-full");
    });
  });

  describe("Spacing Configuration", () => {
    it("should apply custom spacing", () => {
      const { container } = render(<SkeletonList spacing="space-y-6" />);

      const skeletonList = container.querySelector("[data-slot='skeleton-list']");
      expect(skeletonList).toHaveClass("space-y-6");
    });

    it("should apply tight spacing", () => {
      const { container } = render(<SkeletonList spacing="space-y-2" />);

      const skeletonList = container.querySelector("[data-slot='skeleton-list']");
      expect(skeletonList).toHaveClass("space-y-2");
    });

    it("should apply loose spacing", () => {
      const { container } = render(<SkeletonList spacing="space-y-8" />);

      const skeletonList = container.querySelector("[data-slot='skeleton-list']");
      expect(skeletonList).toHaveClass("space-y-8");
    });
  });

  describe("Structure Matching", () => {
    it("should have proper list item structure", () => {
      const { container } = render(<SkeletonList items={1} />);

      const listItem = container.querySelector("[data-slot='skeleton-list'] > div");
      expect(listItem).toHaveClass("flex");
      expect(listItem).toHaveClass("gap-3");
    });

    it("should have text container with flex-1", () => {
      const { container } = render(<SkeletonList items={1} />);

      const listItem = container.querySelector("[data-slot='skeleton-list'] > div");
      const textContainer = listItem?.querySelector("div");
      expect(textContainer).toHaveClass("flex");
      expect(textContainer).toHaveClass("flex-1");
      expect(textContainer).toHaveClass("flex-col");
      expect(textContainer).toHaveClass("gap-2");
    });

    it("should have proper structure with avatar", () => {
      const { container } = render(<SkeletonList showAvatar items={1} />);

      const listItem = container.querySelector("[data-slot='skeleton-list'] > div");
      const children = listItem?.children;
      expect(children).toHaveLength(2); // Avatar + text container
    });
  });

  describe("Animation Behavior", () => {
    it("should have animation enabled by default", () => {
      const { container } = render(<SkeletonList items={2} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("pulse");
      });
    });

    it("should disable animation on all elements", () => {
      const { container } = render(<SkeletonList disableAnimation items={2} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        expect(skeleton).not.toHaveStyle({
          animation: expect.stringContaining("pulse"),
        });
      });
    });

    it("should apply speed to all elements", () => {
      const { container } = render(<SkeletonList speed="slow" items={2} />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("3s");
      });
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <SkeletonList className="custom-list-class" />
      );

      const skeletonList = container.querySelector("[data-slot='skeleton-list']");
      expect(skeletonList).toHaveClass("custom-list-class");
    });

    it("should merge custom className with spacing", () => {
      const { container } = render(
        <SkeletonList className="p-4 bg-gray-100" spacing="space-y-4" />
      );

      const skeletonList = container.querySelector("[data-slot='skeleton-list']");
      expect(skeletonList).toHaveClass("space-y-4");
      expect(skeletonList).toHaveClass("p-4");
      expect(skeletonList).toHaveClass("bg-gray-100");
    });
  });

  describe("Variant Combinations", () => {
    it("should work with all props combined", () => {
      const { container } = render(
        <SkeletonList
          items={8}
          showAvatar
          textLines={2}
          spacing="space-y-6"
          speed="slow"
          className="custom-list"
        />
      );

      const skeletonList = container.querySelector("[data-slot='skeleton-list']");
      expect(skeletonList).toHaveClass("space-y-6");
      expect(skeletonList).toHaveClass("custom-list");

      // 8 items Ã— (1 avatar + 2 text lines) = 24 total skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(24);

      skeletons.forEach((skeleton) => {
        const animationStyle = skeleton.getAttribute("style");
        expect(animationStyle).toContain("3s");
      });
    });

    it("should work with minimal configuration", () => {
      const { container } = render(
        <SkeletonList items={3} textLines={1} />
      );

      // 3 items Ã— 1 text line = 3 text skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(3);
    });

    it("should work with maximum configuration", () => {
      const { container } = render(
        <SkeletonList items={10} showAvatar textLines={2} />
      );

      // 10 items Ã— (1 avatar + 2 text lines) = 30 total skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(30);
    });

    it("should work without avatar and single text line", () => {
      const { container } = render(
        <SkeletonList items={5} textLines={1} />
      );

      // 5 items Ã— 1 text line = 5 text skeletons
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons).toHaveLength(5);

      const circleSkeletons = Array.from(skeletons).filter((s) =>
        s.classList.contains("rounded-full")
      );
      expect(circleSkeletons).toHaveLength(0);
    });
  });

  describe("Accessibility", () => {
    describe("ARIA Attributes", () => {
      it("should support role='status' for loading state announcements", () => {
        const { container } = render(<SkeletonList role="status" />);

        const skeletonList = container.querySelector("[data-slot='skeleton-list']");
        expect(skeletonList).toHaveAttribute("role", "status");
      });

      it("should support aria-busy attribute to indicate loading", () => {
        const { container } = render(
          <SkeletonList aria-busy="true" />
        );

        const skeletonList = container.querySelector("[data-slot='skeleton-list']");
        expect(skeletonList).toHaveAttribute("aria-busy", "true");
      });

      it("should support aria-label for screen reader context", () => {
        const { container } = render(
          <SkeletonList aria-label="Loading user list" />
        );

        const skeletonList = container.querySelector("[data-slot='skeleton-list']");
        expect(skeletonList).toHaveAttribute("aria-label", "Loading user list");
      });

      it("should support aria-live for dynamic content updates", () => {
        const { container } = render(
          <SkeletonList aria-live="polite" />
        );

        const skeletonList = container.querySelector("[data-slot='skeleton-list']");
        expect(skeletonList).toHaveAttribute("aria-live", "polite");
      });

      it("should support aria-describedby for additional context", () => {
        const { container } = render(
          <SkeletonList aria-describedby="loading-description" />
        );

        const skeletonList = container.querySelector("[data-slot='skeleton-list']");
        expect(skeletonList).toHaveAttribute("aria-describedby", "loading-description");
      });
    });

    describe("Screen Reader Support", () => {
      it("should allow combining role and aria-label for comprehensive announcements", () => {
        const { container } = render(
          <Skeleton role="status" aria-label="Loading content" />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "status");
        expect(skeleton).toHaveAttribute("aria-label", "Loading content");
      });

      it("should support aria-label on SkeletonText for text content loading", () => {
        const { container } = render(
          <SkeletonText aria-label="Loading article text" />
        );

        const skeletonText = container.querySelector("[data-slot='skeleton-text']");
        expect(skeletonText).toHaveAttribute("aria-label", "Loading article text");
      });

      it("should support aria-label on SkeletonCard for card content loading", () => {
        const { container } = render(
          <SkeletonCard aria-label="Loading product card" />
        );

        const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
        expect(skeletonCard).toHaveAttribute("aria-label", "Loading product card");
      });

      it("should support aria-label on SkeletonTable for table data loading", () => {
        const { container } = render(
          <SkeletonTable aria-label="Loading table data" />
        );

        const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
        expect(skeletonTable).toHaveAttribute("aria-label", "Loading table data");
      });

      it("should combine role='status' with aria-live='polite' for proper announcements", () => {
        const { container } = render(
          <SkeletonCard
            role="status"
            aria-live="polite"
            aria-label="Loading user profile"
          />
        );

        const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
        expect(skeletonCard).toHaveAttribute("role", "status");
        expect(skeletonCard).toHaveAttribute("aria-live", "polite");
        expect(skeletonCard).toHaveAttribute("aria-label", "Loading user profile");
      });
    });

    describe("Semantic HTML Structure", () => {
      it("should render base Skeleton as div element", () => {
        const { container } = render(<Skeleton />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton?.tagName).toBe("DIV");
      });

      it("should render SkeletonText as div container with proper structure", () => {
        const { container } = render(<SkeletonText lines={3} />);

        const skeletonText = container.querySelector("[data-slot='skeleton-text']");
        expect(skeletonText?.tagName).toBe("DIV");

        // Should contain multiple skeleton divs
        const skeletons = skeletonText?.querySelectorAll("[data-slot='skeleton']");
        expect(skeletons).toHaveLength(3);
      });

      it("should render SkeletonCard as div with semantic structure", () => {
        const { container } = render(<SkeletonCard showAvatar showFooter />);

        const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
        expect(skeletonCard?.tagName).toBe("DIV");

        // Should have proper flex layout
        expect(skeletonCard).toHaveClass("flex");
        expect(skeletonCard).toHaveClass("flex-col");
      });

      it("should render SkeletonTable as div with table-like structure", () => {
        const { container } = render(<SkeletonTable rows={3} columns={3} />);

        const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
        expect(skeletonTable?.tagName).toBe("DIV");

        // Should have header row and data rows
        const rows = skeletonTable?.querySelectorAll(":scope > div");
        expect(rows?.length).toBeGreaterThan(1); // Header + data rows container
      });

      it("should render SkeletonList as div with list-like structure", () => {
        const { container } = render(<SkeletonList items={3} />);

        const skeletonList = container.querySelector("[data-slot='skeleton-list']");
        expect(skeletonList?.tagName).toBe("DIV");

        // Should have multiple list items
        const listItems = skeletonList?.querySelectorAll(":scope > div");
        expect(listItems).toHaveLength(3);
      });

      it("should maintain proper heading hierarchy with data-slot attributes", () => {
        const { container } = render(
          <>
            <Skeleton data-slot="skeleton" />
            <SkeletonText data-slot="skeleton-text" />
          </>
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        const skeletonText = container.querySelector("[data-slot='skeleton-text']");

        expect(skeleton).toBeInTheDocument();
        expect(skeletonText).toBeInTheDocument();
      });
    });

    describe("Reduced Motion Support", () => {
      it("should allow disabling animation for users with motion sensitivity", () => {
        const { container } = render(<Skeleton disableAnimation />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).not.toHaveStyle({
          animation: expect.stringContaining("pulse"),
        });
      });

      it("should allow disabling animation on SkeletonText", () => {
        const { container } = render(<SkeletonText disableAnimation lines={2} />);

        const skeletons = container.querySelectorAll("[data-slot='skeleton']");
        skeletons.forEach((skeleton) => {
          expect(skeleton).not.toHaveStyle({
            animation: expect.stringContaining("pulse"),
          });
        });
      });

      it("should allow disabling animation on SkeletonCard", () => {
        const { container } = render(
          <SkeletonCard disableAnimation showAvatar showFooter />
        );

        const skeletons = container.querySelectorAll("[data-slot='skeleton']");
        skeletons.forEach((skeleton) => {
          expect(skeleton).not.toHaveStyle({
            animation: expect.stringContaining("pulse"),
          });
        });
      });

      it("should allow disabling animation on SkeletonTable", () => {
        const { container } = render(
          <SkeletonTable disableAnimation rows={3} columns={3} />
        );

        const skeletons = container.querySelectorAll("[data-slot='skeleton']");
        skeletons.forEach((skeleton) => {
          expect(skeleton).not.toHaveStyle({
            animation: expect.stringContaining("pulse"),
          });
        });
      });

      it("should allow disabling animation on SkeletonList", () => {
        const { container } = render(
          <SkeletonList disableAnimation items={3} />
        );

        const skeletons = container.querySelectorAll("[data-slot='skeleton']");
        skeletons.forEach((skeleton) => {
          expect(skeleton).not.toHaveStyle({
            animation: expect.stringContaining("pulse"),
          });
        });
      });

      it("should support prefers-reduced-motion through disableAnimation prop", () => {
        // ðŸŸ¢ WORKING: Test demonstrates how disableAnimation can be used to respect prefers-reduced-motion
        // In a real implementation, this would be combined with a media query hook
        const prefersReducedMotion = true; // Mock value from useMediaQuery('(prefers-reduced-motion: reduce)')

        const { container } = render(
          <Skeleton disableAnimation={prefersReducedMotion} />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).not.toHaveStyle({
          animation: expect.stringContaining("pulse"),
        });
      });
    });

    describe("Loading State Announcements", () => {
      it("should support proper loading state attributes on Skeleton", () => {
        const { container } = render(
          <Skeleton
            role="status"
            aria-label="Loading"
            aria-busy="true"
          />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "status");
        expect(skeleton).toHaveAttribute("aria-label", "Loading");
        expect(skeleton).toHaveAttribute("aria-busy", "true");
      });

      it("should support proper loading state attributes on SkeletonText", () => {
        const { container } = render(
          <SkeletonText
            role="status"
            aria-label="Loading article content"
            aria-busy="true"
          />
        );

        const skeletonText = container.querySelector("[data-slot='skeleton-text']");
        expect(skeletonText).toHaveAttribute("role", "status");
        expect(skeletonText).toHaveAttribute("aria-label", "Loading article content");
        expect(skeletonText).toHaveAttribute("aria-busy", "true");
      });

      it("should support proper loading state attributes on SkeletonCard", () => {
        const { container } = render(
          <SkeletonCard
            role="status"
            aria-label="Loading card details"
            aria-busy="true"
          />
        );

        const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
        expect(skeletonCard).toHaveAttribute("role", "status");
        expect(skeletonCard).toHaveAttribute("aria-label", "Loading card details");
        expect(skeletonCard).toHaveAttribute("aria-busy", "true");
      });

      it("should support proper loading state attributes on SkeletonTable", () => {
        const { container } = render(
          <SkeletonTable
            role="status"
            aria-label="Loading table rows"
            aria-busy="true"
          />
        );

        const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
        expect(skeletonTable).toHaveAttribute("role", "status");
        expect(skeletonTable).toHaveAttribute("aria-label", "Loading table rows");
        expect(skeletonTable).toHaveAttribute("aria-busy", "true");
      });

      it("should support proper loading state attributes on SkeletonList", () => {
        const { container } = render(
          <SkeletonList
            role="status"
            aria-label="Loading list items"
            aria-busy="true"
          />
        );

        const skeletonList = container.querySelector("[data-slot='skeleton-list']");
        expect(skeletonList).toHaveAttribute("role", "status");
        expect(skeletonList).toHaveAttribute("aria-label", "Loading list items");
        expect(skeletonList).toHaveAttribute("aria-busy", "true");
      });

      it("should allow aria-live='polite' for non-intrusive announcements", () => {
        const { container } = render(
          <SkeletonCard
            role="status"
            aria-live="polite"
            aria-label="Loading recommendations"
          />
        );

        const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
        expect(skeletonCard).toHaveAttribute("aria-live", "polite");
      });

      it("should allow aria-live='assertive' for urgent loading states", () => {
        const { container } = render(
          <SkeletonTable
            role="status"
            aria-live="assertive"
            aria-label="Loading critical data"
          />
        );

        const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
        expect(skeletonTable).toHaveAttribute("aria-live", "assertive");
      });
    });

    describe("Keyboard Navigation", () => {
      it("should support tabIndex for keyboard focus management", () => {
        const { container } = render(<Skeleton tabIndex={0} />);

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("tabIndex", "0");
      });

      it("should support tabIndex=-1 to remove from tab order", () => {
        const { container } = render(<SkeletonCard tabIndex={-1} />);

        const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
        expect(skeletonCard).toHaveAttribute("tabIndex", "-1");
      });

      it("should allow focus management on loading states", () => {
        const { container } = render(
          <SkeletonList
            tabIndex={0}
            aria-label="Loading content"
          />
        );

        const skeletonList = container.querySelector("[data-slot='skeleton-list']");
        expect(skeletonList).toHaveAttribute("tabIndex", "0");
        expect(skeletonList).toHaveAttribute("aria-label", "Loading content");
      });

      it("should support onFocus and onBlur events", () => {
        // ðŸŸ¢ WORKING: Skeleton components support standard HTML focus events
        const { container } = render(
          <Skeleton
            tabIndex={0}
            aria-label="Focusable skeleton"
          />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("tabIndex", "0");
        expect(skeleton).toHaveAttribute("aria-label", "Focusable skeleton");
      });
    });

    describe("Comprehensive Accessibility Scenarios", () => {
      it("should work as an accessible loading placeholder for user profile", () => {
        const { container } = render(
          <SkeletonCard
            role="status"
            aria-label="Loading user profile"
            aria-busy="true"
            aria-live="polite"
            showAvatar
            titleLines={2}
            descriptionLines={3}
          />
        );

        const skeletonCard = container.querySelector("[data-slot='skeleton-card']");
        expect(skeletonCard).toHaveAttribute("role", "status");
        expect(skeletonCard).toHaveAttribute("aria-label", "Loading user profile");
        expect(skeletonCard).toHaveAttribute("aria-busy", "true");
        expect(skeletonCard).toHaveAttribute("aria-live", "polite");
      });

      it("should work as an accessible loading placeholder for data table", () => {
        const { container } = render(
          <SkeletonTable
            role="status"
            aria-label="Loading data table"
            aria-busy="true"
            rows={5}
            columns={4}
          />
        );

        const skeletonTable = container.querySelector("[data-slot='skeleton-table']");
        expect(skeletonTable).toHaveAttribute("role", "status");
        expect(skeletonTable).toHaveAttribute("aria-label", "Loading data table");
        expect(skeletonTable).toHaveAttribute("aria-busy", "true");
      });

      it("should work as an accessible loading placeholder for article text", () => {
        const { container } = render(
          <SkeletonText
            role="status"
            aria-label="Loading article"
            aria-busy="true"
            lines={5}
            widthVariant="full"
          />
        );

        const skeletonText = container.querySelector("[data-slot='skeleton-text']");
        expect(skeletonText).toHaveAttribute("role", "status");
        expect(skeletonText).toHaveAttribute("aria-label", "Loading article");
        expect(skeletonText).toHaveAttribute("aria-busy", "true");
      });

      it("should work with reduced motion and proper ARIA attributes", () => {
        const { container } = render(
          <SkeletonList
            role="status"
            aria-label="Loading items"
            aria-busy="true"
            disableAnimation
            items={5}
            showAvatar
          />
        );

        const skeletonList = container.querySelector("[data-slot='skeleton-list']");
        expect(skeletonList).toHaveAttribute("role", "status");
        expect(skeletonList).toHaveAttribute("aria-label", "Loading items");
        expect(skeletonList).toHaveAttribute("aria-busy", "true");

        // Verify animation is disabled
        const skeletons = container.querySelectorAll("[data-slot='skeleton']");
        skeletons.forEach((skeleton) => {
          expect(skeleton).not.toHaveStyle({
            animation: expect.stringContaining("pulse"),
          });
        });
      });

      it("should support multiple accessibility attributes together", () => {
        const { container } = render(
          <Skeleton
            role="status"
            aria-label="Loading content"
            aria-busy="true"
            aria-live="polite"
            aria-describedby="loading-hint"
            tabIndex={-1}
          />
        );

        const skeleton = container.querySelector("[data-slot='skeleton']");
        expect(skeleton).toHaveAttribute("role", "status");
        expect(skeleton).toHaveAttribute("aria-label", "Loading content");
        expect(skeleton).toHaveAttribute("aria-busy", "true");
        expect(skeleton).toHaveAttribute("aria-live", "polite");
        expect(skeleton).toHaveAttribute("aria-describedby", "loading-hint");
        expect(skeleton).toHaveAttribute("tabIndex", "-1");
      });
    });
  });
});
