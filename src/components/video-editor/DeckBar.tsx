import { useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

export interface DeckTool {
  id: string;
  label: string;
  onClick: () => void;
  Icon?: ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  // Drawn instead of Icon (a colour dot, say).
  icon?: ReactNode;
  title?: string;
  // On/off tools say whether they are on; the rest leave it out.
  active?: boolean;
  danger?: boolean;
}

interface DeckBarProps {
  items: DeckTool[];
  ariaLabel: string;
  // A Back button pinned at the start, apart from the tools (they scroll sideways past it).
  back?: { label: string; title?: string; onClick: () => void };
}

// The video editor's bottom toolbar: one flat, full-width row of icon-over-label buttons joined to
// the timeline above it. The same row shows the add tools or the selected clip's. When the buttons
// run past the edge, the row fades out there until it's scrolled to the end.
export default function DeckBar({ items, ariaLabel, back }: DeckBarProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;
    const check = () => setMore(row.scrollLeft + row.clientWidth < row.scrollWidth - 2);
    check();
    row.addEventListener('scroll', check, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    observer?.observe(row);
    return () => {
      row.removeEventListener('scroll', check);
      observer?.disconnect();
    };
  }, [items.length]);
  return (
    <div className="vt-deckbar" role="toolbar" aria-label={ariaLabel}>
      {back && (
        <button type="button" className="vt-deckbar-btn vt-deckbar-back" title={back.title || back.label} onClick={back.onClick}>
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
          <span>{back.label}</span>
        </button>
      )}
      <div className={`vt-deckbar-items${more ? ' has-more' : ''}`} ref={rowRef}>
        {items.map(({ id, label, onClick, Icon, icon, title, active, danger }) => (
          <button
            key={id}
            type="button"
            className={`vt-deckbar-btn${active ? ' is-on' : ''}${danger ? ' is-danger' : ''}`}
            title={title || label}
            aria-pressed={active}
            onClick={onClick}
          >
            {icon ?? (Icon ? <Icon size={22} strokeWidth={1.9} aria-hidden="true" /> : null)}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
