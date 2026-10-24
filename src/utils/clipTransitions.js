// Transitions where one clip on the main sequence ends and the next begins. Clips sit end to end,
// so each transition is split across the cut: the outgoing clip animates out over the last half,
// the incoming clip animates in over the first half. Set on the incoming clip as
// item.transitionIn = { type: 'fade' | 'zoom' | 'slide', durationMs }. Shared by preview and export.

export const TRANSITIONS = [
  { id: null, label: 'None' },
  { id: 'fade', label: 'Fade' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'slide', label: 'Slide' },
];
export const DEFAULT_TRANSITION_MS = 500;
const ZOOM_PEAK = 1.15;
const STAGE_W = 800;

// Clips that can meet at a cut: videos, and freeze-frame stills sitting in the sequence.
const isSequenceClip = (i) => i.type === 'video' || (i.type === 'image' && i.isFreeze);

// The clip ending exactly where `item` starts (within 1ms), if any.
export const previousClip = (items, item) => (isSequenceClip(item)
  ? items.find((o) => o.id !== item.id && isSequenceClip(o) && !o.hidden && Math.abs(o.endMs - item.startMs) < 1) || null
  : null);

// The clip starting exactly where `item` ends.
export const nextClip = (items, item) => (isSequenceClip(item)
  ? items.find((o) => o.id !== item.id && isSequenceClip(o) && !o.hidden && Math.abs(o.startMs - item.endMs) < 1) || null
  : null);

const smooth = (p) => p * p * (3 - 2 * p);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// The in-half of the clip's own transition and the out-half of the next clip's, as
// { type, half (ms), fromMs } spans, or null.
const spans = (items, item) => {
  const incoming = item.transitionIn?.type && previousClip(items, item) ? item.transitionIn : null;
  const next = nextClip(items, item);
  const outgoing = next?.transitionIn?.type ? next.transitionIn : null;
  const half = (t) => (t.durationMs || DEFAULT_TRANSITION_MS) / 2;
  return {
    in: incoming && { type: incoming.type, half: half(incoming), fromMs: item.startMs },
    out: outgoing && { type: outgoing.type, half: half(outgoing), fromMs: item.endMs - half(outgoing) },
  };
};

// How a clip looks at timeline time tMs: { opacity, zoom, dx } (dx in 800-wide stage px).
export const transitionFrame = (items, item, tMs) => {
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
export const transitionFilters = (items, item, w, h, ratio) => {
  const { in: tin, out: tout } = spans(items, item);
  if (!tin && !tout) return { chain: '', dx: null };
  const sec = (ms) => (ms / 1000).toFixed(3);
  // smoothstep of (t - from) / half, clipped to 0..1
  const k = (s) => `(st(0,clip((t-${sec(s.fromMs)})/${sec(s.half)},0,1))*0+ld(0)*ld(0)*(3-2*ld(0)))`;
  const parts = [];
  const zooms = [];
  const dxs = [];
  for (const [dir, s] of [['in', tin], ['out', tout]]) {
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
