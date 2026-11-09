import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type Konva from 'konva';
import { scaleTextLook, textBitmap, textImageAttrs } from '../../../utils/textBitmap';
import type { TextBitmap } from '../../../utils/textBitmap';
import type { TextClip } from '../../../model/videoProject';
import { pinchChange } from '../../canvas/interaction/layerPinch';
import type { TwoFingers } from '../../canvas/interaction/layerPinch';
import { holdSelection } from './selectionStyle';
import { centreOf, cornerForCentre, snapToCentre } from './textGestures';
import type { Size } from './textGestures';

type Look = Partial<TextClip>;
// Two fingers on the text: where they started and are, the text as it was, its centre, and the
// scale (of the start) its picture was last drawn sharp at.
interface Pinch { from: TwoFingers; at: TwoFingers; rotation: number; base: Look; centre: { x: number; y: number }; drawn: number }
type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number; rotation: number };
export interface Guides { vertical: number | null; horizontal: number | null }

interface Options {
  item: Look;
  isSelected: boolean;
  nodeRef: MutableRefObject<Konva.Image | null>;
  trRef: MutableRefObject<Konva.Transformer | null>;
  bitmapRef: MutableRefObject<TextBitmap | null>;
  scale: number;
  canvas?: Size;
  onChange: (next: Look) => void;
}

// How often a scaling gesture draws the text sharp at its new size.
const CRISP_MS = 120;

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
// Kept quick for phones: while a corner or pinch scales the text, the GPU scales the drawn picture
// (instant) and the text is drawn sharp again at most every CRISP_MS and on release (drawing text
// at a new size is slow: every size is measured afresh). Side handles rewrap at most once per
// screen frame. Redraws go straight onto the node (React doesn't render each move; `liveRef`
// holds what a render should show meanwhile), with the selection box laid out once per redraw.
// A pinch's change, kept from making the font smaller than scaleTextLook allows (else the
// GPU-scaled picture shrinks on and the sharp redraw pushes it back).
const pinchOf = (p: Pinch) => {
  const change = pinchChange(p.from, p.at, p.rotation);
  return { ...change, scale: Math.max(change.scale, 10 / (p.base.fontSize || 32)) };
};

