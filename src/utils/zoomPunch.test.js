import { describe, it, expect } from 'vitest';
import { clipPunchTimes, punchZoom, punchFilter, PUNCH } from './zoomPunch';

describe('zoomPunch', () => {
  it('maps footage punches to the clip timeline, dropping ones trimmed away', () => {
    const item = { startMs: 1000, endMs: 3000, trimStartMs: 2000, playbackRate: 2, punches: [1000, 2400, 5000, 9000] };
    // Footage 2400 -> 1000 + 400/2 = 1200; 5000 -> 2500; 1000 is before the trim, 9000 after the end.
    expect(clipPunchTimes(item)).toEqual([1200, 2500]);
    expect(clipPunchTimes({ startMs: 0, endMs: 1000 })).toEqual([]);
  });

  it('rises fast to the peak and eases back to rest', () => {
    const times = [1000];
    expect(punchZoom(times, 999)).toBe(1);
    expect(punchZoom(times, 1040)).toBeCloseTo(1 + PUNCH.amp / 2);
    expect(punchZoom(times, 1080)).toBeCloseTo(1 + PUNCH.amp);
    expect(punchZoom(times, 1240)).toBeCloseTo(1 + PUNCH.amp * 0.25);
    expect(punchZoom(times, 1400)).toBeCloseTo(1);
    expect(punchZoom(times, 1500)).toBe(1);
  });

  it('builds a scale-and-crop filter whose expression matches the preview curve', () => {
    expect(punchFilter([], 640, 360)).toBe('');
    const filter = punchFilter([1000], 640, 360);
    expect(filter.startsWith(",scale=w='640*(1+")).toBe(true);
    expect(filter.endsWith(':eval=frame,crop=640:360')).toBe(true);
    const zExpr = filter.match(/w='640\*(.*?)':h=/)[1];
    const evalAt = (t) => Function('t', 'between', 'pow', `return ${zExpr.replace(/if\(/g, 'iff(')}`)
      .call(null, t, (x, a, b) => (x >= a && x <= b ? 1 : 0), Math.pow);
    globalThis.iff = (c, a, b) => (c ? a : b);
    for (const ms of [1000, 1040, 1080, 1240, 1400]) expect(evalAt(ms / 1000)).toBeCloseTo(punchZoom([1000], ms), 3);
    delete globalThis.iff;
  });
});
