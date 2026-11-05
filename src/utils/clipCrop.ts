// A clip's crop: the part of its source frame it shows, as fractions (0..1) of that frame, so it
// fits whatever is drawn (the video, a green-screen or filter canvas, a GIF frame, a photo).
// The clip's width and height are the size of the cropped part on the canvas.
import type { ClipCrop, Placed } from '../model/videoProject';

export const FULL_CROP: Readonly<ClipCrop> = Object.freeze({ x: 0, y: 0, width: 1, height: 1 });
// The smallest crop side, as a fraction of the frame.
export const MIN_CROP = 0.05;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// A clip's crop, kept inside the frame; the full frame when it has none.
export const clipCrop = (item: { crop?: ClipCrop | null }): ClipCrop => {
  const c = item.crop;
  if (!c || ![c.x, c.y, c.width, c.height].every(Number.isFinite)) return FULL_CROP;
  const width = clamp(c.width, MIN_CROP, 1);
  const height = clamp(c.height, MIN_CROP, 1);
  return { x: clamp(c.x, 0, 1 - width), y: clamp(c.y, 0, 1 - height), width, height };
};

export const isCropped = (crop: ClipCrop): boolean =>
  crop.x > 0.0005 || crop.y > 0.0005 || crop.width < 0.9995 || crop.height < 0.9995;

// The source rectangle (in the source's pixels) Konva draws: the crop, zoomed into its centre by a
// zoom-punch. Null when that is the whole frame.
export const sourceRect = (
  iw: number,
  ih: number,
  crop: ClipCrop,
  zoom = 1,
): { x: number; y: number; width: number; height: number } | null => {
  if (!iw || !ih || (!isCropped(crop) && zoom <= 1.0001)) return null;
  const z = Math.max(1, zoom);
  const width = (crop.width * iw) / z;
  const height = (crop.height * ih) / z;
  return {
    x: crop.x * iw + (crop.width * iw - width) / 2,
    y: crop.y * ih + (crop.height * ih - height) / 2,
    width,
    height,
  };
};

// The biggest crop of `aspect` (width / height, in the source's pixels) centred in a w x h frame.
export const aspectCrop = (aspect: number, w: number, h: number): ClipCrop => {
  if (!(aspect > 0) || !w || !h) return { ...FULL_CROP };
  const frame = w / h;
  return aspect > frame
    ? { x: 0, y: (1 - frame / aspect) / 2, width: 1, height: frame / aspect }
    : { x: (1 - aspect / frame) / 2, y: 0, width: aspect / frame, height: 1 };
};

// The crop box moved by (dx, dy), kept inside the frame.
export const moveCrop = (crop: ClipCrop, dx: number, dy: number): ClipCrop => ({
  ...crop,
  x: clamp(crop.x + dx, 0, 1 - crop.width),
  y: clamp(crop.y + dy, 0, 1 - crop.height),
});

export type Corner = 'nw' | 'ne' | 'sw' | 'se';

// The crop box with one corner dragged by (dx, dy), the opposite corner staying put. With `aspect`
// (width / height in fractions of the frame) the box keeps its shape, sized by the wider drag.
export const resizeCrop = (crop: ClipCrop, corner: Corner, dx: number, dy: number, aspect: number | null = null): ClipCrop => {
  const west = corner === 'nw' || corner === 'sw';
  const north = corner === 'nw' || corner === 'ne';
  // The fixed corner, and how far the box may reach from it.
  const fx = west ? crop.x + crop.width : crop.x;
  const fy = north ? crop.y + crop.height : crop.y;
  const roomX = west ? fx : 1 - fx;
  const roomY = north ? fy : 1 - fy;
  let width = clamp(crop.width + (west ? -dx : dx), MIN_CROP, roomX);
  let height = clamp(crop.height + (north ? -dy : dy), MIN_CROP, roomY);
  if (aspect) {
    width = Math.max(width, height * aspect);
    width = Math.min(width, roomX, roomY * aspect);
    width = Math.max(width, MIN_CROP, MIN_CROP * aspect);
    height = width / aspect;
  }
  return { x: west ? fx - width : fx, y: north ? fy - height : fy, width, height };
};

// What changing a clip's crop saves: the new crop (null for the whole frame), and a size and
// position that keep the part it still shows where it was on the canvas, at the same scale.
export const applyCrop = (
  item: Placed & { crop?: ClipCrop | null },
  next: ClipCrop,
): Pick<Placed, 'x' | 'y' | 'width' | 'height'> & { crop: ClipCrop | null } => {
  const before = clipCrop(item);
  const crop = clipCrop({ crop: next });
  const width0 = item.width || 200;
  const height0 = item.height || 200;
  // Canvas units per fraction of the frame (before the clip's own scale).
  const kx = width0 / before.width;
  const ky = height0 / before.height;
  // The new top-left corner, from the old one, in the clip's turned and scaled frame.
  const dx = (crop.x - before.x) * kx * (item.scaleX || 1);
  const dy = (crop.y - before.y) * ky * (item.scaleY || 1);
  const rad = ((item.rotation || 0) * Math.PI) / 180;
  return {
    crop: isCropped(crop) ? crop : null,
    x: (item.x || 0) + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: (item.y || 0) + dx * Math.sin(rad) + dy * Math.cos(rad),
    width: crop.width * kx,
    height: crop.height * ky,
  };
};

// FFmpeg's crop of a clip's frame, before it is scaled to size ('' for the whole frame).
export const cropFilter = (item: { crop?: ClipCrop | null }): string => {
  const c = clipCrop(item);
  if (!isCropped(c)) return '';
  const f = (v: number) => Number(v.toFixed(4));
  return `crop=w=iw*${f(c.width)}:h=ih*${f(c.height)}:x=iw*${f(c.x)}:y=ih*${f(c.y)},`;
};
