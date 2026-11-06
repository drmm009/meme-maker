// A video photo's look, drawn by the image editor's photo painting (data/photoFilters,
// canvas/draw/photoEffects and layerLook), in two parts:
// - its picture: the filter (preset and Adjust) and background blur, drawn once into a picture the
//   same shape as the photo's own, so Konva and FFmpeg crop, zoom and move it as the plain photo;
// - its frame: rounded corners, border and drop shadow, drawn round the part of the picture on
//   show (photoSceneFunc, the Konva node's drawing), so a crop, photo motion or zoom-punch moves the
//   photo inside its frame. The FFmpeg export bakes the frame into the picture (photoLookFile).
import type Konva from 'konva';
import { drawImageFiltered, getFilterCss } from '../data/photoFilters';
import { applyPhotoEffects, blurredCopy, hasPhotoEffects } from '../components/canvas/draw/photoEffects';
import type { PhotoEffects } from '../components/canvas/draw/photoEffects';
import { applyShadow, cornerPx, isFramed, roundRectPath } from '../components/canvas/draw/layerLook';
import type { LayerLook } from '../components/canvas/draw/layerLook';
import { clipCrop } from './clipCrop';
import type { ClipCrop } from '../model/videoProject';

// The picture's longest side at most, in pixels.
const MAX_SIDE = 2048;
const MAX_CACHED = 6;

export interface PhotoLook extends LayerLook {
  type?: string;
  url?: string;
  // The image editor's filter values (brightness, contrast, saturation, sepia…, warmth, sharpen,
  // vignette) and the preset they came from.
  filters?: Record<string, number> | null;
  filterId?: string | null;
  // Background blur (0..30) over the subject, cut out from `subjectOf` (the url it was cut from).
  bgBlur?: number;
  subjectUrl?: string | null;
  subjectOf?: string | null;
}

// The subject to keep sharp over the blur: only while it was cut from the photo showing now.
export const blurSubjectUrl = (item: PhotoLook): string | null =>
  item.type === 'image' && (item.bgBlur || 0) > 0 && item.subjectUrl && item.subjectOf === item.url ? item.subjectUrl : null;

const filterCssOf = (item: PhotoLook): string => (item.filters ? getFilterCss(item.filters) : 'none');
const effectsOf = (item: PhotoLook): PhotoEffects | null => (item.filters as PhotoEffects | null | undefined) || null;

// Does the photo have a picture of its own (a filter, or background blur once there is a subject)?
export const hasPhotoPicture = (item: PhotoLook): boolean =>
  item.type === 'image' && (filterCssOf(item) !== 'none' || hasPhotoEffects(effectsOf(item)) || Boolean(blurSubjectUrl(item)));

export const isPhotoFramed = (item: PhotoLook): boolean => item.type === 'image' && isFramed(item);

type Source = HTMLImageElement | HTMLCanvasElement;
const sizeOf = (img: Source) => ({
  w: (img as HTMLImageElement).naturalWidth || img.width,
  h: (img as HTMLImageElement).naturalHeight || img.height,
});

const cache = new WeakMap<Source, Map<string, HTMLCanvasElement>>();

