// A video sticker's look, drawn by the image editor's sticker painting (canvas/draw/dieCut and
// layerLook): its die-cut border and drop shadow. The look is drawn once into a picture the same
// shape as the sticker's own, the sticker a little smaller inside it to leave room, so Konva and
// FFmpeg place, crop, flip and move it exactly as they do the plain picture.
import { renderDieCutImage } from '../components/canvas/draw/dieCut';
import { applyShadow } from '../components/canvas/draw/layerLook';
import { isGifUrl } from './gif';

export const DEFAULT_DIECUT_WIDTH = 6;
// The picture's longest side at most, in pixels.
const MAX_SIDE = 1024;
const MAX_CACHED = 8;

export interface StickerLook {
  type?: string;
  url?: string;
  isGif?: boolean;
  // Its size on the stage (width x scaleX), which border and shadow sizes are measured against.
  width?: number;
  height?: number;
  scaleX?: number;
  dieCut?: boolean;
  dieCutColor?: string;
  // In stage units, as are the shadow's.
  dieCutWidth?: number;
  shadowSize?: number;
  shadowColor?: string;
}

// GIF stickers play their frames as they are: no border or shadow.
export const isGifSticker = (item: StickerLook): boolean => Boolean(item.isGif || isGifUrl(item.url));

export const hasStickerLook = (item: StickerLook): boolean =>
  item.type === 'sticker' && !isGifSticker(item) && (Boolean(item.dieCut) || (item.shadowSize || 0) > 0);

type Source = HTMLImageElement | HTMLCanvasElement;
const sizeOf = (img: Source) => ({
  w: (img as HTMLImageElement).naturalWidth || img.width,
  h: (img as HTMLImageElement).naturalHeight || img.height,
});

// Pictures by source and look (a sticker resized gets a border and shadow of the same stage size).
const cache = new WeakMap<Source, Map<string, HTMLCanvasElement>>();

export function stickerLookImage(img: Source, item: StickerLook): HTMLCanvasElement {
  // An SVG may have no size of its own: then the clip's.
  const natural = sizeOf(img);
  const nw = natural.w || item.width || 200;
  const nh = natural.h || item.height || 200;
  const shownWidth = Math.max(1, (item.width || nw) * (item.scaleX || 1));
  // Sharp at twice its stage size (a small SVG drawn bigger), never past MAX_SIDE.
  const fit = Math.min(MAX_SIDE / Math.max(nw, nh), Math.max(1, (shownWidth * 2) / nw));
  const cw = Math.max(1, Math.round(nw * fit));
  const ch = Math.max(1, Math.round(nh * fit));
  // Picture pixels per stage unit.
  const perUnit = cw / shownWidth;
  const border = item.dieCut ? (item.dieCutWidth ?? DEFAULT_DIECUT_WIDTH) * perUnit : 0;
  const shadow = (item.shadowSize || 0) * perUnit;
  const color = item.dieCutColor || '#ffffff';
  const key = JSON.stringify([cw, ch, Boolean(item.dieCut), color, Math.round(border * 4), Math.round(shadow * 4), item.shadowColor || '']);
  let byLook = cache.get(img);
  const hit = byLook?.get(key);
  if (hit) return hit;

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  // Room for the border, the die-cut's own soft shadow and the drop shadow (which falls down).
  const margin = border + (item.dieCut ? 8 : 0) + shadow * 1.4;
  const f = Math.max(0.2, Math.min((cw - 2 * margin) / cw, (ch - 2 * margin) / ch));
  const drawW = cw * f;
  const drawH = ch * f;
  ctx.translate(cw / 2, ch / 2 - shadow * 0.2);
  applyShadow(ctx, { shadowSize: shadow, shadowColor: item.shadowColor });
  if (item.dieCut) renderDieCutImage(ctx, img, drawW, drawH, color, border);
  else ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

  if (!byLook) {
    byLook = new Map();
    cache.set(img, byLook);
  }
  byLook.set(key, canvas);
  if (byLook.size > MAX_CACHED) byLook.delete(byLook.keys().next().value as string);
  return canvas;
}

// The look as PNG bytes, for the FFmpeg export.
export async function stickerLookPng(url: string, item: StickerLook): Promise<Uint8Array | null> {
  const img = new Image();
  if (!url.startsWith('blob:') && !url.startsWith('data:')) img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  const canvas = stickerLookImage(img, item);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
}
