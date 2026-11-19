import { describe, it, expect } from 'vitest';
import { newLayerPosition } from './newLayerPosition';

// A 2 x 2 grid from Choose Canvas Layout.
const grid = { isNativeLayout: true, layoutDef: { id: '4-grid', slots: 4 } };

describe('newLayerPosition', () => {
  it('puts a new layer in the middle of the first empty panel', () => {
    expect(newLayerPosition('caption', { activeTemplate: grid })).toEqual({ x: 0.25, y: 0.25 });
  });

  it('skips panels with a photo, sticker or caption in them, but not header or footer text', () => {
    const doc = {
      activeTemplate: grid,
      imageLayers: [{ x: 0.25, y: 0.25 }],
      stickers: [{ x: 0.75, y: 0.2 }],
      captions: [{ x: 0.3, y: 0.7, isHeaderCaption: true }],
    };
    expect(newLayerPosition('sticker', doc)).toEqual({ x: 0.25, y: 0.75 });
  });

  it('finds a free spot on the canvas when every panel has something, or there is no grid', () => {
    const full = { activeTemplate: grid, stickers: [0.25, 0.75].flatMap((x) => [{ x, y: 0.25 }, { x, y: 0.75 }]) };
    const pos = newLayerPosition('caption', full);
    expect(typeof pos.x).toBe('number');
    expect(newLayerPosition('caption', { activeTemplate: { isNativeLayout: false } })).not.toEqual({ x: 0.25, y: 0.25 });
  });
});
