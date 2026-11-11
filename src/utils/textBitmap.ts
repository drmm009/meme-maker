// A video text clip drawn by the image editor's caption painter (canvas/render/paintCaption), so
// text looks the same in both editors: font, format, effects, curve, gradient, outline, shadow,
// box and bubble. Each look is drawn once into a picture and kept (the preview, the export and
// the typewriter's steps reuse it); Konva only places, moves and animates that picture.
//
// A clip's x and y (800-wide stage units) are the top-left of its box (the caption's box, padding
// included); it turns about that corner. Sizes on the clip are in stage units too.
import { paintCaption } from '../components/canvas/render/paintCaption';
import { wrapText } from '../components/canvas/draw/text';
import { applyCaptionFont, fittedFontSize } from '../components/canvas/draw/captionFont';
import { captionCaret, captionIndexAt, captionSelectionBoxes, captionTextLayout } from '../components/canvas/render/captionTextLayout';
import type { MemeCaption } from '../model/memeDocument';
import type { TextClip } from '../model/videoProject';
import type { TextFrame } from './textAnimation';

export const STAGE_WIDTH = 800;
// Wrap width when a clip has none of its own: as the image editor's captions, 90% of the canvas.
const DEFAULT_WRAP = 0.9;
const MAX_CACHED = 160;

export const DEFAULT_TEXT_LOOK = { fontFamily: 'Impact, sans-serif', color: '#ffffff', stroke: '#000000' } as const;

// The image editor's caption for a clip, in pixels of a canvas `scale` times the stage. Opacity
// and rotation stay with Konva (the clip's group), so they're left out here.
export function captionOf(item: Partial<TextClip>, scale: number, text = item.text ?? ''): MemeCaption {
  const s = (v: number | undefined) => (typeof v === 'number' ? v * scale : v);
  return {
    id: item.id || 'text',
    text,
    x: 0.5,
    y: 0.5,
    fontSize: (item.fontSize || 32) * scale,
    fontFamily: item.fontFamily || DEFAULT_TEXT_LOOK.fontFamily,
    color: item.color || DEFAULT_TEXT_LOOK.color,
    stroke: item.stroke,
    strokeWidth: s(item.strokeWidth),
    align: item.align || 'center',
    width: item.width ? Math.min(1, item.width / STAGE_WIDTH) : DEFAULT_WRAP,
    hasCustomWidth: Boolean(item.width),
    bgColor: item.bgColor,
    bgStyle: item.bgStyle === 'banner' ? 'box' : item.bgStyle,
    bubbleStyle: item.bubbleStyle,
    curve: item.curve,
    effect: item.effect,
    bold: item.bold,
    italic: item.italic,
    underline: item.underline,
    letterSpacing: item.letterSpacing,
    lineHeight: item.lineHeight,
    shadowSize: s(item.shadowSize),
    shadowColor: item.shadowColor,
    gradient: item.gradient,
  };
}

export interface TextBitmap {
  canvas: HTMLCanvasElement;
  // The picture's size and where the box's top-left sits in it, in stage units.
  width: number;
  height: number;
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
}

// Fonts: a picture drawn before its web font arrived would keep the fallback, so pictures are
// keyed by how many font loads the page has seen, and listeners redraw when one lands.
let fontEpoch = 0;
const fontListeners = new Set<() => void>();
let watching = false;
const watchFonts = () => {
  if (watching || typeof document === 'undefined' || !document.fonts?.addEventListener) return;
  watching = true;
  document.fonts.addEventListener('loadingdone', refreshTextFonts);
};
// Also for fonts added to the page already loaded (uploaded ones), which fire no 'loadingdone'.
export function refreshTextFonts(): void {
  fontEpoch += 1;
  cache.clear();
  fontListeners.forEach((f) => f());
}
export const onTextFontsLoaded = (listener: () => void): (() => void) => {
  watchFonts();
  fontListeners.add(listener);
  return () => { fontListeners.delete(listener); };
};

