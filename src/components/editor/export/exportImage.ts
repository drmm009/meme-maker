// Rendering the finished meme to a file: format, quality and size. The source is the clean canvas
// (no selection handles); smaller sizes are scaled down from it.
import { dataURLToBlob } from '../../../utils/galleryStore';

export type ExportFormat = 'png' | 'jpeg' | 'webp';
// 'full' keeps the canvas size; a number is the width in pixels (never larger than the canvas).
export type ExportWidth = 'full' | 720 | 480;

export interface ExportPrefs {
  format: ExportFormat;
  // 0.5..1, for JPG and WebP.
  quality: number;
  width: ExportWidth;
}

export const DEFAULT_EXPORT_PREFS: ExportPrefs = { format: 'png', quality: 0.9, width: 'full' };

export const MIME: Record<ExportFormat, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
const EXTENSION: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

// The output size for a canvas of w x h at the chosen width (aspect kept, never upscaled).
export function outputSize(w: number, h: number, width: ExportWidth): { w: number; h: number } {
  if (width === 'full' || width >= w) return { w, h };
  return { w: width, h: Math.max(1, Math.round((h * width) / w)) };
}

export const fileNameFor = (base: string, mime: string) => `${base}-${Date.now()}.${EXTENSION[mime] || 'png'}`;

export const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`);

interface CanvasLike {
  width: number;
  height: number;
  toBlob?: (cb: (blob: Blob | null) => void, type?: string, quality?: number) => void;
  toDataURL: (type?: string, quality?: number) => string;
}

// The meme as a file. JPG has no transparency, so it is painted over white. A browser that can't
// write the format (WebP on older Safari) hands back a PNG; the blob's type says which it is.
export async function renderExport(source: CanvasLike, prefs: ExportPrefs): Promise<Blob> {
  const { w, h } = outputSize(source.width, source.height, prefs.width);
  let out: CanvasLike = source;
  if (w !== source.width || prefs.format === 'jpeg') {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (prefs.format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source as unknown as CanvasImageSource, 0, 0, w, h);
      out = canvas;
    }
  }
  const mime = MIME[prefs.format];
  const quality = prefs.format === 'png' ? undefined : prefs.quality;
  if (!out.toBlob) return dataURLToBlob(out.toDataURL(mime, quality));
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob!(resolve, mime, quality));
  return blob || dataURLToBlob(out.toDataURL(mime, quality));
}
