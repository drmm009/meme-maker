// Text clip animations shared by the live preview and the FFmpeg export.
// item.animation is 'pop', 'shake', 'typewriter' or empty. Times are ms from the clip's start.
import type Konva from 'konva';
import type { TextAnimation, TextClip } from '../model/videoProject';

// How animated text looks at a moment: scale and fade about its centre, a shake offset (stage
// units), and how many characters the typewriter shows (Infinity = all).
export interface TextFrame {
  scale: number;
  opacity: number;
  dx: number;
  dy: number;
  chars: number;
}
export type AnimatedText = Pick<TextClip, 'text' | 'fontSize' | 'animation' | 'startMs' | 'endMs'>;

export const TEXT_ANIMATIONS: { id: TextAnimation | null; label: string }[] = [
  { id: null, label: 'None' },
  { id: 'pop', label: 'Pop in' },
  { id: 'shake', label: 'Shake' },
  { id: 'typewriter', label: 'Typewriter' },
];

export const POP_MS = 350;
const POP_PEAK = 1.12;
const TYPE_CHAR_MS = 55;
// Shake is two sines (not random) so the export can reproduce it exactly with an FFmpeg expression.
const SHAKE = { fx: 9, fy: 13, phaseY: 1.3, yRatio: 0.6 };

export const REST_FRAME: Readonly<TextFrame> = Object.freeze({ scale: 1, opacity: 1, dx: 0, dy: 0, chars: Infinity });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;

// Characters the typewriter reveals: everything but line breaks.
export const typedLength = (item: Pick<TextClip, 'text'>): number => (item.text || '').replace(/\n/g, '').length;

// Time per character: 55ms, or quicker so typing finishes within 80% of a short clip.
export const typeCharMs = (item: Pick<TextClip, 'text' | 'startMs' | 'endMs'>): number => {
  const len = Math.max(1, typedLength(item));
  return Math.min(TYPE_CHAR_MS, (0.8 * Math.max(0, item.endMs - item.startMs)) / len);
};

export const shakeAmplitude = (item: Pick<TextClip, 'fontSize'>): number => Math.max(3, (item.fontSize || 32) * 0.06);

export const shakeOffset = (item: Pick<TextClip, 'fontSize'>, tMs: number): { dx: number; dy: number } => {
  const a = shakeAmplitude(item);
  const t = tMs / 1000;
  return {
    dx: a * Math.sin(2 * Math.PI * SHAKE.fx * t),
    dy: a * SHAKE.yRatio * Math.sin(2 * Math.PI * SHAKE.fy * t + SHAKE.phaseY),
  };
};

// Overshoot to 112% by 70% of the pop, then settle to 100%.
const popScale = (p: number) => (p < 0.7
  ? POP_PEAK * easeOutCubic(p / 0.7)
  : POP_PEAK - (POP_PEAK - 1) * easeOutCubic((p - 0.7) / 0.3));

// How the text looks `tMs` into its clip.
export const textAnimFrame = (item: AnimatedText, tMs: number): Readonly<TextFrame> => {
  const t = Math.max(0, tMs);
  switch (item.animation) {
    case 'pop': {
      const p = clamp01(t / POP_MS);
      return { ...REST_FRAME, scale: popScale(p), opacity: clamp01(p / 0.4) };
    }
    case 'shake':
      return { ...REST_FRAME, ...shakeOffset(item, t) };
    case 'typewriter': {
      const len = typedLength(item);
      const chars = Math.min(len, Math.floor(t / typeCharMs(item)) + 1);
      return { ...REST_FRAME, chars: chars >= len ? Infinity : chars };
    }
    default:
      return REST_FRAME;
  }
};

// How long the animation runs before the text rests (shake never rests).
export const animationLengthMs = (item: AnimatedText): number => {
  if (item.animation === 'pop') return POP_MS;
  if (item.animation === 'typewriter') return typeCharMs(item) * typedLength(item);
  if (item.animation === 'shake') return Infinity;
  return 0;
};

