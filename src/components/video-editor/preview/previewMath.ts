// Pure decisions behind the Konva preview (CanvasPreview and its parts). Positions and sizes are
// in the preview's 800-wide stage units. How text is drawn lives in utils/textLayer (shared with
// the export).
import type { Clip, LayoutSlot, Placed, TextClip } from '../../../model/videoProject';
import { cornerForCenter, rotatedCenter } from '../../../utils/rotation';

export const STAGE_WIDTH = 800;

// Green-screen frames are keyed at most this many pixels on the long side; Konva scales them up.
const KEY_MAX_SIDE = 640;
// Photos with a filter are processed once, so they keep more detail.
const STILL_FX_MAX_SIDE = 1280;

type PlacementPatch = Required<Pick<Placed, 'isPositioned' | 'x' | 'y' | 'width' | 'height'>> &
  Partial<Pick<Placed, 'scaleX' | 'scaleY'>> & { crop?: undefined };

// Where newly loaded media goes (null once it has been placed): fitted inside its layout panel,
// or fitted and centred on the canvas. Stickers keep their natural size.
export function fitPlacement(
  item: Pick<Clip, 'type'> & Pick<Placed, 'isPositioned' | 'slotIndex'>,
  naturalWidth: number,
  naturalHeight: number,
  canvas: { width: number; height: number } | null | undefined,
  slots: LayoutSlot[] = []
): PlacementPatch | null {
  if (item.isPositioned || !canvas) return null;
  const slot = item.slotIndex !== undefined ? slots[item.slotIndex] : null;
  if (slot) {
    const scale = Math.min(slot.width / naturalWidth, slot.height / naturalHeight);
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    return {
      isPositioned: true,
      x: slot.x + (slot.width - width) / 2,
      y: slot.y + (slot.height - height) / 2,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      crop: undefined
    };
  }
  const scale = item.type === 'sticker' ? 1 : Math.min(canvas.width / naturalWidth, canvas.height / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return { isPositioned: true, x: (canvas.width - width) / 2, y: (canvas.height - height) / 2, width, height };
}

// The layout panel a photo or video was dropped on (by its centre), or undefined. Stickers float
// over the layout and never join a panel.
export function dropSlotIndex(
  item: Pick<Clip, 'type'> & Pick<Placed, 'width' | 'height' | 'scaleX' | 'scaleY'>,
  x: number,
  y: number,
  slots: LayoutSlot[] = []
): number | undefined {
  if (item.type === 'sticker' || slots.length === 0) return undefined;
  const cx = x + ((item.width ?? NaN) * (item.scaleX || 1)) / 2;
  const cy = y + ((item.height ?? NaN) * (item.scaleY || 1)) / 2;
  const index = slots.findIndex((s) => cx >= s.x && cx <= s.x + s.width && cy >= s.y && cy <= s.y + s.height);
  return index === -1 ? undefined : index;
}

// Turning a clip to `rotation` degrees about its centre. Konva turns clips about their corner
// (x, y), so the corner moves to keep the centre where it was.
export function rotateAboutCenter(item: Placed, rotation: number): { rotation: number; x: number; y: number } {
  const w = (item.width || 200) * (item.scaleX || 1);
  const h = (item.height || 200) * (item.scaleY || 1);
  const center = rotatedCenter(item.x || 0, item.y || 0, w, h, item.rotation || 0);
  return { rotation, ...cornerForCenter(center, w, h, rotation) };
}

// Is the clip on screen at this playhead (ms)? Both ends are inclusive.
export const isOnScreen = (item: Pick<Clip, 'hidden' | 'startMs' | 'endMs'>, playhead: number): boolean =>
  !item.hidden && playhead >= item.startMs && playhead <= item.endMs;

// The time (s) in a video's own footage that the preview should show at this playhead.
export const videoTimeSec = (item: { startMs: number; trimStartMs?: number; playbackRate?: number }, playhead: number): number =>
  (item.trimStartMs || 0) / 1000 + ((playhead - item.startMs) / 1000) * (item.playbackRate || 1);

export interface VideoSyncState {
  playing: boolean;
  visible: boolean;
  paused: boolean;
  pending: boolean;
  drift: number;
  frameCallbacks: boolean;
}

// What a preview <video> should do on a store update, as { seek, play, pause, redraw }:
// - playing: start it if it's paused (seeking first if it's off by more than 0.1s); if it's already
//   running, only re-seek when it has drifted over 1s, because seeking a playing video flushes the
//   decoder and stutters;
// - paused: pause it and follow the playhead to within 0.05s (a scrub);
// - off screen: just pause it.
// `pending`: a play() is still starting (seeking or pausing then would abort it).
// `frameCallbacks`: the browser redraws on each new frame (requestVideoFrameCallback); without it
// the preview redraws itself while playing and after a scrub's seek.
export function videoSyncPlan({ playing, visible, paused, pending, drift, frameCallbacks }: VideoSyncState): { seek: boolean; play: boolean; pause: boolean; redraw: boolean } {
  const plan = { seek: false, play: false, pause: false, redraw: false };
  if (!visible) {
    plan.pause = !paused && !pending;
  } else if (playing) {
    if (paused && !pending) {
      plan.play = true;
      plan.seek = drift > 0.1;
    } else {
      plan.seek = !pending && drift > 1.0;
    }
    plan.redraw = !frameCallbacks;
  } else {
    plan.pause = !paused && !pending;
    plan.seek = !pending && drift > 0.05;
    plan.redraw = plan.seek && !frameCallbacks;
  }
  return plan;
}

// Zoom-punch: the centred part of an iw x ih frame to show at this zoom, or null for the full frame.
export const punchCrop = (iw: number, ih: number, zoom: number): { x: number; y: number; width: number; height: number } | null => {
  if (zoom <= 1.0001) return null;
  const width = iw / zoom;
  const height = ih / zoom;
  return { x: (iw - width) / 2, y: (ih - height) / 2, width, height };
};

// Size of the offscreen canvas a green-screen or filtered frame is drawn into.
export const effectCanvasSize = (sourceWidth: number, sourceHeight: number, isVideo: boolean): { width: number; height: number } => {
  const scale = Math.min(1, (isVideo ? KEY_MAX_SIDE : STILL_FX_MAX_SIDE) / Math.max(sourceWidth, sourceHeight));
  return { width: Math.max(1, Math.round(sourceWidth * scale)), height: Math.max(1, Math.round(sourceHeight * scale)) };
};

// What a transformer resize of text saves: the scale goes into the font size (and wrap width),
// so the text stays crisp at scale 1.
export const textResize = (
  item: Pick<TextClip, 'fontSize' | 'width'>,
  { x, y, rotation, scaleX }: { x: number; y: number; rotation: number; scaleX: number }
): { x: number; y: number; rotation: number; fontSize: number; width?: number } => ({
  x,
  y,
  rotation,
  fontSize: Math.max(10, (item.fontSize || 32) * scaleX),
  ...(item.width ? { width: item.width * scaleX } : {})
});

// The stage size that fits the available space at this aspect ratio, and its scale from the
// 800-wide stage units.
export const fitStage = (availableWidth: number, availableHeight: number, aspect: number): { width: number; height: number; scale: number } => {
  let width = availableWidth;
  let height = availableWidth / aspect;
  if (height > availableHeight) {
    height = availableHeight;
    width = height * aspect;
  }
  return { width, height, scale: width / STAGE_WIDTH };
};
