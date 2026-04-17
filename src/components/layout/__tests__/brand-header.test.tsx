/**
 * @vitest-environment jsdom
 *
 * BrandHeader tests — verifies wordmark derivation from the active brand
 * preset, the optional suffix, the AI-status indicator, and custom
 * rightSlot. Mocks getActiveBrand to isolate from env.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const brandMock = vi.fn();
vi.mock("@/config/brand-presets", () => ({
  getActiveBrand: () => brandMock(),
}));

import { BrandHeader } from "../brand-header";

describe("BrandHeader", () => {
  beforeEach(() => {
    brandMock.mockReturnValue({
      name: "Apex",
      tagline: "",
      cssFile: "apex.css",
      logoUrl: "",
      logoDarkUrl: "",
      faviconUrl: "",
    });
  });

  it("renders the uppercased brand name as the wordmark", () => {
    render(<BrandHeader pageName="Monitor" />);
    expect(screen.getByText("APEX")).toBeInTheDocument();
    expect(screen.getByText("Monitor")).toBeInTheDocument();
  });

  it("shows the AI Status indicator by default", () => {
    render(<BrandHeader pageName="Audit" />);
    expect(screen.getByText("AI Status:")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("hides the AI Status indicator when aiStatus={false}", () => {
    render(<BrandHeader pageName="Monitor" aiStatus={false} />);
    expect(screen.queryByText("AI Status:")).not.toBeInTheDocument();
  });

  it("renders a custom rightSlot alongside the AI Status", () => {
    render(
      <BrandHeader
        pageName="Monitor"
        rightSlot={<span data-testid="live-badge">LIVE</span>}
      />
    );
    expect(screen.getByTestId("live-badge")).toBeInTheDocument();
    expect(screen.getByText("AI Status:")).toBeInTheDocument();
  });

  it("shows Offline label when aiStatus.active is false", () => {
    render(
      <BrandHeader pageName="Monitor" aiStatus={{ active: false }} />
    );
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("reflects a different active brand — Solstice", () => {
    brandMock.mockReturnValue({
      name: "Solstice",
      tagline: "",
      cssFile: "solstice.css",
      logoUrl: "",
      logoDarkUrl: "",
      faviconUrl: "",
    });
    render(<BrandHeader pageName="Monitor" />);
    expect(screen.getByText("SOLSTICE")).toBeInTheDocument();
    expect(screen.queryByText("APEX")).not.toBeInTheDocument();
  });
});
