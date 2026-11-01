import type { ChangeEvent, ComponentType, ReactNode } from 'react';

export interface StripItem {
  id: string;
  label: string;
  Icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  // Drawn instead of Icon (a colour swatch, say).
  icon?: ReactNode;
  title?: string;
  // On/off tools say themselves whether they are on; otherwise the strip's `active` id is.
  active?: boolean;
  // Makes the button a file picker (onSelect isn't called).
  accept?: string;
  onFile?: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

interface ToolStripProps {
  items: StripItem[];
  active?: string | null;
  // A tool that stays in use with its settings closed (Draw: the brush still draws on the meme),
  // marked apart from `active`.
  live?: string | null;
  onSelect: (id: string) => void;
  ariaLabel: string;
  // 'stacked' puts each label under its icon, so five tools fit across a phone.
  layout?: 'row' | 'stacked';
}

// A row of tool buttons above the dock, for the open dock section (Draw: Brush, Glow, Marker;
// Canvas: Color, Watermark, Mirror, Header, Footer).
export default function ToolStrip({ items, active = null, live = null, onSelect, ariaLabel, layout = 'row' }: ToolStripProps) {
  return (
    <div className={`ui-strip${layout === 'stacked' ? ' ui-strip--stacked' : ''}`} role="toolbar" aria-label={ariaLabel}>
      {items.map(({ id, label, Icon, icon, title, active: on, accept, onFile, className }) => {
        const isLive = !(on ?? active === id) && live === id;
        const pressed = (on ?? active === id) || isLive;
        const body = (
          <>
            {icon ?? (Icon ? <Icon size={layout === 'stacked' ? 19 : 17} strokeWidth={2.1} /> : null)}
            <span>{label}</span>
          </>
        );
        if (onFile) {
          return (
            <label key={id} className={`ui-strip-btn${className ? ` ${className}` : ''}`} title={title || label}>
              {body}
              <input
                type="file"
                accept={accept}
                aria-label={label}
                hidden
                onChange={(e) => {
                  onFile(e);
                  e.target.value = '';
                }}
              />
            </label>
          );
        }
        return (
          <button
            key={id}
            type="button"
            className={`ui-strip-btn${pressed && !isLive ? ' is-on' : ''}${isLive ? ' is-live' : ''}${className ? ` ${className}` : ''}`}
            aria-pressed={pressed}
            title={title || label}
            onClick={() => onSelect(id)}
          >
            {body}
            {isLive && <span className="ui-strip-live" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
