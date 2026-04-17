/**
 * @vitest-environment jsdom
 *
 * ApexWordmark tests — verifies the component reads `name` and the
 * optional `wordmarkSuffix` from the active brand preset.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const brandMock = vi.fn();
vi.mock("@/config/brand-presets", () => ({
  getActiveBrand: () => brandMock(),
}));

import { ApexWordmark } from "../apex-logo";

describe("ApexWordmark", () => {
  beforeEach(() => {
    brandMock.mockReset();
  });

  it("renders 'Apex' + accented 'GEO' when wordmarkSuffix is set", () => {
    brandMock.mockReturnValue({
      name: "Apex",
      wordmarkSuffix: "GEO",
      tagline: "",
      cssFile: "apex.css",
      logoUrl: "",
      logoDarkUrl: "",
      faviconUrl: "",
    });
    render(<ApexWordmark />);
    expect(screen.getByText("Apex")).toBeInTheDocument();
    expect(screen.getByText("GEO")).toBeInTheDocument();
  });

  it("renders only the brand name when wordmarkSuffix is absent", () => {
    brandMock.mockReturnValue({
      name: "Solstice",
      tagline: "",
      cssFile: "solstice.css",
      logoUrl: "",
      logoDarkUrl: "",
      faviconUrl: "",
    });
    render(<ApexWordmark />);
    expect(screen.getByText("Solstice")).toBeInTheDocument();
    // No 'GEO' — Apex-specific suffix shouldn't appear on a Solstice build
    expect(screen.queryByText("GEO")).not.toBeInTheDocument();
  });

  it("applies the passed className to the outer span", () => {
    brandMock.mockReturnValue({
      name: "Apex",
      wordmarkSuffix: "GEO",
      tagline: "",
      cssFile: "apex.css",
      logoUrl: "",
      logoDarkUrl: "",
      faviconUrl: "",
    });
    const { container } = render(<ApexWordmark className="custom-class" />);
    const outer = container.querySelector("span");
    expect(outer?.className).toContain("custom-class");
    expect(outer?.className).toContain("font-bold");
  });
});
