import type { MemeCaption } from '../../../model/memeDocument';
import { getCurveSagitta, wrapTextLines } from '../draw/text';
import { applyCaptionFont, captionLineHeight, fittedFontSize, spacedText } from '../draw/captionFont';

// A drawn line of a caption, and where its characters came from in the text it was wrapped from
// (draw/text wrapTextLines).
export interface WrappedLine {
  text: string;
  start: number;
  end: number;
  map: number[];
}

// How a caption's text sits, about the caption's centre (before its turn): the font, the lines and
// the box round them. paintCaption draws from it, and the cursor while typing (captionCaret) is
// found in it, so the two always agree.
export interface CaptionTextLayout {
  fontSize: number;
  align: 'left' | 'center' | 'right';
  // The text as drawn (spacedText: hair spaces for letter spacing where the canvas has none).
  display: string;
  lines: WrappedLine[];
  maxLineWidth: number;
  isBubble: boolean;
  hasBg: boolean;
  padX: number;
  padY: number;
  boxWidth: number;
  boxHeight: number;
  lineHeight: number;
  totalHeight: number;
  // The middle of the first line, and the x every line is aligned on.
  startY: number;
  textAnchorX: number;
}

type CaptionLike = Partial<MemeCaption> & { text?: string };

// Lays out the caption's text on a canvas `canvasWidth` wide, leaving its font set on ctx (with
// middle baseline and its alignment), ready to draw.
export function captionTextLayout(ctx: CanvasRenderingContext2D, cap: CaptionLike, canvasWidth: number): CaptionTextLayout {
  const fontCap = { ...cap, fontFamily: cap.fontFamily || 'Impact, sans-serif', text: cap.text || '' } as MemeCaption;
  const maxWidth = (cap.width || 0.9) * canvasWidth;
  const fontSize = fittedFontSize(ctx, fontCap, maxWidth);
  applyCaptionFont(ctx, fontCap, fontSize);
  const align = (cap.align || 'center') as CaptionTextLayout['align'];
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  const display = spacedText(ctx, cap.text || '', cap, fontSize);
  const lines = wrapTextLines(ctx, display, maxWidth) as WrappedLine[];
  let maxLineWidth = 0;
  for (const line of lines) maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line.text).width);

  // A meme text background (white, black or a colour) or a speech bubble.
  const isBubble = !!cap.bubbleStyle;
  const hasBg = (Boolean(cap.bgColor) && cap.bgColor !== 'transparent' && cap.bgColor !== 'none') || isBubble;
  // The box is sized to the text.
  const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(16, fontSize * 0.25));
  const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(10, fontSize * 0.16));
  let boxWidth = (cap.hasCustomWidth && cap.width)
    ? Math.max(maxLineWidth + padX * 2, cap.width * canvasWidth)
    : (maxLineWidth + padX * 2);
  boxWidth = Math.min(canvasWidth - 16, boxWidth);
  const lineHeight = captionLineHeight(cap, fontSize);
  const totalHeight = lines.length * lineHeight;
  let boxHeight = totalHeight + padY * 2;
  if (cap.curve && Math.abs(cap.curve) > 0) boxHeight += Math.round(getCurveSagitta(maxLineWidth, cap.curve));
  const startY = -((lines.length - 1) * lineHeight) / 2;
  const textAnchorX = align === 'left' ? (-boxWidth / 2 + padX) : (align === 'right' ? (boxWidth / 2 - padX) : 0);

  return { fontSize, align, display, lines, maxLineWidth, isBubble, hasBg, padX, padY, boxWidth, boxHeight, lineHeight, totalHeight, startY, textAnchorX };
}

// Where a text cursor shows, about the caption's centre (before its turn): the middle of the
// cursor's line, its height, and its own tilt in radians (on curved text, the letters' angle).
export interface CaretSpot {
  x: number;
  y: number;
  height: number;
  angle: number;
}

// The line a cursor at `d` (an index in the drawn text) is on, and how many of that line's
// characters come before it. A cursor at a line's end stays on it (where a dropped space was too).
export function caretInLines(lines: WrappedLine[], d: number): { line: number; before: number } {
  if (!lines.length) return { line: 0, before: 0 };
  let line = lines.findIndex((l) => d <= l.end);
  if (line < 0) line = lines.length - 1;
  const { map } = lines[line];
  let before = 0;
  while (before < map.length && map[before] < d) before += 1;
  return { line, before };
}

const isCard = (cap: CaptionLike) => Boolean(cap.isBreakingNews || cap.isTweetCard || cap.isInstagramCard || cap.isWhatsAppCard);

// The cursor for `index` (in the caption's own text) as the caption is laid out (captionTextLayout,
// whose font must still be on ctx), or null for a social card or news chyron (not typed into here).
export function captionCaret(ctx: CanvasRenderingContext2D, cap: CaptionLike, layout: CaptionTextLayout, index: number): CaretSpot | null {
  if (isCard(cap)) return null;
  const text = cap.text || '';
  const c = Math.max(0, Math.min(text.length, index));
  const d = spacedText(ctx, text.slice(0, c), cap, layout.fontSize).length;
  const height = layout.fontSize * 1.1;
  const { lines, lineHeight, startY, textAnchorX, align } = layout;
  const width = (s: string) => ctx.measureText(s).width;
  if (!text || !lines.length) {
    const lone = lines.length ? startY : 0;
    return { x: textAnchorX, y: lone, height, angle: 0 };
  }
  const { line: li, before } = caretInLines(lines, d);
  const line = lines[li];
  const y = startY + li * lineHeight;
  // Spaces typed after the last word aren't drawn, but the cursor moves past them.
  const trailing = li === lines.length - 1 && d > line.end ? (layout.display.slice(line.end, d).match(/ /g) || []).length : 0;
  const prefix = line.text.slice(0, before);

  if (cap.curve && Math.abs(cap.curve) > 0) {
    // As drawCurvedText: each letter on an arc centred on the anchor, turned with the arc.
    const chars = Array.from(line.text);
    const totalW = chars.reduce((sum, ch) => sum + width(ch), 0);
    if (totalW > 0) {
      const dist = Array.from(prefix).reduce((sum, ch) => sum + width(ch), 0) + trailing * width(' ');
      const curve = Math.max(-100, Math.min(100, cap.curve));
      const sign = curve >= 0 ? 1 : -1;
      const spanRad = (Math.abs(curve) / 100) * (Math.PI * 0.72);
      const R = Math.max(10, totalW / spanRad);
      const sagitta = R * (1 - Math.cos(spanRad / 2));
      const phi = (dist / totalW - 0.5) * spanRad;
      return {
        x: textAnchorX + R * Math.sin(phi),
        y: y + sign * (R * (1 - Math.cos(phi)) - sagitta / 2),
        height,
        angle: sign * phi,
      };
    }
  }

  const lineW = width(line.text);
  const left = align === 'left' ? textAnchorX : align === 'right' ? textAnchorX - lineW : textAnchorX - lineW / 2;
  return { x: left + width(prefix) + trailing * width(' '), y, height, angle: 0 };
}

// The cursor in canvas pixels for a caption centred at (cx, cy) and turned `rotation` degrees:
// its middle and its full tilt in degrees.
export function caretOnCanvas(spot: CaretSpot, cx: number, cy: number, rotation = 0): { x: number; y: number; height: number; rotation: number } {
  const r = (rotation * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return {
    x: cx + spot.x * cos - spot.y * sin,
    y: cy + spot.x * sin + spot.y * cos,
    height: spot.height,
    rotation: rotation + (spot.angle * 180) / Math.PI,
  };
}
