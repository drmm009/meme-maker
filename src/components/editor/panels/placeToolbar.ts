// What the canvas reports about the selected layer (render/paintLayers.reportActiveLayerBox):
// its centre, size and rotation in canvas pixels.
export interface LayerBox { x: number; y: number; w: number; h: number; rotation?: number }

type Rect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

const GAP = 12;
const EDGE = 8;

// Where the toolbar goes: centred above the layer, or below it when there's no room above,
// kept inside its container.
export function placeToolbar(box: LayerBox, canvasRect: Rect, canvasWidth: number, parentRect: Rect, size: { w: number; h: number }) {
  const scale = canvasRect.width / Math.max(1, canvasWidth);
  const rad = ((box.rotation || 0) * Math.PI) / 180;
  const halfH = (Math.abs((box.w / 2) * Math.sin(rad)) + Math.abs((box.h / 2) * Math.cos(rad))) * scale;
  const cx = canvasRect.left - parentRect.left + box.x * scale;
  const cy = canvasRect.top - parentRect.top + box.y * scale;
  let top = cy - halfH - GAP - size.h;
  if (top < EDGE) top = Math.min(cy + halfH + GAP, parentRect.height - size.h - EDGE);
  const left = Math.max(EDGE, Math.min(parentRect.width - size.w - EDGE, cx - size.w / 2));
  return { left: Math.round(left), top: Math.round(top) };
}
