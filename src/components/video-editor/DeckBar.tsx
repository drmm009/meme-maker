import type { ComponentType, ReactNode } from 'react';
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
  // The sections row: a navigation landmark rather than a toolbar.
  nav?: boolean;
}

// The video editor's bottom toolbar: one flat, full-width row of icon-over-label buttons joined to
// the timeline above it. The same row shows the sections, a section's tools or the selected clip's.
export default function DeckBar({ items, ariaLabel, back, nav = false }: DeckBarProps) {
  const body = (
    <>
      {back && (
        <button type="button" className="vt-deckbar-btn vt-deckbar-back" title={back.title || back.label} onClick={back.onClick}>
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
          <span>{back.label}</span>
        </button>
      )}
      <div className="vt-deckbar-items">
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
    </>
  );
  return nav
    ? <nav className="vt-deckbar" aria-label={ariaLabel}>{body}</nav>
    : <div className="vt-deckbar" role="toolbar" aria-label={ariaLabel}>{body}</div>;
}
