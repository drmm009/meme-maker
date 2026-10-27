// What is under the pointer: the selected layer's handles, any layer (topmost first), or a
// header/footer band. Each returns a hit describing the layer as it was when the drag started,
// or null. `scene` holds the canvas, its 2D context, the layers, the image cache and the
// centre-y helpers from canvasLayout.
import { getStickerBoxSize, isInBox, rotatePoint } from './geometry';
import {
  findHandle, getCaptionBox, getCaptionCenterX, getCaptionHandles, getImageLayerBox,
  getImageLayerHandles, getStickerHandles
} from './layerBoxes';

// Canvas pixels per screen pixel, so handles stay big enough to touch however the canvas is scaled.
const getScreenScale = (canvas) => (canvas.getBoundingClientRect
  ? canvas.width / Math.max(1, canvas.getBoundingClientRect().width)
  : 2.5);

// The selected layer's handle under `coords`. `hover` uses the smaller caption radii the cursor
// feedback uses. Locked layers have no handles.
export function hitActiveHandle(scene, coords, activeLayerId, { hover = false } = {}) {
  const { canvas, ctx, captions, stickers, imageLayers, imageCache } = scene;
  if (!activeLayerId) return null;

  const stk = stickers.find((s) => s.id === activeLayerId);
  if (stk && !stk.locked) {
    const cx = stk.x * canvas.width;
    const cy = scene.getStickerCenterY(stk);
    const p = rotatePoint(coords.x, coords.y, cx, cy, -(stk.rotation || 0));
    const handle = findHandle(p, getStickerHandles(stk, cx, cy));
    if (handle) {
      return { id: stk.id, type: handle.type, x: stk.x, y: stk.y, scale: stk.scale || 1.0, rotation: stk.rotation || 0 };
    }
  }

  const cap = captions.find((c) => c.id === activeLayerId);
  if (cap && !cap.locked) {
    const cx = getCaptionCenterX(cap, canvas.width);
    const cy = scene.getCaptionCenterY(cap, canvas);
    const p = rotatePoint(coords.x, coords.y, cx, cy, -(cap.rotation || 0));
    const { boxWidth, boxHeight } = getCaptionBox(ctx, cap, canvas.width, { handles: true });
    const screenScale = getScreenScale(canvas);
    const hitRadius = hover ? Math.max(38, Math.round(18 * screenScale)) : Math.max(48, Math.round(22 * screenScale));
    const deleteRadius = hover ? Math.max(42, Math.round(20 * screenScale)) : Math.max(52, Math.round(24 * screenScale));
    const handle = findHandle(p, getCaptionHandles(cx, cy, boxWidth, boxHeight, hitRadius, deleteRadius), { closest: true });
    if (handle) {
      const width = cap.width || (boxWidth / canvas.width);
      return {
        id: cap.id,
        type: handle.type,
        x: cap.x,
        y: cap.y,
        isHeaderCaption: !!cap.isHeaderCaption,
        isFooterCaption: !!cap.isFooterCaption,
        hasCustomPos: !!cap.hasCustomPos,
        boxWidth,
        boxHeight,
        width,
        rotation: cap.rotation || 0,
        fontSize: cap.fontSize || 50,
        initialFontSize: cap.fontSize || 50,
        initialWidth: width,
        initialBoxWidth: boxWidth,
        initialBoxHeight: boxHeight,
        initialDist: Math.max(15, Math.hypot(handle.x - cx, handle.y - cy)),
        handleRelX: handle.x - cx,
        handleRelY: handle.y - cy,
        hasCustomWidth: !!cap.hasCustomWidth
      };
    }
  }

  const img = imageLayers.find((l) => l.id === activeLayerId);
  const cached = img && imageCache[img.url];
  if (img && !img.locked && cached) {
    const cx = img.x * canvas.width;
    const cy = scene.getImageLayerCenterY(img);
    const { baseW, baseH, fitScale, scale, w, h } = getImageLayerBox(img, cached);
    const p = rotatePoint(coords.x, coords.y, cx, cy, -(img.rotation || 0));
    const handle = findHandle(p, getImageLayerHandles(img, cx, cy, w, h), { closest: true });
    if (handle) {
      return {
        id: img.id,
        type: handle.type,
        x: img.x,
        y: img.y,
        scale,
        rotation: img.rotation || 0,
        baseW, baseH, fitScale,
        boxWidth: w,
        boxHeight: h,
        width: w,
        height: h,
        crop: img.crop ? { ...img.crop } : { x: 0, y: 0, width: 1, height: 1 },
        fitMode: img.fitMode
      };
    }
  }
  return null;
}

// Is `coords` on the selected layer's body (where a drag moves it)? Locked layers aren't movable.
export function isOnActiveBody(scene, coords, activeLayerId) {
  const { canvas, ctx, captions, stickers, imageLayers, imageCache } = scene;
  if (!activeLayerId) return false;

  const stk = stickers.find((s) => s.id === activeLayerId);
  if (stk && !stk.locked) {
    const cx = stk.x * canvas.width;
    const cy = scene.getStickerCenterY(stk);
    const size = getStickerBoxSize(stk);
    if (isInBox(rotatePoint(coords.x, coords.y, cx, cy, -(stk.rotation || 0)), cx, cy, size, size, 6)) return true;
  }

  const cap = captions.find((c) => c.id === activeLayerId);
  if (cap && !cap.locked) {
    const cx = getCaptionCenterX(cap, canvas.width);
    const cy = scene.getCaptionCenterY(cap, canvas);
    const { boxWidth, boxHeight } = getCaptionBox(ctx, cap, canvas.width, { handles: true });
    if (isInBox(rotatePoint(coords.x, coords.y, cx, cy, -(cap.rotation || 0)), cx, cy, boxWidth, boxHeight)) return true;
  }

  const img = imageLayers.find((l) => l.id === activeLayerId);
  const cached = img && imageCache[img.url];
  if (img && !img.locked && cached) {
    const cx = img.x * canvas.width;
    const cy = scene.getImageLayerCenterY(img);
    const { w, h } = getImageLayerBox(img, cached);
    if (isInBox(rotatePoint(coords.x, coords.y, cx, cy, -(img.rotation || 0)), cx, cy, w, h)) return true;
  }
  return false;
}