// The photo with its filter and background blur. `subject` is the loaded blurSubjectUrl (without
// it there is no blur). The blur goes on first and the filter over the whole, subject included.
export function photoPicture(img: Source, item: PhotoLook, subject?: Source | null): HTMLCanvasElement {
  const { w: nw, h: nh } = sizeOf(img);
  const f = Math.min(1, MAX_SIDE / Math.max(nw || 1, nh || 1));
  const cw = Math.max(1, Math.round((nw || 1) * f));
  const ch = Math.max(1, Math.round((nh || 1) * f));
  const css = filterCssOf(item);
  const effects = effectsOf(item);
  const blur = subject ? item.bgBlur || 0 : 0;
  const key = JSON.stringify([cw, ch, css, hasPhotoEffects(effects) ? [effects?.warmth, effects?.sharpen, effects?.vignette] : 0, blur, blur ? item.subjectUrl : '']);
  let byLook = cache.get(img);
  const hit = byLook?.get(key);
  if (hit) return hit;

  let source: CanvasImageSource = img;
  if (blur && subject) {
    const blurred = blurredCopy(img, cw, ch, blur * (cw / 600));
    if (blurred) {
      const bctx = blurred.getContext('2d');
      bctx?.drawImage(subject, 0, 0, cw, ch);
      source = blurred;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  drawImageFiltered(ctx, source, css, 0, 0, cw, ch);
  if (hasPhotoEffects(effects)) applyPhotoEffects(ctx, 0, 0, cw, ch, effects as PhotoEffects);

  if (!byLook) {
    byLook = new Map();
    cache.set(img, byLook);
  }
  byLook.set(key, canvas);
  if (byLook.size > MAX_CACHED) byLook.delete(byLook.keys().next().value as string);
  return canvas;
}

interface Rect { x: number; y: number; width: number; height: number }

// The frame in pixels: the photo's size, its border, corner radius and shadow.
interface FramePx { w: number; h: number; border: number; radius: number; shadow: number; color?: string; shadowColor?: string }

// Room round the photo for its shadow (which falls down a little), each side.
const shadowRoom = (shadow: number) => ({ side: Math.ceil(shadow * 1.2), top: Math.ceil(shadow * 0.9), bottom: Math.ceil(shadow * 1.6) });

// The photo's `rect` of `src` drawn w x h with its rounded corners, border (outside the photo, as the
// image editor draws it) and shadow, as paintImageLayer does. Returns the canvas and where the
// photo's top-left corner is in it.
export function framedPhoto(src: CanvasImageSource, rect: Rect, px: FramePx, flip?: { x?: boolean; y?: boolean }): { canvas: HTMLCanvasElement; left: number; top: number } {
  const { w, h, border: bw, radius: r } = px;
  const room = shadowRoom(px.shadow);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w + bw * 2 + room.side * 2));
  canvas.height = Math.max(1, Math.ceil(h + bw * 2 + room.top + room.bottom));
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const left = room.side + bw;
  const top = room.top + bw;
  // The photo and border on their own first, then onto the canvas with the shadow (it follows
  // their shape, a cut-out photo's too).
  const frame = document.createElement('canvas');
  frame.width = Math.max(1, Math.ceil(w + bw * 2));
  frame.height = Math.max(1, Math.ceil(h + bw * 2));
  const fctx = frame.getContext('2d') as CanvasRenderingContext2D;
  fctx.translate(frame.width / 2, frame.height / 2);
  fctx.save();
  roundRectPath(fctx, -w / 2, -h / 2, w, h, r);
  fctx.clip();
  if (flip?.x || flip?.y) fctx.scale(flip.x ? -1 : 1, flip.y ? -1 : 1);
  fctx.drawImage(src, rect.x, rect.y, rect.width, rect.height, -w / 2, -h / 2, w, h);
  fctx.restore();
  if (bw > 0) {
    roundRectPath(fctx, -w / 2 - bw / 2, -h / 2 - bw / 2, w + bw, h + bw, r ? r + bw / 2 : 0);
    fctx.lineWidth = bw;
    fctx.strokeStyle = px.color || '#ffffff';
    fctx.stroke();
  }
  applyShadow(ctx, { shadowSize: px.shadow, shadowColor: px.shadowColor });
  ctx.drawImage(frame, room.side, room.top);
  return { canvas, left, top };
}

// The frame's sizes in pixels for a photo drawn w x h pixels, `perUnit` pixels per stage unit.
const framePx = (item: PhotoLook, w: number, h: number, perUnit: number): FramePx => ({
  w,
  h,
  border: (item.borderWidth || 0) * perUnit,
  radius: cornerPx(item, w, h),
  shadow: (item.shadowSize || 0) * perUnit,
  color: item.borderColor,
  shadowColor: item.shadowColor,
});

// The Konva node's last frame, redrawn only when the picture, the part on show, the size or the
// look changes (a photo that moves or zooms redraws it each frame).
const drawn = new WeakMap<Konva.Image, { image: unknown; key: string; frame: ReturnType<typeof framedPhoto> }>();