// Waits for the clips' fonts, so an export never draws a fallback.
export async function loadTextFonts(items: Partial<TextClip>[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  const families = new Set(items.map((i) => i.fontFamily || DEFAULT_TEXT_LOOK.fontFamily));
  await Promise.all([...families].map((f) => document.fonts.load(`bold 48px ${f}`).catch(() => [])));
  await document.fonts.ready;
}

const cache = new Map<string, TextBitmap>();
let scratch: HTMLCanvasElement | null = null;

// The clip drawn at `scale` (picture pixels per stage unit), showing its first `chars` characters
// (the typewriter) in the box the whole text takes.
export function textBitmap(item: Partial<TextClip>, scale: number, chars = Infinity): TextBitmap {
  // A typed part breaks its lines where the whole text does, so words don't jump between lines.
  const typing = Number.isFinite(chars);
  const full = typing ? wrappedText(item, scale) : item.text ?? '';
  const shown = typing ? full.slice(0, Math.max(0, visibleIndex(full, chars))) : full;
  if (typing && shown === full) return textBitmap(item, scale);
  const key = JSON.stringify([captionOf(item, 1, item.text ?? ''), shown, typing, scale, fontEpoch]);
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  // A typed part keeps the whole text's box, so the box doesn't grow as letters appear.
  const whole = typing ? textBitmap(item, scale) : null;
  const bitmap = draw(item, scale, shown, whole);
  cache.set(key, bitmap);
  if (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value as string);
  return bitmap;
}

// The clip's text with a line break wherever the painter wraps it.
function wrappedText(item: Partial<TextClip>, scale: number): string {
  scratch = scratch || document.createElement('canvas');
  const ctx = scratch.getContext('2d') as CanvasRenderingContext2D;
  const cap = captionOf(item, scale);
  const maxWidth = (cap.width ?? DEFAULT_WRAP) * STAGE_WIDTH * scale;
  applyCaptionFont(ctx, cap, fittedFontSize(ctx, cap, maxWidth));
  return (wrapText(ctx, cap.text, maxWidth) as string[]).join('\n');
}

// Where the first `chars` characters end (the typewriter counts every character but line breaks).
const visibleIndex = (text: string, chars: number) => {
  let seen = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '\n') seen += 1;
    if (seen > chars) return i;
  }
  return text.length;
};

function draw(item: Partial<TextClip>, scale: number, text: string, whole: TextBitmap | null): TextBitmap {
  const width = Math.ceil(STAGE_WIDTH * scale);
  const fontSize = (item.fontSize || 32) * scale;
  // Room for the shadow, the outline and the effects past the box.
  const margin = Math.ceil(fontSize * 0.5 + ((item.shadowSize || 0) * 2 + (item.strokeWidth || fontSize / scale / 7)) * scale + 6);
  const height = Math.ceil(Math.max(width, fontSize * 12));
  scratch = scratch || document.createElement('canvas');
  if (scratch.width !== width || scratch.height < height) {
    scratch.width = width;
    scratch.height = height;
  }
  const ctx = scratch.getContext('2d') as CanvasRenderingContext2D;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, scratch.width, scratch.height);
  const cap = captionOf(item, scale, text);
  if (whole) Object.assign(cap, { width: whole.boxWidth / STAGE_WIDTH, hasCustomWidth: true });
  let box = { x: width / 2, y: height / 2, w: 0, h: 0 };
  paintCaption({
    activeLayerId: null,
    canvas: scratch,
    dragTarget: { current: null },
    getCaptionCenterY: () => height / 2,
    isDragging: { current: false },
    isDrawingMode: false,
    layer: cap,
    reportActiveBox: null,
    reportBox: (_id: string, b: { x: number; y: number; w: number; h: number }) => { box = b; },
    setActiveHandleDrawer: () => {},
    targetCtx: ctx,
  });
  // A typed part sits where it does in the whole text's box (top-left of the same box).
  const boxW = whole ? whole.boxWidth * scale : box.w;
  const boxH = whole ? whole.boxHeight * scale : box.h;
  const left = Math.max(0, Math.floor(box.x - boxW / 2 - margin));
  const top = Math.max(0, Math.floor(box.y - box.h / 2 - margin));
  const right = Math.min(width, Math.ceil(box.x + boxW / 2 + margin));
  const bottom = Math.min(scratch.height, Math.ceil(box.y - box.h / 2 + boxH + margin));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, right - left);
  canvas.height = Math.max(1, bottom - top);
  canvas.getContext('2d')?.drawImage(scratch, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return {
    canvas,
    width: canvas.width / scale,
    height: canvas.height / scale,
    boxX: (box.x - boxW / 2 - left) / scale,
    boxY: (box.y - box.h / 2 - top) / scale,
    boxWidth: boxW / scale,
    boxHeight: boxH / scale,
  };
}

// The text cursor at `index` in the clip's text, as the clip is drawn at `scale`: its middle in
// stage units from the top-left of the clip's box (before the clip turns), its height, and its own
// tilt in degrees (on curved text). Null where there's no cursor (a card).
function textLayoutOf(item: Partial<TextClip>, scale: number) {
  scratch = scratch || document.createElement('canvas');
  const ctx = scratch.getContext('2d') as CanvasRenderingContext2D;
  const cap = captionOf(item, scale);
  // On a canvas as wide as the picture draw() paints on, so the lines wrap the same.
  const layout = captionTextLayout(ctx, cap, Math.ceil(STAGE_WIDTH * scale));
  return { ctx, cap, layout };
}

