import type { MemeCaption } from '../../model/memeDocument';
import { canvasToCaption, captionIndexAt, captionTextLayout } from './render/captionTextLayout';

let scratch: HTMLCanvasElement | null = null;

// A 2D context to measure caption text on (the image editor's caret, highlight and taps), or null
// where there's no canvas (tests without one).
export function scratchCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  scratch = scratch || document.createElement('canvas');
  const ctx = scratch.getContext('2d');
  return ctx && typeof ctx.measureText === 'function' ? ctx : null;
}

// The place in a caption's text nearest a tap at (x, y) canvas pixels, for a caption centred at
// centerY on `canvas` (as paintCaption draws it); null for a card.
export function captionIndexAtPoint(caption: MemeCaption, canvas: { width: number }, centerY: number, x: number, y: number): number | null {
  const ctx = scratchCtx();
  if (!ctx || !canvas.width) return null;
  const layout = captionTextLayout(ctx, caption, canvas.width);
  const local = canvasToCaption(x, y, (caption.x ?? 0.5) * canvas.width, centerY, caption.rotation || 0);
  return captionIndexAt(ctx, caption, layout, local.x, local.y);
}
