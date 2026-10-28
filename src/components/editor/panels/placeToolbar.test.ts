import { describe, it, expect } from 'vitest';
import { placeToolbar } from './placeToolbar';

// A 1000px-wide canvas drawn 500px wide (scale 0.5) at (20, 100) inside a 540 x 800 container.
const canvasRect = { left: 20, top: 100, width: 500, height: 400 };
const parent = { left: 0, top: 0, width: 540, height: 800 };
const size = { w: 200, h: 50 };

describe('placeToolbar', () => {
  it('centres the toolbar 12px above the layer', () => {
    // Layer centre (500, 400) -> (270, 300) on screen; 100 tall -> top edge at 275.
    expect(placeToolbar({ x: 500, y: 400, w: 300, h: 100 }, canvasRect, 1000, parent, size)).toEqual({ left: 170, top: 213 });
  });

  it('goes below the layer when there is no room above', () => {
    // Canvas at the very top: the layer's top edge is at 0, so the toolbar goes 12px below its bottom (20).
    expect(placeToolbar({ x: 500, y: 20, w: 300, h: 40 }, { ...canvasRect, top: 0 }, 1000, parent, size)).toEqual({ left: 170, top: 32 });
  });

  it('stays inside the container at the edges', () => {
    expect(placeToolbar({ x: 0, y: 400, w: 40, h: 40 }, canvasRect, 1000, parent, size).left).toBe(8);
    expect(placeToolbar({ x: 1000, y: 400, w: 40, h: 40 }, canvasRect, 1000, parent, size).left).toBe(332);
  });

  it('allows for rotation: a layer turned 90 degrees is as tall as it was wide', () => {
    // 300 wide turned upright -> 150px tall on screen -> top edge at 300 - 75 = 225.
    expect(placeToolbar({ x: 500, y: 400, w: 300, h: 20, rotation: 90 }, canvasRect, 1000, parent, size).top).toBe(163);
  });
});
