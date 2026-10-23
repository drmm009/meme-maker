import { describe, it, expect } from 'vitest';
import { getCanvasSize, getBandHeight, makeLayerCenters } from './canvasLayout';

// 10px per character, like the wrapText tests.
const ctx = { font: '', measureText: (s) => ({ width: s.length * 10 }) };

describe('getCanvasSize', () => {
  it('normalizes preset ratios so the long side is 1080', () => {
    expect(getCanvasSize('16:9')).toEqual({ canvasW: 1080, canvasH: 608 });
    expect(getCanvasSize('9:16')).toEqual({ canvasW: 608, canvasH: 1080 });
    expect(getCanvasSize('4:5')).toEqual({ canvasW: 864, canvasH: 1080 });
    expect(getCanvasSize('1:1')).toEqual({ canvasW: 1080, canvasH: 1080 });
  });

  it('follows the template, then the loaded image, for "original"', () => {
    expect(getCanvasSize('original', { width: 500, height: 250 }, { w: 1, h: 1 })).toEqual({ canvasW: 1080, canvasH: 540 });
    expect(getCanvasSize('original', null, { w: 300, h: 600 })).toEqual({ canvasW: 540, canvasH: 1080 });
  });
});

describe('getBandHeight', () => {
  it('is 0 when the band is off and the band height without a caption', () => {
    expect(getBandHeight({ enabled: false, height: 300 }, null, 1080, ctx)).toBe(0);
    expect(getBandHeight({ enabled: true, height: 200 }, null, 1080, ctx)).toBe(200);
    expect(getBandHeight({ enabled: true }, null, 1080, ctx)).toBe(140);
  });

  it('grows with the number of wrapped caption lines', () => {
    const band = { enabled: true };
    // fontSize 50: line height 67.5, padding 30 each side.
    const one = getBandHeight(band, { text: 'short', fontSize: 50 }, 1080, ctx);
    const three = getBandHeight(band, { text: 'word '.repeat(60).trim(), fontSize: 50, width: 0.5 }, 1080, ctx);
    expect(one).toBe(128);
    expect(three).toBeGreaterThan(one);
  });

  it('never drops below 110px', () => {
    expect(getBandHeight({ enabled: true }, { text: 'x', fontSize: 10 }, 1080, ctx)).toBe(110);
  });
});

describe('makeLayerCenters', () => {
  const { getCaptionCenterY, getStickerCenterY, getImageLayerCenterY } = makeLayerCenters({
    canvasRef: { current: null }, canvasW: 1000, canvasH: 800, headerExtH: 100, footerExtH: 60, totalCanvasH: 960,
  });

  it('places image-area layers below the header band', () => {
    expect(getStickerCenterY({ y: 0.5 })).toBe(500);
    expect(getImageLayerCenterY({ y: 0 })).toBe(100);
    expect(getCaptionCenterY({ y: 0.25 })).toBe(300);
    expect(getCaptionCenterY({})).toBe(500);
  });

  it('centres header and footer captions in their bands unless moved', () => {
    expect(getCaptionCenterY({ isHeaderCaption: true })).toBe(50);
    expect(getCaptionCenterY({ isFooterCaption: true })).toBe(930);
    expect(getCaptionCenterY({ isHeaderCaption: true, hasCustomPos: true, y: 0.5 })).toBe(480);
  });
});
