import { describe, it, expect } from 'vitest';
import { frameTimesFor, filmstripTiles } from './filmstrip';

describe('frameTimesFor', () => {
  it('samples every half second from the middle of each slot', () => {
    expect(frameTimesFor(2000)).toEqual([250, 750, 1250, 1750]);
  });

  it('spreads long videos out to at most 40 frames', () => {
    const times = frameTimesFor(60000);
    expect(times).toHaveLength(40);
    expect(times[1] - times[0]).toBe(1500);
  });

  it('copes with an unknown length', () => {
    expect(frameTimesFor(NaN)).toEqual([0]);
  });
});

describe('filmstripTiles', () => {
  const frameTimes = [250, 750, 1250, 1750, 2250, 2750];

  it('picks the frame under each tile, trimming the last tile', () => {
    // 100px per second, 50px tiles: tile centres at 250, 750, 1250ms of footage.
    const tiles = filmstripTiles({ width: 130, tileWidth: 50, pxPerSec: 100, frameTimes });
    expect(tiles).toEqual([
      { left: 0, width: 50, frame: 0 },
      { left: 50, width: 50, frame: 1 },
      { left: 100, width: 30, frame: 2 },
    ]);
  });

  it('starts at the trim point and runs faster with speed', () => {
    const tiles = filmstripTiles({ width: 100, tileWidth: 50, pxPerSec: 100, trimStartMs: 1000, rate: 2, frameTimes });
    // Centres: 1000 + 250*2 = 1500ms, 1000 + 750*2 = 2500ms of footage.
    expect(tiles.map((t) => t.frame)).toEqual([2, 4]);
  });

  it('returns nothing until frames exist', () => {
    expect(filmstripTiles({ width: 100, tileWidth: 50, pxPerSec: 100, frameTimes: [] })).toEqual([]);
  });
});
