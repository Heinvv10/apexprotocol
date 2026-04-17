import { describe, it, expect, afterEach } from 'vitest';
import { BRAND_PRESETS, getActiveBrand, isBrandPresetKey } from '@/config/brand-presets';

describe('brand-presets', () => {
  const original = process.env.NEXT_PUBLIC_BRAND_PRESET;
  afterEach(() => {
    process.env.NEXT_PUBLIC_BRAND_PRESET = original;
  });

  it('defaults to apex when env is unset', () => {
    delete process.env.NEXT_PUBLIC_BRAND_PRESET;
    expect(getActiveBrand().name).toBe('Apex');
  });

  it('defaults to apex when env is invalid', () => {
    process.env.NEXT_PUBLIC_BRAND_PRESET = 'not-a-brand';
    expect(getActiveBrand().name).toBe('Apex');
  });

  it('isBrandPresetKey correctly guards keys', () => {
    expect(isBrandPresetKey('apex')).toBe(true);
    expect(isBrandPresetKey('nope')).toBe(false);
  });

  it('every preset has required fields', () => {
    for (const key of Object.keys(BRAND_PRESETS)) {
      const preset = BRAND_PRESETS[key as keyof typeof BRAND_PRESETS];
      expect(preset.name).toBeTruthy();
      expect(preset.cssFile).toMatch(/\.css$/);
      expect(preset.logoUrl).toMatch(/^\/brands\//);
    }
  });
});
