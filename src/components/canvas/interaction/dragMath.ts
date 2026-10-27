// What a drag does to a layer. Each function takes the drag's start (from getDragStart) and the
// pointer in canvas pixels, and returns the patch for the layer's bounds (null: no change).
import type { CropRect, LoadedImage, MemeCaption, MemeImageLayer, MemeSticker } from '../../../model/memeDocument';
import { getStickerBoxSize, rotatePoint } from './geometry';
import type { Point } from './geometry';
import { IMAGE_LAYER_FIT } from './layerBoxes';
import type { LayerHit, SceneCanvas } from './hitTest';
import type { CaptionPlacement } from '../layout/canvasLayout';
import { isSocialCardCaption } from '../../editor/memeEditorUtils';

const isCaptionHit = (t: string) => t === 'caption' || t.startsWith('resize_caption_') || t === 'rotate_caption';
const isStickerHit = (t: string) => t === 'sticker' || t.startsWith('resize_sticker_') || t === 'rotate_sticker';
const isImageHit = (t: string) => t === 'imageLayer' || t.startsWith('resize_imageLayer_') || t === 'rotate_imageLayer';

// The layer as it was when the drag started.
export interface DragStart {
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  width?: number;
  height?: number;
  boxWidth?: number;
  boxHeight?: number;
  scale: number;
  rotation: number;
  initialDist: number;
  initialFontSize: number;
  initialWidth: number;
  initialBoxWidth?: number;
  initialBoxHeight?: number;
  handleRelX?: number;
  handleRelY?: number;
  hasCustomWidth?: boolean;
  crop?: CropRect;
  fitMode?: MemeImageLayer['fitMode'];
}

// Centre-y helpers from canvasLayout (layer y is a fraction of the image area).
export interface LayerCenters {
  getCaptionCenterY: (cap: CaptionPlacement) => number;
  getStickerCenterY: (layer: { y?: number }) => number;
  getImageLayerCenterY: (layer: { y?: number }) => number;
}

// Snapshot of the hit layer when the drag starts. Header and footer captions sitting in their
// band are measured against the whole canvas height, everything else against the image area.
export function getDragStart(
  hit: LayerHit,
  coords: Point,
  { canvas, canvasH, headerExtH, totalCanvasH, getCaptionCenterY, getStickerCenterY, getImageLayerCenterY }:
    LayerCenters & { canvas: SceneCanvas; canvasH: number; headerExtH: number; totalCanvasH: number }
): DragStart {
  const centerX = hit.x * canvas.width;
  const centerY = isCaptionHit(hit.type) ? getCaptionCenterY(hit)
    : isStickerHit(hit.type) ? getStickerCenterY(hit)
    : isImageHit(hit.type) ? getImageLayerCenterY(hit)
    : (headerExtH + (hit.y || 0) * canvasH);
  const initDist = hit.initialDist || Math.hypot(coords.x - centerX, coords.y - centerY);
  const inBand = (hit.isHeaderCaption || hit.isFooterCaption) && !hit.hasCustomPos;

  return {
    x: hit.x,
    y: inBand ? centerY / Math.max(1, canvas.height || totalCanvasH) : hit.y,
    centerX,
    centerY,
    width: hit.boxWidth || hit.width,
    height: hit.boxHeight || hit.height,
    boxWidth: hit.boxWidth || hit.width,
    boxHeight: hit.boxHeight || hit.height,
    scale: hit.scale || 1.0,
    rotation: hit.rotation || 0,
    initialDist: Math.max(15, initDist),
    initialFontSize: hit.initialFontSize || hit.fontSize || 50,
    initialWidth: hit.initialWidth || hit.width || 0.9,
    initialBoxWidth: hit.initialBoxWidth || hit.boxWidth,
    initialBoxHeight: hit.initialBoxHeight || hit.boxHeight,
    handleRelX: hit.handleRelX,
    handleRelY: hit.handleRelY,
    hasCustomWidth: hit.hasCustomWidth,
    crop: hit.crop ? { ...hit.crop } : undefined,
    fitMode: hit.fitMode
  };
}

// The layer's centre in canvas pixels during the drag.
export const getDragCenter = (start: Pick<DragStart, 'x' | 'y'> & Partial<Pick<DragStart, 'centerX' | 'centerY'>>, canvasWidth: number, headerExtH: number, canvasH: number): Point => ({
  x: start.centerX ?? (start.x * canvasWidth),
  y: start.centerY ?? (headerExtH + start.y * canvasH)
});

