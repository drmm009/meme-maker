// Transitions where one clip on the main sequence ends and the next begins. Clips sit end to end,
// so each transition is split across the cut: the outgoing clip animates out over the last half,
// the incoming clip animates in over the first half. Set on the incoming clip as
// item.transitionIn = { type: 'fade' | 'zoom' | 'slide', durationMs }. Shared by preview and export.
import type { ClipType, Transition, TransitionType } from '../model/videoProject';

// What transitions need to know about a clip.
export interface SequenceCandidate {
  id: string;
  type: ClipType;
  startMs: number;
  endMs: number;
  hidden?: boolean;
  isFreeze?: boolean;
  transitionIn?: Transition | null;
}
// One half of a transition on a clip: in over its first `half` ms, or out over its last.
interface Span {
  type: TransitionType;
  half: number;
  fromMs: number;
}

export const TRANSITIONS: { id: TransitionType | null; label: string }[] = [
  { id: null, label: 'None' },
  { id: 'fade', label: 'Fade' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'slide', label: 'Slide' },
];
export const DEFAULT_TRANSITION_MS = 500;
const ZOOM_PEAK = 1.15;
const STAGE_W = 800;

// Clips that can meet at a cut: videos, and freeze-frame stills sitting in the sequence.
const isSequenceClip = (i: SequenceCandidate) => i.type === 'video' || (i.type === 'image' && Boolean(i.isFreeze));

// The clip ending exactly where `item` starts (within 1ms), if any.
export const previousClip = <T extends SequenceCandidate>(items: T[], item: SequenceCandidate): T | null => (isSequenceClip(item)
  ? items.find((o) => o.id !== item.id && isSequenceClip(o) && !o.hidden && Math.abs(o.endMs - item.startMs) < 1) || null
  : null);

// The clip starting exactly where `item` ends.
export const nextClip = <T extends SequenceCandidate>(items: T[], item: SequenceCandidate): T | null => (isSequenceClip(item)
  ? items.find((o) => o.id !== item.id && isSequenceClip(o) && !o.hidden && Math.abs(o.startMs - item.endMs) < 1) || null
  : null);

const smooth = (p: number) => p * p * (3 - 2 * p);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// The in-half of the clip's own transition and the out-half of the next clip's, as
// { type, half (ms), fromMs } spans, or null.
const spans = (items: SequenceCandidate[], item: SequenceCandidate): { in: Span | null; out: Span | null } => {
  const incoming = item.transitionIn?.type && previousClip(items, item) ? item.transitionIn : null;
  const next = nextClip(items, item);
  const outgoing = next?.transitionIn?.type ? next.transitionIn : null;
  const half = (t: Transition) => (t.durationMs || DEFAULT_TRANSITION_MS) / 2;
  return {
    in: incoming?.type ? { type: incoming.type, half: half(incoming), fromMs: item.startMs } : null,
    out: outgoing?.type ? { type: outgoing.type, half: half(outgoing), fromMs: item.endMs - half(outgoing) } : null,
  };
};

// How a clip looks at timeline time tMs: { opacity, zoom, dx } (dx in 800-wide stage px).
export const transitionFrame = (items: SequenceCandidate[], item: SequenceCandidate, tMs: number): { opacity: number; zoom: number; dx: number } => {
  const frame = { opacity: 1, zoom: 1, dx: 0 };
  const { in: tin, out: tout } = spans(items, item);
  if (tin && tMs < tin.fromMs + tin.half) {
    const k = smooth(clamp01((tMs - tin.fromMs) / tin.half)); // 0 -> 1 as it arrives
    if (tin.type === 'fade') frame.opacity = k;
    if (tin.type === 'zoom') { frame.opacity = k; frame.zoom = ZOOM_PEAK - (ZOOM_PEAK - 1) * k; }
    if (tin.type === 'slide') frame.dx = STAGE_W * (1 - k);
  }
  if (tout && tMs > tout.fromMs) {
    const k = smooth(clamp01((tMs - tout.fromMs) / tout.half)); // 0 -> 1 as it leaves
    if (tout.type === 'fade') frame.opacity *= 1 - k;
    if (tout.type === 'zoom') { frame.opacity *= 1 - k; frame.zoom *= 1 + (ZOOM_PEAK - 1) * k; }
    if (tout.type === 'slide') frame.dx -= STAGE_W * k;
  }
  return frame;
};

// FFmpeg pieces reproducing transitionFrame for one clip's stream (t = timeline seconds):
// `chain` (leading comma: zoom by scale+crop, then fade via alpha) and `dx` (an overlay x offset
// expression in output px, or null).
export const transitionFilters = (items: SequenceCandidate[], item: SequenceCandidate, w: number, h: number, ratio: number): { chain: string; dx: string | null } => {
  const { in: tin, out: tout } = spans(items, item);
  if (!tin && !tout) return { chain: '', dx: null };
  const sec = (ms: number) => (ms / 1000).toFixed(3);
  // smoothstep of (t - from) / half, clipped to 0..1
  const k = (s: Span) => `(st(0,clip((t-${sec(s.fromMs)})/${sec(s.half)},0,1))*0+ld(0)*ld(0)*(3-2*ld(0)))`;
  const parts: string[] = [];
  const zooms: string[] = [];
  const dxs: string[] = [];
  for (const [dir, s] of [['in', tin], ['out', tout]] as const) {
    if (!s) continue;
    if (s.type === 'fade' || s.type === 'zoom') {
      parts.push(`fade=t=${dir}:st=${sec(s.fromMs)}:d=${sec(s.half)}:alpha=1`);
    }
    if (s.type === 'zoom') {
      zooms.push(dir === 'in' ? `(${ZOOM_PEAK}-${(ZOOM_PEAK - 1).toFixed(2)}*${k(s)})` : `(1+${(ZOOM_PEAK - 1).toFixed(2)}*${k(s)})`);
    }
    if (s.type === 'slide') {
      const span = (STAGE_W * ratio).toFixed(1);
      dxs.push(dir === 'in' ? `${span}*(1-${k(s)})` : `-${span}*${k(s)}`);
    }
  }
  let chain = '';
  if (zooms.length) {
    const z = zooms.join('*');
    chain += `,scale=w='${w}*${z}':h='${h}*${z}':eval=frame,crop=${w}:${h}`;
  }
  if (parts.length) chain += `,format=yuva420p,${parts.join(',')}`;
  return { chain, dx: dxs.length ? dxs.join('+') : null };
};
