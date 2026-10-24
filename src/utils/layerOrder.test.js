import { describe, it, expect } from 'vitest';
import { drawOrder, moveLayer } from './layerOrder';

const clip = (id, type, startMs = 0, endMs = 3000, extra = {}) => ({ id, type, startMs, endMs, ...extra });

describe('layerOrder', () => {
  it('draws video, photos, stickers, then text, each in the order added; audio is left out', () => {
    const items = [clip('t1', 'text'), clip('s1', 'sticker'), clip('v1', 'video'), clip('a1', 'audio'), clip('i1', 'image'), clip('v2', 'video')];
    expect(drawOrder(items).map((i) => i.id)).toEqual(['v1', 'v2', 'i1', 's1', 't1']);
  });

  it('brings an item forward past the next one on screen with it', () => {
    const items = [clip('v1', 'video'), clip('s1', 'sticker'), clip('t1', 'text')];
    const moved = moveLayer(items, 's1', 1);
    expect(drawOrder(moved).map((i) => i.id)).toEqual(['v1', 't1', 's1']);
    expect(moveLayer(moved, 's1', 1)).toBe(moved);
  });

  it('sends an item back, skipping ones that never overlap it in time', () => {
    const items = [clip('v1', 'video', 0, 5000), clip('s1', 'sticker', 4000, 6000), clip('s2', 'sticker', 0, 1000)];
    const moved = moveLayer(items, 's2', -1);
    expect(drawOrder(moved).map((i) => i.id)).toEqual(['s2', 'v1', 's1']);
    // s1 can't go below s2 (they never overlap) but can go below v1.
    expect(drawOrder(moveLayer(moved, 's1', -1)).map((i) => i.id)).toEqual(['s2', 's1', 'v1']);
  });
});
