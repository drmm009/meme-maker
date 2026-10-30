import { describe, it, expect } from 'vitest';
import { FULL_CROP, MIN_CROP, aspectCrop, fractionRatio, moveCrop, resizeCrop, rotatedSize, turn } from './cropMath';

const close = (box: { x: number; y: number; w: number; h: number }) => Object.fromEntries(Object.entries(box).map(([k, v]) => [k, Math.round(v * 1000) / 1000]));

describe('crop maths', () => {
  it('turns in quarter turns and swaps the sides', () => {
    expect(turn(0, -90)).toBe(270);
    expect(turn(270, 90)).toBe(0);
    expect(rotatedSize(400, 300, 90)).toEqual({ w: 300, h: 400 });
    expect(rotatedSize(400, 300, 180)).toEqual({ w: 400, h: 300 });
  });

  it('moves the box but keeps it on the photo', () => {
    const box = { x: 0.2, y: 0.2, w: 0.5, h: 0.5 };
    expect(close(moveCrop(box, 0.1, -0.1))).toEqual({ x: 0.3, y: 0.1, w: 0.5, h: 0.5 });
    expect(close(moveCrop(box, 0.9, 0.9))).toEqual({ x: 0.5, y: 0.5, w: 0.5, h: 0.5 });
  });

  it('drags a corner with the opposite one fixed, never past the edge or below the minimum', () => {
    expect(close(resizeCrop(FULL_CROP, 'se', -0.4, -0.2, null))).toEqual({ x: 0, y: 0, w: 0.6, h: 0.8 });
    expect(close(resizeCrop(FULL_CROP, 'nw', 0.3, 0.1, null))).toEqual({ x: 0.3, y: 0.1, w: 0.7, h: 0.9 });
    expect(resizeCrop({ x: 0.2, y: 0.2, w: 0.5, h: 0.5 }, 'se', 2, 2, null)).toMatchObject({ w: 0.8, h: 0.8 });
    expect(resizeCrop(FULL_CROP, 'se', -2, -2, null)).toMatchObject({ w: MIN_CROP, h: MIN_CROP });
  });

  it('keeps the shape when a ratio is set', () => {
    const box = resizeCrop(FULL_CROP, 'se', -0.5, 0, 1);
    expect(box.w / box.h).toBeCloseTo(1);
    // Square on a 2:1 photo: half as wide (in fractions) as it is tall.
    expect(fractionRatio(1, 2)).toBe(0.5);
  });

  it('centres the largest box of an aspect', () => {
    expect(close(aspectCrop(1, 2))).toEqual({ x: 0.25, y: 0, w: 0.5, h: 1 });
    expect(close(aspectCrop(16 / 9, 1))).toEqual({ x: 0, y: 0.219, w: 1, h: 0.563 });
    expect(aspectCrop(null, 1.5)).toBe(FULL_CROP);
  });
});
