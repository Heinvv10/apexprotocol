import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkPageSpeed } from "./pagespeed-check";

const sampleSuccess = {
  lighthouseResult: {
    audits: {
      "first-contentful-paint": { numericValue: 1423.5 },
      "largest-contentful-paint": { numericValue: 2871.9 },
      "total-blocking-time": { numericValue: 187.3 },
      "cumulative-layout-shift": { numericValue: 0.0421 },
      "speed-index": { numericValue: 2645.1 },
      "server-response-time": { numericValue: 312.8 },
    },
  },
};

describe("checkPageSpeed", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses PSI Lighthouse audits into rounded metrics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(sampleSuccess), { status: 200 })
      )
    );
    const result = await checkPageSpeed("https://example.com");
    expect(result).toEqual({
      firstContentfulPaint: 1424,
      largestContentfulPaint: 2872,
      totalBlockingTime: 187,
      cumulativeLayoutShift: 0.042,
      speedIndex: 2645,
      responseTime: 313,
    });
  });

  it("returns null on HTTP errors (429, 500, etc.)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 429 }))
    );
    const result = await checkPageSpeed("https://example.com");
    expect(result).toBeNull();
  });

  it("returns null when PSI returns no lighthouseResult", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      )
    );
    const result = await checkPageSpeed("https://example.com");
    expect(result).toBeNull();
  });

  it("returns null on network failure / abort", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNRESET"))
    );
    const result = await checkPageSpeed("https://example.com");
    expect(result).toBeNull();
  });

  it("passes GOOGLE_PAGESPEED_API_KEY when set", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(sampleSuccess), { status: 200 })
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("GOOGLE_PAGESPEED_API_KEY", "test-key-xyz");

    await checkPageSpeed("https://example.com");

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("key=test-key-xyz");
  });

  it("defensively handles non-numeric audit values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            lighthouseResult: {
              audits: {
                "first-contentful-paint": {},
                "largest-contentful-paint": { numericValue: null },
                "cumulative-layout-shift": { numericValue: NaN },
              },
            },
          }),
          { status: 200 }
        )
      )
    );
    const result = await checkPageSpeed("https://example.com");
    expect(result).toEqual({
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      totalBlockingTime: 0,
      cumulativeLayoutShift: 0,
      speedIndex: 0,
      responseTime: 0,
    });
  });
});
