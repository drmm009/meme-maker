// Branding for a video: a watermark (a small handle in a corner for the whole video) and an end
// card (a full-frame picture with a title and a line under it, played after everything else).
// The watermark is a project setting, drawn as a text clip that isn't on the timeline; the end
// card is an ordinary photo clip, marked so it can be redrawn and kept at the end.
import type { Clip, ImageClip, TextClip, WatermarkCorner, WatermarkSettings, EndCardSettings } from '../model/videoProject';

export const STAGE_WIDTH = 800;
export const WATERMARK_ID = '__watermark';
export const WATERMARK_OPACITY = 0.75;
export const END_CARD_MS = 2500;
// The end card picture's width (its height follows the canvas shape).
export const END_CARD_PX = 1280;

export const WATERMARK_CORNERS: { id: WatermarkCorner; label: string }[] = [
  { id: 'tl', label: 'Top left' },
  { id: 'tr', label: 'Top right' },
  { id: 'bl', label: 'Bottom left' },
  { id: 'br', label: 'Bottom right' },
];

export const DEFAULT_END_CARD: EndCardSettings = { title: 'Thanks for watching', subtitle: 'Follow for more', color: '#111111' };

// The watermark as a text clip from 0 to `endMs`, in stage units; null when there's nothing to show.
export function watermarkClip(wm: WatermarkSettings | null | undefined, endMs: number, aspect: number): TextClip | null {
  const text = wm?.text?.trim();
  if (!text || !(endMs > 0)) return null;
  const stageHeight = STAGE_WIDTH / aspect;
  const base = Math.min(STAGE_WIDTH, stageHeight);
  const fontSize = Math.max(16, Math.round(base * 0.05));
  const margin = Math.round(base * 0.04);
  const corner = wm?.corner || 'br';
  return {
    id: WATERMARK_ID,
    type: 'text',
    name: 'Watermark',
    text,
    startMs: 0,
    endMs,
    x: margin,
    // x and y are its box's corner: the text's line plus the caption painter's padding above and below.
    y: corner[0] === 't' ? margin : stageHeight - margin - Math.round(fontSize * 1.2 + 2 * Math.max(10, fontSize * 0.16)),
    width: STAGE_WIDTH - 2 * margin,
    fontSize,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#ffffff',
    // A thin dark edge and a shadow keep white text readable on light backgrounds too.
    stroke: 'rgba(0, 0, 0, 0.55)',
    strokeWidth: fontSize * 0.1,
    shadowSize: Math.round(fontSize * 0.16),
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    align: corner[1] === 'l' ? 'left' : 'right',
    opacity: WATERMARK_OPACITY,
  } as TextClip;
}

// The clips with the watermark on top (it draws last), for the preview and the export.
export const withWatermark = (items: Clip[], wm: WatermarkSettings | null | undefined, endMs: number, aspect: number): Clip[] => {
  const clip = watermarkClip(wm, endMs, aspect);
  return clip ? [...items, clip] : items;
};

export const isEndCard = (item: Clip): item is ImageClip => item.type === 'image' && Boolean((item as ImageClip).endCard);

// Where the end card goes: after every other clip.
export const endCardStart = (items: Clip[]): number => {
  const ends = items.filter((i) => !isEndCard(i)).map((i) => i.endMs).filter((t) => Number.isFinite(t) && t > 0);
  return ends.length ? Math.max(...ends) : 0;
};

// The clips with the end card kept after everything else: when an edit moves where the other
// clips end, a card that was last follows (keeping its length). A card someone moved earlier stays.
export const keepEndCardLast = <T extends Clip>(prev: T[], next: T[]): T[] => {
  const card = next.find(isEndCard);
  if (!card) return next;
  const before = prev.find((i) => i.id === card.id);
  if (before && before.startMs < endCardStart(prev) - 1) return next;
  const startMs = endCardStart(next);
  if (startMs === card.startMs) return next;
  return next.map((i) => (i === card ? { ...i, startMs, endMs: startMs + (card.endMs - card.startMs) } : i));
};

// Black or white, whichever reads better on `hex`.
export const inkFor = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#111111' : '#ffffff';
};

// Splits `text` into lines no wider than `maxWidth` (a word longer than that keeps its own line).
export const wrapLines = (text: string, maxWidth: number, measure: (s: string) => number): string[] => {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
};

// Draws the end card: its colour, the title large and the line under it smaller, centred.
export function drawEndCard(ctx: CanvasRenderingContext2D, w: number, h: number, card: EndCardSettings): void {
  const ink = inkFor(card.color);
  ctx.fillStyle = card.color;
  ctx.fillRect(0, 0, w, h);
  const base = Math.min(w, h);
  const titleSize = Math.round(base * 0.11);
  const subSize = Math.round(base * 0.05);
  const font = (size: number, weight: number) => `${weight} ${size}px Inter, system-ui, sans-serif`;
  ctx.font = font(titleSize, 800);
  const title = wrapLines(card.title.trim(), w * 0.84, (s) => ctx.measureText(s).width);
  ctx.font = font(subSize, 500);
  const sub = wrapLines(card.subtitle.trim(), w * 0.8, (s) => ctx.measureText(s).width);
  const titleLine = titleSize * 1.1;
  const subLine = subSize * 1.35;
  const gap = title.length && sub.length ? subSize * 0.9 : 0;
  let y = (h - (title.length * titleLine + gap + sub.length * subLine)) / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = ink;
  ctx.font = font(titleSize, 800);
  for (const l of title) { ctx.fillText(l, w / 2, y); y += titleLine; }
  y += gap;
  ctx.globalAlpha = 0.75;
  ctx.font = font(subSize, 500);
  for (const l of sub) { ctx.fillText(l, w / 2, y); y += subLine; }
  ctx.globalAlpha = 1;
}

// The end card as a PNG data URL, shaped like the canvas.
export function renderEndCard(card: EndCardSettings, aspect: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = END_CARD_PX;
  canvas.height = Math.round(END_CARD_PX / aspect);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas');
  drawEndCard(ctx, canvas.width, canvas.height, card);
  return canvas.toDataURL('image/png');
}

// The end card clip: full frame, after everything else, for END_CARD_MS.
export const endCardClip = (card: EndCardSettings, url: string, items: Clip[], aspect: number) => {
  const startMs = endCardStart(items);
  return {
    type: 'image' as const,
    url,
    name: 'End card',
    endCard: card,
    startMs,
    endMs: startMs + END_CARD_MS,
    x: 0,
    y: 0,
    width: STAGE_WIDTH,
    height: STAGE_WIDTH / aspect,
    scaleX: 1,
    scaleY: 1,
    isPositioned: true,
  };
};
