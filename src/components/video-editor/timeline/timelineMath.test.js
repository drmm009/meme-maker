import { describe, it, expect } from 'vitest';
import { msToPx, pxToMs, clampZoom, formatClock, getContentEnd, findSnap, getRulerMarks, packLines, timelineSections } from './timelineMath';

describe('timelineMath', () => {
  it('converts between time and pixels at a zoom level', () => {
    expect(msToPx(2500, 100)).toBe(250);
    expect(pxToMs(250, 100)).toBe(2500);
    expect(clampZoom(5)).toBe(30);
    expect(clampZoom(1000)).toBe(400);
  });

  it('formats the transport clock', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(3999)).toBe('0:03');
    expect(formatClock(65000)).toBe('1:05');
    expect(formatClock(-20)).toBe('0:00');
  });

  it('finds the end of the content', () => {
    expect(getContentEnd([], 7000)).toBe(7000);
    expect(getContentEnd([{ endMs: 3000 }, { endMs: 9000 }, { endMs: NaN }], 7000)).toBe(9000);
  });

  it('snaps to the closest point inside the threshold', () => {
    expect(findSnap(1040, [0, 1000, 1100], 80)).toBe(1000);
    expect(findSnap(1060, [0, 1000, 1100], 80)).toBe(1100);
    expect(findSnap(1500, [0, 1000], 80)).toBe(null);
  });

  it('spaces ruler labels by zoom and adds half-step dots', () => {
    const near = getRulerMarks(2000, 110);
    expect(near.map((m) => m.label)).toEqual(['0s', null, '1s', null, '2s']);
    const far = getRulerMarks(10000, 30);
    expect(far.filter((m) => m.major).map((m) => m.label)).toEqual(['0s', '5s', '10s']);
  });

  it('packs clips into as few lines as they fit, earliest first', () => {
    const clip = (id, startMs, endMs) => ({ id, startMs, endMs });
    const lines = packLines([clip('b', 1000, 3000), clip('a', 0, 1000), clip('c', 500, 2000), clip('d', 3000, 4000)]);
    expect(lines.map((l) => l.map((c) => c.id))).toEqual([['a', 'b', 'd'], ['c']]);
  });

  it('puts each clip in its type’s section, captions on a line of their own', () => {
    const items = [
      { id: 'a', type: 'audio', startMs: 0, endMs: 1000 },
      { id: 'v', type: 'video', startMs: 0, endMs: 2000 },
      { id: 'c1', type: 'text', autoCaption: true, startMs: 0, endMs: 500 },
      { id: 't', type: 'text', startMs: 0, endMs: 1000 },
      { id: 'c2', type: 'text', autoCaption: true, startMs: 500, endMs: 900 },
      { id: 's', type: 'sticker', startMs: 0, endMs: 1000 },
    ];
    expect(timelineSections(items).map((s) => [s.id, s.lines.map((l) => l.map((c) => c.id))])).toEqual([
      ['video', [['v']]],
      ['image', []],
      ['text', [['c1', 'c2'], ['t']]],
      ['sticker', [['s']]],
      ['audio', [['a']]],
    ]);
  });
});
