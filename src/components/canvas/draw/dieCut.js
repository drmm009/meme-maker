const dieCutSilhouetteCache = new Map();

export function getOrCreateDieCutSilhouette(imgSource, color, width, height) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const srcKey = imgSource.src || imgSource.currentSrc || (imgSource.toDataURL ? 'canvas' : 'img');
  const key = `${srcKey}_${color}_${w}_${h}`;
  if (dieCutSilhouetteCache.has(key)) {
    return dieCutSilhouetteCache.get(key);
  }
  const silCanvas = document.createElement('canvas');
  silCanvas.width = w;
  silCanvas.height = h;
  const sCtx = silCanvas.getContext('2d');
  sCtx.drawImage(imgSource, 0, 0, w, h);
  sCtx.globalCompositeOperation = 'source-in';
  sCtx.fillStyle = color;
  sCtx.fillRect(0, 0, w, h);

  if (dieCutSilhouetteCache.size > 80) {
    const firstKey = dieCutSilhouetteCache.keys().next().value;
    const oldCanvas = dieCutSilhouetteCache.get(firstKey);
    if (oldCanvas) {
      oldCanvas.width = 0;
      oldCanvas.height = 0;
    }
    dieCutSilhouetteCache.delete(firstKey);
  }
  dieCutSilhouetteCache.set(key, silCanvas);
  return silCanvas;
}

export function renderDieCutImage(ctx, img, drawW, drawH, borderColor = '#ffffff', borderWidth = 6) {
  const sil = getOrCreateDieCutSilhouette(img, borderColor, drawW, drawH);
  const R = Math.max(2, borderWidth);
  const steps = Math.min(24, Math.max(12, Math.round(R * 3)));

  // 1. Soft realistic vinyl sticker drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.drawImage(sil, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // 2. Multi-angle radial dilation stamp for solid, crisp, opaque vinyl border
  ctx.save();
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const ox = Math.cos(angle) * R;
    const oy = Math.sin(angle) * R;
    ctx.drawImage(sil, -drawW / 2 + ox, -drawH / 2 + oy, drawW, drawH);
  }
  if (R > 3) {
    const midR = R * 0.55;
    const midSteps = Math.min(16, Math.max(8, Math.round(steps * 0.6)));
    for (let i = 0; i < midSteps; i++) {
      const angle = (i * 2 * Math.PI) / midSteps;
      const ox = Math.cos(angle) * midR;
      const oy = Math.sin(angle) * midR;
      ctx.drawImage(sil, -drawW / 2 + ox, -drawH / 2 + oy, drawW, drawH);
    }
  }
  ctx.restore();

  // 3. Draw the original graphic on top
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
}

export function renderDieCutEmoji(ctx, emoji, fontSize, borderColor = '#ffffff', borderWidth = 6) {
  const pad = Math.ceil(fontSize * 0.4);
  const fullW = Math.ceil(fontSize * 1.5 + pad * 2);
  const fullH = Math.ceil(fontSize * 1.5 + pad * 2);

  const offCanvas = document.createElement('canvas');
  offCanvas.width = fullW;
  offCanvas.height = fullH;
  const oCtx = offCanvas.getContext('2d');
  oCtx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  oCtx.textAlign = 'center';
  oCtx.textBaseline = 'middle';
  oCtx.fillText(emoji, fullW / 2, fullH / 2);

  const sil = getOrCreateDieCutSilhouette(offCanvas, borderColor, fullW, fullH);
  const R = Math.max(2, borderWidth);
  const steps = Math.min(24, Math.max(12, Math.round(R * 3)));
  const cx = -fullW / 2;
  const cy = -fullH / 2;

  // 1. Soft shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.drawImage(sil, cx, cy);
  ctx.restore();

  // 2. Radial stamp
  ctx.save();
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const ox = Math.cos(angle) * R;
    const oy = Math.sin(angle) * R;
    ctx.drawImage(sil, cx + ox, cy + oy);
  }
  if (R > 3) {
    const midR = R * 0.55;
    for (let i = 0; i < 8; i++) {
      const angle = (i * 2 * Math.PI) / 8;
      const ox = Math.cos(angle) * midR;
      const oy = Math.sin(angle) * midR;
      ctx.drawImage(sil, cx + ox, cy + oy);
    }
  }
  ctx.restore();

  // 3. Draw emoji on top
  ctx.drawImage(offCanvas, cx, cy);
}
