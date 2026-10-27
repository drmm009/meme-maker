// The mouse cursor over the canvas: a handle's own cursor, "move" over the selected layer,
// "pointer" over anything selectable, otherwise "default".
import { hitActiveHandle, hitBandCaption, hitLayerAt, isOnActiveBody } from './hitTest';

const HANDLE_CURSORS = {
  delete_layer: 'pointer',
  rotate_sticker: 'grab',
  rotate_caption: 'grab',
  rotate_imageLayer: 'grab',
  resize_sticker_br: 'nwse-resize',
  resize_caption_br: 'nwse-resize',
  resize_imageLayer_br: 'nwse-resize',
  resize_caption_l: 'ew-resize',
  resize_caption_r: 'ew-resize',
  resize_imageLayer_l: 'ew-resize',
  resize_imageLayer_r: 'ew-resize',
  resize_imageLayer_t: 'ns-resize',
  resize_imageLayer_b: 'ns-resize',
};

export function getHoverCursor(scene, coords, activeLayerId, bands) {
  const handle = hitActiveHandle(scene, coords, activeLayerId, { hover: true });
  if (handle) return HANDLE_CURSORS[handle.type] || 'pointer';
  if (isOnActiveBody(scene, coords, activeLayerId)) return 'move';
  if (bands.isHeaderEnabled && coords.y <= bands.headerExtH) return 'pointer';
  if (hitLayerAt(scene, coords) || hitBandCaption(scene.captions, coords, bands)) return 'pointer';
  return 'default';
}
