import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet } from '../../ui';
import type { SheetAction } from '../../ui';

export interface PickerTab {
  id: string;
  label: string;
  Icon?: LucideIcon;
  // An emoji drawn instead of Icon.
  icon?: string;
}

interface MediaPickerSheetProps {
  title: string;
  onClose: () => void;
  tabs: PickerTab[];
  tab: string | null;
  onTab: (id: string) => void;
  // Few tabs share the width (like Censor's styles) instead of scrolling.
  fillTabs?: boolean;
  search?: { value: string; onChange: (v: string) => void; placeholder: string };
  // The grid's column count: 'emoji' | 'stickers' | 'gifs' | 'templates'.
  grid: string;
  busy?: boolean;
  // A plain text action at the top right (Bubble: Remove bubble).
  action?: SheetAction;
  footer?: ReactNode;
  children: ReactNode;
}

// The strip pickers (Media: Templates, Stickers, GIFs, Emoji; Text: Bubble), docked under the strip
// like the Draw sheet: no heading (the strip shows which is open), one scrolling line of category
// tiles, a search field, then a grid that scrolls on its own so the meme above stays in view.
export default function MediaPickerSheet({ title, onClose, tabs, tab, onTab, fillTabs, search, grid, busy, action, footer, children }: MediaPickerSheetProps) {
  return (
    <Sheet className="ie-draw-sheet ie-picker-sheet" title={title} hideTitle action={action} onClose={onClose}>
      <div className={`ie-shapes-row${fillTabs ? ' ie-shapes-row--fill' : ''}`} role="toolbar" aria-label={`${title} categories`}>
        {tabs.map((t) => {
          const active = tab === t.id;
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`ie-shape-btn${active ? ' is-on' : ''}`}
              aria-pressed={active}
              title={t.label}
              onClick={() => onTab(t.id)}
            >
              {Icon ? <Icon size={20} strokeWidth={1.8} /> : <span className="ie-picker-tab-emoji" aria-hidden="true">{t.icon}</span>}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
      {search && (
        <div className="ie-picker-search">
          <Search size={16} aria-hidden="true" />
          <input
            className="ui-field"
            type="search"
            aria-label={search.placeholder}
            placeholder={search.placeholder}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
          />
          {search.value && (
            <button type="button" className="ie-picker-clear" aria-label="Clear search" onClick={() => search.onChange('')}>
              <X size={14} strokeWidth={2.4} />
            </button>
          )}
        </div>
      )}
      <div className={`ie-picker-grid ie-picker-grid--${grid}`} aria-busy={busy || undefined}>
        {children}
      </div>
      {footer}
    </Sheet>
  );
}
