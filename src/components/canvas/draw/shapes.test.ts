// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { arrowHead, isTooSmall, paintCensor, paintShape, rectBetween, sketchPoints, startDragDrawing } from './shapes';
import type { CensorDrawing, ShapeDrawing } from './shapes';
import { createRecordingContext, callsNamed } from '../testing/recordingContext';

const opts = { shape: 'arrow' as const, color: '#ff0000', size: 6, fill: false, censor: 'blur' as const, strength: 10 };
const shape = (over: Partial<ShapeDrawing>): ShapeDrawing => ({ ...(startDragDrawing('shape', { x: 10, y: 20 }, opts) as ShapeDrawing), ...over });

afterEach(() => vi.restoreAllMocks());

describe('drag drawings', () => {
  it('start where the pointer went down, with the current settings', () => {
    const s = startDragDrawing('shape', { x: 5, y: 7 }, opts);
    expect(s).toMatchObject({ type: 'shape', shape: 'arrow', color: '#ff0000', size: 6, points: [{ x: 5, y: 7 }, { x: 5, y: 7 }] });
    expect(s.points[0]).not.toBe(s.points[1]);
    expect(startDragDrawing('censor', { x: 5, y: 7 }, opts)).toMatchObject({ type: 'censor', censor: 'blur', strength: 10 });
  });

  it('a drag shorter than a few pixels is a tap', () => {
    expect(isTooSmall(shape({ points: [{ x: 0, y: 0 }, { x: 3, y: 3 }] }))).toBe(true);
    expect(isTooSmall(shape({ points: [{ x: 0, y: 0 }, { x: 30, y: 0 }] }))).toBe(false);
  });

  it('the box between two corners, dragged either way', () => {
    expect(rectBetween({ x: 50, y: 40 }, { x: 10, y: 100 })).toEqual({ x: 10, y: 40, w: 40, h: 60 });
  });

  it('an arrow head has two barbs behind the tip, either side of the line', () => {
    const [l, r] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 6);
    expect(l.x).toBeLessThan(100);
    expect(r.x).toBeLessThan(100);
    expect(Math.sign(l.y)).toBe(-Math.sign(r.y));
  });
});

describe('paintShape', () => {
  it('outlines a box, or fills it when asked', () => {
    const ctx = createRecordingContext();
    paintShape(ctx as unknown as CanvasRenderingContext2D, shape({ shape: 'rect', points: [{ x: 50, y: 50 }, { x: 10, y: 20 }] }));
    expect(callsNamed(ctx, 'rect')[0].args).toEqual([10, 20, 40, 30]);
    expect(callsNamed(ctx, 'stroke')[0].state).toMatchObject({ strokeStyle: '#ff0000', lineWidth: 6 });
    const filled = createRecordingContext();
    paintShape(filled as unknown as CanvasRenderingContext2D, shape({ shape: 'rect', fill: true, points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] }));
    expect(callsNamed(filled, 'fill')).toHaveLength(1);
    expect(callsNamed(filled, 'stroke')).toHaveLength(0);
  });

  it('draws a circle as an ellipse filling the dragged box', () => {
    const ctx = createRecordingContext();
    paintShape(ctx as unknown as CanvasRenderingContext2D, shape({ shape: 'ellipse', points: [{ x: 0, y: 0 }, { x: 100, y: 40 }] }));
    expect(callsNamed(ctx, 'ellipse')[0].args.slice(0, 4)).toEqual([50, 20, 50, 20]);
  });

  it('an arrow is its line plus the two barbs; a line is just the line', () => {
    const arrow = createRecordingContext();
    paintShape(arrow as unknown as CanvasRenderingContext2D, shape({ shape: 'arrow', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }));
    expect(callsNamed(arrow, 'lineTo')).toHaveLength(3);
    const line = createRecordingContext();
    paintShape(line as unknown as CanvasRenderingContext2D, shape({ shape: 'line', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }));
    expect(callsNamed(line, 'lineTo')).toHaveLength(1);
  });
});

