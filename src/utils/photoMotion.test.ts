import { describe, it, expect } from 'vitest';
import { MOTION_ZOOM, motionFilter, photoMotionFrame } from './photoMotion';
import { sourceRect, FULL_CROP } from './clipCrop';

const at = (motion: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | null, tMs: number) =>
  photoMotionFrame({ motion, startMs: 1000, endMs: 3000 }, tMs);

describe('photoMotionFrame', () => {
  it('stays still without a motion', () => {
    expect(at(null, 2000)).toEqual({ zoom: 1, panX: 0 });
  });

  it('zooms in and out across the clip, holding before and after it', () => {
    expect(at('zoom-in', 1000).zoom).toBe(1);
    expect(at('zoom-in', 2000).zoom).toBeCloseTo((1 + MOTION_ZOOM) / 2);
    expect(at('zoom-in', 5000).zoom).toBe(MOTION_ZOOM);
    expect(at('zoom-out', 0).zoom).toBe(MOTION_ZOOM);
    expect(at('zoom-out', 3000).zoom).toBe(1);
  });

  it('pans from one edge to the other, zoomed in to have room', () => {
    expect(at('pan-right', 1000)).toEqual({ zoom: MOTION_ZOOM, panX: -1 });
    expect(at('pan-right', 3000)).toEqual({ zoom: MOTION_ZOOM, panX: 1 });
    expect(at('pan-left', 1000).panX).toBe(1);
    expect(at('pan-left', 2000).panX).toBeCloseTo(0);
  });

  it('pans the source rectangle from the left edge to the right', () => {
    expect(sourceRect(1000, 500, FULL_CROP, 2, -1)?.x).toBe(0);
    expect(sourceRect(1000, 500, FULL_CROP, 2, 0)?.x).toBe(250);
    expect(sourceRect(1000, 500, FULL_CROP, 2, 1)?.x).toBe(500);
  });
});

describe('motionFilter', () => {
  it('adds nothing without a motion', () => {
    expect(motionFilter({ startMs: 0, endMs: 1000 }, 100, 50, 0, 1)).toBe('');
  });

  it('zooms at twice the size on the output clock, then scales back', () => {
    const f = motionFilter({ motion: 'zoom-in', startMs: 2000, endMs: 4000 }, 100, 50, 2, 4);
    expect(f).toContain("scale=w='200*(1+0.250*clip((t-2.000)/2.000,0,1))'");
    expect(f).toContain(':eval=frame,crop=200:100:');
    expect(f.endsWith(',scale=100:50')).toBe(true);
  });

  it('pans by moving the crop across', () => {
    const f = motionFilter({ motion: 'pan-right', startMs: 0, endMs: 1000 }, 100, 50, 0, 1);
    expect(f).toContain("x='(iw-200)/2*(1+(2*clip((t-0.000)/1.000,0,1)-1))'");
  });
});
