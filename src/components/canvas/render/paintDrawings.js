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

  (drawings || []).forEach((d) => {
    drawBrushStroke(d);
  });
}
