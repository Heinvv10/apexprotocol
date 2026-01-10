/**
 * @vitest-environment jsdom
 *
 * PageError Component Tests
 *
 * Tests for the PageError component that displays route-level errors
 * with customizable navigation options and error details.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Home: () => <div data-testid="home-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    variant,
    asChild,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    asChild?: boolean;
    className?: string;
  }) => {
    if (asChild) {
      return <div className={className}>{children}</div>;
    }
    return (
      <button
        onClick={onClick}
        data-variant={variant}
        className={className}
        data-testid={`button-${variant || "default"}`}
      >
        {children}
      </button>
    );
  },
}));

// Import component AFTER mocking
import { PageError } from "../error-boundary";

// Sample error objects
const mockError = new Error("Test error message");
const mockErrorWithDigest = Object.assign(new Error("Test error with digest"), {
  digest: "abc123def456",
});

// Store original NODE_ENV
const originalEnv = process.env.NODE_ENV;

describe("PageError Component", () => {
  const mockReset = vi.fn();
  const mockHistoryBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.history.back
    Object.defineProperty(window, "history", {
      value: { back: mockHistoryBack },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  describe("Rendering with Default Props", () => {
    it("should render the component with default title", () => {
      render(<PageError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should render with default description", () => {
      render(<PageError error={mockError} reset={mockReset} />);

      expect(
        screen.getByText(
          /We encountered an unexpected error. Don't worry, your data is safe./
        )
      ).toBeInTheDocument();
    });

    it("should render error icon", () => {
      render(<PageError error={mockError} reset={mockReset} />);

      expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
    });

    it("should render Try Again button", () => {
      render(<PageError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should render Go to Dashboard button by default", () => {
      render(<PageError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
    });

    it("should render support email link", () => {
      render(<PageError error={mockError} reset={mockReset} />);

      const supportLink = screen.getByText("contact support");
      expect(supportLink).toBeInTheDocument();
      expect(supportLink.closest("a")).toHaveAttribute(
        "href",
        "mailto:support@apex.io"
      );
    });
  });

  describe("Custom Props", () => {
    it("should render custom title when provided", () => {
      render(
        <PageError
          error={mockError}
          reset={mockReset}
          title="Custom Error Title"
        />
      );

      expect(screen.getByText("Custom Error Title")).toBeInTheDocument();
    });

    it("should render custom description when provided", () => {
      render(
        <PageError
          error={mockError}
          reset={mockReset}
          description="Custom error description"
        />
      );

      expect(screen.getByText("Custom error description")).toBeInTheDocument();
    });

    it("should use custom homeHref when provided", () => {
      render(
        <PageError
          error={mockError}
          reset={mockReset}
          homeHref="/custom-home"
        />
      );

      const homeLink = screen.getByText("Go to Dashboard").closest("a");
      expect(homeLink).toHaveAttribute("href", "/custom-home");
    });
  });

  describe("Navigation Buttons", () => {
    it("should show home button when showHomeButton is true", () => {
      render(
        <PageError error={mockError} reset={mockReset} showHomeButton={true} />
      );

      expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
    });

    it("should hide home button when showHomeButton is false", () => {
      render(
        <PageError error={mockError} reset={mockReset} showHomeButton={false} />
      );

      expect(screen.queryByText("Go to Dashboard")).not.toBeInTheDocument();
    });

    it("should show back button when showBackButton is true", () => {
      render(
        <PageError error={mockError} reset={mockReset} showBackButton={true} />
      );

      expect(screen.getByText("Go Back")).toBeInTheDocument();
    });

    it("should hide back button when showBackButton is false", () => {
      render(
        <PageError error={mockError} reset={mockReset} showBackButton={false} />
      );

      expect(screen.queryByText("Go Back")).not.toBeInTheDocument();
    });

    it("should call window.history.back when back button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <PageError error={mockError} reset={mockReset} showBackButton={true} />
      );

      const backButton = screen.getByText("Go Back");
      await user.click(backButton);

      expect(mockHistoryBack).toHaveBeenCalled();
    });

    it("should show both home and back buttons when both are enabled", () => {
      render(
        <PageError
          error={mockError}
          reset={mockReset}
          showHomeButton={true}
          showBackButton={true}
        />
      );

      expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Go Back")).toBeInTheDocument();
    });
  });

  describe("Reset Functionality", () => {
    it("should call reset function when Try Again button is clicked", async () => {
      const user = userEvent.setup();

      render(<PageError error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByText("Try Again");
      await user.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("should render refresh icon in Try Again button", () => {
      render(<PageError error={mockError} reset={mockReset} />);

      expect(screen.getByTestId("refresh-icon")).toBeInTheDocument();
    });
  });

  describe("Development Mode Error Details", () => {
    it("should display error message in development mode", () => {
      process.env.NODE_ENV = "development";

      render(<PageError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should display error digest in development mode when present", () => {
      process.env.NODE_ENV = "development";

      render(<PageError error={mockErrorWithDigest} reset={mockReset} />);

      expect(screen.getByText(/Digest: abc123def456/)).toBeInTheDocument();
    });

    it("should not display error digest when not present", () => {
      process.env.NODE_ENV = "development";

      render(<PageError error={mockError} reset={mockReset} />);

      expect(screen.queryByText(/Digest:/)).not.toBeInTheDocument();
    });

    it("should hide error details in production mode", () => {
      process.env.NODE_ENV = "production";

      render(<PageError error={mockError} reset={mockReset} />);

      expect(screen.queryByText("Test error message")).not.toBeInTheDocument();
    });

    it("should hide error digest in production mode", () => {
      process.env.NODE_ENV = "production";

      render(<PageError error={mockErrorWithDigest} reset={mockReset} />);

      expect(screen.queryByText(/Digest:/)).not.toBeInTheDocument();
    });
  });

  describe("Error Logging", () => {
    it("should log error to console on mount", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<PageError error={mockError} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Page error:", mockError);

      consoleErrorSpy.mockRestore();
    });

    it("should log error only once per render", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { rerender } = render(
        <PageError error={mockError} reset={mockReset} />
      );

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      // Rerender with same error
      rerender(<PageError error={mockError} reset={mockReset} />);

      // Should still be called only once due to useEffect dependency
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });

    it("should log new error when error changes", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const newError = new Error("Different error");

      const { rerender } = render(
        <PageError error={mockError} reset={mockReset} />
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith("Page error:", mockError);

      // Rerender with different error
      rerender(<PageError error={newError} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Page error:", newError);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Layout and Styling", () => {
    it("should render with dashboard background", () => {
      const { container } = render(
        <PageError error={mockError} reset={mockReset} />
      );

      const mainDiv = container.querySelector(".dashboard-bg");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should render with card-secondary styling", () => {
      const { container } = render(
        <PageError error={mockError} reset={mockReset} />
      );

      const card = container.querySelector(".card-secondary");
      expect(card).toBeInTheDocument();
    });

    it("should render with full-screen height", () => {
      const { container } = render(
        <PageError error={mockError} reset={mockReset} />
      );

      const mainDiv = container.querySelector(".min-h-screen");
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe("Icons", () => {
    it("should render home icon when home button is shown", () => {
      render(
        <PageError error={mockError} reset={mockReset} showHomeButton={true} />
      );

      expect(screen.getByTestId("home-icon")).toBeInTheDocument();
    });

    it("should render arrow left icon when back button is shown", () => {
      render(
        <PageError error={mockError} reset={mockReset} showBackButton={true} />
      );

      expect(screen.getByTestId("arrow-left-icon")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle error with empty message", () => {
      const emptyError = new Error("");

      render(<PageError error={emptyError} reset={mockReset} />);

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should handle error with very long message", () => {
      process.env.NODE_ENV = "development";
      const longMessage = "Error: ".repeat(100);
      const longError = new Error(longMessage);

      const { container } = render(
        <PageError error={longError} reset={mockReset} />
      );

      // Check that the error message is in the document
      expect(container.textContent).toContain(longMessage);
    });

    it("should handle error with special characters in message", () => {
      process.env.NODE_ENV = "development";
      const specialError = new Error(
        'Error with "quotes" and <special> chars & symbols'
      );

      render(<PageError error={specialError} reset={mockReset} />);

      expect(
        screen.getByText('Error with "quotes" and <special> chars & symbols')
      ).toBeInTheDocument();
    });

    it("should render all navigation options simultaneously", () => {
      render(
        <PageError
          error={mockError}
          reset={mockReset}
          showHomeButton={true}
          showBackButton={true}
        />
      );

      expect(screen.getByText("Try Again")).toBeInTheDocument();
      expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Go Back")).toBeInTheDocument();
    });
  });

  describe("Button Variants", () => {
    it("should render Try Again button with gradient-primary class", () => {
      const { container } = render(
        <PageError error={mockError} reset={mockReset} />
      );

      const tryAgainButton = screen.getByText("Try Again").closest("button");
      expect(tryAgainButton).toHaveClass("gradient-primary");
    });

    it("should render back button with outline variant", () => {
      render(
        <PageError error={mockError} reset={mockReset} showBackButton={true} />
      );

      const backButton = screen.getByText("Go Back").closest("button");
      expect(backButton).toHaveAttribute("data-variant", "outline");
    });
  });
});
