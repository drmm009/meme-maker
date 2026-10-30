// Shapes (arrow, circle, box, line) and censor regions (blur, pixelate, black bar), drawn on the
// meme with the Draw tab. Each is a drawing made by one drag: `points` are where it started and
// ended, in canvas pixels. They are painted with the freehand strokes (render/paintDrawings), after
// the layers, so a censor region hides everything under it.
import type { Point } from '../interaction/geometry';

export type ShapeKind = 'arrow' | 'ellipse' | 'rect' | 'line';
export type CensorMode = 'blur' | 'pixelate' | 'bar';

export interface ShapeDrawing {
  id: string;
  type: 'shape';
  shape: ShapeKind;
  color: string;
  // Line width in canvas pixels.
  size: number;
  // Circle and box only: filled instead of outlined.
  fill?: boolean;
  points: [Point, Point];
}

export interface CensorDrawing {
  id: string;
  type: 'censor';
  censor: CensorMode;
  // Blur radius / pixel block size, in canvas pixels.
  strength: number;
  points: [Point, Point];
}

export type DragDrawing = ShapeDrawing | CensorDrawing;

export interface Rect { x: number; y: number; w: number; h: number }

// The box between two corners, whichever way it was dragged.
export const rectBetween = (a: Point, b: Point): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  w: Math.abs(b.x - a.x),
  h: Math.abs(b.y - a.y),
});

// A new shape or censor region starting (and, until dragged, ending) at `point`.
export function startDragDrawing(tool: 'shape' | 'censor', point: Point, o: {
  shape: ShapeKind; color: string; size: number; fill: boolean; censor: CensorMode; strength: number;
}): DragDrawing {
  const points: [Point, Point] = [{ ...point }, { ...point }];
  return tool === 'shape'
    ? { id: `shape-${Date.now()}`, type: 'shape', shape: o.shape, color: o.color, size: o.size, fill: o.fill, points }
    : { id: `censor-${Date.now()}`, type: 'censor', censor: o.censor, strength: o.strength, points };
}

// Drags shorter than this are taps, not shapes.
export const MIN_DRAG_PX = 6;
export const isTooSmall = (d: DragDrawing) => Math.hypot(d.points[1].x - d.points[0].x, d.points[1].y - d.points[0].y) < MIN_DRAG_PX;

// The two barbs of an arrow pointing from `from` to `to`, sized to the line width.
export function arrowHead(from: Point, to: Point, size: number): [Point, Point] {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const length = Math.max(14, size * 3.2);
  const spread = Math.PI / 7;
  return [
    { x: to.x - length * Math.cos(angle - spread), y: to.y - length * Math.sin(angle - spread) },
    { x: to.x - length * Math.cos(angle + spread), y: to.y - length * Math.sin(angle + spread) },
  ];
}

export function paintShape(ctx: CanvasRenderingContext2D, d: ShapeDrawing): void {
  const [a, b] = d.points;
  ctx.save();
  ctx.strokeStyle = d.color;
  ctx.fillStyle = d.color;
  ctx.lineWidth = d.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (d.shape === 'rect') {
    const r = rectBetween(a, b);
    ctx.rect(r.x, r.y, r.w, r.h);
  } else if (d.shape === 'ellipse') {
    const r = rectBetween(a, b);
    ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, Math.max(1, r.w / 2), Math.max(1, r.h / 2), 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    if (d.shape === 'arrow') {
      const [l, r] = arrowHead(a, b, d.size);
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(r.x, r.y);
    }
  }
  if (d.fill && (d.shape === 'rect' || d.shape === 'ellipse')) ctx.fill();
  else ctx.stroke();
  ctx.restore();
}

const makeCanvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

// Hides what is under the region. Blur and pixelate work by shrinking the region and scaling it
// back up (smoothly for blur, in blocks for pixelate), which needs no ctx.filter, so they look the
// same on iOS Safari, which ignores canvas filters.
export function paintCensor(ctx: CanvasRenderingContext2D, d: CensorDrawing): void {
  const canvas = ctx.canvas;
  const raw = rectBetween(d.points[0], d.points[1]);
  const x = Math.max(0, Math.floor(raw.x));
  const y = Math.max(0, Math.floor(raw.y));
  const w = Math.min(canvas.width - x, Math.ceil(raw.w));
  const h = Math.min(canvas.height - y, Math.ceil(raw.h));
  if (w < 1 || h < 1) return;
  ctx.save();
  if (d.censor === 'bar') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, w, h);
  } else {
    const block = Math.max(2, d.strength);
    const small = makeCanvas(w / block, h / block);
    const sctx = small.getContext('2d');
    if (sctx) {
      sctx.imageSmoothingEnabled = d.censor === 'blur';
      sctx.drawImage(canvas, x, y, w, h, 0, 0, small.width, small.height);
      ctx.imageSmoothingEnabled = d.censor === 'blur';
      if (d.censor === 'blur') ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(small, 0, 0, small.width, small.height, x, y, w, h);
    }
  }
  ctx.restore();
}

export function paintDragDrawing(ctx: CanvasRenderingContext2D, d: DragDrawing): void {
  if (d.type === 'shape') paintShape(ctx, d);
  else paintCensor(ctx, d);
}

// The outline shown around a censor region while it is being dragged.
export function paintDragGuide(ctx: CanvasRenderingContext2D, d: DragDrawing): void {
  if (d.type !== 'censor') return;
  const r = rectBetween(d.points[0], d.points[1]);
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}