// Rotation in degrees from the centre to the pointer (the handle sits above the centre), snapped
// to the nearest right angle within 3.5 degrees.
export function getRotation(center: Point, coords: Point): number {
  let angleDeg = (Math.atan2(coords.y - center.y, coords.x - center.x) * 180 / Math.PI) + 90;
  const normalized = ((angleDeg % 360) + 360) % 360;
  for (const snap of [0, 90, 180, 270, 360]) {
    if (Math.abs(normalized - snap) < 3.5) {
      angleDeg = snap === 360 ? 0 : snap;
      break;
    }
  }
  return angleDeg;
}

export type ImageLayerPatch = Partial<Pick<MemeImageLayer, 'x' | 'y' | 'width' | 'height' | 'boxWidth' | 'boxHeight' | 'scale' | 'crop' | 'fitMode'>>;

interface ImageResize {
  handleType: string;
  coords: Point;
  start: DragStart;
  layer: MemeImageLayer;
  cached: LoadedImage | undefined;
  canvasWidth: number;
  headerExtH: number;
  canvasH: number;
}

// Crop mode: an edge handle trims that side of the image, keeping the opposite edge in place.
function cropImageLayer({ handleType, coords, start, layer, cached, center, canvasWidth, headerExtH, canvasH }: ImageResize & { center: Point }): ImageLayerPatch | null {
  const initW = start.boxWidth || start.width || 160;
  const initH = start.boxHeight || start.height || 160;
  const initCrop = start.crop || { x: 0, y: 0, width: 1, height: 1 };
  const rot = layer.rotation || 0;
  // The uncropped image's size on the canvas.
  let fullW = initW / Math.max(0.01, initCrop.width || 1);
  let fullH = initH / Math.max(0.01, initCrop.height || 1);
  if (cached && cached.width && cached.height) {
    const fitScale = Math.min(IMAGE_LAYER_FIT / cached.width, IMAGE_LAYER_FIT / cached.height);
    const scale = start.scale || layer.scale || 1.0;
    if (!start.crop || (start.crop.width === 1 && start.crop.height === 1)) {
      fullW = cached.width * fitScale * scale;
      fullH = cached.height * fitScale * scale;
    }
  }

  const local = rotatePoint(coords.x, coords.y, center.x, center.y, -rot);
  const place = (localX: number, localY: number) => {
    const c = rotatePoint(localX, localY, center.x, center.y, rot);
    return { x: c.x / canvasWidth, y: (c.y - headerExtH) / canvasH };
  };
  const clamp = (target: number, minPx: number, full: number, max: number) => {
    const min = Math.min(max, Math.max(0.02, minPx / full));
    return Math.max(min, Math.min(max, target));
  };

  if (handleType === 'resize_imageLayer_r' || handleType === 'resize_imageLayer_l') {
    const fromRight = handleType === 'resize_imageLayer_l';
    const anchor = fromRight ? center.x + initW / 2 : center.x - initW / 2;
    const rightEdge = Math.min(1.0, (initCrop.x || 0) + (initCrop.width || 1));
    const maxCropW = fromRight ? Math.max(0.02, rightEdge) : Math.max(0.02, 1.0 - (initCrop.x || 0));
    const cropW = clamp((fromRight ? anchor - local.x : local.x - anchor) / fullW, 20, fullW, maxCropW);
    const newW = Math.max(20, Math.round(cropW * fullW));
    return {
      ...place(fromRight ? anchor - newW / 2 : anchor + newW / 2, center.y),
      width: newW,
      boxWidth: newW,
      crop: fromRight ? { ...initCrop, x: Math.max(0, rightEdge - cropW), width: cropW } : { ...initCrop, width: cropW },
      fitMode: 'crop'
    };
  }

  if (handleType === 'resize_imageLayer_b' || handleType === 'resize_imageLayer_t') {
    const fromBottom = handleType === 'resize_imageLayer_t';
    const anchor = fromBottom ? center.y + initH / 2 : center.y - initH / 2;
    const bottomEdge = Math.min(1.0, (initCrop.y || 0) + (initCrop.height || 1));
    const maxCropH = fromBottom ? Math.max(0.02, bottomEdge) : Math.max(0.02, 1.0 - (initCrop.y || 0));
    const cropH = clamp((fromBottom ? anchor - local.y : local.y - anchor) / fullH, 20, fullH, maxCropH);
    const newH = Math.max(20, Math.round(cropH * fullH));
    return {
      ...place(center.x, fromBottom ? anchor - newH / 2 : anchor + newH / 2),
      height: newH,
      boxHeight: newH,
      crop: fromBottom ? { ...initCrop, y: Math.max(0, bottomEdge - cropH), height: cropH } : { ...initCrop, height: cropH },
      fitMode: 'crop'
    };
  }

  // Corner resize is off while cropping.
  return null;
}

