// Where each layer's box and handles sit, in canvas pixels. Shared by hit testing, the hover
// cursor and dragging, so a click always lands where the cursor said it would.
import type { LoadedImage, MemeCaption, MemeImageLayer, MemeSticker } from '../../../model/memeDocument';
import { getCurveSagitta, wrapText } from '../draw/text';
import { getWhatsAppCardHeight } from '../draw/socialCards/whatsapp';
import { getBreakingNewsHeight } from '../draw/chyron';
import { getTweetCardHeight } from '../draw/socialCards/tweet';
import { getInstagramCardHeight } from '../draw/socialCards/instagram';
import { getStickerBoxSize } from './geometry';
import { captionFont } from '../draw/captionFont';
import type { Point } from './geometry';

// Image layers fit inside a square this many pixels wide at scale 1.
export const IMAGE_LAYER_FIT = 320;

export type HandleType =
  | 'delete_layer'
  | 'rotate_sticker' | 'resize_sticker_br'
  | 'rotate_caption' | 'resize_caption_l' | 'resize_caption_r' | 'resize_caption_br'
  | 'rotate_imageLayer' | 'resize_imageLayer_br'
  | 'resize_imageLayer_t' | 'resize_imageLayer_b' | 'resize_imageLayer_l' | 'resize_imageLayer_r';

// A handle's centre and how close a pointer must be to grab it.
export interface Handle {
  type: HandleType;
  x: number;
  y: number;
  r: number;
}

export interface CaptionBox {
  boxWidth: number;
  boxHeight: number;
  lines: string[];
  lineHeight: number;
  padY: number;
  hasBg: boolean;
}

// A caption's centre x. WhatsApp cards are kept inside the canvas, as the painter draws them.
export const getCaptionCenterX = (cap: Pick<MemeCaption, 'x' | 'isWhatsAppCard' | 'width'>, canvasWidth: number): number => {
  let cx = (cap.x ?? 0.5) * canvasWidth;
  if (cap.isWhatsAppCard) {
    const cardW = Math.max(180, (cap.width || 0.82) * canvasWidth);
    const halfW = cardW / 2;
    const minPadX = 14;
    if (cardW <= canvasWidth - minPadX * 2) {
      cx = Math.max(halfW + minPadX, Math.min(canvasWidth - halfW - minPadX, cx));
    }
  }
  return cx;
};

// A caption's box. `handles` gives plain text the roomier box its selection handles sit on;
// otherwise it's the snug box a tap must land in. Without a 2D context (tests), plain text
// measures as zero width.
export const getCaptionBox = (
  ctx: CanvasRenderingContext2D | null,
  cap: MemeCaption,
  canvasWidth: number,
  { handles = false }: { handles?: boolean } = {}
): CaptionBox => {
  const fontSize = cap.fontSize || 50;
  let lines: string[] = [cap.text || ''];
  let maxLineWidth = 0;
  if (ctx) {
    ctx.font = captionFont(cap, fontSize);
    lines = wrapText(ctx, cap.text || '', (cap.width || 0.9) * canvasWidth);
    for (const line of lines) maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
  }
  const isBubble = !!cap.bubbleStyle;
  const hasBg = Boolean(cap.bgColor && cap.bgColor !== 'transparent' && cap.bgColor !== 'none') || isBubble;
  const boxedBg = hasBg && cap.bgStyle !== 'banner';
  const padX = isBubble ? Math.max(24, fontSize * 0.5)
    : boxedBg ? Math.max(16, fontSize * 0.35)
    : handles ? Math.max(16, fontSize * 0.25) : Math.max(8, fontSize * 0.15);
  const padY = isBubble ? Math.max(18, fontSize * 0.4)
    : boxedBg ? Math.max(10, fontSize * 0.2)
    : handles ? Math.max(10, fontSize * 0.16) : Math.max(4, fontSize * 0.1);
  let boxWidth = (cap.hasCustomWidth && cap.width)
    ? Math.max(maxLineWidth + padX * 2, cap.width * canvasWidth)
    : (maxLineWidth + padX * 2);
  boxWidth = Math.min(canvasWidth - 16, boxWidth);
  const lineHeight = fontSize * 1.2;
  let boxHeight = lines.length * lineHeight + padY * 2;
  if (cap.curve && Math.abs(cap.curve) > 0) {
    boxHeight += Math.round(getCurveSagitta(maxLineWidth, cap.curve));
  }

  if (cap.isBreakingNews) {
    boxWidth = Math.max(300, (cap.width || 0.94) * canvasWidth);
    boxHeight = getBreakingNewsHeight(cap);
  } else if (cap.isTweetCard) {
    boxWidth = Math.max(180, (cap.width || 0.88) * canvasWidth);
    boxHeight = getTweetCardHeight(ctx, cap, boxWidth);
  } else if (cap.isInstagramCard) {
    boxWidth = Math.max(180, (cap.width || 0.88) * canvasWidth);
    boxHeight = getInstagramCardHeight(ctx, cap, boxWidth);
  } else if (cap.isWhatsAppCard) {
    boxWidth = Math.max(180, (cap.width || 0.84) * canvasWidth);
    boxHeight = getWhatsAppCardHeight(ctx, cap, boxWidth);
  }
  return { boxWidth, boxHeight, lines, lineHeight, padY, hasBg };
};

// An image layer's drawn size. `cached` is its loaded image.
export const getImageLayerBox = (layer: MemeImageLayer, cached: LoadedImage): { baseW: number; baseH: number; fitScale: number; scale: number; w: number; h: number } => {
  const baseW = cached.width || 200;
  const baseH = cached.height || 200;
  const scale = layer.scale || 1.0;
  const fitScale = Math.min(IMAGE_LAYER_FIT / baseW, IMAGE_LAYER_FIT / baseH);
  const w = layer.boxWidth || layer.width || (baseW * fitScale * scale);
  const h = layer.boxHeight || layer.height || (baseH * fitScale * scale);
  return { baseW, baseH, fitScale, scale, w, h };
};

