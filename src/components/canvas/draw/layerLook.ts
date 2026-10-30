// How a photo or sticker sits on the meme beyond its picture: blend mode, drop shadow, rounded
// corners and border (photos). Shared by the painters and the Media sheet.

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'difference';

// The shadow colours offered for a photo or sticker.
export const SHADOW_COLORS = ['#000000', '#1e1b4b', '#7f1d1d', '#ffffff', '#ff2a5f', '#00f0ff'];

export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'difference', label: 'Difference' },
];

export interface LayerLook {
  blend?: BlendMode;
  // Drop shadow blur in canvas pixels (0 or unset: none), and its colour.
  shadowSize?: number;
  shadowColor?: string;
  // Photos: corner rounding, 0 (square) .. 1 (the short side fully round).
  cornerRadius?: number;
  // Photos: a border this many canvas pixels wide, outside the picture.
  borderWidth?: number;
  borderColor?: string;
}

export const compositeFor = (look: LayerLook): GlobalCompositeOperation =>
  (look.blend && look.blend !== 'normal' ? look.blend : 'source-over') as GlobalCompositeOperation;

// The shadow falls a little down from the layer, as light from above would cast it.
export function applyShadow(ctx: CanvasRenderingContext2D, look: LayerLook): void {
  const size = look.shadowSize || 0;
  if (size <= 0) return;
  ctx.shadowColor = look.shadowColor || 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = size;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(size * 0.35);
}

// The corner radius in pixels for a w x h box.
export const cornerPx = (look: LayerLook, w: number, h: number): number =>
  (Math.min(w, h) / 2) * Math.max(0, Math.min(1, look.cornerRadius || 0));

// Does the photo need drawing on its own first (to round it, frame it or give it a shadow)?
export const isFramed = (look: LayerLook): boolean =>
  (look.cornerRadius || 0) > 0 || (look.borderWidth || 0) > 0 || (look.shadowSize || 0) > 0;

// A rounded rectangle path (roundRect where the browser has it).
export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  if (!radius) {
    ctx.rect(x, y, w, h);
    return;
  }
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
