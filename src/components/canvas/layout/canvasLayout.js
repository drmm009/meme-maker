import { wrapText } from '../draw/text';
import { getWhatsAppCardHeight } from '../draw/socialCards/whatsapp';

// The canvas's internal resolution is capped at this on its longer side. Font sizes stay
// consistent relative to the canvas across aspect ratios, and huge originals stay cheap.
export const CANVAS_MAX_DIM = 1080;

const ASPECT_SIZES = {
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
  '4:5': [1080, 1350],
};

// Image-area size in canvas pixels for an aspect ratio ('original' follows the template or loaded image).
export function getCanvasSize(aspectRatio, template, naturalSize) {
  let rawW = 1080;
  let rawH = 1080;
  if (ASPECT_SIZES[aspectRatio]) {
    [rawW, rawH] = ASPECT_SIZES[aspectRatio];
  } else if (aspectRatio === 'original') {
    rawW = template?.width || naturalSize.w || 1080;
    rawH = template?.height || naturalSize.h || 1080;
  }
  const maxDim = Math.max(rawW, rawH);
  if (maxDim <= 0) return { canvasW: 1080, canvasH: 1080 };
  return {
    canvasW: Math.round((rawW / maxDim) * CANVAS_MAX_DIM),
    canvasH: Math.round((rawH / maxDim) * CANVAS_MAX_DIM),
  };
}

let measureCtx = null;
const getMeasureCtx = () => {
  if (!measureCtx && typeof document !== 'undefined') {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  return measureCtx;
};

// Height of the header or footer band added above/below the image: tall enough for its
// caption's wrapped text, or the band's own height when it has no caption. 0 when disabled.
export function getBandHeight(band, cap, canvasW, ctx = getMeasureCtx()) {
  if (!band?.enabled) return 0;
  if (!cap) return band.height || 140;
  const fontSize = cap.fontSize || 50;
  const fontFamily = cap.fontFamily || 'Montserrat, sans-serif';
  let linesCount = 1;
  if (ctx) {
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    const wrapped = wrapText(ctx, cap.text || '', (cap.width || 0.92) * canvasW);
    linesCount = Math.max(1, wrapped.length);
  }
  const lineHeight = fontSize * 1.35;
  const padY = Math.max(22, Math.round(fontSize * 0.6));
  return Math.max(110, Math.round(linesCount * lineHeight + padY * 2));
}

// Layer centre Y in canvas pixels. Layer y is 0..1 of the image area, which sits below the header band.
export function makeLayerCenters({ canvasRef, canvasW, canvasH, headerExtH, footerExtH, totalCanvasH }) {
  const getCaptionCenterY = (cap, customCanvas = null) => {
    if (!cap) return 0;
    const activeCanvas = customCanvas || canvasRef.current;
    if (cap.isHeaderCaption) {
      if (cap.hasCustomPos) {
        return (cap.y ?? 0) * (activeCanvas?.height || totalCanvasH);
      }
      return headerExtH / 2;
    }
    if (cap.isFooterCaption) {
      if (cap.hasCustomPos) {
        return (cap.y ?? 0) * (activeCanvas?.height || totalCanvasH);
      }
      return headerExtH + canvasH + (footerExtH / 2);
    }
    const currentH = activeCanvas?.height || canvasH;
    const rawY = headerExtH + (cap.y ?? 0.5) * canvasH;
    if (cap.isWhatsAppCard && activeCanvas) {
      const cardW = Math.max(180, (cap.width || 0.82) * (activeCanvas.width || canvasW));
      const ctx = activeCanvas.getContext ? activeCanvas.getContext('2d') : null;
      const cardH = getWhatsAppCardHeight(ctx, cap, cardW);
      const minMargin = 16;
      if (cardH <= currentH - minMargin * 2) {
        const minY = cardH / 2 + minMargin;
        const maxY = currentH - cardH / 2 - minMargin;
        return Math.max(minY, Math.min(maxY, rawY));
      }
    }
    return rawY;
  };

  const getStickerCenterY = (stk) => headerExtH + ((stk?.y) || 0) * canvasH;

  const getImageLayerCenterY = (img) => headerExtH + ((img?.y) || 0) * canvasH;

  return { getCaptionCenterY, getStickerCenterY, getImageLayerCenterY };
}
