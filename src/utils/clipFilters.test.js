import { describe, it, expect } from 'vitest';
import { resolveFilter, filterCss, filterChain, applyFilterToPixel, colorMatrix } from './clipFilters';

describe('clipFilters', () => {
  it('resolves presets and sliders, and treats "no change" as none', () => {
    expect(resolveFilter(null)).toBe(null);
    expect(resolveFilter({ preset: null, brightness: 0, contrast: 0, saturation: 0 })).toBe(null);
    expect(resolveFilter({ preset: 'bw' })).toMatchObject({ saturate: 0, contrast: 1.1, brightness: 1 });
    expect(resolveFilter({ preset: 'vivid', saturation: 50 }).saturate).toBeCloseTo(2.4);
    expect(resolveFilter({ brightness: -100, contrast: 100 })).toMatchObject({ brightness: 0.5, contrast: 1.5 });
  });

  it('writes the CSS filter in the same order as the export', () => {
    expect(filterCss(null)).toBe('');
    expect(filterCss(resolveFilter({ preset: 'bw' }))).toBe('saturate(0) sepia(0) hue-rotate(0deg) brightness(1) contrast(1.1)');
  });

  it('uses the CSS matrices: identity at rest, true grey at zero saturation', () => {
    const id = colorMatrix({ saturate: 1, sepia: 0, hue: 0 });
    id.forEach((row, i) => row.forEach((x, j) => expect(x).toBeCloseTo(i === j ? 1 : 0, 6)));
    const [r, g, b] = applyFilterToPixel(resolveFilter({ preset: 'bw' }), [200, 40, 40]);
    expect(r).toBeCloseTo(g, 6);
    expect(g).toBeCloseTo(b, 6);
  });

  it('applies brightness before contrast, with clamping in between', () => {
    const v = resolveFilter({ brightness: 100, contrast: 100 });
    // 200 * 1.5 = 300 -> 255, then (255 - 127.5) * 1.5 + 127.5 = 318.75 -> 255.
    expect(applyFilterToPixel(v, [200, 200, 200])).toEqual([255, 255, 255]);
    expect(applyFilterToPixel(v, [40, 40, 40])[0]).toBeCloseTo((40 * 1.5 - 127.5) * 1.5 + 127.5);
  });

  // Runs a filterChain the way FFmpeg would: each mixer with clamping, then the curve.
  const runChain = (chain, px) => {
    const clamp = (x) => Math.min(255, Math.max(0, x));
    let out = px;
    for (const [, body] of chain.matchAll(/colorchannelmixer=([^,]+)/g)) {
      const m = Object.fromEntries(body.split(':').map((kv) => kv.split('=')).map(([k, x]) => [k, Number(x)]));
      out = [
        clamp(m.rr * out[0] + m.rg * out[1] + m.rb * out[2]),
        clamp(m.gr * out[0] + m.gg * out[1] + m.gb * out[2]),
        clamp(m.br * out[0] + m.bg * out[1] + m.bb * out[2]),
      ];
    }
    const curve = chain.match(/r='(.*?)'/)[1];
    const run = (val) => Function('val', 'clip', 'min', `return ${curve}`)(val, (x, a, b) => Math.min(b, Math.max(a, x)), Math.min);
    return out.map(run);
  };

  it('builds FFmpeg mixers and a curve that compute the same pixel', () => {
    for (const filter of [{ preset: 'vintage', contrast: 20 }, { preset: 'deepfried' }, { preset: 'noir', saturation: 40 }]) {
      const v = resolveFilter(filter);
      const chain = filterChain(v);
      expect(chain.startsWith(',colorchannelmixer=rr=') || chain.startsWith(',lutrgb=')).toBe(true);
      const px = [90, 140, 200];
      const ffmpeg = runChain(chain, px);
      applyFilterToPixel(v, px).forEach((x, i) => expect(ffmpeg[i]).toBeCloseTo(x, 0));
    }
  });

  it('keeps every mixer coefficient inside FFmpeg\'s -2..2 range, even for deep fried', () => {
    const chain = filterChain(resolveFilter({ preset: 'deepfried', saturation: 100 }));
    const coefficients = [...chain.matchAll(/(?:rr|rg|rb|gr|gg|gb|br|bg|bb)=(-?[\d.]+)/g)].map(([, x]) => Number(x));
    expect(coefficients.length).toBeGreaterThan(9);
    coefficients.forEach((x) => expect(Math.abs(x)).toBeLessThanOrEqual(2));
  });
});
