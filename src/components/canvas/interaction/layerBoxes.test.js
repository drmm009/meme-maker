import { describe, it, expect } from 'vitest';
import {
  IMAGE_LAYER_FIT, findHandle, findSlotAt, getCaptionBox, getCaptionCenterX, getCaptionHandles,
  getImageLayerBox, getImageLayerHandles, getStickerHandles
} from './layerBoxes';

// Every character is 10px wide.
const fakeCtx = () => ({ font: '', measureText: (s) => ({ width: s.length * 10 }) });

describe('getCaptionCenterX', () => {
  it('places captions by their x fraction, centred when unset', () => {
    expect(getCaptionCenterX({ x: 0.25 }, 800)).toBe(200);
    expect(getCaptionCenterX({}, 800)).toBe(400);
  });

  it('keeps a WhatsApp card inside the canvas', () => {
    // 0.5 * 800 = 400px card; its centre can't go further left than 200 + 14.
    expect(getCaptionCenterX({ x: 0, isWhatsAppCard: true, width: 0.5 }, 800)).toBe(214);
    expect(getCaptionCenterX({ x: 1, isWhatsAppCard: true, width: 0.5 }, 800)).toBe(586);
  });
});

describe('getCaptionBox', () => {
  it('measures plain text with the snug tap padding', () => {
    // "HELLO" = 50px; fontSize 50 -> padX max(8, 7.5) = 8, padY max(4, 5) = 5.
    const box = getCaptionBox(fakeCtx(), { text: 'HELLO', fontSize: 50 }, 800);
    expect(box.boxWidth).toBe(66);
    expect(box.boxHeight).toBe(60 + 10);
    expect(box.lines).toEqual(['HELLO']);
  });

  it('gives selection handles a roomier box', () => {
    // padX max(16, 12.5) = 16, padY max(10, 8) = 10.
    const box = getCaptionBox(fakeCtx(), { text: 'HELLO', fontSize: 50 }, 800, { handles: true });
    expect(box.boxWidth).toBe(82);
    expect(box.boxHeight).toBe(60 + 20);
  });

  it('pads boxed backgrounds the same either way', () => {
    const cap = { text: 'HI', fontSize: 40, bgColor: '#000' };
    expect(getCaptionBox(fakeCtx(), cap, 800)).toEqual(getCaptionBox(fakeCtx(), cap, 800, { handles: true }));
  });

  it('honours a custom width and never exceeds the canvas', () => {
    expect(getCaptionBox(fakeCtx(), { text: 'A', fontSize: 50, hasCustomWidth: true, width: 0.5 }, 800).boxWidth).toBe(400);
    const long = getCaptionBox(fakeCtx(), { text: 'X'.repeat(200), fontSize: 50, hasCustomWidth: true, width: 2 }, 800);
    expect(long.boxWidth).toBe(784);
  });

  it('sizes breaking-news chyrons by their own layout', () => {
    const box = getCaptionBox(fakeCtx(), { text: 'NEWS', isBreakingNews: true, fontSize: 26 }, 800);
    expect(box.boxWidth).toBe(752);
    expect(box.boxHeight).toBe(26 + 52 + 22);
  });

  it('works without a 2D context', () => {
    expect(getCaptionBox(null, { text: 'HELLO', fontSize: 50 }, 800).lines).toEqual(['HELLO']);
  });
});

describe('getImageLayerBox', () => {
  it('fits the image in the fit square at scale 1', () => {
    const box = getImageLayerBox({}, { width: 640, height: 320 });
    expect(box.w).toBe(IMAGE_LAYER_FIT);
    expect(box.h).toBe(IMAGE_LAYER_FIT / 2);
  });

  it('prefers an explicit box size', () => {
    expect(getImageLayerBox({ boxWidth: 90, boxHeight: 40 }, { width: 10, height: 10 })).toMatchObject({ w: 90, h: 40 });
  });
});

describe('handles', () => {
  it('puts the sticker handles on its corners and above it', () => {
    const [del, rot, resize] = getStickerHandles({ scale: 1 }, 100, 100); // 52px box, hs = 32
    expect(del).toMatchObject({ type: 'delete_layer', x: 68, y: 68 });
    expect(rot).toMatchObject({ type: 'rotate_sticker', x: 100, y: 100 - 26 - 28 });
    expect(resize).toMatchObject({ type: 'resize_sticker_br', x: 132, y: 132 });
  });

  it('gives crop mode edge handles only, and face swaps inset corners', () => {
    expect(getImageLayerHandles({ fitMode: 'crop' }, 0, 0, 100, 100).map((h) => h.type))
      .toEqual(['resize_imageLayer_t', 'resize_imageLayer_b', 'resize_imageLayer_l', 'resize_imageLayer_r']);
    const [del] = getImageLayerHandles({ isFaceMorph: true }, 0, 0, 100, 100);
    expect(del.x).toBeCloseTo(-56 * 0.72);
  });

  it('finds the first handle in reach, or the closest', () => {
    const handles = [{ type: 'a', x: 0, y: 0, r: 30 }, { type: 'b', x: 20, y: 0, r: 30 }];
    expect(findHandle({ x: 15, y: 0 }, handles).type).toBe('a');
    expect(findHandle({ x: 15, y: 0 }, handles, { closest: true }).type).toBe('b');
    expect(findHandle({ x: 200, y: 0 }, handles)).toBeNull();
  });

  it('lays caption handles on the box edges', () => {
    const types = getCaptionHandles(100, 100, 80, 40, 10, 12).map((h) => [h.type, h.x, h.y]);
    expect(types).toEqual([
      ['delete_layer', 60, 80],
      ['rotate_caption', 100, 52],
      ['resize_caption_l', 60, 100],
      ['resize_caption_r', 140, 100],
      ['resize_caption_br', 140, 120],
    ]);
  });
});

describe('findSlotAt', () => {
  const size = { canvasW: 800, canvasH: 600, headerExtH: 100 };
  it('finds panels in stacked, side-by-side, grid and hybrid layouts', () => {
    expect(findSlotAt({ x: 10, y: 450 }, { id: '2-vert', slots: 2 }, size)).toBe(1);
    expect(findSlotAt({ x: 700, y: 300 }, { id: '3-horiz', slots: 3 }, size)).toBe(2);
    expect(findSlotAt({ x: 500, y: 450 }, { id: '4-grid', slots: 4 }, size)).toBe(3);
    expect(findSlotAt({ x: 500, y: 200 }, { id: '3-hybrid', slots: 3 }, size)).toBe(0);
    expect(findSlotAt({ x: 500, y: 500 }, { id: '3-hybrid', slots: 3 }, size)).toBe(2);
  });

  it('misses the header band', () => {
    expect(findSlotAt({ x: 10, y: 50 }, { id: '2-vert', slots: 2 }, size)).toBe(-1);
  });
});
