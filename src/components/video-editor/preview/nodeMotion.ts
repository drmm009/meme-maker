// Per-frame motion of a clip's Konva image node: zoom-punches and transitions. Each returns true
// if it changed the node (so the caller redraws the layer).
import type Konva from 'konva';
import type { VideoClip } from '../../../model/videoProject';
import { clipOpacity } from '../../../model/videoProject';
import { clipPunchTimes, punchZoom } from '../../../utils/zoomPunch';
import { transitionFrame } from '../../../utils/clipTransitions';
import type { SequenceCandidate } from '../../../utils/clipTransitions';
import { FULL_CROP, clipCrop, sourceRect } from '../../../utils/clipCrop';
import type { ClipCrop } from '../../../model/videoProject';

// What applyMotion reads: a clip that may punch and transition, and the store's playhead.
type MovingClip = SequenceCandidate & Pick<VideoClip, 'x' | 'opacity' | 'crop' | 'punches' | 'playbackRate' | 'trimStartMs'>;
type FrameSource = { videoWidth?: number; videoHeight?: number; width?: number; height?: number };

// The clip's crop, and a zoom-punch into the middle of it so the clip zooms inside its own frame
// (the export crops, scales up and crops back the same way), as the node's source rectangle.
export const applyPunch = (node: Konva.Image, zoom: number, crop: ClipCrop = FULL_CROP): boolean => {
  const img = node.image() as FrameSource | undefined;
  if (!img) return false;
  const rect = sourceRect(img.videoWidth || img.width || 0, img.videoHeight || img.height || 0, crop, zoom);
  if (!rect) {
    if (!node.cropWidth()) return false;
    node.crop({ x: 0, y: 0, width: 0, height: 0 });
    return true;
  }
  const now = node.crop();
  if (now && Math.abs(now.x - rect.x) < 0.01 && Math.abs(now.y - rect.y) < 0.01
    && Math.abs(now.width - rect.width) < 0.01 && Math.abs(now.height - rect.height) < 0.01) return false;
  node.crop(rect);
  return true;
};

// Zoom-punches and transitions at the store's playhead: the zooms multiply, the transition also
// fades (on top of the clip's own opacity) and slides the clip sideways.
export const applyMotion = (node: Konva.Image, item: MovingClip, state: { items: SequenceCandidate[]; playhead: number }): boolean => {
  const tr = transitionFrame(state.items, item, state.playhead);
  let changed = applyPunch(node, punchZoom(clipPunchTimes(item), state.playhead) * tr.zoom, clipCrop(item));
  const opacity = tr.opacity * clipOpacity(item);
  if (Math.abs(node.opacity() - opacity) > 0.001) { node.opacity(opacity); changed = true; }
  const x = (item.x || 0) + tr.dx;
  if (Math.abs(node.x() - x) > 0.01 && (tr.dx !== 0 || node.getAttr('slid'))) {
    node.x(x);
    node.setAttr('slid', tr.dx !== 0);
    changed = true;
  }
  return changed;
};
