import { describe, it, expect } from 'vitest';
import { alignMoves, distributeMoves, groupMates } from './arrange';

const a = { id: 'a', box: { x: 100, y: 100, w: 100, h: 50 } };
const b = { id: 'b', box: { x: 300, y: 200, w: 50, h: 100 } };
const frame = { x: 500, y: 400, w: 1000, h: 800 };

describe('arranging layers', () => {
  it('aligns edges and centres to each other', () => {
    expect(alignMoves([a, b], 'left')).toEqual([{ id: 'a', dx: 0, dy: 0 }, { id: 'b', dx: -225, dy: 0 }]);
    expect(alignMoves([a, b], 'bottom')).toEqual([{ id: 'a', dx: 0, dy: 125 }, { id: 'b', dx: 0, dy: 0 }]);
    // Centres meet in the middle of the pair's bounds (50..325 across).
    expect(alignMoves([a, b], 'hcenter').map((m) => m.dx)).toEqual([87.5, -112.5]);
  });

  it('aligns one layer to the meme', () => {
    expect(alignMoves([a], 'hcenter', frame)).toEqual([{ id: 'a', dx: 400, dy: 0 }]);
    expect(alignMoves([a], 'top', frame)).toEqual([{ id: 'a', dx: 0, dy: -75 }]);
    expect(alignMoves([a], 'right', frame)[0].dx).toBe(850);
  });

  it('spreads three or more out evenly, keeping the outer two', () => {
    const items = [
      { id: 'x', box: { x: 50, y: 0, w: 100, h: 10 } },
      { id: 'z', box: { x: 950, y: 0, w: 100, h: 10 } },
      { id: 'y', box: { x: 200, y: 0, w: 100, h: 10 } },
    ];
    expect(distributeMoves(items, 'horizontal')).toEqual([
      { id: 'x', dx: 0, dy: 0 },
      { id: 'z', dx: 0, dy: 0 },
      { id: 'y', dx: 300, dy: 0 },
    ]);
    expect(distributeMoves(items.slice(0, 2), 'vertical').every((m) => m.dx === 0 && m.dy === 0)).toBe(true);
  });

  it('finds a layer\'s group mates', () => {
    const layers = [{ id: '1', groupId: 'g' }, { id: '2', groupId: 'g' }, { id: '3' }];
    expect(groupMates(layers, '1').map((l) => l.id)).toEqual(['2']);
    expect(groupMates(layers, '3')).toEqual([]);
  });
});
