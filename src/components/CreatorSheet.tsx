// The dock's Creator button opens this sheet: "Create a meme" with a round close button, then the
// two main makers as photo cards side by side, each a well-known meme of its kind (public/images)
// with a frosted icon badge, its name and a short line on a dark fade (the video one also has a
// VIDEO · 0:12 pill with moving sound bars); they open Choose Canvas Layout on that kind (App's
// openCanvas, `onPick`). Under them the AI meme maker as a quiet grouped row (its icon on a dark
// tile, a NEW tag, a chevron), then More tools as three cards in a row, everything inside each: a
// dark rounded tile with a glow of the maker's colour from its corner, the maker's icon in that
// colour at the top, the name and a short line at the foot: Stickers, GIF maker and Face swap. Those open their makers (`onMaker`). The sheet itself is frosted glass. Each maker in its colour, as on Home's maker cards. In
// the pages' iOS look (pages/iosLook.css, creatorSheet.css): from the bottom on a phone, centred on
// a wide screen; the close button, Escape, a tap outside or dragging the grabber down closes it.
import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ChevronRight, Clapperboard, Image as ImageIcon, ScanFace, Scissors, Wand2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ModalPortal from './ModalPortal';
import './pages/iosLook.css';
import './creatorSheet.css';

export type CanvasKind = 'image' | 'video';
export type CreatorMaker = 'ai' | 'stickers' | 'faceswap' | 'gif';

const MAIN: { kind: CanvasKind; label: string; about: string; Icon: LucideIcon; picture: string }[] = [
  { kind: 'image', label: 'Image', about: 'Templates & photos', Icon: ImageIcon, picture: './images/creator-batman-slap.jpg' },
  { kind: 'video', label: 'Video', about: 'Clips & sound', Icon: Clapperboard, picture: './images/creator-drake.jpg' },
];

// The More tools tiles. GIF maker's glyph is the word GIF in a rounded box (GifGlyph).
const TOOLS: { maker: CreatorMaker; label: string; about: string; Icon: LucideIcon | null }[] = [
  { maker: 'stickers', label: 'Stickers', about: 'Cut out a photo', Icon: Scissors },
  { maker: 'gif', label: 'GIF maker', about: 'From a clip', Icon: null },
  { maker: 'faceswap', label: 'Face swap', about: 'Swap a face', Icon: ScanFace },
];

const GifGlyph = () => <span className="cs-gif-glyph">GIF</span>;

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
          <div className="cs-head">
            <h2 className="cs-title" id="cs-title">Create a meme</h2>
            <button type="button" className="cs-close" onClick={onClose} aria-label="Close">
              <X strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>

          <div className="cs-main">
            {MAIN.map(({ kind, label, about, Icon, picture }, i) => (
              <button
                key={kind}
                ref={i === 0 ? firstRef : undefined}
                type="button"
                className={`cs-card cs-card--${kind} cs-tone--${kind}`}
                onClick={() => onPick(kind)}
              >
                <img className="cs-card-picture" src={picture} alt="" draggable={false} decoding="async" />
                <span className="cs-card-badge" aria-hidden="true"><Icon strokeWidth={2.2} /></span>
                {kind === 'video' && (
                  <span className="cs-card-pill" aria-hidden="true">
                    <span className="cs-bars"><i /><i /><i /></span>
                    VIDEO · 0:12
                  </span>
                )}
                <span className="cs-card-text">
                  <span className="cs-card-label">{label}</span>
                  <span className="cs-card-about">{about}</span>
                </span>
              </button>
            ))}
          </div>

          <button type="button" className="cs-ai cs-tone--ai" onClick={() => onMaker?.('ai')}>
            <span className="cs-ai-icon" aria-hidden="true"><Wand2 strokeWidth={2.1} /></span>
            <span className="cs-ai-text">
              <span className="cs-ai-title">
                AI meme
                <span className="cs-ai-new">New</span>
              </span>
              <span className="cs-ai-about">Type an idea, get four captions</span>
            </span>
            <span className="cs-ai-go" aria-hidden="true"><ChevronRight strokeWidth={2.4} /></span>
          </button>

          <h3 className="cs-section" id="cs-tools">More tools</h3>
          <div className="cs-tools" role="group" aria-labelledby="cs-tools">
            {TOOLS.map(({ maker, label, about, Icon }) => (
              <button key={maker} type="button" className={`cs-tool cs-tone--${maker}`} onClick={() => onMaker?.(maker)}>
                <span className="cs-tool-icon" aria-hidden="true">{Icon ? <Icon strokeWidth={2.1} /> : <GifGlyph />}</span>
                <span className="cs-tool-text">
                  <span className="cs-tool-label">{label}</span>
                  <span className="cs-tool-about">{about}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
