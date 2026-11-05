// Photo motion: a photo slowly zooming (Ken Burns) or panning across while it is on screen. The
// preview and export renderer apply it as a zoom and sideways shift of the photo's source
// rectangle (clipCrop's sourceRect); the FFmpeg graph builds the same movement with expressions.
import type { PhotoMotion } from '../model/videoProject';

// How far in the motions zoom (the pans zoom this far so there is room to move).
export const MOTION_ZOOM = 1.25;

export const PHOTO_MOTIONS: { id: PhotoMotion | null; label: string }[] = [
  { id: null, label: 'None' },
  { id: 'zoom-in', label: 'Zoom in' },
  { id: 'zoom-out', label: 'Zoom out' },
  { id: 'pan-left', label: 'Pan left' },
  { id: 'pan-right', label: 'Pan right' },
];

type MovingPhoto = { motion?: PhotoMotion | null; startMs: number; endMs: number };

// The motion at timeline time tMs: the zoom and the sideways shift (-1 = the left edge of the
// photo in view, 1 = the right edge).
export const photoMotionFrame = (item: MovingPhoto, tMs: number): { zoom: number; panX: number } => {
  if (!item.motion) return { zoom: 1, panX: 0 };
  const span = Math.max(1, item.endMs - item.startMs);
  const p = Math.min(1, Math.max(0, (tMs - item.startMs) / span));
  switch (item.motion) {
    case 'zoom-in': return { zoom: 1 + (MOTION_ZOOM - 1) * p, panX: 0 };
    case 'zoom-out': return { zoom: MOTION_ZOOM - (MOTION_ZOOM - 1) * p, panX: 0 };
    case 'pan-left': return { zoom: MOTION_ZOOM, panX: 1 - 2 * p };
    case 'pan-right': return { zoom: MOTION_ZOOM, panX: -1 + 2 * p };
    default: return { zoom: 1, panX: 0 };
  }
};

// The FFmpeg filters (leading comma) moving a still that has been scaled to w x h and runs on the
// output's clock, shown from startSec to endSec. It works at twice the size, so the per-frame
// rounding of the zoom doesn't show as a wobble, then scales back to w x h.
export const motionFilter = (item: MovingPhoto, w: number, h: number, startSec: number, endSec: number): string => {
  if (!item.motion) return '';
  const span = Math.max(0.05, endSec - startSec);
  const p = `clip((t-${startSec.toFixed(3)})/${span.toFixed(3)},0,1)`;
  const k = (MOTION_ZOOM - 1).toFixed(3);
  const zoom = item.motion === 'zoom-in' ? `(1+${k}*${p})`
    : item.motion === 'zoom-out' ? `(${MOTION_ZOOM}-${k}*${p})`
    : `${MOTION_ZOOM}`;
  const pan = item.motion === 'pan-left' ? `(1-2*${p})` : item.motion === 'pan-right' ? `(2*${p}-1)` : '0';
  const W = w * 2;
  const H = h * 2;
  return `,scale=w='${W}*${zoom}':h='${H}*${zoom}':eval=frame,crop=${W}:${H}:x='(iw-${W})/2*(1+${pan})':y='(ih-${H})/2',scale=${w}:${h}`;
};
