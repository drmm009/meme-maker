// Per-frame motion of a clip's Konva image node: zoom-punches and transitions. Each returns true
// if it changed the node (so the caller redraws the layer).
import { clipPunchTimes, punchZoom } from '../../../utils/zoomPunch';
import { transitionFrame } from '../../../utils/clipTransitions';
import { punchCrop } from './previewMath';

// Zoom-punch in the preview: crop into the middle of the source so the clip zooms inside its own
// frame (the export scales up and crops back the same way).
export const applyPunch = (node, zoom) => {
  const img = node.image();
  if (!img) return false;
  const crop = punchCrop(img.videoWidth || img.width, img.videoHeight || img.height, zoom);
  if (!crop) {
    if (!node.cropWidth()) return false;
    node.crop({ x: 0, y: 0, width: 0, height: 0 });
    return true;
  }
  node.crop(crop);
  return true;
};

// Zoom-punches and transitions at the store's playhead: the zooms multiply, the transition also
// fades and slides the clip sideways.
export const applyMotion = (node, item, state) => {
  const tr = transitionFrame(state.items, item, state.playhead);
  let changed = applyPunch(node, punchZoom(clipPunchTimes(item), state.playhead) * tr.zoom);
  if (Math.abs(node.opacity() - tr.opacity) > 0.001) { node.opacity(tr.opacity); changed = true; }
  const x = (item.x || 0) + tr.dx;
  if (Math.abs(node.x() - x) > 0.01 && (tr.dx !== 0 || node.getAttr('slid'))) {
    node.x(x);
    node.setAttr('slid', tr.dx !== 0);
    changed = true;
  }
  return changed;
};
