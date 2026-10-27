// Freehand drawing: a stroke is started on pointer down and painted straight onto the canvas as
// the pointer moves (no React render per point); it is saved to the store on release.

// A new stroke at `point`. The eraser paints in the canvas background colour.
export function startStroke({ drawTool, canvasBgColor, brushColor, brushSize, point }) {
  const isEraser = drawTool === 'eraser';
  return {
    id: `brush-${Date.now()}`,
    type: isEraser ? 'eraser' : (drawTool || 'brush'),
    mode: drawTool === 'highlighter' ? 'highlighter' : drawTool === 'glow' ? 'glow' : isEraser ? 'eraser' : 'pen',
    color: isEraser ? (canvasBgColor || '#ffffff') : brushColor,
    size: brushSize,
    points: [{ x: point.x, y: point.y }]
  };
}

const applyStrokeStyle = (ctx, stroke) => {
  if (stroke.mode === 'highlighter') {
    ctx.globalAlpha = 0.45;
  } else if (stroke.mode === 'glow') {
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = Math.max(8, stroke.size * 1.5);
  }
};

// The dot shown as soon as the pointer goes down.
export function paintStrokeDot(ctx, stroke, point) {
  ctx.save();
  ctx.fillStyle = stroke.color;
  applyStrokeStyle(ctx, stroke);
  ctx.beginPath();
  ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function paintStrokeSegment(ctx, stroke, from, to) {
  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  applyStrokeStyle(ctx, stroke);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}
