import { THEME_BADGE_BG, THEME_CORAL, drawDeleteHandle, drawResizeHandle, drawRotateHandle, drawSelectionBox, drawSideHandle } from './handles';
import { getFilterCss, drawImageFiltered } from '../../../data/photoFilters';
import { applyShadow, compositeFor, cornerPx, isFramed, roundRectPath } from '../draw/layerLook';
import { applyPhotoEffects, hasPhotoEffects } from '../draw/photoEffects';
import { isVideoUrl } from '../../editor/memeEditorUtils';

export function paintImageLayer({
  activeLayerId, baseImgRef, canvas, getImageLayerCenterY, imageCacheRef, isDrawingMode,
  layer, loadingMediaRef, renderCanvas, reportActiveBox, reportBox, setActiveHandleDrawer, targetCtx
}) {
  const imgLayer = layer;
const cx = imgLayer.x * canvas.width;
const cy = getImageLayerCenterY(imgLayer);
const cached = imageCacheRef.current[imgLayer.url];

if (cached) {
  const baseW = cached.width || 200;
  const baseH = cached.height || 200;
  let drawSource = cached;

  if (imgLayer.filters || imgLayer.filter) {
    const filterObj = imgLayer.filters || imgLayer.filter;
    const filterCss = getFilterCss(filterObj);
    // Warmth, sharpen and vignette (canvas/draw/photoEffects) ride along in the filters object.
    const effects = typeof filterObj === 'object' ? filterObj : null;
    if (filterCss !== 'none' || hasPhotoEffects(effects)) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = baseW;
      tempCanvas.height = baseH;
      const tempCtx = tempCanvas.getContext('2d');
      // iOS-safe: uses pixel-level fallback on iOS Safari
      drawImageFiltered(tempCtx, cached, filterCss, 0, 0, baseW, baseH);
      if (hasPhotoEffects(effects)) applyPhotoEffects(tempCtx, 0, 0, baseW, baseH, effects);
      drawSource = tempCanvas;
    }
  }

  targetCtx.save();
  targetCtx.translate(cx, cy);
  if (imgLayer.rotation) {
    targetCtx.rotate((imgLayer.rotation * Math.PI) / 180);
  }
  if (imgLayer.flipX || imgLayer.flipY) {
    targetCtx.scale(imgLayer.flipX ? -1 : 1, imgLayer.flipY ? -1 : 1);
  }
  if (imgLayer.opacity !== undefined) {
    targetCtx.globalAlpha = imgLayer.opacity;
  }
  targetCtx.globalCompositeOperation = compositeFor(imgLayer);

  const scale = imgLayer.scale || 1.0;
  const maxDim = 320;
  const fitScale = Math.min(maxDim / baseW, maxDim / baseH);
  const crop = imgLayer.crop || { x: 0, y: 0, width: 1, height: 1 };
  const naturalFullW = baseW * fitScale * scale;
  const naturalFullH = baseH * fitScale * scale;
  const w = imgLayer.boxWidth || imgLayer.width || Math.round(naturalFullW * (crop.width || 1));
  const h = imgLayer.boxHeight || imgLayer.height || Math.round(naturalFullH * (crop.height || 1));

  const mode = imgLayer.fitMode || 'fit';

  // The picture itself, centred on ctx's origin.
  const paintBody = (ctx) => {
    if (mode === 'crop') {
      const sx = Math.max(0, Math.min(baseW - 1, (crop.x || 0) * baseW));
      const sy = Math.max(0, Math.min(baseH - 1, (crop.y || 0) * baseH));
      const sw = Math.max(1, Math.min(baseW - sx, (crop.width || 1) * baseW));
      const sh = Math.max(1, Math.min(baseH - sy, (crop.height || 1) * baseH));

      ctx.save();
      ctx.beginPath();
      if (imgLayer.isFaceMorph) {
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      } else {
        ctx.rect(-w / 2, -h / 2, w, h);
      }
      ctx.clip();
      ctx.drawImage(drawSource, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else if (mode === 'stretch') {
      const sx = Math.max(0, Math.min(baseW - 1, (crop.x || 0) * baseW));
      const sy = Math.max(0, Math.min(baseH - 1, (crop.y || 0) * baseH));
      const sw = Math.max(1, Math.min(baseW - sx, (crop.width || 1) * baseW));
      const sh = Math.max(1, Math.min(baseH - sy, (crop.height || 1) * baseH));
      ctx.drawImage(drawSource, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
    } else { // fit
      const hasCrop = (crop.width && crop.width < 1) || (crop.height && crop.height < 1) || (crop.x || 0) > 0 || (crop.y || 0) > 0;
      const sx = hasCrop ? Math.max(0, Math.min(baseW - 1, (crop.x || 0) * baseW)) : 0;
      const sy = hasCrop ? Math.max(0, Math.min(baseH - 1, (crop.y || 0) * baseH)) : 0;
      const sw = hasCrop ? Math.max(1, Math.min(baseW - sx, (crop.width || 1) * baseW)) : baseW;
      const sh = hasCrop ? Math.max(1, Math.min(baseH - sy, (crop.height || 1) * baseH)) : baseH;

      const imgAspect = sw / sh;
      const boxAspect = w / h;
      let drawW = w;
      let drawH = h;

      if (boxAspect > imgAspect) {
        drawH = h;
        drawW = h * imgAspect;
      } else {
        drawW = w;
        drawH = w / imgAspect;
      }

      ctx.save();
      ctx.beginPath();
      if (imgLayer.isFaceMorph) {
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      } else {
        ctx.rect(-w / 2, -h / 2, w, h);
      }
      ctx.clip();
      ctx.drawImage(drawSource, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }
  };

  // Rounded, bordered or shadowed photos are drawn on their own first: the shadow then follows the
  // picture (cut-outs included) and isn't clipped away with the corners.
  const bw = imgLayer.borderWidth || 0;
  const off = isFramed(imgLayer) && typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (off) {
    off.width = Math.max(1, Math.ceil(w + bw * 2));
    off.height = Math.max(1, Math.ceil(h + bw * 2));
  }
  const frameCtx = off?.getContext('2d');
  if (off && frameCtx) {
    const r = cornerPx(imgLayer, w, h);
    frameCtx.translate(off.width / 2, off.height / 2);
    frameCtx.save();
    roundRectPath(frameCtx, -w / 2, -h / 2, w, h, r);
    frameCtx.clip();
    paintBody(frameCtx);
    frameCtx.restore();
    if (bw > 0) {
      roundRectPath(frameCtx, -w / 2 - bw / 2, -h / 2 - bw / 2, w + bw, h + bw, r ? r + bw / 2 : 0);
      frameCtx.lineWidth = bw;
      frameCtx.strokeStyle = imgLayer.borderColor || '#ffffff';
      frameCtx.stroke();
    }
    applyShadow(targetCtx, imgLayer);
    targetCtx.drawImage(off, -off.width / 2, -off.height / 2);
  } else {
    paintBody(targetCtx);
  }

  reportBox?.(imgLayer.id, { x: cx, y: cy, w, h });
  if (imgLayer.id === activeLayerId && !isDrawingMode) {
    const hw = w / 2 + 6;
    const hh = h / 2 + 6;
    const rot = imgLayer.rotation || 0;
    reportActiveBox?.({ x: cx, y: cy, w: hw * 2, h: hh * 2, rotation: rot });

    setActiveHandleDrawer((uiCtx) => {
      uiCtx.save();
      uiCtx.translate(cx, cy);
      if (rot) {
        uiCtx.rotate((rot * Math.PI) / 180);
      }
      if (imgLayer.locked) {
        uiCtx.strokeStyle = '#f59e0b';
        uiCtx.lineWidth = 2.5;
        uiCtx.setLineDash([4, 4]);
        uiCtx.strokeRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
        uiCtx.setLineDash([]);
        uiCtx.fillStyle = '#f59e0b';
        uiCtx.font = 'bold 12px sans-serif';
        uiCtx.textAlign = 'center';
        uiCtx.fillText('🔒 LOCKED', 0, -hh - 14);
        uiCtx.restore();
        return;
      }

      if (imgLayer.isFaceMorph) {
        // Sleek, glowing face reticle (matching coral theme)
        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 2.4;
        uiCtx.setLineDash([5, 5]);
        uiCtx.beginPath();
        uiCtx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
        uiCtx.stroke();
        uiCtx.setLineDash([]);

        // Rotation handle stem & circle
        drawRotateHandle(uiCtx, 0, -hh, 0, -hh - 28);

        // Round size handles (Bottom Right corner)
        drawResizeHandle(uiCtx, hw * 0.72, hh * 0.72);

        // Delete handle (Top Left)
        drawDeleteHandle(uiCtx, -hw * 0.72, -hh * 0.72);

        // Floating badge
        uiCtx.save();
        uiCtx.fillStyle = THEME_BADGE_BG;
        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 1.5;
        const badgeText = `🎭 ${imgLayer.faceName || 'Face Morph'} (${Math.round((imgLayer.opacity !== undefined ? imgLayer.opacity : 1) * 100)}%)`;
        uiCtx.font = 'bold 12px sans-serif';
        const textW = uiCtx.measureText(badgeText).width;
        uiCtx.beginPath();
        uiCtx.roundRect(-textW / 2 - 8, hh + 12, textW + 16, 24, 12);
        uiCtx.fill();
        uiCtx.stroke();
        uiCtx.fillStyle = THEME_CORAL;
        uiCtx.textAlign = 'center';
        uiCtx.textBaseline = 'middle';
        uiCtx.fillText(badgeText, 0, hh + 24);
        uiCtx.restore();

        uiCtx.restore();
        return;
      }

      const isCropping = imgLayer.fitMode === 'crop';

      // Reference Image Style: Coral Glow Rounded Box with Side Handles
      drawSelectionBox(uiCtx, -hw, -hh, w + 12, h + 12, 10);

      if (isCropping) {
        // Subtle rule-of-thirds grid in crop mode
        uiCtx.save();
        uiCtx.strokeStyle = 'rgba(240, 104, 83, 0.35)';
        uiCtx.lineWidth = 1;
        uiCtx.setLineDash([3, 3]);
        uiCtx.beginPath();
        uiCtx.moveTo(-hw + (w + 12) / 3, -hh);
        uiCtx.lineTo(-hw + (w + 12) / 3, hh);
        uiCtx.moveTo(-hw + (w + 12) * 2 / 3, -hh);
        uiCtx.lineTo(-hw + (w + 12) * 2 / 3, hh);
        uiCtx.moveTo(-hw, -hh + (h + 12) / 3);
        uiCtx.lineTo(hw, -hh + (h + 12) / 3);
        uiCtx.moveTo(-hw, -hh + (h + 12) * 2 / 3);
        uiCtx.lineTo(hw, -hh + (h + 12) * 2 / 3);
        uiCtx.stroke();
        uiCtx.restore();
      } else {
        // Rotation handle
        drawRotateHandle(uiCtx, 0, -hh, 0, -hh - 28);

        // Corner handles:
        // Top-Left IS the Delete Handle!
        drawDeleteHandle(uiCtx, -hw, -hh);
        // Bottom-Right IS the Resize Handle!
        drawResizeHandle(uiCtx, hw, hh);
      }

      // 4 Middle-of-side handles (used for freeform cropping in crop mode, or stretching)
      drawSideHandle(uiCtx, 0, -hh, false);  // Top middle
      drawSideHandle(uiCtx, 0, hh, false);   // Bottom middle
      drawSideHandle(uiCtx, -hw, 0, true);   // Left middle
      drawSideHandle(uiCtx, hw, 0, true);    // Right middle
      uiCtx.restore();
    });
  }

  targetCtx.restore();
} else if (!isVideoUrl(imgLayer.url) && !loadingMediaRef?.current[imgLayer.url]) {
  // Requested once: later redraws while it loads don't start it again. Video photos are played
  // by canvas/media, which puts their frames in the cache.
  if (loadingMediaRef) loadingMediaRef.current[imgLayer.url] = true;
  const newImg = new Image();
  if (imgLayer.url && !imgLayer.url.startsWith('blob:') && !imgLayer.url.startsWith('data:')) newImg.crossOrigin = 'anonymous';
  newImg.onload = () => {
    imageCacheRef.current[imgLayer.url] = newImg;
    renderCanvas(baseImgRef.current);
  };
  newImg.src = imgLayer.url;
}
}
