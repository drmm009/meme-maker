import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import './sizeMenu.css';

export interface SizeOption<T extends string> {
  value: T;
  // On the button: short (a ratio, or Original).
  label: string;
  // In the menu: where the shape fits (Instagram), and its ratio as sub.
  name: string;
  sub: string;
  title: string;
  // An outline of the shape, w x h in px.
  w: number;
  h: number;
}

// An outline of a canvas shape, its longer side `max` px.
function Shape({ w, h, max }: { w: number; h: number; max: number }) {
  const k = max / Math.max(w, h);
  return <span className="ui-size-shape" style={{ width: Math.round(w * k), height: Math.round(h * k) }} aria-hidden="true" />;
}

// A canvas size picker: a soft pill showing the shape and its ratio, opening a menu of shapes named
// by where they fit; the picked one ticked in orange. A tap outside or Escape closes it. The image
// editor's top bar (for a tall canvas) and the video editor's use it.
export default function SizeMenu<T extends string>({ sizes, value, onPick, align = 'end' }: {
  sizes: SizeOption<T>[];
  value: T | null;
  onPick: (value: T) => void;
  // Which edge of the button the menu lines up with.
  align?: 'end' | 'center';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const current = sizes.find((s) => s.value === value) || sizes[0];
  return (
    <div className="ui-size-menu" ref={ref}>
      <button
        type="button"
        className="ui-size-menu-btn"
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
        <div className={`ui-size-menu-list${align === 'center' ? ' ui-size-menu-list--center' : ''}`} role="menu" aria-label="Canvas size">
          {sizes.map((s) => {
            const on = s.value === current.value;
            return (
              <button
                key={s.value}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                title={s.title}
                className={`ui-size-menu-item${on ? ' is-on' : ''}`}
                onClick={() => {
                  onPick(s.value);
                  setOpen(false);
                }}
              >
                <span className="ui-size-menu-icon"><Shape w={s.w} h={s.h} max={16} /></span>
                <span className="ui-size-menu-name">{s.name}</span>
                <span className="ui-size-menu-sub">{s.sub}</span>
                {on && <Check className="ui-size-menu-check" size={14} strokeWidth={2.6} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
