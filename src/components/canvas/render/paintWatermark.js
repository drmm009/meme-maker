export function paintWatermark({
  baseImgRef, canvas, imageCacheRef, renderCanvas, targetCtx, watermark
}) {
  // Render Watermark
  if (watermark?.enabled) {
    targetCtx.save();
    targetCtx.globalAlpha = watermark.opacity || 0.5;

    const pad = 20;

    const getPositions = (w, h) => {
      const pos = watermark.position || 'bottom-right';
      if (pos === 'bottom-right' || pos === 'br') return { x: canvas.width - pad - w, y: canvas.height - pad - h };
      if (pos === 'bottom-left' || pos === 'bl') return { x: pad, y: canvas.height - pad - h };
      if (pos === 'top-right' || pos === 'tr') return { x: canvas.width - pad - w, y: pad };
      if (pos === 'top-left' || pos === 'tl') return { x: pad, y: pad };
      return { x: pad, y: pad };
    };

    const hasImage = Boolean(watermark.imageUrl);
    const hasText = Boolean(watermark.text);

    // A logo not loaded yet (a new one, or a built-in one recoloured) loads once, then the
    // canvas paints again so it shows without waiting for the next edit.
    let wmImg = hasImage ? imageCacheRef?.current?.[watermark.imageUrl] : null;
    const loadingKey = `${watermark.imageUrl}#loading`;
    if (hasImage && !wmImg && imageCacheRef?.current && !imageCacheRef.current[loadingKey] && typeof Image !== 'undefined') {
      imageCacheRef.current[loadingKey] = true;
      const img = new Image();
      img.onload = () => {
        imageCacheRef.current[watermark.imageUrl] = img;
        delete imageCacheRef.current[loadingKey];
        renderCanvas?.(baseImgRef?.current);
      };
      img.onerror = () => { delete imageCacheRef.current[loadingKey]; };
      img.src = watermark.imageUrl;
    }

    if (hasImage && wmImg && hasText) {
      // Both Logo + Text side-by-side
      targetCtx.font = `bold ${watermark.size || 24}px Impact, sans-serif`;
      const fillColor = watermark.color || '#ffffff';
      targetCtx.fillStyle = fillColor;
      targetCtx.strokeStyle = fillColor === '#000000' ? '#ffffff' : '#000000';
      targetCtx.lineWidth = Math.max(2, (watermark.size || 24) / 10);
      targetCtx.textBaseline = 'middle';
      targetCtx.textAlign = 'left';

      const textMetrics = targetCtx.measureText(watermark.text);
      const textW = textMetrics.width;
      const h = watermark.size || 24;
      const iconH = h * 1.05;
      const iconW = (wmImg.width / (wmImg.height || 1)) * iconH;
      const gap = Math.max(6, (watermark.size || 24) * 0.28);
      const totalW = iconW + gap + textW;

      const { x, y } = getPositions(totalW, h);
      const midY = y + h / 2;

      targetCtx.drawImage(wmImg, x, midY - iconH / 2, iconW, iconH);
      targetCtx.strokeText(watermark.text, x + iconW + gap, midY);
      targetCtx.fillText(watermark.text, x + iconW + gap, midY);
    } else if (hasImage && wmImg) {
      const scale = (watermark.size || 24) * 3 / Math.max(wmImg.width, wmImg.height);
      const drawW = wmImg.width * scale;
      const drawH = wmImg.height * scale;
      const { x, y } = getPositions(drawW, drawH);
      targetCtx.drawImage(wmImg, x, y, drawW, drawH);
    } else if (hasText) {
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
