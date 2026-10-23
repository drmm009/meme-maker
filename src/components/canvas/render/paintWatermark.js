export function paintWatermark({
  canvas, imageCacheRef, targetCtx, watermark
}) {
  // Render Watermark
  if (watermark?.enabled) {
    targetCtx.save();
    targetCtx.globalAlpha = watermark.opacity || 0.5;

    const pad = 20;
    let wx = 0;
    let wy = 0;

    const getPositions = (w, h) => {
      const pos = watermark.position || 'bottom-right';
      if (pos === 'bottom-right') return { x: canvas.width - pad - w, y: canvas.height - pad - h };
      if (pos === 'bottom-left') return { x: pad, y: canvas.height - pad - h };
      if (pos === 'top-right') return { x: canvas.width - pad - w, y: pad };
      if (pos === 'top-left') return { x: pad, y: pad };
      return { x: pad, y: pad };
    };

    if (watermark.imageUrl && imageCacheRef.current[watermark.imageUrl]) {
      const wmImg = imageCacheRef.current[watermark.imageUrl];
      const scale = (watermark.size || 24) * 3 / Math.max(wmImg.width, wmImg.height);
      const drawW = wmImg.width * scale;
      const drawH = wmImg.height * scale;
      const { x, y } = getPositions(drawW, drawH);
      targetCtx.drawImage(wmImg, x, y, drawW, drawH);
    } else if (watermark.text) {
      targetCtx.font = `bold ${watermark.size || 24}px Impact, sans-serif`;
      const fillColor = watermark.color || '#ffffff';
      targetCtx.fillStyle = fillColor;
      targetCtx.strokeStyle = fillColor === '#000000' ? '#ffffff' : '#000000';
      targetCtx.lineWidth = Math.max(2, (watermark.size || 24) / 10);
      targetCtx.textBaseline = 'top';
      targetCtx.textAlign = 'left';

      const textMetrics = targetCtx.measureText(watermark.text);
      const w = textMetrics.width;
      const h = watermark.size || 24;
      const { x, y } = getPositions(w, h);

      targetCtx.strokeText(watermark.text, x, y);
      targetCtx.fillText(watermark.text, x, y);
    }

    targetCtx.restore();
  }
}
