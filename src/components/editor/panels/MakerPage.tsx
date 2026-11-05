import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './faceSwap.css';

// Pieces of a maker's full-screen page (Face Swap's FaceSwapStudio, Stickers' StickerStudio), in
// the look of faceSwap.css.

// An empty input card: its step (when there are several), what goes in it and a Choose pill (the
// whole card is the button).
export function EmptyTile({ step, Icon, title, hint }: { step?: number; Icon: LucideIcon; title: string; hint: string }) {
  return (
    <span className="ie-swap-empty">
      {step !== undefined && <span className="ie-swap-step" aria-hidden="true">{step}</span>}
      <span className="ie-swap-empty-icon" aria-hidden="true"><Icon size={26} strokeWidth={1.9} /></span>
      <span className="ie-swap-empty-title">{title}</span>
      <span className="ie-swap-empty-hint">{hint}</span>
      <span className="ie-swap-empty-cta" aria-hidden="true">Choose</span>
    </span>
  );
}

const CLOSE_DRAG_PX = 70;
const CLOSE_MS = 300;
const isTest = typeof navigator !== 'undefined' && (navigator.userAgent.includes('jsdom') || navigator.userAgent.includes('Node.js'));

// A small sheet over the page, rising from the bottom: where a picture comes from. Glass over the
// dimmed page; a drag down on its grip or title row moves it with the finger and, past 70px, closes
// it. However it closes (the X, a tap outside, Escape or a drag) it slides down from where it is
// while the dim fades, and only then goes.
export function PickerSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  const closing = useRef(false);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = sheetRef.current;
    if (!el || isTest || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    el.style.transition = `transform ${CLOSE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`;
    el.style.transform = 'translateY(100%)';
    backdropRef.current?.classList.add('is-closing');
    window.setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const onPointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    if (closing.current || !target.closest('.ie-swap-sheet-grip, .ie-swap-sheet-head') || target.closest('button')) return;
    drag.current = { y: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current || !sheetRef.current || closing.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    sheetRef.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    const el = sheetRef.current;
    if (!d || !el || closing.current) return;
    if (d.dy > CLOSE_DRAG_PX) {
      close();
    } else {
      // Not far enough: spring back.
      el.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = '';
    }
  };

  return (
    <div ref={backdropRef} className="ie-swap-sheet-backdrop" onClick={close}>
      <div
        ref={sheetRef}
        className="ie-swap-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="ie-swap-sheet-grip" aria-hidden="true" />
        <div className="ie-swap-sheet-head">
          <h2 className="ie-swap-sheet-title">{title}</h2>
          <button type="button" className="ie-swap-sheet-close" aria-label="Close" onClick={close}><X size={18} aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
