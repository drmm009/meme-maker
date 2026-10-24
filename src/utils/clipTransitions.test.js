import { describe, it, expect } from 'vitest';
import { previousClip, transitionFrame, transitionFilters } from './clipTransitions';

const a = { id: 'a', type: 'video', startMs: 0, endMs: 2000 };
const b = (type) => ({ id: 'b', type: 'video', startMs: 2000, endMs: 4000, transitionIn: type && { type, durationMs: 500 } });

describe('clipTransitions', () => {
  it('finds the clip a cut joins, ignoring overlays and gaps', () => {
    const items = [a, b('fade'), { id: 't', type: 'text', startMs: 0, endMs: 2000 }];
    expect(previousClip(items, items[1]).id).toBe('a');
    expect(previousClip([a, { ...b('fade'), startMs: 2100 }], { ...b('fade'), startMs: 2100 })).toBe(null);
    expect(previousClip(items, items[2])).toBe(null);
  });

  it('fades out the last half and in the first half (a dip through the background)', () => {
    const items = [a, b('fade')];
    expect(transitionFrame(items, a, 1700)).toMatchObject({ opacity: 1 });
    expect(transitionFrame(items, a, 1875).opacity).toBeCloseTo(0.5);
    expect(transitionFrame(items, a, 2000).opacity).toBeCloseTo(0);
    expect(transitionFrame(items, items[1], 2000).opacity).toBeCloseTo(0);
    expect(transitionFrame(items, items[1], 2125).opacity).toBeCloseTo(0.5);
    expect(transitionFrame(items, items[1], 2300)).toEqual({ opacity: 1, zoom: 1, dx: 0 });
  });

  it('zooms through the cut and whips sideways for slide', () => {
    const zoom = [a, b('zoom')];
    expect(transitionFrame(zoom, a, 2000).zoom).toBeCloseTo(1.15);
    expect(transitionFrame(zoom, zoom[1], 2000).zoom).toBeCloseTo(1.15);
    expect(transitionFrame(zoom, zoom[1], 2250).zoom).toBeCloseTo(1);
    const slide = [a, b('slide')];
    expect(transitionFrame(slide, a, 2000).dx).toBeCloseTo(-800);
    expect(transitionFrame(slide, slide[1], 2000).dx).toBeCloseTo(800);
    expect(transitionFrame(slide, slide[1], 2250).dx).toBeCloseTo(0);
  });

  it('does nothing without a transition or a joining clip', () => {
    expect(transitionFrame([a, b(null)], a, 1990)).toEqual({ opacity: 1, zoom: 1, dx: 0 });
    expect(transitionFilters([a, b(null)], a, 640, 360, 1.6)).toEqual({ chain: '', dx: null });
  });

  it('builds FFmpeg fades, zoom and slide offsets that match the preview', () => {
    const fade = transitionFilters([a, b('fade')], b('fade'), 640, 360, 1.6);
    expect(fade.chain).toBe(',format=yuva420p,fade=t=in:st=2.000:d=0.250:alpha=1');
    const outgoing = transitionFilters([a, b('zoom')], a, 640, 360, 1.6);
    expect(outgoing.chain).toContain("scale=w='640*");
    expect(outgoing.chain).toContain('fade=t=out:st=1.750:d=0.250:alpha=1');
    const slide = transitionFilters([a, b('slide')], b('slide'), 640, 360, 1.6);
    // Evaluate the dx expression at a few times and compare with the preview (scaled by 1.6).
    const evalExpr = (expr, t) => {
      const mem = [];
      const js = expr.replace(/st\(0,/g, 'st0(').replace(/ld\(0\)/g, 'ld0()');
      return Function('t', 'clip', 'st0', 'ld0', `return ${js}`)(
        t, (x, lo, hi) => Math.min(hi, Math.max(lo, x)), (v) => { mem[0] = v; return v; }, () => mem[0],
      );
    };
    for (const ms of [2000, 2100, 2250, 2400]) {
      expect(evalExpr(slide.dx, ms / 1000)).toBeCloseTo(transitionFrame([a, b('slide')], b('slide'), ms).dx * 1.6, 1);
    }
  });
});
