import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type Konva from 'konva';
import { scaleTextLook, textBitmap, textImageAttrs } from '../../../utils/textBitmap';
import type { TextBitmap } from '../../../utils/textBitmap';
import type { TextClip } from '../../../model/videoProject';
import { pinchChange } from '../../canvas/interaction/layerPinch';
import type { TwoFingers } from '../../canvas/interaction/layerPinch';
import { centreOf, cornerForCentre, snapToCentre } from './textGestures';
import type { Size } from './textGestures';

type Look = Partial<TextClip>;
export interface Guides { vertical: number | null; horizontal: number | null }

interface Options {
  item: Look;
  isSelected: boolean;
  nodeRef: MutableRefObject<Konva.Image | null>;
  bitmapRef: MutableRefObject<TextBitmap>;
  scale: number;
  canvas?: Size;
  onChange: (next: Look) => void;
}

const fingers = (touches: TouchList): TwoFingers => ({
  a: { x: touches[0].clientX, y: touches[0].clientY },
  b: { x: touches[1].clientX, y: touches[1].clientY },
});

// The preview text's gestures, as the image editor's captions have them: the text is redrawn at
// its new size as a handle or pinch moves (never a stretched picture), and saved once on release.
// - Corner handles scale the font, outline, shadow and wrap; side handles set the wrap width.
// - Two fingers, the first on the selected text, scale and turn it about its centre (turning
//   snaps to quarter turns).
// - Dragging snaps the text's centre onto the canvas's centre lines, with guides.
export function useTextGestures({ item, isSelected, nodeRef, bitmapRef, scale, canvas, onChange }: Options) {
  // The look and place reached so far, before it is saved.
  const [live, setLive] = useState<Look | null>(null);
  const liveRef = useRef<Look | null>(null);
  const [guides, setGuides] = useState<Guides | null>(null);
  const itemRef = useRef(item);
  itemRef.current = item;
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  // Draws `patch` (over the item and what is live) straight onto the node, so the selection box
  // follows the finger this frame; React catches up with the same look.
  const apply = (patch: Look) => {
    const node = nodeRef.current;
    if (!node) return;
    const next = { ...liveRef.current, ...patch };
    const look = { ...itemRef.current, ...next };
    const b = textBitmap(look, scale);
    bitmapRef.current = b;
    node.setAttrs({ ...textImageAttrs(look, b), scaleX: 1, scaleY: 1 });
    liveRef.current = next;
    setLive(next);
  };

  const commit = (patch: Look = {}) => {
    const next = { ...itemRef.current, ...liveRef.current, ...patch };
    liveRef.current = null;
    setLive(null);
    changeRef.current(next);
  };

  const onTransform = () => {
    const node = nodeRef.current;
    if (!node) return;
    const sx = node.scaleX();
    const sy = node.scaleY();
    if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return; // turning only
    const place = { x: node.x(), y: node.y(), rotation: node.rotation() };
    const base = { ...itemRef.current, ...liveRef.current };
    // The node's scale is this move's change: it is put back to 1 every move.
    if (Math.abs(sx - sy) > 0.001) apply({ width: Math.max(40, bitmapRef.current.boxWidth * sx), ...place });
    else apply({ ...scaleTextLook(base, sx), ...place });
  };

  const onTransformEnd = () => {
    const node = nodeRef.current;
    if (!node) return;
    node.scaleX(1);
    node.scaleY(1);
    commit({ x: node.x(), y: node.y(), rotation: node.rotation() });
  };

  const onDragMove = () => {
    const node = nodeRef.current;
    const layer = node?.getLayer();
    if (!node || !layer || !canvas) return;
    const snap = snapToCentre(node.getClientRect({ relativeTo: layer, skipShadow: true }), canvas);
    if (snap.dx || snap.dy) node.position({ x: node.x() + snap.dx, y: node.y() + snap.dy });
    const shown = snap.vertical !== null || snap.horizontal !== null ? { vertical: snap.vertical, horizontal: snap.horizontal } : null;
    setGuides((g) => (g?.vertical === shown?.vertical && g?.horizontal === shown?.horizontal ? g : shown));
  };

  const onDragEnd = () => {
    const node = nodeRef.current;
    setGuides(null);
    if (node) changeRef.current({ ...itemRef.current, x: node.x(), y: node.y() });
  };

  // Two fingers: the first must go down on the text.
  const fingerOnText = useRef(false);
  const onTouchStart = () => { fingerOnText.current = true; };
  useEffect(() => {
    const node = nodeRef.current;
    const stage = node?.getStage();
    if (!isSelected || !node || !stage) return undefined;
    let pinch: { from: TwoFingers; rotation: number; base: Look; centre: { x: number; y: number } } | null = null;
    const down = (e: Konva.KonvaEventObject<TouchEvent>) => {
      const t = e.evt.touches;
      if (t.length !== 2 || !fingerOnText.current) return;
      node.stopDrag();
      setGuides(null);
      const b = bitmapRef.current;
      pinch = {
        from: fingers(t),
        rotation: node.rotation(),
        base: { ...itemRef.current, ...liveRef.current, x: node.x(), y: node.y() },
        centre: centreOf(node.x(), node.y(), b.boxWidth, b.boxHeight, node.rotation()),
      };
    };
    const move = (e: Konva.KonvaEventObject<TouchEvent>) => {
      const t = e.evt.touches;
      if (!pinch || t.length < 2) return;
      e.evt.preventDefault();
      const change = pinchChange(pinch.from, fingers(t), pinch.rotation);
      const resized = scaleTextLook(pinch.base, change.scale);
      const b = textBitmap({ ...pinch.base, ...resized }, scale);
      apply({ ...resized, rotation: change.rotation, ...cornerForCentre(pinch.centre, b.boxWidth, b.boxHeight, change.rotation) });
    };
    const up = (e: Konva.KonvaEventObject<TouchEvent>) => {
      const t = e.evt.touches;
      if (t.length === 0) fingerOnText.current = false;
      if (pinch && t.length < 2) {
        pinch = null;
        commit();
      }
    };
    stage.on('touchstart.vtpinch', down);
    stage.on('touchmove.vtpinch', move);
    stage.on('touchend.vtpinch touchcancel.vtpinch', up);
    return () => { stage.off('.vtpinch'); };
    // The handlers read the latest item and look through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected, scale]);

  return { live, guides, handlers: { onTransform, onTransformEnd, onDragMove, onDragEnd, onTouchStart } };
}
