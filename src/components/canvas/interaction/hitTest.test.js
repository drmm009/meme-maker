import { describe, it, expect } from 'vitest';
import { hitActiveHandle, hitBandCaption, hitLayerAt, isOnActiveBody } from './hitTest';
import { getHoverCursor } from './hoverCursor';

// An 800x600 canvas with no header band; every character is 10px wide.
const makeScene = (layers = {}) => ({
  canvas: { width: 800, height: 600 },
  ctx: { font: '', measureText: (s) => ({ width: s.length * 10 }) },
  captions: [],
  stickers: [],
  imageLayers: [],
  imageCache: {},
  getCaptionCenterY: (c) => (c.y ?? 0.5) * 600,
  getStickerCenterY: (s) => s.y * 600,
  getImageLayerCenterY: (l) => l.y * 600,
  ...layers
});

const sticker = { id: 's1', x: 0.5, y: 0.5, scale: 1 }; // 52px box at (400, 300)
const caption = { id: 'c1', x: 0.5, y: 0.5, text: 'HELLO', fontSize: 50 }; // 66 x 70 tap box

describe('hitLayerAt', () => {
  it('hits a sticker inside its box (with a little slack) and misses outside', () => {
    const scene = makeScene({ stickers: [sticker] });
    expect(hitLayerAt(scene, { x: 430, y: 300 })).toMatchObject({ id: 's1', type: 'sticker' });
    expect(hitLayerAt(scene, { x: 440, y: 300 })).toBeNull();
  });

  it('picks the topmost layer by zIndex', () => {
    const scene = makeScene({ stickers: [{ ...sticker, zIndex: 1 }], captions: [{ ...caption, zIndex: 2 }] });
    expect(hitLayerAt(scene, { x: 400, y: 300 }).id).toBe('c1');
    scene.stickers[0].zIndex = 3;
    expect(hitLayerAt(scene, { x: 400, y: 300 }).id).toBe('s1');
  });

  it('skips hidden layers and reports locked ones', () => {
    expect(hitLayerAt(makeScene({ stickers: [{ ...sticker, hidden: true }] }), { x: 400, y: 300 })).toBeNull();
    expect(hitLayerAt(makeScene({ stickers: [{ ...sticker, locked: true }] }), { x: 400, y: 300 }).locked).toBe(true);
  });

  it('respects a layer\'s rotation', () => {
    // A long caption rotated 90 degrees: its length now runs vertically.
    const long = { ...caption, text: 'X'.repeat(30), rotation: 90 };
    const scene = makeScene({ captions: [long] });
    expect(hitLayerAt(scene, { x: 400, y: 440 })).not.toBeNull();
    expect(hitLayerAt(scene, { x: 540, y: 300 })).toBeNull();
  });

  it('only hits image layers whose image has loaded', () => {
    const img = { id: 'i1', x: 0.5, y: 0.5, url: 'a.png' };
    expect(hitLayerAt(makeScene({ imageLayers: [img] }), { x: 400, y: 300 })).toBeNull();
    const scene = makeScene({ imageLayers: [img], imageCache: { 'a.png': { width: 320, height: 320 } } });
    expect(hitLayerAt(scene, { x: 550, y: 450 })).toMatchObject({ id: 'i1', type: 'imageLayer', boxWidth: 320 });
  });
});

describe('hitActiveHandle', () => {
  it('finds the selected sticker\'s resize handle', () => {
    const scene = makeScene({ stickers: [sticker] });
    expect(hitActiveHandle(scene, { x: 432, y: 332 }, 's1')).toMatchObject({ id: 's1', type: 'resize_sticker_br' });
    expect(hitActiveHandle(scene, { x: 432, y: 332 }, null)).toBeNull();
  });

  it('gives locked layers no handles', () => {
    expect(hitActiveHandle(makeScene({ stickers: [{ ...sticker, locked: true }] }), { x: 432, y: 332 }, 's1')).toBeNull();
  });

  it('records where a caption handle sits for corner scaling', () => {
    // Handle box 82 x 80, so the bottom-right handle is at (441, 340).
    const hit = hitActiveHandle(makeScene({ captions: [caption] }), { x: 441, y: 340 }, 'c1');
    expect(hit).toMatchObject({ type: 'resize_caption_br', handleRelX: 41, handleRelY: 40, initialBoxWidth: 82 });
  });

  it('knows the selected layer\'s body from its handles', () => {
    const scene = makeScene({ stickers: [sticker] });
    expect(isOnActiveBody(scene, { x: 400, y: 300 }, 's1')).toBe(true);
    expect(isOnActiveBody(scene, { x: 500, y: 300 }, 's1')).toBe(false);
  });
});

describe('hitBandCaption', () => {
  const bands = { isHeaderEnabled: true, isFooterEnabled: true, headerExtH: 100, canvasH: 400 };
  const captions = [{ id: 'h', isHeaderCaption: true }, { id: 'f', isFooterCaption: true }];

  it('selects the header or footer caption from its band', () => {
    expect(hitBandCaption(captions, { x: 0, y: 50 }, bands)).toMatchObject({ id: 'h', isHeaderCaption: true });
    expect(hitBandCaption(captions, { x: 0, y: 550 }, bands)).toMatchObject({ id: 'f', isFooterCaption: true });
    expect(hitBandCaption(captions, { x: 0, y: 300 }, bands)).toBeNull();
  });

  it('ignores a band caption that was dragged out of its band', () => {
    expect(hitBandCaption([{ id: 'h', isHeaderCaption: true, hasCustomPos: true }], { x: 0, y: 50 }, bands)).toBeNull();
  });
});

describe('getHoverCursor', () => {
  const bands = { isHeaderEnabled: false, isFooterEnabled: false, headerExtH: 0, canvasH: 600 };
  it('shows handle, move, pointer and default cursors', () => {
    const scene = makeScene({ stickers: [sticker], captions: [{ ...caption, x: 0.1 }] });
    expect(getHoverCursor(scene, { x: 432, y: 332 }, 's1', bands)).toBe('nwse-resize');
    expect(getHoverCursor(scene, { x: 400, y: 300 }, 's1', bands)).toBe('move');
    expect(getHoverCursor(scene, { x: 80, y: 300 }, 's1', bands)).toBe('pointer');
    expect(getHoverCursor(scene, { x: 700, y: 50 }, 's1', bands)).toBe('default');
  });
});
