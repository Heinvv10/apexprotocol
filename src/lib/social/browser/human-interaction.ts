/**
 * Human-like interaction primitives for puppeteer.
 *
 * Goal: defeat the cheapest forms of bot detection (instant paste, zero
 * mouse movement, sub-millisecond click latency). Not a silver bullet —
 * platforms with serious behavioural fingerprinting will still flag this —
 * but enough to avoid the obvious automation tells.
 */

import type { KeyInput, Page } from "puppeteer";

/** Sleep for a random duration in [minMs, maxMs]. */
export function dwell(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(minMs + Math.random() * (maxMs - minMs));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Type into the focused element with randomized inter-key delays.
 * Pauses slightly longer at word boundaries to mimic human cadence.
 */
export async function humanType(
  page: Page,
  selector: string,
  text: string,
): Promise<void> {
  await page.waitForSelector(selector, { visible: true });
  await page.focus(selector);
  await dwell(80, 200);
  for (const char of text) {
    await page.keyboard.type(char);
    if (char === " ") {
      await dwell(120, 280);
    } else {
      await dwell(35, 110);
    }
  }
  await dwell(150, 400);
}

/**
 * Hover briefly, then click. Mimics the gap between mouse arriving and the
 * actual click happening — Selenium-style instant clicks are a tell.
 */
export async function humanClick(page: Page, selector: string): Promise<void> {
  await page.waitForSelector(selector, { visible: true });
  await page.hover(selector);
  await dwell(80, 220);
  await page.click(selector);
  await dwell(150, 400);
}

/**
 * Scroll the page by `distance` pixels in small steps with pauses between
 * them. Smooth scrolls look more human than instant jumps.
 */
export async function humanScroll(page: Page, distance: number): Promise<void> {
  const steps = Math.max(3, Math.ceil(Math.abs(distance) / 200));
  const stepSize = distance / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((dy: number) => {
      window.scrollBy(0, dy);
    }, stepSize);
    await dwell(80, 220);
  }
}

/**
 * Press a single key (e.g. "Enter", "Escape") with a small pre-delay so
 * it doesn't fire on the same tick as the previous action.
 */
export async function humanKey(page: Page, key: KeyInput): Promise<void> {
  await dwell(120, 280);
  await page.keyboard.press(key);
  await dwell(150, 400);
}
