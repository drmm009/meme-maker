import { describe, it, expect } from 'vitest';
import { msToPx, pxToMs, clampZoom, formatClock, getContentEnd, findSnap, getRulerMarks, orderTracks, timelineRows } from './timelineMath';

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

  it('orders tracks overlays-first, then video, then audio', () => {
    const items = [{ id: 'a', type: 'audio' }, { id: 'v', type: 'video' }, { id: 't', type: 'text' }, { id: 's', type: 'sticker' }, { id: 't2', type: 'text' }];
    expect(orderTracks(items).map((i) => i.id)).toEqual(['t', 't2', 's', 'v', 'a']);
  });

  it('puts all auto captions in one row', () => {
    const items = [{ id: 'v', type: 'video' }, { id: 'c1', type: 'text', autoCaption: true }, { id: 't', type: 'text' }, { id: 'c2', type: 'text', autoCaption: true }];
    expect(timelineRows(items).map((row) => row.map((i) => i.id))).toEqual([['c1', 'c2'], ['t'], ['v']]);
  });
});
