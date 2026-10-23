import { describe, it, expect } from 'vitest';
import { clipGain, fadeFilter } from './audioFades';

const clip = (extra) => ({ startMs: 1000, endMs: 3000, ...extra });

describe('clipGain', () => {
  it('is the volume when there are no fades', () => {
    expect(clipGain(clip({}), 2000)).toBe(1);
    expect(clipGain(clip({ volume: 0.4 }), 2000)).toBe(0.4);
    expect(clipGain(clip({ volume: 3 }), 2000)).toBe(1);
  });

  it('ramps up during a fade in and down during a fade out', () => {
    const c = clip({ fadeInMs: 500, fadeOutMs: 1000, volume: 0.8 });
    expect(clipGain(c, 1000)).toBe(0);
    expect(clipGain(c, 1250)).toBeCloseTo(0.4);
    expect(clipGain(c, 1800)).toBeCloseTo(0.8);
    expect(clipGain(c, 2500)).toBeCloseTo(0.4);
    expect(clipGain(c, 3000)).toBe(0);
  });

  it('shrinks fades that overlap on a short clip', () => {
    const c = clip({ fadeInMs: 2000, fadeOutMs: 2000 });
    expect(clipGain(c, 2000)).toBeCloseTo(1);
    expect(clipGain(c, 1500)).toBeCloseTo(0.5);
  });
});

describe('fadeFilter', () => {
  it('builds afade filters relative to the clip', () => {
    expect(fadeFilter(clip({}), 2)).toBe('');
    expect(fadeFilter(clip({ fadeInMs: 500 }), 2)).toBe(',afade=t=in:st=0:d=0.500');
    expect(fadeFilter(clip({ fadeInMs: 500, fadeOutMs: 600 }), 2)).toBe(',afade=t=in:st=0:d=0.500,afade=t=out:st=1.400:d=0.600');
  });
});
