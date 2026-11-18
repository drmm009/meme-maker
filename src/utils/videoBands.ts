// The video editor's header and footer bars, as the image editor's Header & footer: a band of colour
// across the top and/or the bottom of the canvas. A bar sits over the clips and photos and under the
// stickers and text, so a caption written on it shows. The preview (CanvasPreview), the WebCodecs
// export (sceneRenderer) and the FFmpeg export (ffmpegExport) all place it with withBands and draw
// it with bandRects. Heights are in the preview's 800-wide stage units.

export interface VideoBand {
  enabled: boolean;
  bgColor: string;
  height: number;
}

export const DEFAULT_VIDEO_BAND: VideoBand = { enabled: false, bgColor: '#000000', height: 120 };

// The bar colours offered (the image editor's band colours).
export const BAND_SWATCHES = ['#000000', '#ffffff', '#6b7280', '#1e293b', '#ff5a36', '#ffd60a', '#34c759', '#0a84ff', '#bf5af2', '#ff375f'];

export const MIN_BAND_HEIGHT = 40;
export const MAX_BAND_HEIGHT = 300;

export const bandsOn = (header?: VideoBand | null, footer?: VideoBand | null): boolean => Boolean(header?.enabled || footer?.enabled);

export interface BandRect {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

// The bars switched on, as rectangles on a canvas `width` x `height` (`unit`: canvas pixels per
// stage unit, for the export's own size). A bar is never taller than half the canvas.
export function bandRects(header: VideoBand | null | undefined, footer: VideoBand | null | undefined, width: number, height: number, unit = 1): BandRect[] {
  const tall = (band: VideoBand) => Math.min(height / 2, Math.max(0, band.height) * unit);
  const rects: BandRect[] = [];
  if (header?.enabled) rects.push({ x: 0, y: 0, width, height: tall(header), fill: header.bgColor });
  if (footer?.enabled) {
    const h = tall(footer);
    rects.push({ x: 0, y: height - h, width, height: h, fill: footer.bgColor });
  }
  return rects;
}

// Marks where the bars go in a draw order.
export const BANDS = 'bands' as const;

// What stays under the bars: clips and photos (not the end card, which closes the video whole).
const underBands = (item: { type?: string; endCard?: unknown }) => (item.type === 'video' || item.type === 'image') && !item.endCard;

// A draw order (bottom to top) with the bars in their place: the clips and photos, the bars, then
// the rest (stickers, text, the end card). Without bars, the order as it is.
export function withBands<T extends { type?: string; endCard?: unknown }>(ordered: T[], on: boolean): (T | typeof BANDS)[] {
  if (!on) return ordered;
  return [...ordered.filter(underBands), BANDS, ...ordered.filter((i) => !underBands(i))];
}

// The bars as a transparent PNG data URL the size of the export (for FFmpeg), or null with none on.
export function bandsImage(header: VideoBand | null | undefined, footer: VideoBand | null | undefined, width: number, height: number, unit: number): string | null {
  const rects = bandRects(header, footer, width, height, unit);
  if (!rects.length || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  for (const r of rects) {
    ctx.fillStyle = r.fill;
    ctx.fillRect(r.x, r.y, r.width, r.height);
  }
  return canvas.toDataURL('image/png');
}

// Where a caption's box goes to sit in the middle of a bar, given the box's size (stage units).
export const centreInBand = (box: { width: number; height: number }, band: { x: number; y: number; width: number; height: number }) => ({
  x: Math.round(band.x + (band.width - box.width) / 2),
  y: Math.round(band.y + (band.height - box.height) / 2),
});
