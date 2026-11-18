// Pure decisions behind the Konva preview (CanvasPreview and its parts). Positions and sizes are
// in the preview's 800-wide stage units. How text is drawn lives in utils/textLayer (shared with
// the export).
import type { Clip, LayoutSlot, Placed, TextClip } from '../../../model/videoProject';
import { clipOpacity } from '../../../model/videoProject';
import { cornerForCenter, rotatedCenter } from '../../../utils/rotation';

export const STAGE_WIDTH = 800;

// Green-screen frames are keyed at most this many pixels on the long side; Konva scales them up.
const KEY_MAX_SIDE = 640;
// Photos with a filter are processed once, so they keep more detail.
const STILL_FX_MAX_SIDE = 1280;

type PlacementPatch = Required<Pick<Placed, 'isPositioned' | 'x' | 'y' | 'width' | 'height'>> &
  Partial<Pick<Placed, 'scaleX' | 'scaleY'>> & { crop?: undefined };

export type PanelPlacement = 'fit' | 'cover' | 'stretch';

// A clip's place in a grid layout's panel (stage units), from its source's natural size: 'fit' the
// whole picture inside it, centred; 'cover' the panel exactly, the picture cropped (centred) to the
// panel's shape (clips aren't clipped to their panel, so the crop keeps it inside); 'stretch' the
// whole picture pulled to the panel's shape. Always unscaled (scale 1), so width and height are its size.
export function panelPlacement(natural: { w: number; h: number }, slot: LayoutSlot, mode: PanelPlacement) {
  const w = Math.max(1, natural.w);
  const h = Math.max(1, natural.h);
  const whole = { x: slot.x, y: slot.y, width: slot.width, height: slot.height, scaleX: 1, scaleY: 1, isPositioned: true };
  if (mode === 'stretch') return { ...whole, crop: null };
  if (mode === 'cover') {
    const slotAspect = slot.width / Math.max(1, slot.height);
    const aspect = w / h;
    const crop = aspect > slotAspect
      ? { x: (1 - slotAspect / aspect) / 2, y: 0, width: slotAspect / aspect, height: 1 }
      : { x: 0, y: (1 - aspect / slotAspect) / 2, width: 1, height: aspect / slotAspect };
    return { ...whole, crop };
  }
  const s = Math.min(slot.width / w, slot.height / h);
  const width = w * s;
  const height = h * s;
  return { ...whole, x: slot.x + (slot.width - width) / 2, y: slot.y + (slot.height - height) / 2, width, height, crop: null };
}

// Which of those a clip in a panel is in now, if any (it may have been moved or sized by hand since).
export function currentPanelPlacement(item: Pick<Placed, 'x' | 'y' | 'width' | 'height' | 'scaleX' | 'scaleY' | 'crop'>, slot: LayoutSlot): PanelPlacement | null {
  const near = (a = 0, b = 0) => Math.abs(a - b) < 0.5;
  const w = (item.width || 0) * (item.scaleX || 1);
  const h = (item.height || 0) * (item.scaleY || 1);
  const cropped = Boolean(item.crop && (item.crop.width < 0.999 || item.crop.height < 0.999));
  const fillsPanel = near(item.x, slot.x) && near(item.y, slot.y) && near(w, slot.width) && near(h, slot.height);
  if (fillsPanel) return cropped ? 'cover' : 'stretch';
  const centred = near((item.x || 0) + w / 2, slot.x + slot.width / 2) && near((item.y || 0) + h / 2, slot.y + slot.height / 2);
  const touches = near(w, slot.width) || near(h, slot.height);
  return !cropped && centred && touches && w <= slot.width + 0.5 && h <= slot.height + 0.5 ? 'fit' : null;
}

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

// A photo, sticker or video's Konva.Image attributes, as the preview and the export draw it.
// A picture clip's Konva attributes. Its crop is in its source's pixels, so applyPunch sets it
// once the picture has loaded. A flip is a negative scale drawn back into the clip's own box (the
// offset), so its position, size and turn stay the same.
export const mediaAttrs = (item: Placed) => ({
  x: item.x || 0,
  y: item.y || 0,
  width: item.width || 200,
  height: item.height || 200,
  scaleX: (item.scaleX || 1) * (item.flipX ? -1 : 1),
  scaleY: (item.scaleY || 1) * (item.flipY ? -1 : 1),
  offsetX: item.flipX ? item.width || 200 : 0,
  offsetY: item.flipY ? item.height || 200 : 0,
  rotation: item.rotation || 0,
  opacity: clipOpacity(item),
});

// Turning a clip to `rotation` degrees about its centre. Konva turns clips about their corner
// (x, y), so the corner moves to keep the centre where it was.
export function rotateAboutCenter(item: Placed, rotation: number): { rotation: number; x: number; y: number } {
  const w = (item.width || 200) * (item.scaleX || 1);
  const h = (item.height || 200) * (item.scaleY || 1);
  const center = rotatedCenter(item.x || 0, item.y || 0, w, h, item.rotation || 0);
  return { rotation, ...cornerForCenter(center, w, h, rotation) };
}

// Resizing a clip to `stageWidth` wide on the stage, keeping its shape and its centre (as the
// image editor's sticker Size slider does).
export function resizeAboutCenter(item: Placed, stageWidth: number): { scaleX: number; scaleY: number; x: number; y: number } {
  const width = item.width || 200;
  const height = item.height || 200;
  const sx = item.scaleX || 1;
  const sy = item.scaleY || sx;
  const k = stageWidth / (width * sx);
  const rotation = item.rotation || 0;
  const center = rotatedCenter(item.x || 0, item.y || 0, width * sx, height * sy, rotation);
  return { scaleX: sx * k, scaleY: sy * k, ...cornerForCenter(center, width * sx * k, height * sy * k, rotation) };
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