// The export renders a still per step: [{ fromMs, toMs, frame }] covering the clip.
// Pop steps at the video frame rate; typewriter steps per character (at most 80 steps);
// none and shake are one still (shake moves the still with shakeExpressions instead).
export const animationSteps = (item: AnimatedText, fps = 30): { fromMs: number; toMs: number; frame: Readonly<TextFrame> }[] => {
  const len = Math.max(0, item.endMs - item.startMs);
  const steps: { fromMs: number; toMs: number; frame: Readonly<TextFrame> }[] = [];
  if (item.animation === 'pop') {
    const step = 1000 / fps;
    for (let t = 0; t < Math.min(POP_MS, len); t += step) {
      steps.push({ fromMs: t, toMs: Math.min(t + step, len), frame: textAnimFrame(item, t) });
    }
  } else if (item.animation === 'typewriter') {
    const total = typedLength(item);
    const per = Math.max(1, Math.ceil(total / 80));
    const charMs = typeCharMs(item);
    for (let c = per; c < total; c += per) {
      const fromMs = (c - per) * charMs;
      if (fromMs >= len) break;
      steps.push({ fromMs, toMs: Math.min(c * charMs, len), frame: { ...REST_FRAME, chars: c } });
    }
  }
  const restFrom = steps.length ? steps[steps.length - 1].toMs : 0;
  if (restFrom < len) steps.push({ fromMs: restFrom, toMs: len, frame: REST_FRAME });
  return steps;
};

// FFmpeg overlay x/y expressions reproducing shakeOffset, in output pixels.
export const shakeExpressions = (item: Pick<TextClip, 'fontSize'>, startSec: number, ratio: number): { x: string; y: string } => {
  const a = shakeAmplitude(item) * ratio;
  const t = `(t-${startSec.toFixed(3)})`;
  return {
    x: `${a.toFixed(2)}*sin(2*PI*${SHAKE.fx}*${t})`,
    y: `${(a * SHAKE.yRatio).toFixed(2)}*sin(2*PI*${SHAKE.fy}*${t}+${SHAKE.phaseY})`,
  };
};

// Konva-side helpers (they take Konva nodes, so this module doesn't import Konva).

// Clip rectangles, in the text node's own coordinates, that reveal its first `chars` characters
// line by line while keeping the final layout (centred lines don't shift as they type).
export const revealRects = (textNode: Konva.Text, chars: number): { x: number; y: number; width: number; height: number }[] => {
  const lines = textNode.textArr || [];
  const lineH = textNode.fontSize() * textNode.lineHeight();
  const width = textNode.width();
  const align = textNode.align();
  const pad = textNode.padding();
  const margin = (textNode.strokeWidth() || 0) + 2;
  // Konva's own width measure when present (it includes letter spacing), else an equivalent.
  const internal = textNode as unknown as { _getTextWidth?: (s: string) => number };
  const measure = (s: string) => (typeof internal._getTextWidth === 'function'
    ? internal._getTextWidth(s)
    : textNode.measureSize(s).width + textNode.letterSpacing() * s.length);
  const rects: { x: number; y: number; width: number; height: number }[] = [];
  let left = chars;
  lines.forEach((line, i) => {
    if (left <= 0) return;
    const n = line.text.length;
    const x0 = align === 'center' ? (width - line.width) / 2 : align === 'right' ? width - line.width : 0;
    const shown = left >= n ? line.width : measure(line.text.slice(0, left));
    rects.push({ x: pad + x0 - margin, y: pad + i * lineH - margin, width: shown + margin * (left >= n ? 2 : 1), height: lineH + margin * 2 });
    left -= n;
  });
  return rects;
};

// Apply a frame to a group holding the text (and its background box): scale and fade about the
// text's centre, shake offset, and the typewriter clip.
export const applyTextFrame = (group: Konva.Group, textNode: Konva.Text, frame: Readonly<TextFrame>): void => {
  const w = textNode.width() * textNode.scaleX();
  const h = textNode.height() * textNode.scaleY();
  const px = textNode.x() + w / 2;
  const py = textNode.y() + h / 2;
  group.setAttrs({
    offsetX: px, offsetY: py,
    x: px + frame.dx, y: py + frame.dy,
    scaleX: frame.scale, scaleY: frame.scale,
    opacity: frame.opacity,
  });
  if (!Number.isFinite(frame.chars)) {
    group.clipFunc(null);
    return;
  }
  const chars = frame.chars;
  group.clipFunc((ctx) => {
    const rot = (textNode.rotation() * Math.PI) / 180;
    ctx.translate(textNode.x(), textNode.y());
    ctx.rotate(rot);
    for (const r of revealRects(textNode, chars)) ctx.rect(r.x, r.y, r.width, r.height);
    ctx.rotate(-rot);
    ctx.translate(-textNode.x(), -textNode.y());
  });
};
