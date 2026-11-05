import { describe, it, expect } from 'vitest';
import { MAX_TIMELINE_MS, clampGroupShift, duplicateGroup, shiftGroup, togglePick } from './clipGroup';

const clip = (id: string, startMs: number, endMs: number) => ({ id, startMs, endMs });

describe('togglePick', () => {
  it('takes the selected clip along on the first pick, then adds and removes', () => {
    expect(togglePick([], 'b', 'a')).toEqual(['a', 'b']);
    expect(togglePick([], 'a', 'a')).toEqual(['a']);
    expect(togglePick([], 'a', null)).toEqual(['a']);
    expect(togglePick(['a', 'b'], 'a', null)).toEqual(['b']);
    expect(togglePick(['a'], 'c', 'z')).toEqual(['a', 'c']);
  });
});

describe('shiftGroup', () => {
  const items = [clip('a', 1000, 2000), clip('b', 3000, 5000), clip('c', 0, 500)];
  const from = { a: { startMs: 1000, endMs: 2000 }, b: { startMs: 3000, endMs: 5000 } };

  it('moves every picked clip by the same amount, from where the drag began', () => {
    expect(shiftGroup(items, from, 500).map((i) => [i.id, i.startMs, i.endMs]))
      .toEqual([['a', 1500, 2500], ['b', 3500, 5500], ['c', 0, 500]]);
  });

  it('stops the group at the start and end of the timeline', () => {
    expect(shiftGroup(items, from, -5000)[0].startMs).toBe(0);
    expect(clampGroupShift(Object.values(from), MAX_TIMELINE_MS)).toBe(MAX_TIMELINE_MS - 5000);
  });
});

describe('duplicateGroup', () => {
  it('puts copies right after the group, keeping their timing, with new ids', () => {
    let n = 0;
    const { items, ids } = duplicateGroup([clip('a', 1000, 2000), clip('b', 3000, 5000), clip('c', 0, 500)], ['a', 'b'], () => `n${++n}`);
    expect(ids).toEqual(['n1', 'n2']);
    expect(items.slice(3)).toEqual([clip('n1', 5000, 6000), clip('n2', 7000, 9000)]);
  });

  it('does nothing without picked clips', () => {
    const items = [clip('a', 0, 1)];
    expect(duplicateGroup(items, ['x'], () => 'n')).toEqual({ items, ids: [] });
  });
});
