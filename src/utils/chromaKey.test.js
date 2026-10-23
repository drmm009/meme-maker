import { describe, it, expect } from 'vitest';
import { rgbToUV, keyAlpha, applyChromaKey, sampleKeyColor, chromaKeyFilter, spillChannel, DEFAULT_CHROMA_KEY, suggestTolerance, keySaturation } from './chromaKey';

const GREEN_UV = rgbToUV(0, 255, 0);
const { similarity, blend } = DEFAULT_CHROMA_KEY;

describe('keyAlpha', () => {
  it('removes the key colour and nearby greens', () => {
    expect(keyAlpha(0, 255, 0, GREEN_UV, similarity, blend)).toBe(0);
    expect(keyAlpha(40, 200, 40, GREEN_UV, similarity, blend)).toBe(0);
  });

  it('keeps skin, white, black and red fully opaque', () => {
    for (const px of [[220, 170, 140], [255, 255, 255], [0, 0, 0], [220, 30, 30]]) {
      expect(keyAlpha(...px, GREEN_UV, similarity, blend)).toBe(1);
    }
  });

  it('ramps across the blend band and is a hard cut without blend', () => {
    const a = keyAlpha(90, 180, 90, GREEN_UV, 0.2, 0.2);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(1);
    expect([0, 1]).toContain(keyAlpha(90, 180, 90, GREEN_UV, 0.2, 0));
  });
});

describe('applyChromaKey', () => {
  it('clears the screen and pulls green spill off the subject', () => {
    const data = new Uint8ClampedArray([0, 255, 0, 255, 200, 230, 180, 255]);
    applyChromaKey(data, DEFAULT_CHROMA_KEY);
    expect(data[3]).toBe(0);
    expect(data[7]).toBe(255);
    expect(data[5]).toBe(190);
  });
});

describe('sampleKeyColor', () => {
  const frame = (w, h, corner, middle) => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const edge = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
      data.set([...(edge ? corner : middle), 255], (y * w + x) * 4);
    }
    return data;
  };

  it('finds the screen colour from the corners', () => {
    expect(sampleKeyColor(frame(40, 40, [20, 210, 30], [200, 150, 120]), 40, 40)).toBe('#14d21e');
  });

  it('falls back to pure green when the corners are not a screen', () => {
    expect(sampleKeyColor(frame(40, 40, [250, 250, 250], [0, 255, 0]), 40, 40)).toBe('#00ff00');
  });
});

describe('chromaKeyFilter', () => {
  it('builds chromakey plus despill for green and blue screens', () => {
    expect(chromaKeyFilter(null)).toBe('');
    expect(chromaKeyFilter({ color: '#14d21e', similarity: 0.22, blend: 0.08 }))
      .toBe(',format=yuva420p,chromakey=0x14D21E:0.220:0.080,despill=type=green');
    expect(chromaKeyFilter({ color: '#1030f0', similarity: 0.3, blend: 0 })).toContain('despill=type=blue');
    expect(spillChannel('#ff00ff')).toBe(null);
  });
});

describe('auto colour', () => {
  it('treats an unsampled auto colour as pure green', () => {
    expect(chromaKeyFilter({ color: 'auto', similarity: 0.2, blend: 0.1 })).toContain('chromakey=0x00FF00');
    const data = new Uint8ClampedArray([0, 255, 0, 255]);
    applyChromaKey(data, { color: 'auto', similarity: 0.2, blend: 0.1 });
    expect(data[3]).toBe(0);
  });
});

describe('suggestTolerance', () => {
  it('keeps neutral colours solid on a dull green screen while keying the screen', () => {
    const color = '#07c003';
    const { similarity, blend } = suggestTolerance(color);
    const keyUV = rgbToUV(7, 192, 3);
    expect(keyAlpha(30, 20, 20, keyUV, similarity, blend)).toBe(1);
    expect(keyAlpha(128, 128, 128, keyUV, similarity, blend)).toBe(1);
    expect(keyAlpha(20, 185, 15, keyUV, similarity, blend)).toBe(0);
    expect(keySaturation('#00ff00')).toBeGreaterThan(keySaturation(color));
  });
});
