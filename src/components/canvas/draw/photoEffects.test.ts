import { describe, it, expect } from 'vitest';
import { hasPhotoEffects, sharpenPixels, warmPixels } from './photoEffects';

const px = (r: number, g: number, b: number) => new Uint8ClampedArray([r, g, b, 255]);

describe('photo effects', () => {
  it('knows when there is anything to do', () => {
    expect(hasPhotoEffects({})).toBe(false);
    expect(hasPhotoEffects({ warmth: -20 })).toBe(true);
    expect(hasPhotoEffects({ vignette: 10 })).toBe(true);
    expect(hasPhotoEffects(null)).toBe(false);
  });

  it('warms towards orange and cools towards blue', () => {
    const warm = px(100, 100, 100);
    warmPixels(warm, 100);
    expect(warm[0]).toBeGreaterThan(100);
    expect(warm[2]).toBeLessThan(100);
    const cool = px(100, 100, 100);
    warmPixels(cool, -100);
    expect(cool[0]).toBeLessThan(100);
    expect(cool[2]).toBeGreaterThan(100);
  });

  it('sharpens an edge: a bright dot gets brighter, flat areas stay put', () => {
    const w = 3;
    const h = 3;
    const data = new Uint8ClampedArray(w * h * 4).fill(100);
    data[(1 * w + 1) * 4] = 150;
    sharpenPixels(data, w, h, 100);
    expect(data[(1 * w + 1) * 4]).toBeGreaterThan(150);
    expect(data[(1 * w + 1) * 4 + 1]).toBe(100);
    expect(data[0]).toBe(100);
  });
});
