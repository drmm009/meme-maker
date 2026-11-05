import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { CANVAS_SIZES } from '../canvasSizes';
import type { Aspect } from '../canvasSizes';

// An outline of a canvas shape, its longer side `max` px.
function Shape({ w, h, max }: { w: number; h: number; max: number }) {
  const k = max / Math.max(w, h);
  return <span className="ie-size-shape" style={{ width: Math.round(w * k), height: Math.round(h * k) }} aria-hidden="true" />;
}

// The top bar's canvas size, for a tall canvas (where the pill bar above it would take the meme's
// room): a button showing the shape, opening a menu of shapes; the picked one ticked in orange.
export default function SizeMenu() {
  const aspectRatio: Aspect = useMemeEditorStore((s: { aspectRatio: Aspect }) => s.aspectRatio) || 'original';
  const setAspectRatio = useMemeEditorStore((s: { setAspectRatio: (v: Aspect) => void }) => s.setAspectRatio);
  const pushHistoryDebounced = useMemeEditorStore((s: { pushHistoryDebounced: () => void }) => s.pushHistoryDebounced);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // A tap outside or Escape closes the menu.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = CANVAS_SIZES.find((s) => s.value === aspectRatio) || CANVAS_SIZES[0];
  return (
    <div className="ie-size-menu" ref={ref}>
      <button
        type="button"
        className="ie-size-menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Canvas size: ${current.name}`}
        title="Canvas size"
        onClick={() => setOpen((o) => !o)}
      >
        <Shape w={current.w} h={current.h} max={15} />
        <span>{current.label}</span>
        <ChevronDown size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
      {open && (
        <div className="ie-size-menu-list" role="menu" aria-label="Canvas size">
          {CANVAS_SIZES.map((s) => {
            const on = s.value === aspectRatio;
            return (
              <button
                key={s.value}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                title={s.title}
                className={`ie-size-menu-item${on ? ' is-on' : ''}`}
                onClick={() => {
                  setAspectRatio(s.value);
                  pushHistoryDebounced();
                  setOpen(false);
                }}
              >
                <span className="ie-size-menu-icon"><Shape w={s.w} h={s.h} max={16} /></span>
                <span className="ie-size-menu-name">{s.name}</span>
                <span className="ie-size-menu-sub">{s.sub}</span>
                {on && <Check className="ie-size-menu-check" size={14} strokeWidth={2.6} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
