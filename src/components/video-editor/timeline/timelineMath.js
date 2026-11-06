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

// The timeline's sections, top to bottom, by clip type: each clip sits in its type's section.
export const TIMELINE_SECTIONS = [
  { id: 'video', label: 'Videos', add: 'Add video' },
  { id: 'image', label: 'Photos', add: 'Add photo' },
  { id: 'text', label: 'Text', add: 'Add text' },
  { id: 'sticker', label: 'Stickers', add: 'Add sticker' },
  { id: 'audio', label: 'Sounds', add: 'Add sound' },
];

// Clips packed into as few lines as they fit: each goes on the first line it doesn't overlap,
// earliest first (so the order holds steady while nothing moves past another).
export const packLines = (clips) => {
  const lines = [];
  for (const clip of [...clips].sort((a, b) => a.startMs - b.startMs)) {
    const line = lines.find((l) => l[l.length - 1].endMs <= clip.startMs);
    if (line) line.push(clip);
    else lines.push([clip]);
  }
  return lines;
};

// Each section with its clips in lines (none when it's empty). Auto captions share a line of their
// own at the top of Text.
export const timelineSections = (items) => TIMELINE_SECTIONS.map((section) => {
  const clips = items.filter((i) => i.type === section.id);
  const captions = clips.filter((i) => i.autoCaption);
  const lines = packLines(clips.filter((i) => !i.autoCaption));
  return { ...section, lines: captions.length ? [captions, ...lines] : lines };
});