const hitSticker = (scene, stk, coords) => {
  const cx = stk.x * scene.canvas.width;
  const cy = scene.getStickerCenterY(stk);
  const size = getStickerBoxSize(stk);
  const p = rotatePoint(coords.x, coords.y, cx, cy, -(stk.rotation || 0));
  if (!isInBox(p, cx, cy, size, size, 6)) return null;
  return { id: stk.id, type: 'sticker', x: stk.x, y: stk.y, scale: stk.scale || 1.0, rotation: stk.rotation || 0, locked: !!stk.locked };
};

const hitCaption = (scene, cap, coords) => {
  const { canvas, ctx } = scene;
  const cx = getCaptionCenterX(cap, canvas.width);
  const cy = scene.getCaptionCenterY(cap, canvas);
  const p = rotatePoint(coords.x, coords.y, cx, cy, -(cap.rotation || 0));
  const { boxWidth, boxHeight, lines, lineHeight, padY, hasBg } = getCaptionBox(ctx, cap, canvas.width);

  // A banner spans the whole width, so only its height matters.
  let hit;
  if (hasBg && cap.bgStyle === 'banner') {
    const bannerY = -((lines.length - 1) * lineHeight) / 2 - lineHeight / 2 - padY;
    hit = p.y >= cy + bannerY && p.y <= cy + bannerY + boxHeight;
  } else {
    hit = isInBox(p, cx, cy, boxWidth, boxHeight);
  }
  if (!hit) return null;
  return {
    id: cap.id,
    type: 'caption',
    x: cap.x,
    y: cap.y,
    isHeaderCaption: !!cap.isHeaderCaption,
    isFooterCaption: !!cap.isFooterCaption,
    hasCustomPos: !!cap.hasCustomPos,
    boxWidth,
    boxHeight,
    width: cap.width || (boxWidth / canvas.width),
    rotation: cap.rotation || 0,
    fontSize: cap.fontSize || 50,
    initialFontSize: cap.fontSize || 50,
    initialWidth: cap.width || 0.9,
    initialBoxWidth: boxWidth,
    initialBoxHeight: boxHeight,
    hasCustomWidth: !!cap.hasCustomWidth,
    locked: !!cap.locked
  };
};

const hitImageLayer = (scene, img, coords) => {
  const cached = scene.imageCache[img.url];
  if (!cached) return null;
  const cx = img.x * scene.canvas.width;
  const cy = scene.getImageLayerCenterY(img);
  const { baseW, baseH, fitScale, w, h } = getImageLayerBox(img, cached);
  const p = rotatePoint(coords.x, coords.y, cx, cy, -(img.rotation || 0));
  if (!isInBox(p, cx, cy, w, h)) return null;
  return {
    id: img.id,
    type: 'imageLayer',
    x: img.x,
    y: img.y,
    scale: img.scale || 1.0,
    rotation: img.rotation || 0,
    baseW, baseH, fitScale,
    boxWidth: w,
    boxHeight: h,
    width: w,
    height: h,
    locked: !!img.locked,
    crop: img.crop ? { ...img.crop } : undefined,
    fitMode: img.fitMode
  };
};

// The topmost visible layer under `coords` (highest zIndex first; on a tie, image layers, then
// stickers, then captions). Captions need a 2D context to measure, so they're skipped without one.
export function hitLayerAt(scene, coords) {
  const layers = [
    ...(scene.imageLayers || []).map((l) => ({ layer: l, hit: hitImageLayer })),
    ...(scene.stickers || []).map((l) => ({ layer: l, hit: hitSticker })),
    ...(scene.captions || []).map((l) => ({ layer: l, hit: hitCaption }))
  ];
  layers.sort((a, b) => (b.layer.zIndex ?? 0) - (a.layer.zIndex ?? 0));
  for (const { layer, hit } of layers) {
    if (layer.hidden) continue;
    if (hit === hitCaption && !scene.ctx) continue;
    const result = hit(scene, layer, coords);
    if (result) return result;
  }
  return null;
}

// A tap on an enabled header or footer band selects its caption (while it sits in the band).
export function hitBandCaption(captions, coords, { isHeaderEnabled, isFooterEnabled, headerExtH, canvasH }) {
  const inHeader = isHeaderEnabled && coords.y <= headerExtH;
  const inFooter = !inHeader && isFooterEnabled && coords.y >= headerExtH + canvasH;
  if (!inHeader && !inFooter) return null;
  const cap = captions.find((c) => (inHeader ? c.isHeaderCaption : c.isFooterCaption));
  if (!cap || cap.hasCustomPos) return null;
  return {
    id: cap.id,
    type: 'caption',
    x: cap.x,
    y: cap.y,
    ...(inHeader ? { isHeaderCaption: true } : { isFooterCaption: true }),
    hasCustomPos: false,
    locked: !!cap.locked
  };
}
