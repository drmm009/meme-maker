import { describe, it, expect } from 'vitest';
import { FULL_CROP, MIN_CROP, applyCrop, aspectCrop, clipCrop, cropFilter, isCropped, moveCrop, resizeCrop, sourceRect } from './clipCrop';

describe('clipCrop', () => {
  it('is the whole frame when unset or broken, and kept inside the frame', () => {
    expect(clipCrop({})).toEqual(FULL_CROP);
    expect(clipCrop({ crop: null })).toEqual(FULL_CROP);
    expect(clipCrop({ crop: { x: Number.NaN, y: 0, width: 1, height: 1 } })).toEqual(FULL_CROP);
    expect(clipCrop({ crop: { x: 0.9, y: -1, width: 0.5, height: 0.01 } })).toEqual({ x: 0.5, y: 0, width: 0.5, height: MIN_CROP });
    expect(isCropped(FULL_CROP)).toBe(false);
    expect(isCropped({ x: 0, y: 0, width: 0.5, height: 1 })).toBe(true);
  });
});

describe('sourceRect', () => {
  it('turns the crop into source pixels, zooming a punch into its centre', () => {
    expect(sourceRect(640, 360, FULL_CROP)).toBeNull();
    expect(sourceRect(640, 360, FULL_CROP, 2)).toEqual({ x: 160, y: 90, width: 320, height: 180 });
    expect(sourceRect(640, 360, { x: 0.25, y: 0, width: 0.5, height: 0.5 })).toEqual({ x: 160, y: 0, width: 320, height: 180 });
    expect(sourceRect(0, 0, { x: 0.25, y: 0, width: 0.5, height: 0.5 })).toBeNull();
  });
});

describe('aspectCrop', () => {
  it('is the biggest centred box of that shape', () => {
    // A 16:9 frame cropped square: the middle 9/16 of its width.
    const square = aspectCrop(1, 1600, 900);
    expect(square.width).toBeCloseTo(0.5625);
    expect(square.x).toBeCloseTo(0.21875);
    expect(square.height).toBe(1);
    // A square frame cropped 16:9: full width, 9/16 of its height.
    const wide = aspectCrop(16 / 9, 500, 500);
    expect(wide).toMatchObject({ x: 0, width: 1 });
    expect(wide.height).toBeCloseTo(0.5625);
  });
});

describe('moveCrop and resizeCrop', () => {
  const box = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };

  it('moves the box, stopping at the frame edges', () => {
    expect(moveCrop(box, 0.1, -0.1)).toEqual({ x: 0.35, y: 0.15, width: 0.5, height: 0.5 });
    expect(moveCrop(box, 1, 1)).toEqual({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
  });

  it('drags a corner with the opposite one fixed, within the frame and above the minimum', () => {
    const se = resizeCrop(box, 'se', 0.1, 0.1);
    expect(se.x).toBe(0.25);
    expect(se.width).toBeCloseTo(0.6);
    const nw = resizeCrop(box, 'nw', -1, -1);
    expect(nw).toEqual({ x: 0, y: 0, width: 0.75, height: 0.75 });
    const tiny = resizeCrop(box, 'ne', -1, 1);
    expect(tiny.width).toBe(MIN_CROP);
    expect(tiny.y + tiny.height).toBeCloseTo(0.75);
  });

  it('keeps a locked shape', () => {
    const locked = resizeCrop(box, 'se', 0.2, 0, 2);
    expect(locked.width / locked.height).toBeCloseTo(2);
    expect(locked.x + locked.width).toBeLessThanOrEqual(1);
  });
});

describe('applyCrop', () => {
  it('keeps the part still shown where it was, at the same scale', () => {
    const item = { x: 100, y: 50, width: 400, height: 200 };
    const patch = applyCrop(item, { x: 0.5, y: 0, width: 0.5, height: 1 });
    expect(patch).toEqual({ crop: { x: 0.5, y: 0, width: 0.5, height: 1 }, x: 300, y: 50, width: 200, height: 200 });
    // Un-cropping goes back to the whole frame, and saves no crop.
    expect(applyCrop({ ...item, ...patch }, FULL_CROP)).toEqual({ crop: null, x: 100, y: 50, width: 400, height: 200 });
  });

  it('moves along the clip’s own turned and scaled frame', () => {
    const patch = applyCrop({ x: 100, y: 100, width: 400, height: 200, scaleX: 2, rotation: 90 }, { x: 0.5, y: 0, width: 0.5, height: 1 });
    // 200 units to the right, doubled by the scale, turned a quarter: straight down.
    expect(patch.x).toBeCloseTo(100);
    expect(patch.y).toBeCloseTo(500);
    expect(patch.width).toBe(200);
  });
});

describe('cropFilter', () => {
  it('crops in FFmpeg by fractions of the input, nothing for the whole frame', () => {
    expect(cropFilter({})).toBe('');
    expect(cropFilter({ crop: { x: 0.125, y: 0, width: 0.5, height: 1 } })).toBe('crop=w=iw*0.5:h=ih*1:x=iw*0.125:y=ih*0,');
  });
});
