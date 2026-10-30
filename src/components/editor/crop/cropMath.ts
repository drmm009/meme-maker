// Cropping and turning the main photo. The crop box is in fractions (0..1) of the photo as turned;
// the result is baked into a new picture (bakeCrop), so the meme just gets a new photo.

export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CropHandle = 'nw' | 'ne' | 'sw' | 'se' | 'move';
export type Rotation = 0 | 90 | 180 | 270;

export const FULL_CROP: CropBox = { x: 0, y: 0, w: 1, h: 1 };
// The smallest box, as a fraction of each side.
export const MIN_CROP = 0.05;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export const turn = (r: Rotation, by: 90 | -90): Rotation => (((r + by) % 360 + 360) % 360) as Rotation;

// The photo's size once turned.
export const rotatedSize = (w: number, h: number, r: Rotation): { w: number; h: number } =>
  (r === 90 || r === 270 ? { w: h, h: w } : { w, h });

export function moveCrop(box: CropBox, dx: number, dy: number): CropBox {
  return { ...box, x: Math.min(1 - box.w, Math.max(0, box.x + dx)), y: Math.min(1 - box.h, Math.max(0, box.y + dy)) };
}

// Drag a corner by (dx, dy), the opposite corner staying put. `ratio` keeps the box's shape
// (its width over its height, in fractions of the photo); null is free.
export function resizeCrop(box: CropBox, handle: CropHandle, dx: number, dy: number, ratio: number | null): CropBox {
  if (handle === 'move') return moveCrop(box, dx, dy);
  const left = handle === 'nw' || handle === 'sw';
  const top = handle === 'nw' || handle === 'ne';
  const ax = left ? box.x + box.w : box.x;
  const ay = top ? box.y + box.h : box.y;
  const px = clamp01((left ? box.x : box.x + box.w) + dx);
  const py = clamp01((top ? box.y : box.y + box.h) + dy);
  const maxW = left ? ax : 1 - ax;
  const maxH = top ? ay : 1 - ay;
  let w = Math.min(maxW, Math.max(MIN_CROP, left ? ax - px : px - ax));
  let h = Math.min(maxH, Math.max(MIN_CROP, top ? ay - py : py - ay));
  if (ratio) {
    if (w / h > ratio) w = h * ratio;
    else h = w / ratio;
    if (w > maxW) {
      w = maxW;
      h = w / ratio;
    }
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
  }
  return { x: left ? ax - w : ax, y: top ? ay - h : ay, w, h };
}

// The largest centred box of `aspect` (width over height, in pixels) on a photo of photoAspect;
// null: the whole photo.
export function aspectCrop(aspect: number | null, photoAspect: number): CropBox {
  if (!aspect) return FULL_CROP;
  const ratio = aspect / photoAspect;
  const w = ratio >= 1 ? 1 : ratio;
  const h = ratio >= 1 ? 1 / ratio : 1;
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

// The crop box's ratio in fractions for a pixel aspect, as resizeCrop takes it.
export const fractionRatio = (aspect: number | null, photoAspect: number): number | null => (aspect ? aspect / photoAspect : null);

// The photo turned by `rotation` and cut to `box`, as a new canvas.
export function bakeCrop(img: CanvasImageSource, natW: number, natH: number, rotation: Rotation, box: CropBox): HTMLCanvasElement {
  const { w: rw, h: rh } = rotatedSize(natW, natH, rotation);
  const turned = document.createElement('canvas');
  turned.width = rw;
  turned.height = rh;
  const tctx = turned.getContext('2d');
  if (tctx) {
    tctx.translate(rw / 2, rh / 2);
    tctx.rotate((rotation * Math.PI) / 180);
    tctx.drawImage(img, -natW / 2, -natH / 2, natW, natH);
  }
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(box.w * rw));
  out.height = Math.max(1, Math.round(box.h * rh));
  out.getContext('2d')?.drawImage(turned, box.x * rw, box.y * rh, box.w * rw, box.h * rh, 0, 0, out.width, out.height);
  return out;
}
