import { describe, expect, it } from 'vitest';
import { centreOf, cornerForCentre, snapToCentre } from './textGestures';

describe('snapToCentre', () => {
  const canvas = { width: 800, height: 600 };
  it('pulls a box whose centre is near a centre line onto it, with a guide', () => {
    // Centre at (405, 296): within 12 of (400, 300) both ways.
    expect(snapToCentre({ x: 355, y: 276, width: 100, height: 40 }, canvas)).toEqual({ dx: -5, dy: 4, vertical: 400, horizontal: 300 });
  });
  it('leaves a box away from the lines where it is', () => {
    expect(snapToCentre({ x: 0, y: 0, width: 100, height: 40 }, canvas)).toEqual({ dx: 0, dy: 0, vertical: null, horizontal: null });
  });
  it('snaps one way only when only one line is near', () => {
    const s = snapToCentre({ x: 345, y: 0, width: 100, height: 40 }, canvas);
    expect(s).toMatchObject({ dx: 5, dy: 0, vertical: 400, horizontal: null });
  });
});

describe('cornerForCentre / centreOf', () => {
  it('are inverses, turned or not', () => {
    for (const rotation of [0, 30, 90, -135]) {
      const corner = cornerForCentre({ x: 300, y: 200 }, 120, 50, rotation);
      const back = centreOf(corner.x, corner.y, 120, 50, rotation);
      expect(back.x).toBeCloseTo(300);
      expect(back.y).toBeCloseTo(200);
    }
  });
  it('puts an unturned box half its size up and left of the centre', () => {
    expect(cornerForCentre({ x: 100, y: 100 }, 40, 20, 0)).toEqual({ x: 80, y: 90 });
  });
});
