import { describe, it, expect } from 'vitest';
import { cornerForCenter, isRotated, rotatedBounds, rotatedCenter } from './rotation';

describe('rotation', () => {
  it('puts the centre of an unturned box in its middle', () => {
    expect(rotatedCenter(10, 20, 100, 50, 0)).toEqual({ x: 60, y: 45 });
  });

  it('turns clockwise about the corner, as Konva does', () => {
    // A quarter turn swings the box down and to the left of its corner.
    const c = rotatedCenter(0, 0, 100, 50, 90);
    expect(c.x).toBeCloseTo(-25);
    expect(c.y).toBeCloseTo(50);
  });

  it('finds the corner for a centre (the inverse)', () => {
    for (const deg of [0, 33, 90, 180, 271]) {
      const corner = cornerForCenter({ x: 400, y: 225 }, 120, 80, deg);
      const back = rotatedCenter(corner.x, corner.y, 120, 80, deg);
      expect(back.x).toBeCloseTo(400);
      expect(back.y).toBeCloseTo(225);
    }
  });

  it('measures the upright box around a turned one', () => {
    expect(rotatedBounds(100, 50, 90).width).toBeCloseTo(50);
    expect(rotatedBounds(100, 50, 90).height).toBeCloseTo(100);
    expect(rotatedBounds(100, 100, 45).width).toBeCloseTo(141.42);
  });

  it('only counts real turns', () => {
    expect([0, 360, -720, undefined, NaN, 90, -15].map(isRotated)).toEqual([false, false, false, false, false, true, true]);
  });
});
