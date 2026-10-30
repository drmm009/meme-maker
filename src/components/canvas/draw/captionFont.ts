import type { MemeCaption } from '../../../model/memeDocument';
import { wrapText } from './text';

type FontProps = Pick<MemeCaption, 'bold' | 'italic' | 'fontFamily' | 'letterSpacing'>;

// Bold Hindi (Devanagari) and Gujarati fonts, for letters a Latin font doesn't have.
export const INDIC_FALLBACK = '"Mukta", "Baloo Bhai 2"';
const GENERIC = /^(sans-serif|serif|cursive|monospace|fantasy|system-ui)$/i;

// A font list with the Indic fonts tried before the generic family, so Hindi or Gujarati typed in
// Impact (say) comes out bold rather than in the phone's plain fallback.
export function withIndicFallback(family: string): string {
  const parts = family.split(',').map((p) => p.trim()).filter(Boolean);
  const generic = parts.findIndex((p) => GENERIC.test(p));
  const at = generic === -1 ? parts.length : generic;
  return [...parts.slice(0, at), INDIC_FALLBACK, ...parts.slice(at)].join(', ');
}

// The canvas font for a caption. Captions are bold unless `bold` is false; measuring, hit testing
// and drawing all use this so a caption's box always fits its text.
export const captionFont = (
  cap: Pick<MemeCaption, 'bold' | 'italic' | 'fontFamily'>,
  fontSize: number,
  fallbackFamily = 'Impact, sans-serif'
): string => `${cap.italic ? 'italic ' : ''}${cap.bold === false ? 'normal' : 'bold'} ${fontSize}px ${withIndicFallback(cap.fontFamily || fallbackFamily)}`;

const INDIC_TEXT = /[ऀ-ॿ઀-૿]/;
let indicRequested = false;

// A canvas doesn't make the page download a web font, so the first time a caption has Hindi or
// Gujarati letters the fallback fonts are asked for, and the meme redrawn once they arrive.
export function ensureIndicFonts(text: string | undefined, redraw: () => void): void {
  if (indicRequested || !text || !INDIC_TEXT.test(text) || typeof document === 'undefined' || !document.fonts?.load) return;
  indicRequested = true;
  Promise.all([document.fonts.load('bold 48px Mukta', 'अ'), document.fonts.load('bold 48px "Baloo Bhai 2"', 'અ')])
    .then(redraw)
    .catch(() => {});
}

// Sets the caption's font and letter spacing (`letterSpacing` is a fraction of the font size) on
// ctx. Browsers without canvas letter spacing (Safari) get it from spacedText instead.
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
  for (let size = base; size > MIN_FIT_SIZE; size -= Math.max(1, Math.round(size * 0.06))) {
    applyCaptionFont(ctx, cap, size, fallbackFamily);
    const text = spacedText(ctx, cap.text, cap, size);
    const fits = wrapText(ctx, text, maxWidth).length <= maxLines && text.split(/[ \n]+/).filter(Boolean).every((w) => ctx.measureText(w).width <= maxWidth);
    if (fits) return size;
  }
  return MIN_FIT_SIZE;
}

const HAIR_SPACE = '\u200A';

// The caption's text as it is measured and drawn. Where the canvas can't space letters (Safari),
// positive spacing is made of hair spaces between the letters (as many as make up the gap at the
// current font), so wrapping, measuring and drawing all see the same spaced text. Tighter-than-
// normal spacing can't be done that way and is left out.
export function spacedText(ctx: CanvasRenderingContext2D | null, text: string, cap: Pick<MemeCaption, 'letterSpacing'>, fontSize: number): string {
  const spacing = (cap.letterSpacing || 0) * fontSize;
  if (!ctx || !text || spacing <= 0 || 'letterSpacing' in (ctx as object) || typeof ctx.measureText !== 'function') return text;
  const hair = ctx.measureText(HAIR_SPACE).width;
  const count = hair > 0 ? Math.round(spacing / hair) : 0;
  if (!count) return text;
  const gap = HAIR_SPACE.repeat(count);
  // Not around line breaks (a hair space beside a space is fine: wrapping only splits on spaces).
  return Array.from(text).reduce((out, ch, i, all) => (i && ch !== '\n' && all[i - 1] !== '\n' ? out + gap + ch : out + ch), '');
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
