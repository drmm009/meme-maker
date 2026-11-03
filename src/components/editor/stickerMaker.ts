// The Stickers maker (editor mode 'sticker'): a see-through square to build one sticker on, a
// photo added to it cut out in a sticker style (a die-cut outline, by default white), exported as a transparent PNG or WebP.
import type { ExportPrefs } from './export/exportImage';
import { CANVAS_MAX_DIM } from '../canvas/layout/canvasLayout';
import { PHOTO_FILTERS } from '../../data/photoFilters';

// The template's square (WhatsApp's sticker size); the editor draws it at 1080px.
export const STICKER_SIZE = 512;
// A chunky white outline, in canvas pixels.
export const STICKER_OUTLINE = { dieCut: true, dieCutColor: '#ffffff', dieCutWidth: 12 } as const;
// The die-cut outline colours the Die-cut sheet offers.
export const DIECUT_COLORS = ['#ffffff', '#000000', '#ffd60a', '#ff5a36', '#34c759', '#0a84ff', '#bf5af2', '#ff375f'];
const VINTAGE = PHOTO_FILTERS.find((f: { id: string }) => f.id === 'vintage');

// The looks a sticker can be cut in, picked on the sticker page before Generate: the cut-out
// photo layer's outline (die-cut colour and width), shadow and filter.
export const STICKER_STYLES = [
  { id: 'classic', label: 'Classic', look: STICKER_OUTLINE },
  { id: 'bold', label: 'Bold', look: { dieCut: true, dieCutColor: '#ffffff', dieCutWidth: 24 } },
  { id: 'comic', label: 'Comic', look: { dieCut: true, dieCutColor: '#000000', dieCutWidth: 9 } },
  { id: 'pop', label: 'Pop', look: { dieCut: true, dieCutColor: '#ffd60a', dieCutWidth: 14 } },
  { id: 'clean', label: 'Clean', look: { dieCut: false, shadowSize: 28, shadowColor: 'rgba(0, 0, 0, 0.45)' } },
  { id: 'retro', label: 'Retro', look: { dieCut: true, dieCutColor: '#fff1d6', dieCutWidth: 12, ...(VINTAGE && { filterId: VINTAGE.id, filter: VINTAGE.filterString, filters: VINTAGE.values }) } },
] as const;
// A style's look; Classic for one this app doesn't know.
export const stickerStyleLook = (id: string): object => (STICKER_STYLES.find((s) => s.id === id) ?? STICKER_STYLES[0]).look;

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
