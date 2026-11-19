// The dock's Creator button opens this sheet: what to make. The two main makers first, Image meme
// and Video meme, as two photo cards side by side (a well-known meme of that kind filling the card,
// the video one with a play button and a time; the name inside on a white pill, after the maker's
// icon on a round tile of its colour), which open Choose Canvas Layout on that kind (App's openCanvas, `onPick`); then
// More tools, AI meme, Stickers, GIF maker and Face swap, as a row of round icons over their names,
// like an iOS share sheet's apps, which open their makers (`onMaker`). Colours as on Home's maker
// cards. In the pages' iOS look (pages/iosLook.css, creatorSheet.css): from the bottom on a phone,
// centred on a wide screen; Escape, a tap outside or dragging the grabber down closes it.
import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Clapperboard, Image as ImageIcon, ImagePlay, Play, ScanFace, Scissors, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ModalPortal from './ModalPortal';
import './pages/iosLook.css';
import './creatorSheet.css';

export type CanvasKind = 'image' | 'video';
export type CreatorMaker = 'ai' | 'stickers' | 'faceswap' | 'gif';

// Each main maker is a portrait poster of a well-known meme of its kind (public/images).
const MAIN: { kind: CanvasKind; label: string; Icon: LucideIcon; picture: string }[] = [
  { kind: 'image', label: 'Image meme', Icon: ImageIcon, picture: './images/creator-batman-slap.jpg' },
  { kind: 'video', label: 'Video meme', Icon: Clapperboard, picture: './images/creator-drake.jpg' },
];

const TOOLS: { maker: CreatorMaker; label: string; Icon: LucideIcon }[] = [
  { maker: 'ai', label: 'AI meme', Icon: Wand2 },
  { maker: 'stickers', label: 'Stickers', Icon: Scissors },
  { maker: 'gif', label: 'GIF maker', Icon: ImagePlay },
  { maker: 'faceswap', label: 'Face swap', Icon: ScanFace },
];

// How far the grabber must be dragged down to close the sheet.
const CLOSE_DRAG = 60;

export default function CreatorSheet({ open, onClose, onPick, onMaker }: {
  open: boolean;
  onClose: () => void;
  onPick: (kind: CanvasKind) => void;
  onMaker?: (maker: CreatorMaker) => void;
}) {
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
          <h2 className="cs-title" id="cs-title">Create</h2>
          <div className="cs-main">
            {MAIN.map(({ kind, label, Icon, picture }, i) => (
              <button
                key={kind}
                ref={i === 0 ? firstRef : undefined}
                type="button"
                className={`cs-card cs-card--${kind} cs-tone--${kind}`}
                onClick={() => onPick(kind)}
              >
                <span className="cs-card-frame">
                  <img className="cs-card-picture" src={picture} alt="" draggable={false} decoding="async" />
                  {kind === 'video' && (
                    <>
                      <span className="cs-card-play" aria-hidden="true"><Play strokeWidth={0} fill="currentColor" /></span>
                      <span className="cs-card-time" aria-hidden="true">0:12</span>
                    </>
                  )}
                  <span className="cs-card-label">
                    <span className="cs-card-badge" aria-hidden="true"><Icon strokeWidth={2.4} /></span>
                    {label}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <h3 className="cs-section" id="cs-tools">More tools</h3>
          <div className="cs-tools" role="group" aria-labelledby="cs-tools">
            {TOOLS.map(({ maker, label, Icon }) => (
              <button key={maker} type="button" className={`cs-tool cs-tone--${maker}`} onClick={() => onMaker?.(maker)}>
                <span className="cs-tool-icon" aria-hidden="true"><Icon strokeWidth={2} /></span>
                <span className="cs-tool-label">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
