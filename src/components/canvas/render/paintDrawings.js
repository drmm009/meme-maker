import { paintDragDrawing } from '../draw/shapes';
import { drawingBox, drawingHandles } from '../interaction/drawingHits';
import { drawPointHandle, drawSelectionBox } from './handles';

// Screen pixels across a shape's grab points.
const POINT_HANDLE_PX = 7;

// The selected shape or censor region's selection UI: a box around it (not for lines and arrows)
// and a grab point on each end or corner. `scale` is canvas pixels per screen pixel.
export function drawingHandleDrawer(d, scale = 1) {
  return (uiCtx) => {
    const handles = drawingHandles(d);
    if (handles.length === 4) {
      const b = drawingBox(d);
      drawSelectionBox(uiCtx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 6 * scale);
    }
    handles.forEach(({ at }) => drawPointHandle(uiCtx, at.x, at.y, POINT_HANDLE_PX * scale));
  };
}

const isEraser = (d) => d?.mode === 'eraser' || d?.type === 'eraser';

// A freehand stroke on ctx. An eraser stroke rubs out what is already on ctx (the ink layer).
function drawBrushStroke(ctx, stroke) {
  if (!stroke || !stroke.points || stroke.points.length === 0) return;
  ctx.save();
  ctx.strokeStyle = stroke.color || '#a855f7';
  ctx.lineWidth = stroke.size || 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const strokeMode = stroke.mode || (stroke.type === 'highlighter' ? 'highlighter' : (stroke.type === 'glow' ? 'glow' : (stroke.type === 'eraser' ? 'eraser' : 'pen')));
  if (strokeMode === 'highlighter') {
    ctx.globalAlpha = 0.45;
  } else if (strokeMode === 'glow') {
    ctx.shadowColor = stroke.color || '#00f0ff';
    ctx.shadowBlur = Math.max(8, (stroke.size || 8) * 1.5);
  } else if (strokeMode === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000000';
  }

  ctx.beginPath();
  if (stroke.points.length === 1) {
    ctx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.size || 8) / 2, 0, Math.PI * 2);
    ctx.fillStyle = strokeMode === 'eraser' ? '#000000' : (stroke.color || '#a855f7');
    ctx.fill();
  } else {
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Freehand strokes, shapes and censor regions, in order. With an eraser stroke among them the ink
// goes on a layer of its own first, so erasing rubs out drawings, never the picture under them; a
// censor region (which blurs what is under it) puts the ink so far down before it hides it.
export function paintDrawings({
  drawings, targetCtx
}) {
  const list = drawings || [];
  let layer = null;
  let ink = null;
  if (list.some(isEraser) && typeof document !== 'undefined' && targetCtx.canvas) {
    layer = document.createElement('canvas');
    layer.width = targetCtx.canvas.width;
    layer.height = targetCtx.canvas.height;
    ink = layer.getContext('2d');
  }
  const flush = () => {
    if (!ink) return;
    targetCtx.drawImage(layer, 0, 0);
    ink.clearRect(0, 0, layer.width, layer.height);
  };
  const ctx = ink || targetCtx;

  list.forEach((d) => {
    if (d?.hidden) return;
    if (d?.type === 'censor') {
      flush();
      paintDragDrawing(targetCtx, d);
    } else if (d?.type === 'shape') {
      paintDragDrawing(ctx, d);
    } else if (isEraser(d)) {
      // Without an ink layer (no canvas to make one) an eraser can't tell ink from picture.
      if (ink) drawBrushStroke(ink, d);
    } else {
      drawBrushStroke(ctx, d);
    }
  });
  flush();
}