// Image layer handles: crop in crop mode; otherwise edges stretch one axis (switching "fit" to
// "stretch") and the corner scales both.
export function resizeImageLayer({ handleType, coords, start, layer, cached, canvasWidth, headerExtH, canvasH }: ImageResize): ImageLayerPatch | null {
  const center = getDragCenter(start, canvasWidth, headerExtH, canvasH);
  if (layer.fitMode === 'crop' || start.fitMode === 'crop') {
    return cropImageLayer({ handleType, coords, start, layer, cached, center, canvasWidth, headerExtH, canvasH });
  }

  const initW = start.boxWidth || start.width || 160;
  const initH = start.boxHeight || start.height || 160;
  const fitMode = (!layer.fitMode || layer.fitMode === 'fit') ? 'stretch' : layer.fitMode;
  const local = rotatePoint(coords.x, coords.y, center.x, center.y, -(layer.rotation || 0));

  if (handleType === 'resize_imageLayer_l' || handleType === 'resize_imageLayer_r') {
    const newWidth = Math.max(30, Math.round(Math.abs(local.x - center.x) * 2));
    return { width: newWidth, boxWidth: newWidth, height: initH, boxHeight: initH, fitMode };
  }
  if (handleType === 'resize_imageLayer_t' || handleType === 'resize_imageLayer_b') {
    const newHeight = Math.max(30, Math.round(Math.abs(local.y - center.y) * 2));
    return { width: initW, boxWidth: initW, height: newHeight, boxHeight: newHeight, fitMode };
  }

  const scaleFactor = Math.max(0.05, Math.hypot(coords.x - center.x, coords.y - center.y) / (start.initialDist || 50));
  const newWidth = Math.max(30, Math.round(initW * scaleFactor));
  const newHeight = Math.max(30, Math.round(initH * scaleFactor));
  const scale = Math.max(0.1, Math.min(10.0, Number(((start.scale || 1.0) * scaleFactor).toFixed(2))));
  return { width: newWidth, height: newHeight, boxWidth: newWidth, boxHeight: newHeight, scale };
}

// Sticker corner: scale with the pointer's distance from the centre.
export function resizeSticker({ coords, start, sticker, canvasWidth, headerExtH, canvasH }: {
  coords: Point; start: DragStart; sticker: MemeSticker; canvasWidth: number; headerExtH: number; canvasH: number;
}): { scale: number } {
  const center = getDragCenter(start, canvasWidth, headerExtH, canvasH);
  const initDist = start.initialDist || Math.max(10, getStickerBoxSize(sticker) * 0.7);
  const scaleFactor = Math.hypot(coords.x - center.x, coords.y - center.y) / initDist;
  return { scale: Math.max(0.2, Math.min(20.0, Number(((start.scale || 1.0) * scaleFactor).toFixed(2)))) };
}

