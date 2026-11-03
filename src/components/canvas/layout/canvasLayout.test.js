import { describe, it, expect } from 'vitest';
import { bandColor, fitBandsToFrame, fitCaptionsToBands, getCanvasSize, getBandHeight, makeLayerCenters } from './canvasLayout';

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

describe('fitBandsToFrame', () => {
  it('original: the bands add to the image', () => {
    expect(fitBandsToFrame('original', 800, 140, 100)).toEqual({ imageH: 800, headerH: 140, footerH: 100, totalH: 1040 });
  });

  it('a set aspect ratio: the whole canvas keeps its height, the image area giving the bands room', () => {
    expect(fitBandsToFrame('1:1', 1080, 140, 100)).toEqual({ imageH: 840, headerH: 140, footerH: 100, totalH: 1080 });
    expect(fitBandsToFrame('9:16', 1080, 0, 0)).toEqual({ imageH: 1080, headerH: 0, footerH: 0, totalH: 1080 });
  });

  it('bands too tall for the frame shrink together, leaving the image 40%', () => {
    const fit = fitBandsToFrame('16:9', 608, 400, 400);
    expect(fit.totalH).toBe(608);
    expect(fit.headerH).toBe(fit.footerH);
    expect(fit.imageH).toBeGreaterThanOrEqual(Math.round(608 * 0.4));
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

describe('bandColor', () => {
  it('follows the canvas unless a colour was picked for the band', () => {
    expect(bandColor({ bgColor: '#123456' }, '#000000')).toBe('#000000');
    expect(bandColor({ bgColor: '#123456', ownColor: true }, '#000000')).toBe('#123456');
    expect(bandColor(null, null)).toBe('#ffffff');
  });
});

describe('fitCaptionsToBands', () => {
  it('limits a band caption to the lines its band holds, leaving others alone', () => {
    const caps = [
      { id: 'h', isHeaderCaption: true, fontSize: 50 },
      { id: 'f', isFooterCaption: true, fontSize: 50, autoFit: true, maxLines: 1 },
      { id: 'moved', isHeaderCaption: true, hasCustomPos: true, fontSize: 50 },
      { id: 'body', fontSize: 50 },
    ];
    // 140 x 0.9 = 126px of 60px lines: 2. A 50px band still gets one line (the type shrinks).
    const [h, f, moved, body] = fitCaptionsToBands(caps, 140, 50);
    expect(h).toMatchObject({ autoFit: true, maxLines: 2 });
    expect(f).toMatchObject({ autoFit: true, maxLines: 1 });
    expect(moved).toBe(caps[2]);
    expect(body).toBe(caps[3]);
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