export const getStickerHandles = (stk: MemeSticker, cx: number, cy: number): Handle[] => {
  const size = getStickerBoxSize(stk);
  const hs = size / 2 + 6;
  return [
    { type: 'delete_layer', x: cx - hs, y: cy - hs, r: 26 },
    { type: 'rotate_sticker', x: cx, y: cy - size / 2 - 28, r: 24 },
    { type: 'resize_sticker_br', x: cx + hs, y: cy + hs, r: 24 },
  ];
};

export const getCaptionHandles = (cx: number, cy: number, boxWidth: number, boxHeight: number, hitRadius: number, deleteRadius: number): Handle[] => {
  const topY = cy - boxHeight / 2;
  const bottomY = cy + boxHeight / 2;
  const leftX = cx - boxWidth / 2;
  const rightX = cx + boxWidth / 2;
  return [
    { type: 'delete_layer', x: leftX, y: topY, r: deleteRadius },
    { type: 'rotate_caption', x: cx, y: topY - 28, r: hitRadius },
    { type: 'resize_caption_l', x: leftX, y: cy, r: hitRadius },
    { type: 'resize_caption_r', x: rightX, y: cy, r: hitRadius },
    { type: 'resize_caption_br', x: rightX, y: bottomY, r: hitRadius },
  ];
};

// Face-swap layers keep their corner handles inside the oval; crop mode only has edge handles.
export const getImageLayerHandles = (layer: MemeImageLayer, cx: number, cy: number, w: number, h: number): Handle[] => {
  const hw = w / 2 + 6;
  const hh = h / 2 + 6;
  if (layer.isFaceMorph) {
    return [
      { type: 'delete_layer', x: cx - hw * 0.72, y: cy - hh * 0.72, r: 26 },
      { type: 'rotate_imageLayer', x: cx, y: cy - hh - 28, r: 24 },
      { type: 'resize_imageLayer_br', x: cx + hw * 0.72, y: cy + hh * 0.72, r: 24 },
    ];
  }
  if (layer.fitMode === 'crop') {
    return [
      { type: 'resize_imageLayer_t', x: cx, y: cy - hh, r: 24 },
      { type: 'resize_imageLayer_b', x: cx, y: cy + hh, r: 24 },
      { type: 'resize_imageLayer_l', x: cx - hw, y: cy, r: 24 },
      { type: 'resize_imageLayer_r', x: cx + hw, y: cy, r: 24 },
    ];
  }
  return [
    { type: 'delete_layer', x: cx - hw, y: cy - hh, r: 26 },
    { type: 'rotate_imageLayer', x: cx, y: cy - hh - 28, r: 22 },
    { type: 'resize_imageLayer_br', x: cx + hw, y: cy + hh, r: 22 },
    { type: 'resize_imageLayer_t', x: cx, y: cy - hh, r: 22 },
    { type: 'resize_imageLayer_b', x: cx, y: cy + hh, r: 22 },
    { type: 'resize_imageLayer_l', x: cx - hw, y: cy, r: 22 },
    { type: 'resize_imageLayer_r', x: cx + hw, y: cy, r: 22 },
  ];
};

// The first handle in reach of `p`, or (closest) the nearest one in reach.
export const findHandle = (p: Point, handles: Handle[], { closest = false }: { closest?: boolean } = {}): Handle | null => {
  let best: Handle | null = null;
  let bestDist = Infinity;
  for (const h of handles) {
    const dist = Math.hypot(p.x - h.x, p.y - h.y);
    if (dist > h.r) continue;
    if (!closest) return h;
    if (dist < bestDist) { bestDist = dist; best = h; }
  }
  return best;
};

// A multi-image layout: its id (e.g. '2-vert') and how many panels it has.
export interface LayoutDef {
  id: string;
  slots: number;
}

// Which panel of a multi-image layout (activeLayoutDef) contains `coords`, or -1.
export const findSlotAt = (coords: Point, layoutDef: LayoutDef, { canvasW, canvasH, headerExtH }: { canvasW: number; canvasH: number; headerExtH: number }): number => {
  const totalSlots = layoutDef.slots;
  const isVert = layoutDef.id === '2-vert' || layoutDef.id === '3-stacked';
  const isHoriz = layoutDef.id === '2-horiz' || layoutDef.id === '3-horiz';
  const isGrid = layoutDef.id === '4-grid';
  const isHybrid = layoutDef.id === '3-hybrid';

  for (let idx = 0; idx < totalSlots; idx++) {
    let x = 0, y = headerExtH, slotW = canvasW, slotH = canvasH;
    if (isVert) { slotH = canvasH / totalSlots; y = headerExtH + idx * slotH; }
    else if (isHoriz) { slotW = canvasW / totalSlots; x = idx * slotW; y = headerExtH; }
    else if (isGrid) { slotW = canvasW / 2; slotH = canvasH / 2; x = (idx % 2) * slotW; y = headerExtH + Math.floor(idx / 2) * slotH; }
    else if (isHybrid) {
      if (idx === 0) { slotW = canvasW; slotH = canvasH / 2; x = 0; y = headerExtH; }
      else { slotW = canvasW / 2; slotH = canvasH / 2; x = (idx - 1) * slotW; y = headerExtH + canvasH / 2; }
    }
    if (coords.x >= x && coords.x <= x + slotW && coords.y >= y && coords.y <= y + slotH) return idx;
  }
  return -1;
};
