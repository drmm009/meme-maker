import { describe, expect, it, vi } from 'vitest';

// Tests share a module cache (isolate: false) and the video editor's tests mock this module.
vi.resetModules();
const { maskAlpha, needsFrameRenderer } = await import('./personSegmenter');

describe('background removal', () => {
  it('clears what the model is sure is background, keeps the person, and blends between', () => {
    expect(maskAlpha(0, 0.3)).toBe(0);
    expect(maskAlpha(1, 0.3)).toBe(1);
    expect(maskAlpha(0.5, 0.3)).toBeCloseTo(0.5);
    // Opacity only grows with confidence.
    const steps = [0.3, 0.4, 0.5, 0.6, 0.7].map((c) => maskAlpha(c, 0.3));
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThanOrEqual(steps[i - 1]);
  });

  it('softens the edge as softness goes up', () => {
    // Just past the middle: nearly solid when crisp, partly see-through when soft.
    expect(maskAlpha(0.58, 0)).toBe(1);
    expect(maskAlpha(0.58, 1)).toBeLessThan(0.7);
    expect(maskAlpha(0.42, 0)).toBe(0);
    expect(maskAlpha(0.42, 1)).toBeGreaterThan(0.3);
  });

  it('needs the frame-by-frame export for a shown video clip with it on', () => {
    expect(needsFrameRenderer({ type: 'video', bgRemoval: { softness: 0.3 } })).toBe(true);
    expect(needsFrameRenderer({ type: 'video', bgRemoval: null })).toBe(false);
    expect(needsFrameRenderer({ type: 'video', hidden: true, bgRemoval: { softness: 0.3 } })).toBe(false);
    expect(needsFrameRenderer({ type: 'image', bgRemoval: { softness: 0.3 } })).toBe(false);
  });
});
