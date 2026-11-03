import { useEffect } from 'react';
import type { ReactNode } from 'react';
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

// A small sheet over the page, rising from the bottom: where a picture comes from.
export function PickerSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="ie-swap-sheet-backdrop" onClick={onClose}>
      <div className="ie-swap-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <span className="ie-swap-sheet-grip" aria-hidden="true" />
        <div className="ie-swap-sheet-head">
          <h2 className="ie-swap-sheet-title">{title}</h2>
          <button type="button" className="ie-swap-sheet-close" aria-label="Close" onClick={onClose}><X size={18} aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