export function useTextGestures({ item, isSelected, nodeRef, trRef, bitmapRef, scale, canvas, onChange }: Options) {
  // The look and place reached so far, before it is saved.
  const liveRef = useRef<Look | null>(null);
  const [guides, setGuides] = useState<Guides | null>(null);
  const itemRef = useRef(item);
  itemRef.current = item;
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  // One redraw per frame: the latest pending move wins.
  const pending = useRef<(() => void) | null>(null);
  const frame = useRef(0);
  const schedule = (run: () => void) => {
    pending.current = run;
    if (!frame.current) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const next = pending.current;
        pending.current = null;
        next?.();
      });
    }
  };
  const flush = () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    const next = pending.current;
    pending.current = null;
    next?.();
  };
  // When the text was last drawn sharp, and a redraw due once a scaling gesture pauses.
  const crispAt = useRef(0);
  const crispTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dueCrisp = () => performance.now() - crispAt.current >= CRISP_MS;
  const later = (run: () => void) => {
    if (crispTimer.current) clearTimeout(crispTimer.current);
    crispTimer.current = setTimeout(() => { crispTimer.current = null; schedule(run); }, CRISP_MS);
  };
  const cancelLater = () => {
    if (crispTimer.current) clearTimeout(crispTimer.current);
    crispTimer.current = null;
  };
  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    cancelLater();
  }, []);

  // Draws `patch` (over the item and what is live) straight onto the node.
  const apply = (patch: Look) => {
    const node = nodeRef.current;
    if (!node) return;
    const next = { ...liveRef.current, ...patch };
    const b = textBitmap({ ...itemRef.current, ...next }, scale);
    bitmapRef.current = b;
    liveRef.current = next;
    holdSelection(trRef.current, () => node.setAttrs({ ...textImageAttrs({ ...itemRef.current, ...next }, b), scaleX: 1, scaleY: 1 }));
    node.getLayer()?.batchDraw();
    crispAt.current = performance.now();
  };

  const commit = (patch: Look = {}) => {
    const next = { ...itemRef.current, ...liveRef.current, ...patch };
    liveRef.current = null;
    changeRef.current(next);
  };

  // Which handle is held: a side one sets the wrap width, a corner one scales the text. (Told by
  // the handle, not the scales: with the frame's padding a corner's scales can differ a little on
  // small text.)
  const sideHeld = useRef(false);
  const isSide = () => {
    const anchor = trRef.current?.getActiveAnchor() || '';
    if (anchor) sideHeld.current = anchor.startsWith('middle');
    return sideHeld.current;
  };

  // A handle move: the node's scale is the change since the last redraw (put back to 1 each time).
  const resize = () => {
    const node = nodeRef.current;
    if (!node) return;
    const sx = node.scaleX();
    const sy = node.scaleY();
    if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return; // turning only
    const place = { x: node.x(), y: node.y(), rotation: node.rotation() };
    const base = { ...itemRef.current, ...liveRef.current };
    if (isSide()) apply({ width: Math.max(40, (bitmapRef.current?.boxWidth || 0) * sx), ...place });
    else apply({ ...scaleTextLook(base, Math.sqrt(sx * sy)), ...place });
  };
  const onTransform = () => {
    const node = nodeRef.current;
    if (!node) return;
    // A side handle rewraps every frame; a corner leaves Konva's scaling showing until a sharp
    // redraw is due (and once it pauses).
    if (isSide() || dueCrisp()) schedule(resize);
    else later(resize);
  };

  // The handles stop where the text can't go smaller (a 40-unit wrap, a 10-unit font, 20px on
  // screen), instead of the box going on shrinking and the redraw pushing it back each frame.
  const boundBoxFunc = (oldBox: Box, newBox: Box): Box => {
    const node = nodeRef.current;
    if (!node) return newBox;
    if (newBox.width <= 0 || newBox.height <= 0) return oldBox;
    if (newBox.width >= oldBox.width && newBox.height >= oldBox.height) return newBox;
    const shown = Math.abs(node.scaleX());
    if (isSide()) return newBox.width < 20 || node.width() * shown * (newBox.width / oldBox.width) < 40 ? oldBox : newBox;
    if (newBox.width < 20 || newBox.height < 12) return oldBox;
    const k = Math.sqrt((newBox.width / oldBox.width) * (newBox.height / oldBox.height));
    const font = { ...itemRef.current, ...liveRef.current }.fontSize || 32;
    return font * shown * k < 10 ? oldBox : newBox;
  };

  // The held handle can't be dragged past the handle across from it: a finger past it would turn
  // the box over (Konva then swaps which side is held) and grow it on the other side.
  const anchorDragBoundFunc = (_old: Point, pos: Point): Point => {
    const tr = trRef.current;
    const name = tr?.getActiveAnchor() || '';
    if (!tr || !name || name === 'rotater') return pos;
    const sx = name.includes('right') ? 1 : name.includes('left') ? -1 : 0;
    const sy = name.includes('bottom') ? 1 : name.includes('top') ? -1 : 0;
    const across = `${sy > 0 ? 'top' : sy < 0 ? 'bottom' : 'middle'}-${sx > 0 ? 'left' : sx < 0 ? 'right' : 'center'}`;
    const fixed = tr.findOne(`.${across}`)?.getAbsolutePosition();
    if (!fixed) return pos;
    const a = (tr.getAbsoluteRotation() * Math.PI) / 180;
    const min = tr.padding() * 2 + 20;
    let { x, y } = pos;
    const keep = (s: number, ux: number, uy: number) => {
      if (!s) return;
      const d = ((x - fixed.x) * ux + (y - fixed.y) * uy) * s;
      if (d < min) {
        x += (min - d) * s * ux;
        y += (min - d) * s * uy;
      }
    };
    keep(sx, Math.cos(a), Math.sin(a));
    keep(sy, -Math.sin(a), Math.cos(a));
    return { x, y };
  };

  const onTransformEnd = () => {
    cancelLater();
    flush();
    resize();
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

  // Two fingers, the first going down on the text. These are the page's own touch events on the
  // stage: Konva holds its move events back while a drag may be starting.
  useEffect(() => {
    const node = nodeRef.current;
    const stage = node?.getStage();
    if (!isSelected || !node || !stage) return undefined;
    const el = stage.container();
    let fingerOnText = false;
    let pinch: Pinch | null = null;
    const down = (e: TouchEvent) => {
      const t = e.touches;
      if (t.length === 1) {
        stage.setPointersPositions(e);
        const pos = stage.getPointerPosition();
        fingerOnText = Boolean(pos && stage.getIntersection(pos) === node);
        return;
      }
      if (t.length !== 2 || !fingerOnText) return;
      node.stopDrag();
      setGuides(null);
      const b = bitmapRef.current;
      if (!b) return;
      pinch = {
        from: fingers(t),
        at: fingers(t),
        rotation: node.rotation(),
        base: { ...itemRef.current, ...liveRef.current, x: node.x(), y: node.y() },
        centre: centreOf(node.x(), node.y(), b.boxWidth, b.boxHeight, node.rotation()),
        drawn: 1,
      };
    };
    // Sharp: the text drawn at the pinch's size, turned about its centre.
    const sharp = (p: Pinch) => {
      const change = pinchOf(p);
      const resized = scaleTextLook(p.base, change.scale);
      const b = textBitmap({ ...p.base, ...resized }, scale);
      apply({ ...resized, rotation: change.rotation, ...cornerForCentre(p.centre, b.boxWidth, b.boxHeight, change.rotation) });
      p.drawn = change.scale;
    };
    // Quick: the picture as last drawn, scaled and turned by the GPU.
    const quick = (p: Pinch) => {
      const b = bitmapRef.current;
      if (!b) return;
      const change = pinchOf(p);
      const k = change.scale / p.drawn;
      holdSelection(trRef.current, () => {
        node.scale({ x: k, y: k });
        node.rotation(change.rotation);
        node.position(cornerForCentre(p.centre, b.boxWidth * k, b.boxHeight * k, change.rotation));
      });
      node.getLayer()?.batchDraw();
    };
    const move = (e: TouchEvent) => {
      const t = e.touches;
      if (!pinch || t.length < 2) return;
      e.preventDefault();
      const p = pinch;
      p.at = fingers(t);
      if (dueCrisp()) {
        cancelLater();
        schedule(() => sharp(p));
      } else {
        schedule(() => quick(p));
        later(() => { if (pinch === p) sharp(p); });
      }
    };
    const up = (e: TouchEvent) => {
      const t = e.touches;
      if (t.length === 0) fingerOnText = false;
      if (pinch && t.length < 2) {
        const p = pinch;
        pinch = null;
        cancelLater();
        flush();
        sharp(p);
        commit();
      }
    };
    el.addEventListener('touchstart', down, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', up);
    el.addEventListener('touchcancel', up);
    return () => {
      el.removeEventListener('touchstart', down);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', up);
      el.removeEventListener('touchcancel', up);
    };
    // The handlers read the latest item and look through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected, scale]);

  return { liveRef, guides, handlers: { onTransform, onTransformEnd, onDragMove, onDragEnd }, boundBoxFunc, anchorDragBoundFunc };
}
