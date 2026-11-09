import { useEditorStore } from '../../store/useVideoEditorStore';

// The canvas taking a video's own shape: a video template, or the first video from a link, fills
// the canvas instead of sitting in the 4:3 default with bars around it.

// Common shapes a video is "really" in (a 1280x720 file is 16:9); anything else keeps its own.
const COMMON = [1, 4 / 3, 3 / 4, 9 / 16, 16 / 9, 4 / 5];
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 2.4;

// The canvas shape for a video of this size (width / height), or null if its size is unknown.
export const canvasAspectFor = (width?: number, height?: number): number | null => {
  if (!width || !height || !Number.isFinite(width / height)) return null;
  const aspect = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, width / height));
  return COMMON.find((c) => Math.abs(c - aspect) / c < 0.015) ?? aspect;
};

interface StoreLike {
  items: { type: string; width?: number; height?: number }[];
  layoutSlots?: unknown[];
  setCanvasAspectRatio: (ratio: number) => void;
}
const store = () => useEditorStore.getState() as unknown as StoreLike;

// Sets the canvas to the video's shape, unless the canvas is split into layout panels.
export function fitCanvasToVideo(width?: number, height?: number) {
  const aspect = canvasAspectFor(width, height);
  const s = store();
  if (aspect && !s.layoutSlots?.length) s.setCanvasAspectRatio(aspect);
}

// True while nothing is on the canvas yet that a new canvas shape would move (a video or photo).
export const canvasIsEmpty = () => !store().items.some((i) => i.type === 'video' || i.type === 'image');

// The first video's own shape, for the canvas size menu's Original choice (null without one).
export const originalAspect = (items: StoreLike['items']): number | null => {
  const first = items.find((i) => i.type === 'video' && i.width && i.height);
  return first ? canvasAspectFor(first.width, first.height) : null;
};

// A short name for a shape, like 4:5 or 2.35:1.
export const aspectLabel = (aspect: number): string => {
  for (let h = 1; h <= 20; h++) {
    const w = aspect * h;
    if (Math.abs(w - Math.round(w)) < 0.02 && Math.round(w) <= 40) return `${Math.round(w)}:${h}`;
  }
  return aspect >= 1 ? `${aspect.toFixed(2)}:1` : `1:${(1 / aspect).toFixed(2)}`;
};
