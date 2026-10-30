// Shapes and censor regions as things to select, move and resize (draw/shapes.ts paints them).
// Everything is in canvas pixels, like the drawings' points.
import { rectBetween } from '../draw/shapes';
import type { DragDrawing } from '../draw/shapes';
import type { Point } from './geometry';

export const isDragDrawing = (d: unknown): d is DragDrawing =>
  Boolean(d) && ((d as DragDrawing).type === 'shape' || (d as DragDrawing).type === 'censor');

const isLine = (d: DragDrawing) => d.type === 'shape' && (d.shape === 'line' || d.shape === 'arrow' || d.shape === 'double');

// A corner (or a line's end) to drag: it is made of points[xi].x and points[yi].y.
export interface DrawingHandle {
  xi: 0 | 1;
  yi: 0 | 1;
}

// Lines and arrows have their two ends; boxes, circles and censor regions their four corners.
export function drawingHandles(d: DragDrawing): { handle: DrawingHandle; at: Point }[] {
  const [a, b] = d.points;
  const pick = (xi: 0 | 1, yi: 0 | 1) => ({ handle: { xi, yi }, at: { x: (xi ? b : a).x, y: (yi ? b : a).y } });
  return isLine(d) ? [pick(0, 0), pick(1, 1)] : [pick(0, 0), pick(1, 0), pick(0, 1), pick(1, 1)];
}

// The handle nearest `p`, if one is within `radius`.
export function hitDrawingHandle(d: DragDrawing, p: Point, radius: number): DrawingHandle | null {
  let best: DrawingHandle | null = null;
  let bestDist = radius;
  for (const { handle, at } of drawingHandles(d)) {
    const dist = Math.hypot(p.x - at.x, p.y - at.y);
    if (dist <= bestDist) {
      best = handle;
      bestDist = dist;
    }
  }
  return best;
}

const distToSegment = (p: Point, a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

// Is `p` on the drawing, `pad` pixels of slack included? Outlined boxes and circles count only
// near their line, so what is inside them can still be picked.
export function isOnDrawing(d: DragDrawing, p: Point, pad: number): boolean {
  const [a, b] = d.points;
  const r = rectBetween(a, b);
  if (d.type === 'censor') return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
  const half = d.size / 2 + pad;
  if (isLine(d)) return distToSegment(p, a, b) <= half;
  if (d.shape === 'rect' || d.shape === 'highlight') {
    const inside = p.x >= r.x - half && p.x <= r.x + r.w + half && p.y >= r.y - half && p.y <= r.y + r.h + half;
    if (!inside || d.fill || d.shape === 'highlight') return inside;
    return p.x <= r.x + half || p.x >= r.x + r.w - half || p.y <= r.y + half || p.y >= r.y + r.h - half;
  }
  // Ellipse (or sketched ring): how far out p is, 1 being on the line.
  const rx = Math.max(1, r.w / 2);
  const ry = Math.max(1, r.h / 2);
  const k = Math.hypot((p.x - (r.x + rx)) / rx, (p.y - (r.y + ry)) / ry);
  const slack = half / Math.min(rx, ry);
  return d.fill ? k <= 1 + slack : Math.abs(k - 1) <= slack;
}

// The topmost (last drawn) shape or censor region under `p`, of `type` if given.
export function hitDrawingAt(drawings: unknown[] | undefined, p: Point, pad: number, type?: DragDrawing['type']): DragDrawing | null {
  const list = drawings || [];
  for (let i = list.length - 1; i >= 0; i--) {
    const d = list[i];
    if (isDragDrawing(d) && (!type || d.type === type) && isOnDrawing(d, p, pad)) return d;
  }
  return null;
}

export const moveDrawingPoints = (points: [Point, Point], dx: number, dy: number): [Point, Point] => [
  { x: points[0].x + dx, y: points[0].y + dy },
  { x: points[1].x + dx, y: points[1].y + dy },
];

export function dragDrawingHandle(points: [Point, Point], h: DrawingHandle, p: Point): [Point, Point] {
  const next: [Point, Point] = [{ ...points[0] }, { ...points[1] }];
  next[h.xi].x = p.x;
  next[h.yi].y = p.y;
  return next;
}

// The selected drawing's box for the UI floating over it ({ x, y } centre, w, h), with room for
// the line width.
export function drawingBox(d: DragDrawing): { x: number; y: number; w: number; h: number; rotation: number } {
  const r = rectBetween(d.points[0], d.points[1]);
  const pad = (d.type === 'shape' ? d.size / 2 : 0) + 6;
  return { x: r.x + r.w / 2, y: r.y + r.h / 2, w: r.w + pad * 2, h: r.h + pad * 2, rotation: 0 };
}

// A copy a little down and to the right of the original.
export const duplicateDrawing = (d: DragDrawing, id: string, offset = 24): DragDrawing => ({
  ...d,
  id,
  points: moveDrawingPoints(d.points, offset, offset),
});
