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

export function paintDrawings({
  drawings, targetCtx
}) {
  // --- RENDER FREEHAND DRAWINGS ---
  const drawBrushStroke = (stroke) => {
    if (!stroke || !stroke.points || stroke.points.length === 0) return;
    targetCtx.save();
    targetCtx.strokeStyle = stroke.color || '#a855f7';
    targetCtx.lineWidth = stroke.size || 8;
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    const strokeMode = stroke.mode || (stroke.type === 'highlighter' ? 'highlighter' : (stroke.type === 'glow' ? 'glow' : (stroke.type === 'eraser' ? 'eraser' : 'pen')));
    if (strokeMode === 'highlighter') {
      targetCtx.globalAlpha = 0.45;
    } else if (strokeMode === 'glow') {
      targetCtx.shadowColor = stroke.color || '#00f0ff';
      targetCtx.shadowBlur = Math.max(8, (stroke.size || 8) * 1.5);
    }

    targetCtx.beginPath();
    if (stroke.points.length === 1) {
      targetCtx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.size || 8) / 2, 0, Math.PI * 2);
      targetCtx.fillStyle = stroke.color || '#a855f7';
      targetCtx.fill();
    } else {
      targetCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        targetCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      targetCtx.stroke();
    }
    targetCtx.restore();
  };

  // In order, so a censor region also hides the drawings under it.
  (drawings || []).forEach((d) => {
    if (d?.type === 'shape' || d?.type === 'censor') paintDragDrawing(targetCtx, d);
    else drawBrushStroke(d);
  });
}