describe('paintCensor', () => {
  // A context with a real-looking canvas size; drawImage/fillRect record their calls.
  const fakeCtx = () => {
    const calls: { name: string; args: unknown[]; smoothing: boolean }[] = [];
    const ctx = {
      canvas: { width: 200, height: 100 },
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'low',
      fillStyle: '',
      save() {},
      restore() {},
      fillRect(...args: unknown[]) { calls.push({ name: 'fillRect', args, smoothing: ctx.imageSmoothingEnabled }); },
      drawImage(...args: unknown[]) { calls.push({ name: 'drawImage', args, smoothing: ctx.imageSmoothingEnabled }); },
    };
    return { ctx, calls };
  };
  const censor = (mode: CensorDrawing['censor'], points: CensorDrawing['points'] = [{ x: 20, y: 10 }, { x: 60, y: 50 }]): CensorDrawing =>
    ({ id: 'c', type: 'censor', censor: mode, strength: 10, points });

  it('a black bar fills the region with black', () => {
    const { ctx, calls } = fakeCtx();
    paintCensor(ctx as unknown as CanvasRenderingContext2D, censor('bar'));
    expect(calls).toEqual([{ name: 'fillRect', args: [20, 10, 40, 40], smoothing: true }]);
    expect(ctx.fillStyle).toBe('#000000');
  });

  it('pixelate shrinks the region to blocks and scales it back without smoothing; blur with smoothing', () => {
    const small = fakeCtx();
    vi.spyOn(document, 'createElement').mockImplementation(() => ({ width: 0, height: 0, getContext: () => small.ctx }) as unknown as HTMLElement);
    const { ctx, calls } = fakeCtx();
    paintCensor(ctx as unknown as CanvasRenderingContext2D, censor('pixelate'));
    // 40 x 40 region in 10px blocks: shrunk to 4 x 4 and drawn back over the region.
    expect(small.calls[0].args).toEqual([ctx.canvas, 20, 10, 40, 40, 0, 0, 4, 4]);
    expect(calls[0]).toMatchObject({ name: 'drawImage', smoothing: false });
    expect(calls[0].args.slice(5)).toEqual([20, 10, 40, 40]);

    const blurred = fakeCtx();
    paintCensor(blurred.ctx as unknown as CanvasRenderingContext2D, censor('blur'));
    expect(blurred.calls[0]).toMatchObject({ name: 'drawImage', smoothing: true });
  });

  it('is clipped to the canvas and skipped when empty', () => {
    const { ctx, calls } = fakeCtx();
    paintCensor(ctx as unknown as CanvasRenderingContext2D, censor('bar', [{ x: 180, y: 90 }, { x: 260, y: 160 }]));
    expect(calls[0].args).toEqual([180, 90, 20, 10]);
    const empty = fakeCtx();
    paintCensor(empty.ctx as unknown as CanvasRenderingContext2D, censor('bar', [{ x: 250, y: 10 }, { x: 300, y: 50 }]));
    expect(empty.calls).toHaveLength(0);
  });
});

describe('shape presets', () => {
  it('draws a highlight as a see-through filled box', () => {
    const ctx = createRecordingContext();
    paintShape(ctx as unknown as CanvasRenderingContext2D, shape({ shape: 'highlight', points: [{ x: 0, y: 0 }, { x: 40, y: 20 }] }));
    const [fill] = callsNamed(ctx, 'fillRect');
    expect(fill.args).toEqual([0, 0, 40, 20]);
    expect(fill.state.globalAlpha).toBe(0.38);
  });

  it('puts a head on both ends of a both-ways arrow', () => {
    const ctx = createRecordingContext();
    paintShape(ctx as unknown as CanvasRenderingContext2D, shape({ shape: 'double', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }));
    const ends = callsNamed(ctx, 'lineTo').map((c) => c.args[0]);
    expect(ends.filter((x) => x === 100).length).toBeGreaterThanOrEqual(2);
    expect(ends.filter((x) => x === 0).length).toBeGreaterThanOrEqual(1);
  });

  it('sketches a wobbly ring that is the same every time for a shape', () => {
    const r = { x: 0, y: 0, w: 200, h: 100 };
    const a = sketchPoints(r, 'shape-1');
    expect(a).toEqual(sketchPoints(r, 'shape-1'));
    expect(a).not.toEqual(sketchPoints(r, 'shape-2'));
    // Close to the ellipse: every point within 10% of its radii.
    for (const p of a) expect(Math.hypot((p.x - 100) / 100, (p.y - 50) / 50)).toBeGreaterThan(0.9);
  });
});
