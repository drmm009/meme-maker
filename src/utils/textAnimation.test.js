import { describe, it, expect } from 'vitest';
import { textAnimFrame, animationSteps, shakeExpressions, shakeOffset, typeCharMs, revealRects, REST_FRAME, POP_MS } from './textAnimation';

const text = (extra) => ({ type: 'text', text: 'HELLO', fontSize: 50, startMs: 1000, endMs: 4000, ...extra });

describe('textAnimFrame', () => {
  it('rests when there is no animation', () => {
    expect(textAnimFrame(text({}), 100)).toBe(REST_FRAME);
  });

  it('pops from nothing past full size and settles', () => {
    const item = text({ animation: 'pop' });
    expect(textAnimFrame(item, 0)).toMatchObject({ scale: 0, opacity: 0 });
    expect(textAnimFrame(item, POP_MS * 0.7).scale).toBeCloseTo(1.12);
    expect(textAnimFrame(item, POP_MS)).toMatchObject({ scale: 1, opacity: 1 });
    expect(textAnimFrame(item, 5000)).toMatchObject({ scale: 1, opacity: 1 });
  });

  it('shakes around the rest position with a size-based amplitude', () => {
    const item = text({ animation: 'shake' });
    const offsets = [0, 13, 37, 71, 120].map((t) => textAnimFrame(item, t));
    for (const f of offsets) {
      expect(Math.abs(f.dx)).toBeLessThanOrEqual(3.0001);
      expect(Math.abs(f.dy)).toBeLessThanOrEqual(1.8001);
    }
    expect(new Set(offsets.map((f) => f.dx.toFixed(2))).size).toBeGreaterThan(2);
  });

  it('types one character per step and then shows everything', () => {
    const item = text({ animation: 'typewriter' });
    expect(typeCharMs(item)).toBe(55);
    expect(textAnimFrame(item, 0).chars).toBe(1);
    expect(textAnimFrame(item, 120).chars).toBe(3);
    expect(textAnimFrame(item, 1000).chars).toBe(Infinity);
  });

  it('types faster on a short clip and ignores line breaks', () => {
    const item = text({ animation: 'typewriter', text: 'AB\nCD', endMs: 1100 });
    expect(typeCharMs(item)).toBe(20);
  });
});

describe('animationSteps', () => {
  it('is one still for no animation and for shake', () => {
    expect(animationSteps(text({}))).toEqual([{ fromMs: 0, toMs: 3000, frame: REST_FRAME }]);
    expect(animationSteps(text({ animation: 'shake' }))).toHaveLength(1);
  });

  it('steps through the pop at the frame rate, then rests', () => {
    const steps = animationSteps(text({ animation: 'pop' }), 30);
    expect(steps).toHaveLength(12);
    expect(steps[0]).toMatchObject({ fromMs: 0, frame: { scale: 0 } });
    expect(steps[11]).toMatchObject({ toMs: 3000, frame: REST_FRAME });
    steps.slice(1).forEach((s, i) => expect(s.fromMs).toBeCloseTo(steps[i].toMs));
  });

  it('steps per character for the typewriter', () => {
    const steps = animationSteps(text({ animation: 'typewriter' }));
    expect(steps.map((s) => s.frame.chars)).toEqual([1, 2, 3, 4, Infinity]);
    expect(steps[4]).toMatchObject({ fromMs: 220, toMs: 3000 });
  });

  it('caps long typewriter text at 80 steps', () => {
    const steps = animationSteps(text({ animation: 'typewriter', text: 'x'.repeat(400), endMs: 60000 }));
    expect(steps.length).toBeLessThanOrEqual(81);
  });
});

describe('shakeExpressions', () => {
  it('matches shakeOffset at the same moment', () => {
    const item = text({ animation: 'shake' });
    const { x, y } = shakeExpressions(item, 1, 2);
    const at = (expr, t) => Function('t', 'PI', 'sin', `return ${expr}`)(t, Math.PI, Math.sin);
    const o = shakeOffset(item, 230);
    expect(at(x, 1.23)).toBeCloseTo(o.dx * 2, 1);
    expect(at(y, 1.23)).toBeCloseTo(o.dy * 2, 1);
  });
});

describe('revealRects', () => {
  // A stand-in for a laid-out Konva.Text: 10px per character, centred, two lines.
  const node = {
    textArr: [{ text: 'HELLO', width: 50 }, { text: 'HI', width: 20 }],
    fontSize: () => 20, lineHeight: () => 1, width: () => 50, align: () => 'center',
    padding: () => 0, strokeWidth: () => 0, letterSpacing: () => 0,
    measureSize: (s) => ({ width: s.length * 10 }),
  };

  it('reveals the first line partially, keeping centred positions', () => {
    expect(revealRects(node, 3)).toEqual([{ x: -2, y: -2, width: 32, height: 24 }]);
  });

  it('finishes earlier lines before starting the next', () => {
    const rects = revealRects(node, 6);
    expect(rects).toHaveLength(2);
    expect(rects[0].width).toBe(54);
    expect(rects[1]).toMatchObject({ x: 13, y: 18, width: 12 });
  });
});
