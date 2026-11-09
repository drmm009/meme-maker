import { describe, it, expect } from 'vitest';
import { CLIP_FX, isClipFx, popColour, seeded, thermalColour, y2kColour } from './clipFx';
import { needsFrameRenderer } from './personSegmenter';

describe('clip effects', () => {
  it('knows its effects', () => {
    expect(CLIP_FX.map((f) => f.id)).toEqual(['glitch', 'pixel', 'vhs', 'y2k', 'thermal', 'pop', 'mirror']);
    expect(isClipFx('glitch')).toBe(true);
    expect(isClipFx('sparkle')).toBe(false);
    expect(isClipFx(null)).toBe(false);
  });

  it('glitches the same way for the same moment (preview and export agree)', () => {
    expect(seeded(42)).toBe(seeded(42));
    expect(seeded(42)).not.toBe(seeded(43));
    for (let i = 0; i < 200; i++) {
      const r = seeded(i);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });

  it('maps colours: thermal dark blue to yellow-white, Y2K blue to pink, Pop to flat levels', () => {
    expect(thermalColour(0, 0, 0)).toEqual([8, 8, 60]);
    expect(thermalColour(255, 255, 255)).toEqual([255, 240, 120]);
    expect(y2kColour(0, 0, 0)).toEqual([30, 20, 160]);
    expect(y2kColour(255, 255, 255)).toEqual([255, 110, 200]);
    expect(popColour(250, 20, 20)).toEqual([255, 0, 0]);
    popColour(123, 77, 200).forEach((c) => expect(c % 85).toBe(0));
  });

  it('sends a video with an effect to the frame-by-frame export', () => {
    expect(needsFrameRenderer({ type: 'video', filter: { fx: 'glitch' } })).toBe(true);
    expect(needsFrameRenderer({ type: 'video', filter: { fx: null } })).toBe(false);
    expect(needsFrameRenderer({ type: 'video', hidden: true, filter: { fx: 'glitch' } })).toBe(false);
  });
});
