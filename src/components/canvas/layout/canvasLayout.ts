import type { MemeCaption } from '../../../model/memeDocument';
import { wrapText } from '../draw/text';
import { applyCaptionFont, fittedFontSize, spacedText } from '../draw/captionFont';
import { getWhatsAppCardHeight } from '../draw/socialCards/whatsapp';

// The canvas's internal resolution is capped at this on its longer side. Font sizes stay
// consistent relative to the canvas across aspect ratios, and huge originals stay cheap.
export const CANVAS_MAX_DIM = 1080;

const ASPECT_SIZES: Record<string, [number, number]> = {
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
  '4:5': [1080, 1350],
};

// Image-area size in canvas pixels for an aspect ratio ('original' follows the template or loaded image).
export function getCanvasSize(
  aspectRatio: string,
  template: { width?: number; height?: number } | null | undefined,
  naturalSize: { w: number; h: number }
): { canvasW: number; canvasH: number } {
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

// The image area never gets less of a framed canvas than this, the bands shrinking together instead.
const MIN_IMAGE_SHARE = 0.4;

// The header and footer bands and the image area in the canvas. With a set aspect ratio the whole
// canvas, bands included, keeps that shape (`frameH` is its height) and the image area gives the bands
// their room; with 'original' the bands are added above and below the image.
export function fitBandsToFrame(
  aspectRatio: string, frameH: number, headerH: number, footerH: number
): { imageH: number; headerH: number; footerH: number; totalH: number } {
  if (aspectRatio === 'original') return { imageH: frameH, headerH, footerH, totalH: frameH + headerH + footerH };
  const room = Math.round(frameH * (1 - MIN_IMAGE_SHARE));
  const bands = headerH + footerH;
  const scale = bands > room ? room / bands : 1;
  const h = Math.floor(headerH * scale);
  const f = Math.floor(footerH * scale);
  return { imageH: frameH - h - f, headerH: h, footerH: f, totalH: frameH };
}

let measureCtx: CanvasRenderingContext2D | null = null;
const getMeasureCtx = () => {
  if (!measureCtx && typeof document !== 'undefined') {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  return measureCtx;
};

// A header or footer band: on or off, and its height when it has no caption.
export interface Band {
  enabled?: boolean;
  height?: number;
  bgColor?: string;
  // bgColor was picked in the Header/Footer sheet; otherwise the band follows the canvas colour.
  ownColor?: boolean;
}

// A band keeps the height it was given, so its caption (while it sits in the band) shrinks to fit:
// as many lines as fit the band at the caption's own size, then smaller type if the text needs more.
export function fitCaptionsToBands<T extends Pick<MemeCaption, 'isHeaderCaption' | 'isFooterCaption' | 'hasCustomPos' | 'fontSize' | 'lineHeight' | 'autoFit' | 'maxLines'>>(
  captions: T[], headerH: number, footerH: number
): T[] {
  return captions.map((cap) => {
    const bandH = cap.hasCustomPos ? 0 : cap.isHeaderCaption ? headerH : cap.isFooterCaption ? footerH : 0;
    if (!bandH) return cap;
    const lineH = (cap.fontSize || 50) * (cap.lineHeight || 1.2);
    const fits = Math.max(1, Math.floor((bandH * 0.9) / lineH));
    return { ...cap, autoFit: true, maxLines: cap.autoFit && cap.maxLines ? Math.min(cap.maxLines, fits) : fits };
  });
}

// The colour a band is filled with.
export function bandColor(band: Band | null | undefined, canvasColor: string | null | undefined): string {
  if (band?.ownColor && band.bgColor) return band.bgColor;
  return canvasColor || band?.bgColor || '#ffffff';
}

// Height of the header or footer band added above/below the image: tall enough for its
// caption's wrapped text, or the band's own height when it has no caption. 0 when disabled.
export function getBandHeight(
  band: Band | null | undefined,
  cap: Pick<MemeCaption, 'fontSize' | 'fontFamily' | 'text' | 'width' | 'bold' | 'italic' | 'letterSpacing' | 'autoFit' | 'maxLines'> | null | undefined,
  canvasW: number,
  ctx: CanvasRenderingContext2D | null = getMeasureCtx()
): number {
  if (!band?.enabled) return 0;
  if (!cap) return band.height || 140;
  const fontSize = fittedFontSize(ctx, cap, (cap.width || 0.92) * canvasW, 'Montserrat, sans-serif');
  let linesCount = 1;
  if (ctx) {
    applyCaptionFont(ctx, cap, fontSize, 'Montserrat, sans-serif');
    const wrapped = wrapText(ctx, spacedText(ctx, cap.text || '', cap, fontSize), (cap.width || 0.92) * canvasW);
    linesCount = Math.max(1, wrapped.length);
  }
  const lineHeight = fontSize * 1.35;
  const padY = Math.max(22, Math.round(fontSize * 0.6));
  return Math.max(110, Math.round(linesCount * lineHeight + padY * 2));
}

// What placing a caption vertically needs (a caption, or a hit on one).
export type CaptionPlacement = Partial<Pick<MemeCaption, 'width' | 'isHeaderCaption' | 'isFooterCaption' | 'hasCustomPos' | 'isWhatsAppCard'>> & { y?: number };

// A canvas as the centre helpers read it (a real <canvas>, or a stand-in in tests).
type MeasuredCanvas = { width: number; height: number; getContext?: (kind: '2d') => CanvasRenderingContext2D | null };

// Layer centre Y in canvas pixels. Layer y is 0..1 of the image area, which sits below the header band.
export function makeLayerCenters({ canvasRef, canvasW, canvasH, headerExtH, footerExtH, totalCanvasH }: {
  canvasRef: { current: MeasuredCanvas | null };
  canvasW: number;
  canvasH: number;
  headerExtH: number;
  footerExtH: number;
  totalCanvasH: number;
}) {
  const getCaptionCenterY = (cap: CaptionPlacement | null | undefined, customCanvas: MeasuredCanvas | null = null): number => {
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

  const getStickerCenterY = (stk: { y?: number } | null | undefined): number => headerExtH + ((stk?.y) || 0) * canvasH;

  const getImageLayerCenterY = (img: { y?: number } | null | undefined): number => headerExtH + ((img?.y) || 0) * canvasH;

  return { getCaptionCenterY, getStickerCenterY, getImageLayerCenterY };
}
