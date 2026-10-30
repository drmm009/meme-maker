import { drawDeleteHandle, drawResizeHandle, drawRotateHandle, drawSelectionBox, drawSideHandle } from './handles';
import { renderDieCutEmoji, renderDieCutImage } from '../draw/dieCut';
import { applyShadow, compositeFor } from '../draw/layerLook';

export function paintSticker({
  activeLayerId, baseImgRef, canvas, getStickerCenterY, imageCacheRef, isDrawingMode, layer,
  loadingMediaRef, renderCanvas, reportActiveBox, setActiveHandleDrawer, targetCtx
}) {
  const stk = layer;

const sx = stk.x * canvas.width;
const sy = getStickerCenterY(stk);
targetCtx.save();
targetCtx.translate(sx, sy);
if (stk.rotation) targetCtx.rotate(stk.rotation * Math.PI / 180);
if (stk.flipX || stk.flipY) targetCtx.scale(stk.flipX ? -1 : 1, stk.flipY ? -1 : 1);

const stkSize = (stk.scale || 1.0) * 52;
targetCtx.font = `${stkSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
targetCtx.textAlign = 'center';
targetCtx.textBaseline = 'middle';

if (stk.id === activeLayerId && !isDrawingMode) {
  const rot = stk.rotation || 0;
  reportActiveBox?.({ x: sx, y: sy, w: stkSize + 12, h: stkSize + 12, rotation: rot });
  setActiveHandleDrawer((uiCtx) => {
    uiCtx.save();
    uiCtx.translate(sx, sy);
    if (rot) uiCtx.rotate(rot * Math.PI / 180);
    if (stk.locked) {
      uiCtx.strokeStyle = '#f59e0b';
      uiCtx.lineWidth = 2.5;
      uiCtx.setLineDash([4, 4]);
      uiCtx.strokeRect(-stkSize / 2 - 6, -stkSize / 2 - 6, stkSize + 12, stkSize + 12);
      uiCtx.setLineDash([]);
      uiCtx.fillStyle = '#f59e0b';
      uiCtx.font = 'bold 12px sans-serif';
      uiCtx.textAlign = 'center';
      uiCtx.fillText('🔒 LOCKED', 0, -stkSize / 2 - 14);
      uiCtx.restore();
      return;
    }
    const hs = stkSize / 2 + 6;

    // Reference Image Style: Coral Glow Rounded Box with Top-Left Delete, Bottom-Right Resize & Side Handles
    drawSelectionBox(uiCtx, -hs, -hs, stkSize + 12, stkSize + 12, 10);

    // Side Handles: Left & Right Capsules
    drawSideHandle(uiCtx, -hs, 0, true);
    drawSideHandle(uiCtx, hs, 0, true);

    // Top Rotation Stem & Handle
    drawRotateHandle(uiCtx, 0, -hs, 0, -hs - 28);

    // Corner Handles:
    // Top-Left IS the Delete Handle!
    drawDeleteHandle(uiCtx, -hs, -hs);
    // Bottom-Right IS the Resize Handle!
    drawResizeHandle(uiCtx, hs, hs);

    uiCtx.restore();
  });
}

// Opacity, blend mode and shadow apply to the sticker (not its selection UI, drawn on its own).
if (stk.opacity !== undefined) targetCtx.globalAlpha = stk.opacity;
targetCtx.globalCompositeOperation = compositeFor(stk);
applyShadow(targetCtx, stk);

if (stk.url || stk.imageUrl) {
  const imgUrl = stk.url || stk.imageUrl;
  const cached = imageCacheRef.current[imgUrl];
  if (cached && (cached.complete && (cached.naturalWidth || cached.width))) {
    const aspect = (cached.naturalWidth || cached.width) / ((cached.naturalHeight || cached.height) || 1);
    const drawW = aspect >= 1 ? stkSize : stkSize * aspect;
    const drawH = aspect >= 1 ? stkSize / aspect : stkSize;
    if (stk.dieCut) {
      renderDieCutImage(targetCtx, cached, drawW, drawH, stk.dieCutColor || '#ffffff', stk.dieCutWidth || 6);
    } else {
      targetCtx.drawImage(cached, -drawW / 2, -drawH / 2, drawW, drawH);
    }
  } else {
    if (!loadingMediaRef.current[imgUrl]) {
      loadingMediaRef.current[imgUrl] = true;
      const newImg = new Image();
      if (imgUrl && !imgUrl.startsWith('blob:') && !imgUrl.startsWith('data:')) newImg.crossOrigin = 'anonymous';
      newImg.onload = () => {
        imageCacheRef.current[imgUrl] = newImg;
        renderCanvas(baseImgRef.current);
      };
      newImg.src = imgUrl;
    }
  }
} else if (stk.emoji) {
  if (stk.dieCut) {
    renderDieCutEmoji(targetCtx, stk.emoji, stkSize, stk.dieCutColor || '#ffffff', stk.dieCutWidth || 6);
  } else {
    targetCtx.fillText(stk.emoji, 0, 0);
  }
}
targetCtx.restore();
}
