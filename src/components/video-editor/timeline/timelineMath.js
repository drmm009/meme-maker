// Pure helpers for the scrolling timeline. Times are milliseconds; positions are CSS pixels.

export const DEFAULT_PX_PER_SEC = 110;
export const MIN_PX_PER_SEC = 30;
export const MAX_PX_PER_SEC = 400;

export const msToPx = (ms, pxPerSec) => (ms / 1000) * pxPerSec;
export const pxToMs = (px, pxPerSec) => (px / pxPerSec) * 1000;

export const clampZoom = (pxPerSec) => Math.min(MAX_PX_PER_SEC, Math.max(MIN_PX_PER_SEC, pxPerSec));

// 0:03 / 1:05 style clock for the transport row.
export const formatClock = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// End of the last clip, or the project duration when the timeline is empty.
export const getContentEnd = (items, fallback) => {
  const ends = items.map((i) => i.endMs).filter((t) => Number.isFinite(t) && t > 0);
  return ends.length ? Math.max(...ends) : fallback;
};

// Snap `ms` to the nearest point within `thresholdMs`; returns null when nothing is close.
export const findSnap = (ms, points, thresholdMs) => {
  let best = null;
  for (const p of points) {
    const d = Math.abs(ms - p);
    if (d <= thresholdMs && (best === null || d < Math.abs(ms - best))) best = p;
  }
  return best;
};

// Ruler marks: labelled ticks every `step` seconds and a dot halfway between, up to `durationMs`.
// The step grows as you zoom out so labels never collide (min ~70px apart).
export const getRulerMarks = (durationMs, pxPerSec) => {
  const steps = [1, 2, 5, 10, 15, 30, 60];
  const stepSec = steps.find((s) => s * pxPerSec >= 70) || 60;
  const marks = [];
  for (let s = 0; s * 1000 <= durationMs; s += stepSec) {
    marks.push({ ms: s * 1000, label: `${s}s`, major: true });
    const half = (s + stepSec / 2) * 1000;
    if (half <= durationMs) marks.push({ ms: half, label: null, major: false });
  }
  return marks;
};

// Overlays sit above the main video and audio sits underneath, like the canvas stacking order.
const TRACK_ORDER = { text: 0, sticker: 1, image: 2, video: 3, audio: 4 };
export const orderTracks = (items) =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (TRACK_ORDER[a.item.type] ?? 5) - (TRACK_ORDER[b.item.type] ?? 5) || a.index - b.index)
    .map(({ item }) => item);

// Timeline rows: one per clip, except auto captions, which share one row (where the first is).
export const timelineRows = (items) => {
  const rows = [];
  let captions = null;
  for (const item of orderTracks(items)) {
    if (!item.autoCaption) rows.push([item]);
    else if (captions) captions.push(item);
    else { captions = [item]; rows.push(captions); }
  }
  return rows;
};