// Caption handles: the sides change the wrap width, the corner scales font size and width.
// Either way the (rotated) box stays 8px inside the canvas.
export function resizeCaption({ handleType, coords, start, caption, canvas, headerExtH, canvasH }: {
  handleType: string; coords: Point; start: DragStart; caption: MemeCaption; canvas: SceneCanvas; headerExtH: number; canvasH: number;
}): { width: number; hasCustomWidth: true } | { fontSize: number; width: number } {
  const center = getDragCenter(start, canvas.width, headerExtH, canvasH);
  const rot = start.rotation || 0;
  const local = rotatePoint(coords.x, coords.y, center.x, center.y, -rot);
  const edgePad = 8;
  const rad = Math.abs((rot * Math.PI) / 180);
  const cosR = Math.abs(Math.cos(rad));
  const sinR = Math.abs(Math.sin(rad));
  const maxAvailX = Math.max(20, Math.min(center.x - edgePad, canvas.width - center.x - edgePad));
  const maxAvailY = Math.max(20, Math.min(center.y - edgePad, canvas.height - center.y - edgePad));

  if (handleType === 'resize_caption_l' || handleType === 'resize_caption_r') {
    const localDx = local.x - center.x;
    const rawHalfWidth = Math.max(30, handleType === 'resize_caption_r' ? localDx : -localDx);
    const currentH = start.initialBoxHeight || start.boxHeight || 60;
    let maxHalfW = canvas.width / 2 - edgePad;
    if (cosR > 0.08) maxHalfW = Math.min(maxHalfW, Math.max(30, (maxAvailX - (currentH / 2) * sinR) / cosR));
    if (sinR > 0.08) maxHalfW = Math.min(maxHalfW, Math.max(30, (maxAvailY - (currentH / 2) * cosR) / sinR));
    const halfWidth = Math.max(30, Math.min(maxHalfW, rawHalfWidth));
    return { width: Math.max(0.15, Math.min(0.98, Number((halfWidth * 2 / canvas.width).toFixed(3)))), hasCustomWidth: true };
  }

  // Corner: project the pointer onto the handle's diagonal for smooth, proportional scaling.
  const initDist = start.initialDist || 50;
  const initRelX = start.handleRelX || (handleType.includes('r') ? 50 : -50);
  const initRelY = start.handleRelY || (handleType.includes('b') ? 50 : -50);
  const proj = ((local.x - center.x) * initRelX + (local.y - center.y) * initRelY) / (initDist * initDist);

  const initW = start.initialBoxWidth || start.boxWidth || 100;
  const initH = start.initialBoxHeight || start.boxHeight || 60;
  const halfExtentX = Math.max(20, (initW / 2) * cosR + (initH / 2) * sinR);
  const halfExtentY = Math.max(20, (initW / 2) * sinR + (initH / 2) * cosR);
  const maxScale = Math.max(0.35, Math.min(maxAvailX / halfExtentX, maxAvailY / halfExtentY));
  const scaleFactor = Math.max(0.1, Math.min(maxScale, proj));

  const isSocial = isSocialCardCaption(caption);
  const initFontSize = start.initialFontSize || caption.fontSize || (isSocial ? 16 : 50);
  const initWidth = start.initialWidth || caption.width || (isSocial ? (caption.isWhatsAppCard ? 0.84 : 0.88) : 0.9);
  return {
    fontSize: Math.max(10, Math.min(220, Math.round(initFontSize * scaleFactor))),
    width: Math.max(0.15, Math.min(0.98, Number((initWidth * scaleFactor).toFixed(3))))
  };
}

const SNAP_DIST = 0.015;

// Moving a layer by (dx, dy), as fractions of the canvas / image area. Captions stay inside the
// canvas; the position snaps to the centre lines and to other layers' centres, which are
// returned as guides ({ horizontal, vertical }) for the renderer.
export function moveLayer({ target, start, dx, dy, canvas, canvasH, captions, stickers, imageLayers }: {
  target: Pick<LayerHit, 'id' | 'type' | 'isHeaderCaption' | 'isFooterCaption'>;
  start: Pick<DragStart, 'x' | 'y'> & Partial<Pick<DragStart, 'rotation' | 'boxWidth' | 'boxHeight' | 'width'>>;
  dx: number;
  dy: number;
  canvas: SceneCanvas;
  canvasH: number;
  captions: { id: string; x: number; y: number }[];
  stickers: { id: string; x: number; y: number }[];
  imageLayers?: { id: string; x: number; y: number }[];
}): { x: number; y: number; guides: { horizontal: number | null; vertical: number | null } } {
  let x = start.x + dx;
  let y = start.y + dy;

  if (target.type === 'caption') {
    const rad = Math.abs(((start.rotation || 0) * Math.PI) / 180);
    const bW = start.boxWidth || ((start.width || 0.5) * canvas.width) || 100;
    const bH = start.boxHeight || 60;
    const halfExtX = (bW / 2) * Math.abs(Math.cos(rad)) + (bH / 2) * Math.abs(Math.sin(rad));
    const halfExtY = (bW / 2) * Math.abs(Math.sin(rad)) + (bH / 2) * Math.abs(Math.cos(rad));
    const edgePad = 8;
    const areaH = target.isHeaderCaption || target.isFooterCaption ? canvas.height : canvasH;
    const minX = Math.min(0.5, (halfExtX + edgePad) / canvas.width);
    const maxX = Math.max(0.5, (canvas.width - halfExtX - edgePad) / canvas.width);
    const minY = Math.min(0.5, (halfExtY + edgePad) / areaH);
    const maxY = Math.max(0.5, (areaH - halfExtY - edgePad) / areaH);
    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));
  }

  let horizontal: number | null = null;
  let vertical: number | null = null;
  if (Math.abs(x - 0.5) < SNAP_DIST) { x = 0.5; vertical = 0.5; }
  if (Math.abs(y - 0.5) < SNAP_DIST) { y = 0.5; horizontal = 0.5; }
  for (const other of [...captions, ...stickers, ...(imageLayers || [])]) {
    if (other.id === target.id) continue;
    if (Math.abs(x - other.x) < SNAP_DIST) { x = other.x; vertical = other.x; }
    if (Math.abs(y - other.y) < SNAP_DIST) { y = other.y; horizontal = other.y; }
  }
  return { x, y, guides: { horizontal, vertical } };
}
