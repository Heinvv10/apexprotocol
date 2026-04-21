/**
 * @vitest-environment jsdom
 *
 * FullScreenError Component Tests
 *
 * Tests for the FullScreenError component that displays critical application errors
 * with APEX branding and full-screen layout.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}));

// Import component AFTER mocking
import { FullScreenError } from "../error-boundary";

// Sample error objects
const mockError = new Error("Test critical error message");
const mockErrorWithDigest = Object.assign(
  new Error("Test critical error with digest"),
  {
    digest: "xyz789abc123",
  }
);

// Store original NODE_ENV
const originalEnv = process.env.NODE_ENV;

describe("FullScreenError Component", () => {
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore NODE_ENV
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  describe("Rendering with Default Props", () => {
    it("should render the component with default title", () => {
      render(<FullScreenError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Critical Error")).toBeInTheDocument();
    });

    it("should render with default description", () => {
      render(<FullScreenError error={mockError} reset={mockReset} />);

      expect(
        screen.getByText(
          /The application encountered a critical error and needs to be reloaded/
        )
      ).toBeInTheDocument();
    });

    it("should render error icon", () => {
      render(<FullScreenError error={mockError} reset={mockReset} />);

      expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
    });

    it("should render Reload Application button", () => {
      render(<FullScreenError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Reload Application")).toBeInTheDocument();
    });

    it("should render default support email link", () => {
      render(<FullScreenError error={mockError} reset={mockReset} />);

      const supportLink = screen.getByText("support@apex.io");
      expect(supportLink).toBeInTheDocument();
      expect(supportLink.closest("a")).toHaveAttribute(
        "href",
        "mailto:support@apex.io"
      );
    });

    it("should render APEX logo by default", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const apexText = screen.getByText("APEX");
      expect(apexText).toBeInTheDocument();

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Custom Props", () => {
    it("should render custom title when provided", () => {
      render(
        <FullScreenError
          error={mockError}
          reset={mockReset}
          title="Custom Critical Error Title"
        />
      );

      expect(
        screen.getByText("Custom Critical Error Title")
      ).toBeInTheDocument();
    });

    it("should render custom description when provided", () => {
      render(
        <FullScreenError
          error={mockError}
          reset={mockReset}
          description="Custom critical error description"
        />
      );

      expect(
        screen.getByText("Custom critical error description")
      ).toBeInTheDocument();
    });

    it("should render custom support email when provided", () => {
      render(
        <FullScreenError
          error={mockError}
          reset={mockReset}
          supportEmail="help@example.com"
        />
      );

      const supportLink = screen.getByText("help@example.com");
      expect(supportLink).toBeInTheDocument();
      expect(supportLink.closest("a")).toHaveAttribute(
        "href",
        "mailto:help@example.com"
      );
    });

    it("should hide logo when showLogo is false", () => {
      render(
        <FullScreenError
          error={mockError}
          reset={mockReset}
          showLogo={false}
        />
      );

      expect(screen.queryByText("APEX")).not.toBeInTheDocument();
    });

    it("should show logo when showLogo is true", () => {
      render(
        <FullScreenError error={mockError} reset={mockReset} showLogo={true} />
      );

      expect(screen.getByText("APEX")).toBeInTheDocument();
    });
  });

  describe("Reset Functionality", () => {
    it("should call reset function when Reload Application button is clicked", async () => {
      const user = userEvent.setup();

      render(<FullScreenError error={mockError} reset={mockReset} />);

      const reloadButton = screen.getByText("Reload Application");
      await user.click(reloadButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("should render refresh icon in Reload Application button", () => {
      render(<FullScreenError error={mockError} reset={mockReset} />);

      expect(screen.getByTestId("refresh-icon")).toBeInTheDocument();
    });
  });

  describe("Development Mode Error Details", () => {
    it("should display error message in development mode", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";

      render(<FullScreenError error={mockError} reset={mockReset} />);

      expect(
        screen.getByText("Test critical error message")
      ).toBeInTheDocument();
    });

    it("should display error digest in development mode when present", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";

      render(<FullScreenError error={mockErrorWithDigest} reset={mockReset} />);

      expect(screen.getByText(/Digest: xyz789abc123/)).toBeInTheDocument();
    });

    it("should not display error digest when not present", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";

      render(<FullScreenError error={mockError} reset={mockReset} />);

      expect(screen.queryByText(/Digest:/)).not.toBeInTheDocument();
    });

    it("should hide error details in production mode", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";

      render(<FullScreenError error={mockError} reset={mockReset} />);

      expect(
        screen.queryByText("Test critical error message")
      ).not.toBeInTheDocument();
    });

    it("should hide error digest in production mode", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";

      render(<FullScreenError error={mockErrorWithDigest} reset={mockReset} />);

      expect(screen.queryByText(/Digest:/)).not.toBeInTheDocument();
    });
  });

  describe("Error Logging", () => {
    it("should log critical error to console on mount", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<FullScreenError error={mockError} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Critical application error:",
        mockError
      );

      consoleErrorSpy.mockRestore();
    });

    it("should log error only once per render", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { rerender } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      // Rerender with same error
      rerender(<FullScreenError error={mockError} reset={mockReset} />);

      // Should still be called only once due to useEffect dependency
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });

    it("should log new error when error changes", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const newError = new Error("Different critical error");

      const { rerender } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Critical application error:",
        mockError
      );

      // Rerender with different error
      rerender(<FullScreenError error={newError} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Critical application error:",
        newError
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Layout and Styling", () => {
    it("should render with dark background", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const mainDiv = container.querySelector(".bg-\\[\\#02030A\\]");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should render with full-screen height", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const mainDiv = container.querySelector(".min-h-screen");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should render with centered content", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const mainDiv = container.querySelector(".items-center");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should render background effects", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const backgroundDiv = container.querySelector(".fixed.inset-0.-z-10");
      expect(backgroundDiv).toBeInTheDocument();

      const gradients = container.querySelectorAll(
        ".absolute.rounded-full.blur-3xl"
      );
      expect(gradients.length).toBe(3);
    });
  });

  describe("APEX Branding", () => {
    it("should render APEX logo with gradient", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();

      const path = svg?.querySelector("path");
      expect(path).toHaveAttribute(
        "fill",
        "url(#apexGradFullScreenError)"
      );
    });

    it("should render APEX text with gradient", () => {
      render(<FullScreenError error={mockError} reset={mockReset} />);

      const apexText = screen.getByText("APEX");
      expect(apexText).toHaveClass("bg-gradient-to-r");
      expect(apexText).toHaveClass("from-cyan-400");
      expect(apexText).toHaveClass("to-purple-400");
    });

    it("should render gradient in SVG definition", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const gradient = container.querySelector(
        "#apexGradFullScreenError"
      );
      expect(gradient).toBeInTheDocument();

      const stops = gradient?.querySelectorAll("stop");
      expect(stops).toHaveLength(2);
      expect(stops?.[0]).toHaveAttribute("stop-color", "#00E5CC");
      expect(stops?.[1]).toHaveAttribute("stop-color", "#8B5CF6");
    });
  });

  describe("Edge Cases", () => {
    it("should handle error with empty message", () => {
      const emptyError = new Error("");

      render(<FullScreenError error={emptyError} reset={mockReset} />);

      expect(screen.getByText("Critical Error")).toBeInTheDocument();
    });

    it("should handle error with very long message", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      const longMessage = "Critical Error: ".repeat(100);
      const longError = new Error(longMessage);

      const { container } = render(
        <FullScreenError error={longError} reset={mockReset} />
      );

      // Check that the error message is in the document
      expect(container.textContent).toContain(longMessage);
    });

    it("should handle error with special characters in message", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      const specialError = new Error(
        'Critical error with "quotes" and <special> chars & symbols'
      );

      render(<FullScreenError error={specialError} reset={mockReset} />);

      expect(
        screen.getByText(
          'Critical error with "quotes" and <special> chars & symbols'
        )
      ).toBeInTheDocument();
    });

    it("should handle all custom props together", () => {
      render(
        <FullScreenError
          error={mockError}
          reset={mockReset}
          title="Custom Title"
          description="Custom description text"
          supportEmail="custom@support.com"
          showLogo={false}
        />
      );

      expect(screen.getByText("Custom Title")).toBeInTheDocument();
      expect(screen.getByText("Custom description text")).toBeInTheDocument();
      expect(screen.getByText("custom@support.com")).toBeInTheDocument();
      expect(screen.queryByText("APEX")).not.toBeInTheDocument();
    });
  });

  describe("Button Styling", () => {
    it("should render Reload Application button with gradient styling", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const reloadButton = screen.getByText("Reload Application").closest("button");
      expect(reloadButton).toHaveClass("bg-gradient-to-r");
      expect(reloadButton).toHaveClass("from-cyan-500");
      expect(reloadButton).toHaveClass("to-purple-500");
    });

    it("should render Reload Application button with hover effects", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const reloadButton = screen.getByText("Reload Application").closest("button");
      expect(reloadButton).toHaveClass("hover:from-cyan-400");
      expect(reloadButton).toHaveClass("hover:to-purple-400");
    });

    it("should render Reload Application button with shadow", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const reloadButton = screen.getByText("Reload Application").closest("button");
      expect(reloadButton).toHaveClass("shadow-lg");
      expect(reloadButton).toHaveClass("shadow-purple-500/25");
    });
  });

  describe("Error Icon Styling", () => {
    it("should render error icon with background circle", () => {
      const { container } = render(
        <FullScreenError error={mockError} reset={mockReset} />
      );

      const iconContainer = container.querySelector(".w-20.h-20.rounded-full");
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass("bg-[hsl(var(--error)/0.2)]");
    });
  });

  describe("Support Information", () => {
    it("should render help text with support email", () => {
      render(<FullScreenError error={mockError} reset={mockReset} />);

      expect(
        screen.getByText(/If this problem continues, please contact/)
      ).toBeInTheDocument();
    });

    it("should render support email as a clickable link", async () => {
      const user = userEvent.setup();

      render(<FullScreenError error={mockError} reset={mockReset} />);

      const supportLink = screen.getByText("support@apex.io");
      expect(supportLink.tagName).toBe("A");
      expect(supportLink).toHaveClass("text-cyan-400");
      expect(supportLink).toHaveClass("hover:underline");
    });
  });
});
