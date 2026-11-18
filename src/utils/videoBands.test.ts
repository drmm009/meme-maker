import { describe, it, expect } from 'vitest';
import { BANDS, bandRects, bandsOn, centreInBand, withBands } from './videoBands';

const on = { enabled: true, bgColor: '#000000', height: 120 };
const off = { ...on, enabled: false };

describe('videoBands', () => {
  it('gives a bar at the top, the bottom or both, scaled to the canvas', () => {
    expect(bandRects(on, off, 800, 600)).toEqual([{ x: 0, y: 0, width: 800, height: 120, fill: '#000000' }]);
    expect(bandRects(off, { ...on, bgColor: '#ffffff' }, 1600, 1200, 2)).toEqual([{ x: 0, y: 960, width: 1600, height: 240, fill: '#ffffff' }]);
    expect(bandRects(off, off, 800, 600)).toEqual([]);
    expect(bandsOn(off, on)).toBe(true);
    expect(bandsOn(null, undefined)).toBe(false);
  });

  it('never makes a bar taller than half the canvas', () => {
    expect(bandRects({ ...on, height: 500 }, off, 800, 600)[0].height).toBe(300);
  });

  it('puts the bars over clips and photos and under stickers, text and the end card', () => {
    const items = [
      { id: 'v', type: 'video' },
      { id: 'p', type: 'image' },
      { id: 's', type: 'sticker' },
      { id: 't', type: 'text' },
      { id: 'e', type: 'image', endCard: {} },
    ];
    expect(withBands(items, true).map((i) => (i === BANDS ? 'bars' : i.id))).toEqual(['v', 'p', 'bars', 's', 't', 'e']);
    expect(withBands(items, false)).toBe(items);
  });

  it('centres a caption box in its bar', () => {
    expect(centreInBand({ width: 200, height: 60 }, { x: 0, y: 0, width: 800, height: 120 })).toEqual({ x: 300, y: 30 });
  });
});