export function textCaret(item: Partial<TextClip>, scale: number, index: number): { x: number; y: number; height: number; rotation: number } | null {
  const { ctx, cap, layout } = textLayoutOf(item, scale);
  const spot = captionCaret(ctx, cap, layout, index);
  if (!spot) return null;
  return {
    x: (layout.boxWidth / 2 + spot.x) / scale,
    y: (layout.boxHeight / 2 + spot.y) / scale,
    height: spot.height / scale,
    rotation: (spot.angle * 180) / Math.PI,
  };
}

// The place in a clip's text nearest a tap at (u, v) stage units from its box's top-left (before
// the clip turns), or null for a card.
export function textIndexAt(item: Partial<TextClip>, scale: number, u: number, v: number): number | null {
  const { ctx, cap, layout } = textLayoutOf(item, scale);
  return captionIndexAt(ctx, cap, layout, u * scale - layout.boxWidth / 2, v * scale - layout.boxHeight / 2);
}

// The highlight behind the selected letters, as boxes from the box's top-left in stage units (as
// textCaret), each with its own turn in degrees.
export function textSelectionBoxes(item: Partial<TextClip>, scale: number, start: number, end: number): { x: number; y: number; width: number; height: number; rotation: number }[] {
  const { ctx, cap, layout } = textLayoutOf(item, scale);
  return captionSelectionBoxes(ctx, cap, layout, start, end).map((box) => ({
    x: (layout.boxWidth / 2 + box.x) / scale,
    y: (layout.boxHeight / 2 + box.y) / scale,
    width: box.width / scale,
    height: box.height / scale,
    rotation: (box.angle * 180) / Math.PI,
  }));
}

// Konva.Image attributes for a clip's picture: placed so the box's top-left is at (x, y), turning
// about it.
export const textImageAttrs = (item: Partial<TextClip>, bitmap: TextBitmap) => ({
  image: bitmap.canvas,
  x: item.x ?? 50,
  y: item.y ?? 50,
  width: bitmap.width,
  height: bitmap.height,
  offsetX: bitmap.boxX,
  offsetY: bitmap.boxY,
  rotation: item.rotation || 0,
});

// Konva nodes, typed loosely so this module doesn't import Konva.
interface GroupLike {
  setAttrs(attrs: { offsetX: number; offsetY: number; x: number; y: number; scaleX: number; scaleY: number; opacity: number }): unknown;
}
interface PointLike {
  x(): number;
  y(): number;
}

// An animation frame on the group holding the clip's picture: scale and fade about the box's
// centre (before turning, as the text always has) and the shake offset. The typewriter's
// characters are the picture itself (textBitmap's chars).
export const applyTextFrame = (group: GroupLike, bitmap: Pick<TextBitmap, 'boxWidth' | 'boxHeight'>, node: PointLike, frame: Readonly<TextFrame>): void => {
  const px = node.x() + bitmap.boxWidth / 2;
  const py = node.y() + bitmap.boxHeight / 2;
  group.setAttrs({
    offsetX: px, offsetY: py,
    x: px + frame.dx, y: py + frame.dy,
    scaleX: frame.scale, scaleY: frame.scale,
    opacity: frame.opacity,
  });
};

// The clip drawn straight onto a canvas whose pixels are `scale` per stage unit (an export still):
// the same placing and animation frame as the preview's Konva image and group.
export function drawTextClip(ctx: CanvasRenderingContext2D, item: Partial<TextClip>, scale: number, frame: Readonly<TextFrame>, opacity = 1): void {
  const whole = textBitmap(item, scale);
  const shown = Number.isFinite(frame.chars) ? textBitmap(item, scale, frame.chars) : whole;
  const x = item.x ?? 50;
  const y = item.y ?? 50;
  const px = x + whole.boxWidth / 2;
  const py = y + whole.boxHeight / 2;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.globalAlpha = opacity * frame.opacity;
  ctx.translate(px + frame.dx, py + frame.dy);
  ctx.scale(frame.scale, frame.scale);
  ctx.translate(x - px, y - py);
  ctx.rotate(((item.rotation || 0) * Math.PI) / 180);
  ctx.drawImage(shown.canvas, -shown.boxX, -shown.boxY, shown.width, shown.height);
  ctx.restore();
}

// A resize by the corner handles (scale `k`): the text, its outline, shadow and wrap grow together.
export const scaleTextLook = (item: Partial<TextClip>, k: number): Partial<TextClip> => ({
  fontSize: Math.max(10, (item.fontSize || 32) * k),
  ...(item.width ? { width: item.width * k } : {}),
  ...(item.strokeWidth ? { strokeWidth: item.strokeWidth * k } : {}),
  ...(item.shadowSize ? { shadowSize: item.shadowSize * k } : {}),
});
