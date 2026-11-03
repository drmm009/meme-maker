// The Stickers maker (editor mode 'sticker'): a see-through square to build one sticker on, a
// photo added to it cut out with a white die-cut outline, exported as a transparent PNG or WebP.
import type { ExportPrefs } from './export/exportImage';
import { CANVAS_MAX_DIM } from '../canvas/layout/canvasLayout';

// The template's square (WhatsApp's sticker size); the editor draws it at 1080px.
export const STICKER_SIZE = 512;
// A chunky white outline, in canvas pixels.
export const STICKER_OUTLINE = { dieCut: true, dieCutColor: '#ffffff', dieCutWidth: 12 } as const;
// A photo added to the sticker: centred, its longest side about 85% of the square (photo layers are
// drawn fitted into 320px, times their scale, on the 1080px canvas).
export const STICKER_PHOTO = { x: 0.5, y: 0.5, scale: Math.round(((CANVAS_MAX_DIM * 0.85) / 320) * 100) / 100 } as const;

// A fully transparent square PNG (empty when the browser can't draw one, as in tests).
function clearSquare(size: number): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas.toDataURL('image/png') || '';
  } catch {
    return '';
  }
}

// The template the Stickers maker opens on: no picture and no captions, a transparent canvas.
export function makeStickerTemplate() {
  const url = clearSquare(STICKER_SIZE);
  return {
    id: `sticker-${Date.now()}`,
    name: 'Sticker',
    imageUrl: url,
    rawImageUrl: url,
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    aspectRatio: 1,
    category: 'custom',
    canvasBgColor: 'transparent',
    defaultCaptions: [],
    editorMode: 'sticker' as const,
  };
}

// A sticker exports see-through at WhatsApp's 512px: PNG unless WebP was picked (JPG, GIF and MP4
// have no transparency or don't suit a still sticker).
export const stickerExportPrefs = (prefs: ExportPrefs): ExportPrefs => ({
  ...prefs,
  format: prefs.format === 'webp' ? 'webp' : 'png',
  transparent: true,
  width: STICKER_SIZE,
});
