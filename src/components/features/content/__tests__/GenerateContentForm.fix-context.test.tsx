/**
 * @vitest-environment jsdom
 *
 * Fix-Now context wiring for GenerateContentForm.
 *
 * Regression guard for the dead-end button discovered on 2026-04-24:
 * /dashboard/audit's "Fix Now" button was navigating to
 * /dashboard/create?context=... but no page consumed the param.
 * Wiring is now /dashboard/create/generate?context=... → this form.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GenerateContentForm from "../GenerateContentForm";

// Prevent the streaming fetch from firing during render-only assertions
vi.stubGlobal("fetch", vi.fn());

describe("GenerateContentForm — Fix Now context", () => {
  it("renders the context banner when initialContext is provided", () => {
    render(
      <GenerateContentForm
        initialContext={{
          recommendation:
            "Add FAQPage schema to pages with FAQ content for AI visibility",
          auditUrl: "https://crankmart.com",
          category: "schema",
          issues: [
            {
              title: "No FAQ Schema Found",
              type: "missing_faq_schema",
              category: "schema",
              severity: "high",
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId("fix-context-banner")).toBeInTheDocument();
    expect(screen.getByText(/Add FAQPage schema/i)).toBeInTheDocument();
    expect(screen.getByText(/crankmart\.com/)).toBeInTheDocument();
  });

  it("picks 'faq' content type when the recommendation mentions FAQ", () => {
    render(
      <GenerateContentForm
        initialContext={{
          recommendation: "Add FAQ section with top user questions",
          auditUrl: "https://crankmart.com",
          category: "content",
        }}
      />
    );

    const select = screen.getByLabelText(/Content Type/i) as HTMLSelectElement;
    expect(select.value).toBe("faq");
  });

  it("derives keywords from the recommendation text", () => {
    render(
      <GenerateContentForm
        initialContext={{
          recommendation:
            "Simplify language, shorten paragraphs, use shorter words",
          auditUrl: "https://crankmart.com",
          category: "content",
        }}
      />
    );

    // At least one keyword chip from the recommendation vocabulary
    const keywordRegex = /(simplify|language|shorten|paragraphs|shorter|words)/i;
    expect(screen.getAllByText(keywordRegex).length).toBeGreaterThan(0);
  });

  it("falls back to category when recommendation yields no keywords", () => {
    render(
      <GenerateContentForm
        initialContext={{
          recommendation: "Fix it",
          auditUrl: "https://crankmart.com",
          category: "schema",
        }}
      />
    );

    // Generator requires min 1 keyword — we must never leave the form unsubmittable.
    // The keyword chip lives inside the keyword section (not the banner's category label),
    // so scope the query to an element that has the chip styling.
    const chips = document.querySelectorAll('span.rounded-full');
    const chipTexts = Array.from(chips).map((c) => c.textContent?.trim() ?? '');
    expect(chipTexts.some((t) => t.includes('schema'))).toBe(true);
  });

  it("falls back to hostname when recommendation+category yield nothing", () => {
    render(
      <GenerateContentForm
        initialContext={{
          recommendation: "Fix it",
          auditUrl: "https://www.crankmart.com/about",
        }}
      />
    );

    const chips = document.querySelectorAll('span.rounded-full');
    const chipTexts = Array.from(chips).map((c) => c.textContent?.trim() ?? '');
    expect(chipTexts.some((t) => t.includes('crankmart.com'))).toBe(true);
  });

  it("omits the banner when no initialContext is provided", () => {
    render(<GenerateContentForm />);
    expect(screen.queryByTestId("fix-context-banner")).not.toBeInTheDocument();
  });
});
