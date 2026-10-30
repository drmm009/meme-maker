import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import { IDENTITY_VIEW, isZoomed, panView, pinchOf, pinchView, wheelZoomFactor, zoomAt } from './viewZoom';
import type { CanvasView, Pinch, Pt, Size } from './viewZoom';
import type { PointerLike } from './geometry';

type Gesture =
  | { kind: 'pinch'; start: CanvasView; from: Pinch }
  | { kind: 'pan'; start: CanvasView; from: Pt };

// Where the wrapper sits unzoomed: its centre on screen and its size.
interface Frame {
  center: Pt;
  size: Size;
}

export interface CanvasViewControls {
  view: CanvasView;
  // Truthy while a pinch or pan is under way (the pointer listeners keep following it).
  gesture: RefObject<Gesture | null>;
  isZoomed: () => boolean;
  startPinch: (e: PointerLike) => void;
  startPan: (e: PointerLike) => void;
  // Each returns true when the event belonged to a view gesture (and was handled).
  moveGesture: (e: PointerLike) => boolean;
  endGesture: () => boolean;
  zoomByWheel: (e: WheelEvent) => void;
  panByWheel: (e: WheelEvent) => boolean;
  reset: () => void;
}

const clientPoint = (e: PointerLike): Pt | null => {
  const t = e.touches && e.touches.length > 0 ? e.touches[0] : null;
  if (t) return { x: t.clientX, y: t.clientY };
  return e.clientX !== undefined && e.clientY !== undefined ? { x: e.clientX, y: e.clientY } : null;
};

// The zoom and pan the element is drawn with (its CSS transform).
const onScreenView = (el: HTMLElement): CanvasView => {
  const transform = typeof getComputedStyle === 'function' ? getComputedStyle(el).transform : '';
  if (!transform || transform === 'none' || typeof DOMMatrix === 'undefined') return IDENTITY_VIEW;
  const m = new DOMMatrix(transform);
  return { zoom: m.a || 1, x: m.e, y: m.f };
};

// The editor's zoom and pan of the canvas (two fingers, ctrl + wheel or a trackpad pinch; one
// finger or the wheel pans while zoomed in). The maths is in viewZoom.ts.
export function useCanvasView(wrapperRef: RefObject<HTMLElement | null>): CanvasViewControls {
  const [view, setViewState] = useState<CanvasView>(IDENTITY_VIEW);
  const viewRef = useRef(view);
  const gesture = useRef<Gesture | null>(null);
  const frame = useRef<Frame | null>(null);

  const setView = (v: CanvasView) => {
    if (v === viewRef.current) return;
    viewRef.current = v;
    setViewState(v);
  };

  // The unzoomed frame, worked back from the wrapper's box and the transform it has on screen now
  // (which can lag viewRef: several wheel events can arrive before React renders).
  const measure = (): Frame | null => {
    const el = wrapperRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const shown = onScreenView(el);
    return {
      center: { x: r.left + r.width / 2 - shown.x, y: r.top + r.height / 2 - shown.y },
      size: { width: r.width / shown.zoom, height: r.height / shown.zoom },
    };
  };
  const local = (p: Pt, f: Frame): Pt => ({ x: p.x - f.center.x, y: p.y - f.center.y });

  const startPinch = (e: PointerLike) => {
    const f = measure();
    const p = pinchOf(e.touches);
    if (!f || !p) return;
    frame.current = f;
    gesture.current = { kind: 'pinch', start: viewRef.current, from: { mid: local(p.mid, f), dist: p.dist } };
  };

  const startPan = (e: PointerLike) => {
    const f = measure();
    const p = clientPoint(e);
    if (!f || !p) return;
    frame.current = f;
    gesture.current = { kind: 'pan', start: viewRef.current, from: p };
  };

  const moveGesture = (e: PointerLike): boolean => {
    const g = gesture.current;
    const f = frame.current;
    if (!g || !f) return false;
    if (g.kind === 'pinch') {
      const p = pinchOf(e.touches);
      if (p) setView(pinchView(g.start, g.from, { mid: local(p.mid, f), dist: p.dist }, f.size));
    } else {
      const p = clientPoint(e);
      if (p) setView(panView(g.start, p.x - g.from.x, p.y - g.from.y, f.size));
    }
    return true;
  };

  const endGesture = (): boolean => {
    if (!gesture.current) return false;
    gesture.current = null;
    return true;
  };

  const zoomByWheel = (e: WheelEvent) => {
    const f = measure();
    if (!f) return;
    e.preventDefault();
    const v = viewRef.current;
    setView(zoomAt(v, v.zoom * wheelZoomFactor(e.deltaY), local({ x: e.clientX, y: e.clientY }, f), f.size));
  };

  const panByWheel = (e: WheelEvent): boolean => {
    const f = measure();
    if (!f || !isZoomed(viewRef.current)) return false;
    e.preventDefault();
    setView(panView(viewRef.current, -e.deltaX, -e.deltaY, f.size));
    return true;
  };

  return {
    view,
    gesture,
    isZoomed: () => isZoomed(viewRef.current),
    startPinch,
    startPan,
    moveGesture,
    endGesture,
    zoomByWheel,
    panByWheel,
    reset: () => {
      gesture.current = null;
      setView(IDENTITY_VIEW);
    },
  };
}
