import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowLeft, ChevronRight, Search, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet } from '../../ui';
import './browseSheet.css';

export interface BrowseChip {
  id: string;
  label: string;
  Icon?: LucideIcon;
  // An emoji drawn instead of Icon.
  icon?: string;
  count?: number;
  // The icon's colour while the chip is off.
  color?: string;
}

interface BrowseSheetProps {
  title: string;
  total?: number;
  onClose: () => void;
  search?: { value: string; onChange: (v: string) => void; placeholder: string; label: string };
  chips: BrowseChip[];
  active: string | null;
  onChip: (id: string) => void;
  // Few chips share the width (GIFs: Stickers / GIFs) instead of scrolling.
  fillChips?: boolean;
  busy?: boolean;
  children: ReactNode;
}

// The full-height library sheets (Media: Templates, Stickers, GIFs, Emoji): over the meme, which
// needn't show while choosing, with a title and close, a search and category chips pinned at the
// top, and only the content below them scrolling.
export default function BrowseSheet({ title, total, onClose, search, chips, active, onChip, fillChips, busy, children }: BrowseSheetProps) {
  const chipsRef = useRef<HTMLDivElement>(null);
  // Keep the lit chip in sight as the list scrolls past sections whose chips sit off the edge.
  useEffect(() => {
    const row = chipsRef.current;
    const chip = row?.querySelector<HTMLElement>('.ie-browse-chip.is-on');
    if (!row || !chip) return;
    const left = chip.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + chip.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo?.({ left: left - 16, behavior: 'smooth' });
    }
  }, [active]);

  return (
    <Sheet className="ie-browse-sheet" title={title} hideTitle onClose={onClose}>
      <header className="ie-browse-head">
        <h2 className="ie-browse-title">{title}{total != null && <span className="ie-browse-total">{total}</span>}</h2>
        <button type="button" className="ie-browse-close" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}>
          <X size={18} strokeWidth={2.2} />
        </button>
      </header>

      {search && (
        <div className="ie-browse-search">
          <Search size={18} aria-hidden="true" />
          <input type="search" aria-label={search.label} placeholder={search.placeholder} value={search.value} onChange={(e) => search.onChange(e.target.value)} />
          {search.value && (
            <button type="button" className="ie-browse-clear" aria-label="Clear search" onClick={() => search.onChange('')}>
              <X size={14} strokeWidth={2.6} />
            </button>
          )}
        </div>
      )}

      <div ref={chipsRef} className={`ie-browse-chips${fillChips ? ' ie-browse-chips--fill' : ''}`} role="toolbar" aria-label={`${title} categories`}>
        {chips.map(({ id, label, Icon, icon, count, color }) => {
          const on = active === id;
          return (
            <button key={id} type="button" className={`ie-browse-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onChip(id)}>
              {Icon ? <Icon size={15} strokeWidth={2} aria-hidden="true" style={color && !on ? { color } : undefined} /> : icon ? <span className="ie-browse-chip-emoji" aria-hidden="true">{icon}</span> : null}
              <span>{label}</span>
              {count != null && <span className="ie-browse-chip-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="ie-browse-scroll" aria-busy={busy || undefined}>
        {children}
      </div>
    </Sheet>
  );
}

// A picture that shows a soft sheen until it arrives, then fades in.
export function Thumb({ src, alt = '', className = '', style }: { src?: string; alt?: string; className?: string; style?: CSSProperties }) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  return (
    <span className={`ie-browse-thumb is-${state} ${className}`} style={style}>
      {state !== 'failed' && src && <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setState('ready')} onError={() => setState('failed')} />}
    </span>
  );
}

// The empty and error states: an icon, a line saying what happened, and what to do about it.
export function BrowseEmpty({ Icon, title, text, action }: { Icon: LucideIcon; title: string; text?: ReactNode; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="ie-browse-empty">
      <Icon size={28} strokeWidth={1.8} aria-hidden="true" />
      <p className="ie-browse-empty-title">{title}</p>
      {text && <p className="ie-browse-empty-text">{text}</p>}
      {action && <button type="button" className="ie-browse-empty-btn" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

// A category shelf, as on the Explore page: an icon badge, the title and See all over a rail of cards.
export function Shelf({ label, Icon, icon, color, onSeeAll, children }: { label: string; Icon?: LucideIcon; icon?: string; color?: string; onSeeAll?: () => void; children: ReactNode }) {
  return (
    <section className="ie-browse-section ie-shelf" aria-label={label}>
      <div className="ie-shelf-head">
        <span className="ie-shelf-icon" aria-hidden="true">
          {Icon ? <Icon size={18} style={color ? { color } : undefined} /> : <span className="ie-browse-chip-emoji">{icon}</span>}
        </span>
        <h3 className="ie-shelf-title">{label}</h3>
        {onSeeAll && (
          <button type="button" className="ie-shelf-see-all" aria-label={`See all ${label.toLowerCase()}`} onClick={onSeeAll}>
            See all <ChevronRight size={14} strokeWidth={2.4} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="ie-shelf-rail">{children}</div>
    </section>
  );
}

// Over one category or a search: the way back to every shelf, and what's showing.
export function ResultsHead({ backLabel, summary, onBack }: { backLabel: string; summary: string; onBack: () => void }) {
  return (
    <div className="ie-results-head">
      <button type="button" className="ie-results-back" onClick={onBack}>
        <ArrowLeft size={15} strokeWidth={2.4} aria-hidden="true" /> {backLabel}
      </button>
      <span className="ie-results-count">{summary}</span>
    </div>
  );
}