// A framed photo's drawing on the preview and the frame-by-frame export: Konva's own (the node's
// image, crop, size and transform) with the frame round it. The look is the node's `photoLook`.
export function photoSceneFunc(context: Konva.Context, shape: Konva.Shape): void {
  const node = shape as Konva.Image;
  const ctx = (context as unknown as { _context: CanvasRenderingContext2D })._context;
  const img = node.image() as Source | undefined;
  const look = node.getAttr('photoLook') as PhotoLook | undefined;
  if (!img || !look) return;
  const { w: iw, h: ih } = sizeOf(img);
  const w = node.width();
  const h = node.height();
  const rect = node.cropWidth() && node.cropHeight() ? node.crop() : { x: 0, y: 0, width: iw, height: ih };
  // Screen pixels per node unit, and per stage unit (the node's scale is its size on the stage).
  const t = ctx.getTransform();
  const kx = Math.hypot(t.a, t.b) || 1;
  const ky = Math.hypot(t.c, t.d) || 1;
  const fit = Math.min(1, MAX_SIDE / Math.max(w * kx, h * ky));
  const perUnit = (kx * fit) / (Math.abs(node.scaleX()) || 1);
  const pw = Math.max(1, Math.round(w * kx * fit));
  const ph = Math.max(1, Math.round(h * ky * fit));
  const px = framePx(look, pw, ph, perUnit);
  const key = JSON.stringify([rect.x, rect.y, rect.width, rect.height, pw, ph, px.border, px.radius, px.shadow, px.color || '', px.shadowColor || '']);
  let last = drawn.get(node);
  if (!last || last.image !== img || last.key !== key) {
    last = { image: img, key, frame: framedPhoto(img, rect, px) };
    drawn.set(node, last);
  }
  const { canvas, left, top } = last.frame;
  // Back from pixels to node units.
  const ux = w / pw;
  const uy = h / ph;
  ctx.drawImage(canvas, -left * ux, -top * uy, canvas.width * ux, canvas.height * uy);
}

// Konva attributes for a photo node: its frame's drawing while it has one.
export const photoNodeAttrs = (item: PhotoLook) => (isPhotoFramed(item)
  ? { sceneFunc: photoSceneFunc, photoLook: { borderWidth: item.borderWidth, borderColor: item.borderColor, cornerRadius: item.cornerRadius, shadowSize: item.shadowSize, shadowColor: item.shadowColor } }
  : { sceneFunc: undefined, photoLook: undefined });

const loadImage = async (url: string): Promise<HTMLImageElement> => {
  const img = new Image();
  if (!url.startsWith('blob:') && !url.startsWith('data:')) img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  return img;
};

const pngOf = async (canvas: HTMLCanvasElement): Promise<Uint8Array | null> => {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
};

interface PlacedPhoto extends PhotoLook {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  crop?: ClipCrop | null;
}

// The photo for the FFmpeg export: its picture as PNG bytes and, when framed, the frame baked in
// (crop and flips too) with the clip's box grown to hold it (`patch`). A framed photo's motion then
// zooms the framed card.
export async function photoLookFile(item: PlacedPhoto): Promise<{ data: Uint8Array; patch: Partial<PlacedPhoto> } | null> {
  if (!item.url) return null;
  const img = await loadImage(item.url);
  const subjectUrl = blurSubjectUrl(item);
  const subject = subjectUrl ? await loadImage(subjectUrl).catch(() => null) : null;
  const picture = hasPhotoPicture(item) ? photoPicture(img, item, subject) : img;
  if (!isPhotoFramed(item)) {
    const canvas = picture instanceof HTMLCanvasElement ? picture : photoPicture(img, { type: 'image' });
    const data = await pngOf(canvas);
    return data ? { data, patch: {} } : null;
  }
  const { w: iw, h: ih } = sizeOf(picture);
  const crop = clipCrop(item);
  const rect = { x: crop.x * iw, y: crop.y * ih, width: crop.width * iw, height: crop.height * ih };
  const sw = (item.width || 200) * Math.abs(item.scaleX || 1);
  const sh = (item.height || 200) * Math.abs(item.scaleY || 1);
  const perUnit = Math.min(2, MAX_SIDE / Math.max(sw, sh));
  const { canvas, left, top } = framedPhoto(picture, rect, framePx(item, sw * perUnit, sh * perUnit, perUnit), { x: item.flipX, y: item.flipY });
  const data = await pngOf(canvas);
  if (!data) return null;
  // The box's top-left corner moves out by the frame's room, along the clip's rotation.
  const ml = left / perUnit;
  const mt = top / perUnit;
  const a = ((item.rotation || 0) * Math.PI) / 180;
  return {
    data,
    patch: {
      x: (item.x || 0) - ml * Math.cos(a) + mt * Math.sin(a),
      y: (item.y || 0) - ml * Math.sin(a) - mt * Math.cos(a),
      width: canvas.width / perUnit,
      height: canvas.height / perUnit,
      scaleX: 1,
      scaleY: 1,
      crop: null,
      flipX: false,
      flipY: false,
    },
  };
}
