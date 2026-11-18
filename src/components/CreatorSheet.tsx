// The dock's Creator button opens this sheet: what to make, Video meme or Image meme, as two large
// tiles. Picking one opens Choose Canvas Layout on that kind (App's openCanvas). In the pages' iOS
// look (pages/iosLook.css, creatorSheet.css): from the bottom on a phone, centred on a wide screen;
// Escape, a tap outside or dragging the grabber down closes it.
import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Clapperboard, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ModalPortal from './ModalPortal';
import './pages/iosLook.css';
import './creatorSheet.css';

export type CanvasKind = 'image' | 'video';

const CHOICES: { kind: CanvasKind; label: string; about: string; Icon: LucideIcon }[] = [
  { kind: 'video', label: 'Video meme', about: 'Captions on a clip', Icon: Clapperboard },
  { kind: 'image', label: 'Image meme', about: 'Panels for your photos', Icon: LayoutGrid },
];

// How far the grabber must be dragged down to close the sheet.
const CLOSE_DRAG = 60;

export default function CreatorSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (kind: CanvasKind) => void }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  // The latest onClose, so a parent's new function each render doesn't re-run the effect below.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // On opening: focus the first choice, and close on Escape.
  useEffect(() => {
    if (!open) return undefined;
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  // Drag the grabber down: the sheet follows, and past CLOSE_DRAG it closes.
  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const startY = e.clientY;
    let dy = 0;
    sheet.style.transition = 'none';
    const move = (ev: PointerEvent) => {
      dy = Math.max(0, ev.clientY - startY);
      sheet.style.transform = `translateY(${dy}px)`;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      sheet.style.transition = '';
      if (dy > CLOSE_DRAG) onClose();
      else sheet.style.transform = '';
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  return (
    <ModalPortal>
      <div className="ios ios-layer cs-backdrop" onClick={onClose} role="presentation">
        <div
          ref={sheetRef}
          className="cs-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cs-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cs-handle" onPointerDown={startDrag} aria-hidden="true">
            <span className="cs-grabber" />
          </div>
          <h2 className="cs-title" id="cs-title">What are you making?</h2>
          <div className="cs-choices">
            {CHOICES.map(({ kind, label, about, Icon }, i) => (
              <button
                key={kind}
                ref={i === 0 ? firstRef : undefined}
                type="button"
                className={`cs-choice cs-choice--${kind}`}
                onClick={() => onPick(kind)}
              >
                <span className="cs-choice-icon" aria-hidden="true">
                  <Icon strokeWidth={2.1} />
                </span>
                <span className="cs-choice-label">{label}</span>
                <span className="cs-choice-about">{about}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
