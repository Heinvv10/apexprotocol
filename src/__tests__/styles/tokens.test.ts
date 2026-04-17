import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string): string => {
  const full = resolve(process.cwd(), p);
  if (!existsSync(full)) throw new Error(`Missing CSS file: ${p}`);
  return readFileSync(full, 'utf8');
};

const hasVar = (css: string, name: string): boolean =>
  new RegExp(`--${name}\\s*:`).test(css);

describe('styles/tokens — structural contract', () => {
  it('tokens/typography.css defines font + type-scale vars', () => {
    const css = read('src/styles/tokens/typography.css');
    expect(hasVar(css, 'font-sans')).toBe(true);
    expect(hasVar(css, 'font-mono')).toBe(true);
    expect(hasVar(css, 'text-display-xl')).toBe(true);
    expect(hasVar(css, 'text-body')).toBe(true);
  });

  it('tokens/spacing.css defines space-1 through space-16', () => {
    const css = read('src/styles/tokens/spacing.css');
    for (const n of [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]) {
      expect(hasVar(css, `space-${n}`)).toBe(true);
    }
  });

  it('tokens/radii.css defines radius tokens', () => {
    const css = read('src/styles/tokens/radii.css');
    expect(hasVar(css, 'radius')).toBe(true);
  });

  it('tokens/motion.css defines duration + easing', () => {
    const css = read('src/styles/tokens/motion.css');
    expect(hasVar(css, 'duration-fast')).toBe(true);
    expect(hasVar(css, 'ease-default')).toBe(true);
  });

  it('tokens/focus.css defines focus-ring system', () => {
    const css = read('src/styles/tokens/focus.css');
    expect(hasVar(css, 'focus-ring-primary')).toBe(true);
    expect(hasVar(css, 'focus-ring-width-default')).toBe(true);
  });

  it('themes/brand/apex.css defines the Apex palette (Layer 1)', () => {
    const css = read('src/styles/themes/brand/apex.css');
    expect(hasVar(css, 'palette-cyan-500')).toBe(true);
    expect(hasVar(css, 'palette-purple-500')).toBe(true);
    expect(hasVar(css, 'palette-neutral-900')).toBe(true);
  });

  it('themes/dark.css maps semantic tokens to palette primitives', () => {
    const css = read('src/styles/themes/dark.css');
    expect(hasVar(css, 'color-primary')).toBe(true);
    expect(hasVar(css, 'color-surface-deep')).toBe(true);
    expect(hasVar(css, 'color-foreground')).toBe(true);
    // Semantic tokens reference primitives, not literal values:
    expect(/--color-primary\s*:\s*var\(--palette-/.test(css)).toBe(true);
  });

  it('themes/light.css pairs every semantic token from dark.css', () => {
    const dark = read('src/styles/themes/dark.css');
    const light = read('src/styles/themes/light.css');
    const semanticVars = Array.from(
      dark.matchAll(/--(color-[a-z0-9-]+)\s*:/g),
      (m) => m[1]
    );
    for (const v of semanticVars) {
      expect(hasVar(light, v)).toBe(true);
    }
  });

  it('components/cards.css defines the 3-tier card system', () => {
    const css = read('src/styles/components/cards.css');
    expect(/\.card-primary\b/.test(css)).toBe(true);
    expect(/\.card-secondary\b/.test(css)).toBe(true);
    expect(/\.card-tertiary\b/.test(css)).toBe(true);
  });

  it('styles/index.css imports tokens, themes, components in order', () => {
    const css = read('src/styles/index.css');
    const lines = css.split('\n');
    const tokensIdx = lines.findIndex((l) => l.includes('tokens/index.css'));
    const themesIdx = lines.findIndex((l) => l.includes('themes/dark.css'));
    const componentsIdx = lines.findIndex((l) => l.includes('components'));
    expect(tokensIdx).toBeGreaterThan(-1);
    expect(themesIdx).toBeGreaterThan(-1);
    expect(componentsIdx).toBeGreaterThan(-1);
    expect(tokensIdx).toBeLessThan(themesIdx);
    expect(themesIdx).toBeLessThan(componentsIdx);
  });
});
