import { describe, it, expect } from 'vitest';
import { STICKER_BASE_SIZE, getStickerBoxSize, rotatePoint, isInBox, clientToCanvas } from './geometry';

describe('rotatePoint', () => {
  it('leaves the point alone at 0 degrees', () => {
    expect(rotatePoint(15, 7, 10, 10, 0)).toEqual({ x: 15, y: 7 });
  });

  it('rotates 90 degrees clockwise in canvas space (y down)', () => {
    const p = rotatePoint(20, 10, 10, 10, 90);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(20);
  });

  it('undoes itself with the opposite angle', () => {
    const r = rotatePoint(33, -4, 5, 6, 37);
    const back = rotatePoint(r.x, r.y, 5, 6, -37);
    expect(back.x).toBeCloseTo(33);
    expect(back.y).toBeCloseTo(-4);
  });
});

describe('isInBox', () => {
  const c = { cx: 100, cy: 50 };
  it('includes the centre and the edges', () => {
    expect(isInBox({ x: 100, y: 50 }, c.cx, c.cy, 40, 20)).toBe(true);
    expect(isInBox({ x: 120, y: 60 }, c.cx, c.cy, 40, 20)).toBe(true);
  });

  it('excludes points just outside unless padded', () => {
    const p = { x: 124, y: 50 };
    expect(isInBox(p, c.cx, c.cy, 40, 20)).toBe(false);
    expect(isInBox(p, c.cx, c.cy, 40, 20, 6)).toBe(true);
  });

  it('hit-tests a rotated sticker after un-rotating the pointer', () => {
    const stk = { scale: 2, rotation: 45 };
    const size = getStickerBoxSize(stk); // 104
    // A point on the rotated box's diagonal axis, 70px from the centre: inside only because of the rotation.
    const pointer = { x: 100 + 70, y: 50 };
    const p = rotatePoint(pointer.x, pointer.y, c.cx, c.cy, -stk.rotation);
    expect(isInBox(p, c.cx, c.cy, size, size)).toBe(true);
    expect(isInBox(pointer, c.cx, c.cy, size, size)).toBe(false);
  });
});

describe('getStickerBoxSize', () => {
  it('scales the base size and defaults to scale 1', () => {
    expect(getStickerBoxSize({})).toBe(STICKER_BASE_SIZE);
    expect(getStickerBoxSize({ scale: 1.5 })).toBe(78);
  });
});

describe('clientToCanvas', () => {
  // A 1000x500 canvas shown at half size, 10px from the left and 20px from the top.
  const canvas = { width: 1000, height: 500, getBoundingClientRect: () => ({ left: 10, top: 20, width: 500, height: 250 }) };

  it('maps mouse coordinates into canvas pixels', () => {
    expect(clientToCanvas({ clientX: 260, clientY: 145 }, canvas)).toEqual({ x: 500, y: 250 });
  });

  it('uses the first touch, then the first changed touch', () => {
    expect(clientToCanvas({ touches: [{ clientX: 10, clientY: 20 }] }, canvas)).toEqual({ x: 0, y: 0 });
    expect(clientToCanvas({ touches: [], changedTouches: [{ clientX: 510, clientY: 270 }] }, canvas)).toEqual({ x: 1000, y: 500 });
  });

  it('returns the origin without a canvas', () => {
    expect(clientToCanvas({ clientX: 5, clientY: 5 }, null)).toEqual({ x: 0, y: 0 });
  });
});
