import { describe, it, expect } from 'vitest';
import { IDENTITY_VIEW, MAX_ZOOM, clampView, isZoomed, panView, pinchOf, pinchView, wheelZoomFactor, zoomAt } from './viewZoom';

const size = { width: 300, height: 400 };

describe('canvas view zoom', () => {
  it('keeps the zoom between 1x and the maximum, and snaps home at 1x', () => {
    expect(clampView({ zoom: 0.5, x: 40, y: 40 }, size)).toBe(IDENTITY_VIEW);
    expect(clampView({ zoom: 9, x: 0, y: 0 }, size).zoom).toBe(MAX_ZOOM);
    expect(isZoomed(IDENTITY_VIEW)).toBe(false);
  });

  it('cannot pan the zoomed canvas off its own box', () => {
    // At 2x the canvas is 600 x 800, so it can move 150 sideways and 200 up or down.
    expect(clampView({ zoom: 2, x: 999, y: -999 }, size)).toEqual({ zoom: 2, x: 150, y: -200 });
    expect(panView({ zoom: 2, x: 0, y: 0 }, 30, -20, size)).toEqual({ zoom: 2, x: 30, y: -20 });
  });

  it('zooms about a point, keeping what is under it in place', () => {
    const at = { x: 60, y: -40 };
    const v = zoomAt(IDENTITY_VIEW, 2, at, size);
    expect(v).toEqual({ zoom: 2, x: -60, y: 40 });
    // The content point that was under `at` (at 1x it was `at` itself) is still under it.
    expect(v.x + v.zoom * at.x).toBe(at.x);
    expect(v.y + v.zoom * at.y).toBe(at.y);
  });

  it('follows two fingers: spread zooms, moving together pans', () => {
    const from = { mid: { x: 0, y: 0 }, dist: 100 };
    expect(pinchView(IDENTITY_VIEW, from, { mid: { x: 0, y: 0 }, dist: 200 }, size)).toEqual({ zoom: 2, x: 0, y: 0 });
    const start = { zoom: 2, x: 0, y: 0 };
    expect(pinchView(start, from, { mid: { x: 25, y: 10 }, dist: 100 }, size)).toEqual({ zoom: 2, x: 25, y: 10 });
  });

  it('reads two touches and turns wheel deltas into zoom steps', () => {
    expect(pinchOf([{ clientX: 0, clientY: 0 }, { clientX: 30, clientY: 40 }])).toEqual({ mid: { x: 15, y: 20 }, dist: 50 });
    expect(pinchOf([{ clientX: 0, clientY: 0 }])).toBeNull();
    expect(wheelZoomFactor(-100)).toBeGreaterThan(1);
    expect(wheelZoomFactor(100)).toBeLessThan(1);
    expect(wheelZoomFactor(0)).toBe(1);
  });
});
