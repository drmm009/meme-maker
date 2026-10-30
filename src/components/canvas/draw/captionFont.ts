import type { MemeCaption } from '../../../model/memeDocument';
import { wrapText } from './text';

type FontProps = Pick<MemeCaption, 'bold' | 'italic' | 'fontFamily' | 'letterSpacing'>;

// The canvas font for a caption. Captions are bold unless `bold` is false; measuring, hit testing
// and drawing all use this so a caption's box always fits its text.
export const captionFont = (
  cap: Pick<MemeCaption, 'bold' | 'italic' | 'fontFamily'>,
  fontSize: number,
  fallbackFamily = 'Impact, sans-serif'
): string => `${cap.italic ? 'italic ' : ''}${cap.bold === false ? 'normal' : 'bold'} ${fontSize}px ${cap.fontFamily || fallbackFamily}`;

// Sets the caption's font and letter spacing (`letterSpacing` is a fraction of the font size) on
// ctx. Browsers without canvas letter spacing simply draw it unspaced.
export function applyCaptionFont(ctx: CanvasRenderingContext2D, cap: FontProps, fontSize: number, fallbackFamily?: string): void {
  ctx.font = captionFont(cap, fontSize, fallbackFamily);
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round((cap.letterSpacing || 0) * fontSize * 10) / 10}px`;
}

// The smallest size shrink-to-fit goes down to.
export const MIN_FIT_SIZE = 12;

type FitProps = FontProps & Pick<MemeCaption, 'fontSize' | 'text' | 'autoFit' | 'maxLines'>;

// The size a caption is drawn at: its own, or with shrink-to-fit (`autoFit`) the largest size up
// to its own at which the text wraps into at most `maxLines` lines (2 when unset) inside maxWidth
// without breaking a word. Painting, hit boxes and band heights all use it.
export function fittedFontSize(ctx: CanvasRenderingContext2D | null, cap: FitProps, maxWidth: number, fallbackFamily?: string): number {
  const base = cap.fontSize || 50;
  if (!cap.autoFit || !ctx || typeof ctx.measureText !== 'function' || !cap.text) return base;
  const maxLines = cap.maxLines || 2;
  const words = cap.text.split(/\s+/).filter(Boolean);
  for (let size = base; size > MIN_FIT_SIZE; size -= Math.max(1, Math.round(size * 0.06))) {
    applyCaptionFont(ctx, cap, size, fallbackFamily);
    const fits = wrapText(ctx, cap.text, maxWidth).length <= maxLines && words.every((w) => ctx.measureText(w).width <= maxWidth);
    if (fits) return size;
  }
  return MIN_FIT_SIZE;
}

// The distance between a caption's lines (`lineHeight` is a multiple of the font size).
export const captionLineHeight = (cap: Pick<MemeCaption, 'lineHeight'>, fontSize: number): number => fontSize * (cap.lineHeight || 1.2);

// A gradient fill across a line of `width`, centred on x = 0, or null for a plain colour.
export function captionGradient(ctx: CanvasRenderingContext2D, cap: Pick<MemeCaption, 'gradient'>, width: number): CanvasGradient | null {
  const g = cap.gradient;
  if (!g || g.length < 2 || typeof ctx.createLinearGradient !== 'function') return null;
  const fill = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  if (!fill) return null;
  fill.addColorStop(0, g[0]);
  fill.addColorStop(1, g[1]);
  return fill;
}

// Where a line's underline sits: from x for width, at y (the line's middle) plus this much, this thick.
export const underlineMetrics = (fontSize: number) => ({
  offset: fontSize * 0.42,
  thickness: Math.max(2, fontSize / 14),
});
