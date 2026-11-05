import { describe, it, expect } from 'vitest';
import { peaksFrom, waveBarsFor } from './waveform';

describe('peaksFrom', () => {
  it('keeps the loudest sample per slice across channels, scaled to the loudest', () => {
    // 4 slices of 10 samples at 40 samples/s, 4 slices/s.
    const left = new Float32Array(40);
    const right = new Float32Array(40);
    left[3] = 0.25;
    right[15] = -0.5;
    left[39] = 0.1;
    const peaks = peaksFrom([left, right], 40, 4);
    expect(peaks.perSec).toBe(4);
    expect(Array.from(peaks.values).map((v) => Math.round(v * 100) / 100)).toEqual([0.5, 1, 0, 0.2]);
  });

  it('leaves silence at zero', () => {
    expect(Array.from(peaksFrom([new Float32Array(20)], 20, 2).values)).toEqual([0, 0]);
  });
});

describe('waveBarsFor', () => {
  // One slice per 100ms: quiet, loud, quiet, quiet…
  const peaks = { values: Float32Array.from([0, 1, 0, 0, 0.5, 0, 0, 0]), perSec: 10 };

  it('draws the part of the sound the clip plays, one bar per few pixels', () => {
    // 100px per second, 10px bars: one slice per bar.
    expect(waveBarsFor(peaks, { width: 40, pxPerSec: 100, barPx: 10 })).toEqual([6, 100, 6, 6]);
  });

  it('starts at the trim and covers more sound when sped up', () => {
    expect(waveBarsFor(peaks, { width: 20, pxPerSec: 100, barPx: 10, trimStartMs: 400 })).toEqual([53, 6]);
    expect(waveBarsFor(peaks, { width: 20, pxPerSec: 100, barPx: 10, rate: 2 })).toEqual([100, 6]);
  });

  it('is quiet past the end of the sound', () => {
    expect(waveBarsFor(peaks, { width: 20, pxPerSec: 100, barPx: 10, trimStartMs: 2000 })).toEqual([6, 6]);
  });
});
