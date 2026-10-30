import { describe, it, expect } from 'vitest';
import {
  dragDrawingHandle, drawingBox, drawingHandles, duplicateDrawing, hitDrawingAt, hitDrawingHandle,
  isDragDrawing, isOnDrawing, moveDrawingPoints
} from './drawingHits';
import type { CensorDrawing, ShapeDrawing } from '../draw/shapes';

const shape = (o: Partial<ShapeDrawing>): ShapeDrawing => ({
  id: 's1', type: 'shape', shape: 'rect', color: '#fff', size: 10, points: [{ x: 100, y: 100 }, { x: 300, y: 200 }], ...o,
});
const censor: CensorDrawing = { id: 'c1', type: 'censor', censor: 'blur', strength: 12, points: [{ x: 0, y: 0 }, { x: 50, y: 50 }] };

describe('picking shapes and censor regions', () => {
  it('knows them apart from freehand strokes', () => {
    expect(isDragDrawing(censor)).toBe(true);
    expect(isDragDrawing({ type: 'brush', points: [] })).toBe(false);
    expect(isDragDrawing(null)).toBe(false);
  });

  it('picks a line or arrow near its line only', () => {
    const arrow = shape({ shape: 'arrow', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] });
    expect(isOnDrawing(arrow, { x: 50, y: 8 }, 4)).toBe(true);
    expect(isOnDrawing(arrow, { x: 50, y: 20 }, 4)).toBe(false);
    expect(isOnDrawing(arrow, { x: 130, y: 0 }, 4)).toBe(false);
  });

  it('picks an outlined box on its edge, a filled one anywhere inside', () => {
    expect(isOnDrawing(shape({}), { x: 102, y: 150 }, 4)).toBe(true);
    expect(isOnDrawing(shape({}), { x: 200, y: 150 }, 4)).toBe(false);
    expect(isOnDrawing(shape({ fill: true }), { x: 200, y: 150 }, 4)).toBe(true);
    expect(isOnDrawing(shape({ fill: true }), { x: 400, y: 150 }, 4)).toBe(false);
  });

  it('picks a circle near its line, or inside when filled', () => {
    const circle = shape({ shape: 'ellipse', points: [{ x: 0, y: 0 }, { x: 200, y: 200 }] });
    expect(isOnDrawing(circle, { x: 200, y: 100 }, 4)).toBe(true);
    expect(isOnDrawing(circle, { x: 100, y: 100 }, 4)).toBe(false);
    expect(isOnDrawing({ ...circle, fill: true }, { x: 100, y: 100 }, 4)).toBe(true);
  });

  it('finds the topmost drawing, optionally of one type', () => {
    const under = shape({ id: 'under', fill: true });
    const over = shape({ id: 'over', fill: true });
    const drawings = [under, { type: 'brush', points: [] }, over, censor];
    expect(hitDrawingAt(drawings, { x: 200, y: 150 }, 4)?.id).toBe('over');
    expect(hitDrawingAt(drawings, { x: 20, y: 20 }, 4, 'shape')).toBeNull();
    expect(hitDrawingAt(drawings, { x: 20, y: 20 }, 4, 'censor')?.id).toBe('c1');
  });
});

describe('moving and resizing them', () => {
  it('gives lines two ends and boxes four corners', () => {
    expect(drawingHandles(shape({ shape: 'line' }))).toHaveLength(2);
    expect(drawingHandles(shape({})).map((h) => h.at)).toEqual([
      { x: 100, y: 100 }, { x: 300, y: 100 }, { x: 100, y: 200 }, { x: 300, y: 200 },
    ]);
    expect(hitDrawingHandle(shape({}), { x: 296, y: 104 }, 12)).toEqual({ xi: 1, yi: 0 });
    expect(hitDrawingHandle(shape({}), { x: 200, y: 150 }, 12)).toBeNull();
  });

  it('drags a corner, which moves one x and one y', () => {
    const pts = shape({}).points;
    expect(dragDrawingHandle(pts, { xi: 1, yi: 0 }, { x: 350, y: 80 })).toEqual([{ x: 100, y: 80 }, { x: 350, y: 200 }]);
    // The original points are left alone.
    expect(pts[0]).toEqual({ x: 100, y: 100 });
  });

  it('moves both points, duplicates with an offset and reports a padded box', () => {
    expect(moveDrawingPoints(censor.points, 10, -5)).toEqual([{ x: 10, y: -5 }, { x: 60, y: 45 }]);
    expect(duplicateDrawing(censor, 'c2').points[0]).toEqual({ x: 24, y: 24 });
    expect(drawingBox(shape({}))).toEqual({ x: 200, y: 150, w: 222, h: 122, rotation: 0 });
  });
});
